// app/api/admin/analytics/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { visitorSessions } from '@/app/lib/schema';
import { eq } from 'drizzle-orm';

// Rate limiting map
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimit.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  
  if (record.count > 10) {
    return true;
  }
  
  record.count++;
  rateLimit.set(ip, record);
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  if (isRateLimited(String(ip))) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
  
  try {
    const data = await request.json();
    const { 
      visitorId, 
      sessionId, 
      entryPage, 
      pageViews, 
      startedAt, 
      lastActive,
      action,
      deviceType,
      browser,
      os,
      country,
      city,
      latitude,
      longitude,
    } = data;
    
    
    // ✅ Heartbeat - ONLY check session exists, NO lastActive update
    if (action === 'heartbeat') {
      if (!sessionId) {
        return NextResponse.json(
          { error: 'sessionId is required for heartbeat' },
          { status: 400 }
        );
      }
      
      const existingSession = await db
        .select()
        .from(visitorSessions)
        .where(eq(visitorSessions.sessionId, sessionId))
        .limit(1);
      
      if (existingSession.length > 0) {
        
        return NextResponse.json({ 
          success: true, 
          message: 'Heartbeat received' 
        });
      } else {
        // Session doesn't exist, create it
        await db.insert(visitorSessions).values({
          visitorId: visitorId || 'unknown',
          sessionId,
          entryPage: entryPage || '/',
          exitPage: entryPage || '/',
          pageViews: 1,
          startedAt: new Date(),
          lastActive: new Date(),
        });
        
        return NextResponse.json({ 
          success: true, 
          message: 'Session created from heartbeat' 
        });
      }
    }
    
    // ✅ For end action
    if (action === 'end') {
      if (!sessionId) {
        return NextResponse.json(
          { error: 'sessionId is required' },
          { status: 400 }
        );
      }
      
      const existingSession = await db
        .select()
        .from(visitorSessions)
        .where(eq(visitorSessions.sessionId, sessionId))
        .limit(1);
      
      if (existingSession.length > 0) {
        const session = existingSession[0];
        const now = new Date();
        let startedAtTime: number;
        
        if (session.startedAt) {
          startedAtTime = new Date(session.startedAt).getTime();
        } else {
          startedAtTime = now.getTime();
        }
        
        const duration = Math.floor((now.getTime() - startedAtTime) / 1000);
        
        await db
          .update(visitorSessions)
          .set({
            endedAt: now,
            duration: duration > 0 ? duration : 0,
          })
          .where(eq(visitorSessions.sessionId, sessionId));
          
        return NextResponse.json({ 
          success: true, 
          message: 'Session ended successfully',
          duration
        });
      }
    }
    
    // ✅ For non-heartbeat requests, require both visitorId and sessionId
    if (!visitorId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: visitorId and sessionId are required' },
        { status: 400 }
      );
    }
    
    // Bot detection
    const userAgent = request.headers.get('user-agent') || '';
    const isBot = /bot|crawl|spider|scraper|facebookexternalhit|whatsapp|slack|discord|telegram|baidu|bingbot|googlebot|twitterbot/i.test(userAgent);
    
    if (isBot) {
      return NextResponse.json({ 
        success: true, 
        message: 'Bot session ignored',
        ignored: true
      });
    }
    
    const existingSession = await db
      .select()
      .from(visitorSessions)
      .where(eq(visitorSessions.sessionId, sessionId))
      .limit(1);
    
    if (existingSession.length === 0) {
      // Create new session
      let startedAtDate: Date;
      let lastActiveDate: Date;
      
      if (startedAt && typeof startedAt === 'string') {
        startedAtDate = new Date(startedAt);
      } else {
        startedAtDate = new Date();
      }
      
      if (lastActive && typeof lastActive === 'string') {
        lastActiveDate = new Date(lastActive);
      } else {
        lastActiveDate = new Date();
      }
      
      await db.insert(visitorSessions).values({
        visitorId,
        sessionId,
        entryPage: entryPage || '/',
        exitPage: entryPage || '/',
        pageViews: pageViews || 1,
        startedAt: startedAtDate,
        lastActive: lastActiveDate,
        deviceType: deviceType || null,
        browser: browser || null,
        os: os || null,
        country: country || null,
        city: city || null,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Session created successfully',
        isNew: true
      });
    } else {
      // Update existing session (but NOT lastActive - Track API handles that)
      const session = existingSession[0];
      const now = new Date();
      
      // ✅ Check if this is a real page view or just a refresh
      const timeSinceLastActive = now.getTime() - new Date(session.lastActive || now).getTime();
      const isNewPageView = timeSinceLastActive > 60000; // 1 minute threshold
      
      await db
        .update(visitorSessions)
        .set({
          // ❌ REMOVED: lastActive update - Track API handles this
          pageViews: isNewPageView ? (session.pageViews || 0) + 1 : session.pageViews,
          exitPage: entryPage || session.exitPage,
        })
        .where(eq(visitorSessions.sessionId, sessionId));
        
      return NextResponse.json({ 
        success: true, 
        message: 'Session updated successfully',
        pageViews: isNewPageView ? (session.pageViews || 0) + 1 : session.pageViews
      });
    }
    
  } catch (error) {
    console.error('❌ Session API error:', error);
    return NextResponse.json(
      { error: 'Failed to process session request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }
    
    const session = await db
      .select()
      .from(visitorSessions)
      .where(eq(visitorSessions.sessionId, sessionId))
      .limit(1);
    
    if (session.length === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      session: {
        id: session[0].id,
        visitorId: session[0].visitorId,
        sessionId: session[0].sessionId,
        pageViews: session[0].pageViews,
        startedAt: session[0].startedAt,
        lastActive: session[0].lastActive,
        duration: session[0].duration,
        deviceType: session[0].deviceType,
        country: session[0].country,
        city: session[0].city,
      }
    });
  } catch (error) {
    console.error('❌ Session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
