// app/api/admin/analytics/session/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { visitorSessions } from '@/app/lib/schema';
import { eq } from 'drizzle-orm';

// ✅ PUBLIC ENDPOINT - No Authentication Required

export async function POST(request: NextRequest) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
  }

  try {
    const data = await request.json();
    const { visitorId, sessionId, entryPage, pageViews, startedAt, lastActive } = data;
    
    if (!visitorId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: visitorId and sessionId are required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Bot detection
    const userAgent = request.headers.get('user-agent') || '';
    const isBot = /bot|crawl|spider|scraper/i.test(userAgent);
    
    if (isBot) {
      return NextResponse.json({ 
        success: true, 
        message: 'Bot session ignored' 
      }, { headers: corsHeaders });
    }
    
    const existingSession = await db
      .select()
      .from(visitorSessions)
      .where(eq(visitorSessions.sessionId, sessionId))
      .limit(1);
    
    if (existingSession.length === 0) {
      await db.insert(visitorSessions).values({
        visitorId,
        sessionId,
        entryPage: entryPage || '/',
        pageViews: pageViews || 1,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        lastActive: lastActive ? new Date(lastActive) : new Date(),
      });
      return NextResponse.json({ 
        success: true, 
        message: 'Session created successfully' 
      }, { headers: corsHeaders });
    } else {
      await db
        .update(visitorSessions)
        .set({
          lastActive: new Date(),
          pageViews: (existingSession[0].pageViews || 0) + 1,
          exitPage: entryPage || existingSession[0].exitPage,
        })
        .where(eq(visitorSessions.sessionId, sessionId));
      return NextResponse.json({ 
        success: true, 
        message: 'Session updated successfully' 
      }, { headers: corsHeaders });
    }
    
  } catch (error) {
    console.error('❌ Session update error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500, headers: corsHeaders }
    );
  }
}