// repositories/post/post.repository.ts
import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq, desc, and, sql, not } from "drizzle-orm";
import { cache } from "react";

export interface Post {
  id: number;
  slug: string;
  type: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  status: string | null;
  isFeatured: boolean | null;
  isPopular: boolean | null;
  isBreaking: boolean | null;
  viewCount: number | null;
  meta: Record<string, unknown> | null;
  tags: Record<string, unknown> | null;
  publishedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

class PostRepository {
  
  // ✅ Get post by slug (with cache)
  getBySlug = cache(async (slug: string): Promise<Post | null> => {
    try {
      const [result] = await db
        .select()
        .from(posts)
        .where(eq(posts.slug, slug))
        .limit(1);
      
      if (!result) return null;
      return this.mapToPost(result);
    } catch (error) {
      console.error('Error in getBySlug:', error);
      return null;
    }
  });

  // ✅ Get post by ID (with cache)
  getById = cache(async (id: number): Promise<Post | null> => {
    try {
      const [result] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, id))
        .limit(1);
      
      if (!result) return null;
      return this.mapToPost(result);
    } catch (error) {
      console.error('Error in getById:', error);
      return null;
    }
  });

  // ✅ Get posts by type with pagination (with cache)
  getByType = cache(async (type: string, limit: number = 10, offset: number = 0): Promise<Post[]> => {
    try {
      const results = await db
        .select()
        .from(posts)
        .where(and(
          eq(posts.type, type),
          eq(posts.status, "published")
        ))
        .orderBy(desc(posts.publishedAt))
        .limit(limit)
        .offset(offset);
      
      return results.map(result => this.mapToPost(result));
    } catch (error) {
      console.error('Error in getByType:', error);
      return [];
    }
  });

  // ✅ Get all published posts (with cache)
  getAllPublished = cache(async (limit: number = 100): Promise<Post[]> => {
    try {
      const results = await db
        .select()
        .from(posts)
        .where(eq(posts.status, "published"))
        .orderBy(desc(posts.publishedAt))
        .limit(limit);
      
      return results.map(result => this.mapToPost(result));
    } catch (error) {
      console.error('Error in getAllPublished:', error);
      return [];
    }
  });

  // ✅ Get multiple types (optimized with cache)
  getByTypes = cache(async (types: string[], limitPerType: number = 5): Promise<Record<string, Post[]>> => {
    try {
      const result: Record<string, Post[]> = {};
      
      for (const type of types) {
        const postsData = await db
          .select()
          .from(posts)
          .where(and(
            eq(posts.type, type),
            eq(posts.status, "published")
          ))
          .orderBy(desc(posts.publishedAt))
          .limit(limitPerType);
        
        result[type] = postsData.map(post => this.mapToPost(post));
      }
      
      return result;
    } catch (error) {
      console.error('Error in getByTypes:', error);
      return {};
    }
  });

  // ✅ Get total count by type (with cache)
  getCountByType = cache(async (type: string): Promise<number> => {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(and(
          eq(posts.type, type),
          eq(posts.status, "published")
        ));
      
      return result?.count ?? 0;
    } catch (error) {
      console.error('Error in getCountByType:', error);
      return 0;
    }
  });

  // ✅ Get ALL type counts (with cache)
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

  // ✅ Get latest counts (with cache)
  getLatestCounts = cache(async (): Promise<{
    totalPosts: number;
    publishedToday: number;
    totalViews: number;
  }> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [totalResult, todayResult, viewsResult] = await Promise.all([
        db.select({ count: sql<number>`count(*)` })
          .from(posts)
          .where(eq(posts.status, "published")),
        
        db.select({ count: sql<number>`count(*)` })
          .from(posts)
          .where(and(
            eq(posts.status, "published"),
            sql`${posts.publishedAt} >= ${today.toISOString()}`
          )),
        
        db.select({ sum: sql<number>`sum(${posts.viewCount})` })
          .from(posts)
          .where(eq(posts.status, "published")),
      ]);
      
      return {
        totalPosts: Number(totalResult[0]?.count) || 0,
        publishedToday: Number(todayResult[0]?.count) || 0,
        totalViews: Number(viewsResult[0]?.sum) || 0,
      };
    } catch (error) {
      console.error('Error in getLatestCounts:', error);
      return {
        totalPosts: 0,
        publishedToday: 0,
        totalViews: 0,
      };
    }
  });

  // ✅ Get featured posts (with cache)
  getFeatured = cache(async (limit: number = 6): Promise<Post[]> => {
    try {
      const results = await db
        .select()
        .from(posts)
        .where(and(
          eq(posts.isFeatured, true),
          eq(posts.status, "published")
        ))
        .orderBy(desc(posts.publishedAt))
        .limit(limit);
      
      return results.map(result => this.mapToPost(result));
    } catch (error) {
      console.error('Error in getFeatured:', error);
      return [];
    }
  });

  // ✅ Get popular posts (with cache)
  getPopular = cache(async (limit: number = 8): Promise<Post[]> => {
    try {
      const results = await db
        .select()
        .from(posts)
        .where(eq(posts.status, "published"))
        .orderBy(desc(posts.viewCount))
        .limit(limit);
      
      return results.map(result => this.mapToPost(result));
    } catch (error) {
      console.error('Error in getPopular:', error);
      return [];
    }
  });

  // ✅ Get trending posts (with cache)
  getTrending = cache(async (limit: number = 5): Promise<Post[]> => {
    try {
      const results = await db
        .select()
        .from(posts)
        .where(eq(posts.status, "published"))
        .orderBy(desc(posts.viewCount))
        .limit(limit);
      
      return results.map(result => this.mapToPost(result));
    } catch (error) {
      console.error('Error in getTrending:', error);
      return [];
    }
  });

  // ✅ Get breaking news (with cache)
  getBreaking = cache(async (limit: number = 5): Promise<Post[]> => {
    try {
      const results = await db
        .select()
        .from(posts)
        .where(and(
          eq(posts.status, "published"),
          eq(posts.isBreaking, true)
        ))
        .orderBy(desc(posts.publishedAt))
        .limit(limit);
      
      return results.map(result => this.mapToPost(result));
    } catch (error) {
      console.error('Error in getBreaking:', error);
      return [];
    }
  });

  // ✅ Get recent posts (with cache)
  getRecent = cache(async (limit: number = 10): Promise<Post[]> => {
    try {
      const results = await db
        .select()
        .from(posts)
        .where(eq(posts.status, "published"))
        .orderBy(desc(posts.publishedAt))
        .limit(limit);
      
      return results.map(result => this.mapToPost(result));
    } catch (error) {
      console.error('Error in getRecent:', error);
      return [];
    }
  });

  // ✅ Get related posts (with cache)
  getRelated = cache(async (currentSlug: string, type: string, limit: number = 5): Promise<Post[]> => {
    try {
      const results = await db
        .select()
        .from(posts)
        .where(and(
          eq(posts.type, type),
          eq(posts.status, "published"),
          not(eq(posts.slug, currentSlug))
        ))
        .orderBy(desc(posts.publishedAt))
        .limit(limit);
      
      return results.map(result => this.mapToPost(result));
    } catch (error) {
      console.error('Error in getRelated:', error);
      return [];
    }
  });

  // ✅ Helper method
  private mapToPost(result: Record<string, unknown>): Post {
    return {
      id: result.id as number,
      slug: result.slug as string,
      type: result.type as string,
      title: result.title as string,
      content: (result.content as string | null) ?? null,
      excerpt: (result.excerpt as string | null) ?? null,
      featuredImage: (result.featuredImage as string | null) ?? null,
      status: (result.status as string | null) ?? null,
      isFeatured: (result.isFeatured as boolean | null) ?? null,
      isPopular: (result.isPopular as boolean | null) ?? null,
      isBreaking: (result.isBreaking as boolean | null) ?? null,
      viewCount: (result.viewCount as number | null) ?? 0,
      meta: (result.meta as Record<string, unknown> | null) ?? null,
      tags: (result.tags as Record<string, unknown> | null) ?? null,
      publishedAt: (result.publishedAt as Date | null) ?? null,
      createdAt: (result.createdAt as Date | null) ?? null,
      updatedAt: (result.updatedAt as Date | null) ?? null,
    };
  }
}

export const postRepository = new PostRepository();