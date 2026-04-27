// app/api/admin/degrees/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { degrees } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { degrees: bulkDegrees } = body;

    // Validation
    if (!bulkDegrees || !Array.isArray(bulkDegrees)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid data format. Expected array of degrees." 
        },
        { status: 400 }
      );
    }

    if (bulkDegrees.length === 0) {
      return NextResponse.json(
        { success: false, error: "No degrees provided" },
        { status: 400 }
      );
    }

    // Validate each degree
    const errors: string[] = [];
    const validDegrees = [];
    const nameMap = new Map<string, number>();

    for (let i = 0; i < bulkDegrees.length; i++) {
      const deg = bulkDegrees[i];

      // Required fields
      if (!deg.name) {
        errors.push(`Row ${i + 1}: Degree name is required`);
        continue;
      }

      if (!deg.levelId) {
        errors.push(`Row ${i + 1}: Level ID is required`);
        continue;
      }

      if (!deg.categoryId) {
        errors.push(`Row ${i + 1}: Category ID is required`);
        continue;
      }

      // Generate slug if not provided
      let slug = deg.slug;
      if (!slug) {
        slug = deg.name
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
      }

      // Handle duplicate names in same batch
      let uniqueName = deg.name;
      let counter = 1;
      while (nameMap.has(uniqueName)) {
        uniqueName = `${deg.name} ${counter}`;
        counter++;
      }
      nameMap.set(uniqueName, i);

      validDegrees.push({
        name: uniqueName.trim(),
        slug: slug,
        fullForm: deg.fullForm || deg.fullform || null,
        levelId: Number(deg.levelId),
        categoryId: Number(deg.categoryId),
        displayOrder: Number(deg.displayOrder) || 0,
        status: deg.status === false || deg.status === 'false' ? false : true,
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

    // Check for existing degrees with same name
    const newDegrees = [];
    const duplicateNames = [];

    for (const deg of validDegrees) {
      const existing = await db
        .select({ id: degrees.id })
        .from(degrees)
        .where(eq(degrees.name, deg.name));

      if (existing.length === 0) {
        newDegrees.push(deg);
      } else {
        duplicateNames.push(deg.name);
      }
    }

    if (newDegrees.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "All degrees already exist",
          duplicates: duplicateNames 
        },
        { status: 409 }
      );
    }

    // Insert degrees
    const inserted = await db.insert(degrees)
      .values(newDegrees)
      .returning();

    const response: any = {
      success: true,
      count: inserted.length,
      degrees: inserted,
      message: `Successfully created ${inserted.length} degrees`
    };

    if (duplicateNames.length > 0) {
      response.skipped = duplicateNames.length;
      response.message += `. Skipped ${duplicateNames.length} duplicates`;
      response.duplicates = duplicateNames;
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
            error: "Duplicate entry found. Some degrees already exist." 
          },
          { status: 409 }
        );
      }
      
      // Foreign key violation
      if ('code' in err && err.code === '23503') {
        return NextResponse.json(
          { 
            success: false, 
            error: "Invalid level ID or category ID. Please check that all IDs exist." 
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

// OPTIONAL: Handle GET requests (optional)
export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      error: "Method not allowed. Use POST for bulk upload." 
    },
    { status: 405 }
  );
}
