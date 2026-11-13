
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/db";
import { posts } from "@/db/schema";
import type { CachedPostType } from "@/lib/post-cache";

export async function getSitemapPosts(type: CachedPostType) {
  try {
    const db = getDb();

    return await db
      .select({
        slug: posts.slug,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(
        and(
          eq(posts.type, type),
          eq(posts.status, "published")
        )
      )
      .limit(1000);
  } catch (error) {
    console.error(
      `Error fetching sitemap posts for type "${type}":`,
      error
    );

    throw error;
  }
}
