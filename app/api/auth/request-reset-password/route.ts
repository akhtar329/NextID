
import { NextRequest, NextResponse } from "next/server";
import { db, adminUsers } from "@/db/db";
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

    console.error("Resend email error:", response.status, errorText);

    return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  let userId: number | null = null;

  try {
    const { env } = await getCloudflareContext({
      async: true,
    });

    const runtimeEnv = env as typeof env & RuntimeEnv;

    const apiKey = runtimeEnv.RESEND_API_KEY;
    const fromEmail = runtimeEnv.RESEND_FROM_EMAIL;
    const siteUrl = runtimeEnv.NEXT_PUBLIC_SITE_URL;

    if (!apiKey || !fromEmail || !siteUrl) {
      console.error(
        "Missing RESEND_API_KEY, RESEND_FROM_EMAIL or NEXT_PUBLIC_SITE_URL."
      );

      return jsonResponse(
        { success: false, message: "Email service is not configured." },
        500
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        { success: false, message: "Invalid request body." },
        400
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("email" in body) ||
      typeof body.email !== "string"
    ) {
      return jsonResponse(
        { success: false, message: "Please provide a valid email." },
        400
      );
    }

    const normalizedEmail = body.email.trim().toLowerCase();

    if (
      normalizedEmail.length > 254 ||
      !isValidEmail(normalizedEmail)
    ) {
      return jsonResponse(
        { success: false, message: "Please provide a valid email." },
        400
      );
    }

    const normalizedSiteUrl = siteUrl.trim();

    let resetUrl: URL;

    try {
      const parsedSiteUrl = new URL(normalizedSiteUrl);

      if (
        parsedSiteUrl.protocol !== "https:" &&
        parsedSiteUrl.hostname !== "localhost"
      ) {
        throw new Error("HTTPS is required.");
      }

      resetUrl = new URL("/reset-password", parsedSiteUrl.origin);
    } catch {
      console.error("Invalid NEXT_PUBLIC_SITE_URL configuration.");

      return jsonResponse(
        { success: false, message: "Invalid site configuration." },
        500
      );
    }

    const [user] = await db
      .select({
        id: adminUsers.id,
      })
      .from(adminUsers)
      .where(eq(adminUsers.email, normalizedEmail))
      .limit(1);

    // Do not reveal whether an email address has an account.
    if (!user) {
      return jsonResponse(GENERIC_RESPONSE);
    }

    userId = user.id;

    const token = generateResetToken();

    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_MS
    );

    resetUrl.searchParams.set("token", token);
    resetUrl.searchParams.set("email", normalizedEmail);

    await db
      .update(adminUsers)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
      })
      .where(eq(adminUsers.id, user.id));

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
        { success: false, message: "Unable to send reset email. Please try again later." },
        500
      );
    }

    return jsonResponse(GENERIC_RESPONSE);
  } catch (error) {
    console.error("Password reset request error:", error);

    // Remove the token if an error occurs after it was saved.
    if (userId !== null) {
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
      { success: false, message: "Something went wrong. Please try again later." },
      500
    );
  }
}
