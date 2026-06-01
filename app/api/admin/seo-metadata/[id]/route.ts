// app/api/admin/date-sheets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { dateSheets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [dateSheet] = await db
      .select()
      .from(dateSheets)
      .where(eq(dateSheets.id, parseInt(id)))
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const { title, slug, boardId, instituteId, examType, examDate, year, officialLink, downloadLink, pdfFile, featuredImage, isPopular, status, description } = body;

    const [updatedDateSheet] = await db
      .update(dateSheets)
      .set({
        title,
        slug,
        boardId: boardId || null,
        instituteId: instituteId || null,
        examType: examType || null,
        examDate: examDate ? new Date(examDate) : null,
        year: Number(year),
        officialLink: officialLink || null,
        downloadLink: downloadLink || null,
        pdfFile: pdfFile || null,
        featuredImage: featuredImage || null,
        isPopular: isPopular || false,
        status: status !== undefined ? status : true,
        description: description || null,
        updatedAt: new Date(),
      })
      .where(eq(dateSheets.id, parseInt(id)))
      .returning();

    if (!updatedDateSheet) {
      return NextResponse.json(
        { error: "Date sheet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedDateSheet);
  } catch (error) {
    console.error("Error updating date sheet:", error);
    return NextResponse.json(
      { error: "Failed to update date sheet" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db
      .delete(dateSheets)
      .where(eq(dateSheets.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting date sheet:", error);
    return NextResponse.json(
      { error: "Failed to delete date sheet" },
      { status: 500 }
    );
  }
}