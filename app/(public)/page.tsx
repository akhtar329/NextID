// app/(public)/page.tsx (COMPLETE OPTIMIZED VERSION)
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/app/lib/db";
import { admissions, results, programs, institutes } from "@/app/lib/schema";
import { generateSEOClient } from "@/app/lib/seo";
import HeroSection from "@/app/component/sections/Home/HeroSection";
import AdmissionSection from "@/app/component/sections/Home/AdmissionSection";
import ResultsSection from "@/app/component/sections/Home/ResultsSection";
import CoursesSection from "@/app/component/sections/Home/CoursesSection";
import UniversitiesSection from "@/app/component/sections/Home/UniversitiesSection";
import SidebarWidgets from "@/app/component/sections/Home/SidebarWidgets";

// ✅ SINGLE revalidate - 24 hours as requested
export const revalidate = 86400;

// ==================== SEO ====================
export const metadata: Metadata = generateSEOClient({
  path: "/",
  title:
    "Pakistan Education News 2026 – Check Admissions, Results & Date Sheets | NextID",
  description:
    "Get the latest Pakistan Education News 2026 in one place. Check university admissions, board results, and date sheets quickly | NextID",
  image: "/og-image.jpg",
});

// ==================== TYPES ====================
type AdmissionType = {
  id: number;
  name: string;
  slug: string;
  instituteId: number;
  closeDate: Date | null;
  year: number;
  session: string | null;
};

type ResultType = {
  id: number;
  title: string;
  slug: string;
  boardId: number | null;
  year: number;
  examType: string | null;
  resultDate: Date | null;
};

type ProgramType = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  totalOfferings: number | null;
};

type InstituteType = {
  id: number;
  name: string;
  slug: string;
  cityId: number;
  logo: string | null;
  type: string;
};

type HomeData = {
  admissions: AdmissionType[];
  results: ResultType[];
  programs: ProgramType[];
  institutes: InstituteType[];
};

// ==================== CACHED DATA FETCHING ====================
const getHomePageData = unstable_cache(
  async (): Promise<HomeData> => {
    try {
      const [
        activeAdmissions,
        recentResults,
        featuredPrograms,
        featuredInstitutes,
      ] = await Promise.all([
        db
          .select({
            id: admissions.id,
            name: admissions.name,
            slug: admissions.slug,
            instituteId: admissions.instituteId,
            closeDate: admissions.closeDate,
            year: admissions.year,
            session: admissions.session,
          })
          .from(admissions)
          .where(eq(admissions.status, "Open"))
          .orderBy(desc(admissions.createdAt))
          .limit(6),

        db
          .select({
            id: results.id,
            title: results.title,
            slug: results.slug,
            boardId: results.boardId,
            year: results.year,
            examType: results.examType,
            resultDate: results.resultDate,
          })
          .from(results)
          .where(eq(results.status, true))
          .orderBy(desc(results.resultDate))
          .limit(8),

        db
          .select({
            id: programs.id,
            name: programs.name,
            slug: programs.slug,
            shortDescription: programs.shortDescription,
            totalOfferings: programs.totalOfferings,
          })
          .from(programs)
          .where(eq(programs.isFeatured, true))
          .orderBy(desc(programs.totalOfferings))
          .limit(4),

        db
          .select({
            id: institutes.id,
            name: institutes.name,
            slug: institutes.slug,
            cityId: institutes.cityId,
            logo: institutes.logo,
            type: institutes.type,
          })
          .from(institutes)
          .where(eq(institutes.isFeatured, true))
          .orderBy(desc(institutes.ranking))
          .limit(12),
      ]);

      return {
        admissions: activeAdmissions as AdmissionType[],
        results: recentResults as ResultType[],
        programs: featuredPrograms as ProgramType[],
        institutes: featuredInstitutes as InstituteType[],
      };
    } catch (error) {
      console.error("HomePage DB Error:", error);

      return {
        admissions: [],
        results: [],
        programs: [],
        institutes: [],
      };
    }
  },
  ["homepage-data"],
  {
    revalidate: 86400, // ✅ Changed to 24 hours as requested
    tags: ["home"],
  }
);

// ==================== SCHEMA ====================
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "NextID.pk",
  url: "https://www.nextid.pk",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "NextID.pk",
  url: "https://www.nextid.pk",
};

// ==================== PAGE ====================
export default async function HomePage() {
  // ✅ Pre-fetch data for cache warming (but components will render from cache)
  await getHomePageData();

  return (
    <>
      {/* ✅ SEO: Added cache header */}
      <meta httpEquiv="Cache-Control" content="public, s-maxage=86400, stale-while-revalidate=86400" />
      
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
        {/* HERO */}
        <HeroSection />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* MAIN */}
            <main className="lg:w-8/12 space-y-12">
              <section>
                <AdmissionSection />
              </section>

              <section>
                <ResultsSection />
              </section>

              <section>
                <CoursesSection />
              </section>

              <section>
                <UniversitiesSection />
              </section>
            </main>

            {/* SIDEBAR */}
            <aside className="lg:w-4/12 lg:sticky lg:top-6 space-y-8">
              <SidebarWidgets />
            </aside>
          </div>
        </div>

        {/* SEO CONTENT */}
        <section className="bg-white py-12 border-t border-gray-200 mt-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Pakistan Education Portal 2026
            </h2>
            <p className="text-gray-600">
              Find admissions, results, date sheets, merit lists and
              scholarships across Pakistan. All in one place.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}