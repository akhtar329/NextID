// app/api/admin/news/create/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { news } from "@/app/lib/schema";
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

    // Create news
    const newNews = await db
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
        viewCount: 0,  // ✅ Fixed: views → viewCount
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        status: body.status ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      news: newNews[0],
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