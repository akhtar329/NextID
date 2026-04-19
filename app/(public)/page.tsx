// app/(public)/page.tsx

import { Metadata } from "next";
import dynamic from "next/dynamic";
import HeroSection from "@/app/component/sections/Home/HeroSection";
import { generateSEOClient } from "@/app/lib/seo";

// ==================== SEO ====================
export const metadata: Metadata = generateSEOClient({
  path: "/",
  title:
    "Pakistan Education News 2026 – Check Admissions, Results & Date Sheets | NextID",
  description:
    "Get the latest Pakistan Education News 2026 in one place. Check university admissions, board results, and date sheets quickly | NextID",
  image: "/og-image.jpg",
});

// ==================== LAZY LOAD (IMPORTANT) ====================
const AdmissionSection = dynamic(
  () => import("@/app/component/sections/Home/AdmissionSection"),
  { loading: () => <SectionLoader /> }
);

const ResultsSection = dynamic(
  () => import("@/app/component/sections/Home/ResultsSection"),
  { loading: () => <SectionLoader /> }
);

const CoursesSection = dynamic(
  () => import("@/app/component/sections/Home/CoursesSection"),
  { loading: () => <SectionLoader /> }
);

const UniversitiesSection = dynamic(
  () => import("@/app/component/sections/Home/UniversitiesSection"),
  { loading: () => <SectionLoader /> }
);

const SidebarWidgets = dynamic(
  () => import("@/app/component/sections/Home/SidebarWidgets"),
  { loading: () => <SidebarLoader /> }
);

// ==================== LOADERS ====================
function SectionLoader() {
  return (
    <div className="h-[400px] bg-gray-100 animate-pulse rounded-xl" />
  );
}

function SidebarLoader() {
  return (
    <div className="h-[600px] bg-gray-100 animate-pulse rounded-xl" />
  );
}

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
export default function HomePage() {
  return (
    <>
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <div className="min-h-screen bg-gray-50">

        {/* ✅ HERO = FIRST LOAD (IMPORTANT FOR LCP) */}
        <HeroSection />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ================= MAIN ================= */}
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

            {/* ================= SIDEBAR ================= */}
            <aside className="lg:w-4/12 lg:sticky lg:top-6 space-y-8">
              <SidebarWidgets />
            </aside>

          </div>
        </div>

        {/* ================= SEO CONTENT ================= */}
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