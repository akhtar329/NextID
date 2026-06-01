// app/api/admin/institutes/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { institutes, cities } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET - Fetch single institute (EDIT PAGE KE LIYE YEH CHAHIYE)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  
  try {
    const { id } = await params;
    
    const instituteId = parseInt(id);

    if (isNaN(instituteId)) {
      return NextResponse.json(
        { success: false, error: "Invalid institute ID" },
        { status: 400 }
      );
    }

    // Fetch institute with city data
    const institute = await db
      .select({
        id: institutes.id,
        name: institutes.name,
        slug: institutes.slug,
        type: institutes.type,
        cityId: institutes.cityId,
        cityName: cities.name,
        description: institutes.description,
        website: institutes.website,
        status: institutes.status,
        createdAt: institutes.createdAt,
      })
      .from(institutes)
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .where(eq(institutes.id, instituteId))
      .limit(1);

    if (institute.length === 0) {
      return NextResponse.json(
        { success: false, error: "Institute not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      institute: institute[0],
    });

  } catch (error) {
    console.error("❌ Error in GET:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch institute",
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
    const instituteId = parseInt(id);

    if (isNaN(instituteId)) {
      return NextResponse.json(
        { success: false, error: "Invalid institute ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if exists
    const existing = await db
      .select()
      .from(institutes)
      .where(eq(institutes.id, instituteId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Institute not found" },
        { status: 404 }
      );
    }

    // Update only provided fields
    const updateData: any = {};
    
    if (body.status !== undefined) updateData.status = Boolean(body.status);
    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) {
      if (body.type !== "Govt" && body.type !== "Private") {
        return NextResponse.json(
          { success: false, error: "Type must be either 'Govt' or 'Private'" },
          { status: 400 }
        );
      }
      updateData.type = body.type;
    }
    if (body.cityId !== undefined) updateData.cityId = Number(body.cityId);
    if (body.description !== undefined) updateData.description = body.description;
    if (body.website !== undefined) updateData.website = body.website;
    
    if (body.slug !== undefined) {
      // Check if slug exists on another institute
      const slugExists = await db
        .select()
        .from(institutes)
        .where(eq(institutes.slug, body.slug))
        .limit(1);

      if (slugExists.length > 0 && slugExists[0].id !== instituteId) {
        return NextResponse.json(
          { success: false, error: "Slug already exists on another institute" },
          { status: 400 }
        );
      }
      updateData.slug = body.slug;
    }

    // Update
    const updated = await db
      .update(institutes)
      .set(updateData)
      .where(eq(institutes.id, instituteId))
      .returning();

    return NextResponse.json({
      success: true,
      institute: updated[0],
      message: "Institute updated successfully",
    });

  } catch (error) {
    console.error("❌ Error in PATCH:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update institute",
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
    const instituteId = parseInt(id);

    if (isNaN(instituteId)) {
      return NextResponse.json(
        { success: false, error: "Invalid institute ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.slug || !body.type || !body.cityId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Name, slug, type, and cityId are required" 
        },
        { status: 400 }
      );
    }

    // Validate type
    if (body.type !== "Govt" && body.type !== "Private") {
      return NextResponse.json(
        { success: false, error: "Type must be either 'Govt' or 'Private'" },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await db
      .select()
      .from(institutes)
      .where(eq(institutes.id, instituteId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Institute not found" },
        { status: 404 }
      );
    }

    // Check slug uniqueness
    const slugExists = await db
      .select()
      .from(institutes)
      .where(eq(institutes.slug, body.slug))
      .limit(1);

    if (slugExists.length > 0 && slugExists[0].id !== instituteId) {
      return NextResponse.json(
        { success: false, error: "Slug already exists on another institute" },
        { status: 400 }
      );
    }

    // Update
    const updated = await db
      .update(institutes)
      .set({
        name: body.name,
        slug: body.slug,
        type: body.type,
        cityId: Number(body.cityId),
        description: body.description || null,
        website: body.website || null,
        status: body.status ?? true,
      })
      .where(eq(institutes.id, instituteId))
      .returning();

    return NextResponse.json({
      success: true,
      institute: updated[0],
      message: "Institute updated successfully",
    });

  } catch (error) {
    console.error("❌ Error in PUT:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update institute",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete institute
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  
  try {
    const { id } = await params;
    const instituteId = parseInt(id);

    if (isNaN(instituteId)) {
      return NextResponse.json(
        { success: false, error: "Invalid institute ID" },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await db
      .select()
      .from(institutes)
      .where(eq(institutes.id, instituteId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Institute not found" },
        { status: 404 }
      );
    }

    // Delete
    await db
      .delete(institutes)
      .where(eq(institutes.id, instituteId));

    return NextResponse.json({
      success: true,
      message: "Institute deleted successfully",
    });

  } catch (error) {
    console.error("❌ Error in DELETE:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete institute",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}