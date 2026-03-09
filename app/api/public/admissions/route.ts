// app/api/public/admissions/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { admissions, programs, institutes } from "@/app/lib/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'open', 'closed', 'expected'
    const year = searchParams.get('year');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

    // Base query
    let baseQuery = db
      .select({
        id: admissions.id,
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        expectedOpenDate: admissions.expectedOpenDate,
        expectedCloseDate: admissions.expectedCloseDate,
        meritInfo: admissions.meritInfo,
        officialLink: admissions.officialLink,
        programName: programs.name,
        programSlug: programs.slug,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
      })
      .from(admissions)
      .leftJoin(programs, eq(admissions.programId, programs.id))
      .leftJoin(institutes, eq(admissions.instituteId, institutes.id));

    // Conditions
    let conditions = [];

    if (status) {
      conditions.push(eq(admissions.status, status));
    }

    if (year) {
      conditions.push(eq(admissions.year, parseInt(year)));
    }

    // Final query
    const allAdmissions = conditions.length > 0
      ? await baseQuery.where(and(...conditions)).orderBy(desc(admissions.year)).limit(limit)
      : await baseQuery.orderBy(desc(admissions.year)).limit(limit);

    return NextResponse.json({
      success: true,
      data: allAdmissions
    });
  } catch (error) {
    console.error("Error fetching admissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admissions" },
      { status: 500 }
    );
  }
}