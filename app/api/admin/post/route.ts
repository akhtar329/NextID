// app/api/admin/post/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

// Types
interface TransformedPost {
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
  publishedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  meta: Record<string, unknown> | null;
  instituteName: string | null;
  cityName: string | null;
  boardName: string | null;
  company: string | null;
  organizationName: string | null;
}

// Helper function to safely get meta value
function getMetaValue(meta: unknown, key: string): string | null {
  if (!meta || typeof meta !== 'object') return null;
  const value = (meta as Record<string, unknown>)[key];
  return value && typeof value === 'string' ? value : null;
}

// Helper function to safely cast meta to Record
function getMetaObject(meta: unknown): Record<string, unknown> | null {
  if (!meta || typeof meta !== 'object') return null;
  return meta as Record<string, unknown>;
}

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
    
    // Transform posts - ✅ Fixed: Properly handle meta type
    const transformedPosts: TransformedPost[] = paginatedPosts.map((post) => {
      const metaObj = getMetaObject(post.meta);
      
      return {
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
        meta: metaObj,
        instituteName: getMetaValue(post.meta, 'instituteName'),
        cityName: getMetaValue(post.meta, 'cityName'),
        boardName: getMetaValue(post.meta, 'boardName'),
        company: getMetaValue(post.meta, 'company'),
        organizationName: getMetaValue(post.meta, 'organizationName'),
      };
    });

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
    const idsParam = searchParams.get("ids");
    
    if (!idsParam) {
      return NextResponse.json(
        { success: false, error: "No post IDs provided" },
        { status: 400 }
      );
    }
    
    const ids = idsParam.split(",").filter(Boolean);
    
    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid post IDs provided" },
        { status: 400 }
      );
    }

    // Validate all IDs are numbers
    const numericIds = ids.map(Number).filter(id => !isNaN(id));
    
    if (numericIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid post IDs provided" },
        { status: 400 }
      );
    }

    // Bulk archive posts
    for (const id of numericIds) {
      await db
        .update(posts)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(posts.id, id));
    }

    return NextResponse.json({
      success: true,
      message: `${numericIds.length} post(s) archived successfully`,
    });

  } catch (error) {
    console.error("Error deleting posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete posts" },
      { status: 500 }
    );
  }
}