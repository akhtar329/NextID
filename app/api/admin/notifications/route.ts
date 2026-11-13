
// app/api/admin/notifications/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { notifications } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

interface AuthenticatedPayload {
  id: number;
}

interface NotificationRequestBody {
  action?: string;
  notificationId?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function authenticateRequest(
  request: NextRequest
):
  | { success: true; user: AuthenticatedPayload }
  | { success: false; response: NextResponse } {
  const token = request.cookies.get("authToken")?.value;

  if (!token) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is not configured");

    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Server authentication is not configured" },
        { status: 500 }
      ),
    };
  }

  try {
    const decoded: unknown = jwt.verify(token, secret);

    if (
      !isRecord(decoded) ||
      typeof decoded.id !== "number" ||
      !Number.isSafeInteger(decoded.id) ||
      decoded.id <= 0
    ) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: "Invalid authentication token" },
          { status: 401 }
        ),
      };
    }

    return {
      success: true,
      user: { id: decoded.id },
    };
  } catch (error) {
    if (
      error instanceof TokenExpiredError ||
      error instanceof JsonWebTokenError
    ) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: "Invalid or expired token" },
          { status: 401 }
        ),
      };
    }

    console.error("Notification authentication error:", error);

    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Authentication failed" },
        { status: 500 }
      ),
    };
  }
}

function noStoreResponse(
  data: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

// GET: Fetch notifications and unread count
export async function GET(request: NextRequest) {
  const authentication = authenticateRequest(request);

  if (!authentication.success) {
    return authentication.response;
  }

  const userId = authentication.user.id;

  try {
    const [userNotifications, unreadResult] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt)),

      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.read, false)
          )
        ),
    ]);

    return noStoreResponse({
      success: true,
      notifications: userNotifications,
      unreadCount: Number(unreadResult[0]?.count ?? 0),
    });
  } catch (error) {
    console.error("GET admin notifications error:", error);

    return noStoreResponse(
      {
        success: false,
        error: "Failed to fetch notifications",
      },
      500
    );
  }
}

// POST: Mark notification as read or clear all notifications
export async function POST(request: NextRequest) {
  const authentication = authenticateRequest(request);

  if (!authentication.success) {
    return authentication.response;
  }

  const userId = authentication.user.id;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return noStoreResponse(
      {
        success: false,
        error: "Invalid JSON request body",
      },
      400
    );
  }

  if (!isRecord(body)) {
    return noStoreResponse(
      {
        success: false,
        error: "Invalid request body",
      },
      400
    );
  }

  const requestBody = body as NotificationRequestBody;

  try {
    // Clear all notifications belonging to the authenticated user
    if (requestBody.action === "clearAll") {
      if (requestBody.notificationId !== undefined) {
        return noStoreResponse(
          {
            success: false,
            error: "Invalid request parameters",
          },
          400
        );
      }

      await db
        .delete(notifications)
        .where(eq(notifications.userId, userId));

      return noStoreResponse({
        success: true,
        message: "All notifications cleared successfully",
      });
    }

    // Mark a single notification as read
    if (
      requestBody.notificationId !== undefined &&
      requestBody.action === undefined
    ) {
      const notificationId = requestBody.notificationId;

      if (
        typeof notificationId !== "number" ||
        !Number.isSafeInteger(notificationId) ||
        notificationId <= 0
      ) {
        return noStoreResponse(
          {
            success: false,
            error: "A valid notification ID is required",
          },
          400
        );
      }

      const updated = await db
        .update(notifications)
        .set({
          read: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        )
        .returning({ id: notifications.id });

      if (updated.length === 0) {
        return noStoreResponse(
          {
            success: false,
            error: "Notification not found",
          },
          404
        );
      }

      return noStoreResponse({
        success: true,
        message: "Notification marked as read",
      });
    }

    return noStoreResponse(
      {
        success: false,
        error: "Invalid action or request parameters",
      },
      400
    );
  } catch (error) {
    console.error("POST admin notifications error:", error);

    return noStoreResponse(
      {
        success: false,
        error: "Failed to process notification request",
      },
      500
    );
  }
}
