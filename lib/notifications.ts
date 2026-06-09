// lib/notifications.ts
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/db';
import { notifications } from '@/db/schema';

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

    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

export async function getUnreadCount(userId: number): Promise<number> {
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
    
    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

export async function markAsRead(notificationId: number, userId: number) {
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
    
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function markAllAsRead(userId: number) {
  try {
    await db
      .update(notifications)
      .set({ 
        read: true, 
        updatedAt: new Date() 
      })
      .where(eq(notifications.userId, userId));
    
    return true;
  } catch (error) {
    console.error('Error marking all as read:', error);
    return false;
  }
}