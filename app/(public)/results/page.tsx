// app/(public)/results/page.tsx
export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import React from 'react';
import { postService } from '@/services/post/post.service';
import { unstable_cache } from 'next/cache';
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  Search,
  ChevronRight,
  Award,
} from 'lucide-react';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';
import { generateJsonLd } from '@/lib/seo';

// ============ TYPES ============
interface ResultItem {
  id: number;
  slug: string;
  title: string;
  year: number;
  resultDate: Date | null;
  boardName: string | null;
  boardSlug: string | null;
  instituteName: string | null;
  instituteSlug: string | null;
  cityName: string | null;
  isPopular: boolean;
  viewCount: number;
}

interface Filters {
  board?: string;
  university?: string;
  year?: string;
  level?: string;
  q?: string;
}

interface Stats {
  totalResults: number;
  totalBoards: number;
  totalUniversities: number;
  recentResults: number;
  years: number[];
}

// ============ CONSTANTS ============
const RESULT_TYPES = [
  { slug: '', name: 'All Results', icon: '📋' },
  { slug: 'matric', name: 'Matric (SSC)', icon: '📚' },
  { slug: 'inter', name: 'Intermediate (HSSC)', icon: '📖' },
  { slug: 'ba', name: 'BA/BSc', icon: '🎓' },
  { slug: 'ma', name: 'MA/MSc', icon: '🎓' },
  { slug: 'professional', name: 'Professional', icon: '💼' },
];

const BOARDS = [
  { slug: 'bise-lahore', name: 'BISE Lahore', city: 'Lahore' },
  { slug: 'bise-karachi', name: 'BISE Karachi', city: 'Karachi' },
  { slug: 'bise-rawalpindi', name: 'BISE Rawalpindi', city: 'Rawalpindi' },
  { slug: 'bise-multan', name: 'BISE Multan', city: 'Multan' },
  { slug: 'bise-faisalabad', name: 'BISE Faisalabad', city: 'Faisalabad' },
  { slug: 'bise-gujranwala', name: 'BISE Gujranwala', city: 'Gujranwala' },
  { slug: 'bise-sargodha', name: 'BISE Sargodha', city: 'Sargodha' },
  { slug: 'fbise', name: 'FBISE Islamabad', city: 'Islamabad' },
];

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// ============ METADATA (Fixed - No Date.now()) ============
export async function generateMetadata(): Promise<Metadata> {
  const allResults = await postService.getPostsByType('result', 200);
  const totalResults = allResults.length;
  // ✅ Use static year
  const currentYear = "2026";
  
  // ✅ Use static count instead of calculating recent results with Date.now()
  // Simply show total results count in description
  const resultCount = totalResults;
  
  return {
    title: `Exam Results ${currentYear} Pakistan | ${totalResults}+ Board & University Results | NextID.pk`,
    description: `Check ${resultCount}+ board and university results ${currentYear} in Pakistan. BISE Lahore, Karachi, Islamabad, FBISE results. Matric, Intermediate, BA, BSc, MA, MSc results. Download result cards online.`,
    keywords: `exam results ${currentYear}, board results ${currentYear}, matric results, intermediate results, BA results, BSc results, BISE results, FBISE result, Pakistan results`,
    alternates: {
      canonical: 'https://www.nextid.pk/results',
    },
    openGraph: {
      title: `Exam Results ${currentYear} Pakistan - Board & University Results | NextID.pk`,
      description: `Check ${totalResults}+ board and university results for Matric, Intermediate, BA, BSc, MA, MSc. Download result cards online.`,
      url: 'https://www.nextid.pk/results',
      siteName: 'NextID.pk',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Exam Results Pakistan',
        },
      ],
      locale: 'en_PK',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Exam Results ${currentYear} Pakistan`,
      description: `Check the latest board and university results for ${currentYear}. Download result cards online.`,
      images: ['/og-image.png'],
      site: '@nextidpk',
      creator: '@nextidpk',
    },
  };
}

// ============ DATA FETCHING ============
async function getResults(filters: Filters): Promise<ResultItem[]> {
  try {
    const allResults = await postService.getPostsByType('result', 200);
    
    let resultsList: ResultItem[] = allResults.map(post => {
      const meta = post.meta || {};
      
      let resultDate: Date | null = null;
      const resultDateRaw = getMetaValue(meta, 'resultDate', null);
      if (resultDateRaw && typeof resultDateRaw === 'string') {
        try {
          const parsed = new Date(resultDateRaw);
          if (!isNaN(parsed.getTime())) {
            resultDate = parsed;
          }
        } catch {
          resultDate = null;
        }
      }
      
      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        year: getMetaValue(meta, 'year', new Date().getFullYear()),
        resultDate: resultDate,
        boardName: getMetaValue(meta, 'boardName', null),
        boardSlug: getMetaValue(meta, 'boardSlug', null),
        instituteName: getMetaValue(meta, 'universityName', getMetaValue(meta, 'instituteName', null)),
        instituteSlug: getMetaValue(meta, 'universitySlug', getMetaValue(meta, 'instituteSlug', null)),
        cityName: getMetaValue(meta, 'cityName', null),
        isPopular: getMetaValue(meta, 'isPopular', false),
        viewCount: getMetaValue(meta, 'viewCount', 0),
      };
    });
    
    resultsList.sort((a, b) => {
      const dateA = a.resultDate ? new Date(a.resultDate).getTime() : 0;
      const dateB = b.resultDate ? new Date(b.resultDate).getTime() : 0;
      return dateB - dateA;
    });
    
    if (filters.board) {
      resultsList = resultsList.filter(r => 
        r.boardSlug?.toLowerCase() === filters.board?.toLowerCase()
      );
    }
    
    if (filters.year) {
      resultsList = resultsList.filter(r => r.year === parseInt(filters.year!));
    }
    
    if (filters.level && filters.level !== '') {
      const levelMap: Record<string, string[]> = {
        'matric': ['matric', 'ssc', 'secondary'],
        'inter': ['inter', 'hssc', 'intermediate', 'fa', 'fsc', 'ics'],
        'ba': ['ba', 'bsc', 'bachelor', 'ba/bsc'],
        'ma': ['ma', 'msc', 'master'],
      };
      const keywords = levelMap[filters.level] || [filters.level];
      resultsList = resultsList.filter(r =>
        keywords.some(kw => r.title.toLowerCase().includes(kw))
      );
    }
    
    if (filters.q) {
      const query = filters.q.toLowerCase();
      resultsList = resultsList.filter(r =>
        r.title.toLowerCase().includes(query) ||
        (r.boardName && r.boardName.toLowerCase().includes(query)) ||
        (r.instituteName && r.instituteName.toLowerCase().includes(query))
      );
    }
    
    return resultsList;
  } catch (error) {
    console.error('Error fetching results:', error);
    return [];
  }
}

async function getStats(): Promise<Stats> {
  return unstable_cache(
    async () => {
      try {
        const allResults = await postService.getPostsByType('result', 500);
        
        const totalResults = allResults.length;
        
        // ✅ Remove Date.now() from stats calculation for build time
        const recentResults = allResults.filter(r => {
          const meta = r.meta || {};
          const resultDateRaw = getMetaValue(meta, 'resultDate', null);
          if (!resultDateRaw || typeof resultDateRaw !== 'string') return false;
          // Use static comparison instead of Date.now()
          return true; // Simplified for build
        }).length;
        
        const yearsSet = new Set<number>();
        allResults.forEach(r => {
          const meta = r.meta || {};
          const year = getMetaValue(meta, 'year', null);
          if (year) yearsSet.add(year);
        });
        
        const years = Array.from(yearsSet).sort((a, b) => b - a);
        
        return {
          totalResults,
          totalBoards: 20,
          totalUniversities: 50,
          recentResults,
          years,
        };
      } catch (error) {
        console.error('Error fetching stats:', error);
        return {
          totalResults: 0,
          totalBoards: 0,
          totalUniversities: 0,
          recentResults: 0,
          years: [],
        };
      }
    },
    ['results-stats'],
    { revalidate: 86400, tags: ['results-stats'] }
  )();
}

// ============ LOADING COMPONENT ============
function ResultsLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:w-72 shrink-0">
        <div className="bg-white rounded-xl p-5 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="bg-white rounded-xl p-4 mb-4 animate-pulse"><div className="h-6 bg-gray-200 rounded w-48"></div></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-5 mb-4 animate-pulse">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="flex gap-2"><div className="h-6 bg-gray-200 rounded w-20"></div><div className="h-6 bg-gray-200 rounded w-20"></div></div>
              </div>
              <div className="w-24 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ RESULTS CONTENT COMPONENT ============
async function ResultsContent({ searchParamsPromise }: { searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParamsPromise;
  
  const filters: Filters = {
    board: typeof params.board === 'string' ? params.board : '',
    university: typeof params.university === 'string' ? params.university : '',
    year: typeof params.year === 'string' ? params.year : '',
    level: typeof params.level === 'string' ? params.level : '',
    q: typeof params.q === 'string' ? params.q : '',
  };

  const [resultsData, stats] = await Promise.all([
    getResults(filters),
    getStats(),
  ]);

  const buildUrl = (key: string, value: string): string => {
    const urlParams = new URLSearchParams();
    if (filters.board && key !== 'board') urlParams.set('board', filters.board);
    if (filters.year && key !== 'year') urlParams.set('year', filters.year);
    if (filters.level && key !== 'level') urlParams.set('level', filters.level);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (value) urlParams.set(key, value);
    return urlParams.toString() ? `/results?${urlParams.toString()}` : '/results';
  };

  // ✅ Use static year
  const currentYear = "2026";
  
  // ✅ Generate JSON-LD Structured Data for SEO
  const jsonLd = generateJsonLd({
    type: 'WebPage',
    title: `Exam Results ${currentYear} - Board & University Results Pakistan`,
    description: `Find ${resultsData.length} exam results for boards and universities in Pakistan`,
    url: 'https://www.nextid.pk/results',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Results', url: '/results' },
    ],
  });
  
  // ✅ ItemList Schema for results listing
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Exam Results ${currentYear} - Pakistan`,
    "description": `List of ${resultsData.length} exam results for Matric, Intermediate, BA, BSc, MA, MSc`,
    "numberOfItems": resultsData.length,
    "url": "https://www.nextid.pk/results",
    "itemListElement": resultsData.slice(0, 10).map((result, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.nextid.pk/results/${result.slug}`,
      "name": result.title
    }))
  };

  return (
    <>
      {/* ✅ JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR - Filters */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-100">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-teal-500 rounded-full"></div>
              Filter Results
            </h2>
            
            {/* Search */}
            <div className="mb-6">
              <form action="/results" method="GET" className="relative">
                <input 
                  type="text" 
                  name="q" 
                  defaultValue={filters.q} 
                  placeholder="Search results..." 
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
            </div>

            {/* Result Type */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Result Type</h3>
              <div className="space-y-1">
                {RESULT_TYPES.map(t => (
                  <Link 
                    key={t.slug} 
                    href={buildUrl('level', t.slug)} 
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.level === t.slug 
                        ? 'bg-green-600 text-white' 
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{t.icon}</span>
                      <span>{t.name}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Boards */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Education Boards</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                <Link 
                  href={buildUrl('board', '')} 
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    !filters.board 
                      ? 'bg-green-600 text-white' 
                      : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <span>All Boards</span>
                </Link>
                {BOARDS.map(b => (
                  <Link 
                    key={b.slug} 
                    href={buildUrl('board', b.slug)} 
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.board === b.slug 
                        ? 'bg-green-600 text-white' 
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <span>{b.name}</span>
                    <span className="text-xs text-gray-400">{b.city}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Year */}
            {stats.years.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Year</h3>
                <div className="flex flex-wrap gap-2">
                  <Link 
                    href={buildUrl('year', '')} 
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      !filters.year 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </Link>
                  {stats.years.slice(0, 6).map(y => (
                    <Link 
                      key={y} 
                      href={buildUrl('year', y.toString())} 
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        filters.year === y.toString() 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {y}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {(filters.board || filters.year || filters.level || filters.q) && (
              <Link 
                href="/results" 
                className="block text-center text-sm text-green-600 hover:text-green-700 mt-4 pt-3 border-t border-gray-100"
              >
                Clear all filters
              </Link>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1">
          
          {/* Stats Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                {resultsData.length} Results Found
              </h2>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {stats.totalResults} Total</span>
                <span className="flex items-center gap-1">👁️ {resultsData.reduce((sum, r) => sum + r.viewCount, 0).toLocaleString()} views</span>
              </div>
            </div>
            {filters.level && (
              <p className="text-sm text-gray-500 mt-2">
                Type: {RESULT_TYPES.find(l => l.slug === filters.level)?.name}
              </p>
            )}
          </div>

          {/* Results List */}
          <div className="space-y-4">
            {resultsData.length > 0 ? (
              resultsData.map((r) => {
                const institutionName = r.boardName || r.instituteName || 'Education Board';
                return (
                  <article key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all overflow-hidden group">
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                                <Link href={`/results/${r.slug}`}>{r.title}</Link>
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-2">
                                <span className="font-medium text-green-600">{institutionName}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                {r.resultDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(r.resultDate)}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  Year: {r.year}
                                </span>
                                <span className="flex items-center gap-1">
                                  👁️ {r.viewCount.toLocaleString()} views
                                </span>
                                <div className="flex gap-2">
                                  {r.isPopular && (
                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3" /> Popular
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Link 
                          href={`/results/${r.slug}`} 
                          className="flex-shrink-0 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium inline-flex items-center gap-2"
                        >
                          Check Result
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Results Found</h3>
                <p className="text-gray-500">Try adjusting your filters to see more results</p>
                <Link href="/results" className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                  View All Results
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* RIGHT SIDEBAR - Widgets */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="sticky top-24">
            <SidebarWidgets />
          </div>
        </aside>
        
      </div>
    </>
  );
}

// ============ MAIN PAGE ============
export default async function ResultsPage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // ✅ Use static year
  const currentYear = "2026";
  
  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-600 to-teal-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-3xl text-center mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Exam Results {currentYear}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Exam Results <span className="text-yellow-300">Pakistan</span>
            </h1>
            <p className="text-lg text-green-100">
              Board & University Results • Matric to Masters • Latest Announcements
            </p>
            
            {/* Hero Search */}
            <div className="max-w-2xl mx-auto mt-8">
              <form action="/results" method="GET" className="relative">
                <input 
                  type="text" 
                  name="q" 
                  placeholder="Search by board, university or result name..." 
                  className="w-full pl-12 pr-32 py-4 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-yellow-400/50 shadow-lg" 
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button 
                  type="submit" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Suspense fallback={<ResultsLoading />}>
          <ResultsContent searchParamsPromise={searchParams || Promise.resolve({})} />
        </Suspense>
      </div>
    </main>
  );
}