// app/(public)/date-sheets/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { postService } from '@/services/post/post.service';


// ============================================
// INTERFACE DEFINITIONS
// ============================================
interface DateSheetItem {
  id: number;
  slug: string;
  title: string;
  examType: string;
  examDate: Date | null;
  year: number;
  boardName: string | null;
  instituteName: string | null;
  isPopular: boolean;
  viewCount: number;
  officialLink: string | null;
  downloadLink: string | null;
}

interface DateSheetsResult {
  dateSheets: DateSheetItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface StatsResult {
  totalSheets: number;
  popularSheets: number;
  biseSheets: number;
  universitySheets: number;
  totalViews: number;
  availableYears: number[];
}

interface DateSheetFilters {
  board?: string;
  examType?: string;
  year?: string;
  q?: string;
  page?: number;
}

// ============================================
// CONSTANTS
// ============================================
const ITEMS_PER_PAGE = 12;

const BOARD_TYPES = [
  { slug: '', name: 'All Boards', icon: '📋' },
  { slug: 'bise', name: 'BISE Boards', icon: '🏛️' },
  { slug: 'university', name: 'Universities', icon: '🎓' },
];

const EXAM_TYPES = [
  { value: '', label: 'All Exams' },
  { value: 'Annual', label: 'Annual Exams' },
  { value: 'Supplementary', label: 'Supplementary Exams' },
  { value: 'Special', label: 'Special Exams' },
];

export const metadata: Metadata = {
  title: 'Date Sheets 2026 in Pakistan – BISE, FBISE & University Exam Schedules | NextID.pk',
  description: 'Download all 2026 date sheets for BISE boards, FBISE, and universities in Pakistan.',
};

// Helper function
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

async function getDateSheets(filters: DateSheetFilters): Promise<DateSheetsResult> {
  const currentPage = filters.page || 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  
  try {
    let allSheets = await postService.getPostsByType('date_sheet', 1000);
    
    // Filter by search query
    if (filters.q) {
      const query = filters.q.toLowerCase();
      allSheets = allSheets.filter(sheet => 
        sheet.title.toLowerCase().includes(query) ||
        getMetaValue(sheet.meta, 'boardName', '').toLowerCase().includes(query) ||
        getMetaValue(sheet.meta, 'instituteName', '').toLowerCase().includes(query)
      );
    }
    
    // Filter by exam type
    if (filters.examType) {
      allSheets = allSheets.filter(sheet => 
        getMetaValue(sheet.meta, 'examType', 'Annual') === filters.examType
      );
    }
    
    // Filter by year
    if (filters.year) {
      const yearInt = parseInt(filters.year);
      allSheets = allSheets.filter(sheet => 
        getMetaValue(sheet.meta, 'year', new Date().getFullYear()) === yearInt
      );
    }
    
    // Filter by board type
    if (filters.board === 'bise') {
      allSheets = allSheets.filter(sheet => 
        getMetaValue(sheet.meta, 'boardName', null) !== null
      );
    } else if (filters.board === 'university') {
      allSheets = allSheets.filter(sheet => 
        getMetaValue(sheet.meta, 'instituteName', null) !== null
      );
    }
    
    // Transform to DateSheetItem
    const dateSheets: DateSheetItem[] = allSheets.map(sheet => {
      const meta = sheet.meta || {};
      let examDate: Date | null = null;
      const examDateRaw = getMetaValue(meta, 'examDate', null);
      if (examDateRaw && typeof examDateRaw === 'string') {
        try {
          const parsed = new Date(examDateRaw);
          if (!isNaN(parsed.getTime())) examDate = parsed;
        } catch { examDate = null; }
      }
      
      return {
        id: sheet.id,
        slug: sheet.slug,
        title: sheet.title,
        examType: getMetaValue(meta, 'examType', 'Annual'),
        examDate: examDate,
        year: getMetaValue(meta, 'year', new Date().getFullYear()),
        boardName: getMetaValue(meta, 'boardName', null),
        instituteName: getMetaValue(meta, 'instituteName', null),
        isPopular: getMetaValue(meta, 'isPopular', false),
        viewCount: getMetaValue(meta, 'viewCount', 0),
        officialLink: getMetaValue(meta, 'officialLink', null),
        downloadLink: getMetaValue(meta, 'downloadLink', null),
      };
    });
    
    // Sort by popularity and date
    const sortedSheets = dateSheets.sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return b.year - a.year;
    });
    
    const paginatedSheets = sortedSheets.slice(offset, offset + ITEMS_PER_PAGE);
    const totalCount = sortedSheets.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    
    return { dateSheets: paginatedSheets, totalCount, totalPages, currentPage };
  } catch (error) {
    console.error('Failed to fetch date sheets:', error);
    return { dateSheets: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
}

async function getStats(): Promise<StatsResult> {
  try {
    const allSheets = await postService.getPostsByType('date_sheet', 1000);
    
    const totalSheets = allSheets.length;
    const popularSheets = allSheets.filter(s => getMetaValue(s.meta, 'isPopular', false)).length;
    const biseSheets = allSheets.filter(s => getMetaValue(s.meta, 'boardName', null) !== null).length;
    const universitySheets = allSheets.filter(s => getMetaValue(s.meta, 'instituteName', null) !== null).length;
    const totalViews = allSheets.reduce((sum, s) => sum + getMetaValue(s.meta, 'viewCount', 0), 0);
    
    const years = [...new Set(allSheets.map(s => getMetaValue(s.meta, 'year', new Date().getFullYear())))];
    years.sort((a, b) => b - a);
    
    return { totalSheets, popularSheets, biseSheets, universitySheets, totalViews, availableYears: years };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return { totalSheets: 0, popularSheets: 0, biseSheets: 0, universitySheets: 0, totalViews: 0, availableYears: [] };
  }
}

// ============================================
// CLIENT COMPONENTS
// ============================================

function Pagination({ currentPage, totalPages, buildUrl }: { 
  currentPage: number; 
  totalPages: number; 
  filters: DateSheetFilters;
  buildUrl: (key: string, value: string) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
  for (let i = startPage; i <= endPage; i++) pages.push(i);

  return (
    <div className="flex justify-center mt-8">
      <nav className="flex items-center gap-2 flex-wrap">
        {currentPage > 1 && (
          <Link href={buildUrl('page', String(currentPage - 1))} className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
            ← Previous
          </Link>
        )}
        {startPage > 1 && (
          <>
            <Link href={buildUrl('page', '1')} className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">1</Link>
            {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
          </>
        )}
        {pages.map(page => (
          <Link key={page} href={buildUrl('page', String(page))} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${page === currentPage ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            {page}
          </Link>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
            <Link href={buildUrl('page', String(totalPages))} className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">{totalPages}</Link>
          </>
        )}
        {currentPage < totalPages && (
          <Link href={buildUrl('page', String(currentPage + 1))} className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
            Next →
          </Link>
        )}
      </nav>
    </div>
  );
}

function FilterSidebar({ filters, stats, buildUrl }: { filters: DateSheetFilters; stats: StatsResult; buildUrl: (key: string, value: string) => string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-200">
      <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-green-600 rounded-full"></span>
        Filter Date Sheets
      </h2>
      
      <div className="mb-6">
        <form action="/date-sheets" method="GET" className="relative">
          <input type="text" name="q" defaultValue={filters.q} placeholder="Search date sheets..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </form>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Board Type</h3>
        <div className="space-y-1">
          {BOARD_TYPES.map(board => (
            <Link key={board.slug} href={buildUrl('board', board.slug)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${filters.board === board.slug ? 'bg-green-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
              <span>{board.icon}</span>
              <span>{board.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Exam Type</h3>
        <div className="flex flex-wrap gap-2">
          <Link href={buildUrl('type', '')} className={`px-3 py-1.5 rounded-full text-sm transition ${!filters.examType ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>All</Link>
          {EXAM_TYPES.filter(t => t.value).map(type => (
            <Link key={type.value} href={buildUrl('type', type.value)} className={`px-3 py-1.5 rounded-full text-sm transition ${filters.examType === type.value ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{type.label}</Link>
          ))}
        </div>
      </div>

      {stats.availableYears.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Year</h3>
          <div className="flex flex-wrap gap-2">
            <Link href={buildUrl('year', '')} className={`px-3 py-1.5 rounded-full text-sm transition ${!filters.year ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>All</Link>
            {stats.availableYears.map(year => (
              <Link key={year} href={buildUrl('year', year.toString())} className={`px-3 py-1.5 rounded-full text-sm transition ${filters.year === year.toString() ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{year}</Link>
            ))}
          </div>
        </div>
      )}

      {(filters.board || filters.examType || filters.year || filters.q) && (
        <Link href="/date-sheets" className="block text-center text-sm text-green-600 hover:text-green-700 mt-4 pt-3 border-t">Clear all filters</Link>
      )}
    </div>
  );
}

function DateSheetCard({ sheet }: { sheet: DateSheetItem }) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'TBA';
    return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden">
      <div className="p-5">
        {sheet.isPopular && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium mb-2">⭐ Popular</div>
        )}
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          <Link href={`/date-sheets/${sheet.slug}`} className="hover:text-green-600 transition">{sheet.title}</Link>
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
          {sheet.boardName && <span className="text-green-600">{sheet.boardName}</span>}
          {sheet.instituteName && <span className="text-green-600">{sheet.instituteName}</span>}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-2.5">
            <span className="text-gray-500 text-xs">Exam Type</span>
            <div className="font-semibold text-gray-800 text-sm">{sheet.examType}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5">
            <span className="text-gray-500 text-xs">Exam Date</span>
            <div className="font-semibold text-gray-800 text-sm">{formatDate(sheet.examDate)}</div>
          </div>
        </div>
        <Link href={`/date-sheets/${sheet.slug}`} className="inline-block px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm font-medium">View Details →</Link>
      </div>
    </article>
  );
}

function DateSheetsContent({ searchParamsPromise }: { searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // ✅ This component awaits searchParams inside Suspense
  const searchParams = React.use(searchParamsPromise);
  
  const currentPage = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const filters: DateSheetFilters = {
    board: typeof searchParams.board === 'string' ? searchParams.board : '',
    examType: typeof searchParams.type === 'string' ? searchParams.type : '',
    year: typeof searchParams.year === 'string' ? searchParams.year : '',
    q: typeof searchParams.q === 'string' ? searchParams.q : '',
    page: currentPage,
  };

  const [dateSheetsResult, stats] = React.use(Promise.all([
    getDateSheets(filters),
    getStats(),
  ]));

  const buildUrl = (key: string, value: string) => {
    const urlParams = new URLSearchParams();
    if (filters.board && key !== 'board') urlParams.set('board', filters.board);
    if (filters.examType && key !== 'type') urlParams.set('type', filters.examType);
    if (filters.year && key !== 'year') urlParams.set('year', filters.year);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (value) urlParams.set(key, value);
    return urlParams.toString() ? `/date-sheets?${urlParams.toString()}` : '/date-sheets';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="lg:w-80 flex-shrink-0">
        <FilterSidebar filters={filters} stats={stats} buildUrl={buildUrl} />
      </aside>

      <div className="flex-1">
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{dateSheetsResult.totalCount} Date Sheets Found</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {dateSheetsResult.dateSheets.length > 0 ? (
            dateSheetsResult.dateSheets.map((sheet) => <DateSheetCard key={sheet.id} sheet={sheet} />)
          ) : (
            <div className="col-span-2 bg-white rounded-2xl p-16 text-center">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Date Sheets Found</h3>
              <p className="text-gray-500">Try changing your filters to see more results</p>
            </div>
          )}
        </div>

        <Pagination currentPage={dateSheetsResult.currentPage} totalPages={dateSheetsResult.totalPages} filters={filters} buildUrl={buildUrl} />
      </div>
    </div>
  );
}

// Loading fallback
function DateSheetsLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:w-80 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-sm p-5 animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';

// ============ MAIN PAGE ============
export default async function DateSheetsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // ✅ Pass searchParams promise to client component
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-teal-800">
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Date Sheets <span className="text-yellow-300">2026</span>
            </h1>
            <p className="text-xl text-green-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Download exam schedules for Matric, Intermediate &amp; University exams
            </p>
            
            <div className="max-w-2xl mx-auto">
              <form action="/date-sheets" method="GET" className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input type="text" name="q" placeholder="Search by board, university or exam..." className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-lg" />
                </div>
                <button type="submit" className="px-8 py-4 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-300 transition shadow-lg">Search</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Suspense fallback={<DateSheetsLoading />}>
          <DateSheetsContent searchParamsPromise={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}