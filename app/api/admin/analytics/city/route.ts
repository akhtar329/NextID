import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { pageViews } from '@/app/lib/schema';
import { sql, and, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const period = searchParams.get('period') || 'week';
    
    if (!city) {
      return NextResponse.json(
        { error: 'City parameter is required' },
        { status: 400 }
      );
    }
    
    // Date range calculate based on period
    const now = new Date();
    let startDate: Date;
    
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
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
    }
    
    // Get visitors from specific city
    const visitors = await db
      .select({
        id: pageViews.id,
        pagePath: pageViews.pagePath,
        deviceType: pageViews.deviceType,
        browser: pageViews.browser,
        os: pageViews.os,
        country: pageViews.country,
        city: pageViews.city,
        viewedAt: pageViews.viewedAt,
        visitorId: pageViews.visitorId,
      })
      .from(pageViews)
      .where(
        and(
          eq(pageViews.city, city),
          sql`${pageViews.viewedAt} > ${startDate}`
        )
      )
      .orderBy(sql`${pageViews.viewedAt} DESC`)
      .limit(100);
    
    // Get unique visitor count
    const uniqueVisitors = await db
      .select({ count: sql<number>`count(distinct ${pageViews.visitorId})` })
      .from(pageViews)
      .where(
        and(
          eq(pageViews.city, city),
          sql`${pageViews.viewedAt} > ${startDate}`
        )
      );
    
    // Get page breakdown for this city
    const pageBreakdown = await db
      .select({
        pagePath: pageViews.pagePath,
        views: sql<number>`count(*)`,
      })
      .from(pageViews)
      .where(
        and(
          eq(pageViews.city, city),
          sql`${pageViews.viewedAt} > ${startDate}`
        )
      )
      .groupBy(pageViews.pagePath)
      .orderBy(sql`count(*) DESC`)
      .limit(10);
    
    // Get device breakdown for this city
    const deviceBreakdown = await db
      .select({
        deviceType: pageViews.deviceType,
        count: sql<number>`count(*)`,
      })
      .from(pageViews)
      .where(
        and(
          eq(pageViews.city, city),
          sql`${pageViews.viewedAt} > ${startDate}`
        )
      )
      .groupBy(pageViews.deviceType);
    
    return NextResponse.json({
      success: true,
      data: {
        city,
        period,
        totalVisitors: visitors.length,
        uniqueVisitors: Number(uniqueVisitors[0]?.count || 0),
        visitors: visitors.map(v => ({
          id: v.id,
          pagePath: v.pagePath,
          deviceType: v.deviceType,
          browser: v.browser,
          os: v.os,
          country: v.country,
          city: v.city,
          viewedAt: v.viewedAt,
        })),
        pageBreakdown: pageBreakdown.map(p => ({
          pagePath: p.pagePath,
          views: Number(p.views),
        })),
        deviceBreakdown: deviceBreakdown.reduce((acc, item) => {
          acc[item.deviceType || 'unknown'] = Number(item.count);
          return acc;
        }, {} as Record<string, number>),
      },
    });
    
  } catch (error) {
    console.error('❌ City details error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch city details',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}