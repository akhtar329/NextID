// app/(public)/admissions/page.tsx
// ✅ Complete working version - No 'any' types

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/app/lib/db";
import {
  admissions,
  admissionOfferings,
  programOfferings,
  programs,
  institutes,
  cities,
} from "@/app/lib/schema";
import { eq, desc, like, and, or, sql, SQL } from "drizzle-orm";
import { generateSEO } from "@/app/lib/seo";

// ==================== TYPES ====================
type DrizzleCondition = SQL<unknown>;

// ✅ Define proper types for admission data
type Program = {
  id: number;
  name: string;
  slug: string;
  degreeName: string | null;
};

type Admission = {
  id: number;
  name: string;
  slug: string;
  year: number;
  session: string | null;
  status: string;
  expectedCloseDate: Date | null;
  instituteId: number;
  instituteName: string;
  instituteSlug: string;
  instituteType: string | null;
  instituteLogo: string | null;
  cityId: number;
  cityName: string;
  citySlug: string;
  programs: Program[];
};

// ==================== CONSTANTS ====================
const ITEMS_PER_PAGE = 10;

// ==================== HELPER FUNCTIONS ====================
function getTimeLeftInfo(closeDate: Date | null, showClosed: boolean): {
  label: string | null;
  color: string | null;
  icon: string;
  hide?: boolean;
  urgent?: boolean;
} {
  if (!closeDate) {
    if (showClosed) return { label: "Closed", color: "gray", icon: "📅" };
    return { label: null, color: null, hide: true, icon: "📅" };
  }

  const now = new Date();
  const close = new Date(closeDate);
  const diffMs = close.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const daysPassed = Math.abs(diffDays);
    if (daysPassed === 0) {
      return {
        label: `Closed ${diffHours} hours ago`,
        color: "gray",
        icon: "📅",
      };
    }
    if (daysPassed === 1) return { label: "Closed yesterday", color: "gray", icon: "📅" };
    if (daysPassed <= 7) return { label: `Closed ${daysPassed} days ago`, color: "gray", icon: "📅" };
    return { label: `Closed on ${close.toLocaleDateString("en-PK")}`, color: "gray", icon: "📅" };
  }

  if (diffHours <= 24) {
    return {
      label: `${diffHours} hour${diffHours !== 1 ? "s" : ""} left`,
      color: "red",
      icon: "⏰",
      urgent: true,
    };
  }
  if (diffDays <= 7) {
    return {
      label: `${diffDays} day${diffDays !== 1 ? "s" : ""} left`,
      color: "red",
      icon: "⚠️",
      urgent: true,
    };
  }
  if (diffDays <= 15) {
    return { label: `${diffDays} days left`, color: "yellow", icon: "📅" };
  }
  if (diffDays <= 30) {
    return { label: `${diffDays} days left`, color: "green", icon: "📅" };
  }
  return { label: null, color: null, hide: true, icon: "📅" };
}

function getBadgeStyles(color: string): string {
  const styles: Record<string, string> = {
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    green: "bg-green-100 text-green-600",
    gray: "bg-gray-100 text-gray-500",
  };
  return styles[color] || styles.gray;
}

// ==================== METADATA ====================
export async function generateMetadata(): Promise<Metadata> {
  return generateSEO({
    entityType: "page",
    entityId: 1,
    path: "/admissions",
    title: "Admissions 2026 in Pakistan | Last Date & Apply Online | NextID.pk",
    description: "Explore latest admissions 2026 in Pakistan for Matric, Inter, BS, MBA, Medical and Engineering programs.",
    image: "/images/og-admissions.jpg",
    alternates: { canonical: "https://www.nextid.pk/admissions" },
    openGraph: {
      title: "All Admissions 2026 in Pakistan – Apply Online",
      description: "Explore all 2026 admissions in Pakistan with last dates, fees, and entry test details.",
      url: "https://www.nextid.pk/admissions",
      siteName: "NextID.pk",
      images: [{ url: "https://www.nextid.pk/images/og-admissions.jpg", width: 1200, height: 630, alt: "Admissions 2026 in Pakistan" }],
      locale: "en_PK",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "All Admissions 2026 in Pakistan – Apply Online",
      description: "Check latest admissions in Pakistan for Matric, Inter, BS & MS programs.",
      images: ["https://www.nextid.pk/images/og-admissions.jpg"],
    },
  });
}

// ==================== DATA FETCHING ====================
async function getAdmissions(filters: {
  city?: string;
  q?: string;
  page?: number;
  showClosed?: boolean;
}) {
  try {
    const currentPage = filters.page || 1;
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    const conditions: DrizzleCondition[] = [];

    if (!filters.showClosed) {
      conditions.push(eq(admissions.status, "Open"));
      conditions.push(
        or(
          sql`${admissions.expectedCloseDate} IS NULL`,
          sql`${admissions.expectedCloseDate} >= CURRENT_DATE`
        ) as DrizzleCondition
      );
    } else {
      conditions.push(eq(admissions.status, "Closed"));
    }

    if (filters.city) {
      conditions.push(eq(cities.slug, filters.city));
    }

    if (filters.q) {
      const words = filters.q.trim().split(/\s+/);
      const searchConditions = words.flatMap((word) => {
        const term = `%${word}%`;
        return [like(institutes.name, term), like(admissions.name, term)];
      });
      conditions.push(or(...searchConditions) as DrizzleCondition);
    }

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    const countResult = await db
      .select({ count: sql<number>`count(distinct ${admissions.id})` })
      .from(admissions)
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .innerJoin(cities, eq(institutes.cityId, cities.id))
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count) || 0;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const admissionsList = await db
      .select({
        id: admissions.id,
        name: admissions.name,
        slug: admissions.slug,
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        expectedCloseDate: admissions.expectedCloseDate,
        instituteId: admissions.instituteId,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        instituteType: institutes.type,
        instituteLogo: institutes.logo,
        cityId: cities.id,
        cityName: cities.name,
        citySlug: cities.slug,
      })
      .from(admissions)
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .innerJoin(cities, eq(institutes.cityId, cities.id))
      .where(whereClause)
      .orderBy(
        filters.showClosed
          ? desc(admissions.expectedCloseDate)
          : sql`CASE WHEN ${admissions.expectedCloseDate} IS NULL THEN 1 ELSE 0 END, ${admissions.expectedCloseDate} ASC`
      )
      .limit(ITEMS_PER_PAGE)
      .offset(offset);

    if (admissionsList.length === 0) return { admissions: [], totalCount, totalPages, currentPage };

    const admissionsWithPrograms = await Promise.all(
      admissionsList.map(async (ad) => {
        const admissionProgramsList = await db
          .select({
            id: programs.id,
            name: programs.name,
            slug: programs.slug,
            degreeName: sql<string>`NULL`,
          })
          .from(admissionOfferings)
          .innerJoin(programOfferings, eq(admissionOfferings.offeringId, programOfferings.id))
          .innerJoin(programs, eq(programOfferings.programId, programs.id))
          .where(eq(admissionOfferings.admissionId, ad.id));

        return { ...ad, programs: admissionProgramsList };
      })
    );

    return {
      admissions: admissionsWithPrograms,
      totalCount,
      totalPages,
      currentPage,
    };
  } catch (error) {
    console.error("Database error:", error);
    return { admissions: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
}

async function getStats() {
  try {
    const totalAdmissions = await db
      .select({ count: sql<number>`count(*)` })
      .from(admissions)
      .where(eq(admissions.status, "Open"));

    const closedAdmissions = await db
      .select({ count: sql<number>`count(*)` })
      .from(admissions)
      .where(eq(admissions.status, "Closed"));

    const totalUniversities = await db
      .select({ count: sql<number>`count(*)` })
      .from(institutes)
      .where(eq(institutes.status, true));

    const totalCities = await db
      .select({ count: sql<number>`count(*)` })
      .from(cities)
      .where(eq(cities.status, true));

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const closingSoon = await db
      .select({ count: sql<number>`count(*)` })
      .from(admissions)
      .where(and(eq(admissions.status, "Open"), sql`${admissions.expectedCloseDate} < ${thirtyDaysFromNow}`));

    return {
      totalAdmissions: Number(totalAdmissions[0]?.count) || 0,
      closedAdmissions: Number(closedAdmissions[0]?.count) || 0,
      totalUniversities: Number(totalUniversities[0]?.count) || 0,
      totalCities: Number(totalCities[0]?.count) || 0,
      closingSoon: Number(closingSoon[0]?.count) || 0,
    };
  } catch (error) {
    console.error("Stats error:", error);
    return { totalAdmissions: 0, closedAdmissions: 0, totalUniversities: 0, totalCities: 0, closingSoon: 0 };
  }
}

// Admission Card Component
function AdmissionCard({ admission, showClosed }: { admission: Admission; showClosed: boolean }) {
  const timeInfo = getTimeLeftInfo(admission.expectedCloseDate, showClosed);
  const displayPrograms = admission.programs.slice(0, 3);
  const remainingCount = admission.programs.length - 3;

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-4">
            {admission.instituteLogo ? (
              <Image
                src={admission.instituteLogo}
                alt={admission.instituteName || "University"}
                width={56}
                height={56}
                className="rounded-xl object-contain"
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center text-2xl">
                🏛️
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                <Link href={`/admissions/${admission.slug}`} className="hover:text-blue-600 transition">
                  {admission.name || `${admission.instituteName} Admissions ${admission.year}`}
                </Link>
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
                <Link href={`/universities/${admission.instituteSlug}`} className="text-blue-600 hover:underline">
                  {admission.instituteName}
                </Link>
                <span>•</span>
                <span>{admission.cityName || "Pakistan"}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {displayPrograms.map((program) => (
                  <Link
                    key={program.id}
                    href={`/programs/${program.slug}`}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs hover:bg-blue-100 transition"
                  >
                    {program.name}
                  </Link>
                ))}
                {remainingCount > 0 && (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs">
                    +{remainingCount} more
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-gray-500 text-xs">{showClosed ? "Closed Date" : "Last Date"}</div>
                  <div className="font-semibold text-gray-800 text-sm">
                    {admission.expectedCloseDate ? new Date(admission.expectedCloseDate).toLocaleDateString("en-PK") : "TBA"}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-gray-500 text-xs">Session</div>
                  <div className="font-semibold text-gray-800 text-sm">{admission.session || "Fall 2026"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-gray-500 text-xs">Status</div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${admission.status === "Open" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {admission.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          {!timeInfo.hide && timeInfo.label && (
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getBadgeStyles(timeInfo.color || "gray")} ${timeInfo.urgent ? "animate-pulse" : ""}`}>
              {timeInfo.icon} {timeInfo.label}
            </span>
          )}
          <Link href={`/admissions/${admission.slug}`} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium">
            View Details →
          </Link>
        </div>
      </div>
    </article>
  );
}

// ==================== MAIN PAGE ====================
export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = (await searchParams) || {};
  const currentPage = typeof params.page === "string" ? parseInt(params.page) : 1;
  const showClosed = params.closed === "true";

  const filters = {
    city: typeof params.city === "string" ? params.city : "",
    q: typeof params.q === "string" ? params.q : "",
    page: currentPage,
    showClosed,
  };

  const [admissionsResult, stats] = await Promise.all([
    getAdmissions(filters),
    getStats(),
  ]);

  const currentAdmissions = admissionsResult;

  if (currentAdmissions.admissions.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">No Admissions Found</h1>
          <Link href="/admissions" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl">
            View Open Admissions
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {showClosed ? "Closed Admissions in Pakistan" : "University Admissions in Pakistan 2026"}
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              {showClosed ? "Past admission records for reference" : "Find latest admissions with deadlines, requirements, and apply online"}
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.totalAdmissions}+</div>
                <div className="text-sm text-blue-200">Open Admissions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.closedAdmissions}+</div>
                <div className="text-sm text-blue-200">Closed Admissions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.totalUniversities}+</div>
                <div className="text-sm text-blue-200">Universities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.totalCities}+</div>
                <div className="text-sm text-blue-200">Cities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-300">{stats.closingSoon}</div>
                <div className="text-sm text-blue-200">Closing Soon</div>
              </div>
            </div>

            {/* Toggle Buttons */}
            <div className="flex justify-center gap-4 mb-8">
              <Link href="/admissions" className={`px-6 py-2 rounded-full font-medium transition ${!showClosed ? "bg-yellow-400 text-gray-900" : "bg-white/20 text-white"}`}>
                📢 Open Admissions ({stats.totalAdmissions})
              </Link>
              <Link href="/admissions?closed=true" className={`px-6 py-2 rounded-full font-medium transition ${showClosed ? "bg-yellow-400 text-gray-900" : "bg-white/20 text-white"}`}>
                📅 Closed Admissions ({stats.closedAdmissions})
              </Link>
            </div>

            {/* Search Form */}
            <div className="max-w-2xl mx-auto">
              <form action="/admissions" method="GET" className="flex gap-2">
                {showClosed && <input type="hidden" name="closed" value="true" />}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    name="q"
                    defaultValue={filters.q}
                    placeholder="Search by university..."
                    className="w-full px-4 py-3 rounded-xl text-gray-900 border-0 focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <button type="submit" className="px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-300 transition">
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Admissions Cards */}
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-5">
          {currentAdmissions.admissions.map((admission: Admission) => (
            <AdmissionCard key={admission.id} admission={admission} showClosed={showClosed} />
          ))}
        </div>
      </div>
    </main>
  );
}