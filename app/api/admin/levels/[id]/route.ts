// app/api/admin/levels/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { levels } from "../../../../lib/schema";
import { eq } from "drizzle-orm";

/* =========================
   Helper: Parse ID Safely
========================= */
async function getNumericId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numericId = Number(id);
  if (isNaN(numericId)) return null;
  return numericId;
}

/* =========================
   GET → Fetch Single Level
========================= */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const numericId = await getNumericId(context);
  if (!numericId) {
    return NextResponse.json(
      { success: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  try {
    
    const level = await db
      .select()
      .from(levels)
      .where(eq(levels.id, numericId));

    if (!level.length) {
      return NextResponse.json(
        { success: false, error: "Level not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, level: level[0] });
  } catch (err) {
    console.error("❌ GET error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch level" },
      { status: 500 }
    );
  }
}

/* =========================
   PUT → Update Full Level
========================= */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const numericId = await getNumericId(context);
  if (!numericId) {
    return NextResponse.json(
      { success: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    if (!body.name || !body.slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check for duplicates if name is being updated
    if (body.name) {
      const [duplicate] = await db
        .select()
        .from(levels)
        .where(eq(levels.name, body.name));

      if (duplicate && duplicate.id !== numericId) {
        return NextResponse.json(
          { success: false, error: `Level name "${body.name}" already exists` },
          { status: 409 }
        );
      }
    }

    // Check for duplicates if slug is being updated
    if (body.slug) {
      const [duplicateSlug] = await db
        .select()
        .from(levels)
        .where(eq(levels.slug, body.slug));

      if (duplicateSlug && duplicateSlug.id !== numericId) {
        return NextResponse.json(
          { success: false, error: `Slug "${body.slug}" already exists` },
          { status: 409 }
        );
      }
    }

    const updated = await db
      .update(levels)
      .set({
        name: body.name.trim(),
        slug: body.slug.trim(),
        fullForm: body.fullForm || null,
        displayOrder: Number(body.displayOrder) || 0,
        status: body.status !== undefined ? Boolean(body.status) : true,
      })
      .where(eq(levels.id, numericId))
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        { success: false, error: "Level not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, level: updated[0] });
  } catch (err: any) {
    console.error("❌ PUT error:", err);

    if (err.code === "23505") {
      return NextResponse.json(
        { success: false, error: "Name or slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update level" },
      { status: 500 }
    );
  }
}

/* =========================
   PATCH → Partial Update
========================= */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const numericId = await getNumericId(context);
  if (!numericId) {
    return NextResponse.json(
      { success: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    // Build update object dynamically
    const updateData: Record<string, any> = {};
    
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.slug !== undefined) updateData.slug = body.slug.trim();
    if (body.fullForm !== undefined) updateData.fullForm = body.fullForm || null; // 👈 ADDED
    if (body.displayOrder !== undefined) updateData.displayOrder = Number(body.displayOrder);
    if (body.status !== undefined) updateData.status = Boolean(body.status);

    // Check for duplicates if name is being updated
    if (body.name) {
      const [duplicate] = await db
        .select()
        .from(levels)
        .where(eq(levels.name, body.name));

      if (duplicate && duplicate.id !== numericId) {
        return NextResponse.json(
          { success: false, error: `Level name "${body.name}" already exists` },
          { status: 409 }
        );
      }
    }

    // Check for duplicates if slug is being updated
    if (body.slug) {
      const [duplicateSlug] = await db
        .select()
        .from(levels)
        .where(eq(levels.slug, body.slug));

      if (duplicateSlug && duplicateSlug.id !== numericId) {
        return NextResponse.json(
          { success: false, error: `Slug "${body.slug}" already exists` },
          { status: 409 }
        );
      }
    }

    // Only update if there's data to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await db
      .update(levels)
      .set(updateData)
      .where(eq(levels.id, numericId))
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        { success: false, error: "Level not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, level: updated[0] });
  } catch (err: any) {
    console.error("❌ PATCH error:", err);

    if (err.code === "23505") {
      return NextResponse.json(
        { success: false, error: "Name or slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update level" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE → Remove Level
========================= */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const numericId = await getNumericId(context);
  if (!numericId) {
    return NextResponse.json(
      { success: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  try {

    // Check if level exists
    const [existing] = await db
      .select()
      .from(levels)
      .where(eq(levels.id, numericId));

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Level not found" },
        { status: 404 }
      );
    }

    // Check if level is being used by any degrees
    const { degrees } = await import("../../../../lib/schema");
    const usedByDegrees = await db
      .select()
      .from(degrees)
      .where(eq(degrees.levelId, numericId));

    if (usedByDegrees.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete level "${existing.name}" because it is used by ${usedByDegrees.length} degree(s). Please reassign these degrees first.` 
        },
        { status: 409 }
      );
    }

    const deleted = await db
      .delete(levels)
      .where(eq(levels.id, numericId))
      .returning({ id: levels.id });
    return NextResponse.json({ 
      success: true, 
      message: "Level deleted successfully" 
    });
  } catch (err) {
    console.error("❌ DELETE error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete level" },
      { status: 500 }
    );
  }
}