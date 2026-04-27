// app/api/admin/notifications/clear-all/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { notifications } from "@/app/lib/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

export async function DELETE(request: NextRequest) {
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

    // Delete all notifications for this user
    await db
      .delete(notifications)
      .where(eq(notifications.userId, userId));

    return NextResponse.json({
      success: true,
      message: "All notifications cleared",
    });

  } catch (error) {
    console.error("Error clearing notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear notifications" },
      { status: 500 }
    );
  }
}
