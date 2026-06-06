// app/api/admin/post/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq, or, ilike, and, desc } from "drizzle-orm";

// ============================================
// Types
// ============================================
interface TransformedPost {
  id: number;
  slug: string;
  type: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  actualImage: string | null;
  galleryImages: string[] | null;
  status: string | null;
  isFeatured: boolean | null;
  isPopular: boolean | null;
  isBreaking: boolean | null;
  viewCount: number | null;
  publishedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  
  // SEO Fields
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  focusKeyword: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  schemaMarkup: Record<string, unknown> | null;
  focusKeywordDensity: string | null;
  readabilityScore: number | null;
  seoScore: number | null;
  lastSeoAnalysis: Date | null;
  priority: string | null;
  changefreq: string | null;
  breadcrumbTitle: string | null;
  oldSlug: string | null;
  
  // Extra
  meta: Record<string, unknown> | null;
  tags: string[] | null;
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

    // Build query conditions
    let query = db.select().from(posts);
    const conditions = [];
    
    if (type && type !== "all") {
      conditions.push(eq(posts.type, type));
    }
    
    if (status) {
      conditions.push(eq(posts.status, status));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(posts.title, `%${search}%`),
          ilike(posts.slug, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    const allPosts = await query.orderBy(desc(posts.createdAt));
    
    const total = allPosts.length;
    const paginatedPosts = allPosts.slice(offset, offset + limit);
    
    // Transform posts with all SEO fields
    const transformedPosts: TransformedPost[] = paginatedPosts.map((post) => ({
      id: post.id,
      slug: post.slug,
      type: post.type,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      actualImage: post.actualImage,
      galleryImages: (post.galleryImages as string[] | null) ?? null,
      status: post.status,
      isFeatured: post.isFeatured,
      isPopular: post.isPopular,
      isBreaking: post.isBreaking,
      viewCount: post.viewCount,
      publishedAt: post.publishedAt,
      expiresAt: post.expiresAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      
      // SEO Fields
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      metaKeywords: post.metaKeywords,
      focusKeyword: post.focusKeyword,
      canonicalUrl: post.canonicalUrl,
      robots: post.robots,
      ogTitle: post.ogTitle,
      ogDescription: post.ogDescription,
      ogImage: post.ogImage,
      ogType: post.ogType,
      twitterCard: post.twitterCard,
      twitterTitle: post.twitterTitle,
      twitterDescription: post.twitterDescription,
      twitterImage: post.twitterImage,
      schemaMarkup: (post.schemaMarkup as Record<string, unknown> | null) ?? null,
      focusKeywordDensity: post.focusKeywordDensity,
      readabilityScore: post.readabilityScore,
      seoScore: post.seoScore,
      lastSeoAnalysis: post.lastSeoAnalysis,
      priority: post.priority,
      changefreq: post.changefreq,
      breadcrumbTitle: post.breadcrumbTitle,
      oldSlug: post.oldSlug,
      
      // Extra
      meta: (post.meta as Record<string, unknown> | null) ?? null,
      tags: (post.tags as string[] | null) ?? null,
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
// POST - Create new post
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      // Basic Info
      slug,
      type,
      title,
      content,
      excerpt,
      featuredImage,
      actualImage,
      galleryImages,
      authorName,
      
      // SEO - Core Meta
      metaTitle,
      metaDescription,
      metaKeywords,
      focusKeyword,
      canonicalUrl,
      robots,
      
      // SEO - Open Graph
      ogTitle,
      ogDescription,
      ogImage,
      ogType,
      
      // SEO - Twitter
      twitterCard,
      twitterTitle,
      twitterDescription,
      twitterImage,
      
      // SEO - Extra Boost
      focusKeywordDensity,
      readabilityScore,
      seoScore,
      lastSeoAnalysis,
      
      // SEO - Indexing
      priority,
      changefreq,
      
      // SEO - Navigation
      breadcrumbTitle,
      oldSlug,
      
      // Status & Flags
      status,
      isFeatured,
      isPopular,
      isBreaking,
      
      // Extra
      meta,
      tags,
      
      // Timestamps
      publishedAt,
      expiresAt,
    } = body;

    // Validation
    if (!slug || !type || !title) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: slug, type, title" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPost = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    if (existingPost.length > 0) {
      return NextResponse.json(
        { success: false, error: "Slug already exists" },
        { status: 409 }
      );
    }

    // Create new post with all SEO fields
    const newPost = await db.insert(posts).values({
      // Basic Info
      slug,
      type,
      title,
      content: content || null,
      excerpt: excerpt || null,
      featuredImage: featuredImage || null,
      actualImage: actualImage || null,
      galleryImages: galleryImages || null,
      authorName: authorName || null,
      
      // SEO - Core Meta
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      metaKeywords: metaKeywords || null,
      focusKeyword: focusKeyword || null,
      canonicalUrl: canonicalUrl || null,
      robots: robots || 'index, follow',
      
      // SEO - Open Graph
      ogTitle: ogTitle || null,
      ogDescription: ogDescription || null,
      ogImage: ogImage || null,
      ogType: ogType || 'article',
      
      // SEO - Twitter
      twitterCard: twitterCard || 'summary_large_image',
      twitterTitle: twitterTitle || null,
      twitterDescription: twitterDescription || null,
      twitterImage: twitterImage || null,
      
      // SEO - Extra Boost
      focusKeywordDensity: focusKeywordDensity || null,
      readabilityScore: readabilityScore || null,
      seoScore: seoScore || null,
      lastSeoAnalysis: lastSeoAnalysis || null,
      
      // SEO - Indexing
      priority: priority || '0.5',
      changefreq: changefreq || 'weekly',
      
      // SEO - Navigation
      breadcrumbTitle: breadcrumbTitle || null,
      oldSlug: oldSlug || null,
      
      // Status & Flags
      status: status || 'draft',
      isFeatured: isFeatured || false,
      isPopular: isPopular || false,
      isBreaking: isBreaking || false,
      
      // Extra
      meta: meta || null,
      tags: tags || null,
      
      // Timestamps
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      post: newPost[0],
      message: "Post created successfully",
    });

  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create post" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Bulk archive posts
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "No post IDs provided" },
        { status: 400 }
      );
    }
    
    const numericIds = ids.filter((id: number) => !isNaN(Number(id))).map(Number);
    
    if (numericIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid post IDs provided" },
        { status: 400 }
      );
    }

    let successCount = 0;
    let failCount = 0;
    
    for (const id of numericIds) {
      try {
        await db
          .update(posts)
          .set({ status: "archived", updatedAt: new Date() })
          .where(eq(posts.id, id));
        successCount++;
      } catch {
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${successCount} post(s) archived successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      archivedCount: successCount,
      failedCount: failCount,
    });

  } catch (error) {
    console.error("Error deleting posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete posts" },
      { status: 500 }
    );
  }
}