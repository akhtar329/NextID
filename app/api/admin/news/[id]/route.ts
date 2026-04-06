// app/api/admin/news/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { news, programs, institutes, cities } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

// GET - Fetch single news
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

    const newsItem = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        content: news.content,
        excerpt: news.excerpt,
        programId: news.programId,
        instituteId: news.instituteId,
        boardId: news.boardId,
        cityId: news.cityId,
        imageUrl: news.imageUrl,
        source: news.source,
        author: news.author,
        isFeatured: news.isFeatured,
        isBreaking: news.isBreaking,
        viewCount: news.viewCount,  // ✅ Fixed: views → viewCount
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

    return NextResponse.json({ success: true, news: newsItem[0] });
  } catch (error) {
    console.error("❌ Error fetching news:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch news" }, { status: 500 });
  }
}

// PATCH - Update news (partial)
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

    // Check if news exists
    const existing = await db.select().from(news).where(eq(news.id, newsId)).limit(1);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ success: false, error: "News not found" }, { status: 404 });
    }

    // If slug is provided, check uniqueness
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

    // Prepare update object (only include fields sent)
    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt || null;
    if (body.programId !== undefined) updateData.programId = body.programId ? Number(body.programId) : null;
    if (body.instituteId !== undefined) updateData.instituteId = body.instituteId ? Number(body.instituteId) : null;
    if (body.boardId !== undefined) updateData.boardId = body.boardId ? Number(body.boardId) : null;
    if (body.cityId !== undefined) updateData.cityId = body.cityId ? Number(body.cityId) : null;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl || null;
    if (body.source !== undefined) updateData.source = body.source || null;
    if (body.author !== undefined) updateData.author = body.author || null;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
    if (body.isBreaking !== undefined) updateData.isBreaking = body.isBreaking;
    if (body.viewCount !== undefined) updateData.viewCount = body.viewCount;  // ✅ Fixed: views → viewCount
    if (body.publishedAt !== undefined) updateData.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (body.status !== undefined) updateData.status = body.status;

    // Perform update
    const updated = await db.update(news).set(updateData).where(eq(news.id, newsId)).returning();

    return NextResponse.json({ success: true, news: updated[0], message: "News updated successfully" });
  } catch (error) {
    console.error("❌ Error updating news:", error);
    return NextResponse.json({ success: false, error: "Failed to update news", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

// DELETE - Delete news
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

    const existing = await db.select().from(news).where(eq(news.id, newsId)).limit(1);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ success: false, error: "News not found" }, { status: 404 });
    }

    await db.delete(news).where(eq(news.id, newsId));

    return NextResponse.json({ success: true, message: "News deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting news:", error);
    return NextResponse.json({ success: false, error: "Failed to delete news", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}