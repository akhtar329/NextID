// app/(public)/date-sheets/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { dateSheets, boards, institutes, cities, seoMetadata } from '@/app/lib/schema';
import { eq, desc, like, and, or, sql } from 'drizzle-orm';
import { generateSEO } from '@/app/lib/seo';

// ==================== TYPES ====================
type BoardType = 'bise' | 'fbise' | 'university';

type DateSheetWithDetails = {
  id: number;
  title: string;
  slug: string;
  examType: string;
  examDate: Date | null;
  year: number;
  boardId: number | null;
  instituteId: number | null;
  viewCount: number;
  isPopular: boolean;
  officialLink: string | null;
  downloadLink: string | null;
  boardName: string | null;
  boardSlug: string | null;
  instituteName: string | null;
  instituteSlug: string | null;
  cityId: number | null;
  cityName: string | null;
  citySlug: string | null;
};

// ==================== CONSTANTS ====================
const ITEMS_PER_PAGE = 12;

const BOARD_TYPES = [
  { slug: '', name: 'All Boards', icon: '📋', description: 'All educational boards in Pakistan' },
  { slug: 'bise', name: 'BISE Boards', icon: '🏛️', description: 'All BISE boards across Pakistan' },
  { slug: 'fbise', name: 'FBISE', icon: '⭐', description: 'Federal Board of Intermediate and Secondary Education' },
  { slug: 'university', name: 'Universities', icon: '🎓', description: 'University date sheets' },
];

const EXAM_TYPES = [
  { value: '', label: 'All Exams' },
  { value: 'Annual', label: 'Annual Exams' },
  { value: 'Supplementary', label: 'Supplementary Exams' },
  { value: 'Special', label: 'Special Exams' },
  { value: 'Mid Term', label: 'Mid Term Exams' },
  { value: 'Final Term', label: 'Final Term Exams' },
];

// ==================== METADATA ====================
export async function generateMetadata(): Promise<Metadata> {
  return generateSEO({
    entityType: 'page',
    entityId: 1,
    path: '/date-sheets',

    title: 'All Date Sheets 2026 in Pakistan – BISE, FBISE & University Exam Schedules | NextID.pk',

    description:
      'Download all 2026 date sheets for BISE boards, FBISE, and universities in Pakistan. Check exam schedules, subject-wise dates, and official notifications.',

    image: '/images/og-date-sheets.jpg',

    alternates: {
      canonical: 'https://www.nextid.pk/date-sheets',
    },

    openGraph: {
      title: 'All Date Sheets 2026 in Pakistan – Download Exam Schedules',
      description: 'Download date sheets for Matric, Intermediate, and university exams 2026.',
      url: 'https://www.nextid.pk/date-sheets',
      siteName: 'NextID.pk',
      images: [
        {
          url: 'https://www.nextid.pk/images/og-date-sheets.jpg',
          width: 1200,
          height: 630,
          alt: 'Date Sheets 2026 Pakistan',
        },
      ],
      locale: 'en_PK',
      type: 'website',
    },

    twitter: {
      card: 'summary_large_image',
      title: 'All Date Sheets 2026 in Pakistan – Download Now',
      description: 'Download BISE, FBISE and university exam schedules 2026.',
      images: ['https://www.nextid.pk/images/og-date-sheets.jpg'],
    },
  });
}

// ==================== DATA FETCHING ====================
async function getDateSheets(filters: {
  board?: string;
  examType?: string;
  year?: string;
  q?: string;
  page?: number;
}) {
  try {
    const currentPage = filters.page || 1;
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    
    const conditions: any[] = [];
    conditions.push(eq(dateSheets.status, true));

    if (filters.examType && filters.examType !== '') {
      conditions.push(eq(dateSheets.examType, filters.examType));
    }

    if (filters.year && filters.year !== '') {
      conditions.push(eq(dateSheets.year, parseInt(filters.year)));
    }

    if (filters.q) {
      const words = filters.q.trim().split(/\s+/);
      const searchConditions = words.flatMap(word => {
        const term = `%${word}%`;
        return [
          like(dateSheets.title, term),
          like(boards.name, term),
          like(institutes.name, term),
        ];
      });
      conditions.push(or(...searchConditions));
    }

    // Board type filter
    if (filters.board === 'bise') {
      conditions.push(sql`${dateSheets.boardId} IS NOT NULL`);
    } else if (filters.board === 'fbise') {
      conditions.push(eq(boards.name, 'Federal Board of Intermediate and Secondary Education'));
    } else if (filters.board === 'university') {
      conditions.push(sql`${dateSheets.instituteId} IS NOT NULL`);
    }

    const whereClause = and(...conditions);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(distinct ${dateSheets.id})` })
      .from(dateSheets)
      .leftJoin(boards, eq(dateSheets.boardId, boards.id))
      .leftJoin(institutes, eq(dateSheets.instituteId, institutes.id))
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count) || 0;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const dateSheetsList = await db
      .select({
        id: dateSheets.id,
        title: dateSheets.title,
        slug: dateSheets.slug,
        examType: dateSheets.examType,
        examDate: dateSheets.examDate,
        year: dateSheets.year,
        boardId: dateSheets.boardId,
        instituteId: dateSheets.instituteId,
        viewCount: dateSheets.viewCount,
        isPopular: dateSheets.isPopular,
        officialLink: dateSheets.officialLink,
        downloadLink: dateSheets.downloadLink,
        boardName: boards.name,
        boardSlug: boards.slug,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        cityId: institutes.cityId,
        cityName: cities.name,
        citySlug: cities.slug,
      })
      .from(dateSheets)
      .leftJoin(boards, eq(dateSheets.boardId, boards.id))
      .leftJoin(institutes, eq(dateSheets.instituteId, institutes.id))
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .where(whereClause)
      .orderBy(desc(dateSheets.isPopular), desc(dateSheets.year), desc(dateSheets.createdAt))
      .limit(ITEMS_PER_PAGE)
      .offset(offset);

    return { 
      dateSheets: dateSheetsList, 
      totalCount, 
      totalPages, 
      currentPage 
    };
  } catch (error) {
    console.error('Database error:', error);
    return { dateSheets: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
}

async function getStats() {
  try {
    const totalSheets = await db
      .select({ count: sql<number>`count(*)` })
      .from(dateSheets)
      .where(eq(dateSheets.status, true));

    const popularSheets = await db
      .select({ count: sql<number>`count(*)` })
      .from(dateSheets)
      .where(and(eq(dateSheets.status, true), eq(dateSheets.isPopular, true)));

    const biseSheets = await db
      .select({ count: sql<number>`count(*)` })
      .from(dateSheets)
      .where(and(eq(dateSheets.status, true), sql`${dateSheets.boardId} IS NOT NULL`));

    const universitySheets = await db
      .select({ count: sql<number>`count(*)` })
      .from(dateSheets)
      .where(and(eq(dateSheets.status, true), sql`${dateSheets.instituteId} IS NOT NULL`));

    const totalViews = await db
      .select({ sum: sql<number>`sum(${dateSheets.viewCount})` })
      .from(dateSheets)
      .where(eq(dateSheets.status, true));

    const years = await db
      .select({ year: dateSheets.year })
      .from(dateSheets)
      .where(eq(dateSheets.status, true))
      .groupBy(dateSheets.year)
      .orderBy(desc(dateSheets.year));

    return { 
      totalSheets: Number(totalSheets[0]?.count) || 0,
      popularSheets: Number(popularSheets[0]?.count) || 0,
      biseSheets: Number(biseSheets[0]?.count) || 0,
      universitySheets: Number(universitySheets[0]?.count) || 0,
      totalViews: Number(totalViews[0]?.sum) || 0,
      availableYears: years.map(y => y.year),
    };
  } catch (error) {
    console.error('Stats error:', error);
    return { totalSheets: 0, popularSheets: 0, biseSheets: 0, universitySheets: 0, totalViews: 0, availableYears: [] };
  }
}

// Pagination Component
function Pagination({ currentPage, totalPages, filters }: { 
  currentPage: number; 
  totalPages: number; 
  filters: { board?: string; examType?: string; year?: string; q?: string };
}) {
  if (totalPages <= 1) return null;

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (filters.board) params.set('board', filters.board);
    if (filters.examType) params.set('type', filters.examType);
    if (filters.year) params.set('year', filters.year);
    if (filters.q) params.set('q', filters.q);
    params.set('page', page.toString());
    return `/date-sheets?${params.toString()}`;
  };

  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex justify-center mt-8">
      <nav className="flex items-center gap-2 flex-wrap" aria-label="Pagination">
        <Link
          href={currentPage > 1 ? buildPageUrl(currentPage - 1) : '#'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            currentPage > 1
              ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
          }`}
        >
          ← Previous
        </Link>
        
        {startPage > 1 && (
          <>
            <Link href={buildPageUrl(1)} className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
              1
            </Link>
            {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <Link
            key={page}
            href={buildPageUrl(page)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {page}
          </Link>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
            <Link href={buildPageUrl(totalPages)} className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
              {totalPages}
            </Link>
          </>
        )}
        
        <Link
          href={currentPage < totalPages ? buildPageUrl(currentPage + 1) : '#'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            currentPage < totalPages
              ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
          }`}
        >
          Next →
        </Link>
      </nav>
    </div>
  );
}

export default async function DateSheetsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams || {};
  
  const currentPage = typeof params.page === 'string' ? parseInt(params.page) : 1;
  
  const filters = {
    board: typeof params.board === 'string' ? params.board : '',
    examType: typeof params.type === 'string' ? params.type : '',
    year: typeof params.year === 'string' ? params.year : '',
    q: typeof params.q === 'string' ? params.q : '',
    page: currentPage,
  };

  const [dateSheetsResult, stats] = await Promise.all([
    getDateSheets(filters),
    getStats(),
  ]);

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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-teal-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-white">
                Latest Exam Schedules 2026
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Date Sheets <span className="text-yellow-300">2026</span>
            </h1>
            
            <p className="text-xl text-green-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Download exam schedules for Matric, Intermediate & University exams
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/20 transition">
                <div className="text-3xl font-bold">{stats.totalSheets}+</div>
                <div className="text-sm text-green-200 mt-1">Date Sheets</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/20 transition">
                <div className="text-3xl font-bold">{stats.popularSheets}</div>
                <div className="text-sm text-green-200 mt-1">Popular</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/20 transition">
                <div className="text-3xl font-bold">{stats.biseSheets}</div>
                <div className="text-sm text-green-200 mt-1">BISE Boards</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/20 transition">
                <div className="text-3xl font-bold">{stats.universitySheets}</div>
                <div className="text-sm text-green-200 mt-1">Universities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/20 transition">
                <div className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</div>
                <div className="text-sm text-green-200 mt-1">Total Views</div>
              </div>
            </div>

            {/* Search Form */}
            <div className="max-w-2xl mx-auto">
              <form action="/date-sheets" method="GET" className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    name="q"
                    defaultValue={filters.q}
                    placeholder="Search by board, university or exam..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-lg"
                    aria-label="Search date sheets"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-300 transition shadow-lg"
                  aria-label="Search"
                >
                  Search
                </button>
              </form>
              <p className="text-sm text-green-200 mt-4">
                Popular: BISE Lahore • FBISE • Matric • Intermediate • Annual Exams
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-80 flex-shrink-0" aria-label="Date sheet filters">
            <div className="sticky top-24 space-y-6">
              
              {/* Board Type Filter */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter Date Sheets
                  </h2>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Board Type</h3>
                  <div className="space-y-1">
                    {BOARD_TYPES.map((board) => (
                      <Link
                        key={board.slug}
                        href={buildUrl('board', board.slug)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                          filters.board === board.slug
                            ? 'bg-green-50 text-green-700 font-medium'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                        aria-label={board.description}
                      >
                        <span className="text-lg">{board.icon}</span>
                        <span className="flex-1">{board.name}</span>
                        {filters.board === board.slug && (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Exam Type Filter */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <span>📝</span> Exam Type
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={buildUrl('type', '')}
                    className={`px-3 py-1.5 rounded-full text-sm transition ${
                      !filters.examType ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </Link>
                  {EXAM_TYPES.filter(t => t.value).map((type) => (
                    <Link
                      key={type.value}
                      href={buildUrl('type', type.value)}
                      className={`px-3 py-1.5 rounded-full text-sm transition ${
                        filters.examType === type.value ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Year Filter */}
              {stats.availableYears.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                    <span>📅</span> Year
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={buildUrl('year', '')}
                      className={`px-3 py-1.5 rounded-full text-sm transition ${
                        !filters.year ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </Link>
                    {stats.availableYears.map((year) => (
                      <Link
                        key={year}
                        href={buildUrl('year', year.toString())}
                        className={`px-3 py-1.5 rounded-full text-sm transition ${
                          filters.year === year.toString() ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {year}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              {(filters.board || filters.examType || filters.year || filters.q) && (
                <Link
                  href="/date-sheets"
                  className="block text-center text-sm text-green-600 hover:underline py-3 border-t"
                >
                  Clear all filters
                </Link>
              )}
            </div>
          </aside>

          {/* Main Content - Date Sheets List */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {dateSheetsResult.totalCount} Date Sheets Found
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {filters.board && BOARD_TYPES.find(b => b.slug === filters.board)?.name}
                    {filters.examType && ` • ${filters.examType} Exams`}
                    {filters.year && ` • ${filters.year}`}
                    {filters.q && ` • Search: "${filters.q}"`}
                    {` • Page ${dateSheetsResult.currentPage} of ${dateSheetsResult.totalPages}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Date Sheets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {dateSheetsResult.dateSheets.length > 0 ? (
                dateSheetsResult.dateSheets.map((sheet) => (
                  <article key={sheet.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all overflow-hidden group">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          {/* Popular Badge */}
                          {sheet.isPopular && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium mb-2">
                              <span>⭐</span> Popular
                            </div>
                          )}
                          
                          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                            <Link href={`/date-sheets/${sheet.slug}`} className="hover:text-green-600 transition">
                              {sheet.title}
                            </Link>
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
                            {sheet.boardName && (
                              <Link href={`/boards/${sheet.boardSlug}`} className="text-green-600 hover:underline font-medium">
                                {sheet.boardName}
                              </Link>
                            )}
                            {sheet.instituteName && (
                              <Link href={`/universities/${sheet.instituteSlug}`} className="text-green-600 hover:underline font-medium">
                                {sheet.instituteName}
                              </Link>
                            )}
                            {sheet.cityName && (
                              <>
                                <span>•</span>
                                <Link href={`/cities/${sheet.citySlug}`} className="hover:text-green-600">
                                  {sheet.cityName}
                                </Link>
                              </>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-xl p-2.5">
                              <span className="text-gray-500 text-xs">Exam Type</span>
                              <div className="font-semibold text-gray-800 text-sm">
                                {sheet.examType || 'Annual'}
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-2.5">
                              <span className="text-gray-500 text-xs">Year</span>
                              <div className="font-semibold text-gray-800 text-sm">{sheet.year}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>👁️ {sheet.viewCount || 0} views</span>
                        </div>
                        <Link
                          href={`/date-sheets/${sheet.slug}`}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm font-medium"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-2 bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-100">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Date Sheets Found</h3>
                  <p className="text-gray-500 mb-6">
                    {filters.board || filters.examType || filters.year || filters.q 
                      ? 'Try changing your filters to see more results'
                      : 'Check back soon for latest exam schedules'}
                  </p>
                  <Link
                    href="/date-sheets"
                    className="inline-block px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                  >
                    View All Date Sheets
                  </Link>
                </div>
              )}
            </div>

            {/* Pagination */}
            <Pagination 
              currentPage={dateSheetsResult.currentPage}
              totalPages={dateSheetsResult.totalPages}
              filters={{ board: filters.board, examType: filters.examType, year: filters.year, q: filters.q }}
            />
          </div>
        </div>
      </div>

      {/* SEO Content Section */}
      <section className="bg-white py-16 border-t border-gray-100 mt-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              About Date Sheets 2026 in Pakistan
            </h2>
            
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">Date sheets 2026 for all educational boards in Pakistan</strong> 
                are now available for download. Students can access exam schedules for 
                <Link href="/date-sheets?board=bise" className="text-green-600 hover:underline mx-1">BISE boards</Link>,
                <Link href="/date-sheets?board=fbise" className="text-green-600 hover:underline mx-1">FBISE</Link>, and
                <Link href="/date-sheets?board=university" className="text-green-600 hover:underline mx-1">universities</Link>.
                Download official date sheets for Matric, Intermediate, and university exams 2026.
              </p>
              
              <p>
                <strong className="text-gray-900">Exam schedules include</strong> 
                theory papers, practical exams, and subject-wise dates. Students are advised to download 
                the official date sheet from their respective board or university website. Our platform 
                provides direct download links to official sources.
              </p>
              
              <p>
                <strong className="text-gray-900">Popular exam types</strong> 
                include Annual Exams, Supplementary Exams, and Special Exams. Most BISE boards conduct 
                annual exams in March-April and result announcements in August-September.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-green-600">📅</span> When are date sheets announced?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Most BISE boards announce date sheets 2-3 months before exams. Annual exam date sheets are typically released in December-January for March-April exams.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-red-600">📥</span> How to download date sheets?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Click on "View Details" button for any date sheet. You'll find official download links from board/university websites. All links are direct and secure.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-blue-600">🏛️</span> Which BISE boards are covered?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  We cover all major BISE boards including Lahore, Rawalpindi, Multan, Faisalabad, Gujranwala, Sargodha, Bahawalpur, DG Khan, and FBISE.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-purple-600">🎓</span> Are university date sheets included?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Yes, we also include date sheets from major universities including public and private sector universities across Pakistan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Date Sheets 2026 in Pakistan",
            "description": "Download exam schedules for BISE boards, FBISE and universities in Pakistan",
            "url": "https://www.nextid.pk/date-sheets",
            "numberOfItems": dateSheetsResult.totalCount,
            "itemListElement": dateSheetsResult.dateSheets.slice(0, 10).map((sheet, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "url": `https://www.nextid.pk/date-sheets/${sheet.slug}`,
              "name": sheet.title,
            }))
          })
        }}
      />
    </main>
  );
}