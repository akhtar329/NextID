
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { adminUsers } from "@/db/schema";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";

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
      Expires: "0",
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

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return "Password must be at least 8 characters long.";
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return "Password must not exceed 128 characters.";
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return "Password must contain at least one uppercase letter, one lowercase letter, and one number.";
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Parse and validate request body
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        { success: false, error: "Invalid request body." },
        400
      );
    }

    if (!isRecord(body)) {
      return jsonResponse(
        { success: false, error: "Invalid request body." },
        400
      );
    }

    const { token, newPassword } = body;

    // 2. Validate reset token
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return jsonResponse(
        { success: false, error: "A valid reset token is required." },
        400
      );
    }

    // 3. Validate new password
    if (typeof newPassword !== "string" || !newPassword) {
      return jsonResponse(
        { success: false, error: "New password is required." },
        400
      );
    }

    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      return jsonResponse(
        { success: false, error: passwordError },
        400
      );
    }

    // 4. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 5. Atomically verify token and update password
    const result = await db.transaction(async (tx) => {
      const [user] = await tx
        .select({
          id: adminUsers.id,
        })
        .from(adminUsers)
        .where(
          and(
            eq(adminUsers.passwordResetToken, token),
            gt(adminUsers.passwordResetExpires, new Date())
          )
        )
        .limit(1);

      if (!user) {
        return false;
      }

      const updatedUsers = await tx
        .update(adminUsers)
        .set({
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(adminUsers.id, user.id),
            eq(adminUsers.passwordResetToken, token),
            gt(adminUsers.passwordResetExpires, new Date())
          )
        )
        .returning({
          id: adminUsers.id,
        });

      return updatedUsers.length === 1;
    });

    // 6. Invalid or expired token
    if (!result) {
      return jsonResponse(
        {
          success: false,
          error:
            "Invalid or expired reset token. Please request a new password reset link.",
        },
        400
      );
    }

    // 7. Successful password reset
    return jsonResponse({
      success: true,
      message:
        "Password has been reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Unable to reset password. Please try again later.",
      },
      500
    );
  }
}
