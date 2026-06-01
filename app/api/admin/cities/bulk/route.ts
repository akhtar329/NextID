// app/api/admin/cities/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { cities, seoMetadata } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";

// Types
interface CityInput {
  name: string;
  slug?: string;
  province?: string;
  state?: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  latitude?: string | number;
  longitude?: string | number;
  population?: string | number;
  area?: string;
  displayOrder?: string | number;
  isPopular?: boolean | string;
  popular?: string;
  status?: boolean | string;
  // SEO fields (legacy)
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

interface CityData {
  name: string;
  slug: string;
  province: string | null;
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  latitude: string | null;
  longitude: string | null;
  population: number | null;
  area: string | null;
  displayOrder: number;
  isPopular: boolean;
  status: boolean;
}

interface SeoData {
  tempIndex: number;
  entityType: string;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  robots: string;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
}

interface InsertedCity {
  id: number;
  name: string;
  slug: string;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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

    // Validate each city
    const errors: string[] = [];
    const validCities: CityData[] = [];
    const validSeoEntries: SeoData[] = [];
    const slugMap = new Map<string, number>();

    for (let i = 0; i < bulkCities.length; i++) {
      const city: CityInput = bulkCities[i];

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

      // Prepare city data (no meta columns)
      validCities.push({
        name: city.name.trim(),
        slug: uniqueSlug,
        province: city.province || city.state || null,
        description: city.description || null,
        imageUrl: city.imageUrl || null,
        thumbnailUrl: city.thumbnailUrl || null,
        latitude: city.latitude ? String(city.latitude) : null,
        longitude: city.longitude ? String(city.longitude) : null,
        population: city.population ? parseInt(String(city.population)) : null,
        area: city.area || null,
        displayOrder: city.displayOrder ? parseInt(String(city.displayOrder)) : 0,
        isPopular: city.isPopular === true || city.isPopular === 'true' || city.popular === 'true' ? true : false,
        status: city.status === false || city.status === 'false' ? false : true,
      });

      // Prepare SEO data if provided
      if (city.metaTitle || city.metaDescription || city.metaKeywords || 
          city.seoTitle || city.seoDescription || city.ogTitle || city.ogDescription) {
        validSeoEntries.push({
          tempIndex: i,
          entityType: 'city',
          metaTitle: city.metaTitle || city.seoTitle || null,
          metaDescription: city.metaDescription || city.seoDescription || null,
          canonicalUrl: city.canonicalUrl || null,
          robots: city.robots || 'index, follow',
          ogTitle: city.ogTitle || null,
          ogDescription: city.ogDescription || null,
          ogImage: city.ogImage || null,
        });
      }
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

    if (validCities.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid cities to insert" },
        { status: 400 }
      );
    }

    // Check for existing slugs in database
    const allSlugs = validCities.map(c => c.slug);
    const existingCities = await db
      .select({ 
        id: cities.id,
        slug: cities.slug,
        name: cities.name 
      })
      .from(cities)
      .where(inArray(cities.slug, allSlugs));

    const existingSlugs = new Map(existingCities.map(e => [e.slug, e.id]));
    const existingNames = new Set(existingCities.map(e => e.name.toLowerCase()));
    
    // Filter out existing cities
    const newCities: CityData[] = [];
    const duplicateSlugs: string[] = [];
    const duplicateNames: string[] = [];

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
    const inserted: InsertedCity[] = [];
    const failed: string[] = [];

    for (const city of newCities) {
      try {
        // Double-check if slug exists (race condition)
        const existing = await db
          .select()
          .from(cities)
          .where(eq(cities.slug, city.slug));
        
        let finalSlug = city.slug;
        if (existing.length > 0) {
          // Generate new slug
          const baseSlug = city.slug;
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
          
          finalSlug = uniqueSlug;
        }

        const result = await db.insert(cities)
          .values({
            name: city.name,
            slug: finalSlug,
            province: city.province,
            description: city.description,
            imageUrl: city.imageUrl,
            thumbnailUrl: city.thumbnailUrl,
            latitude: city.latitude,
            longitude: city.longitude,
            population: city.population,
            area: city.area,
            displayOrder: city.displayOrder,
            isPopular: city.isPopular,
            status: city.status,
            createdAt: new Date(),
          })
          .returning();
        
        if (result[0]) {
          inserted.push(result[0]);
        }
      } catch (err) {
        console.error(`❌ Failed to insert ${city.name}:`, err);
        failed.push(city.name);
      }
    }

    // Insert SEO metadata for successfully inserted cities
    const seoInserted: Array<{ id: number; entityId: number; entityType: string }> = [];
    const seoFailed: string[] = [];

    for (const city of inserted) {
      // Find matching SEO data (by name or slug)
      const matchingSeo = validSeoEntries.find((seo, idx) => {
        const originalCity = bulkCities[seo.tempIndex] as CityInput;
        return originalCity && (originalCity.name === city.name || originalCity.slug === city.slug);
      });

      if (matchingSeo && (matchingSeo.metaTitle || matchingSeo.metaDescription)) {
        try {
          const seoResult = await db.insert(seoMetadata)
            .values({
              entityType: 'city',
              entityId: city.id,
              metaTitle: matchingSeo.metaTitle,
              metaDescription: matchingSeo.metaDescription,
              canonicalUrl: matchingSeo.canonicalUrl,
              robots: matchingSeo.robots,
              ogTitle: matchingSeo.ogTitle,
              ogDescription: matchingSeo.ogDescription,
              ogImage: matchingSeo.ogImage,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          
          if (seoResult[0]) {
            seoInserted.push(seoResult[0]);
          }
        } catch (err) {
          console.error(`❌ Failed to insert SEO for ${city.name}:`, err);
          seoFailed.push(city.name);
        }
      }
    }

    const response: {
      success: boolean;
      count: number;
      cities: Array<InsertedCity & { seo?: { id: number; entityId: number; entityType: string } | null }>;
      message: string;
      seoCount?: number;
      seoFailed?: string[];
      failed?: string[];
      skipped?: number;
    } = {
      success: true,
      count: inserted.length,
      cities: inserted.map(city => ({
        ...city,
        seo: seoInserted.find(s => s.entityId === city.id) || null,
      })),
      message: `Successfully created ${inserted.length} cities`
    };

    if (seoInserted.length > 0) {
      response.seoCount = seoInserted.length;
      response.message += ` with ${seoInserted.length} SEO entries`;
    }

    if (seoFailed.length > 0) {
      response.seoFailed = seoFailed;
      response.message += `, SEO failed for ${seoFailed.length} cities`;
    }

    if (failed.length > 0) {
      response.failed = failed;
      response.message += `, ${failed.length} city insertions failed`;
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

// Optional: DELETE endpoint for bulk deletion
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid or empty IDs array" },
        { status: 400 }
      );
    }

    // Delete SEO metadata first
    for (const id of ids) {
      await db
        .delete(seoMetadata)
        .where(
          and(
            eq(seoMetadata.entityType, 'city'),
            eq(seoMetadata.entityId, id)
          )
        );
    }

    // Delete cities
    const result = await db
      .delete(cities)
      .where(inArray(cities.id, ids))
      .returning({ id: cities.id });

    return NextResponse.json({
      success: true,
      deleted: result.length,
      message: `Successfully deleted ${result.length} cities and their SEO metadata`,
    });

  } catch (err) {
    console.error("🔥 Bulk delete error:", err);
    return NextResponse.json(
      { 
        success: false, 
        error: err instanceof Error ? err.message : "Failed to delete cities" 
      },
      { status: 500 }
    );
  }
}
