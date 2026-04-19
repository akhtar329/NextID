import { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import dynamic from "next/dynamic";
import HeroSection from "@/app/component/sections/Home/HeroSection";
import OnScrollLoad from "@/app/component/OnScrollLoad/OnScrollLoad";
import { generateSEOClient } from "@/app/lib/seo";

// ==================== DYNAMIC IMPORTS ====================
const AdmissionSection = dynamic(() =>
  import("@/app/component/sections/Home/AdmissionSection")
);

const ResultsSection = dynamic(() =>
  import("@/app/component/sections/Home/ResultsSection")
);

const CoursesSection = dynamic(() =>
  import("@/app/component/sections/Home/CoursesSection")
);

const UniversitiesSection = dynamic(() =>
  import("@/app/component/sections/Home/UniversitiesSection")
);

const SidebarWidgets = dynamic(() =>
  import("@/app/component/sections/Home/SidebarWidgets")
);

// ==================== METADATA ====================
export const metadata: Metadata = generateSEOClient({
  path: "/",
  title:
    "Find Admissions, Check Results & Download Date Sheets 2026 | Pakistan | NextID",
  description:
    "Complete education information portal. Find 2026 admissions, board results, date sheets, merit lists & scholarships. All in one place.",
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
  logo: "https://www.nextid.pk/logo.png",
};

export default function HomePage() {
  return (
    <>
      {/* ✅ JSON-LD (non-blocking) */}
      <Script
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <div className="min-h-screen bg-gray-50">
        
        {/* HERO (LCP) */}
        <HeroSection />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* MAIN CONTENT */}
            <main className="lg:w-8/12">

              {/* ✅ FIRST SECTION (NO DELAY) */}
              <section className="mb-12">
                <AdmissionSection />
              </section>

              {/* ✅ SCROLL LOAD START */}

              <OnScrollLoad>
                <section className="mb-12">
                  <ResultsSection />
                </section>
              </OnScrollLoad>

              <OnScrollLoad>
                <section className="mb-12">
                  <CoursesSection />
                </section>
              </OnScrollLoad>

              <OnScrollLoad>
                <section className="mb-12">
                  <UniversitiesSection />
                </section>
              </OnScrollLoad>

            </main>

            {/* SIDEBAR */}
            <aside className="lg:w-4/12 space-y-8 lg:sticky lg:top-6">
              <OnScrollLoad>
                <SidebarWidgets />
              </OnScrollLoad>
            </aside>

          </div>
        </div>

        {/* ✅ LIGHT SEO CONTENT (reduced DOM load) */}
        <section className="bg-white py-10 border-t border-gray-200 mt-6">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Pakistan Education Portal – Admissions, Results & Updates
            </h2>

            <p className="text-gray-600 text-sm leading-relaxed">
              NextID.pk provides latest updates on admissions, results, date sheets,
              universities, and scholarships across Pakistan. Stay updated with real-time
              educational news and opportunities.
            </p>

            <div className="mt-6 text-xs text-gray-400">
              © {new Date().getFullYear()} NextID.pk
            </div>
          </div>
        </section>

      </div>
    </>
  );
}