// db/repositories/post.repository.ts

import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq, desc, and, not, inArray, sql } from "drizzle-orm";
import type { Post, PostType } from "@/types/post";
import { writeLog } from "@/lib/logger";

// ============================================================
// ✅ SIMPLE IN-MEMORY CACHE (TTL 1 HOUR)
// ============================================================
interface CacheItem {
  data: any;
  timestamp: number;
  expiresAt: number;
}

class SimpleCache {
  private store = new Map<string, CacheItem>();
  private defaultTTL = 3600 * 1000; // ✅ 1 hour

  get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.data as T;
  }

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    console.log(`💾 SET: ${key}`);
    console.log(`⏰ TTL: ${ttl}ms (${ttl / 1000}s)`);
    console.log(`⏰ Expires At: ${new Date(Date.now() + ttl).toLocaleTimeString()}`);
    
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }

  clear(): void {
    this.store.clear();
  }

  getStats(): { total: number; keys: string[] } {
    const keys = Array.from(this.store.keys());
    const validKeys = keys.filter(key => {
      const item = this.store.get(key);
      return item && item.expiresAt > Date.now();
    });
    return { total: validKeys.length, keys: validKeys };
  }
}

export const cache = new SimpleCache();

// ============================================================
// POST REPOSITORY
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
  // ✅ getList WITH CACHE
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
    const cacheKey = `posts:list:${type}:${limit}:${offset}:${JSON.stringify(filters || {})}`;
    const operation = `getList_${type}_limit${limit}_offset${offset}`;

    const cached = cache.get<Post[]>(cacheKey);
    if (cached) {
      writeLog({
        id: `cache_hit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "CACHE_HIT",
        operation: cacheKey,
        source: "cache",
        duration: Date.now() - startTime,
        data: {
          count: cached.length,
          type,
          limit,
          offset,
        },
      });
      return cached;
    }

    writeLog({
      id: `cache_miss_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "CACHE_MISS",
      operation: cacheKey,
      source: "database",
      duration: 0,
      data: { type, limit, offset },
    });

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

      cache.set(cacheKey, result, 3600 * 1000); // 1 hour TTL

      writeLog({
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

      writeLog({
        id: `cache_save_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "CACHE_SAVE",
        operation: cacheKey,
        source: "cache",
        duration: Date.now() - startTime,
        data: {
          count: result.length,
          ttl: "3600s",
        },
      });

      return result;
    } catch (error) {
      writeLog({
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
  // ✅ getDetail WITH CACHE
  // ============================================================
  async getDetail(slug: string): Promise<Post | null> {
    const startTime = Date.now();
    const cacheKey = `posts:detail:${slug}`;
    const operation = `getDetail_${slug}`;

    const cached = cache.get<Post>(cacheKey);
    if (cached) {
      writeLog({
        id: `cache_hit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "CACHE_HIT",
        operation: cacheKey,
        source: "cache",
        duration: Date.now() - startTime,
        data: { slug },
      });
      return cached;
    }

    writeLog({
      id: `cache_miss_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "CACHE_MISS",
      operation: cacheKey,
      source: "database",
      duration: 0,
      data: { slug },
    });

    try {
      const [row] = await db
        .select(this.fullFields)
        .from(posts)
        .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
        .limit(1);

      const result = row ? this.castPost(row) : null;

      cache.set(cacheKey, result, 3600 * 1000); // 1 hour TTL

      writeLog({
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

      writeLog({
        id: `cache_save_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "CACHE_SAVE",
        operation: cacheKey,
        source: "cache",
        duration: Date.now() - startTime,
        data: {
          found: !!row,
          ttl: "3600s",
        },
      });

      return result;
    } catch (error) {
      writeLog({
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
  // ✅ getRelated WITH CACHE
  // ============================================================
  async getRelated(
    currentId: number,
    type: PostType,
    limit: number = 5
  ): Promise<Post[]> {
    const startTime = Date.now();
    const cacheKey = `posts:related:${currentId}:${type}:${limit}`;
    const operation = `getRelated_${type}_id${currentId}`;

    const cached = cache.get<Post[]>(cacheKey);
    if (cached) {
      writeLog({
        id: `cache_hit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "CACHE_HIT",
        operation: cacheKey,
        source: "cache",
        duration: Date.now() - startTime,
        data: { count: cached.length, currentId, type },
      });
      return cached;
    }

    writeLog({
      id: `cache_miss_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "CACHE_MISS",
      operation: cacheKey,
      source: "database",
      duration: 0,
      data: { currentId, type, limit },
    });

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

      cache.set(cacheKey, result, 3600 * 1000); // 1 hour TTL

      writeLog({
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

      writeLog({
        id: `cache_save_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "CACHE_SAVE",
        operation: cacheKey,
        source: "cache",
        duration: Date.now() - startTime,
        data: {
          count: result.length,
          ttl: "3600s",
        },
      });

      return result;
    } catch (error) {
      writeLog({
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
  // ✅ getHomepageData WITH CACHE
  // ============================================================
  async getHomepageData(
    types: PostType[],
    limitPerType: number = 5
  ): Promise<Record<PostType, Post[]>> {
    const startTime = Date.now();
    const cacheKey = `posts:homepage:${types.join(',')}:${limitPerType}`;
    const operation = `getHomepageData_${types.join('_')}`;

    const cached = cache.get<Record<PostType, Post[]>>(cacheKey);
    if (cached) {
      writeLog({
        id: `cache_hit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "CACHE_HIT",
        operation: cacheKey,
        source: "cache",
        duration: Date.now() - startTime,
        data: { types, limitPerType },
      });
      return cached;
    }

    writeLog({
      id: `cache_miss_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "CACHE_MISS",
      operation: cacheKey,
      source: "database",
      duration: 0,
      data: { types, limitPerType },
    });

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

      cache.set(cacheKey, grouped, 3600 * 1000); // 1 hour TTL

      const totalCount = rows.length;
      const groupedCounts = Object.fromEntries(
        Object.entries(grouped).map(([key, val]) => [key, val.length])
      );

      writeLog({
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

      writeLog({
        id: `cache_save_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "CACHE_SAVE",
        operation: cacheKey,
        source: "cache",
        duration: Date.now() - startTime,
        data: {
          groupedCounts,
          ttl: "3600s",
        },
      });

      return grouped;
    } catch (error) {
      writeLog({
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
  // ✅ getTotalCount WITH CACHE
  // ============================================================
  async getTotalCount(type: PostType | 'all'): Promise<number> {
    const startTime = Date.now();
    const cacheKey = `posts:count:${type}`;
    const operation = `getTotalCount_${type}`;

    const cached = cache.get<number>(cacheKey);
    if (cached !== null) {
      writeLog({
        id: `cache_hit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "CACHE_HIT",
        operation: cacheKey,
        source: "cache",
        duration: Date.now() - startTime,
        data: { type, count: cached },
      });
      return cached;
    }

    writeLog({
      id: `cache_miss_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "CACHE_MISS",
      operation: cacheKey,
      source: "database",
      duration: 0,
      data: { type },
    });

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

      cache.set(cacheKey, count, 3600 * 1000); // 1 hour TTL

      writeLog({
        id: `db_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DATABASE_QUERY",
        operation: operation,
        source: "database",
        duration: Date.now() - startTime,
        data: { type, count },
      });

      writeLog({
        id: `cache_save_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "CACHE_SAVE",
        operation: cacheKey,
        source: "cache",
        duration: Date.now() - startTime,
        data: { type, count, ttl: "3600s" },
      });

      return count;
    } catch (error) {
      writeLog({
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

  // ============================================================
  // ✅ CLEAR CACHE
  // ============================================================
  clearCache(): void {
    cache.clear();
    console.log('🧹 Cache cleared');
  }

  // ============================================================
  // ✅ GET CACHE STATS
  // ============================================================
  getCacheStats(): { total: number; keys: string[] } {
    return cache.getStats();
  }
}

export const postRepository = new PostRepository();