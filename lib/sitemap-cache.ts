import { cacheLife, cacheTag } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/db";
import { posts } from "@/db/schema";
import type { CachedPostType } from "@/lib/post-cache";

export async function getSitemapPosts(type: CachedPostType) {
  "use cache";
  cacheTag("posts", `posts-type-${type}`, `sitemap-${type}`);
  cacheLife("days");

  return db
    .select({ slug: posts.slug, updatedAt: posts.updatedAt })
    .from(posts)
    .where(and(eq(posts.type, type), eq(posts.status, "published")))
    .limit(1000);
}
