
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { compare } from "bcryptjs";
import { eq, sql } from "drizzle-orm";

import { getDb } from "@/db/db";
import { adminUsers, adminRoles } from "@/db/schema";

import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  getThrottleDelay,
  RATE_LIMIT_CONFIG,
} from "@/lib/rate-limit";

// =====================
// TYPES
// =====================

interface LoginRequestBody {
  email: string;
  password: string;
}

interface AuthenticatedAdmin {
  id: number;
  email: string;
  name: string;
  roleId: number | null;
  role: string;
}

// =====================
// HELPERS
// =====================

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function parseRequestBody(
  request: Request
): Promise<LoginRequestBody | null> {
  try {
    const body: unknown = await request.json();

    if (!isRecord(body)) {
      return null;
    }

    if (
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return null;
    }

    return {
      email: body.email,
      password: body.password,
    };
  } catch {
    return null;
  }
}

function getClientIP(request: NextRequest): string {
  const cfIP = request.headers.get("cf-connecting-ip");

  if (cfIP?.trim()) {
    return cfIP.trim();
  }

  const realIP = request.headers.get("x-real-ip");

  if (realIP?.trim()) {
    return realIP.trim();
  }

  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded?.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return "unknown";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMinutesLeft(
  seconds: number | null | undefined
): number {
  return Math.max(1, Math.ceil((seconds ?? 0) / 60));
}

// =====================
// RESPONSE HELPERS
// =====================

function noStoreHeaders(): HeadersInit {
  return {
    "Cache-Control": "no-store, must-revalidate",
  };
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
      headers: noStoreHeaders(),
    }
  );
}

function rateLimitResponse(
  message: string,
  retryAfterSeconds: number,
  extraData: Record<string, unknown> = {}
) {
  const retryAfter = Math.max(1, Math.ceil(retryAfterSeconds));

  return NextResponse.json(
    {
      success: false,
      error: message,
      retryAfter,
      ...extraData,
    },
    {
      status: 429,
      headers: {
        ...noStoreHeaders(),
        "Retry-After": retryAfter.toString(),
      },
    }
  );
}

// =====================
// RATE LIMIT HELPERS
// =====================

function recordLoginFailure(
  accountKey: string,
  ipKey: string
) {
  const accountResult = recordFailedAttempt(
    accountKey,
    RATE_LIMIT_CONFIG.ACCOUNT
  );

  const ipResult = recordFailedAttempt(
    ipKey,
    RATE_LIMIT_CONFIG.IP
  );

  return {
    accountResult,
    ipResult,
  };
}

function createLoginFailureResponse(
  accountResult: ReturnType<typeof recordFailedAttempt>,
  ipResult: ReturnType<typeof recordFailedAttempt>
) {
  let errorMessage = "Invalid credentials";

  if (!accountResult.allowed) {
    const minutesLeft = getMinutesLeft(
      accountResult.retryAfterSeconds
    );

    errorMessage = `Too many failed attempts. Account locked for ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`;
  } else if (
    accountResult.remaining <= 2 &&
    accountResult.remaining > 0
  ) {
    errorMessage = `Invalid credentials. ${accountResult.remaining} attempt${accountResult.remaining !== 1 ? "s" : ""} remaining before lockout.`;
  }

  if (!ipResult.allowed) {
    const minutesLeft = getMinutesLeft(
      ipResult.retryAfterSeconds
    );

    errorMessage = `Too many attempts from your network. Blocked for ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`;
  }

  const retryAfter = Math.max(
    accountResult.retryAfterSeconds ?? 0,
    ipResult.retryAfterSeconds ?? 0
  );

  if (!accountResult.allowed || !ipResult.allowed) {
    return rateLimitResponse(errorMessage, retryAfter, {
      remaining: accountResult.remaining,
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      remaining: accountResult.remaining,
      retryAfter: accountResult.retryAfterSeconds,
    },
    {
      status: 401,
      headers: {
        ...noStoreHeaders(),
        "X-RateLimit-Remaining":
          accountResult.remaining.toString(),
      },
    }
  );
}

// =====================
// POST /api/auth/login
// =====================

export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body
    const body = await parseRequestBody(request);

    if (!body) {
      return jsonError("Invalid request body", 400);
    }

    const cleanEmail = body.email.trim().toLowerCase();
    const password = body.password;

    if (!cleanEmail || !password) {
      return jsonError("Email and password required", 400);
    }

    if (
      cleanEmail.length > 254 ||
      password.length > 1024 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return jsonError("Invalid email or password format", 400);
    }

    // 2. Get client IP
    const clientIP = getClientIP(request);

    // 3. IP rate limit
    const ipKey = `login:ip:${clientIP}`;

    const ipCheck = checkRateLimit(
      ipKey,
      RATE_LIMIT_CONFIG.IP
    );

    if (!ipCheck.allowed) {
      const minutesLeft = getMinutesLeft(
        ipCheck.retryAfterSeconds
      );

      return rateLimitResponse(
        `Too many login attempts from your network. Try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`,
        ipCheck.retryAfterSeconds ?? 60
      );
    }

    // 4. Account rate limit
    const accountKey = `login:account:${cleanEmail}`;

    const accountCheck = checkRateLimit(
      accountKey,
      RATE_LIMIT_CONFIG.ACCOUNT
    );

    if (!accountCheck.allowed) {
      const minutesLeft = getMinutesLeft(
        accountCheck.retryAfterSeconds
      );

      return rateLimitResponse(
        `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`,
        accountCheck.retryAfterSeconds ?? 60,
        {
          lockedUntil: accountCheck.lockedUntil,
        }
      );
    }

    // 5. Throttle repeated attempts
    const delay = getThrottleDelay(accountCheck.attemptCount);

    if (delay > 0) {
      await sleep(delay);
    }

    // 6. Initialize database
    const db = getDb();

    // 7. Find admin user
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(
        sql`LOWER(${adminUsers.email}) = ${cleanEmail}`
      )
      .limit(1);

    // Same generic response for unknown email and wrong password
    if (!user) {
      const { accountResult, ipResult } = recordLoginFailure(
        accountKey,
        ipKey
      );

      return createLoginFailureResponse(
        accountResult,
        ipResult
      );
    }

    // 8. Check account status
    if (!user.status) {
      const { accountResult, ipResult } = recordLoginFailure(
        accountKey,
        ipKey
      );

      return createLoginFailureResponse(
        accountResult,
        ipResult
      );
    }

    // 9. Verify password
    const isValid = await compare(password, user.password);

    if (!isValid) {
      const { accountResult, ipResult } = recordLoginFailure(
        accountKey,
        ipKey
      );

      return createLoginFailureResponse(
        accountResult,
        ipResult
      );
    }

    // 10. Validate JWT configuration
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured");

      return jsonError(
        "Authentication service unavailable",
        500
      );
    }

    // 11. Get admin role
    let roleName = "admin";

    if (user.roleId) {
      const [role] = await db
        .select({
          name: adminRoles.name,
        })
        .from(adminRoles)
        .where(eq(adminRoles.id, user.roleId))
        .limit(1);

      if (role?.name) {
        roleName = role.name;
      }
    }

    // 12. Reset account rate limit after successful authentication.
    // IP counter intentionally remains unchanged.
    resetRateLimit(accountKey);

    // 13. Create admin JWT
    const authenticatedAdmin: AuthenticatedAdmin = {
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      role: roleName,
    };

    const token = jwt.sign(
      {
        id: authenticatedAdmin.id,
        email: authenticatedAdmin.email,
        name: authenticatedAdmin.name,
        roleId: authenticatedAdmin.roleId,
        role: authenticatedAdmin.role,
        accountType: "admin",
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    // 14. Update last login.
    // Login remains successful if this optional update fails.
    try {
      await db
        .update(adminUsers)
        .set({
          lastLogin: new Date(),
        })
        .where(eq(adminUsers.id, user.id));
    } catch (error) {
      console.error(
        "Admin last login update failed:",
        error
      );
    }

    // 15. Response and authentication cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: authenticatedAdmin.id,
          email: authenticatedAdmin.email,
          name: authenticatedAdmin.name,
          roleId: authenticatedAdmin.roleId,
          role: authenticatedAdmin.role,
          accountType: "admin",
        },
      },
      {
        headers: noStoreHeaders(),
      }
    );

    response.cookies.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return jsonError("Authentication failed", 500);
  }
}
