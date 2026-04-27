// app/api/admin/levels/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { levels } from "@/app/lib/schema";
import { eq, inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { levels: bulkLevels } = body;

    // Validation
    if (!bulkLevels || !Array.isArray(bulkLevels)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid data format. Expected array of levels." 
        },
        { status: 400 }
      );
    }

    if (bulkLevels.length === 0) {
      return NextResponse.json(
        { success: false, error: "No levels provided" },
        { status: 400 }
      );
    }

    // Validate each level
    const errors: string[] = [];
    const validLevels = [];
    const slugMap = new Map<string, number>(); // Track duplicates in same batch

    for (let i = 0; i < bulkLevels.length; i++) {
      const level = bulkLevels[i];
    

      // Required fields
      if (!level.name) {
        errors.push(`Row ${i + 1}: Level name is required`);
        continue;
      }

      // Generate slug if not provided
      let baseSlug = level.slug;
      if (!baseSlug) {
        baseSlug = level.name
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
      }

      // Handle duplicate slugs in same batch
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (slugMap.has(uniqueSlug)) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      slugMap.set(uniqueSlug, i);

      validLevels.push({
        name: level.name.trim(),
        slug: uniqueSlug,
        displayOrder: Number(level.displayOrder) || 0,
        status: level.status === false || level.status === 'false' ? false : true,
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
    const allSlugs = validLevels.map(l => l.slug);
    const existingLevels = await db
      .select({ slug: levels.slug })
      .from(levels)
      .where(inArray(levels.slug, allSlugs));

    const existingSlugs = new Set(existingLevels.map(e => e.slug));
    
    // Filter out existing slugs and generate new unique slugs
    const newLevels = [];
    const duplicateSlugs = [];

    for (const level of validLevels) {
      if (!existingSlugs.has(level.slug)) {
        newLevels.push(level);
      } else {
        duplicateSlugs.push(level.slug);
      }
    }

    if (newLevels.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "All levels already exist",
          duplicates: duplicateSlugs 
        },
        { status: 409 }
      );
    }

    // Insert levels one by one for better error handling
    const inserted = [];
    const failed = [];

    for (const level of newLevels) {
      try {
        // Double-check if slug exists (race condition)
        const existing = await db
          .select()
          .from(levels)
          .where(eq(levels.slug, level.slug));
        
        if (existing.length > 0) {
          // Generate new slug
          const baseSlug = level.slug;
          let uniqueSlug = baseSlug;
          let counter = 1;
          
          while (true) {
            const checkExisting = await db
              .select()
              .from(levels)
              .where(eq(levels.slug, uniqueSlug));
            
            if (checkExisting.length === 0) break;
            
            uniqueSlug = `${baseSlug}-${counter}`;
            counter++;
          }
          
          level.slug = uniqueSlug;
        }

        const result = await db.insert(levels)
          .values({
            name: level.name,
            slug: level.slug,
            displayOrder: level.displayOrder,
            status: level.status,
          })
          .returning();
        
        inserted.push(result[0]);
      } catch (err) {
        console.error(`❌ Failed to insert ${level.name}:`, err);
        failed.push(level.name);
      }
    }

    const response: any = {
      success: true,
      count: inserted.length,
      levels: inserted,
      message: `Successfully created ${inserted.length} levels`
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
      if ('code' in err && err.code === '23505') {
        return NextResponse.json(
          { 
            success: false, 
            error: "Duplicate entry found. Some slugs already exist." 
          },
          { status: 409 }
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
