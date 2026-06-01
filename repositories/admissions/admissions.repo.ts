// repositories/admissions/admissions.repo.ts
import { db } from "@/db/db";
import { and, eq, sql, desc } from "drizzle-orm";
import { AdmissionFilters, AdmissionsResponse, AdmissionStats, AdmissionItem } from "@/types/admissions.types";
import { 
  admissions, 
  institutes, 
  cities, 
  programOfferings, 
  programs, 
  degrees, 
  levels,
  admissionOfferings 
} from "@/db/schema";

// Define proper type for program in admission
type AdmissionProgram = {
  id: number;
  name: string;
  level: string;
};

// Define type for raw database result
type RawAdmissionWithPrograms = {
  id: number;
  name: string;
  slug: string;
  status: string;
  openDate: Date | null;
  closeDate: Date | null;
  instituteId: number;
  instituteName: string | null;
  instituteLogo: string | null;
  cityName: string | null;
  programs: AdmissionProgram[];
};

export async function getAdmissionsFiltered(filters: AdmissionFilters): Promise<AdmissionsResponse> {
  const { city, level, q, page = 1, showClosed = false } = filters;
  const limit = 10;
  const offset = (page - 1) * limit;
  
  // Build conditions
  const conditions = [];
  
  // Filter by city name
  if (city) {
    conditions.push(eq(cities.name, city));
  }
  
  // Filter by level (through programs -> degrees -> levels)
  if (level) {
    conditions.push(eq(levels.slug, level));
  }
  
  // Search query
  if (q) {
    conditions.push(
      sql`(${admissions.name} ILIKE ${`%${q}%`} OR ${institutes.name} ILIKE ${`%${q}%`})`
    );
  }
  
  // Show closed admissions or not
  if (!showClosed) {
    conditions.push(sql`${admissions.status} != 'Closed'`);
  }
  
  // Get total count
  const totalCountResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${admissions.id})` })
    .from(admissions)
    .leftJoin(institutes, eq(admissions.instituteId, institutes.id))
    .leftJoin(cities, eq(institutes.cityId, cities.id))
    .leftJoin(admissionOfferings, eq(admissions.id, admissionOfferings.admissionId))
    .leftJoin(programOfferings, eq(admissionOfferings.offeringId, programOfferings.id))
    .leftJoin(degrees, eq(programOfferings.degreeId, degrees.id))
    .leftJoin(levels, eq(degrees.levelId, levels.id))
    .where(and(...conditions));
  
  const totalCount = Number(totalCountResult[0]?.count) || 0;
  const totalPages = Math.ceil(totalCount / limit);
  
  // Get paginated admissions
  const rawAdmissionsData = await db
    .select({
      id: admissions.id,
      name: admissions.name,
      slug: admissions.slug,
      status: admissions.status,
      openDate: admissions.openDate,
      closeDate: admissions.closeDate,
      instituteId: admissions.instituteId,
      instituteName: institutes.name,
      instituteLogo: institutes.logo,
      cityName: cities.name,
      programs: sql<AdmissionProgram[]>`
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', ${programs.id},
              'name', ${programs.name},
              'level', ${levels.slug}
            )
          ) FILTER (WHERE ${programs.id} IS NOT NULL),
          '[]'::json
        )
      `,
    })
    .from(admissions)
    .leftJoin(institutes, eq(admissions.instituteId, institutes.id))
    .leftJoin(cities, eq(institutes.cityId, cities.id))
    .leftJoin(admissionOfferings, eq(admissions.id, admissionOfferings.admissionId))
    .leftJoin(programOfferings, eq(admissionOfferings.offeringId, programOfferings.id))
    .leftJoin(programs, eq(programOfferings.programId, programs.id))
    .leftJoin(degrees, eq(programOfferings.degreeId, degrees.id))
    .leftJoin(levels, eq(degrees.levelId, levels.id))
    .where(and(...conditions))
    .groupBy(
      admissions.id,
      institutes.name,
      institutes.logo,
      cities.name
    )
    .orderBy(desc(admissions.createdAt))
    .limit(limit)
    .offset(offset);
  
  // Convert raw data to AdmissionItem type with proper date handling
  const formattedAdmissions: AdmissionItem[] = (rawAdmissionsData as unknown as RawAdmissionWithPrograms[]).map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    status: item.status,
    openDate: item.openDate ? item.openDate.toISOString() : null,
    closeDate: item.closeDate ? item.closeDate.toISOString() : null,
    instituteId: item.instituteId,
    instituteName: item.instituteName || '',
    instituteLogo: item.instituteLogo,
    cityName: item.cityName || '',
    programs: item.programs,
  }));
  
  return {
    admissions: formattedAdmissions,
    totalCount,
    currentPage: page,
    totalPages,
  };
}

export async function getAdmissionsStatsRaw(): Promise<AdmissionStats> {
  // Get main stats
  const statsResult = await db
    .select({
      total: sql<number>`COUNT(DISTINCT ${admissions.id})`,
      closingSoon: sql<number>`
        COUNT(DISTINCT CASE 
          WHEN ${admissions.closeDate} > NOW() 
          AND ${admissions.closeDate} <= NOW() + INTERVAL '7 days' 
          THEN ${admissions.id} 
        END)
      `,
      universities: sql<number>`COUNT(DISTINCT ${admissions.instituteId})`,
      cities: sql<number>`COUNT(DISTINCT ${institutes.cityId})`,
    })
    .from(admissions)
    .leftJoin(institutes, eq(admissions.instituteId, institutes.id))
    .where(sql`${admissions.status} != 'Closed'`);
  
  // Get programs by level from your levels table
  const programsByLevelResult = await db
    .select({
      level: levels.slug,
      count: sql<number>`COUNT(DISTINCT ${programs.id})`,
    })
    .from(programs)
    .leftJoin(programOfferings, eq(programs.id, programOfferings.programId))
    .leftJoin(degrees, eq(programOfferings.degreeId, degrees.id))
    .leftJoin(levels, eq(degrees.levelId, levels.id))
    .groupBy(levels.slug);
  
  // Initialize programsByLevel object
  const programsByLevel: AdmissionStats['programsByLevel'] = {
    total: 0,
    matric: 0,
    inter: 0,
    bs: 0,
    mba: 0,
    ms: 0,
    medical: 0,
    engineering: 0,
    law: 0,
  };
  
  // Populate programsByLevel
  let totalPrograms = 0;
  for (const item of programsByLevelResult) {
    const levelSlug = item.level as string;
    const count = Number(item.count);
    
    if (levelSlug === 'matric') programsByLevel.matric = count;
    else if (levelSlug === 'inter') programsByLevel.inter = count;
    else if (levelSlug === 'bs') programsByLevel.bs = count;
    else if (levelSlug === 'mba') programsByLevel.mba = count;
    else if (levelSlug === 'ms') programsByLevel.ms = count;
    else if (levelSlug === 'medical') programsByLevel.medical = count;
    else if (levelSlug === 'engineering') programsByLevel.engineering = count;
    else if (levelSlug === 'law') programsByLevel.law = count;
    
    totalPrograms += count;
  }
  programsByLevel.total = totalPrograms;
  
  return {
    total: Number(statsResult[0]?.total) || 0,
    closingSoon: Number(statsResult[0]?.closingSoon) || 0,
    universities: Number(statsResult[0]?.universities) || 0,
    cities: Number(statsResult[0]?.cities) || 0,
    programsByLevel,
  };
}