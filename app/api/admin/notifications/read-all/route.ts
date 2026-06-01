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
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.id; // Get userId from token

    // Mark all unread notifications as read
    await db
      .update(notifications)
      .set({ 
        read: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, userId),
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
