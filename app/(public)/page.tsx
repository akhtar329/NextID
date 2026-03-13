// app/(public)/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import HeroSection from '@/app/component/sections/Home/HeroSection';
import AdmissionSection from '@/app/component/sections/Home/AdmissionSection';
import ResultsSection from '@/app/component/sections/Home/ResultsSection';
import CoursesSection from '@/app/component/sections/Home/CoursesSection';
import UniversitiesSection from '@/app/component/sections/Home/UniversitiesSection';
import SidebarWidgets from '@/app/component/sections/Home/SidebarWidgets';


// ==================== METADATA FOR SEO ====================
export const metadata: Metadata = {
  metadataBase: new URL('https://www.nextid.pk'),
  title: {
    default: 'Pakistan Latest Admissions 2026, Results, Date Sheets & University Updates | NextID.pk',
    template: '%s | NextID.pk'
  },
  description: 'Find latest university admissions 2026, board results, date sheets, and educational news in Pakistan. NUST, FAST, LUMS, Punjab University admissions open. Check merit lists, fee structure, and apply online.',
  keywords: [
    'admissions 2026 pakistan',
    'university admissions pakistan 2026',
    'board results 2026',
    'date sheets 2026',
    'nust admissions 2026',
    'fast admissions 2026',
    'lums admissions 2026',
    'punjab university admissions',
    'karachi university admissions',
    'bs programs pakistan',
    'mba admissions pakistan',
    'ms programs pakistan',
    'medical admissions pakistan 2026',
    'engineering admissions pakistan',
    'education portal pakistan',
    'admission alerts',
    'merit lists 2026',
    'entry test preparation',
    'scholarship 2026 pakistan'
  ].join(', '),
  
  authors: [{ name: 'NextID.pk', url: 'https://www.nextid.pk' }],
  creator: 'NextID.pk',
  publisher: 'NextID.pk',
  
  openGraph: {
    title: 'Pakistan Latest Admissions 2026, Results & University Updates | NextID.pk',
    description: 'Find latest university admissions 2026, board results, date sheets, and educational news in Pakistan. Apply online for NUST, FAST, LUMS admissions.',
    url: 'https://www.nextid.pk',
    siteName: 'NextID.pk',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NextID.pk - Pakistan Education Portal',
      },
    ],
    locale: 'en_PK',
    type: 'website',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Pakistan Latest Admissions 2026, Results & University Updates | NextID.pk',
    description: 'Find latest university admissions 2026, board results, date sheets, and educational news in Pakistan.',
    images: ['/twitter-image.jpg'],
    creator: '@nextidpk',
    site: '@nextidpk',
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': 160,
      'max-video-preview': -1,
    },
  },
  
  alternates: {
    canonical: 'https://www.nextid.pk',
  },
  
  category: 'education',
  
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification',
  },
};

// ==================== SCHEMA MARKUP ====================
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "NextID.pk",
  "url": "https://www.nextid.pk",
  "description": "Pakistan's #1 education portal for admissions, results, date sheets, and degree programs.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.nextid.pk/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "NextID.pk",
  "url": "https://www.nextid.pk",
  "logo": "https://www.nextid.pk/logo.png",
  "sameAs": [
    "https://www.facebook.com/nextidpk",
    "https://twitter.com/nextidpk",
    "https://www.instagram.com/nextidpk"
  ],
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "PK"
  }
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.nextid.pk"
    }
  ]
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
      
      {/* Hidden H1 for SEO - Using Tailwind's sr-only */}
      <h1 className="sr-only">
        NextID.pk - Pakistan's Largest Education Portal for Admissions 2026, Results, Date Sheets and Degree Programs
      </h1>
      
      {/* Main Content */}
      <div className="min-h-screen bg-gray-50">
        <HeroSection />
        
        <div className="max-w-7xl mx-auto px-4">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="py-4">
            <ol className="flex text-sm text-gray-600">
              <li className="flex items-center">
                <Link href="/" className="hover:text-blue-600">Home</Link>
              </li>
            </ol>
          </nav>
          
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Main Content */}
            <main className="lg:w-8/12">
              <section className="mb-12">
                <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded-xl"></div>}>
                  <AdmissionSection />
                </Suspense>
              </section>
              <section className="mb-12">
                <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded-xl"></div>}>
                  <ResultsSection />
                </Suspense>
              </section>
              <section className="mb-12">
                <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded-xl"></div>}>
                  <CoursesSection />
                </Suspense>
              </section>
              <section className="mb-12">
                <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded-xl"></div>}>
                  <UniversitiesSection />
                </Suspense>
              </section>
            </main>
            
            {/* Sidebar */}
            <aside className="lg:w-4/12 space-y-8 lg:sticky lg:top-6" aria-label="Quick Links">
              <Suspense fallback={<div className="animate-pulse h-[600px] bg-gray-200 rounded-xl"></div>}>
                <SidebarWidgets />
              </Suspense>
            </aside>
          </div>
        </div>
        
        {/* SEO Content Section - For Better Ranking */}
        <section className="bg-white py-8 border-t border-gray-200 mt-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="prose prose-blue max-w-none text-gray-600 text-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                Pakistan Education Portal - Admissions 2026, Results, Date Sheets
              </h2>
              <p className="mb-2">
                <strong>NextID.pk</strong> is Pakistan's premier education portal providing latest updates on 
                <strong> admissions 2026</strong> in top universities including 
                <Link href="/universities/nust" className="text-blue-600 hover:underline mx-1">NUST</Link>,
                <Link href="/universities/fast-nuces" className="text-blue-600 hover:underline mx-1">FAST</Link>,
                <Link href="/universities/lums" className="text-blue-600 hover:underline mx-1">LUMS</Link>,
                <Link href="/universities/punjab-university" className="text-blue-600 hover:underline mx-1">Punjab University</Link>, and
                <Link href="/universities/karachi-university" className="text-blue-600 hover:underline mx-1">Karachi University</Link>. 
                Find complete information about <strong>BS programs</strong>, <strong>MBA admissions</strong>, 
                <strong>MS programs</strong>, <strong>medical admissions</strong>, and <strong>engineering admissions</strong>.
              </p>
              <p>
                Check <strong>board results 2026</strong> for FBISE, BISE Lahore, BISE Karachi, BISE Rawalpindi, 
                and all other boards. Download <strong>date sheets 2026</strong> for annual and supplementary examinations. 
                Get <strong>merit lists</strong>, <strong>fee structures</strong>, and <strong>entry test schedules</strong> 
                for all major universities. Stay updated with latest <strong>education news</strong> and 
                <strong>scholarship opportunities</strong> in Pakistan.
              </p>
            </div>
          </div>
        </section>
      </div>
    
    </>
  );
}