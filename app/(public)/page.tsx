// app/(public)/page.tsx

import React, { Suspense } from "react";
import OnScrollLoad from "@/components/OnScrollLoad/OnScrollLoad";


// Sections
import AdmissionSection from "@/components/sections/Home/AdmissionSection";
import ResultsSection from "@/components/sections/Home/ResultsSection";
import DateSheetSection from "@/components/sections/Home/DatesheetSection";
import ScholarshipsSection from "@/components/sections/Home/ScholarshipsSection";
import SidebarWidgets from "@/components/sections/Home/SidebarWidgets";
import JobsSection from "@/components/sections/Home/JobsSection";
import NewsSection from "@/components/sections/Home/NewsSection";

// ... rest of your schema functions ...

// ============ NEWS SECTION WRAPPER ============
function NewsSectionWrapper() {
  return (
    <Suspense
      fallback={
        <div className="h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-2xl" />
      }
    >
      <NewsSection /> {/* ✅ Use NewsSection */}
    </Suspense>
  );
}

// ============ MAIN PAGE ============
export default async function HomePage() {
  // ... your schema fetching code ...

  return (
    <>
      {/* Schema Scripts */}

      <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
        {/* ✅ Professional News Section */}
        <NewsSectionWrapper />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* MAIN CONTENT */}
            <main className="lg:w-8/12 space-y-12">
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

            {/* SIDEBAR */}
            

<aside className="lg:w-1/3">
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
