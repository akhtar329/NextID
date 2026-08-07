// app/(public)/results/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { postService } from '@/services/post/post.service';
import type { ExtendedPost } from '@/services/post/post.service';
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  Search,
  ChevronRight,
  Award,
  Twitter,
  Facebook,
  Linkedin,
  Mail
} from 'lucide-react';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';
import { generateJsonLd } from '@/lib/seo';
import { cacheTag, cacheLife } from 'next/cache';

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
  featuredImage: string | null;
}

interface Filters {
  board?: string;
  year?: string;
  level?: string;
  q?: string;
  page?: number;
}

interface PaginatedResponse {
  results: ResultItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface Stats {
  totalResults: number;
  totalBoards: number;
  totalUniversities: number;
  recentResults: number;
  years: number[];
}

// ============ CONSTANTS ============
const ITEMS_PER_PAGE = 10;
const CURRENT_YEAR = '2026';
const REFERENCE_DATE = new Date('2024-01-01T00:00:00.000Z');

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

// ✅ FIXED: Static date with reference
function formatDateStatic(date: Date | null): string {
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

// ============ SHARE BUTTONS ============
function ShareButtons({ title, url }: { title: string; url: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  
  return (
    <div className="flex gap-2">
      <a href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer nofollow"
        className="w-8 h-8 bg-black hover:bg-gray-800 text-white rounded-lg flex items-center justify-center transition">
        <Twitter className="w-4 h-4" />
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer nofollow"
        className="w-8 h-8 bg-blue-700 hover:bg-blue-800 text-white rounded-lg flex items-center justify-center transition">
        <Facebook className="w-4 h-4" />
      </a>
      <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer nofollow"
        className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition">
        <Linkedin className="w-4 h-4" />
      </a>
      <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
        className="w-8 h-8 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center transition">
        <Mail className="w-4 h-4" />
      </a>
    </div>
  );
}

// ============ CACHED PAGINATED DATA FETCHING ============
async function getAllResults(): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("results-all");
  cacheTag("posts-type-result");
  cacheLife("hours");
  
  try {
    const results = await postService.getList('result', 1000);
    return results || [];
  } catch (error) {
    console.error('Error fetching all results:', error);
    return [];
  }
}

async function getPaginatedResults(filters: Filters): Promise<PaginatedResponse> {
  "use cache";
  
  const cacheKey = `results-${filters.page || 1}-${filters.board || 'all'}-${filters.year || 'all'}-${filters.level || 'all'}-${filters.q || 'all'}`;
  cacheTag(cacheKey);
  cacheTag("posts-type-result");
  cacheLife("hours");
  
  const currentPage = filters.page || 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  
  try {
    let allResults = await getAllResults();
    
    let resultsList: ResultItem[] = allResults.map((post: ExtendedPost) => {
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
        year: getMetaValue(meta, 'year', parseInt(CURRENT_YEAR)),
        resultDate: resultDate,
        boardName: getMetaValue(meta, 'boardName', null),
        boardSlug: getMetaValue(meta, 'boardSlug', null),
        instituteName: getMetaValue(meta, 'universityName', getMetaValue(meta, 'instituteName', null)),
        instituteSlug: getMetaValue(meta, 'universitySlug', getMetaValue(meta, 'instituteSlug', null)),
        cityName: getMetaValue(meta, 'cityName', null),
        isPopular: getMetaValue(meta, 'isPopular', false),
        viewCount: getMetaValue(meta, 'viewCount', 0),
        featuredImage: post.featuredImage || null,
      };
    });
    
    // Sort by year (newest first)
    resultsList.sort((a, b) => b.year - a.year);
    
    // Apply filters
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
    
    const totalCount = resultsList.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const paginatedResults = resultsList.slice(offset, offset + ITEMS_PER_PAGE);
    
    return {
      results: paginatedResults,
      totalCount,
      totalPages,
      currentPage,
    };
  } catch (error) {
    console.error('Error fetching paginated results:', error);
    return {
      results: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }
}

// ============ STATS ============
async function getStats(): Promise<Stats> {
  "use cache";
  cacheTag("results-stats");
  cacheTag("posts-type-result");
  cacheLife("hours");
  
  try {
    const allResults = await getAllResults();
    const totalResults = allResults.length;
    
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
      recentResults: Math.min(totalResults, 10),
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
}

// ============ METADATA ============
export async function generateMetadata(): Promise<Metadata> {
  const allResults = await getAllResults();
  const totalResults = allResults.length;
  const currentYear = CURRENT_YEAR;
  
  return {
    title: `Exam Results ${currentYear} Pakistan | ${totalResults}+ Board & University Results | NextID.pk`,
    description: `Check ${totalResults}+ board and university results ${currentYear} in Pakistan. BISE Lahore, Karachi, Islamabad, FBISE results. Matric, Intermediate, BA, BSc, MA, MSc results.`,
    keywords: `exam results ${currentYear}, board results ${currentYear}, matric results, intermediate results`,
    robots: 'index, follow', // ✅ ADDED
    alternates: {
      canonical: 'https://www.nextid.pk/results',
      languages: { // ✅ ADDED
        'en-US': 'https://www.nextid.pk/results',
      },
    },
    publisher: 'NextID.pk', // ✅ ADDED
    authors: [{ name: 'NextID.pk' }], // ✅ ADDED
    openGraph: {
      title: `Exam Results ${currentYear} Pakistan - Board & University Results | NextID.pk`,
      description: `Check ${totalResults}+ board and university results for Matric, Intermediate, BA, BSc, MA, MSc.`,
      url: 'https://www.nextid.pk/results',
      siteName: 'NextID.pk',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Exam Results Pakistan' }],
      locale: 'en_PK',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Exam Results ${currentYear} Pakistan`,
      description: `Check the latest board and university results for ${currentYear}.`,
      images: ['/og-image.png'],
      site: '@nextidpk',
      creator: '@nextidpk',
    },
  };
}

// ============ PAGINATION COMPONENT ============
function Pagination({ currentPage, totalPages, baseUrl, filters }: { 
  currentPage: number; 
  totalPages: number; 
  baseUrl: string;
  filters: Filters;
}) {
  if (totalPages <= 1) return null;
  
  const buildPageUrl = (page: number): string => {
    const urlParams = new URLSearchParams();
    if (filters.board && filters.board !== 'all') urlParams.set('board', filters.board);
    if (filters.year && filters.year !== 'all') urlParams.set('year', filters.year);
    if (filters.level && filters.level !== '') urlParams.set('level', filters.level);
    if (filters.q) urlParams.set('q', filters.q);
    if (page > 1) urlParams.set('page', page.toString());
    return urlParams.toString() ? `${baseUrl}?${urlParams.toString()}` : baseUrl;
  };
  
  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return (
    <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
      <Link
        href={buildPageUrl(currentPage - 1)}
        className={`px-3 py-2 rounded-lg border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
      >
        Previous
      </Link>
      
      {startPage > 1 && (
        <>
          <Link href={buildPageUrl(1)} className="px-3 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50">1</Link>
          {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
        </>
      )}
      
      {pages.map(page => (
        <Link
          key={page}
          href={buildPageUrl(page)}
          className={`px-3 py-2 rounded-lg border ${currentPage === page ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          {page}
        </Link>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
          <Link href={buildPageUrl(totalPages)} className="px-3 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50">
            {totalPages}
          </Link>
        </>
      )}
      
      <Link
        href={buildPageUrl(currentPage + 1)}
        className={`px-3 py-2 rounded-lg border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
      >
        Next
      </Link>
    </div>
  );
}

// ============ STATS CARDS ============
function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.totalResults}</div>
        <div className="text-xs text-gray-500">Total Results</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.totalBoards}</div>
        <div className="text-xs text-gray-500">Boards</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.totalUniversities}</div>
        <div className="text-xs text-gray-500">Universities</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.recentResults}</div>
        <div className="text-xs text-gray-500">Recent Results</div>
      </div>
    </div>
  );
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
    board: typeof params.board === 'string' ? params.board : undefined,
    year: typeof params.year === 'string' ? params.year : undefined,
    level: typeof params.level === 'string' ? params.level : undefined,
    q: typeof params.q === 'string' ? params.q : undefined,
    page: typeof params.page === 'string' ? parseInt(params.page) : 1,
  };

  const { results, totalCount, totalPages, currentPage } = await getPaginatedResults(filters);
  const stats = await getStats();

  const buildUrl = (key: string, value: string): string => {
    const urlParams = new URLSearchParams();
    if (filters.board && filters.board !== 'all' && key !== 'board') urlParams.set('board', filters.board);
    if (filters.year && filters.year !== 'all' && key !== 'year') urlParams.set('year', filters.year);
    if (filters.level && filters.level !== '' && key !== 'level') urlParams.set('level', filters.level);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (value) urlParams.set(key, value);
    if (currentPage !== 1 && key !== 'page') urlParams.set('page', currentPage.toString());
    return urlParams.toString() ? `/results?${urlParams.toString()}` : '/results';
  };

  const currentYear = CURRENT_YEAR;
  const shareUrl = 'https://www.nextid.pk/results';
  const shareTitle = `Exam Results ${currentYear} - Board & University Results Pakistan`;
  
  const jsonLd = generateJsonLd({
    type: 'WebPage',
    title: `Exam Results ${currentYear} - Board & University Results Pakistan`,
    description: `Find ${totalCount} exam results for boards and universities in Pakistan`,
    url: 'https://www.nextid.pk/results',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Results', url: '/results' },
    ],
  });
  
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Exam Results ${currentYear} - Pakistan`,
    "description": `List of ${totalCount} exam results`,
    "numberOfItems": totalCount,
    "url": "https://www.nextid.pk/results",
    "itemListElement": results.slice(0, 10).map((result, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.nextid.pk/results/${result.slug}`,
      "name": result.title
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      
      {/* ✅ Breadcrumbs UI */}
      <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-green-600 transition">Home</Link>
        <span>›</span>
        <span className="text-gray-700 font-medium">Results</span>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR - Filters */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-100">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-teal-500 rounded-full"></div>
              Filter Results
            </h2>
            
            <div className="mb-6">
              <form action="/results" method="GET" className="relative">
                <input 
                  type="text" 
                  name="q" 
                  defaultValue={filters.q || ''} 
                  placeholder="Search results..." 
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
            </div>

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
          
          {/* ✅ Stats Cards */}
          <StatsCards stats={stats} />
          
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                Showing {results.length} of {totalCount} Results
              </h2>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Page {currentPage} of {totalPages}</span>
              </div>
            </div>
          </div>

          {/* ✅ Share Buttons */}
          <div className="bg-white rounded-xl shadow-sm p-3 mb-4 border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-gray-500 font-medium">Share this page:</span>
              <ShareButtons title={shareTitle} url={shareUrl} />
            </div>
          </div>

          <div className="space-y-4">
            {results.length > 0 ? (
              results.map((r) => {
                const institutionName = r.boardName || r.instituteName || 'Education Board';
                return (
                  <article key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all overflow-hidden group">
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            {/* ✅ Image with Fallback */}
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-green-100 to-teal-100">
                              {r.featuredImage ? (
                                <Image
                                  src={r.featuredImage}
                                  alt={r.title}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-green-600" />
                                </div>
                              )}
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
                                    {formatDateStatic(r.resultDate)}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">Year: {r.year}</span>
                                <span className="flex items-center gap-1">👁️ {r.viewCount.toLocaleString()} views</span>
                                {r.isPopular && (
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> Popular
                                  </span>
                                )}
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
          
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            baseUrl="/results" 
            filters={filters}
          />
        </div>
        
        {/* RIGHT SIDEBAR */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <Suspense fallback={<div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-64"></div>}>
              <SidebarWidgets />
            </Suspense>
          </div>
        </aside>
        
      </div>
    </>
  );
}

// ============ MAIN PAGE ============
export default async function ResultsPage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const currentYear = CURRENT_YEAR;
  
  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* ✅ Breadcrumbs UI */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-green-600 transition">Home</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">Results</span>
        </nav>
      </div>
      
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
