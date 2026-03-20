import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { 
  adminUsers, 
  pageViews, 
  systemStats,
  visitorSessions  // ✅ Use this instead of sessions
} from "@/app/lib/schema";
import { eq, gte, count, sql, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import os from "os";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ FIX: Use visitorSessions instead of sessions
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const activeUsersResult = await db
      .select({ count: count() })
      .from(visitorSessions)  // 👈 Changed from 'sessions' to 'visitorSessions'
      .where(gte(visitorSessions.lastActive, fiveMinutesAgo));

    // Get total users
    const totalUsersResult = await db
      .select({ count: count() })
      .from(adminUsers)
      .where(eq(adminUsers.status, true));

    // Get total sessions today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalSessionsResult = await db
      .select({ count: count() })
      .from(visitorSessions)
      .where(gte(visitorSessions.startedAt, today));

    // Get average response time from page_views
    const avgLatencyResult = await db
      .select({ avg: sql<number>`AVG(${pageViews.apiLatency})` })
      .from(pageViews)
      .where(gte(pageViews.viewedAt, fiveMinutesAgo));

    // System stats
    const uptime = process.uptime();
    const cpuUsage = os.loadavg()[0] * 10;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);
    
    const diskUsage: number = 67;

    // Get latest recorded stats
    const latestStats = await db
      .select()
      .from(systemStats)
      .orderBy(desc(systemStats.recordedAt))
      .limit(1);

    // Prepare stats
    const stats = {
      activeUsers: activeUsersResult[0]?.count ?? 0,
      totalUsers: totalUsersResult[0]?.count ?? 0,
      totalSessions: totalSessionsResult[0]?.count ?? 0,
      uptime: Math.floor(uptime),
      cpuUsage: Math.min(Math.round(cpuUsage), 100),
      memoryUsage,
      diskUsage: latestStats.length > 0 ? Number(latestStats[0].diskUsage) ?? diskUsage : diskUsage,
      apiLatency: Math.round(Number(avgLatencyResult[0]?.avg) || 45),
      lastUpdated: new Date().toISOString(),
    };

    // Store stats
    await db.insert(systemStats).values({
      activeUsers: stats.activeUsers,
      totalSessions: stats.totalSessions,
      avgResponseTime: stats.apiLatency,
      errorRate: 0,
      cpuUsage: stats.cpuUsage,
      memoryUsage: stats.memoryUsage,
      diskUsage: stats.diskUsage,
      uptime: stats.uptime,
      recordedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}