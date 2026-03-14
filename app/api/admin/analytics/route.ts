// app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { pageViews, visitorSessions, dailyStats } from '@/app/lib/schema';
import { eq, desc, sql, and, between } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // today, week, month
    
    // Date range calculate karo
    const today = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'today':
        startDate = new Date(today.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(today.setMonth(today.getMonth() - 1));
        break;
      default:
        startDate = new Date(today.setDate(today.getDate() - 7));
    }
    
    const endDate = new Date();
    
    // 1. Overview stats
    const [totalPageViewsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageViews)
      .where(between(pageViews.viewedAt, startDate, endDate));
    
    const [uniqueVisitorsResult] = await db
      .select({ count: sql<number>`count(distinct ${pageViews.visitorId})` })
      .from(pageViews)
      .where(between(pageViews.viewedAt, startDate, endDate));
    
    const [activeVisitorsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(visitorSessions)
      .where(
        and(
          sql`${visitorSessions.lastActive} > ${new Date(Date.now() - 5 * 60 * 1000)}`,
          sql`${visitorSessions.endedAt} IS NULL`
        )
      );
    
    // 2. Page wise breakdown
    const pageBreakdown = await db
      .select({
        pagePath: pageViews.pagePath,
        views: sql<number>`count(*)`,
        uniqueVisitors: sql<number>`count(distinct ${pageViews.visitorId})`,
      })
      .from(pageViews)
      .where(between(pageViews.viewedAt, startDate, endDate))
      .groupBy(pageViews.pagePath)
      .orderBy(sql`count(*) desc`)
      .limit(10);
    
    // 3. Device breakdown
    const deviceBreakdown = await db
      .select({
        deviceType: pageViews.deviceType,
        count: sql<number>`count(*)`,
      })
      .from(pageViews)
      .where(between(pageViews.viewedAt, startDate, endDate))
      .groupBy(pageViews.deviceType);
    
    // 4. Country breakdown
    const countryBreakdown = await db
      .select({
        country: pageViews.country,
        count: sql<number>`count(*)`,
      })
      .from(pageViews)
      .where(between(pageViews.viewedAt, startDate, endDate))
      .groupBy(pageViews.country)
      .orderBy(sql`count(*) desc`)
      .limit(5);
    
    // 5. ✅ NEW - City breakdown (Pakistan cities only)
    const cityBreakdown = await db
      .select({
        city: pageViews.city,
        count: sql<number>`count(*)`,
      })
      .from(pageViews)
      .where(
        and(
          between(pageViews.viewedAt, startDate, endDate),
          sql`${pageViews.country} = 'Pakistan'`
        )
      )
      .groupBy(pageViews.city)
      .orderBy(sql`count(*) desc`)
      .limit(10);
    
    // 6. Recent views
    const recentViews = await db
      .select({
        id: pageViews.id,
        pagePath: pageViews.pagePath,
        deviceType: pageViews.deviceType,
        country: pageViews.country,
        city: pageViews.city,
        viewedAt: pageViews.viewedAt,
      })
      .from(pageViews)
      .where(between(pageViews.viewedAt, startDate, endDate))
      .orderBy(desc(pageViews.viewedAt))
      .limit(10);
    
    // 7. Daily stats for chart
    const dailyStatsData = await db
      .select({
        date: dailyStats.date,
        pageViews: dailyStats.totalPageViews,
        visitors: dailyStats.totalVisitors,
        cityBreakdown: dailyStats.cityBreakdown, // ✅ NEW - city data bhi le lo
      })
      .from(dailyStats)
      .where(sql`${dailyStats.date} >= ${startDate.toISOString().split('T')[0]}`)
      .orderBy(dailyStats.date);
    
    // Format device breakdown
    const deviceStats = deviceBreakdown.reduce((acc, item) => {
      acc[item.deviceType || 'unknown'] = Number(item.count);
      return acc;
    }, {} as Record<string, number>);
    
    // Format country breakdown
    const countryStats = countryBreakdown.reduce((acc, item) => {
      acc[item.country || 'Unknown'] = Number(item.count);
      return acc;
    }, {} as Record<string, number>);
    
    // ✅ NEW - Format city breakdown
    const cityStats = cityBreakdown.reduce((acc, item) => {
      if (item.city && item.city !== 'Unknown') {
        acc[item.city] = Number(item.count);
      }
      return acc;
    }, {} as Record<string, number>);
    
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalPageViews: Number(totalPageViewsResult?.count) || 0,
          uniqueVisitors: Number(uniqueVisitorsResult?.count) || 0,
          activeVisitors: Number(activeVisitorsResult?.count) || 0,
        },
        pageBreakdown,
        deviceBreakdown: deviceStats,
        countryBreakdown: countryStats,
        cityBreakdown: cityStats, // ✅ NEW
        recentViews,
        dailyStats: dailyStatsData,
      },
    });
    
  } catch (error) {
    console.error('❌ Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}