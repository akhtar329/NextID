
//app/

import { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { db } from "@/app/lib/db";
import {
  admissions,
  admissionOfferings,
  programOfferings,
  programs,
  institutes,
  cities,
  seoMetadata,
} from "@/app/lib/schema";
import { eq, desc, like, and, or, sql } from "drizzle-orm";
import { generateSEO } from "@/app/lib/seo";

// ==================== TYPES ====================
type LevelType =
  | "matric"
  | "inter"
  | "ba"
  | "bs"
  | "bba"
  | "mba"
  | "ms"
  | "medical"
  | "engineering"
  | "law";

type AdmissionWithDetails = {
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
  programs: {
    id: number;
    name: string;
    slug: string;
    degreeName: string | null;
  }[];
};

// ==================== CONSTANTS ====================
const ITEMS_PER_PAGE = 10;

const PROGRAM_TYPES: {
  slug: LevelType | "";
  name: string;
  icon: string;
  description: string;
}[] = [
  {
    slug: "",
    name: "All Programs",
    icon: "📋",
    description: "All admission programs in Pakistan",
  },
  {
    slug: "matric",
    name: "Matric / O-Level",
    icon: "📚",
    description: "Matric and O-Level admissions 2026",
  },
  {
    slug: "inter",
    name: "Intermediate / A-Level",
    icon: "📖",
    description: "Intermediate and A-Level admissions 2026",
  },
  {
    slug: "ba",
    name: "Bachelor (BA/BSc)",
    icon: "🎓",
    description: "Bachelor degree admissions 2026",
  },
  {
    slug: "bs",
    name: "BS Programs (4-Year)",
    icon: "🎓",
    description: "BS 4-year programs admissions 2026",
  },
  {
    slug: "bba",
    name: "BBA",
    icon: "📊",
    description: "BBA admissions 2026 in Pakistan",
  },
  {
    slug: "mba",
    name: "MBA",
    icon: "💼",
    description: "MBA admissions 2026 in Pakistan",
  },
  {
    slug: "ms",
    name: "MS/MPhil",
    icon: "🔬",
    description: "MS and MPhil admissions 2026",
  },
  {
    slug: "medical",
    name: "Medical (MBBS/BDS)",
    icon: "🩺",
    description: "Medical and dental admissions 2026",
  },
  {
    slug: "engineering",
    name: "Engineering",
    icon: "⚙️",
    description: "Engineering admissions 2026",
  },
  {
    slug: "law",
    name: "Law (LLB)",
    icon: "⚖️",
    description: "Law and LLB admissions 2026",
  },
];

const LEVEL_KEYWORDS: Record<LevelType, string[]> = {
  matric: ["Matric", "O-Level", "SSC", "Secondary"],
  inter: ["Intermediate", "A-Level", "HSSC", "FA", "FSc", "ICS", "ICom"],
  ba: ["BA", "BSc", "Bachelor", "B.Com", "B.Ed"],
  bs: ["BS", "BSC", "Bachelor", "4-Year"],
  bba: ["BBA", "Bachelor of Business"],
  mba: ["MBA", "Master of Business"],
  ms: ["MS", "MPhil", "Master", "MSc", "MA"],
  medical: ["MBBS", "BDS", "Medical", "Nursing", "Pharm"],
  engineering: ["Engineering", "Civil", "Mechanical", "Electrical", "Chemical"],
  law: ["LLB", "Law", "Juris"],
};

const FEE_RANGES: Record<LevelType, string> = {
  matric: "PKR 5,000 - 25,000/semester",
  inter: "PKR 8,000 - 35,000/semester",
  ba: "PKR 15,000 - 50,000/semester",
  bs: "PKR 40,000 - 150,000/semester",
  bba: "PKR 50,000 - 200,000/semester",
  mba: "PKR 80,000 - 300,000/semester",
  ms: "PKR 60,000 - 250,000/semester",
  medical: "PKR 200,000 - 800,000/semester",
  engineering: "PKR 50,000 - 180,000/semester",
  law: "PKR 40,000 - 150,000/semester",
};

const ENTRY_TEST: Record<LevelType, string> = {
  matric: "No entry test required",
  inter: "Merit-based admission",
  ba: "Merit-based admission",
  bs: "NTS / University entry test required",
  bba: "NTS / University entry test required",
  mba: "NTS / GAT / University test required",
  ms: "GAT / University test required",
  medical: "MDCAT / NUMS required",
  engineering: "NET / ECAT required",
  law: "LAT required",
};

// ==================== HELPER FUNCTIONS FOR BADGES ====================
function getTimeLeftInfo(closeDate: Date | null, showClosed: boolean) {
  if (!closeDate) {
    if (showClosed) return { label: "Closed", color: "gray", icon: "📅" };
    return { label: null, color: null, hide: true };
  }

  const now = new Date();
  const close = new Date(closeDate);
  const diffMs = close.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const daysPassed = Math.abs(diffDays);
    const hoursPassed = Math.abs(diffHours);

    if (daysPassed === 0) {
      if (hoursPassed < 1)
        return {
          label: "Closed just now",
          color: "gray",
          icon: "📅",
          isExpired: true,
        };
      return {
        label: `Closed ${hoursPassed} hours ago`,
        color: "gray",
        icon: "📅",
        isExpired: true,
      };
    }
    if (daysPassed === 1)
      return {
        label: "Closed yesterday",
        color: "gray",
        icon: "📅",
        isExpired: true,
      };
    if (daysPassed <= 7)
      return {
        label: `Closed ${daysPassed} days ago`,
        color: "gray",
        icon: "📅",
        isExpired: true,
      };
    return {
      label: `Closed on ${close.toLocaleDateString("en-PK")}`,
      color: "gray",
      icon: "📅",
      isExpired: true,
    };
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
    return {
      label: `${diffDays} day${diffDays !== 1 ? "s" : ""} left`,
      color: "yellow",
      icon: "📅",
    };
  }
  if (diffDays <= 30) {
    return {
      label: `${diffDays} day${diffDays !== 1 ? "s" : ""} left`,
      color: "green",
      icon: "📅",
    };
  }
  return { label: null, color: null, hide: true };
}

function getBadgeStyles(color: string) {
  const styles = {
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    green: "bg-green-100 text-green-600",
    gray: "bg-gray-100 text-gray-500",
  };
  return styles[color as keyof typeof styles] || styles.gray;
}

// ==================== METADATA ====================
export async function generateMetadata(): Promise<Metadata> {
  return generateSEO({
    entityType: "page",
    entityId: 1,
    path: "/admissions",
    title:
      "Admissions 2026 in Pakistan – Matric, Inter, BS, MBA, Medical, Engineering | Last Date & Apply Online | NextID.pk",
    description:
      "Explore latest admissions 2026 in Pakistan for Matric, Inter, BS, MBA, Medical and Engineering programs. Check last dates, entry test details, fee structure and apply online.",
    image: "/images/og-admissions.jpg",
    alternates: {
      canonical: "https://www.nextid.pk/admissions",
    },
    openGraph: {
      title:
        "All Admissions 2026 in Pakistan – Matric, Inter, BS, MS & Apply Online",
      description:
        "Explore all 2026 admissions in Pakistan with last dates, fees, and entry test details.",
      url: "https://www.nextid.pk/admissions",
      siteName: "NextID.pk",
      images: [
        {
          url: "https://www.nextid.pk/images/og-admissions.jpg",
          width: 1200,
          height: 630,
          alt: "Admissions 2026 in Pakistan",
        },
      ],
      locale: "en_PK",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "All Admissions 2026 in Pakistan – Apply Online",
      description:
        "Check latest admissions in Pakistan for Matric, Inter, BS & MS programs.",
      images: ["https://www.nextid.pk/images/og-admissions.jpg"],
    },
  });
}

// ==================== GET CITIES WITH ADMISSION COUNTS ====================
async function getCitiesWithAdmissionCounts(showClosed: boolean = false) {
  try {
    const result = await db
      .select({
        id: cities.id,
        name: cities.name,
        slug: cities.slug,
        province: cities.province,
        isPopular: cities.isPopular,
        count: sql<number>`count(distinct ${admissions.id})`.as("count"),
      })
      .from(cities)
      .innerJoin(institutes, eq(institutes.cityId, cities.id))
      .innerJoin(admissions, eq(admissions.instituteId, institutes.id))
      .where(
        showClosed
          ? eq(admissions.status, "Closed")
          : eq(admissions.status, "Open"),
      )
      .groupBy(
        cities.id,
        cities.name,
        cities.slug,
        cities.province,
        cities.isPopular,
      )
      .orderBy(sql`count desc`);

    return result;
  } catch (error) {
    console.error("Error getting city counts:", error);
    return [];
  }
}

// ==================== DATA FETCHING ====================
async function getAdmissions(filters: {
  city?: string;
  level?: LevelType;
  q?: string;
  page?: number;
  showClosed?: boolean;
}) {
  try {
    const currentPage = filters.page || 1;
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    const conditions: any[] = [];

    if (!filters.showClosed) {
      conditions.push(eq(admissions.status, "Open"));
      conditions.push(
        or(
          sql`${admissions.expectedCloseDate} IS NULL`,
          sql`${admissions.expectedCloseDate} >= CURRENT_DATE`,
        ),
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
      conditions.push(or(...searchConditions));
    }

    const whereClause =
      conditions.length === 1 ? conditions[0] : and(...conditions);

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
          : sql`CASE WHEN ${admissions.expectedCloseDate} IS NULL THEN 1 ELSE 0 END, ${admissions.expectedCloseDate} ASC`,
      )
      .limit(ITEMS_PER_PAGE)
      .offset(offset);

    if (admissionsList.length === 0)
      return { admissions: [], totalCount, totalPages, currentPage };

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
          .innerJoin(
            programOfferings,
            eq(admissionOfferings.offeringId, programOfferings.id),
          )
          .innerJoin(programs, eq(programOfferings.programId, programs.id))
          .where(eq(admissionOfferings.admissionId, ad.id));

        return {
          ...ad,
          programs: admissionProgramsList,
        };
      }),
    );

    let filteredAdmissions = admissionsWithPrograms;

    if (
      !filters.showClosed &&
      filters.level &&
      filters.level in LEVEL_KEYWORDS
    ) {
      const keywords = LEVEL_KEYWORDS[filters.level];
      filteredAdmissions = admissionsWithPrograms.filter((ad) =>
        ad.programs.some((program) =>
          keywords.some((keyword) =>
            program.name.toLowerCase().includes(keyword.toLowerCase()),
          ),
        ),
      );
    }

    return {
      admissions: filteredAdmissions,
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
      .where(
        and(
          eq(admissions.status, "Open"),
          sql`${admissions.expectedCloseDate} < ${thirtyDaysFromNow}`,
        ),
      );

    return {
      totalAdmissions: Number(totalAdmissions[0]?.count) || 0,
      closedAdmissions: Number(closedAdmissions[0]?.count) || 0,
      totalUniversities: Number(totalUniversities[0]?.count) || 0,
      totalCities: Number(totalCities[0]?.count) || 0,
      closingSoon: Number(closingSoon[0]?.count) || 0,
    };
  } catch (error) {
    console.error("Stats error:", error);
    return {
      totalAdmissions: 0,
      closedAdmissions: 0,
      totalUniversities: 0,
      totalCities: 0,
      closingSoon: 0,
    };
  }
}

function formatAdmissionName(ad: AdmissionWithDetails): string {
  if (ad.name) return ad.name;

  const university = ad.instituteName || "University";
  const city = ad.cityName || "";
  const year = ad.year || "2026";

  if (ad.programs && ad.programs.length > 0) {
    if (ad.programs.length === 1) {
      return `${ad.programs[0].name} Admissions ${year} at ${university}, ${city}`;
    } else {
      const programCount = ad.programs.length;
      return `Multiple Programs (${programCount}) Admissions ${year} at ${university}, ${city}`;
    }
  }

  return `Admissions ${year} at ${university}, ${city}`;
}

// Pagination Component
function Pagination({
  currentPage,
  totalPages,
  showClosed,
  filters,
}: {
  currentPage: number;
  totalPages: number;
  showClosed: boolean;
  filters: { city?: string; level?: string; q?: string };
}) {
  if (totalPages <= 1) return null;

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();

    if (filters.city) params.set("city", filters.city);
    if (filters.level) params.set("level", filters.level);
    if (filters.q) params.set("q", filters.q);
    if (showClosed) params.set("closed", "true");
    params.set("page", page.toString());

    return `/admissions?${params.toString()}`;
  };

  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex justify-center mt-8">
      <nav
        className="flex items-center gap-2 flex-wrap"
        aria-label="Pagination"
      >
        <Link
          href={currentPage > 1 ? buildPageUrl(currentPage - 1) : "#"}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            currentPage > 1
              ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
          }`}
        >
          ← Previous
        </Link>

        {startPage > 1 && (
          <>
            <Link
              href={buildPageUrl(1)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              1
            </Link>
            {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
          </>
        )}

        {pages.map((page) => (
          <Link
            key={page}
            href={buildPageUrl(page)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              page === currentPage
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {page}
          </Link>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-2 text-gray-400">...</span>
            )}
            <Link
              href={buildPageUrl(totalPages)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {totalPages}
            </Link>
          </>
        )}

        <Link
          href={currentPage < totalPages ? buildPageUrl(currentPage + 1) : "#"}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            currentPage < totalPages
              ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
          }`}
        >
          Next →
        </Link>
      </nav>
    </div>
  );
}

function Breadcrumbs({
  filters,
  programTypes,
  citiesWithCounts,
  showClosed,
}: {
  filters: { city?: string; level?: string; q?: string };
  programTypes: typeof PROGRAM_TYPES;
  citiesWithCounts: any[];
  showClosed: boolean;
}) {
  const items = [
    { name: "Home", url: "/" },
    {
      name: showClosed ? "Closed Admissions" : "Admissions",
      url: showClosed ? "/admissions?closed=true" : "/admissions",
    },
  ];

  if (filters.level) {
    const level = programTypes.find((l) => l.slug === filters.level);
    if (level) {
      items.push({
        name: level.name,
        url: `/admissions?level=${filters.level}${showClosed ? "&closed=true" : ""}`,
      });
    }
  }

  if (filters.city) {
    const city = citiesWithCounts.find((c) => c.slug === filters.city);
    if (city) {
      items.push({
        name: city.name,
        url: `/admissions?city=${filters.city}${showClosed ? "&closed=true" : ""}`,
      });
    }
  }

  if (filters.q) {
    items.push({
      name: `Search: ${filters.q}`,
      url: `/admissions?q=${filters.q}${showClosed ? "&closed=true" : ""}`,
    });
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => (
          <li key={item.url} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gray-400">›</span>}
            {index === items.length - 1 ? (
              <span className="text-gray-700 font-medium">{item.name}</span>
            ) : (
              <Link
                href={item.url}
                className="text-gray-500 hover:text-blue-600 transition"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = (await searchParams) || {};

  const currentPage =
    typeof params.page === "string" ? parseInt(params.page) : 1;
  const showClosed = params.closed === "true";

  const filters = {
    city: typeof params.city === "string" ? params.city : "",
    level:
      typeof params.level === "string"
        ? (params.level as LevelType)
        : undefined,
    q: typeof params.q === "string" ? params.q : "",
    page: currentPage,
    showClosed,
  };

  const [
    openAdmissionsResult,
    closedAdmissionsResult,
    stats,
    citiesWithCounts,
    closedCitiesWithCounts,
  ] = await Promise.all([
    getAdmissions({ ...filters, showClosed: false, page: currentPage }),
    getAdmissions({ ...filters, showClosed: true, page: currentPage }),
    getStats(),
    getCitiesWithAdmissionCounts(false),
    getCitiesWithAdmissionCounts(true),
  ]);

  const currentAdmissions = showClosed
    ? closedAdmissionsResult
    : openAdmissionsResult;
  const currentCitiesWithCounts = showClosed
    ? closedCitiesWithCounts
    : citiesWithCounts;

  const uniqueUniversities = new Set(
    openAdmissionsResult.admissions.map((a) => a.instituteName),
  ).size;
  const totalPrograms = openAdmissionsResult.admissions.reduce(
    (sum, ad) => sum + ad.programs.length,
    0,
  );

  const buildUrl = (key: string, value: string) => {
    const urlParams = new URLSearchParams();
    if (filters.city && key !== "city") urlParams.set("city", filters.city);
    if (filters.level && key !== "level") urlParams.set("level", filters.level);
    if (filters.q && key !== "q") urlParams.set("q", filters.q);
    if (showClosed) urlParams.set("closed", "true");
    if (value) urlParams.set(key, value);
    return urlParams.toString()
      ? `/admissions?${urlParams.toString()}`
      : "/admissions";
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-white">
                {showClosed
                  ? "Past Admissions Records"
                  : "Admissions Open for 2026"}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {filters.level
                ? `${filters.level.toUpperCase()} Admissions 2026 in Pakistan`
                : showClosed
                  ? "Closed Admissions in Pakistan"
                  : "University Admissions in Pakistan 2026 – Complete Guide"}
            </h1>

            <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              {showClosed
                ? "Review past admission records, deadlines, and requirements for reference"
                : "Documents Required • Last Dates • Age Limit • Entry Tests • Spring & Fall Admissions 2026"}
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/20 transition">
                <div className="text-3xl font-bold">
                  {stats.totalAdmissions}+
                </div>
                <div className="text-sm text-blue-200 mt-1">
                  Open Admissions
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/20 transition">
                <div className="text-3xl font-bold">
                  {stats.closedAdmissions}+
                </div>
                <div className="text-sm text-blue-200 mt-1">
                  Closed Admissions
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/20 transition">
                <div className="text-3xl font-bold">
                  {stats.totalUniversities}+
                </div>
                <div className="text-sm text-blue-200 mt-1">Universities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/20 transition">
                <div className="text-3xl font-bold">{stats.totalCities}+</div>
                <div className="text-sm text-blue-200 mt-1">Cities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/20 transition">
                <div className="text-3xl font-bold text-yellow-300">
                  {stats.closingSoon}
                </div>
                <div className="text-sm text-blue-200 mt-1">Closing Soon</div>
              </div>
            </div>

            {/* Toggle between Open and Closed Admissions */}
            <div className="flex justify-center gap-4 mb-8">
              <Link
                href="/admissions"
                className={`px-6 py-2 rounded-full font-medium transition ${
                  !showClosed
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                📢 Open Admissions ({stats.totalAdmissions})
              </Link>
              <Link
                href="/admissions?closed=true"
                className={`px-6 py-2 rounded-full font-medium transition ${
                  showClosed
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                📅 Closed Admissions ({stats.closedAdmissions})
              </Link>
            </div>

            {/* Search Form */}
            <div className="max-w-2xl mx-auto">
              <form action="/admissions" method="GET" className="flex gap-2">
                {showClosed && (
                  <input type="hidden" name="closed" value="true" />
                )}
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </span>
                  <input
                    type="text"
                    name="q"
                    defaultValue={filters.q}
                    placeholder={
                      showClosed
                        ? "Search closed admissions..."
                        : "Search by university or program..."
                    }
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-lg"
                    aria-label="Search admissions"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-300 transition shadow-lg"
                  aria-label="Search"
                >
                  Search
                </button>
              </form>
              {!showClosed && (
                <p className="text-sm text-blue-200 mt-4">
                  Popular: NUST • FAST • LUMS • Lahore • Karachi • BS CS • MBA •
                  Engineering
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs
          filters={filters}
          programTypes={PROGRAM_TYPES}
          citiesWithCounts={currentCitiesWithCounts}
          showClosed={showClosed}
        />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <aside
            className="lg:w-80 flex-shrink-0"
            aria-label="Admission filters"
          >
            <div className="sticky top-24 space-y-6">
              {/* Program Type Filter - Only show for open admissions */}
              {!showClosed && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                      Filter Admissions
                    </h2>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                      Education Level
                    </h3>
                    <div className="space-y-1">
                      {PROGRAM_TYPES.map((level) => (
                        <Link
                          key={level.slug}
                          href={buildUrl("level", level.slug)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                            filters.level === level.slug
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                          aria-label={level.description}
                        >
                          <span className="text-lg">{level.icon}</span>
                          <span className="flex-1">{level.name}</span>
                          {filters.level === level.slug && (
                            <svg
                              className="w-4 h-4 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* City Filter */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <span>📍</span> City
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={buildUrl("city", "")}
                    className={`px-3 py-1.5 rounded-full text-sm transition ${
                      !filters.city
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    aria-label="All cities"
                  >
                    All (
                    {showClosed
                      ? stats.closedAdmissions
                      : stats.totalAdmissions}
                    )
                  </Link>
                  {currentCitiesWithCounts.slice(0, 8).map((city) => (
                    <Link
                      key={city.slug}
                      href={buildUrl("city", city.slug)}
                      className={`px-3 py-1.5 rounded-full text-sm transition ${
                        filters.city === city.slug
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      aria-label={`Admissions in ${city.name}`}
                    >
                      {city.name}{" "}
                      <span className="text-xs opacity-75">({city.count})</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick Info - Only for open admissions */}
              {!showClosed &&
                filters.level &&
                FEE_RANGES[filters.level as LevelType] && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                    <h4 className="font-semibold text-blue-800 text-sm mb-3 flex items-center gap-2">
                      <span>ℹ️</span> Quick Info
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700">
                        <span className="font-medium text-gray-900">
                          💰 Fee Range:
                        </span>{" "}
                        {FEE_RANGES[filters.level as LevelType]}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium text-gray-900">
                          📝 Entry Test:
                        </span>{" "}
                        {ENTRY_TEST[filters.level as LevelType]}
                      </p>
                    </div>
                  </div>
                )}

              {/* Clear Filters */}
              {(filters.city || filters.level || filters.q) && (
                <Link
                  href={showClosed ? "/admissions?closed=true" : "/admissions"}
                  className="block text-center text-sm text-blue-600 hover:underline py-3 border-t"
                >
                  Clear all filters
                </Link>
              )}
            </div>
          </aside>

          {/* Main Content - Admissions List */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {currentAdmissions.totalCount}{" "}
                    {showClosed ? "Closed" : "Open"} Admissions Found
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {filters.level &&
                      !showClosed &&
                      `Level: ${PROGRAM_TYPES.find((l) => l.slug === filters.level)?.name}`}
                    {filters.city &&
                      ` • City: ${currentCitiesWithCounts.find((c) => c.slug === filters.city)?.name}`}
                    {filters.q && ` • Search: "${filters.q}"`}
                    {` • Page ${currentAdmissions.currentPage} of ${currentAdmissions.totalPages}`}
                  </p>
                </div>
                {!showClosed && (
                  <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                    <span className="font-medium text-gray-700">
                      {uniqueUniversities}
                    </span>{" "}
                    Universities •
                    <span className="font-medium text-gray-700 ml-1">
                      {totalPrograms}
                    </span>{" "}
                    Programs
                  </div>
                )}
              </div>
            </div>

            {/* Admissions Cards */}
            <div className="space-y-5">
              {currentAdmissions.admissions.length > 0 ? (
                currentAdmissions.admissions.map((ad) => {
                  const timeInfo = getTimeLeftInfo(
                    ad.expectedCloseDate,
                    showClosed,
                  );
                  const fullName = formatAdmissionName(ad);
                  const displayPrograms = ad.programs.slice(0, 3);
                  const remainingCount = ad.programs.length - 3;

                  return (
                    <article
                      key={ad.id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all overflow-hidden group"
                    >
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              {ad.instituteLogo ? (
                                <img
                                  src={ad.instituteLogo}
                                  alt={ad.instituteName}
                                  className="w-14 h-14 object-contain rounded-xl flex-shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                                  🏛️
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                  <Link
                                    href={`/admissions/${ad.slug}`}
                                    className="hover:text-blue-600 transition"
                                  >
                                    {fullName}
                                  </Link>
                                </h3>

                                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
                                  <Link
                                    href={`/universities/${ad.instituteSlug}`}
                                    className="text-blue-600 hover:underline font-medium"
                                  >
                                    {ad.instituteName}
                                  </Link>
                                  <span>•</span>
                                  <Link
                                    href={`/cities/${ad.citySlug}`}
                                    className="hover:text-blue-600"
                                  >
                                    {ad.cityName}
                                  </Link>
                                  {ad.instituteType && (
                                    <>
                                      <span>•</span>
                                      <span className="text-gray-500">
                                        {ad.instituteType}
                                      </span>
                                    </>
                                  )}
                                </div>

                                <div className="mb-4">
                                  <div className="flex flex-wrap gap-2">
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
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="bg-gray-50 rounded-xl p-3">
                                    <span className="text-gray-500 text-xs">
                                      {showClosed ? "Closed Date" : "Last Date"}
                                    </span>
                                    <div className="font-semibold text-gray-800 text-sm">
                                      {ad.expectedCloseDate
                                        ? new Date(
                                            ad.expectedCloseDate,
                                          ).toLocaleDateString("en-PK", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                          })
                                        : "TBA"}
                                    </div>
                                  </div>
                                  <div className="bg-gray-50 rounded-xl p-3">
                                    <span className="text-gray-500 text-xs">
                                      Session
                                    </span>
                                    <div className="font-semibold text-gray-800 text-sm">
                                      {ad.session || "Fall 2026"}
                                    </div>
                                  </div>
                                  <div className="bg-gray-50 rounded-xl p-3">
                                    <span className="text-gray-500 text-xs">
                                      Year
                                    </span>
                                    <div className="font-semibold text-gray-800 text-sm">
                                      {ad.year}
                                    </div>
                                  </div>
                                  <div className="bg-gray-50 rounded-xl p-3">
                                    <span className="text-gray-500 text-xs">
                                      Status
                                    </span>
                                    <div>
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                        ${
                                          ad.status === "Open"
                                            ? "bg-green-100 text-green-700"
                                            : ad.status === "Expected"
                                              ? "bg-yellow-100 text-yellow-700"
                                              : "bg-red-100 text-red-700"
                                        }`}
                                      >
                                        {ad.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Time Badge Section */}
                          <div className="flex flex-col items-end gap-3 flex-shrink-0">
                            {!showClosed &&
                              timeInfo.label &&
                              !timeInfo.hide && (
                                <span
                                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getBadgeStyles(timeInfo.color)} ${timeInfo.urgent ? "animate-pulse" : ""}`}
                                >
                                  {timeInfo.icon} {timeInfo.label}
                                </span>
                              )}
                            {showClosed && timeInfo.label && (
                              <span
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getBadgeStyles(timeInfo.color)}`}
                              >
                                {timeInfo.icon} {timeInfo.label}
                              </span>
                            )}
                            <Link
                              href={`/admissions/${ad.slug}`}
                              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium whitespace-nowrap shadow-sm"
                            >
                              View Details →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-100">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    No Admissions Found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {filters.level || filters.city || filters.q
                      ? "Try changing your filters to see more results"
                      : showClosed
                        ? "No closed admissions found"
                        : "Check back soon for latest admissions"}
                  </p>
                  <Link
                    href={
                      showClosed ? "/admissions?closed=true" : "/admissions"
                    }
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  >
                    {showClosed
                      ? "View Open Admissions"
                      : "View Closed Admissions"}
                  </Link>
                </div>
              )}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentAdmissions.currentPage}
              totalPages={currentAdmissions.totalPages}
              showClosed={showClosed}
              filters={{
                city: filters.city,
                level: filters.level,
                q: filters.q,
              }}
            />
          </div>
        </div>
      </div>

      {/* ==================== SEO CONTENT SECTION WITH BUCKET A KEYWORDS ==================== */}
      <section className="bg-white py-16 border-t border-gray-100 mt-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              {showClosed
                ? "About Closed Admissions in Pakistan"
                : "University Admissions in Pakistan 2026 – Complete Guide"}
            </h2>

            <div className="space-y-8 text-gray-700 leading-relaxed">
              {/* 4. Documents Required for University Admission in Pakistan */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-2xl border border-yellow-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📋</span> Documents Required for
                  University Admission in Pakistan
                </h3>
                <p>
                  <strong className="text-gray-900">
                    Documents required for university admission in Pakistan
                  </strong>{" "}
                  (standard checklist for most universities):
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Matriculation Certificate (copy + original for
                      verification)
                    </li>
                    <li>Intermediate/FA/FSc Certificate (copy + original)</li>
                    <li>Bachelor's degree (for MS/MPhil admissions)</li>
                    <li>Domicile certificate (original + copy)</li>
                    <li>CNIC/B-Form of applicant (copy)</li>
                    <li>Father/Guardian CNIC (copy)</li>
                  </ul>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Passport size photographs (4-6 copies)</li>
                    <li>Character certificate from last institution</li>
                    <li>Migration certificate (if applicable)</li>
                    <li>Equivalence certificate (for O/A Level students)</li>
                    <li>Entry test result card (NTS/MDCAT/ECAT/NET)</li>
                    <li>Hardship/Quota certificate (if applicable)</li>
                  </ul>
                </div>
                <p className="mt-3 text-sm text-gray-600 bg-white p-3 rounded-lg">
                  📌 <strong>Note:</strong> All documents must be attested by
                  relevant authorities. Some universities require attested
                  copies from HEC or IBCC.
                </p>
              </div>

              {/* 5. University Admission Requirements Pakistan 2026 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">✅</span> University Admission
                  Requirements Pakistan 2026
                </h3>
                <p>
                  <strong className="text-gray-900">
                    University admission requirements Pakistan 2026
                  </strong>{" "}
                  vary by program level:
                </p>
                <div className="space-y-4 mt-4">
                  <div className="bg-white p-4 rounded-xl">
                    <h4 className="font-bold text-blue-700">
                      📘 For BS (Bachelor) Programs:
                    </h4>
                    <ul className="list-disc pl-6 mt-2">
                      <li>
                        Minimum 45-50% marks in Intermediate
                        (FA/FSc/ICS/ICom/A-Levels)
                      </li>
                      <li>
                        NTS NAT score (minimum 50%) or university-specific entry
                        test
                      </li>
                      <li>
                        O/A Level students need IBCC equivalence certificate
                      </li>
                      <li>Age limit: 18-24 years (varies by university)</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <h4 className="font-bold text-purple-700">
                      🎓 For MS/MPhil Programs:
                    </h4>
                    <ul className="list-disc pl-6 mt-2">
                      <li>
                        Bachelor's degree with minimum 2.5 CGPA or 60% marks
                      </li>
                      <li>NTS GAT General (minimum 50%) or university test</li>
                      <li>Research proposal (for thesis track)</li>
                      <li>Letters of recommendation (2-3)</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <h4 className="font-bold text-green-700">
                      🩺 For Medical (MBBS/BDS):
                    </h4>
                    <ul className="list-disc pl-6 mt-2">
                      <li>Minimum 70% in FSc Pre-Medical or A-Levels</li>
                      <li>MDCAT score (minimum 65% for government colleges)</li>
                      <li>NUMS entry test for affiliated colleges</li>
                      <li>Age limit: 17-25 years on December 31, 2026</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <h4 className="font-bold text-orange-700">
                      ⚙️ For Engineering:
                    </h4>
                    <ul className="list-disc pl-6 mt-2">
                      <li>Minimum 60% in FSc Pre-Engineering</li>
                      <li>NET (NUST) or ECAT (UET) entry test</li>
                      <li>Valid domicile of relevant province</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 6. Age Limit for University Admission in Pakistan */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-2xl border border-teal-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎂</span> Age Limit for University
                  Admission in Pakistan
                </h3>
                <p>
                  <strong className="text-gray-900">
                    Age limit for university admission in Pakistan
                  </strong>{" "}
                  varies by program level and university policy:
                </p>
                <div className="overflow-x-auto mt-4">
                  <table className="min-w-full bg-white rounded-xl overflow-hidden shadow-sm">
                    <thead className="bg-teal-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left">Program Level</th>
                        <th className="px-4 py-3 text-left">Minimum Age</th>
                        <th className="px-4 py-3 text-left">Maximum Age</th>
                        <th className="px-4 py-3 text-left">Relaxation</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">Matric/SSC</td>
                        <td className="px-4 py-3">13 years</td>
                        <td className="px-4 py-3">17 years</td>
                        <td className="px-4 py-3">
                          1 year for private candidates
                        </td>
                      </tr>
                      <tr className="bg-gray-50 hover:bg-gray-100">
                        <td className="px-4 py-3 font-medium">
                          Intermediate/HSSC
                        </td>
                        <td className="px-4 py-3">15 years</td>
                        <td className="px-4 py-3">19 years</td>
                        <td className="px-4 py-3">2 years maximum</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">
                          Bachelor (BS/BA/BSc)
                        </td>
                        <td className="px-4 py-3">17 years</td>
                        <td className="px-4 py-3">24 years</td>
                        <td className="px-4 py-3">
                          Up to 26 years for some programs
                        </td>
                      </tr>
                      <tr className="bg-gray-50 hover:bg-gray-100">
                        <td className="px-4 py-3 font-medium">
                          Medical (MBBS/BDS)
                        </td>
                        <td className="px-4 py-3">17 years</td>
                        <td className="px-4 py-3">25 years</td>
                        <td className="px-4 py-3">
                          No relaxation per PMC policy
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">
                          Engineering (BE/BS Engg)
                        </td>
                        <td className="px-4 py-3">17 years</td>
                        <td className="px-4 py-3">24 years</td>
                        <td className="px-4 py-3">PEC allows 1-2 years</td>
                      </tr>
                      <tr className="bg-gray-50 hover:bg-gray-100">
                        <td className="px-4 py-3 font-medium">MS/MPhil</td>
                        <td className="px-4 py-3">21 years</td>
                        <td className="px-4 py-3">No upper limit</td>
                        <td className="px-4 py-3">N/A</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">MBA</td>
                        <td className="px-4 py-3">21 years</td>
                        <td className="px-4 py-3">35 years</td>
                        <td className="px-4 py-3">
                          Work experience may relax age
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-sm text-gray-600 bg-white/70 p-3 rounded-lg">
                  📌 <strong>Important:</strong> Age calculation is based on
                  December 31 of the admission year. Some private universities
                  have flexible age limits. HEC has relaxed age limits for
                  distance learning programs.
                </p>
              </div>

              {/* 7. Summary - Complete Admission Guide */}
              <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-6 rounded-2xl text-white">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">📌</span> Quick Summary: University
                  Admissions in Pakistan 2026
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="font-bold">✅ Open Admissions:</span> NUST,
                    FAST, LUMS, Punjab University, KU, UET, COMSATS
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="font-bold">📅 Fall Deadlines:</span>{" "}
                    February - September 2026
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="font-bold">🌸 Spring Deadlines:</span>{" "}
                    October 2025 - January 2026
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="font-bold">📋 Documents:</span>{" "}
                    Certificates, CNIC, Photos, Domicile, Entry Test Result
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="font-bold">🎂 Age Limit:</span> 17-24 years
                    for Bachelor's, 21+ for Master's
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="font-bold">📝 Entry Tests:</span> NTS, GAT,
                    MDCAT, ECAT, NET, LAT, University-specific
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Navigation Links */}
            <div className="mt-8 flex flex-wrap gap-3 text-sm justify-center">
              <Link
                href="/admissions?level=bs"
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full hover:bg-blue-200 transition"
              >
                🎓 BS Admissions
              </Link>
              <Link
                href="/admissions?level=mba"
                className="bg-green-100 text-green-700 px-4 py-2 rounded-full hover:bg-green-200 transition"
              >
                💼 MBA Admissions
              </Link>
              <Link
                href="/admissions?level=medical"
                className="bg-red-100 text-red-700 px-4 py-2 rounded-full hover:bg-red-200 transition"
              >
                🩺 Medical Admissions
              </Link>
              <Link
                href="/admissions?level=engineering"
                className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full hover:bg-orange-200 transition"
              >
                ⚙️ Engineering Admissions
              </Link>
              <Link
                href="/admissions?level=ms"
                className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full hover:bg-purple-200 transition"
              >
                🔬 MS Admissions
              </Link>
              <Link
                href="/admissions?level=law"
                className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full hover:bg-indigo-200 transition"
              >
                ⚖️ Law Admissions
              </Link>
            </div>

            {/* City-wise Admission Stats */}
            <div className="mt-10">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                Top Cities for Admissions in Pakistan
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentCitiesWithCounts.slice(0, 8).map((city) => (
                  <Link
                    key={city.slug}
                    href={`/admissions?city=${city.slug}${showClosed ? "&closed=true" : ""}`}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center hover:shadow-md transition group"
                  >
                    <div className="text-2xl font-bold text-blue-700">
                      {city.count}
                    </div>
                    <div className="text-sm text-gray-600 mt-1 group-hover:text-blue-600">
                      {showClosed ? "Closed in" : "Admissions in"} {city.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions - University Admissions in Pakistan
              2026
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-blue-600">📅</span> When do admissions
                  start in Pakistan?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Most universities start admissions in July-August for Fall
                  semester and December-January for Spring semester. Matric and
                  Intermediate admissions usually begin after results
                  announcement in August-September. NUST, FAST, and LUMS start
                  earlier (February-March).
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-red-600">⏰</span> What is the last date
                  for admissions 2026?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Last dates vary by university: NUST (March 31), FAST (April
                  15), LUMS (February 15), Punjab University (September 30), KU
                  (October 15). Check individual admission listings above for
                  exact deadlines.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-green-600">💰</span> How much are
                  admission fees in Pakistan?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Fee ranges: Matric (PKR 5k-25k/sem), Intermediate (PKR
                  8k-35k/sem), BS (PKR 40k-150k/sem), MBA (PKR 80k-300k/sem),
                  Medical (PKR 200k-800k/sem). Government universities are
                  cheaper than private ones.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-purple-600">📝</span> Do I need to take
                  an entry test?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Entry test requirements: BS (NTS/University Test), MBA
                  (NTS/GAT), Medical (MDCAT/NUMS), Engineering (NET/ECAT), Law
                  (LAT). Matric and Intermediate are merit-based with no entry
                  test.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-orange-600">📋</span> What documents are
                  required for admission?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Required documents: Matric & Intermediate certificates,
                  CNIC/B-Form, domicile, passport photos, character certificate,
                  migration certificate, entry test result, and father's CNIC.
                  All documents need attestation.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-teal-600">🎂</span> What is the age
                  limit for admission?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Age limits: Matric (13-17 years), Intermediate (15-19 years),
                  Bachelor's (17-24 years), Medical (17-25 years), Engineering
                  (17-24 years), MS/MPhil (21+ years, no upper limit). Age
                  calculated on December 31, 2026.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SCHEMA MARKUP ==================== */}

      {/* 1. ItemList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: showClosed
              ? "Closed Admissions in Pakistan"
              : "Admissions 2026 in Pakistan",
            description: showClosed
              ? "Past admission records in Pakistani universities and colleges"
              : "Latest university and college admissions 2026 in Pakistan. Complete guide with deadlines, requirements, age limits, and documents needed.",
            url: `https://www.nextid.pk/admissions${showClosed ? "?closed=true" : ""}`,
            numberOfItems: currentAdmissions.totalCount,
            itemListElement: currentAdmissions.admissions
              .slice(0, 10)
              .map((ad, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: `https://www.nextid.pk/admissions/${ad.slug}`,
                name: formatAdmissionName(ad),
                item: {
                  "@type": "EducationEvent",
                  name: formatAdmissionName(ad),
                  url: `https://www.nextid.pk/admissions/${ad.slug}`,
                  organizer: {
                    "@type": "EducationalOrganization",
                    name: ad.instituteName,
                    url: `https://www.nextid.pk/universities/${ad.instituteSlug}`,
                  },
                  location: {
                    "@type": "Place",
                    name: ad.cityName,
                    address: {
                      "@type": "PostalAddress",
                      addressLocality: ad.cityName,
                      addressCountry: "PK",
                    },
                  },
                  ...(ad.expectedCloseDate && {
                    endDate: new Date(ad.expectedCloseDate)
                      .toISOString()
                      .split("T")[0],
                  }),
                  eventStatus:
                    ad.status === "Open"
                      ? "https://schema.org/EventScheduled"
                      : "https://schema.org/EventCancelled",
                  eventAttendanceMode:
                    "https://schema.org/OnlineEventAttendanceMode",
                },
              })),
          }),
        }}
      />

      {/* 2. FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "When do admissions start in Pakistan?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Most universities start admissions in July-August for Fall semester and December-January for Spring semester. Matric and Intermediate admissions usually begin after results announcement in August-September.",
                },
              },
              {
                "@type": "Question",
                name: "What is the last date for admissions 2026?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Last dates vary by university and program. NUST deadline is March 31, FAST is April 15, LUMS is February 15, Punjab University is September 30, and Karachi University is October 15 for Fall 2026 admissions.",
                },
              },
              {
                "@type": "Question",
                name: "How much are admission fees in Pakistan universities?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Admission fees vary by program level: Matric (PKR 5,000-25,000/semester), Intermediate (PKR 8,000-35,000/semester), BS programs (PKR 40,000-150,000/semester), MBA (PKR 80,000-300,000/semester), and Medical MBBS (PKR 200,000-800,000/semester).",
                },
              },
              {
                "@type": "Question",
                name: "Which entry test is required for university admissions in Pakistan?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Entry test requirements depend on the program: BS programs require NTS or university-specific test, Medical (MBBS/BDS) requires MDCAT or NUMS, Engineering requires NET or ECAT, MBA requires NTS or GAT, and Law requires LAT. Matric and Intermediate admissions are merit-based.",
                },
              },
              {
                "@type": "Question",
                name: "Which are the top universities open for admissions in Pakistan 2026?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Top universities currently accepting admissions in Pakistan 2026 include NUST, FAST-NUCES, LUMS, University of the Punjab, Karachi University, UET Lahore, COMSATS, and Aga Khan University.",
                },
              },
              {
                "@type": "Question",
                name: "How can I apply for university admissions online in Pakistan?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You can apply online by visiting the university's official website or through NextID.pk. Required documents typically include matric and intermediate certificates, CNIC copy, passport photos, and entry test result. Application forms are available on university portals.",
                },
              },
              {
                "@type": "Question",
                name: "What is the age limit for university admission in Pakistan?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Age limits: Matric (13-17 years), Intermediate (15-19 years), Bachelor's (17-24 years), Medical (17-25 years), Engineering (17-24 years), MS/MPhil (21+ years with no upper limit). Age is calculated based on December 31 of the admission year.",
                },
              },
              {
                "@type": "Question",
                name: "What documents are required for university admission in Pakistan?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Required documents include: Matric and Intermediate certificates, CNIC/B-Form, domicile certificate, passport size photographs (4-6 copies), character certificate from last institution, migration certificate (if applicable), equivalence certificate for O/A Level students, entry test result card, and father/guardian CNIC. All documents must be attested.",
                },
              },
            ],
          }),
        }}
      />

      {/* 3. BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://www.nextid.pk",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: showClosed ? "Closed Admissions" : "Admissions 2026",
                item: `https://www.nextid.pk/admissions${showClosed ? "?closed=true" : ""}`,
              },
              ...(filters.level
                ? [
                    {
                      "@type": "ListItem",
                      position: 3,
                      name:
                        PROGRAM_TYPES.find((p) => p.slug === filters.level)
                          ?.name || filters.level,
                      item: `https://www.nextid.pk/admissions?level=${filters.level}`,
                    },
                  ]
                : []),
              ...(filters.city
                ? [
                    {
                      "@type": "ListItem",
                      position: filters.level ? 4 : 3,
                      name:
                        currentCitiesWithCounts.find(
                          (c) => c.slug === filters.city,
                        )?.name || filters.city,
                      item: `https://www.nextid.pk/admissions?city=${filters.city}`,
                    },
                  ]
                : []),
            ],
          }),
        }}
      />

      {/* 4. WebPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: showClosed
              ? "Closed Admissions in Pakistan | NextID.pk"
              : "University Admissions in Pakistan 2026 – Complete Guide | NextID.pk",
            url: `https://www.nextid.pk/admissions${showClosed ? "?closed=true" : ""}`,
            description: showClosed
              ? "Past admission records in Pakistani universities and colleges"
              : "Complete guide to university admissions in Pakistan 2026. Find admission deadlines, documents required, age limits, entry tests, and open universities. Updated information for Matric, Inter, BS, MBA, Medical, and Engineering programs.",
            inLanguage: "en-PK",
            isPartOf: {
              "@type": "WebSite",
              name: "NextID.pk",
              url: "https://www.nextid.pk",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://www.nextid.pk/admissions?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            },
            publisher: {
              "@type": "Organization",
              name: "NextID.pk",
              url: "https://www.nextid.pk",
              logo: {
                "@type": "ImageObject",
                url: "https://www.nextid.pk/logo.png",
              },
            },
          }),
        }}
      />
    </main>
  );
}
