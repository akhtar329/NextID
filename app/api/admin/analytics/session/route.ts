// app/api/analytics/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { visitorSessions } from '@/app/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { visitorId, sessionId, entryPage, pageViews, startedAt, lastActive } = data;
    
    console.log('🔄 Session update received:', data);
    
    // Validate required fields
    if (!visitorId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if session already exists
    const existingSession = await db
      .select()
      .from(visitorSessions)
      .where(eq(visitorSessions.sessionId, sessionId))
      .limit(1);
    
    if (existingSession.length === 0) {
      // Insert new session
      await db.insert(visitorSessions).values({
        visitorId,
        sessionId,
        entryPage: entryPage || '/',
        pageViews: pageViews || 1,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        lastActive: lastActive ? new Date(lastActive) : new Date(),
      });
      console.log('✅ New session created:', sessionId);
      return NextResponse.json({ 
        success: true, 
        message: 'Session created successfully' 
      });
    } else {
      // Update existing session
      await db
        .update(visitorSessions)
        .set({
          lastActive: new Date(),
          pageViews: (existingSession[0].pageViews || 0) + 1,
          exitPage: entryPage || existingSession[0].exitPage,
        })
        .where(eq(visitorSessions.sessionId, sessionId));
      
      console.log('✅ Session updated:', sessionId);
      return NextResponse.json({ 
        success: true, 
        message: 'Session updated successfully' 
      });
    }
    
  } catch (error) {
    console.error('❌ Session update error:', error);
    return NextResponse.json(
      { error: 'Failed to update session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}