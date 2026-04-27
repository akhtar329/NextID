// app/(public)/date-sheets/page.tsx
import { Metadata } from 'next';
export const revalidate = 86400;\nimport Link from 'next/link';
export const revalidate = 86400;\nimport { db } from '@/app/lib/db';
export const revalidate = 86400;\nimport { dateSheets, boards, institutes, cities } from '@/app/lib/schema';
export const revalidate = 86400;\nimport { eq, desc, like, and, or, sql, SQL } from 'drizzle-orm';

 
export const revalidate = 86400;\n// remove dynamicparams= true

interface DateSheetRow {
  id: number;
  title: string;
  slug: string;
  examType: string | null;
  examDate: Date | null;
  year: number;
  boardId: number | null;
  instituteId: number | null;
  viewCount: number | null;
  isPopular: boolean | null;
  officialLink: string | null;
  downloadLink: string | null;
  boardName: string | null;
  boardSlug: string | null;
  instituteName: string | null;
  instituteSlug: string | null;
  cityId: number | null;
  cityName: string | null;
  citySlug: string | null;
}

interface DateSheetsResult {
  dateSheets: DateSheetRow[];
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

export const metadata: Metadata = {
  title: 'Date Sheets 2026 in Pakistan – BISE, FBISE & University Exam Schedules | NextID.pk',
  description: 'Download all 2026 date sheets for BISE boards, FBISE, and universities in Pakistan. Check exam schedules, subject-wise dates, and official notifications.',
  alternates: {
    canonical: 'https://www.nextid.pk/date-sheets',
  },
  openGraph: {
    title: 'Date Sheets 2026 in Pakistan – Download Exam Schedules',
    description: 'Download date sheets for Matric, Intermediate, and university exams 2026.',
    url: 'https://www.nextid.pk/date-sheets',
    siteName: 'NextID.pk',
    type: 'website',
  },
};

type ConditionType = ReturnType<typeof eq> | ReturnType<typeof like> | ReturnType<typeof and> | ReturnType<typeof or> | SQL;

async function getDateSheets(filters: DateSheetFilters): Promise<DateSheetsResult> {
  try {
    const currentPage = filters.page || 1;
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    
    const conditions: ConditionType[] = [];
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

    if (filters.board === 'bise') {
      conditions.push(sql`${dateSheets.boardId} IS NOT NULL`);
    } else if (filters.board === 'fbise') {
      conditions.push(eq(boards.name, 'Federal Board of Intermediate and Secondary Education (FBISE)'));
    } else if (filters.board === 'university') {
      conditions.push(sql`${dateSheets.instituteId} IS NOT NULL`);
    }

    const whereClause = and(...conditions);

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
      dateSheets: dateSheetsList as DateSheetRow[], 
      totalCount, 
      totalPages, 
      currentPage 
    };
  } catch {
    return { dateSheets: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
}

async function getStats(): Promise<StatsResult> {
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
  } catch {
    return { totalSheets: 0, popularSheets: 0, biseSheets: 0, universitySheets: 0, totalViews: 0, availableYears: [] };
  }
}

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
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
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
  
  const filters: DateSheetFilters = {
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
      
      <div className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-teal-800">
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Date Sheets <span className="text-yellow-300">2026</span>
            </h1>
            
            <p className="text-xl text-green-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Download exam schedules for Matric, Intermediate &amp; University exams
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center">
                <div className="text-3xl font-bold text-white">{stats.totalSheets}+</div>
                <div className="text-sm text-green-200 mt-1">Date Sheets</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center">
                <div className="text-3xl font-bold text-white">{stats.popularSheets}</div>
                <div className="text-sm text-green-200 mt-1">Popular</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center">
                <div className="text-3xl font-bold text-white">{stats.biseSheets}</div>
                <div className="text-sm text-green-200 mt-1">BISE Boards</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center">
                <div className="text-3xl font-bold text-white">{stats.universitySheets}</div>
                <div className="text-sm text-green-200 mt-1">Universities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center">
                <div className="text-3xl font-bold text-white">{stats.totalViews.toLocaleString()}</div>
                <div className="text-sm text-green-200 mt-1">Total Views</div>
              </div>
            </div>

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
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-300 transition shadow-lg"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <aside className="lg:w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
                  <h2 className="text-white font-semibold">Filter Date Sheets</h2>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm">Board Type</h3>
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
                      >
                        <span className="text-lg">{board.icon}</span>
                        <span className="flex-1">{board.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Exam Type</h3>
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

              {stats.availableYears.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm">Year</h3>
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

          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {dateSheetsResult.totalCount} Date Sheets Found
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {dateSheetsResult.dateSheets.length > 0 ? (
                dateSheetsResult.dateSheets.map((sheet) => (
                  <article key={sheet.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all overflow-hidden">
                    <div className="p-5">
                      {sheet.isPopular && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium mb-2">
                          <span>⭐</span> Popular
                        </div>
                      )}
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        <Link href={`/date-sheets/${sheet.slug}`} className="hover:text-green-600 transition">
                          {sheet.title}
                        </Link>
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
                        {sheet.boardName && (
                          <span className="text-green-600">{sheet.boardName}</span>
                        )}
                        {sheet.instituteName && (
                          <span className="text-green-600">{sheet.instituteName}</span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
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
                      
                      <Link
                        href={`/date-sheets/${sheet.slug}`}
                        className="inline-block px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-2 bg-white rounded-2xl p-16 text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Date Sheets Found</h3>
                  <p className="text-gray-500">Try changing your filters to see more results</p>
                </div>
              )}
            </div>

            <Pagination 
              currentPage={dateSheetsResult.currentPage}
              totalPages={dateSheetsResult.totalPages}
              filters={{ board: filters.board, examType: filters.examType, year: filters.year, q: filters.q }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

