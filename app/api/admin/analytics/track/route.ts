// app/api/admin/analytics/track/route.ts


import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { pageViews, visitorSessions, dailyStats } from '@/app/lib/schema';
import { getHybridLocation } from '@/app/lib/analytics/hybrid-location'; // 👈 Use hybrid location
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
    
    // 🌍 Use HYBRID LOCATION (GPS + Timezone + IP)
    const location = await getHybridLocation();
    
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
    
    // 3. Daily stats update
    const today = new Date().toISOString().split('T')[0];
    const [dailyStat] = await db
      .select()
      .from(dailyStats)
      .where(eq(dailyStats.date, today))
      .limit(1);
    
    if (!dailyStat) {
      const cityBreakdown: Record<string, number> = {};
      const country = location?.country || 'Unknown';
      const city = location?.city || 'Unknown';
      
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
      const topPages = safeJsonParse(dailyStat.topPages, []);
      const deviceBreakdown = safeJsonParse(dailyStat.deviceBreakdown, {});
      const countryBreakdown = safeJsonParse(dailyStat.countryBreakdown, {});
      const cityBreakdown = safeJsonParse(dailyStat.cityBreakdown, {});
      
      const pageIndex = Array.isArray(topPages) 
        ? topPages.findIndex((p: any) => p?.path === pagePath)
        : -1;
        
      if (pageIndex >= 0 && topPages[pageIndex]) {
        topPages[pageIndex].views = (topPages[pageIndex].views || 0) + 1;
      } else {
        topPages.push({ path: pagePath, views: 1 });
      }
      
      deviceBreakdown[finalDeviceType] = (deviceBreakdown[finalDeviceType] || 0) + 1;
      
      const country = location?.country || 'Unknown';
      countryBreakdown[country] = (countryBreakdown[country] || 0) + 1;
      
      if (country === 'Pakistan' || country === 'PK') {
        const city = location?.city || 'Unknown';
        cityBreakdown[city] = (cityBreakdown[city] || 0) + 1;
      }
      
      await db
        .update(dailyStats)
        .set({
          totalVisitors: sql`${dailyStats.totalVisitors} + ${isNewVisitor ? 1 : 0}`,
          newVisitors: sql`${dailyStats.newVisitors} + ${isNewVisitor ? 1 : 0}`,
          returningVisitors: sql`${dailyStats.returningVisitors} + ${isNewVisitor ? 0 : 1}`,
          totalPageViews: sql`${dailyStats.totalPageViews} + 1`,
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