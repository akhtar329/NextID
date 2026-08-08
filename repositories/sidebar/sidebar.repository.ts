// repositories/sidebar/sidebar.repository.ts

import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { Post, PostType } from "@/types/post";

// ============================================================
// SIDEBAR REPOSITORY - PURE DATABASE ACCESS LAYER
// ============================================================

export class SidebarRepository {

  private lightFields = {
    id: posts.id,
    slug: posts.slug,
    type: posts.type,
    title: posts.title,
    excerpt: posts.excerpt,
    featuredImage: posts.featuredImage,
    publishedAt: posts.publishedAt,
    createdAt: posts.createdAt,
    viewCount: posts.viewCount,
    isFeatured: posts.isFeatured,
    isBreaking: posts.isBreaking,
    isPopular: posts.isPopular,
    status: posts.status,
    meta: posts.meta,
  };

  private castPost(row: unknown): Post {
    return row as Post;
  }

  // ============================================================
  // ✅ getTrendingPosts - Get trending posts across all types
  // ============================================================
  async getTrendingPosts(
    limit: number = 10,
    types?: PostType[]
  ): Promise<Post[]> {
    try {
      const conditions = [eq(posts.status, "published")];

      if (types && types.length > 0) {
        conditions.push(sql`${posts.type} IN (${sql.join(types.map(t => sql`${t}`), sql`, `)})`);
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(
          sql`${posts.viewCount} DESC NULLS LAST, ${posts.isPopular} DESC, ${posts.publishedAt} DESC NULLS LAST`
        )
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getTrendingPosts:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getBreakingNews - Get breaking news posts
  // ============================================================
  async getBreakingNews(
    limit: number = 5
  ): Promise<Post[]> {
    try {
      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(
          and(
            eq(posts.status, "published"),
            eq(posts.type, "news"),
            eq(posts.isBreaking, true)
          )
        )
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getBreakingNews:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getFeaturedPosts - Get featured posts across all types
  // ============================================================
  async getFeaturedPosts(
    limit: number = 10,
    types?: PostType[]
  ): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        eq(posts.isFeatured, true)
      ];

      if (types && types.length > 0) {
        conditions.push(sql`${posts.type} IN (${sql.join(types.map(t => sql`${t}`), sql`, `)})`);
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getFeaturedPosts:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getQuickAccessCounts - Get counts for all post types
  // ============================================================
  async getQuickAccessCounts(): Promise<Record<string, number>> {
    try {
      const types: PostType[] = [
        'admission',
        'result',
        'news',
        'date_sheet',
        'scholarship',
        'job',
        'blog'
      ];

      const result: Record<string, number> = {};

      for (const type of types) {
        const [count] = await db
          .select({ count: sql<number>`count(*)` })
          .from(posts)
          .where(
            and(
              eq(posts.type, type),
              eq(posts.status, "published")
            )
          );
        
        result[type] = count?.count || 0;
      }

      return result;
    } catch (error) {
      console.error('Error in getQuickAccessCounts:', error);
      return {};
    }
  }

  // ============================================================
  // ✅ getCountByType - Get count for a specific type
  // ============================================================
  async getCountByType(type: PostType): Promise<number> {
    try {
      const [count] = await db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(
          and(
            eq(posts.type, type),
            eq(posts.status, "published")
          )
        );

      return count?.count || 0;
    } catch (error) {
      console.error('Error in getCountByType:', error);
      return 0;
    }
  }

  // ============================================================
  // ✅ getTrendingByType - Get trending posts for a specific type
  // ============================================================
  async getTrendingByType(
    type: PostType,
    limit: number = 5
  ): Promise<Post[]> {
    try {
      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(
          and(
            eq(posts.type, type),
            eq(posts.status, "published")
          )
        )
        .orderBy(
          sql`${posts.viewCount} DESC NULLS LAST, ${posts.isPopular} DESC, ${posts.publishedAt} DESC NULLS LAST`
        )
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getTrendingByType:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getFeaturedByType - Get featured posts for a specific type
  // ============================================================
  async getFeaturedByType(
    type: PostType,
    limit: number = 5
  ): Promise<Post[]> {
    try {
      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(
          and(
            eq(posts.type, type),
            eq(posts.status, "published"),
            eq(posts.isFeatured, true)
          )
        )
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getFeaturedByType:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getPopularByType - Get popular posts for a specific type
  // ============================================================
  async getPopularByType(
    type: PostType,
    limit: number = 5
  ): Promise<Post[]> {
    try {
      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(
          and(
            eq(posts.type, type),
            eq(posts.status, "published"),
            eq(posts.isPopular, true)
          )
        )
        .orderBy(sql`${posts.viewCount} DESC NULLS LAST, ${posts.publishedAt} DESC NULLS LAST`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getPopularByType:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getRecentPosts - Get recent posts across all types
  // ============================================================
  async getRecentPosts(
    limit: number = 10,
    types?: PostType[]
  ): Promise<Post[]> {
    try {
      const conditions = [eq(posts.status, "published")];

      if (types && types.length > 0) {
        conditions.push(sql`${posts.type} IN (${sql.join(types.map(t => sql`${t}`), sql`, `)})`);
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getRecentPosts:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getAllSidebarData - Get all sidebar data in one query
  // ============================================================
  async getAllSidebarData(
    trendingLimit: number = 10,
    breakingLimit: number = 5,
    featuredLimit: number = 10
  ): Promise<{
    trending: Post[];
    breaking: Post[];
    featured: Post[];
    quickAccess: Record<string, number>;
  }> {
    try {
      const [trending, breaking, featured, quickAccess] = await Promise.all([
        this.getTrendingPosts(trendingLimit),
        this.getBreakingNews(breakingLimit),
        this.getFeaturedPosts(featuredLimit),
        this.getQuickAccessCounts(),
      ]);

      return {
        trending,
        breaking,
        featured,
        quickAccess,
      };
    } catch (error) {
      console.error('Error in getAllSidebarData:', error);
      return {
        trending: [],
        breaking: [],
        featured: [],
        quickAccess: {},
      };
    }
  }
}

export const sidebarRepository = new SidebarRepository();