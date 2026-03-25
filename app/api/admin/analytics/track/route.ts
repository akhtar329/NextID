// app/api/admin/analytics/track/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { pageViews, visitorSessions, dailyStats } from '@/app/lib/schema';
import { getLocationFromIP } from '@/app/lib/location';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               '0.0.0.0';
    
    const {
      visitorId,
      sessionId,
      isNewVisitor,
      pagePath,
      pageTitle,
      referrer,
      deviceType,
      browser,
      os,
      screenSize,
      timestamp
    } = data;
    
    if (!visitorId || !sessionId || !pagePath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get location
    const location = await getLocationFromIP(ip);
    
    const finalDeviceType = deviceType || 'unknown';
    const finalBrowser = browser || 'unknown';
    const finalOs = os || 'unknown';
    const viewTime = new Date(timestamp || Date.now());
    
    // 1. Insert page view
    await db.insert(pageViews).values({
      visitorId,
      sessionId,
      pagePath,
      pageTitle: pageTitle || pagePath,
      deviceType: finalDeviceType,
      browser: finalBrowser,
      os: finalOs,
      referrer: referrer || 'direct',
      country: location?.country || 'Unknown',
      countryCode: location?.countryCode || 'UN',
      city: location?.city || 'Unknown',
      region: location?.region || 'Unknown',
      latitude: location?.latitude || '0',
      longitude: location?.longitude || '0',
      timezone: location?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      viewedAt: viewTime,
    });
    
    // 2. Session update
    const existingSession = await db
      .select()
      .from(visitorSessions)
      .where(eq(visitorSessions.sessionId, sessionId))
      .limit(1);
    
    if (existingSession.length === 0) {
      await db.insert(visitorSessions).values({
        visitorId,
        sessionId,
        entryPage: pagePath,
        exitPage: pagePath,
        pageViews: 1,
        country: location?.country || 'Unknown',
        city: location?.city || 'Unknown',
        latitude: location?.latitude || '0',
        longitude: location?.longitude || '0',
        deviceType: finalDeviceType,
        browser: finalBrowser,
        os: finalOs,
        startedAt: viewTime,
        lastActive: viewTime,
        duration: 0,
      });
    } else {
      await db
        .update(visitorSessions)
        .set({
          pageViews: (existingSession[0].pageViews || 0) + 1,
          lastActive: viewTime,
          exitPage: pagePath,
          duration: sql`EXTRACT(EPOCH FROM (${viewTime.toISOString()}::timestamp - ${visitorSessions.startedAt}))`,
        })
        .where(eq(visitorSessions.sessionId, sessionId));
    }
    
    // 3. Daily stats update - ✅ FIXED with UPSERT
    const today = new Date().toISOString().split('T')[0];
    const country = location?.country || 'Unknown';
    const city = location?.city || 'Unknown';
    
    // Get existing daily stats
    const existingDailyStat = await db
      .select()
      .from(dailyStats)
      .where(eq(dailyStats.date, today))
      .limit(1);
    
    if (existingDailyStat.length === 0) {
      // Insert new record
      const cityBreakdown: Record<string, number> = {};
      if (country === 'Pakistan' || country === 'PK') {
        cityBreakdown[city] = 1;
      }
      
      await db.insert(dailyStats).values({
        date: today,
        totalVisitors: isNewVisitor ? 1 : 0,
        newVisitors: isNewVisitor ? 1 : 0,
        returningVisitors: isNewVisitor ? 0 : 1,
        totalPageViews: 1,
        topPages: JSON.stringify([{ path: pagePath, views: 1 }]),
        deviceBreakdown: JSON.stringify({ [finalDeviceType]: 1 }),
        countryBreakdown: JSON.stringify({ [country]: 1 }),
        cityBreakdown: JSON.stringify(cityBreakdown),
        avgLoadTime: 0,
        avgApiLatency: 0,
        bounceRate: 0,
      });
    } else {
      // Update existing record
      const existing = existingDailyStat[0];
      const topPages = safeJsonParse(existing.topPages, []);
      const deviceBreakdown = safeJsonParse(existing.deviceBreakdown, {});
      const countryBreakdown = safeJsonParse(existing.countryBreakdown, {});
      const cityBreakdown = safeJsonParse(existing.cityBreakdown, {});
      
      // Update top pages
      const pageIndex = Array.isArray(topPages) 
        ? topPages.findIndex((p: any) => p?.path === pagePath)
        : -1;
        
      if (pageIndex >= 0 && topPages[pageIndex]) {
        topPages[pageIndex].views = (topPages[pageIndex].views || 0) + 1;
      } else {
        topPages.push({ path: pagePath, views: 1 });
      }
      
      // Update device breakdown
      deviceBreakdown[finalDeviceType] = (deviceBreakdown[finalDeviceType] || 0) + 1;
      
      // Update country breakdown
      countryBreakdown[country] = (countryBreakdown[country] || 0) + 1;
      
      // Update city breakdown (Pakistan only)
      if (country === 'Pakistan' || country === 'PK') {
        cityBreakdown[city] = (cityBreakdown[city] || 0) + 1;
      }
      
      await db
        .update(dailyStats)
        .set({
          totalVisitors: (existing.totalVisitors || 0) + (isNewVisitor ? 1 : 0),
          newVisitors: (existing.newVisitors || 0) + (isNewVisitor ? 1 : 0),
          returningVisitors: (existing.returningVisitors || 0) + (isNewVisitor ? 0 : 1),
          totalPageViews: (existing.totalPageViews || 0) + 1,
          topPages: JSON.stringify(topPages.slice(0, 10)),
          deviceBreakdown: JSON.stringify(deviceBreakdown),
          countryBreakdown: JSON.stringify(countryBreakdown),
          cityBreakdown: JSON.stringify(cityBreakdown),
          updatedAt: new Date(),
        })
        .where(eq(dailyStats.date, today));
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Page view tracked successfully'
    });
    
  } catch (error) {
    console.error('❌ Analytics track error:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function safeJsonParse(data: any, fallback: any) {
  if (!data) return fallback;
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return fallback;
  }
}