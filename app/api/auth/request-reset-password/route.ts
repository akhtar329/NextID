// app/api/auth/request-reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db, adminUsers } from "@/app/lib/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const [user] = await db.select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email));  // eq() use karo

    if (!user) {
      return NextResponse.json({ error: "No user found with this email" }, { status: 404 });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token and expiry
    await db.update(adminUsers)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expires,
      })
      .where(eq(adminUsers.id, user.id));  // eq() use karo

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}&email=${email}`;

    await transporter.sendMail({
      from: `"NextID Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset Your Password",
      html: `
        <p>You requested a password reset.</p>
        <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    return NextResponse.json({ message: "Password reset email sent successfully" });

  } catch (error) {
    console.error("Request reset password error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}