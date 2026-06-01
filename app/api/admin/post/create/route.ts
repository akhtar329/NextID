// app/api/admin/post/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
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
        { status: 400 }
      );
    }

    // Create new post
    const newPost = await db.insert(posts).values({
      slug,
      type,
      title,
      content: content || null,
      excerpt: excerpt || null,
      featuredImage: featuredImage || null,
      status: status || "draft",
      isFeatured: isFeatured || false,
      isPopular: isPopular || false,
      isBreaking: isBreaking || false,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      meta: meta || {},
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      message: "Post created successfully",
      post: newPost[0],
    });

  } catch (error) {
    console.error("Error creating post:", error);
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