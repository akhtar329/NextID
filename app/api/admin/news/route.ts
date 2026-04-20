// app/api/admin/news/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { news, programs, institutes, cities } from "@/app/lib/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: Request) {
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const isFeatured = searchParams.get("isFeatured");
    const isBreaking = searchParams.get("isBreaking");

    // Fetch all news with related data
    const query = db
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
        // Related data
        programName: programs.name,
        instituteName: institutes.name,
        cityName: cities.name,
      })
      .from(news)
      .leftJoin(programs, eq(news.programId, programs.id))
      .leftJoin(institutes, eq(news.instituteId, institutes.id))
      .leftJoin(cities, eq(news.cityId, cities.id))
      .orderBy(desc(news.createdAt));

    const allNews = await query;

    // Apply filters
    let filteredNews = allNews;

    if (status) {
      filteredNews = filteredNews.filter(n => n.status === (status === "true"));
    }
    if (isFeatured) {
      filteredNews = filteredNews.filter(n => n.isFeatured === (isFeatured === "true"));
    }
    if (isBreaking) {
      filteredNews = filteredNews.filter(n => n.isBreaking === (isBreaking === "true"));
    }

    return NextResponse.json({
      success: true,
      news: filteredNews,
    });

  } catch (error) {
    console.error("❌ Error fetching news:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch news",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}