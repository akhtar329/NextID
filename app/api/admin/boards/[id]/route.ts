// app/api/admin/boards/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { boards } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

// GET single board
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const boardId = parseInt(id);

    if (isNaN(boardId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    // Fetch board with all fields
    const board = await db
      .select()
      .from(boards)
      .where(eq(boards.id, boardId));

    if (!board.length) {
      return NextResponse.json(
        { success: false, error: "Board not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, board: board[0] });

  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch board" },
      { status: 500 }
    );
  }
}

// PATCH update board (partial update)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const boardId = parseInt(id);

    if (isNaN(boardId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Check if board exists
    const existing = await db
      .select()
      .from(boards)
      .where(eq(boards.id, boardId));

    if (!existing.length) {
      return NextResponse.json(
        { success: false, error: "Board not found" },
        { status: 404 }
      );
    }

    // Prepare update data with all fields
    const updateData: any = {};

    if (body.status !== undefined) {
      updateData.status = Boolean(body.status);
    }

    if (body.name) {
      updateData.name = body.name.trim();
    }

    if (body.slug) {
      updateData.slug = body.slug.trim();
    }

    if (body.cityId) {
      updateData.cityId = Number(body.cityId);
    }

    if (body.website !== undefined) {
      updateData.website = body.website || null;
    }

    if (body.description !== undefined) {
      updateData.description = body.description || null;
    }

    // Contact fields
    if (body.establishedYear !== undefined) {
      updateData.establishedYear = body.establishedYear ? parseInt(body.establishedYear) : null;
    }

    if (body.contactEmail !== undefined) {
      updateData.contactEmail = body.contactEmail || null;
    }

    if (body.contactPhone !== undefined) {
      updateData.contactPhone = body.contactPhone || null;
    }

    if (body.address !== undefined) {
      updateData.address = body.address || null;
    }

    // ✅ SEO Fields
    if (body.metaTitle !== undefined) {
      updateData.metaTitle = body.metaTitle || null;
    }

    if (body.metaDescription !== undefined) {
      updateData.metaDescription = body.metaDescription || null;
    }

    if (body.metaKeywords !== undefined) {
      updateData.metaKeywords = body.metaKeywords || null;
    }

    // Update board
    const result = await db
      .update(boards)
      .set(updateData)
      .where(eq(boards.id, boardId))
      .returning();

    return NextResponse.json({ 
      success: true, 
      board: result[0] 
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update board" },
      { status: 500 }
    );
  }
}

// PUT update board (full update)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const boardId = parseInt(id);

    if (isNaN(boardId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.slug || !body.cityId) {
      return NextResponse.json(
        { success: false, error: "Name, slug and city are required" },
        { status: 400 }
      );
    }

    // Check if board exists
    const existing = await db
      .select()
      .from(boards)
      .where(eq(boards.id, boardId));

    if (!existing.length) {
      return NextResponse.json(
        { success: false, error: "Board not found" },
        { status: 404 }
      );
    }

    // Full update with all fields including SEO
    const result = await db
      .update(boards)
      .set({
        name: body.name.trim(),
        slug: body.slug.trim(),
        cityId: Number(body.cityId),
        website: body.website || null,
        description: body.description || null,
        establishedYear: body.establishedYear ? parseInt(body.establishedYear) : null,
        contactEmail: body.contactEmail || null,
        contactPhone: body.contactPhone || null,
        address: body.address || null,
        // ✅ SEO Fields
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        metaKeywords: body.metaKeywords || null,
        status: body.status !== undefined ? Boolean(body.status) : true,
      })
      .where(eq(boards.id, boardId))
      .returning();

    return NextResponse.json({ 
      success: true, 
      board: result[0] 
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update board" },
      { status: 500 }
    );
  }
}

// DELETE board
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const boardId = parseInt(id);

    if (isNaN(boardId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    // Delete board
    const result = await db
      .delete(boards)
      .where(eq(boards.id, boardId))
      .returning({ id: boards.id });

    if (!result.length) {
      return NextResponse.json(
        { success: false, error: "Board not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete board" },
      { status: 500 }
    );
  }
}