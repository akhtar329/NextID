import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { pageViews, visitorSessions } from "@/app/lib/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { 
      visitorId, 
      sessionId, 
      pagePath, 
      pageTitle, 
      referrer,
      deviceType, 
      browser, 
      os,
      country, 
      city, 
      latitude, 
      longitude,
      loadTime,
      apiLatency
    } = body;

    // ✅ REQUIRED FIELDS CHECK
    if (!visitorId || !sessionId || !pagePath) {
      console.error('❌ Missing required fields:', { visitorId, sessionId, pagePath });
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ STEP 1: Check if same session viewed same page in last 30 minutes
    const recentView = await db
      .select()
      .from(pageViews)
      .where(
        and(
          eq(pageViews.sessionId, sessionId),
          eq(pageViews.pagePath, pagePath),
          sql`${pageViews.viewedAt} > NOW() - INTERVAL '30 minutes'`
        )
      )
      .limit(1);
    
    const isDuplicate = recentView.length > 0;
    
    // ✅ STEP 2: Always insert for history (keep all data)
    await db.insert(pageViews).values({
      visitorId,
      sessionId,
      pagePath,
      pageTitle,
      referrer: referrer || null,
      deviceType: deviceType || null,
      browser: browser || null,
      os: os || null,
      country: country || null,
      city: city || null,
      latitude: latitude ? String(latitude) : null,
      longitude: longitude ? String(longitude) : null,
      loadTime: loadTime || null,
      apiLatency: apiLatency || null,
      viewedAt: new Date(),
    });
    
    // ✅ STEP 3: Update or create session
    const existingSession = await db
      .select()
      .from(visitorSessions)
      .where(eq(visitorSessions.sessionId, sessionId))
      .limit(1);
    
    if (existingSession.length > 0) {
      // Update existing session
      const newLastActive = new Date();
      // ✅ Only increment page_views if NOT a duplicate (30 min same page)
      const newPageViews = isDuplicate 
        ? (existingSession[0].pageViews || 0)  // Don't increment on duplicate
        : (existingSession[0].pageViews || 0) + 1;  // Increment on new view
      
      await db
        .update(visitorSessions)
        .set({
          lastActive: newLastActive,
          pageViews: newPageViews,
          exitPage: pagePath,
        })
        .where(eq(visitorSessions.sessionId, sessionId));
        
      console.log(`📊 Session ${sessionId}: pageViews=${newPageViews}, isDuplicate=${isDuplicate}`);
    } else {
      // New session - first page view always counts
      const newSession = {
        visitorId,
        sessionId,
        entryPage: pagePath,
        exitPage: pagePath,
        pageViews: 1,
        country: country || null,
        city: city || null,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        deviceType: deviceType || null,
        browser: browser || null,
        os: os || null,
        startedAt: new Date(),
        lastActive: new Date(),
      };
      
      await db.insert(visitorSessions).values(newSession);
      console.log(`🆕 New session created: ${sessionId}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      isDuplicate,
      message: isDuplicate ? 'Duplicate view - not counted' : 'New view counted'
    });
    
  } catch (error) {
    console.error("❌ ERROR in track API:");
    console.error("  - Error message:", error instanceof Error ? error.message : String(error));
    console.error("  - Full error:", error);
    
    return NextResponse.json(
      { success: false, error: "Failed to track analytics" },
      { status: 500 }
    );
  }
}
