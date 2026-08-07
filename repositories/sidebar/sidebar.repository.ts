// repositories/sidebar/sidebar.repository.ts

import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { writeLog } from "@/lib/logger";

export interface SidebarPost {
  id: number;
  slug: string;
  type: string;
  title: string;
  excerpt: string | null;
  isFeatured: boolean | null;
  isBreaking: boolean | null;
  publishedAt: Date | null;
  viewCount: number | null;
}

class SidebarRepository {
  private readonly DEFAULT_TRENDING_LIMIT = 5;
  private readonly DEFAULT_BREAKING_LIMIT = 3;
  private readonly DEFAULT_FEATURED_LIMIT = 4;
  private readonly SIDEBAR_FETCH_LIMIT = 30;

  private readonly sidebarFields = {
    id: posts.id,
    slug: posts.slug,
    type: posts.type,
    title: posts.title,
    excerpt: posts.excerpt,
    isFeatured: posts.isFeatured,
    isBreaking: posts.isBreaking,
    publishedAt: posts.publishedAt,
    viewCount: posts.viewCount,
  };

  /* =========================
  ⚡ SINGLE SIDEBAR FEED (CORE OPTIMIZATION)
  ========================= */
  async getSidebarFeed(limit = this.SIDEBAR_FETCH_LIMIT): Promise<{
    trending: SidebarPost[];
    breaking: SidebarPost[];
    featured: SidebarPost[];
  }> {
    const startTime = Date.now();

    try {
      const rows = await db
        .select(this.sidebarFields)
        .from(posts)
        .where(eq(posts.status, "published"))
        .orderBy(desc(posts.publishedAt))
        .limit(limit);

      // 🔥 JS-level derivation (cheap, no DB load)
      const trending = [...rows]
        .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
        .slice(0, this.DEFAULT_TRENDING_LIMIT);

      const breaking = rows
        .filter(p => p.isBreaking)
        .slice(0, this.DEFAULT_BREAKING_LIMIT);

      const featured = rows
        .filter(p => p.isFeatured)
        .slice(0, this.DEFAULT_FEATURED_LIMIT);

      await writeLog({
        id: `db_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: "getSidebarFeed",
        source: "database",
        duration: Date.now() - startTime,
        dataSize: JSON.stringify(rows).length,
        data: {
          totalRows: rows.length,
          trendingCount: trending.length,
          breakingCount: breaking.length,
          featuredCount: featured.length,
          limit,
        },
      });

      return {
        trending,
        breaking,
        featured,
      };
    } catch (error) {
      await writeLog({
        id: `db_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: "getSidebarFeed_error",
        source: "database",
        duration: Date.now() - startTime,
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
          limit,
        },
      });

      console.error('Error in getSidebarFeed:', error);
      return {
        trending: [],
        breaking: [],
        featured: [],
      };
    }
  }

  /* =========================
  📊 TYPE COUNTS (UNCHANGED BUT CLEANED)
  ========================= */
  async getTypeCounts(): Promise<Record<string, number>> {
    const startTime = Date.now();

    try {
      const results = await db
        .select({
          type: posts.type,
          count: sql<number>`count(*)`,
        })
        .from(posts)
        .where(eq(posts.status, "published"))
        .groupBy(posts.type);

      const counts = Object.fromEntries(
        results.map(r => [r.type, Number(r.count)])
      );

      await writeLog({
        id: `db_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: "getTypeCounts",
        source: "database",
        duration: Date.now() - startTime,
        dataSize: JSON.stringify(results).length,
        data: counts,
      });

      return counts;
    } catch (error) {
      await writeLog({
        id: `db_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: "getTypeCounts_error",
        source: "database",
        duration: Date.now() - startTime,
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      console.error('Error in getTypeCounts:', error);
      return {};
    }
  }

  /* =========================
  📈 TRENDING POSTS (TOP 5 BY VIEW COUNT)
  ========================= */
  async getTrending(limit = this.DEFAULT_TRENDING_LIMIT): Promise<SidebarPost[]> {
    const startTime = Date.now();

    try {
      const rows = await db
        .select(this.sidebarFields)
        .from(posts)
        .where(eq(posts.status, "published"))
        .orderBy(desc(posts.viewCount))
        .limit(limit);

      await writeLog({
        id: `db_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: "getTrending",
        source: "database",
        duration: Date.now() - startTime,
        dataSize: JSON.stringify(rows).length,
        data: {
          count: rows.length,
          limit,
        },
      });

      return rows;
    } catch (error) {
      await writeLog({
        id: `db_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: "getTrending_error",
        source: "database",
        duration: Date.now() - startTime,
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
          limit,
        },
      });

      console.error('Error in getTrending:', error);
      return [];
    }
  }

  /* =========================
  🔥 BREAKING NEWS POSTS
  ========================= */
  async getBreaking(limit = this.DEFAULT_BREAKING_LIMIT): Promise<SidebarPost[]> {
    const startTime = Date.now();

    try {
      const rows = await db
        .select(this.sidebarFields)
        .from(posts)
        .where(eq(posts.status, "published"))
        .orderBy(desc(posts.publishedAt))
        .limit(this.SIDEBAR_FETCH_LIMIT);

      const breaking = rows
        .filter(p => p.isBreaking)
        .slice(0, limit);

      await writeLog({
        id: `db_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: "getBreaking",
        source: "database",
        duration: Date.now() - startTime,
        dataSize: JSON.stringify(rows).length,
        data: {
          count: breaking.length,
          limit,
          totalFetched: rows.length,
        },
      });

      return breaking;
    } catch (error) {
      await writeLog({
        id: `db_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: "getBreaking_error",
        source: "database",
        duration: Date.now() - startTime,
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
          limit,
        },
      });

      console.error('Error in getBreaking:', error);
      return [];
    }
  }

  /* =========================
  ⭐ FEATURED POSTS
  ========================= */
  async getFeatured(limit = this.DEFAULT_FEATURED_LIMIT): Promise<SidebarPost[]> {
    const startTime = Date.now();

    try {
      const rows = await db
        .select(this.sidebarFields)
        .from(posts)
        .where(eq(posts.status, "published"))
        .orderBy(desc(posts.publishedAt))
        .limit(this.SIDEBAR_FETCH_LIMIT);

      const featured = rows
        .filter(p => p.isFeatured)
        .slice(0, limit);

      await writeLog({
        id: `db_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: "getFeatured",
        source: "database",
        duration: Date.now() - startTime,
        dataSize: JSON.stringify(rows).length,
        data: {
          count: featured.length,
          limit,
          totalFetched: rows.length,
        },
      });

      return featured;
    } catch (error) {
      await writeLog({
        id: `db_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: "getFeatured_error",
        source: "database",
        duration: Date.now() - startTime,
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
          limit,
        },
      });

      console.error('Error in getFeatured:', error);
      return [];
    }
  }
}

export const sidebarRepository = new SidebarRepository();