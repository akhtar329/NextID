import { NextResponse } from "next/server";
import { db } from "@/db/db";
import {
  admissions,
  admissionOfferings,
  programOfferings,
  programs,
  institutes,
} from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { z } from "zod";

const querySchema = z.object({
  status: z.enum(["open", "closed", "expected"]).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  programId: z.coerce.number().int().positive().optional(),
  instituteId: z.coerce.number().int().positive().optional(),
  slug: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

interface ProgramType {
  offeringId: number;
  programId: number;
  name: string;
  slug: string;
  detailedOverview: string | null;
  commonEligibility: string | null;
  typicalDuration: string | null;
  typicalFeeRange: string | null;
}

interface AdmissionRow {
  id: number;
  name: string;
  slug: string;
  year: number;
  session: string | null;
  status: string;
  expectedOpenDate: Date | null;
  expectedCloseDate: Date | null;
  meritInfo: string | null;
  note: string | null;
  officialLink: string | null;
  instituteId: number;
  instituteName: string;
  instituteSlug: string;
  instituteType: string | null;
  instituteLogo: string | null;
  instituteCityId: number | null;
}

interface AdmissionWithPrograms extends AdmissionRow {
  programs: ProgramType[];
  programCount: number;
}

interface ProgramDataRow {
  admissionId: number;
  offeringId: number;
  programId: number;
  programName: string;
  programSlug: string;
  detailedOverview: string | null;
  commonEligibility: string | null;
  typicalDuration: string | null;
  typicalFeeRange: string | null;
}

async function fetchAdmissionsWithDetails(filters: {
  slug?: string;
  status?: string;
  year?: number;
  instituteId?: number;
  programId?: number;
  limit: number;
}): Promise<AdmissionWithPrograms[]> {
  const { slug, status, year, instituteId, programId, limit } = filters;

  try {
    const conditions = [];
    
    if (slug) conditions.push(eq(admissions.slug, slug));
    if (status) {
      const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
      conditions.push(eq(admissions.status, formattedStatus));
    }
    if (year) conditions.push(eq(admissions.year, year));
    if (instituteId) conditions.push(eq(admissions.instituteId, instituteId));

    let admissionIds: number[] = [];
    
    if (programId) {
      const programAdmissions = await db
        .select({ admissionId: admissionOfferings.admissionId })
        .from(admissionOfferings)
        .innerJoin(programOfferings, eq(admissionOfferings.offeringId, programOfferings.id))
        .where(eq(programOfferings.programId, programId));
      
      admissionIds = programAdmissions.map((p) => p.admissionId);
      
      if (admissionIds.length === 0) return [];
      conditions.push(inArray(admissions.id, admissionIds));
    }

    const query = db
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
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id));

    let results: AdmissionRow[];
    if (conditions.length > 0) {
      const whereQuery = query.where(and(...conditions));
      results = await whereQuery
        .orderBy(desc(admissions.year))
        .limit(slug ? 1 : limit) as unknown as AdmissionRow[];
    } else {
      results = await query
        .orderBy(desc(admissions.year))
        .limit(slug ? 1 : limit) as unknown as AdmissionRow[];
    }

    if (results.length === 0) return [];

    const allAdmissionIds = results.map((r) => r.id);
    
    const programsData = await db
      .select({
        admissionId: admissionOfferings.admissionId,
        offeringId: programOfferings.id,
        programId: programs.id,
        programName: programs.name,
        programSlug: programs.slug,
        detailedOverview: programs.detailedOverview,
        commonEligibility: programs.commonEligibility,
        typicalDuration: programs.typicalDuration,
        typicalFeeRange: programs.typicalFeeRange,
      })
      .from(admissionOfferings)
      .innerJoin(programOfferings, eq(admissionOfferings.offeringId, programOfferings.id))
      .innerJoin(programs, eq(programOfferings.programId, programs.id))
      .where(inArray(admissionOfferings.admissionId, allAdmissionIds)) as unknown as ProgramDataRow[];

    const programsByAdmission = new Map<number, ProgramType[]>();
    
    for (const prog of programsData) {
      if (!programsByAdmission.has(prog.admissionId)) {
        programsByAdmission.set(prog.admissionId, []);
      }
      programsByAdmission.get(prog.admissionId)!.push({
        offeringId: prog.offeringId,
        programId: prog.programId,
        name: prog.programName,
        slug: prog.programSlug,
        detailedOverview: prog.detailedOverview,
        commonEligibility: prog.commonEligibility,
        typicalDuration: prog.typicalDuration,
        typicalFeeRange: prog.typicalFeeRange,
      });
    }

    return results.map((admission) => {
      const programsList = programsByAdmission.get(admission.id) || [];
      return {
        ...admission,
        programs: programsList,
        programCount: programsList.length,
      };
    });
  } catch {
    return [];
  }
}

function determineCacheTTL(status?: string, slug?: string): number {
  if (slug) return 86400;
  
  switch (status?.toLowerCase()) {
    case "open":
      return 300;
    case "closed":
      return 86400;
    case "expected":
      return 604800;
    default:
      return 3600;
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    const validationResult = querySchema.safeParse({
      status: searchParams.get("status"),
      year: searchParams.get("year"),
      programId: searchParams.get("programId"),
      instituteId: searchParams.get("instituteId"),
      slug: searchParams.get("slug"),
      limit: searchParams.get("limit")
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid query parameters", 
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const { status, year, programId, instituteId, slug, limit } = validationResult.data;

    const ttl = determineCacheTTL(status, slug);

    const data = await fetchAdmissionsWithDetails({
      slug,
      status,
      year,
      instituteId,
      programId,
      limit
    });

    if (slug && (!data || data.length === 0)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Admission not found",
          code: "NOT_FOUND"
        },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: slug ? data[0] : data,
      count: data.length,
      timestamp: Date.now(),
    });

    response.headers.set('Cache-Control', `public, s-maxage=${ttl}, stale-while-revalidate=60`);
    
    return response;

  } catch {
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch admissions data",
        code: "UNKNOWN_ERROR"
      },
      { status: 500 }
    );
  }
}
