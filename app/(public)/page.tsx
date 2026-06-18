// app/(public)/page.tsx

import React, { Suspense } from "react";
import type { Metadata } from "next";
import OnScrollLoad from "@/components/OnScrollLoad/OnScrollLoad";

// Sections
import AdmissionSection from "@/components/sections/Home/AdmissionSection";
import ResultsSection from "@/components/sections/Home/ResultsSection";
import DateSheetSection from "@/components/sections/Home/DatesheetSection";
import ScholarshipsSection from "@/components/sections/Home/ScholarshipsSection";
import SidebarWidgets from "@/components/sections/Home/SidebarWidgets";
import JobsSection from "@/components/sections/Home/JobsSection";
import NewsSection from "@/components/sections/Home/NewsSection";

// ================= SEO =================

export const metadata: Metadata = {
  title:
    "NextID.pk - Admissions, Results, Date Sheets, Scholarships & Jobs",
  description:
    "Latest admissions, results, date sheets, scholarships, jobs and education news from universities, colleges and boards across Pakistan.",

  keywords: [
    "Admissions Pakistan",
    "Results Pakistan",
    "Date Sheets",
    "Scholarships",
    "Jobs Pakistan",
    "Education News",
    "Universities Pakistan",
    "Boards Pakistan",
    "NextID",
  ],

  alternates: {
    canonical: "https://www.nextid.pk",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    title:
      "NextID.pk - Admissions, Results, Date Sheets, Scholarships & Jobs",
    description:
      "Latest educational updates from universities, colleges and boards across Pakistan.",
    url: "https://www.nextid.pk",
    siteName: "NextID.pk",
    locale: "en_PK",
    type: "website",
    images: [
      {
        url: "https://www.nextid.pk/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "NextID.pk",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "NextID.pk - Admissions, Results, Date Sheets, Scholarships & Jobs",
    description:
      "Latest educational updates from universities and boards across Pakistan.",
    images: ["https://www.nextid.pk/og-image.jpg"],
  },
};

// ================= SCHEMA =================

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "NextID.pk",
  url: "https://www.nextid.pk",
  description:
    "Educational platform providing admissions, results, jobs, scholarships and date sheets.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.nextid.pk/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "NextID.pk",
  url: "https://www.nextid.pk",
  logo: "https://www.nextid.pk/logo.png",
  sameAs: [],
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

// ================= NEWS WRAPPER =================

function NewsSectionWrapper() {
  return (
    <Suspense
      fallback={
        <div className="h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-2xl" />
      }
    >
      <NewsSection />
    </Suspense>
  );
}

// ================= PAGE =================

export default async function HomePage() {
  return (
    <>
      {/* Structured Data */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <div
        className="min-h-screen bg-gray-50"
        suppressHydrationWarning
      >
        {/* SEO H1 */}

        <h1 className="sr-only">
          NextID.pk - Admissions, Results, Date Sheets,
          Scholarships and Jobs in Pakistan
        </h1>

        {/* Top News */}

        <NewsSectionWrapper />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}

            <main
              className="lg:w-8/12 space-y-12"
              aria-label="Main Content"
            >
              <OnScrollLoad rootMargin="200px">
                <ResultsSection />
              </OnScrollLoad>

              <OnScrollLoad rootMargin="200px">
                <AdmissionSection />
              </OnScrollLoad>

              <OnScrollLoad rootMargin="200px">
                <DateSheetSection />
              </OnScrollLoad>

              <OnScrollLoad rootMargin="200px">
                <ScholarshipsSection />
              </OnScrollLoad>

              <OnScrollLoad rootMargin="200px">
                <JobsSection />
              </OnScrollLoad>
            </main>

            {/* Sidebar */}

            <aside
              className="lg:w-1/3"
              aria-label="Sidebar"
            >
              <div className="lg:sticky lg:top-6 space-y-6">
                <Suspense fallback={<div>Loading...</div>}>
                  <SidebarWidgets />
                </Suspense>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}