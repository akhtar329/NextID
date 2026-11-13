
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDb } from "@/db/db";
import { instituteUsers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { compare } from "bcryptjs";

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

interface AuthenticatedInstituteUser {
  id: number;
  email: string;
  name: string;
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
      message,
      retryAfter,
      ...extraData,
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfter.toString(),
        "Cache-Control": "no-store",
      },
    }
  );
}

function invalidCredentialsResponse(
  remaining?: number,
  retryAfter?: number
) {
  return NextResponse.json(
    {
      success: false,
      error: "Invalid credentials",
      message: "Invalid credentials",
      ...(remaining !== undefined ? { remaining } : {}),
      ...(retryAfter !== undefined ? { retryAfter } : {}),
    },
    {
      status: 401,
      headers: {
        ...(remaining !== undefined
          ? {
              "X-RateLimit-Remaining": remaining.toString(),
            }
          : {}),
        "Cache-Control": "no-store",
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
      message: errorMessage,
      remaining: accountResult.remaining,
      retryAfter: accountResult.retryAfterSeconds,
    },
    {
      status: 401,
      headers: {
        "X-RateLimit-Remaining":
          accountResult.remaining.toString(),
        "Cache-Control": "no-store",
      },
    }
  );
}

// =====================
// POST /api/auth/institute/login
// =====================

export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body
    const body = await parseRequestBody(request);

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          message: "Invalid request body",
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const email = body.email.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password required",
          message: "Email and password required",
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    if (
      email.length > 254 ||
      password.length > 1024 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password format",
          message: "Invalid email or password format",
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // 2. Get client IP
    const clientIP = getClientIP(request);

    // 3. IP rate limit
    const ipKey = `institute:login:ip:${clientIP}`;

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
    const accountKey = `institute:login:account:${email}`;

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

    // 6. Database connection
    const db = getDb();

    // 7. Find institute user
    const [user] = await db
      .select()
      .from(instituteUsers)
      .where(
        sql`LOWER(${instituteUsers.email}) = ${email}`
      )
      .limit(1);

    // Same generic response for unknown email and wrong password.
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
    if (user.status === false) {
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

    // 10. Check JWT configuration
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured");

      return NextResponse.json(
        {
          success: false,
          error: "Authentication service unavailable",
          message: "Authentication service unavailable",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // 11. Reset account failure counter.
    // IP counter intentionally remains unchanged.
    resetRateLimit(accountKey);

    // 12. Create institute-specific JWT
    const authenticatedUser: AuthenticatedInstituteUser = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    const token = jwt.sign(
      {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        name: authenticatedUser.name,
        role: "institute",
        accountType: "institute",
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    // 13. Update last login.
    // Login remains successful if this optional update fails.
    try {
      await db
        .update(instituteUsers)
        .set({
          lastLogin: new Date(),
        })
        .where(eq(instituteUsers.id, user.id));
    } catch (error) {
      console.error(
        "Institute last login update failed:",
        error
      );
    }

    // 14. Response and authentication cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          name: authenticatedUser.name,
          role: "institute",
          accountType: "institute",
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, must-revalidate",
        },
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
    console.error("INSTITUTE LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Authentication failed",
        message: "Authentication failed",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
