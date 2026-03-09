// app/api/admin/cities/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { cities } from "@/app/lib/schema";
import { eq, inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📦 Cities bulk upload received:", body);

    const { cities: bulkCities } = body;

    // Validation
    if (!bulkCities || !Array.isArray(bulkCities)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid data format. Expected array of cities." 
        },
        { status: 400 }
      );
    }

    if (bulkCities.length === 0) {
      return NextResponse.json(
        { success: false, error: "No cities provided" },
        { status: 400 }
      );
    }

    console.log(`📊 Processing ${bulkCities.length} cities for bulk upload`);

    // Validate each city
    const errors: string[] = [];
    const validCities = [];
    const slugMap = new Map<string, number>();

    for (let i = 0; i < bulkCities.length; i++) {
      const city = bulkCities[i];
      
      console.log(`🔍 Validating city ${i + 1}:`, city);

      // Required fields
      if (!city.name) {
        errors.push(`Row ${i + 1}: City name is required`);
        continue;
      }

      // Generate slug if not provided
      let slug = city.slug;
      if (!slug) {
        slug = city.name
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

      validCities.push({
        name: city.name.trim(),
        slug: uniqueSlug,
        province: city.province || city.state || null,
        isPopular: city.isPopular === true || city.isPopular === 'true' || city.popular === 'true' ? true : false,
        status: city.status === false || city.status === 'false' ? false : true,
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

    console.log(`✅ Valid cities: ${validCities.length}`);

    // Check for existing slugs in database
    const allSlugs = validCities.map(c => c.slug);
    const existingCities = await db
      .select({ 
        slug: cities.slug,
        name: cities.name 
      })
      .from(cities)
      .where(inArray(cities.slug, allSlugs));

    console.log("📚 Existing cities:", existingCities);

    const existingSlugs = new Set(existingCities.map(e => e.slug));
    const existingNames = new Set(existingCities.map(e => e.name.toLowerCase()));
    
    // Filter out existing cities
    const newCities = [];
    const duplicateSlugs = [];
    const duplicateNames = [];

    for (const city of validCities) {
      const nameLower = city.name.toLowerCase();
      
      if (existingSlugs.has(city.slug)) {
        duplicateSlugs.push(city.name);
        continue;
      }
      
      if (existingNames.has(nameLower)) {
        duplicateNames.push(city.name);
        continue;
      }
      
      newCities.push(city);
    }

    console.log(`🆕 New cities to insert: ${newCities.length}`);
    console.log(`⚠️ Duplicate slugs: ${duplicateSlugs.length}`);
    console.log(`⚠️ Duplicate names: ${duplicateNames.length}`);

    if (newCities.length === 0) {
      let errorMessage = "All cities already exist";
      if (duplicateSlugs.length > 0) {
        errorMessage = `Duplicate slugs found: ${duplicateSlugs.join(', ')}`;
      } else if (duplicateNames.length > 0) {
        errorMessage = `Duplicate names found: ${duplicateNames.join(', ')}`;
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          duplicates: {
            slugs: duplicateSlugs,
            names: duplicateNames
          }
        },
        { status: 409 }
      );
    }

    // Insert cities one by one for better error handling
    const inserted = [];
    const failed = [];

    for (const city of newCities) {
      try {
        // Double-check if slug exists (race condition)
        const existing = await db
          .select()
          .from(cities)
          .where(eq(cities.slug, city.slug));
        
        if (existing.length > 0) {
          // Generate new slug
          let baseSlug = city.slug;
          let uniqueSlug = baseSlug;
          let counter = 1;
          
          while (true) {
            const checkExisting = await db
              .select()
              .from(cities)
              .where(eq(cities.slug, uniqueSlug));
            
            if (checkExisting.length === 0) break;
            
            uniqueSlug = `${baseSlug}-${counter}`;
            counter++;
          }
          
          city.slug = uniqueSlug;
        }

        const result = await db.insert(cities)
          .values({
            name: city.name,
            slug: city.slug,
            province: city.province,
            isPopular: city.isPopular,
            status: city.status,
          })
          .returning();
        
        inserted.push(result[0]);
        console.log(`✅ Inserted: ${city.name} (${city.slug})`);
      } catch (err) {
        console.error(`❌ Failed to insert ${city.name}:`, err);
        failed.push(city.name);
      }
    }

    console.log(`✅ Successfully inserted ${inserted.length} cities`);

    const response: any = {
      success: true,
      count: inserted.length,
      cities: inserted,
      message: `Successfully created ${inserted.length} cities`
    };

    if (failed.length > 0) {
      response.failed = failed;
      response.message += `, ${failed.length} failed`;
    }

    if (duplicateSlugs.length > 0 || duplicateNames.length > 0) {
      response.skipped = duplicateSlugs.length + duplicateNames.length;
      response.message += `. Skipped ${response.skipped} duplicates`;
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
            error: "Duplicate entry found. Some cities already exist." 
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