// repositories/admissions/admissions-detail.repo.ts
import { db } from "@/db/db";
import { 
  admissions, 
  institutes, 
  cities, 
  admissionOfferings, 
  programOfferings, 
  programs,
  seoMetadata
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { AdmissionDetail, RelatedAdmission, ProgramDetail, InstituteDetail, InstituteCity } from "@/types/admissions-detail.types";

export async function getAdmissionBySlug(slug: string): Promise<AdmissionDetail | null> {
  // Fetch admission with institute and city
  const admissionRows = await db
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
      // Institute
      instituteId: institutes.id,
      instituteName: institutes.name,
      instituteSlug: institutes.slug,
      instituteLogo: institutes.logo,
      instituteDescription: institutes.description,
      instituteWebsite: institutes.website,
      instituteEmail: institutes.email,
      institutePhone: institutes.phone,
      // City
      cityId: cities.id,
      cityName: cities.name,
      citySlug: cities.slug,
      cityProvince: cities.province,
    })
    .from(admissions)
    .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
    .leftJoin(cities, eq(institutes.cityId, cities.id))
    .where(eq(admissions.slug, slug))
    .limit(1);

  if (admissionRows.length === 0) {
    return null;
  }

  const row = admissionRows[0];

  // Fetch programs for this admission
  const programsRows = await db
    .select({
      id: programs.id,
      name: programs.name,
      slug: programs.slug,
      duration: programs.typicalDuration,
      feeRange: programs.typicalFeeRange,
      specificEligibility: programOfferings.specificEligibility,
    })
    .from(admissionOfferings)
    .innerJoin(programOfferings, eq(admissionOfferings.offeringId, programOfferings.id))
    .innerJoin(programs, eq(programOfferings.programId, programs.id))
    .where(eq(admissionOfferings.admissionId, row.id));

  // Fetch SEO metadata
  const seoRows = await db
    .select()
    .from(seoMetadata)
    .where(
      and(
        eq(seoMetadata.entityType, 'admission'),
        eq(seoMetadata.entityId, row.id)
      )
    )
    .limit(1);

  const seo = seoRows[0];

  const city: InstituteCity | null = row.cityId ? {
    id: row.cityId,
    name: row.cityName || '',
    slug: row.citySlug || '',
    province: row.cityProvince,
  } : null;

  const institute: InstituteDetail = {
    id: row.instituteId,
    name: row.instituteName,
    slug: row.instituteSlug,
    logo: row.instituteLogo,
    description: row.instituteDescription,
    website: row.instituteWebsite,
    email: row.instituteEmail,
    phone: row.institutePhone,
    city: city,
  };

  const programsList: ProgramDetail[] = programsRows.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    duration: p.duration,
    feeRange: p.feeRange,
    specificEligibility: p.specificEligibility,
  }));

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    year: row.year,
    session: row.session,
    status: row.status as 'Expected' | 'Open' | 'Closed',
    expectedOpenDate: row.expectedOpenDate,
    expectedCloseDate: row.expectedCloseDate,
    openDate: row.expectedOpenDate,
    closeDate: row.expectedCloseDate,
    meritInfo: row.meritInfo,
    note: row.note,
    applicationLink: seo?.canonicalUrl || null,
    officialLink: row.officialLink,
    eligibility: seo?.metaDescription || null,
    howToApply: null,
    requiredDocuments: null,
    feeStructure: null,
    programCount: programsList.length,
    programs: programsList,
    institute: institute,
  };
}

export async function getRelatedAdmissions(admissionId: number, instituteId: number, limit: number = 5): Promise<RelatedAdmission[]> {
  const related = await db
    .select({
      id: admissions.id,
      name: admissions.name,
      slug: admissions.slug,
      year: admissions.year,
      session: admissions.session,
      instituteName: institutes.name,
    })
    .from(admissions)
    .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
    .where(
      and(
        eq(admissions.instituteId, instituteId),
        eq(admissions.status, 'Open'),
        eq(admissions.id, admissionId) ? undefined : eq(admissions.id, admissionId)
      )
    )
    .limit(limit);

  // Filter out current admission
  const filtered = related.filter(r => r.id !== admissionId);
  
  return filtered.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    year: r.year,
    session: r.session,
    instituteName: r.instituteName,
  }));
}