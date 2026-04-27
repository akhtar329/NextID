// app/api/admin/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { notifications } from '@/app/lib/schema';
import { eq, and } from 'drizzle-orm';
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
      .orderBy(notifications.createdAt);

    return NextResponse.json({ success: true, notifications: userNotifications });
  } catch (error) {
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
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to process' }, { status: 500 });
  }
}
