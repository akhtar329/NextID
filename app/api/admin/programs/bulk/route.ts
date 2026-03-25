// app/api/admin/programs/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programs } from "@/app/lib/schema";
import { eq, inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { programs: bulkPrograms } = body;

    // Validation
    if (!bulkPrograms || !Array.isArray(bulkPrograms)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid data format. Expected array of programs.",
          received: typeof bulkPrograms 
        },
        { status: 400 }
      );
    }

    if (bulkPrograms.length === 0) {
      return NextResponse.json(
        { success: false, error: "No programs provided" },
        { status: 400 }
      );
    }

    // Validate each program
    const errors: string[] = [];
    const validPrograms = [];
    const slugMap = new Map<string, number>();

    for (let i = 0; i < bulkPrograms.length; i++) {
      const prog = bulkPrograms[i];

      // Required fields
      if (!prog.name) {
        errors.push(`Row ${i + 1}: Program name is required`);
        continue;
      }

      if (!prog.degreeId) {
        errors.push(`Row ${i + 1}: Degree ID is required`);
        continue;
      }

      // Generate slug if not provided
      let slug = prog.slug;
      if (!slug) {
        slug = prog.name
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

      validPrograms.push({
        name: prog.name.trim(),
        slug: uniqueSlug,
        degreeId: Number(prog.degreeId),
        overview: prog.overview || prog.description || null,
        eligibility: prog.eligibility || prog.criteria || null,
        duration: prog.duration || null,
        careerScope: prog.careerScope || prog.career || null,
        feeRange: prog.feeRange || prog.fee || null,
        seoTitle: prog.seoTitle || prog.metaTitle || prog.seo_title || null,
        seoDescription: prog.seoDescription || prog.metaDescription || prog.seo_description || null,
        status: prog.status === false || prog.status === 'false' ? false : true,
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
    const allSlugs = validPrograms.map(p => p.slug);
    const existingPrograms = await db
      .select({ 
        slug: programs.slug,
        name: programs.name 
      })
      .from(programs)
      .where(inArray(programs.slug, allSlugs));

    const existingSlugs = new Set(existingPrograms.map(e => e.slug));
    const existingNames = new Set(existingPrograms.map(e => e.name.toLowerCase()));
    
    // Filter out existing programs
    const newPrograms = [];
    const duplicateSlugs = [];
    const duplicateNames = [];

    for (const prog of validPrograms) {
      const nameLower = prog.name.toLowerCase();
      
      if (existingSlugs.has(prog.slug)) {
        duplicateSlugs.push(prog.name);
        continue;
      }
      
      if (existingNames.has(nameLower)) {
        duplicateNames.push(prog.name);
        continue;
      }
      
      newPrograms.push(prog);
    }

    if (newPrograms.length === 0) {
      let errorMessage = "All programs already exist";
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

    // Insert programs
    const inserted = await db.insert(programs)
      .values(newPrograms)
      .returning();

    // Create response object with all properties
    const response: {
      success: boolean;
      count: number;
      programs: typeof inserted;
      message: string;
      skipped?: number;
      duplicates?: {
        slugs: string[];
        names: string[];
      };
    } = {
      success: true,
      count: inserted.length,
      programs: inserted,
      message: `Successfully created ${inserted.length} programs`
    };

    // Add skipped count if there were duplicates
    const skippedCount = duplicateSlugs.length + duplicateNames.length;
    if (skippedCount > 0) {
      response.skipped = skippedCount;
      response.message += `. Skipped ${skippedCount} duplicates`;
      response.duplicates = {
        slugs: duplicateSlugs,
        names: duplicateNames
      };
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
            error: "Duplicate entry found. Some programs already exist."
          },
          { status: 409 }
        );
      }
      
      // Foreign key violation
      if ('code' in err && err.code === '23503') {
        return NextResponse.json(
          { 
            success: false, 
            error: "Invalid degree ID. Please check that all degree IDs exist."
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