
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

const GENERIC_RESPONSE = {
  success: true,
  message:
    "If an account exists with this email, a password reset link has been sent.",
};

interface RuntimeEnv {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

interface RequestBody {
  email?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateResetToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sendResetEmail(
  apiKey: string,
  fromEmail: string,
  recipient: string,
  resetUrl: string
): Promise<boolean> {
  try {
    const safeUrl = escapeHtml(resetUrl);

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:30px;background:#f4f4f5;font-family:Arial,sans-serif;">
          <div style="max-width:600px;margin:auto;background:#ffffff;padding:35px;border-radius:8px;">
            <h2 style="color:#18181b;">Password Reset Request</h2>

            <p style="color:#52525b;line-height:1.6;">
              We received a request to reset your NextID.pk account password.
            </p>

            <p style="margin:30px 0;">
              <a
                href="${safeUrl}"
                style="background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:6px;display:inline-block;"
              >
                Reset Your Password
              </a>
            </p>

            <p style="color:#52525b;line-height:1.6;">
              This link will expire in 1 hour.
            </p>

            <p style="color:#71717a;font-size:13px;line-height:1.6;">
              If you did not request a password reset, you can safely ignore this email.
              Your password will remain unchanged.
            </p>

            <hr style="border:none;border-top:1px solid #e4e4e7;margin:25px 0;" />

            <p style="color:#a1a1aa;font-size:12px;">
              NextID.pk Support
            </p>
          </div>
        </body>
      </html>
    `;

    const text = [
      "Password Reset Request - NextID.pk",
      "",
      "We received a request to reset your account password.",
      "",
      `Reset your password using this link: ${resetUrl}`,
      "",
      "This link will expire in 1 hour.",
      "",
      "If you did not request this, ignore this email.",
    ].join("\n");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipient],
        subject: "Reset Your Password - NextID.pk",
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Resend email error:",
        response.status,
        errorText
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error("Resend request failed:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  let userId: number | null = null;
  let db: ReturnType<typeof getDb> | null = null;

  try {
    // Get Cloudflare runtime environment
    const { env } = await getCloudflareContext({
      async: true,
    });

    const runtimeEnv = env as unknown as RuntimeEnv;

    const apiKey = runtimeEnv.RESEND_API_KEY;
    const fromEmail = runtimeEnv.RESEND_FROM_EMAIL;
    const siteUrl = runtimeEnv.NEXT_PUBLIC_SITE_URL;

    if (!apiKey || !fromEmail || !siteUrl) {
      console.error(
        "Missing RESEND_API_KEY, RESEND_FROM_EMAIL or NEXT_PUBLIC_SITE_URL."
      );

      return jsonResponse(
        {
          success: false,
          message: "Email service is not configured.",
        },
        500
      );
    }

    // Parse request body
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          message: "Invalid request body.",
        },
        400
      );
    }

    if (!isRecord(body) || typeof body.email !== "string") {
      return jsonResponse(
        {
          success: false,
          message: "Please provide a valid email.",
        },
        400
      );
    }

    const normalizedEmail = body.email.trim().toLowerCase();

    if (
      normalizedEmail.length > 254 ||
      !isValidEmail(normalizedEmail)
    ) {
      return jsonResponse(
        {
          success: false,
          message: "Please provide a valid email.",
        },
        400
      );
    }

    // Validate site URL
    let resetUrl: URL;

    try {
      const parsedSiteUrl = new URL(siteUrl.trim());

      const isLocalhost =
        parsedSiteUrl.hostname === "localhost" ||
        parsedSiteUrl.hostname === "127.0.0.1";

      if (
        parsedSiteUrl.protocol !== "https:" &&
        !isLocalhost
      ) {
        throw new Error("HTTPS is required.");
      }

      if (parsedSiteUrl.username || parsedSiteUrl.password) {
        throw new Error("Credentials are not allowed in site URL.");
      }

      resetUrl = new URL("/reset-password", parsedSiteUrl.origin);
    } catch {
      console.error("Invalid NEXT_PUBLIC_SITE_URL configuration.");

      return jsonResponse(
        {
          success: false,
          message: "Invalid site configuration.",
        },
        500
      );
    }

    // Initialize database at request runtime
    db = getDb();

    // Find admin account
    const [user] = await db
      .select({
        id: adminUsers.id,
      })
      .from(adminUsers)
      .where(eq(adminUsers.email, normalizedEmail))
      .limit(1);

    // Do not reveal whether an email address has an account
    if (!user) {
      return jsonResponse(GENERIC_RESPONSE);
    }

    userId = user.id;

    // Generate reset token
    const token = generateResetToken();

    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_MS
    );

    resetUrl.searchParams.set("token", token);
    resetUrl.searchParams.set("email", normalizedEmail);

    // Save reset token
    await db
      .update(adminUsers)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
      })
      .where(eq(adminUsers.id, user.id));

    // Send reset email
    const emailSent = await sendResetEmail(
      apiKey,
      fromEmail,
      normalizedEmail,
      resetUrl.toString()
    );

    if (!emailSent) {
      await db
        .update(adminUsers)
        .set({
          passwordResetToken: null,
          passwordResetExpires: null,
        })
        .where(eq(adminUsers.id, user.id));

      userId = null;

      return jsonResponse(
        {
          success: false,
          message:
            "Unable to send reset email. Please try again later.",
        },
        500
      );
    }

    return jsonResponse(GENERIC_RESPONSE);
  } catch (error) {
    console.error("Password reset request error:", error);

    // Remove reset token if an error occurs after saving it
    if (userId !== null && db !== null) {
      try {
        await db
          .update(adminUsers)
          .set({
            passwordResetToken: null,
            passwordResetExpires: null,
          })
          .where(eq(adminUsers.id, userId));
      } catch (cleanupError) {
        console.error("Reset token cleanup error:", cleanupError);
      }
    }

    return jsonResponse(
      {
        success: false,
        message: "Something went wrong. Please try again later.",
      },
      500
    );
  }
}
