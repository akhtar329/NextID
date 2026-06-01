// app/api/admin/news/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { news, programs, institutes, cities, seoMetadata } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET - Fetch single news with SEO metadata
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const newsId = parseInt(id);

    if (isNaN(newsId)) {
      return NextResponse.json({ success: false, error: "Invalid news ID" }, { status: 400 });
    }

    // Fetch news with relations
    const newsItem = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        content: news.content,
        excerpt: news.excerpt,
        category: news.category,
        tags: news.tags,
        programId: news.programId,
        instituteId: news.instituteId,
        boardId: news.boardId,
        cityId: news.cityId,
        imageUrl: news.imageUrl,
        source: news.source,
        author: news.author,
        isFeatured: news.isFeatured,
        isBreaking: news.isBreaking,
        viewCount: news.viewCount,
        publishedAt: news.publishedAt,
        expiresAt: news.expiresAt,
        status: news.status,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
        programName: programs.name,
        instituteName: institutes.name,
        cityName: cities.name,
      })
      .from(news)
      .leftJoin(programs, eq(news.programId, programs.id))
      .leftJoin(institutes, eq(news.instituteId, institutes.id))
      .leftJoin(cities, eq(news.cityId, cities.id))
      .where(eq(news.id, newsId))
      .limit(1);

    if (!newsItem || newsItem.length === 0) {
      return NextResponse.json({ success: false, error: "News not found" }, { status: 404 });
    }

    // ✅ Fetch SEO metadata
    const seoData = await db
      .select()
      .from(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityId, newsId),
          eq(seoMetadata.entityType, "news")
        )
      )
      .limit(1);

    const result = {
      ...newsItem[0],
      seo: seoData.length > 0 ? seoData[0] : null,
    };

    return NextResponse.json({ success: true, news: result });
  } catch (error) {
    console.error("❌ Error fetching news:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch news" }, { status: 500 });
  }
}

// PATCH - Update news (partial) with SEO metadata
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const newsId = parseInt(id);

    if (isNaN(newsId)) {
      return NextResponse.json({ success: false, error: "Invalid news ID" }, { status: 400 });
    }

    const body = await request.json();

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

    // Check if news exists
    const existing = await db.select().from(news).where(eq(news.id, newsId)).limit(1);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ success: false, error: "News not found" }, { status: 404 });
    }

    // ✅ If slug is provided (from edit page - we don't send slug anymore, but keeping for safety)
    if (body.slug) {
      const slugExists = await db
        .select()
        .from(news)
        .where(eq(news.slug, body.slug))
        .limit(1);

      if (slugExists.length > 0 && slugExists[0].id !== newsId) {
        return NextResponse.json({ success: false, error: "Slug already exists on another news" }, { status: 400 });
      }
    }

    // ✅ Update news and SEO in transaction
    const result = await db.transaction(async (tx) => {
      // 1. Update news
      const updateData: Record<string, any> = { updatedAt: new Date() };

      if (body.title !== undefined) updateData.title = body.title;
      // ⚠️ Slug update allowed only if explicitly sent (edit page won't send it)
      if (body.slug !== undefined) updateData.slug = body.slug;
      if (body.content !== undefined) updateData.content = body.content;
      if (body.excerpt !== undefined) updateData.excerpt = body.excerpt || null;
      
      // ✅ ADDED: Category & Tags fields
      if (body.category !== undefined) updateData.category = body.category || null;
      if (body.tags !== undefined) updateData.tags = body.tags || [];
      
      if (body.programId !== undefined) updateData.programId = body.programId ? Number(body.programId) : null;
      if (body.instituteId !== undefined) updateData.instituteId = body.instituteId ? Number(body.instituteId) : null;
      if (body.boardId !== undefined) updateData.boardId = body.boardId ? Number(body.boardId) : null;
      if (body.cityId !== undefined) updateData.cityId = body.cityId ? Number(body.cityId) : null;
      if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl || null;
      if (body.source !== undefined) updateData.source = body.source || null;
      if (body.author !== undefined) updateData.author = body.author || null;
      if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
      if (body.isBreaking !== undefined) updateData.isBreaking = body.isBreaking;
      if (body.viewCount !== undefined) updateData.viewCount = body.viewCount;
      if (body.publishedAt !== undefined) updateData.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
      if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
      if (body.status !== undefined) updateData.status = body.status;

      const updated = await tx.update(news).set(updateData).where(eq(news.id, newsId)).returning();

      // 2. ✅ Update or insert SEO metadata
      if (body.seo) {
        const seoData = body.seo;
        
        // Check if SEO record exists
        const existingSeo = await tx
          .select()
          .from(seoMetadata)
          .where(
            and(
              eq(seoMetadata.entityId, newsId),
              eq(seoMetadata.entityType, "news")
            )
          )
          .limit(1);

        const seoValues = {
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
          updatedAt: new Date(),
        };

        if (existingSeo.length > 0) {
          // Update existing SEO
          await tx
            .update(seoMetadata)
            .set(seoValues)
            .where(
              and(
                eq(seoMetadata.entityId, newsId),
                eq(seoMetadata.entityType, "news")
              )
            );
        } else {
          // Insert new SEO
          await tx.insert(seoMetadata).values({
            ...seoValues,
            entityType: "news",
            entityId: newsId,
            variation: "default",
            createdAt: new Date(),
          });
        }
      }

      return updated[0];
    });

    return NextResponse.json({ 
      success: true, 
      news: result, 
      message: "News updated successfully" 
    });
  } catch (error) {
    console.error("❌ Error updating news:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update news", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete news (with SEO metadata cascade)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const newsId = parseInt(id);

    if (isNaN(newsId)) {
      return NextResponse.json({ success: false, error: "Invalid news ID" }, { status: 400 });
    }

    // Check if news exists
    const existing = await db.select().from(news).where(eq(news.id, newsId)).limit(1);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ success: false, error: "News not found" }, { status: 404 });
    }

    // ✅ Delete in transaction
    await db.transaction(async (tx) => {
      // Delete SEO metadata first
      await tx
        .delete(seoMetadata)
        .where(
          and(
            eq(seoMetadata.entityId, newsId),
            eq(seoMetadata.entityType, "news")
          )
        );
      
      // Delete news
      await tx.delete(news).where(eq(news.id, newsId));
    });

    return NextResponse.json({ success: true, message: "News deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting news:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete news", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}