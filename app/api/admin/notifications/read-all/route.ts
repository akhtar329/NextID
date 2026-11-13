
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import jwt, {
  JsonWebTokenError,
  TokenExpiredError,
} from "jsonwebtoken";

interface AuthenticatedPayload {
  id: number;
}

function isValidPayload(
  payload: unknown
): payload is AuthenticatedPayload {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return false;
  }

  const data = payload as Record<string, unknown>;

  return (
    typeof data.id === "number" &&
    Number.isSafeInteger(data.id) &&
    data.id > 0
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Get authentication token
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - No token provided",
        },
        { status: 401 }
      );
    }

    // 2. Verify JWT secret configuration
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured");

      return NextResponse.json(
        {
          success: false,
          error: "Server authentication is not configured",
        },
        { status: 500 }
      );
    }

    // 3. Verify JWT token
    let decoded: unknown;

    try {
      decoded = jwt.verify(token, secret);
    } catch (error) {
      if (
        error instanceof TokenExpiredError ||
        error instanceof JsonWebTokenError
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized - Invalid or expired token",
          },
          { status: 401 }
        );
      }

      console.error("JWT verification error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Authentication failed",
        },
        { status: 500 }
      );
    }

    // 4. Validate JWT payload
    if (!isValidPayload(decoded)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Invalid token payload",
        },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // 5. Initialize database
    const db = getDb();

    // 6. Mark all unread notifications as read
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

    // 7. Return success response
    return NextResponse.json(
      {
        success: true,
        message: "All notifications marked as read",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error marking all notifications as read:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to mark all notifications as read",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
