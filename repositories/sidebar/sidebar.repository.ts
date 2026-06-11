// repositories/sidebar/sidebar.repository.ts

import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

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

  /* =========================
  ⚡ SINGLE SIDEBAR FEED (CORE OPTIMIZATION)
  ========================= */
  async getSidebarFeed(limit = 30): Promise<{
    trending: SidebarPost[];
    breaking: SidebarPost[];
    featured: SidebarPost[];
  }> {

    const rows = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        type: posts.type,
        title: posts.title,
        excerpt: posts.excerpt,
        isFeatured: posts.isFeatured,
        isBreaking: posts.isBreaking,
        publishedAt: posts.publishedAt,
        viewCount: posts.viewCount,
      })
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(limit);

    // 🔥 JS-level derivation (cheap, no DB load)
    const trending = [...rows]
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, 5);

    const breaking = rows
      .filter(p => p.isBreaking)
      .slice(0, 3);

    const featured = rows
      .filter(p => p.isFeatured)
      .slice(0, 4);

    return {
      trending,
      breaking,
      featured,
    };
  }

  /* =========================
  📊 TYPE COUNTS (UNCHANGED BUT CLEANED)
  ========================= */
  async getTypeCounts(): Promise<Record<string, number>> {
    const results = await db
      .select({
        type: posts.type,
        count: sql<number>`count(*)`,
      })
      .from(posts)
      .where(eq(posts.status, "published"))
      .groupBy(posts.type);

    return Object.fromEntries(
      results.map(r => [r.type, Number(r.count)])
    );
  }
}

export const sidebarRepository = new SidebarRepository();