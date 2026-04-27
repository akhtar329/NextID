// app/api/admin/results/create/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { results } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.year || !body.slug) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Title, Year, and Slug are required" 
        },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingResult = await db
      .select()
      .from(results)
      .where(eq(results.slug, body.slug))
      .limit(1);

    if (existingResult.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Slug already exists. Please use a different slug." 
        },
        { status: 400 }
      );
    }

    // ✅ UPDATED: Removed programId and universityId, keep instituteId and boardId
    const newResult = await db
      .insert(results)
      .values({
        title: body.title,
        slug: body.slug,
        instituteId: body.instituteId ? Number(body.instituteId) : null,
        boardId: body.boardId ? Number(body.boardId) : null,
        year: Number(body.year),
        resultDate: body.resultDate ? new Date(body.resultDate) : null,
        officialLink: body.officialLink || null,
        isPopular: body.isPopular || false,
        status: body.status ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      result: newResult[0],
      message: "Result created successfully",
    });

  } catch (error) {
    console.error("❌ Error creating result:", error);
    
    // Handle duplicate slug error
    if ((error as any)?.code === '23505') {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate slug. Please use a different slug.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create result",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
