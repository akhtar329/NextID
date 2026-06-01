// app/api/auth/request-reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db, adminUsers } from "@/db/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, normalizedEmail));

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { message: "If an account exists with this email, you will receive a password reset link." },
        { status: 200 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db
      .update(adminUsers)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expires,
      })
      .where(eq(adminUsers.id, user.id));

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    await transporter.sendMail({
      from: `"NextID Support" <${process.env.SMTP_USER}>`,
      to: normalizedEmail,
      subject: "Reset Your Password - NextID.pk",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>You requested a password reset for your NextID.pk account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            Reset Password
          </a>
          <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in <strong>1 hour</strong>.</p>
          <hr style="margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
        </div>
      `,
    });

    const response = NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link."
    });

    response.headers.set('Cache-Control', 'no-store, must-revalidate');

    return response;

  } catch (error) {
    console.error("Request reset password error:", error);
    return NextResponse.json(
      { error: "Unable to process request. Please try again later." },
      { status: 500 }
    );
  }
}
