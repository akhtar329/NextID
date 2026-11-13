
// repositories/sidebar/sidebar.repository.ts

import { getDb } from "@/db/db";
import { posts } from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import type { Post, PostType } from "@/types/post";

// ============================================================
// SIDEBAR REPOSITORY - PURE DATABASE ACCESS LAYER
// ============================================================

const POST_TYPES: PostType[] = [
  "admission",
  "result",
  "news",
  "date_sheet",
  "scholarship",
  "job",
  "blog",
];

export class SidebarRepository {
  private readonly lightFields = {
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

  private normalizeLimit(limit: number, fallback: number): number {
    if (!Number.isFinite(limit)) return fallback;

    return Math.min(1000, Math.max(1, Math.floor(limit)));
  }

  private getTypeCondition(types?: PostType[]) {
    if (!types || types.length === 0) {
      return undefined;
    }

    return inArray(posts.type, types);
  }

  // ============================================================
  // GET TRENDING POSTS
  // ============================================================

  async getTrendingPosts(
    limit: number = 10,
    types?: PostType[]
  ): Promise<Post[]> {
    try {
      const db = getDb();
      const safeLimit = this.normalizeLimit(limit, 10);
      const typeCondition = this.getTypeCondition(types);

      const conditions = [
        eq(posts.status, "published"),
        ...(typeCondition ? [typeCondition] : []),
      ];

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(
          sql`${posts.viewCount} DESC NULLS LAST,
              ${posts.isPopular} DESC,
              ${posts.publishedAt} DESC NULLS LAST`
        )
        .limit(safeLimit);

      return rows.map((row) => this.castPost(row));
    } catch (error) {
      console.error("Error in getTrendingPosts:", error);
      return [];
    }
  }

  // ============================================================
  // GET BREAKING NEWS
  // ============================================================

  async getBreakingNews(limit: number = 5): Promise<Post[]> {
    try {
      const db = getDb();
      const safeLimit = this.normalizeLimit(limit, 5);

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
        .orderBy(
          sql`${posts.publishedAt} DESC NULLS LAST,
              ${posts.createdAt} DESC`
        )
        .limit(safeLimit);

      return rows.map((row) => this.castPost(row));
    } catch (error) {
      console.error("Error in getBreakingNews:", error);
      return [];
    }
  }

  // ============================================================
  // GET FEATURED POSTS
  // ============================================================

  async getFeaturedPosts(
    limit: number = 10,
    types?: PostType[]
  ): Promise<Post[]> {
    try {
      const db = getDb();
      const safeLimit = this.normalizeLimit(limit, 10);
      const typeCondition = this.getTypeCondition(types);

      const conditions = [
        eq(posts.status, "published"),
        eq(posts.isFeatured, true),
        ...(typeCondition ? [typeCondition] : []),
      ];

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(
          sql`${posts.publishedAt} DESC NULLS LAST,
              ${posts.createdAt} DESC`
        )
        .limit(safeLimit);

      return rows.map((row) => this.castPost(row));
    } catch (error) {
      console.error("Error in getFeaturedPosts:", error);
      return [];
    }
  }

  // ============================================================
  // GET QUICK ACCESS COUNTS
  // ============================================================

  async getQuickAccessCounts(): Promise<Record<string, number>> {
    try {
      const db = getDb();

      const rows = await db
        .select({
          type: posts.type,
          count: sql<number>`count(*)::int`,
        })
        .from(posts)
        .where(
          and(
            eq(posts.status, "published"),
            inArray(posts.type, POST_TYPES)
          )
        )
        .groupBy(posts.type);

      const result: Record<string, number> = {};

      for (const type of POST_TYPES) {
        result[type] = 0;
      }

      for (const row of rows) {
        if (row.type) {
          result[row.type] = Number(row.count) || 0;
        }
      }

      return result;
    } catch (error) {
      console.error("Error in getQuickAccessCounts:", error);
      return {};
    }
  }

  // ============================================================
  // GET COUNT BY TYPE
  // ============================================================

  async getCountByType(type: PostType): Promise<number> {
    try {
      const db = getDb();

      const [result] = await db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(posts)
        .where(
          and(
            eq(posts.type, type),
            eq(posts.status, "published")
          )
        );

      return Number(result?.count ?? 0);
    } catch (error) {
      console.error("Error in getCountByType:", error);
      return 0;
    }
  }

  // ============================================================
  // GET TRENDING POSTS BY TYPE
  // ============================================================

  async getTrendingByType(
    type: PostType,
    limit: number = 5
  ): Promise<Post[]> {
    try {
      const db = getDb();
      const safeLimit = this.normalizeLimit(limit, 5);

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
          sql`${posts.viewCount} DESC NULLS LAST,
              ${posts.isPopular} DESC,
              ${posts.publishedAt} DESC NULLS LAST`
        )
        .limit(safeLimit);

      return rows.map((row) => this.castPost(row));
    } catch (error) {
      console.error("Error in getTrendingByType:", error);
      return [];
    }
  }

  // ============================================================
  // GET FEATURED POSTS BY TYPE
  // ============================================================

  async getFeaturedByType(
    type: PostType,
    limit: number = 5
  ): Promise<Post[]> {
    try {
      const db = getDb();
      const safeLimit = this.normalizeLimit(limit, 5);

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
        .orderBy(
          sql`${posts.publishedAt} DESC NULLS LAST,
              ${posts.createdAt} DESC`
        )
        .limit(safeLimit);

      return rows.map((row) => this.castPost(row));
    } catch (error) {
      console.error("Error in getFeaturedByType:", error);
      return [];
    }
  }

  // ============================================================
  // GET POPULAR POSTS BY TYPE
  // ============================================================

  async getPopularByType(
    type: PostType,
    limit: number = 5
  ): Promise<Post[]> {
    try {
      const db = getDb();
      const safeLimit = this.normalizeLimit(limit, 5);

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
        .orderBy(
          sql`${posts.viewCount} DESC NULLS LAST,
              ${posts.publishedAt} DESC NULLS LAST`
        )
        .limit(safeLimit);

      return rows.map((row) => this.castPost(row));
    } catch (error) {
      console.error("Error in getPopularByType:", error);
      return [];
    }
  }

  // ============================================================
  // GET RECENT POSTS
  // ============================================================

  async getRecentPosts(
    limit: number = 10,
    types?: PostType[]
  ): Promise<Post[]> {
    try {
      const db = getDb();
      const safeLimit = this.normalizeLimit(limit, 10);
      const typeCondition = this.getTypeCondition(types);

      const conditions = [
        eq(posts.status, "published"),
        ...(typeCondition ? [typeCondition] : []),
      ];

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(
          sql`${posts.publishedAt} DESC NULLS LAST,
              ${posts.createdAt} DESC`
        )
        .limit(safeLimit);

      return rows.map((row) => this.castPost(row));
    } catch (error) {
      console.error("Error in getRecentPosts:", error);
      return [];
    }
  }

  // ============================================================
  // GET ALL SIDEBAR DATA
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
      const [
        trending,
        breaking,
        featured,
        quickAccess,
      ] = await Promise.all([
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
      console.error("Error in getAllSidebarData:", error);

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
