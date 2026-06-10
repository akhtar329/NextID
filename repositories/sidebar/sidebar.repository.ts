// repositories/sidebar/sidebar.repository.ts
import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { cache } from "react";

export interface SidebarPost {
  id: number;
  slug: string;
  type: string;
  title: string;
  excerpt: string | null;
  isFeatured: boolean | null;
  isBreaking: boolean | null;
  publishedAt: Date | null;
  randomViews?: number;
}

class SidebarRepository {
  
  private generateRandomViews(): number {
    const rand = Math.random();
    if (rand < 0.6) {
      return Math.floor(Math.random() * (2000 - 100 + 1) + 100);
    }
    if (rand < 0.9) {
      return Math.floor(Math.random() * (10000 - 2000 + 1) + 2000);
    }
    return Math.floor(Math.random() * (50000 - 10000 + 1) + 10000);
  }

  getTrending = cache(async (limit: number = 5): Promise<SidebarPost[]> => {
    try {
      const randomPosts = await db
        .select({
          id: posts.id,
          slug: posts.slug,
          type: posts.type,
          title: posts.title,
          excerpt: posts.excerpt,
          isFeatured: posts.isFeatured,
          isBreaking: posts.isBreaking,
          publishedAt: posts.publishedAt,
        })
        .from(posts)
        .where(eq(posts.status, "published"))
        .orderBy(sql`RANDOM()`)
        .limit(limit);
      
      const postsWithViews = randomPosts.map((post) => ({
        ...post,
        randomViews: this.generateRandomViews(),
      }));
      
      postsWithViews.sort((a, b) => (b.randomViews || 0) - (a.randomViews || 0));
      
      return postsWithViews;
    } catch (error) {
      console.error('Error in getTrending:', error);
      return [];
    }
  });

  getBreaking = cache(async (limit: number = 3): Promise<SidebarPost[]> => {
    try {
      const results = await db
        .select({
          id: posts.id,
          slug: posts.slug,
          type: posts.type,
          title: posts.title,
          excerpt: posts.excerpt,
          isFeatured: posts.isFeatured,
          isBreaking: posts.isBreaking,
          publishedAt: posts.publishedAt,
        })
        .from(posts)
        .where(and(
          eq(posts.status, "published"),
          eq(posts.isBreaking, true)
        ))
        .orderBy(desc(posts.publishedAt))
        .limit(limit);
      
      return results;
    } catch (error) {
      console.error('Error in getBreaking:', error);
      return [];
    }
  });

  getFeatured = cache(async (limit: number = 4): Promise<SidebarPost[]> => {
    try {
      const results = await db
        .select({
          id: posts.id,
          slug: posts.slug,
          type: posts.type,
          title: posts.title,
          excerpt: posts.excerpt,
          isFeatured: posts.isFeatured,
          isBreaking: posts.isBreaking,
          publishedAt: posts.publishedAt,
        })
        .from(posts)
        .where(and(
          eq(posts.status, "published"),
          eq(posts.isFeatured, true)
        ))
        .orderBy(desc(posts.publishedAt))
        .limit(limit);
      
      return results;
    } catch (error) {
      console.error('Error in getFeatured:', error);
      return [];
    }
  });

  getTypeCounts = cache(async (): Promise<Record<string, number>> => {
    try {
      const results = await db
        .select({
          type: posts.type,
          count: sql<number>`count(*)`,
        })
        .from(posts)
        .where(eq(posts.status, "published"))
        .groupBy(posts.type);
      
      const counts: Record<string, number> = {};
      for (const row of results) {
        counts[row.type] = Number(row.count);
      }
      return counts;
    } catch (error) {
      console.error('Error in getTypeCounts:', error);
      return {};
    }
  });
}

export const sidebarRepository = new SidebarRepository();