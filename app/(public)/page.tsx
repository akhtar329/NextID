// app/(public)/page.tsx

import type { Metadata } from "next";
import { Suspense } from "react";
import OnScrollLoad from "@/components/OnScrollLoad/OnScrollLoad";
import { postService } from "@/services/post/post.service";

// Sections
import AdmissionSection from "@/components/sections/Home/AdmissionSection";
import ResultsSection from "@/components/sections/Home/ResultsSection";
import DateSheetSection from "@/components/sections/Home/DatesheetSection";
import ScholarshipsSection from "@/components/sections/Home/ScholarshipsSection";
import SidebarWidgets from "@/components/sections/Home/SidebarWidgets";
import JobsSection from "@/components/sections/Home/JobsSection";

// Types for schema items
interface SchemaListItem {
  "@type": string;
  position: number;
  url: string;
  name: string;
}

// ==================== DYNAMIC DATA FETCHING FOR SCHEMA ====================

async function getLatestAdmissionsForSchema(limit: number = 10): Promise<SchemaListItem[]> {
  try {
    const admissions = await postService.getPostsByType('admission', limit);
    return admissions.map((post, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.nextid.pk/admissions/${post.slug}`,
      "name": post.title
    }));
  } catch (error) {
    console.error('Error fetching admissions for schema:', error);
    return [];
  }
}

async function getLatestResultsForSchema(limit: number = 8): Promise<SchemaListItem[]> {
  try {
    const results = await postService.getPostsByType('result', limit);
    return results.map((post, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.nextid.pk/results/${post.slug}`,
      "name": post.title
    }));
  } catch (error) {
    console.error('Error fetching results for schema:', error);
    return [];
  }
}

async function getLatestDateSheetsForSchema(limit: number = 6): Promise<SchemaListItem[]> {
  try {
    const dateSheets = await postService.getPostsByType('date_sheet', limit);
    return dateSheets.map((post, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.nextid.pk/date-sheets/${post.slug}`,
      "name": post.title
    }));
  } catch (error) {
    console.error('Error fetching date sheets for schema:', error);
    return [];
  }
}

async function getLatestJobsForSchema(limit: number = 8): Promise<SchemaListItem[]> {
  try {
    const jobs = await postService.getPostsByType('job', limit);
    return jobs.map((post, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.nextid.pk/jobs/${post.slug}`,
      "name": post.title
    }));
  } catch (error) {
    console.error('Error fetching jobs for schema:', error);
    return [];
  }
}

async function getLatestScholarshipsForSchema(limit: number = 6): Promise<SchemaListItem[]> {
  try {
    const scholarships = await postService.getPostsByType('scholarship', limit);
    return scholarships.map((post, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.nextid.pk/scholarships/${post.slug}`,
      "name": post.title
    }));
  } catch (error) {
    console.error('Error fetching scholarships for schema:', error);
    return [];
  }
}

// ==================== METADATA ====================
export const metadata: Metadata = {
  title: "NextID.pk - #1 Educational News Platform in Pakistan | Admissions, Results, Jobs",
  description: "One point resource to discover latest updates in education, university admissions, scholarships, results, date sheets, and jobs on the leading educational website of Pakistan.",
  metadataBase: new URL("https://www.nextid.pk"),
  alternates: { canonical: "https://www.nextid.pk" },
  openGraph: {
    title: "NextID.pk - Pakistan's Leading Education Platform",
    description: "Find & compare study programs, universities, admissions, results, date sheets, scholarships, and jobs across Pakistan.",
    siteName: "NextID.pk",
    locale: "en_PK",
    type: "website",
    url: "https://www.nextid.pk",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NextID.pk - Pakistan's Leading Education Platform",
    description: "Find & compare study programs, universities, admissions, results, date sheets, scholarships, and jobs across Pakistan.",
    images: ["/og-image.png"],
  },
};

// ==================== STATIC SCHEMA ====================

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "NextID.pk",
  "url": "https://www.nextid.pk",
  "logo": "https://www.nextid.pk/logo.png",
  "sameAs": ["https://www.facebook.com/nextidpk", "https://twitter.com/nextidpk", "https://www.instagram.com/nextidpk"],
  "description": "One point resource to discover latest updates in education, university admission, scholarships, results, date sheets, and jobs in Pakistan.",
  "address": { "@type": "PostalAddress", "addressCountry": "PK" },
  "contactPoint": { "@type": "ContactPoint", "contactType": "customer support", "email": "info@nextid.pk", "telephone": "+92-342-5537329" }
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "NextID.pk",
  "url": "https://www.nextid.pk",
  "potentialAction": {
    "@type": "SearchAction",
    "target": { "@type": "EntryPoint", "urlTemplate": "https://www.nextid.pk/search?q={search_term_string}" },
    "query-input": "required name=search_term_string"
  }
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.nextid.pk" }]
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "When do university admissions start in Pakistan?", "acceptedAnswer": { "@type": "Answer", "text": "University admissions in Pakistan typically start in July-August for Fall semester and December-January for Spring semester. Top universities like NUST, FAST, and LUMS announce admissions in March-April." } },
    { "@type": "Question", "name": "How can I check my board result online?", "acceptedAnswer": { "@type": "Answer", "text": "You can check your board result online by visiting the official board website, entering your roll number, selecting exam year, and clicking Search. Most boards also offer SMS services for results." } },
    { "@type": "Question", "name": "How to download date sheets for exams?", "acceptedAnswer": { "@type": "Answer", "text": "You can download date sheets from respective board or university websites. We provide direct download links for all major boards including FBISE, BISE Lahore, BISE Karachi, and universities across Pakistan." } },
    { "@type": "Question", "name": "What are the best scholarships for Pakistani students?", "acceptedAnswer": { "@type": "Answer", "text": "Popular scholarships include HEC Indigenous Scholarship, PEEF Scholarship, Ehsaas Undergraduate Scholarship, Commonwealth Scholarship, and university-specific scholarships for Pakistani students." } },
    { "@type": "Question", "name": "How to find teaching jobs in Pakistan?", "acceptedAnswer": { "@type": "Answer", "text": "You can find teaching jobs through university career portals, job websites, newspaper advertisements, and our dedicated jobs section featuring faculty and administrative positions." } }
  ]
};

// ============ HERO SECTION WRAPPER ============
// Dynamically import HeroSection with no SSR
// Ensure a default export shape for React.lazy in case the component is a named export
const HeroSection = React.lazy(() =>
  import("@/components/ui/HeroSection").then((mod) => {
    const typedMod = mod as {
      HeroSection?: React.ComponentType;
      default?: React.ComponentType;
    };
    return { default: typedMod.HeroSection ?? typedMod.default! };
  })
);

function HeroSectionWrapper() {
  return (
    <Suspense fallback={<div className="h-[600px] bg-gradient-to-br from-blue-700 to-indigo-900 animate-pulse" />}>
      <HeroSection />
    </Suspense>
  );
}

// ============ MAIN PAGE ============
export default async function HomePage() {
  // Fetch dynamic data for schemas
  const [admissionsList, resultsList, dateSheetsList, jobsList, scholarshipsList] = await Promise.all([
    getLatestAdmissionsForSchema(10),
    getLatestResultsForSchema(8),
    getLatestDateSheetsForSchema(6),
    getLatestJobsForSchema(8),
    getLatestScholarshipsForSchema(6)
  ]);

  const admissionsSchema = {
    "@context": "https://schema.org", "@type": "ItemList", "name": "Latest Admissions in Pakistan",
    "description": "We publish latest admissions from all major universities and institutions across Pakistan.",
    "numberOfItems": admissionsList.length, "itemListElement": admissionsList
  };

  const resultsSchema = {
    "@context": "https://schema.org", "@type": "ItemList", "name": "Latest Board & University Results",
    "description": "Check all education board and university results for Matric, Intermediate, BA, BSc, MA, MSc in Pakistan.",
    "numberOfItems": resultsList.length, "itemListElement": resultsList
  };

  const dateSheetsSchema = {
    "@context": "https://schema.org", "@type": "ItemList", "name": "Exam Date Sheets 2026",
    "description": "Download official date sheets for Matric, Intermediate, and University exams across Pakistan.",
    "numberOfItems": dateSheetsList.length, "itemListElement": dateSheetsList
  };

  const jobsSchema = {
    "@context": "https://schema.org", "@type": "ItemList", "name": "Latest Jobs in Pakistan",
    "description": "100s of new jobs are posted every week. Start a career of your dreams and keep yourself updated.",
    "numberOfItems": jobsList.length, "itemListElement": jobsList
  };

  const scholarshipsSchema = {
    "@context": "https://schema.org", "@type": "ItemList", "name": "Scholarships for Pakistani Students",
    "description": "Find fully funded, partial, merit-based, and need-based scholarships for undergraduate, graduate, and PhD programs.",
    "numberOfItems": scholarshipsList.length, "itemListElement": scholarshipsList
  };

  return (
    <>
      {/* All Schema Markups */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(admissionsSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(resultsSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dateSheetsSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobsSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(scholarshipsSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
        
        {/* ✅ Hero Section with Suspense */}
        <HeroSectionWrapper />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* MAIN CONTENT */}
            <main className="lg:w-8/12 space-y-12">
              <OnScrollLoad rootMargin="200px"><AdmissionSection /></OnScrollLoad>
              <OnScrollLoad rootMargin="200px"><ResultsSection /></OnScrollLoad>
              <OnScrollLoad rootMargin="200px"><DateSheetSection /></OnScrollLoad>
              <OnScrollLoad rootMargin="200px"><ScholarshipsSection /></OnScrollLoad>
              <OnScrollLoad rootMargin="200px"><JobsSection /></OnScrollLoad>
            </main>

            {/* SIDEBAR - Immediate load */}
            <aside className="lg:w-4/12 lg:sticky lg:top-6 space-y-8">
              <SidebarWidgets />
            </aside>
            
          </div>
        </div>

      </div>
    </>
  );
}

import React from 'react';