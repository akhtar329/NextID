import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import {
  admissions,
  admissionOfferings,
  programOfferings,
  programs,
  institutes
} from "@/app/lib/schema";
import { eq, desc, inArray, and } from "drizzle-orm";

import { getCachedRedirect, setCachedRedirect } from "@/app/lib/cache";

// ================== CACHE KEY ==================
const buildCacheKey = (searchParams: URLSearchParams) => {
  return `admissions:${searchParams.toString()}`;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const year = searchParams.get("year");
    const programId = searchParams.get("programId");
    const instituteId = searchParams.get("instituteId");
    const slug = searchParams.get("slug");

    const limit = searchParams.get("limit")
      ? Math.min(parseInt(searchParams.get("limit")!), 20)
      : 20;

    // ================== CACHE CHECK ==================
    const cacheKey = buildCacheKey(searchParams);
    const cached = getCachedRedirect(cacheKey);

    if (cached) {
      return NextResponse.json(cached);
    }

    // ================== CONDITIONS ==================
    const conditions = [];

    if (slug) conditions.push(eq(admissions.slug, slug));

    if (status) {
      const statusValue =
        status.toLowerCase() === "open"
          ? "Open"
          : status.toLowerCase() === "closed"
          ? "Closed"
          : status.toLowerCase() === "expected"
          ? "Expected"
          : status;

      conditions.push(eq(admissions.status, statusValue));
    }

    if (year) conditions.push(eq(admissions.year, parseInt(year)));

    if (instituteId)
      conditions.push(eq(admissions.instituteId, parseInt(instituteId)));

    // ================== MAIN QUERY ==================
    const admissionsList = await db
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
        instituteCityId: institutes.cityId
      })
      .from(admissions)
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(admissions.year))
      .limit(slug ? 1 : limit);

    if (slug && admissionsList.length === 0) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }

    const admissionIds = admissionsList.map((a) => a.id);

    // ================== OFFERINGS BATCH ==================
    const offerings = admissionIds.length
      ? await db
          .select({
            admissionId: admissionOfferings.admissionId,
            offeringId: admissionOfferings.offeringId
          })
          .from(admissionOfferings)
          .where(inArray(admissionOfferings.admissionId, admissionIds))
      : [];

    const admissionMap = new Map<number, number[]>();

    for (const o of offerings) {
      if (!admissionMap.has(o.admissionId)) {
        admissionMap.set(o.admissionId, []);
      }
      admissionMap.get(o.admissionId)!.push(o.offeringId);
    }

    const allOfferingIds = offerings.map((o) => o.offeringId);

    // ================== PROGRAMS BATCH ==================
    const programMap = new Map<number, any>();

    if (allOfferingIds.length) {
      const programRows = await db
        .select({
          offeringId: programOfferings.id,
          programId: programs.id,
          name: programs.name,
          slug: programs.slug,
          detailedOverview: programs.detailedOverview,
          commonEligibility: programs.commonEligibility,
          typicalDuration: programs.typicalDuration,
          typicalFeeRange: programs.typicalFeeRange
        })
        .from(programOfferings)
        .innerJoin(programs, eq(programOfferings.programId, programs.id))
        .where(inArray(programOfferings.id, allOfferingIds));

      for (const row of programRows) {
        programMap.set(row.offeringId, row);
      }
    }

    // ================== RESPONSE BUILD ==================
    const result = admissionsList.map((ad) => {
      const offeringIds = admissionMap.get(ad.id) || [];

      const programsList = offeringIds
        .map((id) => programMap.get(id))
        .filter(Boolean);

      return {
        ...ad,
        programs: programsList,
        programCount: programsList.length
      };
    });

    const response = {
      success: true,
      data: slug ? result[0] : result,
      count: result.length
    };

    // ================== CACHE SET ==================
    setCachedRedirect(cacheKey, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching admissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admissions" },
      { status: 500 }
    );
  }
}