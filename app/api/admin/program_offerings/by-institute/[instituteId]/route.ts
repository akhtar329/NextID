// app/api/admin/program-institutes/by-institute/[instituteId]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programOfferings, programs } from "@/app/lib/schema";  // ✅ Changed: removed degrees, levels
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ instituteId: string }> }
) {
  
  try {
    // IMPORTANT: Await params
    const { instituteId } = await params;
    
    const id = parseInt(instituteId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid institute ID" },
        { status: 400 }
      );
    }
    
    // ✅ UPDATED: Get all programs offered by this institute through programOfferings
    const programsList = await db
      .select({
        id: programs.id,
        name: programs.name,
        slug: programs.slug,
        shortDescription: programs.shortDescription,
        typicalDuration: programs.typicalDuration,
        typicalFeeRange: programs.typicalFeeRange,
        isFeatured: programs.isFeatured,
      })
      .from(programOfferings)
      .innerJoin(programs, eq(programOfferings.programId, programs.id))
      .where(eq(programOfferings.instituteId, id));

    return NextResponse.json({
      success: true,
      programs: programsList,
    });

  } catch (error) {
    console.error("❌ Error in API:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch programs",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}