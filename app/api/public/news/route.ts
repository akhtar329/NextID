// app/api/public/news/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { news } from "@/app/lib/schema";
import { eq, desc } from "drizzle-orm";

function safeLimit(value: string | null): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 20;
  if (num > 50) return 50;
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

    const response = NextResponse.json({
      success: true,
      data: allNews || [],
      total: allNews.length,
    });

    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');

    return response;
  } catch {
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
    });
  }
}
