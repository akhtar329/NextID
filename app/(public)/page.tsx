// app/(public)/page.tsx

import type { Metadata } from "next";
import { generateSEOClient } from "@/lib/seo";
import OnScrollLoad from "@/components/OnScrollLoad/OnScrollLoad";

// Sections (sab apna data khud fetch karein ge)
import HeroSection from "@/components/sections/Home/HeroSection";
import AdmissionSection from "@/components/sections/Home/AdmissionSection";
import ResultsSection from "@/components/sections/Home/ResultsSection";
import DateSheetSection from "@/components/sections/Home/DatesheetSection";
import ScholarshipsSection from "@/components/sections/Home/ScholarshipsSection";
import SidebarWidgets from "@/components/sections/Home/SidebarWidgets";
import JobsSection from "@/components/sections/Home/JobsSection";

// ✅ SINGLE revalidate - 24 hours
export const revalidate = 86400;

// ==================== SEO ====================
export const metadata: Metadata = generateSEOClient({
  path: "/",
  title: "Pakistan Education News 2026 – Check Admissions, Results & Date Sheets | NextID",
  description: "Get the latest Pakistan Education News 2026 in one place. Check university admissions, board results, and date sheets quickly | NextID",
  image: "/og-image.jpg",
});

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
  return (
    <>
      {/* SEO Cache Header */}
      <meta httpEquiv="Cache-Control" content="public, s-maxage=86400, stale-while-revalidate=86400" />
      
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
        
        {/* ✅ HERO - Immediate load (no scroll needed) */}
        <HeroSection />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* MAIN CONTENT */}
            <main className="lg:w-8/12 space-y-12">
              
              {/* ✅ ADMISSIONS - On scroll load (self-fetching) */}
              <OnScrollLoad rootMargin="200px">
                <AdmissionSection />
              </OnScrollLoad>

              {/* ✅ RESULTS - On scroll load (self-fetching) */}
              <OnScrollLoad rootMargin="200px">
                <ResultsSection />
              </OnScrollLoad>

              {/* ✅ DATE SHEETS - On scroll load (self-fetching) */}
              <OnScrollLoad rootMargin="200px">
                <DateSheetSection />
              </OnScrollLoad>

              {/* ✅ SCHOLARSHIPS - On scroll load (self-fetching) */}
              <OnScrollLoad rootMargin="200px">
                <ScholarshipsSection />
              </OnScrollLoad>

              {/* ✅ Job - On scroll load (self-fetching) */}
              <OnScrollLoad rootMargin="200px">
                <JobsSection />
              </OnScrollLoad>

            </main>

            {/* ✅ SIDEBAR - Immediate load (sticky, always visible area) */}
            <aside className="lg:w-4/12 lg:sticky lg:top-6 space-y-8">
              <SidebarWidgets />
            </aside>
            
          </div>
        </div>

        {/* SEO CONTENT - On scroll load */}
        <OnScrollLoad rootMargin="200px">
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
        </OnScrollLoad>
        
      </div>
    </>
  );
}