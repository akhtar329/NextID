// app/api/admin/date-sheets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { dateSheets } from "@/db/schema";
import { eq } from "drizzle-orm";

// ✅ Fix for GET
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Promise type
) {
  try {
    const { id } = await params; // ✅ Await params
    const dateSheetId = parseInt(id);
    
    if (isNaN(dateSheetId)) {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      );
    }
    
    const [dateSheet] = await db
      .select()
      .from(dateSheets)
      .where(eq(dateSheets.id, dateSheetId))
      .limit(1);

    if (!dateSheet) {
      return NextResponse.json(
        { error: "Date sheet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(dateSheet);
  } catch (error) {
    console.error("Error fetching date sheet:", error);
    return NextResponse.json(
      { error: "Failed to fetch date sheet" },
      { status: 500 }
    );
  }
}

// ✅ Fix for PUT
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ Await params
    const dateSheetId = parseInt(id);
    
    if (isNaN(dateSheetId)) {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const {
      title,
      slug,
      boardId,
      instituteId,
      examType,
      examDate,
      year,
      officialLink,
      downloadLink,
      pdfFile,
      isPopular,
      status,
    } = body;

    // Validate required fields
    if (!title || !slug || !year) {
      return NextResponse.json(
        { error: "Title, slug, and year are required" },
        { status: 400 }
      );
    }

    // Check if slug exists for other records
    const existing = await db
      .select()
      .from(dateSheets)
      .where(eq(dateSheets.slug, slug))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== dateSheetId) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    const [updatedDateSheet] = await db
      .update(dateSheets)
      .set({
        title,
        slug,
        boardId: boardId || null,
        instituteId: instituteId || null,
        examType: examType || null,
        examDate: examDate ? new Date(examDate) : null,
        year: parseInt(year),
        officialLink: officialLink || null,
        downloadLink: downloadLink || null,
        pdfFile: pdfFile || null,
        isPopular: isPopular || false,
        status: status !== undefined ? status : true,
        updatedAt: new Date(),
      })
      .where(eq(dateSheets.id, dateSheetId))
      .returning();

    return NextResponse.json(updatedDateSheet);
  } catch (error) {
    console.error("Error updating date sheet:", error);
    return NextResponse.json(
      { error: "Failed to update date sheet" },
      { status: 500 }
    );
  }
}

// ✅ Fix for DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ Await params
    const dateSheetId = parseInt(id);
    
    if (isNaN(dateSheetId)) {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      );
    }
    
    await db
      .delete(dateSheets)
      .where(eq(dateSheets.id, dateSheetId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting date sheet:", error);
    return NextResponse.json(
      { error: "Failed to delete date sheet" },
      { status: 500 }
    );
  }
}

// ✅ Fix for PATCH
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ Await params
    const dateSheetId = parseInt(id);
    
    if (isNaN(dateSheetId)) {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    
    const [updatedDateSheet] = await db
      .update(dateSheets)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(dateSheets.id, dateSheetId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedDateSheet
    });
  } catch (error) {
    console.error("Error updating date sheet:", error);
    return NextResponse.json(
      { error: "Failed to update date sheet" },
      { status: 500 }
    );
  }
}