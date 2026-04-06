// app/api/public/programs/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { 
  programs, 
  programOfferings, 
  institutes,
  seoMetadata 
} from "@/app/lib/schema";
import { eq, asc, sql, and } from "drizzle-orm";

// Define type for the result
type ProgramWithInstitutes = {
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
        shortDescription: programs.shortDescription,
        detailedOverview: programs.detailedOverview,
        typicalDuration: programs.typicalDuration,
        commonEligibility: programs.commonEligibility,
        careerOutlook: programs.careerOutlook,
        typicalFeeRange: programs.typicalFeeRange,
        isFeatured: programs.isFeatured,
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
      .leftJoin(programOfferings, eq(programs.id, programOfferings.programId))
      .leftJoin(institutes, eq(programOfferings.instituteId, institutes.id))
      .leftJoin(seoMetadata, 
        and(
          eq(seoMetadata.entityType, 'program'),
          eq(seoMetadata.entityId, programs.id)
        )
      )
      .where(eq(programs.status, true))
      .groupBy(programs.id, seoMetadata.metaTitle, seoMetadata.metaDescription)
      .orderBy(asc(programs.id));

    // Transform to simple string array
    const transformed = result.map((program) => ({
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