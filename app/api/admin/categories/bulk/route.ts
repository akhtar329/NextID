// app/api/admin/categories/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { categories } from "@/app/lib/schema";
import { eq, inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { categories: bulkCategories } = body;

    // Validation
    if (!bulkCategories || !Array.isArray(bulkCategories)) {
      return NextResponse.json(
        { success: false, error: "Invalid data format" },
        { status: 400 }
      );
    }

    if (bulkCategories.length === 0) {
      return NextResponse.json(
        { success: false, error: "No categories provided" },
        { status: 400 }
      );
    }

    // Validate each category
    const errors: string[] = [];
    const validCategories = [];
    const slugCount = new Map<string, number>(); // Track duplicate slugs in same batch

    for (let i = 0; i < bulkCategories.length; i++) {
      const cat = bulkCategories[i];
      
      if (!cat.name) {
        errors.push(`Row ${i + 1}: Name is required`);
        continue;
      }

      // Generate unique slug
      const baseSlug = cat.slug || cat.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Handle duplicate slugs in same batch
      let uniqueSlug = baseSlug;
      let counter = 1;
      
      while (slugCount.has(uniqueSlug)) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      slugCount.set(uniqueSlug, 1);

      validCategories.push({
        name: cat.name.trim(),
        slug: uniqueSlug,
        displayOrder: Number(cat.displayOrder) || 0,
        status: cat.status !== false,
      });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    // Check for existing slugs in database
    const allSlugs = validCategories.map(c => c.slug);
    const existingSlugs = await db
      .select({ slug: categories.slug })
      .from(categories)
      .where(inArray(categories.slug, allSlugs));

    const existingSlugSet = new Set(existingSlugs.map(e => e.slug));
    
    // Filter out existing slugs and generate new unique slugs for duplicates
    const newCategories = [];
    const slugMap = new Map<string, number>();

    for (const cat of validCategories) {
      if (!existingSlugSet.has(cat.slug)) {
        // Slug doesn't exist in database
        newCategories.push(cat);
      } else {
        // Slug exists, generate new unique slug
        const baseSlug = cat.slug;
        let uniqueSlug = baseSlug;
        let counter = 1;
        
        while (existingSlugSet.has(uniqueSlug) || slugMap.has(uniqueSlug)) {
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        slugMap.set(uniqueSlug, 1);
        newCategories.push({
          ...cat,
          slug: uniqueSlug
        });
      }
    }

    if (newCategories.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "All categories already exist",
          existing: Array.from(existingSlugSet)
        },
        { status: 409 }
      );
    }

    // Insert in transaction - one by one to handle errors gracefully
    const inserted = [];
    const failed = [];

    for (const cat of newCategories) {
      try {
        // Double-check if slug exists (race condition)
        const existing = await db.select()
          .from(categories)
          .where(eq(categories.slug, cat.slug));
        
        if (existing.length > 0) {
          // Generate new slug
          const baseSlug = cat.slug;
          let uniqueSlug = baseSlug;
          let counter = 1;
          
          while (true) {
            const checkExisting = await db.select()
              .from(categories)
              .where(eq(categories.slug, uniqueSlug));
            
            if (checkExisting.length === 0) break;
            
            uniqueSlug = `${baseSlug}-${counter}`;
            counter++;
          }
          
          cat.slug = uniqueSlug;
        }

        const result = await db.insert(categories)
          .values(cat)
          .returning();
        
        inserted.push(result[0]);
      } catch (err) {
        console.error(`❌ Failed to insert ${cat.name}:`, err);
        failed.push(cat.name);
      }
    }

    return NextResponse.json({
      success: true,
      count: inserted.length,
      categories: inserted,
      failed: failed,
      message: `Successfully created ${inserted.length} categories${failed.length > 0 ? `, ${failed.length} failed` : ''}`
    });

  } catch (err) {
    console.error("🔥 Bulk upload error:", err);
    return NextResponse.json(
      { 
        success: false, 
        error: err instanceof Error ? err.message : "Failed to process bulk upload"
      },
      { status: 500 }
    );
  }
}
