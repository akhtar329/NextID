// app/api/admin/program-institutes/by-institute/[instituteId]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programInstitutes, programs, degrees, levels } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ instituteId: string }> }
) {
  console.log("🚀 GET /api/admin/program-institutes/by-institute called");
  
  try {
    // IMPORTANT: Await params
    const { instituteId } = await params;
    console.log("📦 instituteId from params:", instituteId);
    
    const id = parseInt(instituteId);
    console.log("🔢 Parsed ID:", id);

    if (isNaN(id)) {
      console.log("❌ Invalid ID");
      return NextResponse.json(
        { success: false, error: "Invalid institute ID" },
        { status: 400 }
      );
    }

    console.log("🔍 Fetching programs for institute ID:", id);
    
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

    console.log(`✅ Found ${programsList.length} programs`);

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