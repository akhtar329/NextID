// app/api/admin/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { notifications } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';  // ✅ Added desc
import jwt from 'jsonwebtoken';

// GET - Fetch notifications
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('authToken')?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const userId = decoded.id;

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));  // ✅ Latest first

    // ✅ Also return unread count
    const unreadResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );

    return NextResponse.json({ 
      success: true, 
      notifications: userNotifications,
      unreadCount: Number(unreadResult[0]?.count) || 0
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST - Mark as read or clear all
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('authToken')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const userId = decoded.id;
    const body = await request.json();
    const { notificationId, action } = body;

    // Clear all notifications
    if (action === 'clearAll') {
      await db.delete(notifications).where(eq(notifications.userId, userId));
      return NextResponse.json({ success: true, message: 'All cleared' });
    }

    // Mark single notification as read
    if (notificationId) {
      await db
        .update(notifications)
        .set({ read: true, updatedAt: new Date() })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
      
      return NextResponse.json({ success: true, message: 'Marked as read' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to process' }, { status: 500 });
  }
}