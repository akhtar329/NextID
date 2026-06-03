// app/api/admin/post/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

// Types for request body
interface CreatePostBody {
  slug: string;
  type: string;
  title: string;
  content?: string | null;
  excerpt?: string | null;
  featuredImage?: string | null;
  status?: string;
  isFeatured?: boolean;
  isPopular?: boolean;
  isBreaking?: boolean;
  publishedAt?: string | Date;
  meta?: Record<string, unknown>;
  tags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreatePostBody;
    
    const {
      slug,
      type,
      title,
      content,
      excerpt,
      featuredImage,
      status,
      isFeatured,
      isPopular,
      isBreaking,
      publishedAt,
      meta,
      tags,
    } = body;

    // Validate required fields
    if (!slug || !type || !title) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: slug, type, title" 
        },
        { status: 400 }
      );
    }

    // Validate slug format (no spaces, only lowercase letters, numbers, hyphens)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid slug format. Use only lowercase letters, numbers, and hyphens." 
        },
        { status: 400 }
      );
    }

    // Validate type is valid
    const validTypes = ["admission", "result", "news", "date_sheet", "scholarship", "job", "blog", "board"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid type. Must be one of: ${validTypes.join(", ")}` 
        },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug));
    
    if (existingPosts.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Slug already exists. Please choose a different slug." 
        },
        { status: 409 } // Conflict status code
      );
    }

    // Parse published date safely
    let parsedPublishedAt: Date;
    if (publishedAt) {
      const date = new Date(publishedAt);
      parsedPublishedAt = isNaN(date.getTime()) ? new Date() : date;
    } else {
      parsedPublishedAt = new Date();
    }

    // Create new post
    const newPost = await db.insert(posts).values({
      slug: slug.trim().toLowerCase(),
      type,
      title: title.trim(),
      content: content || null,
      excerpt: excerpt || null,
      featuredImage: featuredImage || null,
      status: status || "draft",
      isFeatured: isFeatured ?? false,
      isPopular: isPopular ?? false,
      isBreaking: isBreaking ?? false,
      publishedAt: parsedPublishedAt,
      meta: meta || {},
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    if (!newPost.length) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to create post - no data returned" 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Post created successfully",
      post: newPost[0],
    });

  } catch (error) {
    console.error("Error creating post:", error);
    
    // Handle duplicate key error (PostgreSQL code 23505)
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json(
        { 
          success: false, 
          error: "Slug already exists. Please choose a different slug." 
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create post",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}