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

// PATCH - Partial update
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  
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
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.province !== undefined) updateData.province = body.province;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;
    if (body.population !== undefined) updateData.population = body.population;
    if (body.area !== undefined) updateData.area = body.area;
    if (body.metaTitle !== undefined) updateData.metaTitle = body.metaTitle;
    if (body.metaDescription !== undefined) updateData.metaDescription = body.metaDescription;
    if (body.metaKeywords !== undefined) updateData.metaKeywords = body.metaKeywords;
    if (body.displayOrder !== undefined) updateData.displayOrder = body.displayOrder;
    if (body.isPopular !== undefined) updateData.isPopular = Boolean(body.isPopular);
    if (body.status !== undefined) updateData.status = Boolean(body.status);
    
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

    // Update
    const updated = await db
      .update(cities)
      .set(updateData)
      .where(eq(cities.id, cityId))
      .returning();

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

    // Full update with all fields
    const updated = await db
      .update(cities)
      .set({
        name: body.name,
        slug: body.slug,
        province: body.province || null,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        thumbnailUrl: body.thumbnailUrl || null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        population: body.population || null,
        area: body.area || null,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        metaKeywords: body.metaKeywords || null,
        displayOrder: body.displayOrder ?? 0,
        isPopular: body.isPopular || false,
        status: body.status ?? true,
      })
      .where(eq(cities.id, cityId))
      .returning();

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