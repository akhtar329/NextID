
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

const GENERIC_RESPONSE = {
  success: true,
  message:
    "If an account exists with this email, you will receive a password reset link.",
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    }
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function parseRequestBody(
  request: Request
): Promise<{ email: string } | null> {
  try {
    const body: unknown = await request.json();

    if (!isRecord(body) || typeof body.email !== "string") {
      return null;
    }

    return {
      email: body.email,
    };
  } catch {
    return null;
  }
}

function isValidEmail(email: string): boolean {
  if (email.length > 254) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function generateResetToken(): string {
  const bytes = new Uint8Array(32);

  globalThis.crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getEmailConfiguration() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !smtpUser ||
    !smtpPass ||
    !siteUrl
  ) {
    return null;
  }

  let parsedSiteUrl: URL;

  try {
    parsedSiteUrl = new URL(siteUrl);
  } catch {
    return null;
  }

  if (
    parsedSiteUrl.protocol !== "https:" &&
    process.env.NODE_ENV === "production"
  ) {
    return null;
  }

  const secure = process.env.SMTP_SECURE === "true";

  return {
    host,
    port,
    smtpUser,
    smtpPass,
    secure,
    siteUrl: parsedSiteUrl.origin,
  };
}

function createResetEmail(resetUrl: string): string {
  const safeResetUrl = escapeHtml(resetUrl);

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset Your Password - NextID.pk</title>
      </head>

      <body style="margin:0;padding:20px;background:#f3f4f6;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:30px auto;background:#ffffff;padding:35px;border-radius:12px;">

          <h2 style="color:#2563eb;margin-top:0;">
            Password Reset Request
          </h2>

          <p style="color:#374151;line-height:1.7;">
            You requested a password reset for your NextID.pk account.
          </p>

          <p style="color:#374151;line-height:1.7;">
            Click the button below to create a new password:
          </p>

          <div style="margin:25px 0;">
            <a
              href="${safeResetUrl}"
              style="display:inline-block;background:#2563eb;color:#ffffff;padding:13px 25px;text-decoration:none;border-radius:8px;font-weight:bold;"
            >
              Reset Password
            </a>
          </div>

          <p style="color:#6b7280;font-size:13px;line-height:1.6;">
            If the button does not work, copy and paste this link into your browser:
          </p>

          <p style="font-size:13px;word-break:break-all;">
            <a href="${safeResetUrl}" style="color:#2563eb;">
              ${safeResetUrl}
            </a>
          </p>

          <p style="color:#374151;">
            This link will expire in <strong>1 hour</strong>.
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0;" />

          <p style="color:#6b7280;font-size:12px;line-height:1.6;">
            If you did not request this password reset, please ignore this email.
            Your password will remain unchanged.
          </p>

          <p style="color:#6b7280;font-size:12px;">
            NextID Support
          </p>

        </div>
      </body>
    </html>
  `;
}

// POST /api/auth/request-reset-password
export async function POST(request: NextRequest) {
  try {
    // 1. Validate request
    const body = await parseRequestBody(request);

    if (!body) {
      return jsonError("Valid email is required", 400);
    }

    const normalizedEmail = body.email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return jsonError("Invalid email format", 400);
    }

    // 2. Validate server configuration
    const emailConfig = getEmailConfiguration();

    if (!emailConfig) {
      console.error(
        "Password reset email configuration is incomplete or invalid"
      );

      return jsonError(
        "Password reset service is temporarily unavailable",
        500
      );
    }

    // 3. Find admin user
    const [user] = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
      })
      .from(adminUsers)
      .where(eq(adminUsers.email, normalizedEmail))
      .limit(1);

    // Do not reveal whether an account exists
    if (!user) {
      return NextResponse.json(GENERIC_RESPONSE, {
        status: 200,
        headers: {
          "Cache-Control": "no-store, must-revalidate",
        },
      });
    }

    // 4. Generate secure reset token
    const token = generateResetToken();

    const expires = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_MS
    );

    // 5. Save reset token in database
    await db
      .update(adminUsers)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expires,
      })
      .where(eq(adminUsers.id, user.id));

    // 6. Create reset URL
    const resetUrl = new URL(
      "/reset-password",
      emailConfig.siteUrl
    );

    resetUrl.searchParams.set("token", token);
    resetUrl.searchParams.set("email", normalizedEmail);

    // 7. Configure SMTP transporter
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });

    // 8. Send password reset email
    try {
      await transporter.sendMail({
        from: `"NextID Support" <${emailConfig.smtpUser}>`,
        to: normalizedEmail,
        subject: "Reset Your Password - NextID.pk",
        text: `
Password Reset Request

You requested a password reset for your NextID.pk account.

Open this link to reset your password:

${resetUrl.toString()}

This link will expire in 1 hour.

If you did not request this, please ignore this email.
        `.trim(),
        html: createResetEmail(resetUrl.toString()),
      });
    } catch (emailError) {
      console.error("Password reset email sending failed:", emailError);

      // Remove unused token if email delivery fails
      await db
        .update(adminUsers)
        .set({
          passwordResetToken: null,
          passwordResetExpires: null,
        })
        .where(eq(adminUsers.id, user.id));

      return jsonError(
        "Unable to send password reset email. Please try again later.",
        500
      );
    }

    // 9. Successful response
    return NextResponse.json(GENERIC_RESPONSE, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Request reset password error:", error);

    return jsonError(
      "Unable to process request. Please try again later.",
      500
    );
  }
}
