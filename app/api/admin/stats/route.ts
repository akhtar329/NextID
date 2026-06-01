// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import {
  adminUsers,
  pageViews,
  systemStats,
  visitorSessions,
} from "@/db/schema";
import { eq, gte, count, sql, desc } from "drizzle-orm";
import jwt from "jsonwebtoken";
import os from "os";

export async function GET(request: NextRequest) {
  try {
    // =========================
    // ✅ AUTH CHECK
    // =========================
    const token = request.cookies.get("authToken")?.value;

    // 🔥 DEV MODE BYPASS (optional - remove in production)
    const isDev = process.env.NODE_ENV !== "production";

    if (!token) {
      if (!isDev) {
        return NextResponse.json(
          { success: false, error: "Unauthorized - No token" },
          { status: 401 }
        );
      } else {
        console.warn("⚠️ No token found (DEV MODE - bypassing auth)");
      }
    }

    if (token) {
      try {
        jwt.verify(token, process.env.JWT_SECRET as string);
      } catch (err) {
        if (!isDev) {
          return NextResponse.json(
            { success: false, error: "Unauthorized - Invalid token" },
            { status: 401 }
          );
        } else {
          console.warn("⚠️ Invalid token (DEV MODE - bypassing)");
        }
      }
    }

    // =========================
    // ✅ DATA FETCH
    // =========================

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const activeUsersResult = await db
      .select({ count: count() })
      .from(visitorSessions)
      .where(gte(visitorSessions.lastActive, fiveMinutesAgo));

    const totalUsersResult = await db
      .select({ count: count() })
      .from(adminUsers)
      .where(eq(adminUsers.status, true));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalSessionsResult = await db
      .select({ count: count() })
      .from(visitorSessions)
      .where(gte(visitorSessions.startedAt, today));

    const avgLatencyResult = await db
      .select({ avg: sql<number>`AVG(${pageViews.apiLatency})` })
      .from(pageViews)
      .where(gte(pageViews.viewedAt, fiveMinutesAgo));

    // =========================
    // ✅ SYSTEM STATS
    // =========================

    const uptime = process.uptime();
    const cpuUsage = os.loadavg()[0] * 10;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const memoryUsage = Math.round(
      ((totalMem - freeMem) / totalMem) * 100
    );

    const fallbackDisk = 67;

    const latestStats = await db
      .select()
      .from(systemStats)
      .orderBy(desc(systemStats.recordedAt))
      .limit(1);

    // =========================
    // ✅ FINAL RESPONSE
    // =========================

    const stats = {
      activeUsers: activeUsersResult[0]?.count ?? 0,
      totalUsers: totalUsersResult[0]?.count ?? 0,
      totalSessions: totalSessionsResult[0]?.count ?? 0,
      uptime: Math.floor(uptime),
      cpuUsage: Math.min(Math.round(cpuUsage), 100),
      memoryUsage,
      diskUsage:
        latestStats[0]?.diskUsage !== null &&
        latestStats[0]?.diskUsage !== undefined
          ? Number(latestStats[0].diskUsage)
          : fallbackDisk,
      apiLatency: Math.round(Number(avgLatencyResult[0]?.avg) || 45),
      lastUpdated: new Date().toISOString(),
    };

    // =========================
    // ✅ OPTIONAL SAVE
    // =========================

    try {
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
    } catch (err) {
      console.warn("Stats save failed:", err);
    }

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error("Error fetching stats:", error);

    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
