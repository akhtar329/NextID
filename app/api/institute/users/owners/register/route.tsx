
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/db";";
import { instituteUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "@/lib/rate-limit";

const RATE_LIMIT_OPTIONS = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  lockoutMs: 60 * 60 * 1000,
  exponential: false,
} as const;

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  additionalHeaders?: Record<string, string>
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      ...additionalHeaders,
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getClientIP(request: NextRequest): string {
  // Cloudflare's connecting IP is the preferred trusted source.
  const cfIP = request.headers.get("cf-connecting-ip")?.trim();

  if (cfIP) {
    return cfIP;
  }

  const realIP = request.headers.get("x-real-ip")?.trim();

  if (realIP) {
    return realIP;
  }

  // Fallback for environments without Cloudflare.
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    const firstIP = forwarded.split(",")[0]?.trim();

    if (firstIP) {
      return firstIP;
    }
  }

  return "unknown";
}

function isValidEmail(email: string): boolean {
  if (email.length > 254) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function getValidationError(
  body: Record<string, unknown>
): { data: RegisterBody | null; error: string | null } {
  const { name, email, password, phone } = body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return {
      data: null,
      error: "Name, email and password are required",
    };
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password;

  if (!cleanName || !cleanEmail || !cleanPassword) {
    return {
      data: null,
      error: "Name, email and password are required",
    };
  }

  if (cleanName.length < 2 || cleanName.length > 150) {
    return {
      data: null,
      error: "Name must be between 2 and 150 characters",
    };
  }

  if (!isValidEmail(cleanEmail)) {
    return {
      data: null,
      error: "Invalid email address",
    };
  }

  if (
    cleanPassword.length < PASSWORD_MIN_LENGTH ||
    cleanPassword.length > PASSWORD_MAX_LENGTH
  ) {
    return {
      data: null,
      error: "Password must be between 8 and 128 characters",
    };
  }

  let cleanPhone: string | null = null;

  if (phone !== undefined && phone !== null) {
    if (typeof phone !== "string") {
      return {
        data: null,
        error: "Invalid phone number",
      };
    }

    cleanPhone = phone.trim();

    if (cleanPhone.length > 30) {
      return {
        data: null,
        error: "Phone number is too long",
      };
    }

    if (!cleanPhone) {
      cleanPhone = null;
    }
  }

  return {
    data: {
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      phone: cleanPhone,
    },
    error: null,
  };
}

function rateLimitResponse(retryAfterSeconds: number) {
  const minutesLeft = Math.max(
    1,
    Math.ceil(retryAfterSeconds / 60)
  );

  const message = `Too many registration attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`;

  return jsonResponse(
    {
      success: false,
      error: message,
      message,
      retryAfter: retryAfterSeconds,
    },
    429,
    {
      "Retry-After": String(retryAfterSeconds),
    }
  );
}

// POST /api/institute/users/owners/register
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body safely
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "Invalid request body",
          message: "Invalid request body",
        },
        400
      );
    }

    if (!isRecord(body)) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid request body",
          message: "Invalid request body",
        },
        400
      );
    }

    // 2. Validate registration fields
    const validation = getValidationError(body);

    if (!validation.data) {
      const message = validation.error ?? "Invalid registration details";

      return jsonResponse(
        {
          success: false,
          error: message,
          message,
        },
        400
      );
    }

    const { name, email, password, phone } = validation.data;

    // 3. IP-based rate limiting
    const clientIP = getClientIP(request);
    const ipKey = `institute:register:ip:${clientIP}`;

    const ipCheck = checkRateLimit(ipKey, {
      maxAttempts: RATE_LIMIT_OPTIONS.maxAttempts,
      windowMs: RATE_LIMIT_OPTIONS.windowMs,
      lockoutMs: RATE_LIMIT_OPTIONS.lockoutMs,
    });

    if (!ipCheck.allowed) {
      return rateLimitResponse(
        ipCheck.retryAfterSeconds ?? 60
      );
    }

    // 4. Check duplicate email
    const [existingUser] = await db
      .select({
        id: instituteUsers.id,
      })
      .from(instituteUsers)
      .where(eq(instituteUsers.email, email))
      .limit(1);

    if (existingUser) {
      recordFailedAttempt(ipKey, RATE_LIMIT_OPTIONS);

      return jsonResponse(
        {
          success: false,
          error: "This email is already registered. Please sign in instead.",
          message: "This email is already registered. Please sign in instead.",
        },
        409
      );
    }

    // 5. Hash password
    const hashedPassword = await hash(password, 10);

    // 6. Create institute owner account
    const [newUser] = await db
      .insert(instituteUsers)
      .values({
        name,
        email,
        phone,
        password: hashedPassword,
        status: true,
      })
      .returning({
        id: instituteUsers.id,
        name: instituteUsers.name,
        email: instituteUsers.email,
        createdAt: instituteUsers.createdAt,
      });

    if (!newUser) {
      throw new Error("Institute owner account creation failed");
    }

    // 7. Reset rate limit after successful registration
    resetRateLimit(ipKey);

    // 8. Success response
    return jsonResponse(
      {
        success: true,
        message: "Account created successfully! You can now sign in.",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
      },
      201
    );
  } catch (error) {
    console.error("INSTITUTE REGISTER ERROR:", error);

    // Handle PostgreSQL unique constraint violation
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return jsonResponse(
        {
          success: false,
          error: "This email is already registered. Please sign in instead.",
          message: "This email is already registered. Please sign in instead.",
        },
        409
      );
    }

    return jsonResponse(
      {
        success: false,
        error: "Registration failed. Please try again.",
        message: "Registration failed. Please try again.",
      },
      500
    );
  }
}
