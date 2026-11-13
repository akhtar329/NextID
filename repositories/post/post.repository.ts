
// repositories/post/post.repository.ts

import { getDb } from "@/db/db";
import { posts } from "@/db/schema";
import {
  eq,
  and,
  not,
  inArray,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { Post, PostType } from "@/types/post";

// ============================================================
// POST REPOSITORY - PURE DATABASE ACCESS LAYER
// Cloudflare Workers + Hyperdrive compatible
// ============================================================

export class PostRepository {
  private get db() {
    return getDb();
  }

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

  private readonly fullFields = {
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

  private normalizeLimit(limit: number, fallback = 10): number {
    if (!Number.isFinite(limit)) return fallback;
    return Math.min(1000, Math.max(1, Math.floor(limit)));
  }

  private normalizeOffset(offset: number): number {
    if (!Number.isFinite(offset)) return 0;
    return Math.max(0, Math.floor(offset));
  }

  private async getLightRows(
    conditions: SQL[],
    limit: number,
  ): Promise<Post[]> {
    const rows = await this.db
      .select(this.lightFields)
      .from(posts)
      .where(and(...conditions))
      .orderBy(
        sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`
      )
      .limit(this.normalizeLimit(limit));

    return rows.map((row) => this.castPost(row));
  }

  // ============================================================
  // GET LIST
  // ============================================================

  async getList(
    type: PostType | "all",
    limit = 10,
    offset = 0,
    filters?: {
      featured?: boolean;
      popular?: boolean;
      breaking?: boolean;
    }
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
      ];

      if (type !== "all") {
        conditions.push(eq(posts.type, type));
      }

      if (filters?.featured) {
        conditions.push(eq(posts.isFeatured, true));
      }

      if (filters?.popular) {
        conditions.push(eq(posts.isPopular, true));
      }

      if (filters?.breaking) {
        conditions.push(eq(posts.isBreaking, true));
      }

      const rows = await this.db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(
          sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`
        )
        .limit(this.normalizeLimit(limit))
        .offset(this.normalizeOffset(offset));

      return rows.map((row) => this.castPost(row));
    } catch (error) {
      console.error("Error in getList:", error);
      return [];
    }
  }

  // ============================================================
  // GET DETAIL
  // ============================================================

  async getDetail(slug: string): Promise<Post | null> {
    try {
      const cleanSlug = slug.trim();

      if (!cleanSlug) return null;

      const [row] = await this.db
        .select(this.fullFields)
        .from(posts)
        .where(
          and(
            eq(posts.slug, cleanSlug),
            eq(posts.status, "published")
          )
        )
        .limit(1);

      return row ? this.castPost(row) : null;
    } catch (error) {
      console.error("Error in getDetail:", error);
      return null;
    }
  }

  // ============================================================
  // GET BY ID
  // ============================================================

  async getById(id: number): Promise<Post | null> {
    try {
      if (!Number.isSafeInteger(id) || id <= 0) {
        return null;
      }

      const [row] = await this.db
        .select(this.fullFields)
        .from(posts)
        .where(eq(posts.id, id))
        .limit(1);

      return row ? this.castPost(row) : null;
    } catch (error) {
      console.error("Error in getById:", error);
      return null;
    }
  }

  // ============================================================
  // GET RELATED
  // ============================================================

  async getRelated(
    currentId: number,
    type: PostType,
    limit = 5
  ): Promise<Post[]> {
    try {
      return await this.getLightRows(
        [
          eq(posts.type, type),
          eq(posts.status, "published"),
          not(eq(posts.id, currentId)),
        ],
        limit
      );
    } catch (error) {
      console.error("Error in getRelated:", error);
      return [];
    }
  }

  // ============================================================
  // GET HOMEPAGE DATA
  // Each post type gets its own limit
  // ============================================================

  async getHomepageData(
    types: PostType[],
    limitPerType = 5
  ): Promise<Record<PostType, Post[]>> {
    const grouped = {} as Record<PostType, Post[]>;

    for (const type of types) {
      grouped[type] = [];
    }

    if (types.length === 0) {
      return grouped;
    }

    try {
      const limit = this.normalizeLimit(limitPerType, 5);
      const uniqueTypes = Array.from(new Set(types));

      const results = await Promise.all(
        uniqueTypes.map(async (type) => {
          const rows = await this.getLightRows(
            [
              eq(posts.type, type),
              eq(posts.status, "published"),
            ],
            limit
          );

          return { type, rows };
        })
      );

      for (const result of results) {
        grouped[result.type] = result.rows;
      }

      return grouped;
    } catch (error) {
      console.error("Error in getHomepageData:", error);
      return grouped;
    }
  }

  // ============================================================
  // GET TOTAL COUNT
  // ============================================================

  async getTotalCount(type: PostType | "all"): Promise<number> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
      ];

      if (type !== "all") {
        conditions.push(eq(posts.type, type));
      }

      const result = await this.db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(posts)
        .where(and(...conditions));

      return Number(result[0]?.count ?? 0);
    } catch (error) {
      console.error("Error in getTotalCount:", error);
      return 0;
    }
  }

  // ============================================================
  // INCREMENT VIEW COUNT
  // ============================================================

  async incrementViewCount(
    type: PostType,
    slug: string
  ): Promise<void> {
    try {
      await this.db
        .update(posts)
        .set({
          viewCount: sql`${posts.viewCount} + 1`,
        })
        .where(
          and(
            eq(posts.slug, slug),
            eq(posts.type, type)
          )
        );
    } catch (error) {
      console.error("Error in incrementViewCount:", error);
    }
  }

  // ============================================================
  // SEARCH
  // ============================================================

  async search(
    query: string,
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const cleanQuery = query.trim();

      if (!cleanQuery) return [];

      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`(
          ${posts.title} ILIKE ${`%${cleanQuery}%`} OR
          ${posts.content} ILIKE ${`%${cleanQuery}%`} OR
          ${posts.excerpt} ILIKE ${`%${cleanQuery}%`}
        )`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in search:", error);
      return [];
    }
  }

  // ============================================================
  // GET BY CATEGORY
  // ============================================================

  async getByCategory(
    category: string,
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'category' = ${category}`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getByCategory:", error);
      return [];
    }
  }

  // ============================================================
  // GET BY TAG
  // ============================================================

  async getByTag(
    tag: string,
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`${tag} = ANY(${posts.tags})`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getByTag:", error);
      return [];
    }
  }

  // ============================================================
  // GET BY YEAR
  // ============================================================

  async getByYear(
    year: number,
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      if (!Number.isInteger(year) || year < 1900 || year > 2200) {
        return [];
      }

      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'year' = ${String(year)}`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getByYear:", error);
      return [];
    }
  }

  // ============================================================
  // GET BY BOARD
  // ============================================================

  async getByBoard(
    boardSlug: string,
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'boardSlug' = ${boardSlug}`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getByBoard:", error);
      return [];
    }
  }

  // ============================================================
  // GET BY INSTITUTION
  // ============================================================

  async getByInstitution(
    instituteSlug: string,
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'instituteSlug' = ${instituteSlug}`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getByInstitution:", error);
      return [];
    }
  }

  // ============================================================
  // GET BY PROVIDER
  // ============================================================

  async getByProvider(
    provider: string,
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`(
          ${posts.meta}->>'provider' = ${provider}
          OR ${posts.meta}->>'organization' = ${provider}
          OR ${posts.meta}->>'organizationName' = ${provider}
        )`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getByProvider:", error);
      return [];
    }
  }

  // ============================================================
  // GET BY STUDY LEVEL
  // ============================================================

  async getByStudyLevel(
    studyLevel: string,
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'studyLevel' = ${studyLevel}`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getByStudyLevel:", error);
      return [];
    }
  }

  // ============================================================
  // GET BY EXAM TYPE
  // ============================================================

  async getByExamType(
    examType: string,
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`(
          ${posts.meta}->>'examType' = ${examType}
          OR ${posts.meta}->>'type' = ${examType}
        )`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getByExamType:", error);
      return [];
    }
  }

  // ============================================================
  // GET BY JOB TYPE
  // ============================================================

  async getByJobType(
    jobType: string,
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'jobType' = ${jobType}`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getByJobType:", error);
      return [];
    }
  }

  // ============================================================
  // GET BY LOCATION
  // ============================================================

  async getByLocation(
    location: string,
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`(
          ${posts.meta}->>'location' = ${location}
          OR ${posts.meta}->>'city' = ${location}
        )`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getByLocation:", error);
      return [];
    }
  }

  // ============================================================
  // GET BY COMPANY
  // ============================================================

  async getByCompany(
    company: string,
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`(
          ${posts.meta}->>'company' = ${company}
          OR ${posts.meta}->>'organization' = ${company}
        )`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getByCompany:", error);
      return [];
    }
  }

  // ============================================================
  // GET BREAKING NEWS
  // ============================================================

  async getBreakingNews(
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        eq(posts.isBreaking, true),
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getBreakingNews:", error);
      return [];
    }
  }

  // ============================================================
  // GET FEATURED
  // ============================================================

  async getFeatured(
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        eq(posts.isFeatured, true),
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getFeatured:", error);
      return [];
    }
  }

  // ============================================================
  // GET POPULAR
  // ============================================================

  async getPopular(
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        eq(posts.isPopular, true),
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getPopular:", error);
      return [];
    }
  }

  // ============================================================
  // GET URGENT
  // ============================================================

  async getUrgent(
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'isUrgent' = 'true'`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getUrgent:", error);
      return [];
    }
  }

  // ============================================================
  // GET OPEN
  // ============================================================

  async getOpen(
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'status' = 'Open'`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getOpen:", error);
      return [];
    }
  }

  // ============================================================
  // GET FULLY FUNDED
  // ============================================================

  async getFullyFunded(
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`(
          ${posts.meta}->>'isFullyFunded' = 'true'
          OR ${posts.meta}->>'type' ILIKE '%full%'
        )`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getFullyFunded:", error);
      return [];
    }
  }

  // ============================================================
  // GET ABROAD
  // ============================================================

  async getAbroad(
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'location' = 'abroad'`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getAbroad:", error);
      return [];
    }
  }

  // ============================================================
  // GET RECENT
  // ============================================================

  async getRecent(
    type?: PostType,
    limit = 10
  ): Promise<Post[]> {
    try {
      const conditions: SQL[] = [
        eq(posts.status, "published"),
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      return await this.getLightRows(conditions, limit);
    } catch (error) {
      console.error("Error in getRecent:", error);
      return [];
    }
  }
}

export const postRepository = new PostRepository();
