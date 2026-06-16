// db/repositories/post.repository.ts

import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq, desc, and, not, inArray, sql } from "drizzle-orm";
import type { Post, PostType } from "@/types/post";

export class PostRepository {

  // ============ LIGHT FIELDS (For List, Homepage, Sidebar) ============
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

  // ============ FULL FIELDS (For Detail Pages) ============
  private fullFields = {
    ...this.lightFields,
    content: posts.content,
    tags: posts.tags,
    authorName: posts.authorName,
    authorId: posts.authorId,
    galleryImages: posts.galleryImages,
    actualImage: posts.actualImage,
    // SEO Fields
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
    // Extra
    breadcrumbTitle: posts.breadcrumbTitle,
    oldSlug: posts.oldSlug,
    expiresAt: posts.expiresAt,
    updatedAt: posts.updatedAt,
  };

  private castPost(row: unknown): Post {
    return row as Post;
  }

  // ============ FUNCTION 1: getList (Light Data - No Content) ============
  // Use: Admissions page, Blogs page, Homepage sections, Sidebar
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
      
      // Apply type filter
      if (type !== 'all') {
        conditions.push(eq(posts.type, type));
      }
      
      // Apply additional filters
      if (filters?.featured) {
        conditions.push(eq(posts.isFeatured, true));
      }
      if (filters?.popular) {
        conditions.push(eq(posts.isPopular, true));
      }
      if (filters?.breaking) {
        conditions.push(eq(posts.isBreaking, true));
      }
      
      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(...conditions))
        .orderBy(desc(posts.publishedAt))
        .limit(limit)
        .offset(offset);
      
      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getList:', error);
      return [];
    }
  }

  // ============ FUNCTION 2: getDetail (Full Data - With Content) ============
  // Use: Single post detail page
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

  // ============ FUNCTION 3: getRelated (Related Posts - Light Data) ============
  // Use: Sidebar related posts on detail page
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
        .orderBy(desc(posts.publishedAt))
        .limit(limit);
      
      return rows.map(r => this.castPost(r));
    } catch (error) {
      console.error('Error in getRelated:', error);
      return [];
    }
  }

  // ============ HELPER: Get Multiple Types at Once (For Homepage) ============
  async getHomepageData(
    types: PostType[],
    limitPerType: number = 5
  ): Promise<Record<PostType, Post[]>> {
    try {
      const rows = await db
        .select(this.lightFields)
        .from(posts)
        .where(and(inArray(posts.type, types), eq(posts.status, "published")))
        .orderBy(desc(posts.publishedAt));
      
      const grouped = {} as Record<PostType, Post[]>;
      for (const t of types) grouped[t] = [];
      
      for (const row of rows) {
        const typed = this.castPost(row);
        if (grouped[typed.type] && grouped[typed.type].length < limitPerType) {
          grouped[typed.type].push(typed);
        }
      }
      
      return grouped;
    } catch (error) {
      console.error('Error in getHomepageData:', error);
      const emptyResult = {} as Record<PostType, Post[]>;
      for (const t of types) emptyResult[t] = [];
      return emptyResult;
    }
  }

  // ============ HELPER: Get Total Count for Pagination ============
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
}

export const postRepository = new PostRepository();