// app/api/admin/degrees/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { degrees } from "@/app/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received body:", body);
    
    const { name, slug, fullForm, levelId, categoryId, displayOrder, status } = body;

    // Detailed validation logging
    console.log("Extracted fields:", { name, slug, fullForm, levelId, categoryId, displayOrder, status });

    // Required fields validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Degree name is required", field: "name" },
        { status: 400 }
      );
    }
    
    if (!levelId) {
      return NextResponse.json(
        { success: false, error: "Level ID is required", field: "levelId" },
        { status: 400 }
      );
    }
    
    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "Category ID is required", field: "categoryId" },
        { status: 400 }
      );
    }

    // Check for duplicate degree name
    const existing = await db.select().from(degrees).where(eq(degrees.name, name));
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Degree "${name}" already exists` },
        { status: 409 }
      );
    }

    // Check for duplicate slug
    if (slug) {
      const existingSlug = await db.select().from(degrees).where(eq(degrees.slug, slug));
      if (existingSlug.length > 0) {
        return NextResponse.json(
          { success: false, error: `Slug "${slug}" already exists` },
          { status: 409 }
        );
      }
    }

    // Fix sequence if needed - FIXED TYPE ERROR
    try {
      // Get the max ID with proper typing
      const result = await db.execute<{ max: number | null }>(sql`SELECT MAX(id) as max FROM degrees`);
      const maxId = result.rows[0]?.max ?? 0;
      
      // Reset sequence to max ID + 1
      await db.execute(sql`SELECT setval('degrees_id_seq', ${maxId + 1}, false)`);
      console.log(`✅ Sequence reset to ${maxId + 1}`);
    } catch (seqErr) {
      console.warn("⚠️ Could not reset sequence:", seqErr);
      // Continue anyway
    }

    // Insert new degree
    const inserted = await db.insert(degrees).values({
      name: name,
      slug: slug || name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      fullForm: fullForm ?? null,
      levelId: Number(levelId),
      categoryId: Number(categoryId),
      displayOrder: displayOrder ?? 0,
      status: status !== undefined ? Boolean(status) : true,
    }).returning();

    console.log("✅ Degree created successfully:", inserted[0]);
    return NextResponse.json({ success: true, degree: inserted[0] });

  } catch (err) {
    console.error("POST /degrees/create error:", err);
    
    // Check if it's a duplicate key error
    if (err instanceof Error && 'code' in err && err.code === '23505') {
      return NextResponse.json(
        { success: false, error: "This degree already exists (duplicate ID). Please try again." },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to create degree" },
      { status: 500 }
    );
  }
}