// app/api/admin/program-institutes/by-program/[programId]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programOfferings, institutes, cities } from "@/app/lib/schema";  // ✅ Changed: programInstitutes → programOfferings
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

    // ✅ UPDATED: Get all institutes offering this program through programOfferings
    const institutesList = await db
      .select({
        id: institutes.id,
        name: institutes.name,
        slug: institutes.slug,
        type: institutes.type,
        cityName: cities.name,
        citySlug: cities.slug,
      })
      .from(programOfferings)  // ✅ Changed
      .innerJoin(institutes, eq(programOfferings.instituteId, institutes.id))
      .innerJoin(cities, eq(institutes.cityId, cities.id))
      .where(eq(programOfferings.programId, id));

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