import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq, desc, and, not, inArray } from "drizzle-orm";
import type { Post, PostType } from "@/types/post";

export class PostRepository {

  // Accept a DB row which may have `type` as string and normalize to Post
  private castPost(row: any): Post {
    return {
      ...row,
      type: row.type as PostType,
    };
  }

  async getBySlug(slug: string): Promise<Post | null> {
    const [row] = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    return row ? this.castPost(row) : null;
  }

  async getById(id: number): Promise<Post | null> {
    const [row] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    return row ? this.castPost(row) : null;
  }

  async getByType(type: PostType, limit = 10, offset = 0): Promise<Post[]> {
    const rows = await db
      .select()
      .from(posts)
      .where(and(eq(posts.type, type), eq(posts.status, "published")))
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset);

    return rows.map(r => this.castPost(r));
  }

  async getByTypes(types: PostType[], limit = 5): Promise<Record<PostType, Post[]>> {
    const rows = await db
      .select()
      .from(posts)
      .where(inArray(posts.type, types))
      .orderBy(desc(posts.publishedAt));

    const grouped = {} as Record<PostType, Post[]>;

    for (const t of types) grouped[t] = [];

    for (const row of rows) {
      const typed = this.castPost(row);
      if (grouped[typed.type]) grouped[typed.type].push(typed);
    }

    for (const key of Object.keys(grouped) as PostType[]) {
      grouped[key] = grouped[key].slice(0, limit);
    }

    return grouped;
  }

  async getFeatured(limit = 6): Promise<Post[]> {
    const rows = await db
      .select()
      .from(posts)
      .where(and(eq(posts.isFeatured, true), eq(posts.status, "published")))
      .orderBy(desc(posts.publishedAt))
      .limit(limit);

    return rows.map(r => this.castPost(r));
  }

  async getPopular(limit = 8): Promise<Post[]> {
    const rows = await db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.viewCount))
      .limit(limit);

    return rows.map(r => this.castPost(r));
  }

  async getRecent(limit = 10): Promise<Post[]> {
    const rows = await db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(limit);

    return rows.map(r => this.castPost(r));
  }

  async getRelated(currentSlug: string, type: PostType, limit = 5): Promise<Post[]> {
    const rows = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.type, type),
          eq(posts.status, "published"),
          not(eq(posts.slug, currentSlug))
        )
      )
      .orderBy(desc(posts.publishedAt))
      .limit(limit);

    return rows.map(r => this.castPost(r));
  }
}

export const postRepository = new PostRepository();