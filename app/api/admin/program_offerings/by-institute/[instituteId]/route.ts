// app/api/admin/program_offerings/by-institute/[instituteId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { programOfferings, programs, degrees } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instituteId: string }> }
) {
  try {
    const { instituteId } = await params;
    const id = parseInt(instituteId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid institute ID" },
        { status: 400 }
      );
    }
    
    console.log("🔍 Fetching ONLY linked programs for institute:", id);
    
    // ✅ CRITICAL: This query should ONLY return records from program_offerings table
    const offerings = await db
      .select({
        id: programOfferings.id,
        programId: programOfferings.programId,
        programName: programs.name,
        degreeName: degrees.name,
      })
      .from(programOfferings)
      .innerJoin(programs, eq(programOfferings.programId, programs.id))
      .leftJoin(degrees, eq(programOfferings.degreeId, degrees.id))
      .where(eq(programOfferings.instituteId, id));  // ✅ This filters to ONLY this institute

    console.log(`✅ Found ${offerings.length} LINKED programs`);
    
    return NextResponse.json({
      success: true,
      programs: offerings,
      count: offerings.length,
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch linked programs" },
      { status: 500 }
    );
  }
}