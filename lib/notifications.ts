
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/db";
import { notifications } from "@/db/schema";
import { writeLog } from "@/lib/logger";

interface CreateNotificationParams {
  userId: number;
  type: string;
  title: string;
  message: string;
  link?: string;
}

function isValidUserId(userId: number): boolean {
  return Number.isSafeInteger(userId) && userId > 0;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

async function logDatabaseOperation(params: {
  operation: string;
  startTime: number;
  data: Record<string, unknown>;
  error?: unknown;
  dataSize?: number;
}): Promise<void> {
  try {
    await writeLog({
      id: `db_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      type: "DATABASE_QUERY",
      operation: params.operation,
      source: "database",
      duration: Date.now() - params.startTime,
      ...(params.dataSize !== undefined
        ? { dataSize: params.dataSize }
        : {}),
      data: {
        ...params.data,
        ...(params.error !== undefined
          ? { error: getErrorMessage(params.error) }
          : {}),
      },
    });
  } catch (logError) {
    console.error("Database operation logging failed:", logError);
  }
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: CreateNotificationParams) {
  const startTime = Date.now();

  try {
    if (
      !isValidUserId(userId) ||
      !type.trim() ||
      !title.trim() ||
      !message.trim()
    ) {
      return null;
    }

    const db = getDb();

    const [newNotification] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        message,
        link: link || null,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await logDatabaseOperation({
      operation: "createNotification",
      startTime,
      data: {
        userId,
        type,
        title: title.substring(0, 50),
      },
    });

    return newNotification ?? null;
  } catch (error) {
    await logDatabaseOperation({
      operation: "createNotification_error",
      startTime,
      data: { userId, type },
      error,
    });

    console.error("Error creating notification:", error);
    return null;
  }
}

export async function getUnreadCount(userId: number): Promise<number> {
  const startTime = Date.now();

  try {
    if (!isValidUserId(userId)) {
      return 0;
    }

    const db = getDb();

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );

    const count = Number(result[0]?.count ?? 0);

    await logDatabaseOperation({
      operation: "getUnreadCount",
      startTime,
      data: { userId, count },
    });

    return Number.isFinite(count) ? count : 0;
  } catch (error) {
    await logDatabaseOperation({
      operation: "getUnreadCount_error",
      startTime,
      data: { userId },
      error,
    });

    console.error("Error getting unread count:", error);
    return 0;
  }
}

export async function markAsRead(
  notificationId: number,
  userId: number
): Promise<boolean> {
  const startTime = Date.now();

  try {
    if (
      !Number.isSafeInteger(notificationId) ||
      notificationId <= 0 ||
      !isValidUserId(userId)
    ) {
      return false;
    }

    const db = getDb();

    await db
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
      );

    await logDatabaseOperation({
      operation: "markAsRead",
      startTime,
      data: { notificationId, userId },
    });

    return true;
  } catch (error) {
    await logDatabaseOperation({
      operation: "markAsRead_error",
      startTime,
      data: { notificationId, userId },
      error,
    });

    console.error("Error marking notification as read:", error);
    return false;
  }
}

export async function markAllAsRead(userId: number): Promise<boolean> {
  const startTime = Date.now();

  try {
    if (!isValidUserId(userId)) {
      return false;
    }

    const db = getDb();

    await db
      .update(notifications)
      .set({
        read: true,
        updatedAt: new Date(),
      })
      .where(eq(notifications.userId, userId));

    await logDatabaseOperation({
      operation: "markAllAsRead",
      startTime,
      data: { userId },
    });

    return true;
  } catch (error) {
    await logDatabaseOperation({
      operation: "markAllAsRead_error",
      startTime,
      data: { userId },
      error,
    });

    console.error("Error marking all notifications as read:", error);
    return false;
  }
}

export async function getNotifications(
  userId: number,
  limit: number = 20,
  offset: number = 0
) {
  const startTime = Date.now();

  try {
    if (!isValidUserId(userId)) {
      return [];
    }

    const safeLimit = Number.isFinite(limit)
      ? Math.min(100, Math.max(1, Math.floor(limit)))
      : 20;

    const safeOffset = Number.isFinite(offset)
      ? Math.max(0, Math.floor(offset))
      : 0;

    const db = getDb();

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(sql`${notifications.createdAt} DESC`)
      .limit(safeLimit)
      .offset(safeOffset);

    await logDatabaseOperation({
      operation: "getNotifications",
      startTime,
      dataSize: JSON.stringify(rows).length,
      data: {
        userId,
        limit: safeLimit,
        offset: safeOffset,
        count: rows.length,
      },
    });

    return rows;
  } catch (error) {
    await logDatabaseOperation({
      operation: "getNotifications_error",
      startTime,
      data: { userId, limit, offset },
      error,
    });

    console.error("Error getting notifications:", error);
    return [];
  }
}
