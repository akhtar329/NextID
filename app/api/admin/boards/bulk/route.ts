// app/api/admin/boards/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { boards } from "@/app/lib/schema";
import { eq, inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { boards: bulkBoards } = body;

    // Validation
    if (!bulkBoards || !Array.isArray(bulkBoards)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid data format. Expected array of boards." 
        },
        { status: 400 }
      );
    }

    if (bulkBoards.length === 0) {
      return NextResponse.json(
        { success: false, error: "No boards provided" },
        { status: 400 }
      );
    }

    // Validate each board
    const errors: string[] = [];
    const validBoards = [];
    const slugMap = new Map<string, number>();

    for (let i = 0; i < bulkBoards.length; i++) {
      const board = bulkBoards[i];

      // Required fields
      if (!board.name) {
        errors.push(`Row ${i + 1}: Board name is required`);
        continue;
      }

      if (!board.cityId) {
        errors.push(`Row ${i + 1}: City ID is required`);
        continue;
      }

      // Generate slug if not provided
      let slug = board.slug;
      if (!slug) {
        slug = board.name
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

      validBoards.push({
        name: board.name.trim(),
        slug: uniqueSlug,
        cityId: Number(board.cityId),
        website: board.website || null,
        description: board.description || null,
        establishedYear: board.establishedYear ? parseInt(board.establishedYear) : null,
        contactEmail: board.contactEmail || null,
        contactPhone: board.contactPhone || null,
        address: board.address || null,
        // ✅ SEO Fields
        metaTitle: board.metaTitle || null,
        metaDescription: board.metaDescription || null,
        metaKeywords: board.metaKeywords || null,
        status: board.status === false || board.status === 'false' ? false : true,
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
    const allSlugs = validBoards.map(b => b.slug);
    const existingBoards = await db
      .select({ 
        slug: boards.slug,
        name: boards.name 
      })
      .from(boards)
      .where(inArray(boards.slug, allSlugs));

    const existingSlugs = new Set(existingBoards.map(e => e.slug));
    const existingNames = new Set(existingBoards.map(e => e.name.toLowerCase()));
    
    // Filter out existing boards
    const newBoards = [];
    const duplicateSlugs = [];
    const duplicateNames = [];

    for (const board of validBoards) {
      const nameLower = board.name.toLowerCase();
      
      if (existingSlugs.has(board.slug)) {
        duplicateSlugs.push(board.name);
        continue;
      }
      
      if (existingNames.has(nameLower)) {
        duplicateNames.push(board.name);
        continue;
      }
      
      newBoards.push(board);
    }

    if (newBoards.length === 0) {
      let errorMessage = "All boards already exist";
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

    // Insert boards with all fields including SEO
    const inserted = await db.insert(boards)
      .values(newBoards)
      .returning();

    const response: any = {
      success: true,
      count: inserted.length,
      boards: inserted,
      message: `Successfully created ${inserted.length} boards`
    };

    if (duplicateSlugs.length > 0 || duplicateNames.length > 0) {
      response.skipped = duplicateSlugs.length + duplicateNames.length;
      response.message += `. Skipped ${response.skipped} duplicates`;
    }

    return NextResponse.json(response);

  } catch (err) {
    console.error("🔥 Bulk upload error:", err);
    
    if (err instanceof Error) {
      if ('code' in err && err.code === '23505') {
        return NextResponse.json(
          { 
            success: false, 
            error: "Duplicate entry found. Some boards already exist." 
          },
          { status: 409 }
        );
      }
      
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