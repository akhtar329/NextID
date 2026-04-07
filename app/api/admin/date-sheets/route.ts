// app/api/admin/date-sheets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { dateSheets, boards, institutes } from "@/app/lib/schema";
import { eq, desc, ilike, or } from "drizzle-orm";

// ✅ GET method (already exists)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const results = await db
      .select({
        id: dateSheets.id,
        title: dateSheets.title,
        slug: dateSheets.slug,
        examType: dateSheets.examType,
        year: dateSheets.year,
        boardId: dateSheets.boardId,
        instituteId: dateSheets.instituteId,
        status: dateSheets.status,
        viewCount: dateSheets.viewCount,
        isPopular: dateSheets.isPopular,
        createdAt: dateSheets.createdAt,
        board: {
          name: boards.name,
        },
        institute: {
          name: institutes.name,
        },
      })
      .from(dateSheets)
      .leftJoin(boards, eq(dateSheets.boardId, boards.id))
      .leftJoin(institutes, eq(dateSheets.instituteId, institutes.id))
      .where(
        search
          ? or(
              ilike(dateSheets.title, `%${search}%`),
              ilike(dateSheets.examType, `%${search}%`)
            )
          : undefined
      )
      .orderBy(desc(dateSheets.createdAt));

    return NextResponse.json(results);

  } catch (error) {
    console.error("Error fetching date sheets:", error);
    return NextResponse.json(
      { error: "Failed to fetch date sheets" },
      { status: 500 }
    );
  }
}

// ✅ ADD POST method (for creating date sheets)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("Received payload:", body);

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
      featuredImage, 
      isPopular, 
      status, 
      description 
    } = body;

    // Validate required fields
    if (!title || !slug || !year) {
      return NextResponse.json(
        { error: "Title, slug, and year are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await db
      .select()
      .from(dateSheets)
      .where(eq(dateSheets.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    // Insert new date sheet
    const [newDateSheet] = await db
      .insert(dateSheets)
      .values({
        title,
        slug,
        boardId: boardId ? Number(boardId) : null,
        instituteId: instituteId ? Number(instituteId) : null,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log("Created date sheet:", newDateSheet);

    return NextResponse.json(newDateSheet, { status: 201 });
    
  } catch (error) {
    console.error("Error creating date sheet:", error);
    return NextResponse.json(
      { error: "Failed to create date sheet", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ✅ OPTIONAL: PUT method for updating
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const [updatedDateSheet] = await db
      .update(dateSheets)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(dateSheets.id, Number(id)))
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

// ✅ OPTIONAL: DELETE method
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    await db
      .delete(dateSheets)
      .where(eq(dateSheets.id, Number(id)));

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error deleting date sheet:", error);
    return NextResponse.json(
      { error: "Failed to delete date sheet" },
      { status: 500 }
    );
  }
}