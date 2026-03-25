// app/api/admin/institutes/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { institutes } from "@/app/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name, slug, type, cityId, description, website, status } = body;

    // Validation
    if (!name || !slug || !type || !cityId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for existing institute with same slug
    const existing = await db
      .select()
      .from(institutes)
      .where(eq(institutes.slug, slug));

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Institute with slug "${slug}" already exists` },
        { status: 409 }
      );
    }

    // Check for existing institute with same name
    const existingName = await db
      .select()
      .from(institutes)
      .where(eq(institutes.name, name));

    if (existingName.length > 0) {
      return NextResponse.json(
        { success: false, error: `Institute with name "${name}" already exists` },
        { status: 409 }
      );
    }

    // Fix sequence if needed
    try {
      // Get the max ID
      const result = await db.execute<{ max: number | null }>(sql`SELECT MAX(id) as max FROM institutes`);
      const maxId = result.rows[0]?.max ?? 0;
      
      // Reset sequence to max ID + 1
      await db.execute(sql`SELECT setval('institutes_id_seq', ${maxId + 1}, false)`);
    } catch (seqErr) {
      console.warn("⚠️ Could not reset sequence:", seqErr);
    }

    // Create institute
    const newInstitute = await db
      .insert(institutes)
      .values({
        name: name.trim(),
        slug: slug.trim(),
        type: type,
        cityId: Number(cityId),
        description: description || null,
        website: website || null,
        status: status !== undefined ? Boolean(status) : true,
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      institute: newInstitute[0],
      message: "Institute created successfully" 
    });

  } catch (err: any) {
    console.error("❌ Error creating institute:", err);

    // Handle specific database errors
    if (err.code === '23505') {
      // Check which unique constraint was violated
      if (err.detail?.includes('slug')) {
        return NextResponse.json(
          { success: false, error: "Institute with this slug already exists" },
          { status: 409 }
        );
      } else if (err.detail?.includes('name')) {
        return NextResponse.json(
          { success: false, error: "Institute with this name already exists" },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { success: false, error: "Duplicate entry. This institute already exists." },
          { status: 409 }
        );
      }
    }

    // Foreign key violation (cityId doesn't exist)
    if (err.code === '23503') {
      return NextResponse.json(
        { success: false, error: "Invalid city ID. Please select a valid city." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create institute" },
      { status: 500 }
    );
  }
}