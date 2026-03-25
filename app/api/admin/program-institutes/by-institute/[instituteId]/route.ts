// app/api/admin/program-institutes/by-institute/[instituteId]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programInstitutes, programs, degrees, levels } from "@/app/lib/schema";
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
    
    // Get all programs offered by this institute
    const programsList = await db
      .select({
        id: programs.id,
        name: programs.name,
        degreeName: degrees.name,
        levelName: levels.name,
        duration: programs.duration,
      })
      .from(programInstitutes)
      .innerJoin(programs, eq(programInstitutes.programId, programs.id))
      .innerJoin(degrees, eq(programs.degreeId, degrees.id))
      .innerJoin(levels, eq(degrees.levelId, levels.id))
      .where(eq(programInstitutes.instituteId, id));

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