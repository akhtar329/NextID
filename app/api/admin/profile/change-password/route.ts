
import { NextRequest, NextResponse } from "next/server";
import jwt, {
  JsonWebTokenError,
  TokenExpiredError,
} from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getDb } from "@/db/db";";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

interface AuthenticatedUser {
  id: number;
}

interface PasswordRequestBody {
  currentPassword: string;
  newPassword: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

function verifyToken(token: string): AuthenticatedUser | null {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured");
      return null;
    }

    const decoded: unknown = jwt.verify(token, secret);

    if (
      !isRecord(decoded) ||
      typeof decoded.id !== "number" ||
      !Number.isSafeInteger(decoded.id) ||
      decoded.id <= 0
    ) {
      return null;
    }

    return {
      id: decoded.id,
    };
  } catch (error) {
    if (
      error instanceof TokenExpiredError ||
      error instanceof JsonWebTokenError
    ) {
      return null;
    }

    console.error("JWT verification error:", error);
    return null;
  }
}

async function parseRequestBody(
  request: Request
): Promise<PasswordRequestBody | null> {
  try {
    const body: unknown = await request.json();

    if (!isRecord(body)) {
      return null;
    }

    if (
      typeof body.currentPassword !== "string" ||
      typeof body.newPassword !== "string"
    ) {
      return null;
    }

    return {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
      return jsonError("Unauthorized - Please login first", 401);
    }

    const authenticatedUser = verifyToken(token);

    if (!authenticatedUser) {
      return jsonError("Invalid or expired authentication token", 401);
    }

    // Parse request
    const body = await parseRequestBody(request);

    if (!body) {
      return jsonError("Invalid request body", 400);
    }

    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return jsonError(
        "Current password and new password are required",
        400
      );
    }

    if (currentPassword.length > 1024 || newPassword.length > 1024) {
      return jsonError("Password is too long", 400);
    }

    if (newPassword.length < 6) {
      return jsonError(
        "New password must be at least 6 characters",
        400
      );
    }

    if (currentPassword === newPassword) {
      return jsonError(
        "New password must be different from current password",
        400
      );
    }

    // Fetch user password
    const [user] = await db
      .select({
        id: adminUsers.id,
        password: adminUsers.password,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, authenticatedUser.id))
      .limit(1);

    if (!user) {
      return jsonError("User not found", 404);
    }

    if (!user.password) {
      console.error(
        `Password is missing for admin user ID ${authenticatedUser.id}`
      );

      return jsonError("Unable to verify current password", 500);
    }

    // Verify current password
    const isValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isValid) {
      return jsonError("Current password is incorrect", 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const [updatedUser] = await db
      .update(adminUsers)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, authenticatedUser.id))
      .returning({
        id: adminUsers.id,
      });

    if (!updatedUser) {
      return jsonError("Failed to update password", 500);
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);

    return jsonError("Failed to change password", 500);
  }
}
