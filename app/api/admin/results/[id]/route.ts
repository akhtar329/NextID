// app/api/admin/results/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { results, institutes } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

// GET - Fetch single result
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🚀 GET /api/admin/results/[id] called");
  
  try {
    const { id } = await params;
    const resultId = parseInt(id);

    if (isNaN(resultId)) {
      return NextResponse.json(
        { success: false, error: "Invalid result ID" },
        { status: 400 }
      );
    }

    // Fetch result with institute details
    const result = await db
      .select({
        id: results.id,
        title: results.title,
        boardId: results.boardId,
        universityId: results.universityId,
        year: results.year,
        resultDate: results.resultDate,
        officialLink: results.officialLink,
        isPopular: results.isPopular,
        status: results.status,
        createdAt: results.createdAt,
        // Get board/university details if available
        boardName: institutes.name,
        universityName: institutes.name,
      })
      .from(results)
      .leftJoin(institutes, eq(results.boardId, institutes.id))
      .where(eq(results.id, resultId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Result not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      result: result[0],
    });

  } catch (error) {
    console.error("❌ Error fetching result:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch result",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// PUT - Update result
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🚀 PUT /api/admin/results/[id] called");
  
  try {
    const { id } = await params;
    const resultId = parseInt(id);

    if (isNaN(resultId)) {
      return NextResponse.json(
        { success: false, error: "Invalid result ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("📦 Update data:", body);

    // Validate required fields
    if (!body.title || !body.year) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Title and Year are required" 
        },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await db
      .select()
      .from(results)
      .where(eq(results.id, resultId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Result not found" },
        { status: 404 }
      );
    }

    // Update result
    const updated = await db
      .update(results)
      .set({
        title: body.title,
        boardId: body.boardId ? Number(body.boardId) : null,
        universityId: body.universityId ? Number(body.universityId) : null,
        year: Number(body.year),
        resultDate: body.resultDate ? new Date(body.resultDate) : null,
        officialLink: body.officialLink || null,
        isPopular: body.isPopular ?? false,
        status: body.status ?? true,
      })
      .where(eq(results.id, resultId))
      .returning();

    console.log("✅ Result updated:", resultId);

    return NextResponse.json({
      success: true,
      result: updated[0],
      message: "Result updated successfully",
    });

  } catch (error) {
    console.error("❌ Error updating result:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update result",
        details: error instanceof Error ? error.message : "Unknown error",
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
  console.log("🚀 PATCH /api/admin/results/[id] called");
  
  try {
    const { id } = await params;
    const resultId = parseInt(id);

    if (isNaN(resultId)) {
      return NextResponse.json(
        { success: false, error: "Invalid result ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Update only provided fields
    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isPopular !== undefined) updateData.isPopular = body.isPopular;

    const updated = await db
      .update(results)
      .set(updateData)
      .where(eq(results.id, resultId))
      .returning();

    return NextResponse.json({
      success: true,
      result: updated[0],
    });

  } catch (error) {
    console.error("❌ Error in PATCH:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update result" },
      { status: 500 }
    );
  }
}

// DELETE - Delete result
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🚀 DELETE /api/admin/results/[id] called");
  
  try {
    const { id } = await params;
    const resultId = parseInt(id);

    if (isNaN(resultId)) {
      return NextResponse.json(
        { success: false, error: "Invalid result ID" },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await db
      .select()
      .from(results)
      .where(eq(results.id, resultId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Result not found" },
        { status: 404 }
      );
    }

    // Delete
    await db
      .delete(results)
      .where(eq(results.id, resultId));

    console.log("✅ Result deleted:", resultId);

    return NextResponse.json({
      success: true,
      message: "Result deleted successfully",
    });

  } catch (error) {
    console.error("❌ Error deleting result:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete result",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}