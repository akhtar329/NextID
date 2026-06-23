import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const [result] = await db
      .select({
        totalPosts: sql<number>`count(*)`,
        published: sql<number>`count(case when status = 'published' then 1 end)`,
        drafts: sql<number>`count(case when status = 'draft' then 1 end)`,
      })
      .from(posts);

    return Response.json({
      data: {
        totalPosts: result.totalPosts,
        published: result.published,
        drafts: result.drafts,
      },
    });
  } catch (err) {
    return Response.json(
      { error: "DB error" },
      { status: 500 }
    );
  }
}