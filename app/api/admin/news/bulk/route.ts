// app/api/admin/news/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { news } from "@/app/lib/schema";
import { eq, inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { news: bulkNews } = body;

    // Validation
    if (!bulkNews || !Array.isArray(bulkNews)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid data format. Expected array of news items." 
        },
        { status: 400 }
      );
    }

    if (bulkNews.length === 0) {
      return NextResponse.json(
        { success: false, error: "No news items provided" },
        { status: 400 }
      );
    }

    // Validate each news item
    const errors: string[] = [];
    const validNews = [];
    const slugMap = new Map<string, number>();

    for (let i = 0; i < bulkNews.length; i++) {
      const item = bulkNews[i];

      // Required fields
      if (!item.title) {
        errors.push(`Row ${i + 1}: Title is required`);
        continue;
      }

      if (!item.content) {
        errors.push(`Row ${i + 1}: Content is required`);
        continue;
      }

      // Generate slug if not provided
      let slug = item.slug;
      if (!slug) {
        slug = item.title
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
      }

      // Handle duplicate slugs in same batch
      let uniqueSlug = slug;
      let counter = 1;
      while (slugMap.has(uniqueSlug)) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      slugMap.set(uniqueSlug, i);

      // Parse dates if provided
      let publishedAt = null;
      if (item.publishedAt) {
        publishedAt = new Date(item.publishedAt);
      }

      let expiresAt = null;
      if (item.expiresAt) {
        expiresAt = new Date(item.expiresAt);
      }

      validNews.push({
        title: item.title.trim(),
        slug: uniqueSlug,
        content: item.content,
        excerpt: item.excerpt || null,
        programId: item.programId ? Number(item.programId) : null,
        instituteId: item.instituteId ? Number(item.instituteId) : null,
        boardId: item.boardId ? Number(item.boardId) : null,
        cityId: item.cityId ? Number(item.cityId) : null,
        imageUrl: item.imageUrl || null,
        source: item.source || null,
        author: item.author || null,
        isFeatured: item.isFeatured === true || item.isFeatured === 'true' ? true : false,
        isBreaking: item.isBreaking === true || item.isBreaking === 'true' ? true : false,
        publishedAt: publishedAt,
        expiresAt: expiresAt,
        status: item.status === false || item.status === 'false' ? false : true,
      });
    }

    if (errors.length > 0) {
      console.error("❌ Validation errors:", errors);
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation failed", 
          details: errors 
        },
        { status: 400 }
      );
    }

    // Check for existing slugs in database
    const allSlugs = validNews.map(n => n.slug);
    const existingNews = await db
      .select({ 
        slug: news.slug,
        title: news.title 
      })
      .from(news)
      .where(inArray(news.slug, allSlugs));

    const existingSlugs = new Set(existingNews.map(e => e.slug));
    
    // Filter out existing news
    const newNews = [];
    const duplicateSlugs = [];

    for (const item of validNews) {
      if (existingSlugs.has(item.slug)) {
        duplicateSlugs.push(item.title);
        continue;
      }
      newNews.push(item);
    }

    if (newNews.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "All news items already exist",
          duplicates: duplicateSlugs 
        },
        { status: 409 }
      );
    }

    // Insert news items one by one for better error handling
    const inserted = [];
    const failed = [];

    for (const item of newNews) {
      try {
        // Double-check if slug exists (race condition)
        const existing = await db
          .select()
          .from(news)
          .where(eq(news.slug, item.slug));
        
        if (existing.length > 0) {
          // Generate new slug
          let baseSlug = item.slug;
          let uniqueSlug = baseSlug;
          let counter = 1;
          
          while (true) {
            const checkExisting = await db
              .select()
              .from(news)
              .where(eq(news.slug, uniqueSlug));
            
            if (checkExisting.length === 0) break;
            
            uniqueSlug = `${baseSlug}-${counter}`;
            counter++;
          }
          
          item.slug = uniqueSlug;
        }

        const result = await db.insert(news)
          .values({
            title: item.title,
            slug: item.slug,
            content: item.content,
            excerpt: item.excerpt,
            programId: item.programId,
            instituteId: item.instituteId,
            boardId: item.boardId,
            cityId: item.cityId,
            imageUrl: item.imageUrl,
            source: item.source,
            author: item.author,
            isFeatured: item.isFeatured,
            isBreaking: item.isBreaking,
            publishedAt: item.publishedAt,
            expiresAt: item.expiresAt,
            status: item.status,
          })
          .returning();
        
        inserted.push(result[0]);
      } catch (err) {
        console.error(`❌ Failed to insert ${item.title}:`, err);
        failed.push(item.title);
      }
    }

    const response: any = {
      success: true,
      count: inserted.length,
      news: inserted,
      message: `Successfully created ${inserted.length} news items`
    };

    if (failed.length > 0) {
      response.failed = failed;
      response.message += `, ${failed.length} failed`;
    }

    if (duplicateSlugs.length > 0) {
      response.skipped = duplicateSlugs.length;
      response.message += `. Skipped ${duplicateSlugs.length} duplicates`;
      response.duplicates = duplicateSlugs;
    }

    return NextResponse.json(response);

  } catch (err) {
    console.error("🔥 Bulk upload error:", err);
    
    if (err instanceof Error) {
      // PostgreSQL unique violation
      if ('code' in err && err.code === '23505') {
        return NextResponse.json(
          { 
            success: false, 
            error: "Duplicate entry found. Some news items already exist." 
          },
          { status: 409 }
        );
      }
      
      // Foreign key violation
      if ('code' in err && err.code === '23503') {
        return NextResponse.json(
          { 
            success: false, 
            error: "Invalid program, institute, board, or city ID. Please check that all IDs exist." 
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: err instanceof Error ? err.message : "Failed to process bulk upload" 
      },
      { status: 500 }
    );
  }
}