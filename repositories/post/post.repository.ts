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
  meta: Record<string, unknown> | null;
  tags: Record<string, unknown> | null;
  publishedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

class PostRepository {
  
  // ✅ Get post by slug
  async getBySlug(slug: string): Promise<Post | null> {
    const [result] = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);
    
    if (!result) return null;
    return this.mapToPost(result);
  }

  // ✅ Get posts by type with pagination
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
    
    return results.map(result => this.mapToPost(result));
  }

  // ✅ Get multiple types (har type ke liye alag query)
  async getByTypes(types: string[], limitPerType: number = 5): Promise<Record<string, Post[]>> {
    const result: Record<string, Post[]> = {};
    
    for (const type of types) {
      const postsData = await db
        .select()
        .from(posts)
        .where(and(
          eq(posts.type, type),
          eq(posts.status, "published")
        ))
        .orderBy(desc(posts.publishedAt))
        .limit(limitPerType);
      
      result[type] = postsData.map(post => this.mapToPost(post));
    }
    
    return result;
  }

  // ✅ Get total count by type
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

  // ✅ Get featured posts
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
    
    return results.map(result => this.mapToPost(result));
  }

  // ✅ Get popular posts
  async getPopular(limit: number = 8): Promise<Post[]> {
    const results = await db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.viewCount))
      .limit(limit);
    
    return results.map(result => this.mapToPost(result));
  }

  // ✅ Get recent posts
  async getRecent(limit: number = 10): Promise<Post[]> {
    const results = await db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(limit);
    
    return results.map(result => this.mapToPost(result));
  }

  // ✅ Get related posts
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
    
    return results.map(result => this.mapToPost(result));
  }

  // ✅ Helper method
  private mapToPost(result: Record<string, unknown>): Post {
    return {
      id: result.id as number,
      slug: result.slug as string,
      type: result.type as string,
      title: result.title as string,
      content: (result.content as string | null) ?? null,
      excerpt: (result.excerpt as string | null) ?? null,
      featuredImage: (result.featuredImage as string | null) ?? null,
      status: (result.status as string | null) ?? null,
      isFeatured: (result.isFeatured as boolean | null) ?? null,
      isPopular: (result.isPopular as boolean | null) ?? null,
      isBreaking: (result.isBreaking as boolean | null) ?? null,
      meta: (result.meta as Record<string, unknown> | null) ?? null,
      tags: (result.tags as Record<string, unknown> | null) ?? null,
      publishedAt: (result.publishedAt as Date | null) ?? null,
      createdAt: (result.createdAt as Date | null) ?? null,
      updatedAt: (result.updatedAt as Date | null) ?? null,
    };
  }
}

export const postRepository = new PostRepository();