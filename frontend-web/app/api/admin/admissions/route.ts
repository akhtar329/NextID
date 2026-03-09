// app/api/admin/admissions/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { admissions, programs, institutes, cities } from "@/app/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  console.log("🚀 GET /api/admin/admissions called");
  
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const status = searchParams.get("status");
    const programId = searchParams.get("programId");
    const instituteId = searchParams.get("instituteId");

    // Base query - select all admissions with joins
    const allAdmissions = await db
      .select({
        id: admissions.id,
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        expectedOpenDate: admissions.expectedOpenDate,
        expectedCloseDate: admissions.expectedCloseDate,
        meritInfo: admissions.meritInfo,
        note: admissions.note,
        officialLink: admissions.officialLink,
        createdAt: admissions.createdAt,
        programId: admissions.programId,
        instituteId: admissions.instituteId,
        programName: programs.name,
        instituteName: institutes.name,
        instituteCity: cities.name,
      })
      .from(admissions)
      .leftJoin(programs, eq(admissions.programId, programs.id))
      .leftJoin(institutes, eq(admissions.instituteId, institutes.id))
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .orderBy(desc(admissions.year), desc(admissions.createdAt));

    // Apply filters in memory with null checks
    let filteredAdmissions = allAdmissions;

    if (year) {
      filteredAdmissions = filteredAdmissions.filter(ad => ad.year === parseInt(year));
    }
    if (status) {
      filteredAdmissions = filteredAdmissions.filter(ad => ad.status === status);
    }
    if (programId) {
      filteredAdmissions = filteredAdmissions.filter(ad => ad.programId === parseInt(programId));
    }
    if (instituteId) {
      filteredAdmissions = filteredAdmissions.filter(ad => ad.instituteId === parseInt(instituteId));
    }

    // Transform data to match the expected format
    const transformedAdmissions = filteredAdmissions.map(ad => ({
      id: ad.id,
      year: ad.year,
      session: ad.session,
      status: ad.status,
      expectedOpenDate: ad.expectedOpenDate,
      expectedCloseDate: ad.expectedCloseDate,
      meritInfo: ad.meritInfo,
      note: ad.note,
      officialLink: ad.officialLink,
      createdAt: ad.createdAt,
      program: {
        id: ad.programId,
        name: ad.programName || "Unknown Program",
      },
      institute: {
        id: ad.instituteId,
        name: ad.instituteName || "Unknown Institute",
        cityName: ad.instituteCity || "Unknown City",
      },
    }));

    return NextResponse.json({
      success: true,
      admissions: transformedAdmissions,
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