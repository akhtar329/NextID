// app/api/admin/program-institutes/by-program/[programId]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programInstitutes, institutes, cities } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ programId: string }> }
) {
  
  try {
    const { programId } = await params;
    
    const id = parseInt(programId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid program ID" },
        { status: 400 }
      );
    }

    // Get all institutes offering this program
    const institutesList = await db
      .select({
        id: institutes.id,
        name: institutes.name,
        type: institutes.type,
        cityName: cities.name,
      })
      .from(programInstitutes)
      .innerJoin(institutes, eq(programInstitutes.instituteId, institutes.id))
      .innerJoin(cities, eq(institutes.cityId, cities.id))
      .where(eq(programInstitutes.programId, id));

    return NextResponse.json({
      success: true,
      institutes: institutesList,
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch institutes" },
      { status: 500 }
    );
  }
}