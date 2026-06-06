// app/api/admin/post/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

// Types for request body (with SEO fields)
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
  expiresAt?: string | Date | null;
  meta?: Record<string, unknown>;
  tags?: string[];
  // ✅ SEO Fields
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  focusKeyword?: string | null;
  canonicalUrl?: string | null;
  robots?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  ogType?: string | null;
  twitterCard?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  schemaMarkup?: Record<string, unknown> | null;
  focusKeywordDensity?: string | null;
  readabilityScore?: number | null;
  seoScore?: number | null;
  lastSeoAnalysis?: string | Date | null;
  priority?: string | null;
  changefreq?: string | null;
  breadcrumbTitle?: string | null;
  oldSlug?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreatePostBody;
    
    const {
      // Basic fields
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
      expiresAt,
      meta,
      tags,
      // ✅ SEO Fields
      metaTitle,
      metaDescription,
      metaKeywords,
      focusKeyword,
      canonicalUrl,
      robots,
      ogTitle,
      ogDescription,
      ogImage,
      ogType,
      twitterCard,
      twitterTitle,
      twitterDescription,
      twitterImage,
      schemaMarkup,
      focusKeywordDensity,
      readabilityScore,
      seoScore,
      lastSeoAnalysis,
      priority,
      changefreq,
      breadcrumbTitle,
      oldSlug,
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
    const validTypes = ["admission", "result", "news", "date_sheet", "scholarship", "job", "blog"];
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
        { status: 409 }
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

    // Parse expires date safely
    let parsedExpiresAt: Date | null = null;
    if (expiresAt) {
      const date = new Date(expiresAt);
      parsedExpiresAt = isNaN(date.getTime()) ? null : date;
    }

    // Parse lastSeoAnalysis date safely
    let parsedLastSeoAnalysis: Date | null = null;
    if (lastSeoAnalysis) {
      const date = new Date(lastSeoAnalysis);
      parsedLastSeoAnalysis = isNaN(date.getTime()) ? null : date;
    }

    // Create new post with ALL fields including SEO
    const newPost = await db.insert(posts).values({
      // Basic fields
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
      expiresAt: parsedExpiresAt,
      meta: meta || {},
      tags: tags || [],
      
      // ✅ SEO Fields - Core Meta
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      metaKeywords: metaKeywords || null,
      focusKeyword: focusKeyword || null,
      canonicalUrl: canonicalUrl || null,
      robots: robots || "index, follow",
      
      // ✅ SEO Fields - Open Graph
      ogTitle: ogTitle || null,
      ogDescription: ogDescription || null,
      ogImage: ogImage || null,
      ogType: ogType || "article",
      
      // ✅ SEO Fields - Twitter
      twitterCard: twitterCard || "summary_large_image",
      twitterTitle: twitterTitle || null,
      twitterDescription: twitterDescription || null,
      twitterImage: twitterImage || null,
      
      // ✅ SEO Fields - Extra
      schemaMarkup: schemaMarkup || null,
      focusKeywordDensity: focusKeywordDensity || null,
      readabilityScore: readabilityScore || null,
      seoScore: seoScore || null,
      lastSeoAnalysis: parsedLastSeoAnalysis,
      priority: priority || "0.5",
      changefreq: changefreq || "weekly",
      breadcrumbTitle: breadcrumbTitle || null,
      oldSlug: oldSlug || null,
      
      // Timestamps
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