// app/api/admin/news/create/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { news, seoMetadata } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.slug || !body.content) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Title, Slug, and Content are required" 
        },
        { status: 400 }
      );
    }

    // ✅ Check for base64 image (block karo)
    if (body.imageUrl && body.imageUrl.startsWith('data:image')) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Base64 images are not supported. Please use a valid image URL (https://...)" 
        },
        { status: 400 }
      );
    }

    // Check if slug exists
    const existing = await db
      .select()
      .from(news)
      .where(eq(news.slug, body.slug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "News with this slug already exists" },
        { status: 400 }
      );
    }

    // ✅ Create news with transaction (news + seo metadata)
    const result = await db.transaction(async (tx) => {
      // 1. Insert news
      const newNews = await tx
        .insert(news)
        .values({
          title: body.title,
          slug: body.slug,
          content: body.content,
          excerpt: body.excerpt || null,
          programId: body.programId ? Number(body.programId) : null,
          instituteId: body.instituteId ? Number(body.instituteId) : null,
          boardId: body.boardId ? Number(body.boardId) : null,
          cityId: body.cityId ? Number(body.cityId) : null,
          imageUrl: body.imageUrl || null,
          source: body.source || null,
          author: body.author || null,
          isFeatured: body.isFeatured || false,
          isBreaking: body.isBreaking || false,
          viewCount: 0,
          publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
          status: body.status ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const newsId = newNews[0].id;

      // 2. Insert SEO metadata if provided
      if (body.seo) {
        const seoData = body.seo;
        
        // Only insert if at least one SEO field has value
        const hasSeoData = seoData.metaTitle || seoData.metaDescription || 
                          seoData.metaKeywords || seoData.canonicalUrl ||
                          seoData.ogTitle || seoData.ogDescription || seoData.ogImage ||
                          seoData.twitterTitle || seoData.twitterDescription || seoData.twitterImage;

        if (hasSeoData) {
          await tx.insert(seoMetadata).values({
            entityType: "news",
            entityId: newsId,
            variation: "default",
            metaTitle: seoData.metaTitle || null,
            metaDescription: seoData.metaDescription || null,
            metaKeywords: seoData.metaKeywords || null,
            canonicalUrl: seoData.canonicalUrl || null,
            ogTitle: seoData.ogTitle || null,
            ogDescription: seoData.ogDescription || null,
            ogImage: seoData.ogImage || null,
            ogType: "article",
            twitterCard: seoData.twitterCard || "summary_large_image",
            twitterTitle: seoData.twitterTitle || null,
            twitterDescription: seoData.twitterDescription || null,
            twitterImage: seoData.twitterImage || null,
            schemaMarkup: seoData.schemaMarkup || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      return newNews[0];
    });

    return NextResponse.json({
      success: true,
      news: result,
      message: "News created successfully",
    });

  } catch (error) {
    console.error("❌ Error creating news:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create news",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
