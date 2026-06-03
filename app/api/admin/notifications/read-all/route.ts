// app/api/admin/notifications/read-all/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    // ✅ Get token from cookie (custom auth)
    const token = request.cookies.get("authToken")?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    // ✅ Verify JWT token
    let decoded: { id: string } | null = null;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as { id: string };
    } catch {
      // Silent catch - jwtError not needed
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid token payload" },
        { status: 401 }
      );
    }

    // ✅ Convert userId from string to number (since database column is integer)
    const userIdNumber = parseInt(userId, 10);
    
    if (isNaN(userIdNumber)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Mark all unread notifications as read
    await db
      .update(notifications)
      .set({ 
        read: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, userIdNumber), // ✅ Now using number
          eq(notifications.read, false)
        )
      );

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read",
    });

  } catch (error) {
    console.error("Error marking all as read:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark all as read" },
      { status: 500 }
    );
  }
}