// repositories/post/post.repository.ts
import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq, desc, and, sql, not } from "drizzle-orm";

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
  // ✅ Sirf database query - NO CACHE
  async getBySlug(slug: string): Promise<Post | null> {
    const [result] = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);
    
    if (!result) return null;
    
    return {
      id: result.id,
      slug: result.slug,
      type: result.type,
      title: result.title,
      content: result.content ?? null,
      excerpt: result.excerpt ?? null,
      featuredImage: result.featuredImage ?? null,
      status: result.status,
      isFeatured: result.isFeatured,
      isPopular: result.isPopular,
      isBreaking: result.isBreaking,
      viewCount: result.viewCount,
      meta: result.meta as Record<string, unknown> | null,
      tags: result.tags as Record<string, unknown> | null,
      publishedAt: result.publishedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  // ✅ Sirf database query (WITH PAGINATION SUPPORT)
  async getByType(type: string, limit: number = 10, offset: number = 0): Promise<Post[]> {
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
    
    return results.map(result => ({
      id: result.id,
      slug: result.slug,
      type: result.type,
      title: result.title,
      content: result.content ?? null,
      excerpt: result.excerpt ?? null,
      featuredImage: result.featuredImage ?? null,
      status: result.status,
      isFeatured: result.isFeatured,
      isPopular: result.isPopular,
      isBreaking: result.isBreaking,
      viewCount: result.viewCount,
      meta: result.meta as Record<string, unknown> | null,
      tags: result.tags as Record<string, unknown> | null,
      publishedAt: result.publishedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }));
  }

  // ✅ Sirf database query - multiple types ek saath (WORKING FIXED VERSION)
  async getByTypes(types: string[], limitPerType: number = 5): Promise<Record<string, Post[]>> {
    console.log("🔴 REPO: getByTypes called with types:", types);
    
    // Get all published posts - simpler approach
    const limit = types.length * limitPerType;
    
    const results = await db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(limit * 2); // Get more to ensure we have enough for each type
    
    console.log("🔴 REPO: Total posts fetched:", results.length);
    console.log("🔴 REPO: Types in results:", [...new Set(results.map(r => r.type))]);
    
    const grouped: Record<string, Post[]> = {};
    
    for (const type of types) {
      const filtered = results
        .filter(p => p.type === type)
        .slice(0, limitPerType)
        .map(result => ({
          id: result.id,
          slug: result.slug,
          type: result.type,
          title: result.title,
          content: result.content ?? null,
          excerpt: result.excerpt ?? null,
          featuredImage: result.featuredImage ?? null,
          status: result.status,
          isFeatured: result.isFeatured,
          isPopular: result.isPopular,
          isBreaking: result.isBreaking,
          viewCount: result.viewCount,
          meta: result.meta as Record<string, unknown> | null,
          tags: result.tags as Record<string, unknown> | null,
          publishedAt: result.publishedAt,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        }));
      
      grouped[type] = filtered;
      console.log(`🔴 REPO: grouped[${type}] = ${filtered.length}`);
    }
    
    return grouped;
  }

  // ✅ NEW: Get total count by type (for pagination)
  async getCountByType(type: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(
        eq(posts.type, type),
        eq(posts.status, "published")
      ));
    
    return result?.count ?? 0;
  }

  // ✅ NEW: Get featured posts
  async getFeatured(limit: number = 6): Promise<Post[]> {
    const results = await db
      .select()
      .from(posts)
      .where(and(
        eq(posts.isFeatured, true),
        eq(posts.status, "published")
      ))
      .orderBy(desc(posts.publishedAt))
      .limit(limit);
    
    return results.map(result => ({
      id: result.id,
      slug: result.slug,
      type: result.type,
      title: result.title,
      content: result.content ?? null,
      excerpt: result.excerpt ?? null,
      featuredImage: result.featuredImage ?? null,
      status: result.status,
      isFeatured: result.isFeatured,
      isPopular: result.isPopular,
      isBreaking: result.isBreaking,
      viewCount: result.viewCount,
      meta: result.meta as Record<string, unknown> | null,
      tags: result.tags as Record<string, unknown> | null,
      publishedAt: result.publishedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }));
  }

  // ✅ NEW: Get popular posts (most viewed)
  async getPopular(limit: number = 8): Promise<Post[]> {
    const results = await db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.viewCount))
      .limit(limit);
    
    return results.map(result => ({
      id: result.id,
      slug: result.slug,
      type: result.type,
      title: result.title,
      content: result.content ?? null,
      excerpt: result.excerpt ?? null,
      featuredImage: result.featuredImage ?? null,
      status: result.status,
      isFeatured: result.isFeatured,
      isPopular: result.isPopular,
      isBreaking: result.isBreaking,
      viewCount: result.viewCount,
      meta: result.meta as Record<string, unknown> | null,
      tags: result.tags as Record<string, unknown> | null,
      publishedAt: result.publishedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }));
  }

  // ✅ NEW: Get recent posts
  async getRecent(limit: number = 10): Promise<Post[]> {
    const results = await db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(limit);
    
    return results.map(result => ({
      id: result.id,
      slug: result.slug,
      type: result.type,
      title: result.title,
      content: result.content ?? null,
      excerpt: result.excerpt ?? null,
      featuredImage: result.featuredImage ?? null,
      status: result.status,
      isFeatured: result.isFeatured,
      isPopular: result.isPopular,
      isBreaking: result.isBreaking,
      viewCount: result.viewCount,
      meta: result.meta as Record<string, unknown> | null,
      tags: result.tags as Record<string, unknown> | null,
      publishedAt: result.publishedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }));
  }

  // ✅ NEW: Get related posts (same type, exclude current)
  async getRelated(currentSlug: string, type: string, limit: number = 5): Promise<Post[]> {
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
    
    return results.map(result => ({
      id: result.id,
      slug: result.slug,
      type: result.type,
      title: result.title,
      content: result.content ?? null,
      excerpt: result.excerpt ?? null,
      featuredImage: result.featuredImage ?? null,
      status: result.status,
      isFeatured: result.isFeatured,
      isPopular: result.isPopular,
      isBreaking: result.isBreaking,
      viewCount: result.viewCount,
      meta: result.meta as Record<string, unknown> | null,
      tags: result.tags as Record<string, unknown> | null,
      publishedAt: result.publishedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }));
  }

  // ✅ Increment view count
  async incrementViewCount(slug: string): Promise<void> {
    await db
      .update(posts)
      .set({ viewCount: sql`${posts.viewCount} + 1` })
      .where(eq(posts.slug, slug));
  }
}

export const postRepository = new PostRepository();