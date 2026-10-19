// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { posts, adminUsers, adminRoles } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    // ========== 1. USER FROM JWT ==========
    let user = { name: "Admin", role: "Admin" as "Admin" | "Editor" };
    try {
      const cookieStore = await cookies();
      const authToken = cookieStore.get("authToken")?.value;
      if (authToken) {
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as {
          id: number; email: string; name: string; role: string;
        };
        user = {
          name: decoded.name || "Admin",
          role: (decoded.role === "editor" ? "Editor" : "Admin") as "Admin" | "Editor",
        };
      }
    } catch (err) { console.error("Auth error:", err); }

    // ========== 2. OVERALL STATS ==========
    const [result] = await db
      .select({
        totalPosts: sql<number>`count(*)::int`,
        published: sql<number>`count(case when status = 'published' then 1 end)::int`,
        drafts: sql<number>`count(case when status = 'draft' then 1 end)::int`,
        archived: sql<number>`count(case when status = 'archived' then 1 end)::int`,
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
    } catch { editors = 0; }

    // ========== 4. WEEKLY GROWTH ==========
    const weeklyGrowth = (() => {
      const thisWeek = result.publishedThisWeek || 0;
      const lastWeek = result.publishedLastWeek || 0;
      if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
      return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    })();

    // ========== 5. RECENT POSTS ==========
    let recentPosts: Array<{
      id: number; title: string; type: string; status: string; createdAt: string;
    }> = [];
    try {
      const recent = await db
        .select({
          id: posts.id, title: posts.title, type: posts.type,
          status: posts.status, createdAt: posts.createdAt,
        })
        .from(posts)
        .orderBy(desc(posts.createdAt))
        .limit(5);
      recentPosts = recent.map((p) => ({
        id: p.id, title: p.title, type: p.type,
        status: p.status || "draft",
        createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
      }));
    } catch (err) { console.error("Recent posts error:", err); }

    // ========== 6. ✅ ALL USERS (with role JOIN) ==========
    let allUsers: Array<{
      id: number;
      name: string;
      email: string;
      role: string;
      totalPosts: number;
      published: number;
      drafts: number;
      archived: number;
      lastActive: string | null;
    }> = [];

    try {
      // ✅ Users with role name (JOIN)
      const users = await db
        .select({
          id: adminUsers.id,
          name: adminUsers.name,
          email: adminUsers.email,
          roleId: adminUsers.roleId,
          roleName: adminRoles.name,
          lastLogin: adminUsers.lastLogin,
        })
        .from(adminUsers)
        .leftJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id));

      // Posts grouped by author
      const postsByAuthor = await db
        .select({
          authorName: posts.authorName,
          totalPosts: sql<number>`count(*)::int`,
          published: sql<number>`count(case when ${posts.status} = 'published' then 1 end)::int`,
          drafts: sql<number>`count(case when ${posts.status} = 'draft' then 1 end)::int`,
          archived: sql<number>`count(case when ${posts.status} = 'archived' then 1 end)::int`,
          lastActive: sql<string>`max(${posts.updatedAt})`,
        })
        .from(posts)
        .groupBy(posts.authorName);

      allUsers = users.map((u) => {
        const stat = postsByAuthor.find((s) => s.authorName === u.name);
        return {
          id: u.id,
          name: u.name,
          email: u.email || "",
          role: u.roleName || "Editor",  // ✅ roleName use karo
          totalPosts: stat?.totalPosts || 0,
          published: stat?.published || 0,
          drafts: stat?.drafts || 0,
          archived: stat?.archived || 0,
          lastActive: stat?.lastActive || (u.lastLogin ? u.lastLogin.toISOString() : null),
        };
      }).sort((a, b) => b.totalPosts - a.totalPosts);
    } catch (err) {
      console.error("Users error:", err);
    }

    // ========== 7. USER ACTIVITY ==========
    const { searchParams } = new URL(req.url);
    const selectedUser = searchParams.get("user");

    let userActivity: Array<{
      id: number; title: string; type: string; status: string;
      createdAt: string; updatedAt: string; action: string;
    }> = [];

    if (selectedUser) {
      try {
        const userPosts = await db
          .select({
            id: posts.id, title: posts.title, type: posts.type,
            status: posts.status, createdAt: posts.createdAt, updatedAt: posts.updatedAt,
          })
          .from(posts)
          .where(eq(posts.authorName, selectedUser))
          .orderBy(desc(posts.updatedAt))
          .limit(20);

        userActivity = userPosts.map((p) => {
          const created = p.createdAt ? new Date(p.createdAt).getTime() : 0;
          const updated = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
          const diff = updated - created;

          let action = "Created";
          if (diff > 60000) {
            if (p.status === "published") action = "Published";
            else if (p.status === "draft") action = "Updated";
            else if (p.status === "archived") action = "Archived";
            else action = "Edited";
          }

          return {
            id: p.id, title: p.title, type: p.type,
            status: p.status || "draft",
            createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
            action,
          };
        });
      } catch (err) { console.error("User activity error:", err); }
    }

    return NextResponse.json({
      user,
      data: {
        totalPosts: result.totalPosts || 0,
        published: result.published || 0,
        drafts: result.drafts || 0,
        archived: result.archived || 0,
        editors,
        weeklyGrowth,
      },
      recentPosts,
      allUsers,
      userActivity,
    });
  } catch (err) {
    console.error("❌ Dashboard API error:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}