
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/db";
import { posts, adminUsers, adminRoles } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface DashboardUser {
  name: string;
  role: "Admin" | "Editor";
}

interface DashboardToken {
  id: number;
  email: string;
  name: string;
  role: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isDashboardToken(value: unknown): value is DashboardToken {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "number" &&
    typeof value.email === "string" &&
    typeof value.name === "string" &&
    typeof value.role === "string"
  );
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();

    // 1. USER FROM JWT
    let user: DashboardUser = {
      name: "Admin",
      role: "Admin",
    };

    try {
      const cookieStore = await cookies();
      const authToken = cookieStore.get("authToken")?.value;
      const jwtSecret = process.env.JWT_SECRET;

      if (authToken && jwtSecret) {
        const decoded: unknown = jwt.verify(authToken, jwtSecret);

        if (isDashboardToken(decoded)) {
          user = {
            name: decoded.name || "Admin",
            role: decoded.role.toLowerCase() === "editor"
              ? "Editor"
              : "Admin",
          };
        }
      }
    } catch (error) {
      console.error("Dashboard auth error:", error);
    }

    // 2. OVERALL STATS
    const [result] = await db
      .select({
        totalPosts: sql<number>`count(*)::int`,
        published: sql<number>`count(case when ${posts.status} = 'published' then 1 end)::int`,
        drafts: sql<number>`count(case when ${posts.status} = 'draft' then 1 end)::int`,
        archived: sql<number>`count(case when ${posts.status} = 'archived' then 1 end)::int`,
        publishedThisWeek: sql<number>`count(case when ${posts.status} = 'published' and ${posts.publishedAt} >= now() - interval '7 days' then 1 end)::int`,
        publishedLastWeek: sql<number>`count(case when ${posts.status} = 'published' and ${posts.publishedAt} >= now() - interval '14 days' and ${posts.publishedAt} < now() - interval '7 days' then 1 end)::int`,
      })
      .from(posts);

    // 3. EDITORS COUNT
    let editors = 0;

    try {
      const [editorResult] = await db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(adminUsers);

      editors = editorResult?.count ?? 0;
    } catch (error) {
      console.error("Dashboard users count error:", error);
    }

    // 4. WEEKLY GROWTH
    const thisWeek = result?.publishedThisWeek ?? 0;
    const lastWeek = result?.publishedLastWeek ?? 0;

    const weeklyGrowth =
      lastWeek === 0
        ? thisWeek > 0
          ? 100
          : 0
        : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

    // 5. RECENT POSTS
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

      recentPosts = recent.map((post) => ({
        id: post.id,
        title: post.title,
        type: post.type,
        status: post.status || "draft",
        createdAt: post.createdAt
          ? post.createdAt.toISOString()
          : new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Recent posts error:", error);
    }

    // 6. ALL USERS WITH ROLE AND POST STATISTICS
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

      const postsByAuthor = await db
        .select({
          authorName: posts.authorName,
          totalPosts: sql<number>`count(*)::int`,
          published: sql<number>`count(case when ${posts.status} = 'published' then 1 end)::int`,
          drafts: sql<number>`count(case when ${posts.status} = 'draft' then 1 end)::int`,
          archived: sql<number>`count(case when ${posts.status} = 'archived' then 1 end)::int`,
          lastActive: sql<string | null>`max(${posts.updatedAt})`,
        })
        .from(posts)
        .groupBy(posts.authorName);

      allUsers = users
        .map((u) => {
          const stat = postsByAuthor.find(
            (item) => item.authorName === u.name
          );

          return {
            id: u.id,
            name: u.name,
            email: u.email || "",
            role: u.roleName || "Editor",
            totalPosts: stat?.totalPosts ?? 0,
            published: stat?.published ?? 0,
            drafts: stat?.drafts ?? 0,
            archived: stat?.archived ?? 0,
            lastActive:
              stat?.lastActive ??
              (u.lastLogin ? u.lastLogin.toISOString() : null),
          };
        })
        .sort((a, b) => b.totalPosts - a.totalPosts);
    } catch (error) {
      console.error("Dashboard users error:", error);
    }

    // 7. USER ACTIVITY
    const { searchParams } = new URL(req.url);
    const selectedUser = searchParams.get("user");

    let userActivity: Array<{
      id: number;
      title: string;
      type: string;
      status: string;
      createdAt: string;
      updatedAt: string;
      action: string;
    }> = [];

    if (selectedUser) {
      try {
        const userPosts = await db
          .select({
            id: posts.id,
            title: posts.title,
            type: posts.type,
            status: posts.status,
            createdAt: posts.createdAt,
            updatedAt: posts.updatedAt,
          })
          .from(posts)
          .where(eq(posts.authorName, selectedUser))
          .orderBy(desc(posts.updatedAt))
          .limit(20);

        userActivity = userPosts.map((post) => {
          const created = post.createdAt
            ? new Date(post.createdAt).getTime()
            : 0;

          const updated = post.updatedAt
            ? new Date(post.updatedAt).getTime()
            : 0;

          const diff = updated - created;

          let action = "Created";

          if (diff > 60000) {
            if (post.status === "published") {
              action = "Published";
            } else if (post.status === "draft") {
              action = "Updated";
            } else if (post.status === "archived") {
              action = "Archived";
            } else {
              action = "Edited";
            }
          }

          return {
            id: post.id,
            title: post.title,
            type: post.type,
            status: post.status || "draft",
            createdAt: post.createdAt
              ? post.createdAt.toISOString()
              : new Date().toISOString(),
            updatedAt: post.updatedAt
              ? post.updatedAt.toISOString()
              : new Date().toISOString(),
            action,
          };
        });
      } catch (error) {
        console.error("User activity error:", error);
      }
    }

    return NextResponse.json({
      user,
      data: {
        totalPosts: result?.totalPosts ?? 0,
        published: result?.published ?? 0,
        drafts: result?.drafts ?? 0,
        archived: result?.archived ?? 0,
        editors,
        weeklyGrowth,
      },
      recentPosts,
      allUsers,
      userActivity,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
