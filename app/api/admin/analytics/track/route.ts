// app/api/admin/analytics/track/route.ts
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
    const existingSession = await db
      .select()
      .from(visitorSessions)
      .where(eq(visitorSessions.sessionId, sessionId))
      .limit(1);
    
    if (existingSession.length > 0) {
      
      // ✅ FIX 1: Check if this is a real page view or just a refresh
      const lastActive = existingSession[0].lastActive || new Date();
      const timeSinceLastActive = new Date().getTime() - new Date(lastActive).getTime();
      const isNewPageView = timeSinceLastActive > 60000; // 1 minute threshold
      
      // Update existing session
      const newLastActive = new Date();
      const newPageViews = isNewPageView ? (existingSession[0].pageViews || 0) + 1 : existingSession[0].pageViews;
      
      await db
        .update(visitorSessions)
        .set({
          lastActive: newLastActive,
          pageViews: newPageViews,
          exitPage: pagePath,
        })
        .where(eq(visitorSessions.sessionId, sessionId));

    } else {
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
    }
    
    return NextResponse.json({ success: true });
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