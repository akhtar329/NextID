// db/repositories/post.repository.ts

import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq, desc, and, not, inArray, sql } from "drizzle-orm";
import type { Post, PostType } from "@/types/post";
import { writeLog } from "@/lib/logger";

// ============================================================
// POST REPOSITORY - PURE DATABASE ACCESS LAYER
// ============================================================

export class PostRepository {

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

  private fullFields = {
    ...this.lightFields,
    content: posts.content,
    tags: posts.tags,
    authorName: posts.authorName,
    authorId: posts.authorId,
    galleryImages: posts.galleryImages,
    actualImage: posts.actualImage,
    metaTitle: posts.metaTitle,
    metaDescription: posts.metaDescription,
    metaKeywords: posts.metaKeywords,
    focusKeyword: posts.focusKeyword,
    canonicalUrl: posts.canonicalUrl,
    robots: posts.robots,
    ogTitle: posts.ogTitle,
    ogDescription: posts.ogDescription,
    ogImage: posts.ogImage,
    ogType: posts.ogType,
    twitterCard: posts.twitterCard,
    twitterTitle: posts.twitterTitle,
    twitterDescription: posts.twitterDescription,
    twitterImage: posts.twitterImage,
    schemaMarkup: posts.schemaMarkup,
    breadcrumbTitle: posts.breadcrumbTitle,
    oldSlug: posts.oldSlug,
    expiresAt: posts.expiresAt,
    updatedAt: posts.updatedAt,
  };

  private castPost(row: unknown): Post {
    return row as Post;
  }

  // ============================================================
  // ✅ getList - Database query only
  // ============================================================
  async getList(
    type: PostType | 'all',
    limit: number = 10,
    offset: number = 0,
    filters?: {
      featured?: boolean;
      popular?: boolean;
      breaking?: boolean;
    }
  ): Promise<Post[]> {
    const startTime = Date.now();
    const operation = `getList_${type}_limit${limit}_offset${offset}`;

    try {
      const conditions = [eq(posts.status, "published")];

      if (type !== 'all') {
        conditions.push(eq(posts.type, type));
      }

      if (filters?.featured) conditions.push(eq(posts.isFeatured, true));
      if (filters?.popular) conditions.push(eq(posts.isPopular, true));
      if (filters?.breaking) conditions.push(eq(posts.isBreaking, true));

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(desc(posts.publishedAt))
        .limit(limit)
        .offset(offset);

      const result = rows.map(r => this.castPost(r));

      await writeLog({
        id: `db_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: operation,
        source: "database",
        duration: Date.now() - startTime,
        dataSize: JSON.stringify(rows).length,
        data: {
          count: rows.length,
          type,
          limit,
          offset,
          filters,
        },
      });

      return result;
    } catch (error) {
      await writeLog({
        id: `db_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: `${operation}_error`,
        source: "database",
        duration: Date.now() - startTime,
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
          type,
          limit,
          offset,
          filters,
        },
      });

      console.error('Error in getList:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getDetail - Database query only
  // ============================================================
  async getDetail(slug: string): Promise<Post | null> {
    const startTime = Date.now();
    const operation = `getDetail_${slug}`;

    try {
      const [row] = await db
        .select(this.fullFields)
        .from(posts)
        .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
        .limit(1);

      const result = row ? this.castPost(row) : null;

      await writeLog({
        id: `db_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: operation,
        source: "database",
        duration: Date.now() - startTime,
        dataSize: row ? JSON.stringify(row).length : 0,
        data: {
          found: !!row,
          slug,
        },
      });

      return result;
    } catch (error) {
      await writeLog({
        id: `db_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: `${operation}_error`,
        source: "database",
        duration: Date.now() - startTime,
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
          slug,
        },
      });

      console.error('Error in getDetail:', error);
      return null;
    }
  }

  // ============================================================
  // ✅ getRelated - Database query only
  // ============================================================
  async getRelated(
    currentId: number,
    type: PostType,
    limit: number = 5
  ): Promise<Post[]> {
    const startTime = Date.now();
    const operation = `getRelated_${type}_id${currentId}`;

    try {
      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(
          and(
            eq(posts.type, type),
            eq(posts.status, "published"),
            not(eq(posts.id, currentId))
          )
        )
        .orderBy(desc(posts.publishedAt))
        .limit(limit);

      const result = rows.map(r => this.castPost(r));

      await writeLog({
        id: `db_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: operation,
        source: "database",
        duration: Date.now() - startTime,
        dataSize: JSON.stringify(rows).length,
        data: {
          count: rows.length,
          currentId,
          type,
          limit,
        },
      });

      return result;
    } catch (error) {
      await writeLog({
        id: `db_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: `${operation}_error`,
        source: "database",
        duration: Date.now() - startTime,
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
          currentId,
          type,
          limit,
        },
      });

      console.error('Error in getRelated:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getHomepageData - Database query only
  // ============================================================
  async getHomepageData(
    types: PostType[],
    limitPerType: number = 5
  ): Promise<Record<PostType, Post[]>> {
    const startTime = Date.now();
    const operation = `getHomepageData_${types.join('_')}`;

    try {
      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(
          and(
            inArray(posts.type, types),
            eq(posts.status, "published")
          )
        )
        .orderBy(desc(posts.publishedAt))
        .limit(types.length * limitPerType);

      const grouped = {} as Record<PostType, Post[]>;
      for (const t of types) grouped[t] = [];

      for (const row of rows) {
        const typed = this.castPost(row);
        if (!grouped[typed.type]) continue;
        if (grouped[typed.type].length < limitPerType) {
          grouped[typed.type].push(typed);
        }
      }

      const totalCount = rows.length;
      const groupedCounts = Object.fromEntries(
        Object.entries(grouped).map(([key, val]) => [key, val.length])
      );

      await writeLog({
        id: `db_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: operation,
        source: "database",
        duration: Date.now() - startTime,
        dataSize: JSON.stringify(rows).length,
        data: {
          totalRows: totalCount,
          groupedCounts,
          types,
          limitPerType,
        },
      });

      return grouped;
    } catch (error) {
      await writeLog({
        id: `db_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: `${operation}_error`,
        source: "database",
        duration: Date.now() - startTime,
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
          types,
          limitPerType,
        },
      });

      console.error('Error in getHomepageData:', error);

      const empty = {} as Record<PostType, Post[]>;
      for (const t of types) empty[t] = [];
      return empty;
    }
  }

  // ============================================================
  // ✅ getTotalCount - Database query only
  // ============================================================
  async getTotalCount(type: PostType | 'all'): Promise<number> {
    const startTime = Date.now();
    const operation = `getTotalCount_${type}`;

    try {
      const conditions = [eq(posts.status, "published")];

      if (type !== 'all') {
        conditions.push(eq(posts.type, type));
      }

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(and(...conditions));

      const count = result[0]?.count || 0;

      await writeLog({
        id: `db_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: operation,
        source: "database",
        duration: Date.now() - startTime,
        data: { type, count },
      });

      return count;
    } catch (error) {
      await writeLog({
        id: `db_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: `${operation}_error`,
        source: "database",
        duration: Date.now() - startTime,
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
          type,
        },
      });

      console.error('Error in getTotalCount:', error);
      return 0;
    }
  }
}

export const postRepository = new PostRepository();