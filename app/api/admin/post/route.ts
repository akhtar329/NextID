// app/api/admin/post/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

// ============================================
// GET - Fetch all posts
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = Number(searchParams.get("limit") || "50");
    const offset = Number(searchParams.get("offset") || "0");

    // Get all posts
    const allPosts = await db.select().from(posts);
    
    // Apply filters in JavaScript
    let filteredPosts = allPosts;
    
    if (type && type !== "all") {
      filteredPosts = filteredPosts.filter((p) => p.type === type);
    }
    
    if (status) {
      filteredPosts = filteredPosts.filter((p) => p.status === status);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter((p) => 
        (p.title?.toLowerCase().includes(searchLower) || false) ||
        (p.slug?.toLowerCase().includes(searchLower) || false)
      );
    }
    
    // Sort by created date (newest first)
    filteredPosts.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    const total = filteredPosts.length;
    const paginatedPosts = filteredPosts.slice(offset, offset + limit);
    
    // Transform posts
    const transformedPosts = paginatedPosts.map((post) => ({
      id: post.id,
      slug: post.slug,
      type: post.type,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      status: post.status,
      isFeatured: post.isFeatured,
      isPopular: post.isPopular,
      isBreaking: post.isBreaking,
      viewCount: post.viewCount,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      meta: post.meta,
      instituteName: post.meta && typeof post.meta === 'object' ? (post.meta as any).instituteName || null : null,
      cityName: post.meta && typeof post.meta === 'object' ? (post.meta as any).cityName || null : null,
      boardName: post.meta && typeof post.meta === 'object' ? (post.meta as any).boardName || null : null,
      company: post.meta && typeof post.meta === 'object' ? (post.meta as any).company || null : null,
      organizationName: post.meta && typeof post.meta === 'object' ? (post.meta as any).organizationName || null : null,
    }));

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      total,
      limit,
      offset,
    });

  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Bulk delete posts
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids")?.split(",") || [];

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "No post IDs provided" },
        { status: 400 }
      );
    }

    for (const id of ids) {
      await db
        .update(posts)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(posts.id, Number(id)));
    }

    return NextResponse.json({
      success: true,
      message: `${ids.length} post(s) archived successfully`,
    });

  } catch (error) {
    console.error("Error deleting posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete posts" },
      { status: 500 }
    );
  }
}