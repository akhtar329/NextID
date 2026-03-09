// app/api/public/news/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { news } from '@/app/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

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
        views: news.views,
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

    // ✅ FIXED: Return as 'data' field for frontend
    return NextResponse.json({
      success: true,
      data: allNews || [],  // 👈 Change from 'news' to 'data'
    });

  } catch (error) {
    console.error('Error fetching news:', error);
    
    // ✅ FIXED: Return empty array on error
    return NextResponse.json({ 
      success: false, 
      data: [],  // 👈 Always return array
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}