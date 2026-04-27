import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { pageViews, visitorSessions, dailyStats } from '@/app/lib/schema';
import { desc, sql, and, between, eq } from 'drizzle-orm';

// Define types
interface DailyStatsType {
  date: string;
  pageViews: number;
  visitors: number;
}

interface VisitorLocationType {
  lat: string | null;
  lng: string | null;
  weight: number;
  city: string | null;
  country: string | null;
  lastVisit: string | null;
}

interface RecentViewType {
  id: number;
  pagePath: string;
  deviceType: string;
  country: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
  viewedAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let period = searchParams.get('period') || '24h';
    const countryFilter = searchParams.get('country');
    const cityFilter = searchParams.get('city');
    
    // Date range calculate
    const now = new Date();
    let startDate: Date;
    const endDate = new Date();
    
    switch (period) {
      case '24h':
        startDate = new Date(now);
        startDate.setHours(startDate.getHours() - 24);
        break;
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(startDate.getHours() - 24);
        period = '24h';
    }
    
    // ✅ FIX: Build where conditions with proper typing
    let conditions: any = between(pageViews.viewedAt, startDate, endDate);
    
    if (countryFilter && countryFilter !== 'all') {
      conditions = and(conditions, eq(pageViews.country, countryFilter));
    }
    
    if (cityFilter && cityFilter !== 'all') {
      conditions = and(conditions, eq(pageViews.city, cityFilter));
    }
    
    // 1. Overview stats
    const [totalPageViewsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageViews)
      .where(conditions);
    
    const [uniqueVisitorsResult] = await db
      .select({ count: sql<number>`count(distinct ${pageViews.visitorId})` })
      .from(pageViews)
      .where(conditions);
    
    // Active visitors (always last 5 minutes, no period filter)
    let activeVisitorsCount = 0;
    try {
      const activeVisitorsRaw = await db.execute(sql`
        SELECT COUNT(DISTINCT visitor_id) as active_count
        FROM page_views 
        WHERE viewed_at > NOW() - INTERVAL '5 minutes'
      `);
      
      activeVisitorsCount = Number(activeVisitorsRaw.rows[0]?.active_count || 0);
      
      if (activeVisitorsCount === 0) {
        const sessionsRaw = await db.execute(sql`
          SELECT COUNT(DISTINCT visitor_id) as active_count
          FROM visitor_sessions 
          WHERE last_active > NOW() - INTERVAL '5 minutes'
        `);
        activeVisitorsCount = Number(sessionsRaw.rows[0]?.active_count || 0);
      }
    } catch (err) {
      console.error('Error calculating active visitors:', err);
    }
    
    // 2. Page wise breakdown
    const pageBreakdown = await db
      .select({
        pagePath: pageViews.pagePath,
        views: sql<number>`count(*)`,
        uniqueVisitors: sql<number>`count(distinct ${pageViews.visitorId})`,
      })
      .from(pageViews)
      .where(conditions)
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
      .where(conditions)
      .groupBy(pageViews.deviceType);
    
    // 4. Country breakdown
    const countryBreakdown = await db
      .select({
        country: pageViews.country,
        count: sql<number>`count(*)`,
      })
      .from(pageViews)
      .where(conditions)
      .groupBy(pageViews.country)
      .orderBy(sql`count(*) desc`)
      .limit(5);
    
    // 5. City breakdown
    let cityConditions: any = conditions;
    if (!cityFilter) {
      cityConditions = and(conditions, sql`${pageViews.country} = 'Pakistan'`);
    }
    
    const cityBreakdown = await db
      .select({
        city: pageViews.city,
        count: sql<number>`count(*)`,
      })
      .from(pageViews)
      .where(cityConditions)
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
        latitude: pageViews.latitude,
        longitude: pageViews.longitude,
        viewedAt: pageViews.viewedAt,
      })
      .from(pageViews)
      .where(conditions)
      .orderBy(desc(pageViews.viewedAt))
      .limit(10);
    
    // 7. Daily stats for chart
    let dailyStatsData: DailyStatsType[] = [];
    try {
      const fallbackResult = await db
        .select({
          date: sql<string>`DATE(${pageViews.viewedAt})`,
          pageViews: sql<number>`COUNT(*)`,
          visitors: sql<number>`COUNT(DISTINCT ${pageViews.visitorId})`,
        })
        .from(pageViews)
        .where(conditions)
        .groupBy(sql`DATE(${pageViews.viewedAt})`)
        .orderBy(sql`DATE(${pageViews.viewedAt})`);
      
      dailyStatsData = fallbackResult as unknown as DailyStatsType[];
    } catch (err) {
      dailyStatsData = [];
    }
    
    // 8. Visitor locations for Google Maps (with period filter)
    let visitorLocations: VisitorLocationType[] = [];
    try {
      const result = await db
        .select({
          lat: pageViews.latitude,
          lng: pageViews.longitude,
          weight: sql<number>`COUNT(*)`,
          city: pageViews.city,
          country: pageViews.country,
          lastVisit: sql<string>`MAX(${pageViews.viewedAt})`,
        })
        .from(pageViews)
        .where(
          and(
            conditions,
            sql`${pageViews.latitude} IS NOT NULL`,
            sql`${pageViews.longitude} IS NOT NULL`
          )
        )
        .groupBy(pageViews.latitude, pageViews.longitude, pageViews.city, pageViews.country)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(100);
      
      visitorLocations = result as VisitorLocationType[];
    } catch (err) {
      // Silent fail
    }
    
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
    
    // Format city breakdown
    const cityStats = cityBreakdown.reduce((acc, item) => {
      if (item.city && item.city !== 'Unknown') {
        acc[item.city] = Number(item.count);
      }
      return acc;
    }, {} as Record<string, number>);
    
    const responseData = {
      overview: {
        totalPageViews: Number(totalPageViewsResult?.count) || 0,
        uniqueVisitors: Number(uniqueVisitorsResult?.count) || 0,
        activeVisitors: activeVisitorsCount,
      },
      pageBreakdown,
      deviceBreakdown: deviceStats,
      countryBreakdown: countryStats,
      cityBreakdown: cityStats,
      recentViews: recentViews as RecentViewType[],
      dailyStats: dailyStatsData,
      visitorLocations,
      filters: {
        period,
        country: countryFilter || null,
        city: cityFilter || null,
      },
    };
    
    return NextResponse.json({
      success: true,
      data: responseData,
    });
    
  } catch (error) {
    console.error('❌ Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
