// app/api/public/admissions/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { admissions, admissionPrograms, programs, institutes } from "@/app/lib/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const year = searchParams.get('year');
    const programId = searchParams.get('programId');
    const instituteId = searchParams.get('instituteId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const slug = searchParams.get('slug'); // Add slug filter for single admission

    // Build conditions array
    const conditions = [];

    if (slug) {
      conditions.push(eq(admissions.slug, slug));
    }

    if (status) {
      const statusValue = status.toLowerCase() === 'open' ? 'Open' : 
                          status.toLowerCase() === 'closed' ? 'Closed' : 
                          status.toLowerCase() === 'expected' ? 'Expected' : status;
      conditions.push(eq(admissions.status, statusValue));
    }

    if (year) {
      conditions.push(eq(admissions.year, parseInt(year)));
    }

    if (instituteId) {
      conditions.push(eq(admissions.instituteId, parseInt(instituteId)));
    }

    // Base query
    let baseQuery = db
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
        instituteId: admissions.instituteId,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        instituteType: institutes.type,
        instituteLogo: institutes.logo,
        instituteCityId: institutes.cityId,
      })
      .from(admissions)
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(admissions.year))
      .limit(slug ? 1 : limit * 2);

    const admissionsList = await baseQuery;

    // If slug is provided, return single admission
    if (slug && admissionsList.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Admission not found",
      }, { status: 404 });
    }

    // Filter by programId if provided
    let filteredAdmissions = admissionsList;
    if (programId && !slug) {
      const admissionIdsWithProgram = await db
        .select({ admissionId: admissionPrograms.admissionId })
        .from(admissionPrograms)
        .where(eq(admissionPrograms.programId, parseInt(programId)));

      const validAdmissionIds = new Set(admissionIdsWithProgram.map(item => item.admissionId));
      
      filteredAdmissions = admissionsList.filter(ad => 
        validAdmissionIds.has(ad.id)
      );
    }

    // Fetch programs for each admission
    const admissionsWithPrograms = await Promise.all(
      filteredAdmissions.slice(0, slug ? 1 : limit).map(async (ad) => {
        const programList = await db
          .select({
            id: programs.id,
            name: programs.name,
            slug: programs.slug,
            overview: programs.overview,
            eligibility: programs.eligibility,
            duration: programs.duration,
            feeRange: programs.feeRange,
          })
          .from(admissionPrograms)
          .innerJoin(programs, eq(admissionPrograms.programId, programs.id))
          .where(eq(admissionPrograms.admissionId, ad.id));

        return {
          ...ad,
          programs: programList,
          programCount: programList.length,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: slug ? admissionsWithPrograms[0] : admissionsWithPrograms,
      count: admissionsWithPrograms.length,
    });
  } catch (error) {
    console.error("Error fetching admissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admissions" },
      { status: 500 }
    );
  }
}