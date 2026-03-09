
// app/api/public/programs/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programs, degrees, programInstitutes, institutes } from "@/app/lib/schema";
import { eq, asc, sql } from "drizzle-orm";

// Define type for the result
type ProgramWithInstitutes = {
  id: number;
  name: string;
  slug: string;
  overview: string | null;
  eligibility: string | null;
  duration: string | null;
  careerScope: string | null;
  feeRange: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isFeatured: boolean | null;
  degreeName: string | null;
  instituteNames: Array<{ name: string }>;
}

export async function GET() {
  try {
    const result = await db
      .select({
        id: programs.id,
        name: programs.name,
        slug: programs.slug,
        overview: programs.overview,
        eligibility: programs.eligibility,
        duration: programs.duration,
        careerScope: programs.careerScope,
        feeRange: programs.feeRange,
        seoTitle: programs.seoTitle,
        seoDescription: programs.seoDescription,
        isFeatured: programs.isFeatured,
        degreeName: degrees.name,
        instituteNames: sql<Array<{ name: string }>>`COALESCE(
          json_agg(
            json_build_object('name', ${institutes.name})
          ) FILTER (WHERE ${institutes.id} IS NOT NULL),
          '[]'::json
        )`
      })
      .from(programs)
      .leftJoin(degrees, eq(programs.degreeId, degrees.id))
      .leftJoin(programInstitutes, eq(programs.id, programInstitutes.programId))
      .leftJoin(institutes, eq(programInstitutes.instituteId, institutes.id))
      .where(eq(programs.status, true))
      .groupBy(programs.id, degrees.name)
      .orderBy(asc(programs.id));

    // Transform if you want simple string array
    const transformed = result.map((program) => ({
      ...program,
      instituteNames: (program.instituteNames || []).map((i: { name: string }) => i.name)
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
  }
}