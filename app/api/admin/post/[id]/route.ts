// app/api/admin/post/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

// Type for update data
type UpdateData = {
  slug?: string;
  type?: string;
  title?: string;
  content?: string | null;
  excerpt?: string | null;
  featuredImage?: string | null;
  status?: string;
  isFeatured?: boolean;
  isPopular?: boolean;
  isBreaking?: boolean;
  publishedAt?: Date;
  meta?: Record<string, unknown>;
  tags?: Record<string, unknown>;
  updatedAt?: Date;
};

// PostgreSQL error type
interface PostgresError {
  code: string;
  message: string;
}

/* =========================
   Helper: Parse ID Safely
========================= */
async function getNumericId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numericId = Number(id);
  if (isNaN(numericId)) return null;
  return numericId;
}

// Helper function to revalidate cache (Next.js 15+)
async function revalidatePostCache(slug: string, type: string) {
  try {
    // ✅ Fixed: revalidateTag now takes 2 arguments (tag, profile)
    revalidateTag(`post-${slug}`, "default");
    revalidateTag(`posts-type-${type}`, "default");
    revalidateTag("homepage", "default");
    
    const typeLower = type.toLowerCase();
    if (typeLower === 'admission') revalidateTag("admissions-home", "default");
    else if (typeLower === 'result') revalidateTag("results-home", "default");
    else if (typeLower === 'news') revalidateTag("news-home", "default");
    else if (typeLower === 'date_sheet') revalidateTag("datesheets-home", "default");
    else if (typeLower === 'scholarship') revalidateTag("scholarships-home", "default");
    else if (typeLower === 'job') revalidateTag("jobs-home", "default");
    
    console.log(`✅ Cache revalidated for post: ${slug}`);
  } catch (cacheError) {
    console.error("Error revalidating cache:", cacheError);
  }
}

/* =========================
   GET → Fetch Single Post
========================= */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const numericId = await getNumericId(context);
  if (!numericId) {
    return NextResponse.json(
      { success: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  try {
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, numericId));

    if (!post.length) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, post: post[0] });
  } catch (err) {
    console.error("❌ GET error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

/* =========================
   PUT → Update Full Post
========================= */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const numericId = await getNumericId(context);
  if (!numericId) {
    return NextResponse.json(
      { success: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    if (!body.title || !body.slug || !body.type) {
      return NextResponse.json(
        { success: false, error: "Title, slug and type are required" },
        { status: 400 }
      );
    }

    // Check if post exists
    const [existing] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, numericId));

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    // Check for duplicate slug if being changed
    if (body.slug && body.slug !== existing.slug) {
      const [duplicateSlug] = await db
        .select()
        .from(posts)
        .where(eq(posts.slug, body.slug));

      if (duplicateSlug && duplicateSlug.id !== numericId) {
        return NextResponse.json(
          { success: false, error: `Slug "${body.slug}" already exists` },
          { status: 409 }
        );
      }
    }

    // Update post
    const updated = await db
      .update(posts)
      .set({
        slug: body.slug.trim(),
        type: body.type,
        title: body.title.trim(),
        content: body.content || null,
        excerpt: body.excerpt || null,
        featuredImage: body.featuredImage || null,
        status: body.status || "draft",
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : false,
        isPopular: body.isPopular !== undefined ? Boolean(body.isPopular) : false,
        isBreaking: body.isBreaking !== undefined ? Boolean(body.isBreaking) : false,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : existing.publishedAt,
        meta: body.meta || existing.meta,
        tags: body.tags || existing.tags,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, numericId))
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    // Revalidate cache
    await revalidatePostCache(existing.slug, existing.type);

    return NextResponse.json({ success: true, post: updated[0] });
  } catch (err) {
    console.error("❌ PUT error:", err);
    
    const pgError = err as PostgresError;
    if (pgError.code === "23505") {
      return NextResponse.json(
        { success: false, error: "Slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update post" },
      { status: 500 }
    );
  }
}

/* =========================
   PATCH → Partial Update
========================= */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const numericId = await getNumericId(context);
  if (!numericId) {
    return NextResponse.json(
      { success: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    // Build update object dynamically
    const updateData: UpdateData = {};
    
    if (body.slug !== undefined) updateData.slug = body.slug.trim();
    if (body.type !== undefined) updateData.type = body.type;
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.content !== undefined) updateData.content = body.content || null;
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt || null;
    if (body.featuredImage !== undefined) updateData.featuredImage = body.featuredImage || null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isFeatured !== undefined) updateData.isFeatured = Boolean(body.isFeatured);
    if (body.isPopular !== undefined) updateData.isPopular = Boolean(body.isPopular);
    if (body.isBreaking !== undefined) updateData.isBreaking = Boolean(body.isBreaking);
    if (body.publishedAt !== undefined) updateData.publishedAt = body.publishedAt ? new Date(body.publishedAt) : undefined;
    if (body.meta !== undefined) updateData.meta = body.meta;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (Object.keys(updateData).length > 0) updateData.updatedAt = new Date();

    // Check if post exists
    const [existing] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, numericId));

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    // Check for duplicate slug if being updated
    if (body.slug && body.slug !== existing.slug) {
      const [duplicateSlug] = await db
        .select()
        .from(posts)
        .where(eq(posts.slug, body.slug));

      if (duplicateSlug && duplicateSlug.id !== numericId) {
        return NextResponse.json(
          { success: false, error: `Slug "${body.slug}" already exists` },
          { status: 409 }
        );
      }
    }

    // Only update if there's data to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, numericId))
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    // Revalidate cache
    await revalidatePostCache(existing.slug, existing.type);

    return NextResponse.json({ success: true, post: updated[0] });
  } catch (err) {
    console.error("❌ PATCH error:", err);
    
    const pgError = err as PostgresError;
    if (pgError.code === "23505") {
      return NextResponse.json(
        { success: false, error: "Slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update post" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE → Soft Delete Post
========================= */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const numericId = await getNumericId(context);
  if (!numericId) {
    return NextResponse.json(
      { success: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  try {
    // Check if post exists
    const [existing] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, numericId));

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    // Soft delete - set status to archived
    await db
      .update(posts)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(eq(posts.id, numericId));

    // Revalidate cache
    await revalidatePostCache(existing.slug, existing.type);

    return NextResponse.json({
      success: true,
      message: "Post archived successfully"
    });
  } catch (err) {
    console.error("❌ DELETE error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete post" },
      { status: 500 }
    );
  }
}