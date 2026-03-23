// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { adminUsers } from "@/app/lib/schema";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm"; // ✅ expressions come from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required." }, { status: 400 });
    }

    // 1️⃣ Find user by token and check expiration
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(
        and(
          eq(adminUsers.passwordResetToken, token),
          gt(adminUsers.passwordResetExpires, new Date())
        )
      );

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });
    }

    // 2️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3️⃣ Update user password and clear token/expiration
    await db
      .update(adminUsers)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, user.id));

    return NextResponse.json({ message: "Password has been reset successfully." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}