// app/(public)/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import HeroSection from "@/app/component/sections/Home/HeroSection";
import AdmissionSection from "@/app/component/sections/Home/AdmissionSection";
import ResultsSection from "@/app/component/sections/Home/ResultsSection";
import CoursesSection from "@/app/component/sections/Home/CoursesSection";
import UniversitiesSection from "@/app/component/sections/Home/UniversitiesSection";
import SidebarWidgets from "@/app/component/sections/Home/SidebarWidgets";
import { generateSEOClient } from "@/app/lib/seo";

// ==================== METADATA FOR SEO ====================
// Use generateSEOClient (synchronous version) for static metadata
export const metadata: Metadata = generateSEOClient({
  path: "/",
  title: "Find Admissions, Check Results & Download Date Sheets 2026 | Pakistan | NextID",
  description: "Complete education information portal. Find 2026 admissions, board results, date sheets, merit lists & scholarships. All in one place.",
  image: "/og-image.jpg",
});

// ==================== SCHEMA MARKUP ====================
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "NextID.pk",
  url: "https://www.nextid.pk",
  description:
    "Find Admissions, Check Results & Download Date Sheets 2026 | Pakistan | NextID",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://www.nextid.pk/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "NextID.pk",
  url: "https://www.nextid.pk",
  logo: "https://www.nextid.pk/logo.png",
  sameAs: [
    "https://www.facebook.com/nextidpk",
    "https://twitter.com/nextidpk",
    "https://www.instagram.com/nextidpk",
  ],
  address: {
    "@type": "PostalAddress",
    addressCountry: "PK",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://www.nextid.pk",
    },
  ],
};

// ==================== MAIN PAGE ====================
export default function HomePage() {
  return (
    <>
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Main Content */}
      <div className="min-h-screen bg-gray-50">
        <HeroSection />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <main className="lg:w-8/12">
              <section className="mb-12">
                <Suspense
                  fallback={
                    <div className="animate-pulse h-96 bg-gray-200 rounded-xl"></div>
                  }
                >
                  <AdmissionSection />
                </Suspense>
              </section>
              <section className="mb-12">
                <Suspense
                  fallback={
                    <div className="animate-pulse h-96 bg-gray-200 rounded-xl"></div>
                  }
                >
                  <ResultsSection />
                </Suspense>
              </section>
              <section className="mb-12">
                <Suspense
                  fallback={
                    <div className="animate-pulse h-96 bg-gray-200 rounded-xl"></div>
                  }
                >
                  <CoursesSection />
                </Suspense>
              </section>
              <section className="mb-12">
                <Suspense
                  fallback={
                    <div className="animate-pulse h-96 bg-gray-200 rounded-xl"></div>
                  }
                >
                  <UniversitiesSection />
                </Suspense>
              </section>
            </main>

            {/* Sidebar */}
            <aside
              className="lg:w-4/12 space-y-8 lg:sticky lg:top-6"
              aria-label="Quick Links"
            >
              <Suspense
                fallback={
                  <div className="animate-pulse h-[600px] bg-gray-200 rounded-xl"></div>
                }
              >
                <SidebarWidgets />
              </Suspense>
            </aside>
          </div>
        </div>

        {/* SEO Content Section - Dynamic */}
        <section className="bg-white py-12 border-t border-gray-200 mt-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Pakistan Education Portal - Admissions 2026, Results & More
              </h2>
              
              <div className="prose prose-blue max-w-none text-gray-600">
                <p className="text-lg leading-relaxed mb-4">
                  <strong className="text-gray-900">NextID.pk</strong> is Pakistan's premier education 
                  portal providing the latest updates on <strong className="text-gray-900">admissions 2026</strong> 
                  in top universities across the country.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                  <div className="bg-blue-50 rounded-xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">📚 University Admissions 2026</h3>
                    <p className="text-sm">
                      Apply online for top universities including 
                      <Link href="/universities/nust" className="text-blue-600 hover:underline mx-1">NUST</Link>,
                      <Link href="/universities/fast-nuces" className="text-blue-600 hover:underline mx-1">FAST</Link>,
                      <Link href="/universities/lums" className="text-blue-600 hover:underline mx-1">LUMS</Link>,
                      <Link href="/universities/punjab-university" className="text-blue-600 hover:underline mx-1">Punjab University</Link>,
                      and <Link href="/universities/karachi-university" className="text-blue-600 hover:underline mx-1">Karachi University</Link>.
                      Find complete information for <strong>BS programs</strong>, <strong>MBA admissions</strong>, 
                      <strong>MS programs</strong>, <strong>medical admissions</strong>, and 
                      <strong>engineering admissions</strong>.
                    </p>
                  </div>
                  
                  <div className="bg-green-50 rounded-xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">📊 Results & Date Sheets 2026</h3>
                    <p className="text-sm">
                      Check <strong>board results 2026</strong> for FBISE, BISE Lahore, BISE Karachi, 
                      BISE Rawalpindi, and all other educational boards. Download <strong>date sheets 2026</strong> 
                      for annual and supplementary examinations. Get <strong>merit lists</strong>, 
                      <strong>fee structures</strong>, and <strong>entry test schedules</strong> 
                      for all major universities.
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-5 my-6">
                  <h3 className="font-semibold text-gray-900 mb-3">🎓 Latest Education News & Updates</h3>
                  <p className="text-sm">
                    Stay updated with the latest <strong>education news</strong>, 
                    <strong>scholarship opportunities</strong>, <strong>career guidance</strong>, 
                    and <strong>study abroad programs</strong> in Pakistan. Follow us for instant 
                    alerts on admission deadlines, result announcements, and exam schedules.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-center">
                  <div className="p-4">
                    <div className="text-2xl mb-2">🏛️</div>
                    <div className="text-sm font-medium text-gray-900">50+ Universities</div>
                    <div className="text-xs text-gray-500">Complete Information</div>
                  </div>
                  <div className="p-4">
                    <div className="text-2xl mb-2">📝</div>
                    <div className="text-sm font-medium text-gray-900">1000+ Programs</div>
                    <div className="text-xs text-gray-500">BS, MS, PhD & More</div>
                  </div>
                  <div className="p-4">
                    <div className="text-2xl mb-2">📊</div>
                    <div className="text-sm font-medium text-gray-900">500+ Results</div>
                    <div className="text-xs text-gray-500">Board & University</div>
                  </div>
                  <div className="p-4">
                    <div className="text-2xl mb-2">📰</div>
                    <div className="text-sm font-medium text-gray-900">Daily Updates</div>
                    <div className="text-xs text-gray-500">Latest News & Alerts</div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-400 text-center mt-8 pt-6 border-t">
                  Last updated: {new Date().toLocaleDateString('en-PK')} | 
                  <Link href="/about" className="text-blue-600 hover:underline mx-1">About Us</Link> | 
                  <Link href="/contact" className="text-blue-600 hover:underline mx-1">Contact</Link> | 
                  <Link href="/privacy" className="text-blue-600 hover:underline mx-1">Privacy Policy</Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}