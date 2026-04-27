// app/api/public/programs/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { 
  programs, 
  programOfferings, 
  institutes,
} from "@/app/lib/schema";
import { eq, asc, sql } from "drizzle-orm";

interface ProgramWithInstitutes {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  detailedOverview: string | null;
  typicalDuration: string | null;
  commonEligibility: string | null;
  careerOutlook: string | null;
  typicalFeeRange: string | null;
  isFeatured: boolean | null;
  instituteNames: string[];
}

export async function GET() {
  try {
    const result = await db
      .select({
        id: programs.id,
        name: programs.name,
        slug: programs.slug,
        shortDescription: programs.shortDescription,
        detailedOverview: programs.detailedOverview,
        typicalDuration: programs.typicalDuration,
        commonEligibility: programs.commonEligibility,
        careerOutlook: programs.careerOutlook,
        typicalFeeRange: programs.typicalFeeRange,
        isFeatured: programs.isFeatured,
        instituteNames: sql<Array<{ name: string }>>`COALESCE(
          json_agg(
            json_build_object('name', ${institutes.name})
          ) FILTER (WHERE ${institutes.id} IS NOT NULL),
          '[]'::json
        )`
      })
      .from(programs)
      .leftJoin(programOfferings, eq(programs.id, programOfferings.programId))
      .leftJoin(institutes, eq(programOfferings.instituteId, institutes.id))
      .where(eq(programs.status, true))
      .groupBy(programs.id)
      .orderBy(asc(programs.id));

    const transformed: ProgramWithInstitutes[] = result.map((program) => ({
      id: program.id,
      name: program.name,
      slug: program.slug,
      shortDescription: program.shortDescription,
      detailedOverview: program.detailedOverview,
      typicalDuration: program.typicalDuration,
      commonEligibility: program.commonEligibility,
      careerOutlook: program.careerOutlook,
      typicalFeeRange: program.typicalFeeRange,
      isFeatured: program.isFeatured,
      instituteNames: (program.instituteNames || []).map((i: { name: string }) => i.name)
    }));

    const response = NextResponse.json({
      success: true,
      programs: transformed,
      count: transformed.length
    });

    response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');

    return response;

  } catch {
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch programs"
      }, 
      { status: 500 }
    );
  }
}
