// app/api/admin/cities/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { cities } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

// GET - Fetch single city
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🚀 GET /api/admin/cities/[id] called");
  
  try {
    const { id } = await params;
    const cityId = parseInt(id);

    if (isNaN(cityId)) {
      return NextResponse.json(
        { success: false, error: "Invalid city ID" },
        { status: 400 }
      );
    }

    const city = await db
      .select()
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);

    if (city.length === 0) {
      return NextResponse.json(
        { success: false, error: "City not found" },
        { status: 404 }
      );
    }

    console.log("✅ City fetched:", city[0].name);

    return NextResponse.json({
      success: true,
      city: city[0],
    });

  } catch (error) {
    console.error("❌ Error fetching city:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch city",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// PATCH - Partial update (status, isPopular)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🚀 PATCH /api/admin/cities/[id] called");
  
  try {
    const { id } = await params;
    const cityId = parseInt(id);

    if (isNaN(cityId)) {
      return NextResponse.json(
        { success: false, error: "Invalid city ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("📦 Update data:", body);

    // Check if exists
    const existing = await db
      .select()
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "City not found" },
        { status: 404 }
      );
    }

    // Update only provided fields
    const updateData: any = {};
    
    if (body.status !== undefined) updateData.status = Boolean(body.status);
    if (body.isPopular !== undefined) updateData.isPopular = Boolean(body.isPopular);
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) {
      // Check if slug exists on another city
      const slugExists = await db
        .select()
        .from(cities)
        .where(eq(cities.slug, body.slug))
        .limit(1);

      if (slugExists.length > 0 && slugExists[0].id !== cityId) {
        return NextResponse.json(
          { success: false, error: "Slug already exists on another city" },
          { status: 400 }
        );
      }
      updateData.slug = body.slug;
    }
    if (body.province !== undefined) updateData.province = body.province;

    // Update
    const updated = await db
      .update(cities)
      .set(updateData)
      .where(eq(cities.id, cityId))
      .returning();

    console.log("✅ City updated:", cityId);

    return NextResponse.json({
      success: true,
      city: updated[0],
      message: "City updated successfully",
    });

  } catch (error) {
    console.error("❌ Error updating city:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update city",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT - Full update
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🚀 PUT /api/admin/cities/[id] called");
  
  try {
    const { id } = await params;
    const cityId = parseInt(id);

    if (isNaN(cityId)) {
      return NextResponse.json(
        { success: false, error: "Invalid city ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("📦 Full update data:", body);

    // Validate
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await db
      .select()
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "City not found" },
        { status: 404 }
      );
    }

    // Check slug uniqueness
    const slugExists = await db
      .select()
      .from(cities)
      .where(eq(cities.slug, body.slug))
      .limit(1);

    if (slugExists.length > 0 && slugExists[0].id !== cityId) {
      return NextResponse.json(
        { success: false, error: "Slug already exists on another city" },
        { status: 400 }
      );
    }

    // Update
    const updated = await db
      .update(cities)
      .set({
        name: body.name,
        slug: body.slug,
        province: body.province || null,
        isPopular: body.isPopular || false,
        status: body.status ?? true,
      })
      .where(eq(cities.id, cityId))
      .returning();

    console.log("✅ City updated fully:", cityId);

    return NextResponse.json({
      success: true,
      city: updated[0],
      message: "City updated successfully",
    });

  } catch (error) {
    console.error("❌ Error updating city:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update city",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete city
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🚀 DELETE /api/admin/cities/[id] called");
  
  try {
    const { id } = await params;
    const cityId = parseInt(id);

    if (isNaN(cityId)) {
      return NextResponse.json(
        { success: false, error: "Invalid city ID" },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await db
      .select()
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "City not found" },
        { status: 404 }
      );
    }

    // Delete
    await db
      .delete(cities)
      .where(eq(cities.id, cityId));

    console.log("✅ City deleted:", cityId);

    return NextResponse.json({
      success: true,
      message: "City deleted successfully",
    });

  } catch (error) {
    console.error("❌ Error deleting city:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete city",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}