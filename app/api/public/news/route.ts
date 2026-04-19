import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { news } from "@/app/lib/schema";
import { eq, desc } from "drizzle-orm";

function safeLimit(value: string | null) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 20;
  if (num > 50) return 50; // prevent heavy query abuse
  return num;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const limit = safeLimit(searchParams.get("limit"));

    const allNews = await db
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
        viewCount: news.viewCount,
        publishedAt: news.publishedAt,
        expiresAt: news.expiresAt,
        status: news.status,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
      })
      .from(news)
      .where(eq(news.status, true))
      .orderBy(desc(news.publishedAt))
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: allNews ?? [],
    });
  } catch (error) {
    console.error("Error fetching news:", error);

    return NextResponse.json({
      success: true,
      data: [], // IMPORTANT: always success true to avoid UI break
    });
  }
}