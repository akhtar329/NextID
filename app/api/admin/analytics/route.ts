// app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { pageViews, visitorSessions, dailyStats } from '@/app/lib/schema';
import { desc, sql, and, between } from 'drizzle-orm';

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
    const period = searchParams.get('period') || 'week';
    
    // Date range calculate
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
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
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
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
    
    // 5. City breakdown
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
        latitude: pageViews.latitude,
        longitude: pageViews.longitude,
        viewedAt: pageViews.viewedAt,
      })
      .from(pageViews)
      .where(between(pageViews.viewedAt, startDate, endDate))
      .orderBy(desc(pageViews.viewedAt))
      .limit(10);
    
    // 7. Daily stats for chart - using page_views directly if dailyStats is empty
    let dailyStatsData: DailyStatsType[] = [];
    try {
      // First try to get from dailyStats table
      const result = await db
        .select({
          date: dailyStats.date,
          pageViews: dailyStats.totalPageViews,
          visitors: dailyStats.totalVisitors,
        })
        .from(dailyStats)
        .where(sql`${dailyStats.date} >= ${startDate.toISOString().split('T')[0]}`)
        .orderBy(dailyStats.date);
      
      if (result && result.length > 0) {
        dailyStatsData = result as DailyStatsType[];
      } else {
        // Fallback: Calculate from page_views directly
        const fallbackResult = await db
          .select({
            date: sql<string>`DATE(${pageViews.viewedAt})`,
            pageViews: sql<number>`COUNT(*)`,
            visitors: sql<number>`COUNT(DISTINCT ${pageViews.visitorId})`,
          })
          .from(pageViews)
          .where(between(pageViews.viewedAt, startDate, endDate))
          .groupBy(sql`DATE(${pageViews.viewedAt})`)
          .orderBy(sql`DATE(${pageViews.viewedAt})`);
        
        dailyStatsData = fallbackResult as unknown as DailyStatsType[];
      }
    } catch (err) {
      // Final fallback: empty array
      dailyStatsData = [];
    }
    
    // 8. Visitor locations for Google Maps
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
            between(pageViews.viewedAt, startDate, endDate),
            sql`${pageViews.latitude} IS NOT NULL`,
            sql`${pageViews.longitude} IS NOT NULL`
          )
        )
        .groupBy(pageViews.latitude, pageViews.longitude, pageViews.city, pageViews.country)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(100);
      
      visitorLocations = result as VisitorLocationType[];
 
    } catch (err) {
  
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
        activeVisitors: Number(activeVisitorsResult?.count) || 0,
      },
      pageBreakdown,
      deviceBreakdown: deviceStats,
      countryBreakdown: countryStats,
      cityBreakdown: cityStats,
      recentViews: recentViews as RecentViewType[],
      dailyStats: dailyStatsData,
      visitorLocations,
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