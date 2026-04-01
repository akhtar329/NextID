// app/api/public/programs/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { 
  programs, 
  degrees, 
  programInstitutes, 
  institutes,
  seoMetadata 
} from "@/app/lib/schema";
import { eq, asc, sql, and } from "drizzle-orm";

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
  isFeatured: boolean | null;
  degreeName: string | null;
  instituteNames: string[];
  seoTitle: string | null;
  seoDescription: string | null;
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
        isFeatured: programs.isFeatured,
        degreeName: degrees.name,
        // ✅ Get SEO from centralized seo_metadata table
        seoTitle: seoMetadata.metaTitle,
        seoDescription: seoMetadata.metaDescription,
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
      .leftJoin(seoMetadata, 
        and(
          eq(seoMetadata.entityType, 'program'),
          eq(seoMetadata.entityId, programs.id)
        )
      )
      .where(eq(programs.status, true))
      .groupBy(programs.id, degrees.name, seoMetadata.metaTitle, seoMetadata.metaDescription)
      .orderBy(asc(programs.id));

    // Transform to simple string array
    const transformed = result.map((program) => ({
      id: program.id,
      name: program.name,
      slug: program.slug,
      overview: program.overview,
      eligibility: program.eligibility,
      duration: program.duration,
      careerScope: program.careerScope,
      feeRange: program.feeRange,
      isFeatured: program.isFeatured,
      degreeName: program.degreeName,
      seoTitle: program.seoTitle,
      seoDescription: program.seoDescription,
      instituteNames: (program.instituteNames || []).map((i: { name: string }) => i.name)
    }));

    return NextResponse.json({
      success: true,
      programs: transformed,
      count: transformed.length
    });

  } catch (error) {
    console.error("Error fetching programs:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch programs",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }, 
      { status: 500 }
    );
  }
}