// app/api/admin/institutes/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { institutes } from "@/app/lib/schema";
import { eq, inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { institutes: bulkInstitutes } = body;

    // Validation
    if (!bulkInstitutes || !Array.isArray(bulkInstitutes)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid data format. Expected array of institutes." 
        },
        { status: 400 }
      );
    }

    if (bulkInstitutes.length === 0) {
      return NextResponse.json(
        { success: false, error: "No institutes provided" },
        { status: 400 }
      );
    }

    // Validate each institute
    const errors: string[] = [];
    const validInstitutes = [];
    const slugMap = new Map<string, number>();

    for (let i = 0; i < bulkInstitutes.length; i++) {
      const inst = bulkInstitutes[i];

      // Required fields
      if (!inst.name) {
        errors.push(`Row ${i + 1}: Institute name is required`);
        continue;
      }

      if (!inst.type) {
        errors.push(`Row ${i + 1}: Institute type is required`);
        continue;
      }

      if (!inst.cityId) {
        errors.push(`Row ${i + 1}: City ID is required`);
        continue;
      }

      // Validate type
      if (inst.type !== 'Govt' && inst.type !== 'Private') {
        errors.push(`Row ${i + 1}: Type must be either "Govt" or "Private"`);
        continue;
      }

      // Generate slug if not provided
      let slug = inst.slug;
      if (!slug) {
        slug = inst.name
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

      validInstitutes.push({
        name: inst.name.trim(),
        slug: uniqueSlug,
        type: inst.type,
        cityId: Number(inst.cityId),
        description: inst.description || inst.desc || null,
        website: inst.website || inst.web || null,
        isFeatured: inst.isFeatured === true || inst.isFeatured === 'true' ? true : false,
        status: inst.status === false || inst.status === 'false' ? false : true,
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
    const allSlugs = validInstitutes.map(i => i.slug);
    const existingInstitutes = await db
      .select({ 
        slug: institutes.slug,
        name: institutes.name 
      })
      .from(institutes)
      .where(inArray(institutes.slug, allSlugs));

    const existingSlugs = new Set(existingInstitutes.map(e => e.slug));
    const existingNames = new Set(existingInstitutes.map(e => e.name.toLowerCase()));
    
    // Filter out existing institutes
    const newInstitutes = [];
    const duplicateSlugs = [];
    const duplicateNames = [];

    for (const inst of validInstitutes) {
      const nameLower = inst.name.toLowerCase();
      
      if (existingSlugs.has(inst.slug)) {
        duplicateSlugs.push(inst.name);
        continue;
      }
      
      if (existingNames.has(nameLower)) {
        duplicateNames.push(inst.name);
        continue;
      }
      
      newInstitutes.push(inst);
    }

    if (newInstitutes.length === 0) {
      let errorMessage = "All institutes already exist";
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

    // Insert institutes one by one for better error handling
    const inserted = [];
    const failed = [];

    for (const inst of newInstitutes) {
      try {
        // Double-check if slug exists (race condition)
        const existing = await db
          .select()
          .from(institutes)
          .where(eq(institutes.slug, inst.slug));
        
        if (existing.length > 0) {
          // Generate new slug
          const baseSlug = inst.slug;
          let uniqueSlug = baseSlug;
          let counter = 1;
          
          while (true) {
            const checkExisting = await db
              .select()
              .from(institutes)
              .where(eq(institutes.slug, uniqueSlug));
            
            if (checkExisting.length === 0) break;
            
            uniqueSlug = `${baseSlug}-${counter}`;
            counter++;
          }
          
          inst.slug = uniqueSlug;
        }

        const result = await db.insert(institutes)
          .values({
            name: inst.name,
            slug: inst.slug,
            type: inst.type,
            cityId: inst.cityId,
            description: inst.description,
            website: inst.website,
            isFeatured: inst.isFeatured || false,
            status: inst.status,
          })
          .returning();
        
        inserted.push(result[0]);
      } catch (err) {
        console.error(`❌ Failed to insert ${inst.name}:`, err);
        failed.push(inst.name);
      }
    }

    const response: any = {
      success: true,
      count: inserted.length,
      institutes: inserted,
      message: `Successfully created ${inserted.length} institutes`
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
            error: "Duplicate entry found. Some institutes already exist." 
          },
          { status: 409 }
        );
      }
      
      // Foreign key violation (cityId doesn't exist)
      if ('code' in err && err.code === '23503') {
        return NextResponse.json(
          { 
            success: false, 
            error: "Invalid city ID. Please check that all city IDs exist." 
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