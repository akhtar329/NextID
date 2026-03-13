// app/api/admin/admissions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { admissions, admissionPrograms, programs, institutes, cities } from "@/app/lib/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  console.log("🚀 GET /api/admin/admissions called");
  
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const status = searchParams.get("status");
    const programId = searchParams.get("programId");
    const instituteId = searchParams.get("instituteId");

    // Build conditions array
    const conditions = [];

    if (year) {
      conditions.push(eq(admissions.year, parseInt(year)));
    }
    if (status) {
      conditions.push(eq(admissions.status, status));
    }
    if (instituteId) {
      conditions.push(eq(admissions.instituteId, parseInt(instituteId)));
    }

    // Where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // First fetch admissions with institute details
    const admissionsList = await db
      .select({
        id: admissions.id,
        name: admissions.name,
        slug: admissions.slug,
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        expectedOpenDate: admissions.expectedOpenDate,
        expectedCloseDate: admissions.expectedCloseDate,
        meritInfo: admissions.meritInfo,
        note: admissions.note,
        officialLink: admissions.officialLink,
        createdAt: admissions.createdAt,
        instituteId: admissions.instituteId,
        institute: {
          id: institutes.id,
          name: institutes.name,
          slug: institutes.slug,
          cityName: cities.name,
        },
      })
      .from(admissions)
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .innerJoin(cities, eq(institutes.cityId, cities.id))
      .where(whereClause)
      .orderBy(desc(admissions.year), desc(admissions.createdAt));

    console.log(`✅ Found ${admissionsList.length} admissions`);

    // Now fetch programs for each admission
    const admissionsWithPrograms = await Promise.all(
      admissionsList.map(async (ad) => {
        let programList: { id: number; name: string; slug: string }[] = [];
        
        try {
          programList = await db
            .select({
              id: programs.id,
              name: programs.name,
              slug: programs.slug,
            })
            .from(admissionPrograms)
            .innerJoin(programs, eq(admissionPrograms.programId, programs.id))
            .where(eq(admissionPrograms.admissionId, ad.id));
        } catch (err) {
          console.error(`Error fetching programs for admission ${ad.id}:`, err);
        }

        // Filter by programId if needed (client-side)
        if (programId && programList.length > 0) {
          programList = programList.filter(p => p.id === parseInt(programId));
        }

        return {
          ...ad,
          programs: programList,
        };
      })
    );

    // Filter out admissions with no programs if programId filter is applied
    let finalAdmissions = admissionsWithPrograms;
    if (programId) {
      finalAdmissions = admissionsWithPrograms.filter(ad => 
        ad.programs.some(p => p.id === parseInt(programId))
      );
    }

    return NextResponse.json({
      success: true,
      admissions: finalAdmissions,
    });

  } catch (error) {
    console.error("❌ Error fetching admissions:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch admissions",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}