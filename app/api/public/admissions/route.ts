// app/api/public/admissions/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { admissions, admissionOfferings, programOfferings, programs, institutes } from "@/app/lib/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const year = searchParams.get('year');
    const programId = searchParams.get('programId');
    const instituteId = searchParams.get('instituteId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const slug = searchParams.get('slug');

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
      // First get offeringIds for the program
      const offeringIds = await db
        .select({ id: programOfferings.id })
        .from(programOfferings)
        .where(eq(programOfferings.programId, parseInt(programId)));

      const offeringIdList = offeringIds.map(o => o.id);
      
      if (offeringIdList.length > 0) {
        const admissionIdsWithOffering = await db
          .select({ admissionId: admissionOfferings.admissionId })
          .from(admissionOfferings)
          .where(inArray(admissionOfferings.offeringId, offeringIdList));  // ✅ Fixed: use inArray

        const validAdmissionIds = new Set(admissionIdsWithOffering.map(item => item.admissionId));
        
        filteredAdmissions = admissionsList.filter(ad => 
          validAdmissionIds.has(ad.id)
        );
      } else {
        filteredAdmissions = [];
      }
    }

    // Fetch programs for each admission
    const admissionsWithPrograms = await Promise.all(
      filteredAdmissions.slice(0, slug ? 1 : limit).map(async (ad) => {
        // Get offerings for this admission
        const offerings = await db
          .select({ offeringId: admissionOfferings.offeringId })
          .from(admissionOfferings)
          .where(eq(admissionOfferings.admissionId, ad.id));

        const offeringIds = offerings.map(o => o.offeringId);
        
        let programList: any[] = [];
        
        if (offeringIds.length > 0) {
          programList = await db
            .select({
              id: programs.id,
              name: programs.name,
              slug: programs.slug,
              detailedOverview: programs.detailedOverview,
              commonEligibility: programs.commonEligibility,
              typicalDuration: programs.typicalDuration,
              typicalFeeRange: programs.typicalFeeRange,
            })
            .from(programOfferings)
            .innerJoin(programs, eq(programOfferings.programId, programs.id))
            .where(inArray(programOfferings.id, offeringIds));  // ✅ Fixed: use inArray
        }

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