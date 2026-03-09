// app/api/admin/degrees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { degrees } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

// GET /api/admin/degrees/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return NextResponse.json(
        { success: false, error: "Invalid degree ID" }, 
        { status: 400 }
      );
    }

    console.log(`📡 Fetching degree with ID: ${numericId}`);

    const [degree] = await db.select().from(degrees).where(eq(degrees.id, numericId));
    
    if (!degree) {
      return NextResponse.json(
        { success: false, error: "Degree not found" }, 
        { status: 404 }
      );
    }

    console.log(`✅ Degree found:`, degree);
    return NextResponse.json({ success: true, degree });
    
  } catch (err) {
    console.error("❌ GET degree error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch degree" }, 
      { status: 500 }
    );
  }
}

// PATCH /api/admin/degrees/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return NextResponse.json(
        { success: false, error: "Invalid degree ID" }, 
        { status: 400 }
      );
    }

    const body = await req.json();
    console.log(`📦 Update request for degree ${numericId}:`, body);
    
    const { name, slug, fullForm, levelId, categoryId, displayOrder, status } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Degree name is required" }, 
        { status: 400 }
      );
    }

    // Fetch existing degree
    const [existing] = await db.select().from(degrees).where(eq(degrees.id, numericId));
    
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Degree not found" }, 
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current degree)
    if (name !== existing.name) {
      const [duplicate] = await db
        .select()
        .from(degrees)
        .where(eq(degrees.name, name));

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: `Degree name "${name}" already exists` },
          { status: 409 }
        );
      }
    }

    // Check for duplicate slug (if provided and changed)
    if (slug && slug !== existing.slug) {
      const [duplicateSlug] = await db
        .select()
        .from(degrees)
        .where(eq(degrees.slug, slug));

      if (duplicateSlug) {
        return NextResponse.json(
          { success: false, error: `Slug "${slug}" already exists` },
          { status: 409 }
        );
      }
    }

    // Convert status to boolean
    let statusValue: boolean | undefined = undefined;
    if (status !== undefined) {
      if (typeof status === 'string') {
        // Handle string values like "true", "false", "active", "inactive", "published", "draft"
        statusValue = status === 'true' || status === 'active' || status === 'published';
      } else {
        statusValue = Boolean(status);
      }
    }

    // Prepare update data
    const updateData: Record<string, any> = {};

    if (name) updateData.name = name.trim();
    if (slug) updateData.slug = slug.trim();
    if (fullForm !== undefined) updateData.fullForm = fullForm || null;
    if (levelId !== undefined && levelId !== null) updateData.levelId = Number(levelId);
    if (categoryId !== undefined && categoryId !== null) updateData.categoryId = Number(categoryId);
    if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);
    if (statusValue !== undefined) updateData.status = statusValue;

    console.log("📤 Update data:", updateData);

    // Perform update
    await db.update(degrees)
      .set(updateData)
      .where(eq(degrees.id, numericId));

    // Fetch updated degree
    const [updated] = await db.select().from(degrees).where(eq(degrees.id, numericId));

    console.log(`✅ Degree ${numericId} updated successfully:`, updated);
    
    return NextResponse.json({ 
      success: true, 
      message: "Degree updated successfully",
      degree: updated 
    });
    
  } catch (err) {
    console.error("❌ PATCH degree error:", err);
    
    // Handle specific database errors
    if (err instanceof Error && 'code' in err) {
      // Unique violation
      if (err.code === '23505') {
        return NextResponse.json(
          { success: false, error: "Duplicate entry. This degree name or slug already exists." },
          { status: 409 }
        );
      }
      // Foreign key violation
      if (err.code === '23503') {
        return NextResponse.json(
          { success: false, error: "Invalid level or category ID. Please check your selection." },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to update degree" }, 
      { status: 500 }
    );
  }
}

// DELETE /api/admin/degrees/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return NextResponse.json(
        { success: false, error: "Invalid degree ID" }, 
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting degree with ID: ${numericId}`);

    // Check if degree exists
    const [existing] = await db.select().from(degrees).where(eq(degrees.id, numericId));
    
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Degree not found" }, 
        { status: 404 }
      );
    }

    // Check if degree is being used by any programs
    const { programs } = await import("@/app/lib/schema");
    const usedByPrograms = await db
      .select()
      .from(programs)
      .where(eq(programs.degreeId, numericId));

    if (usedByPrograms.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete degree "${existing.name}" because it is used by ${usedByPrograms.length} program(s). Please reassign these programs first.` 
        },
        { status: 409 }
      );
    }

    // Delete degree
    await db.delete(degrees).where(eq(degrees.id, numericId));

    console.log(`✅ Degree ${numericId} deleted successfully`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Degree deleted successfully" 
    });
    
  } catch (err) {
    console.error("❌ DELETE degree error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete degree" }, 
      { status: 500 }
    );
  }
}