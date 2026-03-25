// app/api/admin/boards/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { boards } from "@/app/lib/schema"; // ✅ Boards table import
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

    // ✅ Boards table se fetch karo
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

// PATCH update board
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

    // ✅ Boards table se check karo
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

    // Prepare update data
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

    // ✅ Boards table update karo
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

    // ✅ Boards table se delete karo
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