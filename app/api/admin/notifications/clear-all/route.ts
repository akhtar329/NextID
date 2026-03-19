import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { notifications } from "@/app/lib/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

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