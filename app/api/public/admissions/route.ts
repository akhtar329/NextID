// app/api/public/admissions/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { admissions, admissionPrograms, programs, institutes } from "@/app/lib/schema";
import { eq, desc, and, inArray, isNotNull } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'open', 'closed', 'expected'
    const year = searchParams.get('year');
    const programId = searchParams.get('programId');
    const instituteId = searchParams.get('instituteId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

    // Build conditions array
    const conditions = [];

    if (status) {
      // Ensure status is properly capitalized if needed
      const statusValue = status.toLowerCase() === 'open' ? 'Open' : 
                          status.toLowerCase() === 'closed' ? 'Closed' : 
                          status.toLowerCase() === 'expected' ? 'Expected' : status;
      conditions.push(eq(admissions.status, statusValue));
    }

    if (year) {
      conditions.push(eq(admissions.year, parseInt(year)));
    }

    // ✅ FIXED: Don't filter by programId directly - need to use junction table
    // We'll handle program filtering after fetching

    if (instituteId) {
      conditions.push(eq(admissions.instituteId, parseInt(instituteId)));
    }

    // Base query without program filter
    let baseQuery = db
      .select({
        id: admissions.id,
        name: admissions.name,  // ✅ Include name
        slug: admissions.slug,  // ✅ Include slug
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        expectedOpenDate: admissions.expectedOpenDate,
        expectedCloseDate: admissions.expectedCloseDate,
        meritInfo: admissions.meritInfo,
        officialLink: admissions.officialLink,
        instituteId: admissions.instituteId,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
      })
      .from(admissions)
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(admissions.year))
      .limit(limit * 2); // Get more to account for filtering

    // Execute query
    const admissionsList = await baseQuery;

    // If programId is provided, we need to filter admissions that have this program
    let filteredAdmissions = admissionsList;
    if (programId) {
      // Get all admission IDs that have this program
      const admissionIdsWithProgram = await db
        .select({ admissionId: admissionPrograms.admissionId })
        .from(admissionPrograms)
        .where(eq(admissionPrograms.programId, parseInt(programId)));

      const validAdmissionIds = admissionIdsWithProgram.map(item => item.admissionId);
      
      // Filter admissions
      filteredAdmissions = admissionsList.filter(ad => 
        validAdmissionIds.includes(ad.id)
      );
    }

    // For each admission, fetch its programs
    const admissionsWithPrograms = await Promise.all(
      filteredAdmissions.slice(0, limit).map(async (ad) => {
        const programList = await db
          .select({
            id: programs.id,
            name: programs.name,
            slug: programs.slug,
          })
          .from(admissionPrograms)
          .innerJoin(programs, eq(admissionPrograms.programId, programs.id))
          .where(eq(admissionPrograms.admissionId, ad.id));

        return {
          ...ad,
          programs: programList,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: admissionsWithPrograms,
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