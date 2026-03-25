// app/api/admin/cities/create/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { cities } from "@/app/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  
  try {
    const body = await request.json();

    // Validate
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug exists
    const existingSlug = await db
      .select()
      .from(cities)
      .where(eq(cities.slug, body.slug))
      .limit(1);

    if (existingSlug.length > 0) {
      return NextResponse.json(
        { success: false, error: "City with this slug already exists" },
        { status: 409 }
      );
    }

    // Check if name exists
    const existingName = await db
      .select()
      .from(cities)
      .where(eq(cities.name, body.name))
      .limit(1);

    if (existingName.length > 0) {
      return NextResponse.json(
        { success: false, error: "City with this name already exists" },
        { status: 409 }
      );
    }

    // Fix sequence if needed
    try {
      // Get the max ID
      const result = await db.execute<{ max: number | null }>(sql`SELECT MAX(id) as max FROM cities`);
      const maxId = result.rows[0]?.max ?? 0;
      
      // Reset sequence to max ID + 1
      await db.execute(sql`SELECT setval('cities_id_seq', ${maxId + 1}, false)`);
    } catch (seqErr) {
      console.warn("⚠️ Could not reset sequence:", seqErr);
    }

    // Create city
    const newCity = await db
      .insert(cities)
      .values({
        name: body.name,
        slug: body.slug,
        province: body.province || null,
        isPopular: body.isPopular || false,
        status: body.status ?? true,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      city: newCity[0],
      message: "City created successfully",
    });

  } catch (error: any) {
    console.error("❌ Error creating city:", error);

    // Handle specific database errors
    if (error.code === '23505') {
      // Check which unique constraint was violated
      if (error.detail?.includes('slug')) {
        return NextResponse.json(
          { success: false, error: "City with this slug already exists" },
          { status: 409 }
        );
      } else if (error.detail?.includes('name')) {
        return NextResponse.json(
          { success: false, error: "City with this name already exists" },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { success: false, error: "Duplicate entry. This city already exists." },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create city",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}