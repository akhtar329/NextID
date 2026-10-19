// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { posts, adminUsers } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    // ========== 1. USER INFO FROM JWT COOKIE ==========
    let user = { name: "Admin", role: "Admin" as "Admin" | "Editor" };

    try {
      const cookieStore = await cookies();
      const authToken = cookieStore.get("authToken")?.value;

      if (authToken) {
        const decoded = jwt.verify(
          authToken,
          process.env.JWT_SECRET!
        ) as { id: number; email: string; name: string; role: string };

        user = {
          name: decoded.name || "Admin",
          role: (decoded.role === "editor" ? "Editor" : "Admin") as "Admin" | "Editor",
        };
      }
    } catch (authErr) {
      console.error("Auth decode error:", authErr);
      // Continue with default user
    }

    // ========== 2. POST STATS ==========
    const [result] = await db
      .select({
        totalPosts: sql<number>`count(*)::int`,
        published: sql<number>`count(case when status = 'published' then 1 end)::int`,
        drafts: sql<number>`count(case when status = 'draft' then 1 end)::int`,
        publishedThisWeek: sql<number>`count(case when status = 'published' and published_at >= now() - interval '7 days' then 1 end)::int`,
        publishedLastWeek: sql<number>`count(case when status = 'published' and published_at >= now() - interval '14 days' and published_at < now() - interval '7 days' then 1 end)::int`,
      })
      .from(posts);

    // ========== 3. EDITORS COUNT ==========
    let editors = 0;
    try {
      const [editorResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(adminUsers);
      editors = editorResult?.count || 0;
    } catch {
      // adminUsers table might not exist or have different structure
      editors = 0;
    }

    // ========== 4. WEEKLY GROWTH CALCULATION ==========
    const weeklyGrowth = (() => {
      const thisWeek = result.publishedThisWeek || 0;
      const lastWeek = result.publishedLastWeek || 0;
      if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
      return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    })();

    // ========== 5. RECENT POSTS ==========
    let recentPosts: Array<{
      id: number;
      title: string;
      type: string;
      status: string;
      createdAt: string;
    }> = [];

    try {
      const recent = await db
        .select({
          id: posts.id,
          title: posts.title,
          type: posts.type,
          status: posts.status,
          createdAt: posts.createdAt,
        })
        .from(posts)
        .orderBy(desc(posts.createdAt))
        .limit(5);

      recentPosts = recent.map((p) => ({
        id: p.id,
        title: p.title,
        type: p.type,
        status: p.status || "draft",
        createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
      }));
    } catch (recentErr) {
      console.error("Recent posts error:", recentErr);
    }

    // ========== 6. RETURN ==========
    return NextResponse.json({
      user,
      data: {
        totalPosts: result.totalPosts || 0,
        published: result.published || 0,
        drafts: result.drafts || 0,
        editors,
        weeklyGrowth,
      },
      recentPosts,
    });
  } catch (err) {
    console.error("❌ Dashboard API error:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}