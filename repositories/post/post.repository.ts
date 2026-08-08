// repositories/post/post.repository.ts

import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq, and, not, inArray, sql } from "drizzle-orm";
import type { Post, PostType } from "@/types/post";

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
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit)
        .offset(offset);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getList:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getDetail - Database query only
  // ============================================================
  async getDetail(slug: string): Promise<Post | null> {
    try {
      const [row] = await db
        .select(this.fullFields)
        .from(posts)
        .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
        .limit(1);

      return row ? this.castPost(row) : null;
    } catch (error) {
      console.error('Error in getDetail:', error);
      return null;
    }
  }

  // ============================================================
  // ✅ getById - Get post by ID
  // ============================================================
  async getById(id: number): Promise<Post | null> {
    try {
      const [row] = await db
        .select(this.fullFields)
        .from(posts)
        .where(eq(posts.id, id))
        .limit(1);

      return row ? this.castPost(row) : null;
    } catch (error) {
      console.error('Error in getById:', error);
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
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
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
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
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

      return grouped;
    } catch (error) {
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
    try {
      const conditions = [eq(posts.status, "published")];

      if (type !== 'all') {
        conditions.push(eq(posts.type, type));
      }

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(and(...conditions));

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error in getTotalCount:', error);
      return 0;
    }
  }

  // ============================================================
  // ✅ incrementViewCount - Increment view count
  // ============================================================
  async incrementViewCount(type: PostType, slug: string): Promise<void> {
    try {
      await db
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
      console.error('Error in incrementViewCount:', error);
    }
  }

  // ============================================================
  // ✅ search - Search posts by keyword
  // ============================================================
  async search(query: string, type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`(
          ${posts.title} ILIKE ${`%${query}%`} OR
          ${posts.content} ILIKE ${`%${query}%`} OR
          ${posts.excerpt} ILIKE ${`%${query}%`}
        )`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in search:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getByCategory - Get posts by category
  // ============================================================
  async getByCategory(category: string, type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'category' = ${category}`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getByCategory:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getByTag - Get posts by tag
  // ============================================================
  async getByTag(tag: string, type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`${tag} = ANY(${posts.tags})`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getByTag:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getByYear - Get posts by year
  // ============================================================
  async getByYear(year: number, type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'year' = ${String(year)}`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getByYear:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getByBoard - Get posts by board
  // ============================================================
  async getByBoard(boardSlug: string, type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'boardSlug' = ${boardSlug}`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getByBoard:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getByInstitution - Get posts by institution
  // ============================================================
  async getByInstitution(instituteSlug: string, type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'instituteSlug' = ${instituteSlug}`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getByInstitution:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getByProvider - Get posts by provider (for scholarships)
  // ============================================================
  async getByProvider(provider: string, type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`(${posts.meta}->>'provider' = ${provider} OR ${posts.meta}->>'organization' = ${provider} OR ${posts.meta}->>'organizationName' = ${provider})`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getByProvider:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getByStudyLevel - Get scholarships by study level
  // ============================================================
  async getByStudyLevel(studyLevel: string, type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'studyLevel' = ${studyLevel}`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getByStudyLevel:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getByExamType - Get posts by exam type
  // ============================================================
  async getByExamType(examType: string, type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`(${posts.meta}->>'examType' = ${examType} OR ${posts.meta}->>'type' = ${examType})`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getByExamType:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getByJobType - Get jobs by job type
  // ============================================================
  async getByJobType(jobType: string, type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'jobType' = ${jobType}`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getByJobType:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getByLocation - Get jobs by location
  // ============================================================
  async getByLocation(location: string, type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`(${posts.meta}->>'location' = ${location} OR ${posts.meta}->>'city' = ${location})`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getByLocation:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getByCompany - Get jobs by company
  // ============================================================
  async getByCompany(company: string, type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`(${posts.meta}->>'company' = ${company} OR ${posts.meta}->>'organization' = ${company})`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getByCompany:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getBreakingNews - Get breaking news
  // ============================================================
  async getBreakingNews(type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        eq(posts.isBreaking, true),
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getBreakingNews:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getFeatured - Get featured posts
  // ============================================================
  async getFeatured(type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        eq(posts.isFeatured, true),
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getFeatured:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getPopular - Get popular posts
  // ============================================================
  async getPopular(type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        eq(posts.isPopular, true),
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getPopular:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getUrgent - Get urgent posts (for jobs)
  // ============================================================
  async getUrgent(type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'isUrgent' = ${'true'}`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getUrgent:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getOpen - Get open posts (for jobs, scholarships, admissions)
  // ============================================================
  async getOpen(type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'status' = 'Open'`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getOpen:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getFullyFunded - Get fully funded scholarships
  // ============================================================
  async getFullyFunded(type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`(${posts.meta}->>'isFullyFunded' = 'true' OR ${posts.meta}->>'type' ILIKE '%full%')`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getFullyFunded:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getAbroad - Get abroad scholarships
  // ============================================================
  async getAbroad(type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [
        eq(posts.status, "published"),
        sql`${posts.meta}->>'location' = 'abroad'`,
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getAbroad:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ getRecent - Get recent posts
  // ============================================================
  async getRecent(type?: PostType, limit: number = 10): Promise<Post[]> {
    try {
      const conditions = [eq(posts.status, "published")];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} DESC NULLS LAST, ${posts.createdAt} DESC`)
        .limit(limit);

      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getRecent:', error);
      return [];
    }
  }
}

export const postRepository = new PostRepository();