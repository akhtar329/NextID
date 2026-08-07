// lib/notifications.ts
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/db';
import { notifications } from '@/db/schema';
import { writeLog } from '@/lib/logger';

interface CreateNotificationParams {
  userId: number;
  type: string;
  title: string;
  message: string;
  link?: string;
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

    await writeLog({
      id: `db_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "DATABASE_QUERY",
      operation: "createNotification",
      source: "database",
      duration: Date.now() - startTime,
      data: {
        userId,
        type,
        title: title.substring(0, 50),
      },
    });

    return newNotification;
  } catch (error) {
    await writeLog({
      id: `db_err_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "DATABASE_QUERY",
      operation: "createNotification_error",
      source: "database",
      duration: Date.now() - startTime,
      data: {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
        type,
      },
    });

    console.error('Error creating notification:', error);
    return null;
  }
}

export async function getUnreadCount(userId: number): Promise<number> {
  const startTime = Date.now();
  
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
    
    const count = result[0]?.count || 0;

    await writeLog({
      id: `db_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "DATABASE_QUERY",
      operation: "getUnreadCount",
      source: "database",
      duration: Date.now() - startTime,
      data: {
        userId,
        count,
      },
    });

    return count;
  } catch (error) {
    await writeLog({
      id: `db_err_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "DATABASE_QUERY",
      operation: "getUnreadCount_error",
      source: "database",
      duration: Date.now() - startTime,
      data: {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      },
    });

    console.error('Error getting unread count:', error);
    return 0;
  }
}

export async function markAsRead(notificationId: number, userId: number) {
  const startTime = Date.now();
  
  try {
    await db
      .update(notifications)
      .set({ 
        read: true, 
        updatedAt: new Date() 
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );
    
    await writeLog({
      id: `db_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "DATABASE_QUERY",
      operation: "markAsRead",
      source: "database",
      duration: Date.now() - startTime,
      data: {
        notificationId,
        userId,
      },
    });

    return true;
  } catch (error) {
    await writeLog({
      id: `db_err_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "DATABASE_QUERY",
      operation: "markAsRead_error",
      source: "database",
      duration: Date.now() - startTime,
      data: {
        error: error instanceof Error ? error.message : "Unknown error",
        notificationId,
        userId,
      },
    });

    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function markAllAsRead(userId: number) {
  const startTime = Date.now();
  
  try {
    await db
      .update(notifications)
      .set({ 
        read: true, 
        updatedAt: new Date() 
      })
      .where(eq(notifications.userId, userId));
    
    await writeLog({
      id: `db_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "DATABASE_QUERY",
      operation: "markAllAsRead",
      source: "database",
      duration: Date.now() - startTime,
      data: {
        userId,
      },
    });

    return true;
  } catch (error) {
    await writeLog({
      id: `db_err_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "DATABASE_QUERY",
      operation: "markAllAsRead_error",
      source: "database",
      duration: Date.now() - startTime,
      data: {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      },
    });

    console.error('Error marking all as read:', error);
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
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(sql`${notifications.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    await writeLog({
      id: `db_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "DATABASE_QUERY",
      operation: "getNotifications",
      source: "database",
      duration: Date.now() - startTime,
      dataSize: JSON.stringify(rows).length,
      data: {
        userId,
        limit,
        offset,
        count: rows.length,
      },
    });

    return rows;
  } catch (error) {
    await writeLog({
      id: `db_err_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "DATABASE_QUERY",
      operation: "getNotifications_error",
      source: "database",
      duration: Date.now() - startTime,
      data: {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
        limit,
        offset,
      },
    });

    console.error('Error getting notifications:', error);
    return [];
  }
}