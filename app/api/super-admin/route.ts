
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/db";
import { adminUsers } from "@/db/schema";

const SUPER_ADMIN_ROLE_ID = 1;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
    },
  });
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isValidEmail(email: string): boolean {
  return (
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  );
}

// POST /api/super-admin
export async function POST(req: NextRequest) {
  try {
    // 1. Require bootstrap secret
    const bootstrapSecret =
      process.env.SUPER_ADMIN_BOOTSTRAP_SECRET;

    if (!bootstrapSecret) {
      console.error(
        "SUPER_ADMIN_BOOTSTRAP_SECRET is not configured"
      );

      return jsonResponse(
        {
          success: false,
          error: "Super admin bootstrap is not configured.",
        },
        503
      );
    }

    const providedSecret =
      req.headers.get("x-bootstrap-secret");

    if (
      !providedSecret ||
      providedSecret !== bootstrapSecret
    ) {
      return jsonResponse(
        {
          success: false,
          error: "Unauthorized request.",
        },
        401
      );
    }

    // 2. Parse request body
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "Invalid request body.",
        },
        400
      );
    }

    if (!isRecord(body)) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid request body.",
        },
        400
      );
    }

    const { name, email, password } = body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return jsonResponse(
        {
          success: false,
          error: "Name, email and password are required.",
        },
        400
      );
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      cleanName.length < 2 ||
      cleanName.length > 150
    ) {
      return jsonResponse(
        {
          success: false,
          error: "Name must be between 2 and 150 characters.",
        },
        400
      );
    }

    if (!isValidEmail(cleanEmail)) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid email address.",
        },
        400
      );
    }

    if (
      password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      return jsonResponse(
        {
          success: false,
          error: "Password must be between 8 and 128 characters.",
        },
        400
      );
    }

    // 3. Initialize database
    const db = getDb();

    // 4. Prevent creating another Super Admin
    const [existingSuperAdmin] = await db
      .select({
        id: adminUsers.id,
      })
      .from(adminUsers)
      .where(eq(adminUsers.roleId, SUPER_ADMIN_ROLE_ID))
      .limit(1);

    if (existingSuperAdmin) {
      return jsonResponse(
        {
          success: false,
          error: "A Super Admin account already exists.",
        },
        409
      );
    }

    // 5. Prevent duplicate email
    const [existingUser] = await db
      .select({
        id: adminUsers.id,
      })
      .from(adminUsers)
      .where(eq(adminUsers.email, cleanEmail))
      .limit(1);

    if (existingUser) {
      return jsonResponse(
        {
          success: false,
          error: "This email is already registered.",
        },
        409
      );
    }

    // 6. Hash password
    const hashedPassword = await hash(password, 10);

    // 7. Create Super Admin
    const [newAdmin] = await db
      .insert(adminUsers)
      .values({
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        roleId: SUPER_ADMIN_ROLE_ID,
        status: true,
      })
      .returning({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        roleId: adminUsers.roleId,
      });

    if (!newAdmin) {
      throw new Error("Super Admin creation failed.");
    }

    // 8. Success response
    return jsonResponse(
      {
        success: true,
        message: "Super Admin created successfully.",
        user: newAdmin,
      },
      201
    );
  } catch (error) {
    console.error("SUPER ADMIN CREATION ERROR:", error);

    // PostgreSQL unique constraint violation
    if (
      isRecord(error) &&
      error.code === "23505"
    ) {
      return jsonResponse(
        {
          success: false,
          error: "This admin account already exists.",
        },
        409
      );
    }

    return jsonResponse(
      {
        success: false,
        error: "Failed to create Super Admin.",
      },
      500
    );
  }
}
