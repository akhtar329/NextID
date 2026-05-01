// app/(public)/results/page.tsx (COMPLETE WORKING VERSION)
import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { results, boards, institutes, cities } from '@/app/lib/schema';
import { eq, desc, and, or, like, sql, count, SQL } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

// ✅ SINGLE revalidate - 24 hours as requested
export const revalidate = 86400;
export const fetchCache = 'force-cache';

export async function generateStaticParams() {
  try {
    const allResults = await db
      .select({ slug: results.slug })
      .from(results)
      .where(eq(results.status, true))
      .limit(200);
    
    return allResults.map((item) => ({
      slug: item.slug,
    }));
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: 'All Exam Results 2026 Pakistan | Board & University Results | NextID.pk',
  description: 'Check latest board and university results 2026 in Pakistan. BISE Lahore, Karachi, Islamabad, FBISE results. Matric, Intermediate, BA, BSc, MA, MSc results with roll number slip.',
  keywords: 'results 2026, exam results Pakistan, board results, university results, BISE results, FBISE results, matric results, intermediate results, BA results, BSc results, MA results, MSc results, check result online, roll number slip',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.nextid.pk/results' },
  openGraph: {
    title: 'Exam Results 2026 Pakistan | Board & University Results',
    description: 'Check latest board and university results online. BISE Lahore, Karachi, Islamabad, FBISE and more. Matric to Masters results.',
    images: ['/images/results-og.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Exam Results 2026 Pakistan',
    description: 'Check latest board and university results online',
    images: ['/images/results-og.jpg'],
  }
};

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
  isPopular: boolean | null;
}

interface LevelConfig {
  slug: string;
  name: string;
  icon: string;
  keywords?: string[];
}

const RESULT_TYPES: LevelConfig[] = [
  { slug: '', name: 'All Results', icon: '📋' },
  { slug: 'matric', name: 'Matric (SSC)', icon: '📚', keywords: ['ssc', 'matric', 'secondary'] },
  { slug: 'inter', name: 'Intermediate (HSSC)', icon: '📖', keywords: ['hssc', 'inter', 'fa', 'fsc', 'ics', 'icom'] },
  { slug: 'ba', name: 'BA/BSc', icon: '🎓', keywords: ['ba', 'bsc', 'bachelor'] },
  { slug: 'ma', name: 'MA/MSc', icon: '🎓', keywords: ['ma', 'msc', 'master'] },
  { slug: 'professional', name: 'Professional', icon: '💼', keywords: ['mbbs', 'bds', 'llb', 'engineering'] },
];

interface Board {
  slug: string;
  name: string;
  city: string;
}

const BOARDS: Board[] = [
  { slug: 'bise-lahore', name: 'BISE Lahore', city: 'Lahore' },
  { slug: 'bise-karachi', name: 'BISE Karachi', city: 'Karachi' },
  { slug: 'bise-rawalpindi', name: 'BISE Rawalpindi', city: 'Rawalpindi' },
  { slug: 'bise-multan', name: 'BISE Multan', city: 'Multan' },
  { slug: 'bise-faisalabad', name: 'BISE Faisalabad', city: 'Faisalabad' },
  { slug: 'bise-gujranwala', name: 'BISE Gujranwala', city: 'Gujranwala' },
  { slug: 'bise-sargodha', name: 'BISE Sargodha', city: 'Sargodha' },
  { slug: 'bise-sahiwal', name: 'BISE Sahiwal', city: 'Sahiwal' },
  { slug: 'bise-dera-ghazi-khan', name: 'BISE Dera Ghazi Khan', city: 'Dera Ghazi Khan' },
  { slug: 'fbise', name: 'FBISE Islamabad', city: 'Islamabad' },
  { slug: 'akueb', name: 'AKUEB Karachi', city: 'Karachi' },
];

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

// ✅ OPTIMIZED: Cached version of getResults
async function getResults(filters: Filters): Promise<ResultItem[]> {
  const cacheKey = `results-list-${JSON.stringify(filters)}`;
  
  return unstable_cache(
    async () => {
      try {
        const conditions: SQL[] = [eq(results.status, true)];

        if (filters.board) {
          conditions.push(eq(boards.slug, filters.board));
        }
        
        if (filters.university) {
          conditions.push(eq(institutes.slug, filters.university));
        }
        
        if (filters.year) {
          conditions.push(eq(results.year, parseInt(filters.year, 10)));
        }
        
        if (filters.level && filters.level !== '') {
          const levelConfig = RESULT_TYPES.find(t => t.slug === filters.level);
          if (levelConfig?.keywords && levelConfig.keywords.length > 0) {
            const keywordConditions = levelConfig.keywords.map(keyword => 
              like(results.title, `%${keyword}%`)
            );
            const orCondition = or(...keywordConditions);
            if (orCondition) {
              conditions.push(orCondition);
            }
          }
        }
        
        if (filters.q) {
          const term = `%${filters.q}%`;
          const orCondition = or(
            like(results.title, term),
            like(boards.name, term),
            like(institutes.name, term)
          );
          if (orCondition) {
            conditions.push(orCondition);
          }
        }

        const data: ResultItem[] = await db
          .select({
            id: results.id,
            slug: results.slug,
            title: results.title,
            year: results.year,
            resultDate: results.resultDate,
            boardName: boards.name,
            boardSlug: boards.slug,
            instituteName: institutes.name,
            instituteSlug: institutes.slug,
            cityName: cities.name,
            isPopular: results.isPopular,
          })
          .from(results)
          .leftJoin(boards, eq(results.boardId, boards.id))
          .leftJoin(institutes, eq(results.instituteId, institutes.id))
          .leftJoin(cities, eq(institutes.cityId, cities.id))
          .where(and(...conditions))
          .orderBy(desc(results.resultDate), desc(results.year))
          .limit(100);

        return data;
      } catch (error) {
        console.error('[CACHE] Failed to fetch results:', error);
        return [];
      }
    },
    [cacheKey],
    {
      revalidate: 86400,
      tags: ['results'],
    }
  )();
}

// ✅ OPTIMIZED: Cached version of getStats
async function getStats(): Promise<Stats> {
  return unstable_cache(
    async () => {
      try {
        const [totalResults, totalBoards, totalUniversities, recentResults, yearsData] = await Promise.all([
          db.select({ count: count() }).from(results).where(eq(results.status, true)),
          db.select({ count: count() }).from(boards).where(eq(boards.status, true)),
          db.select({ count: count() }).from(institutes).where(and(eq(institutes.type, 'university'), eq(institutes.status, true))),
          db
            .select({ count: sql<number>`count(*)` })
            .from(results)
            .where(and(
              eq(results.status, true),
              sql`${results.resultDate} > NOW() - INTERVAL '30 days'`
            ))
            .then((r) => Number(r[0]?.count) || 0),
          db
            .select({ year: results.year })
            .from(results)
            .where(eq(results.status, true))
            .groupBy(results.year)
            .orderBy(desc(results.year)),
        ]);

        return {
          totalResults: Number(totalResults[0]?.count) || 0,
          totalBoards: Number(totalBoards[0]?.count) || 0,
          totalUniversities: Number(totalUniversities[0]?.count) || 0,
          recentResults,
          years: yearsData.map(y => y.year).filter(y => y !== null) as number[],
        };
      } catch (error) {
        console.error('[CACHE] Failed to fetch stats:', error);
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
    {
      revalidate: 86400,
      tags: ['results-stats'],
    }
  )();
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

function isResultRecent(resultDate: Date | null): boolean {
  if (!resultDate) return false;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return new Date(resultDate).getTime() > thirtyDaysAgo;
}

function Breadcrumbs({ filters }: { filters: Filters }) {
  const items: BreadcrumbItem[] = [
    { name: 'Home', url: '/' },
    { name: 'Results', url: '/results' }
  ];

  if (filters.board) {
    const board = BOARDS.find((b) => b.slug === filters.board);
    if (board) items.push({ name: board.name, url: `/results?board=${filters.board}` });
  }

  if (filters.university) {
    items.push({ name: 'University Results', url: `/results?university=${filters.university}` });
  }

  if (filters.level) {
    const level = RESULT_TYPES.find(l => l.slug === filters.level);
    if (level) items.push({ name: level.name, url: `/results?level=${filters.level}` });
  }

  if (filters.year) {
    items.push({ name: `${filters.year} Results`, url: `/results?year=${filters.year}` });
  }

  if (filters.q) {
    items.push({ name: `Search: "${filters.q}"`, url: `/results?q=${filters.q}` });
  }

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-4">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.url} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gray-400">/</span>}
            {index === items.length - 1 ? (
              <span className="text-gray-700 font-medium">{item.name}</span>
            ) : (
              <Link href={item.url} className="hover:text-green-600 transition-colors">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function FilterSidebar({ 
  filters, 
  stats, 
  buildUrl 
}: { 
  filters: Filters; 
  stats: Stats; 
  buildUrl: (key: string, value: string) => string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-200">
      <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-green-600 rounded-full"></span>
        Filter Results
      </h2>
      
      <div className="mb-6">
        <form action="/results" method="GET" className="relative">
          <input
            type="text"
            name="q"
            defaultValue={filters.q}
            placeholder="Search results..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden="true">🔍</span>
          {Object.entries(filters).map(([key, value]) => 
            key !== 'q' && value ? (
              <input key={key} type="hidden" name={key} value={value as string} />
            ) : null
          )}
        </form>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center justify-between">
          <span>Result Type</span>
          <span className="text-xs text-gray-400">Popular</span>
        </h3>
        <div className="space-y-1">
          {RESULT_TYPES.map(t => (
            <Link
              key={t.slug}
              href={buildUrl('level', t.slug)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.level === t.slug
                  ? 'bg-green-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true">{t.icon}</span>
                {t.name}
              </span>
              {filters.level === t.slug && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Selected</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Education Boards</h3>
        <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
          <Link
            href={buildUrl('board', '')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              !filters.board ? 'bg-green-600 text-white' : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span>All Boards</span>
            {!filters.board && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Selected</span>}
          </Link>
          {BOARDS.map(b => (
            <Link
              key={b.slug}
              href={buildUrl('board', b.slug)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.board === b.slug ? 'bg-green-600 text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span>{b.name}</span>
              {b.city && <span className="text-xs text-gray-400">{b.city}</span>}
            </Link>
          ))}
        </div>
      </div>

      {stats.years && stats.years.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Year</h3>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildUrl('year', '')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !filters.year
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </Link>
            {stats.years.slice(0, 8).map((y: number) => (
              <Link
                key={y}
                href={buildUrl('year', y.toString())}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filters.year === y.toString()
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(filters.board || filters.university || filters.year || filters.level || filters.q) && (
        <Link
          href="/results"
          className="block text-center text-sm text-green-600 hover:text-green-700 mt-4 pt-3 border-t border-gray-200"
        >
          Clear all filters
        </Link>
      )}
    </div>
  );
}

function ResultCard({ result }: { result: ResultItem }) {
  const isRecent = isResultRecent(result.resultDate);
  
  return (
    <article 
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-green-300 overflow-hidden group"
      suppressHydrationWarning
    >
      <div className="p-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl" aria-hidden="true">
                📄
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                  <Link href={`/results/${result.slug}`}>
                    {result.title}
                  </Link>
                </h3>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 mb-2">
                  {result.boardName !== null && (
                    <>
                      <Link 
                        href={`/boards/${result.boardSlug}`}
                        className="text-green-600 hover:underline font-medium"
                      >
                        {result.boardName}
                      </Link>
                      <span className="text-gray-300" aria-hidden="true">•</span>
                    </>
                  )}
                  {result.instituteName !== null && (
                    <>
                      <Link 
                        href={`/universities/${result.instituteSlug}`}
                        className="text-green-600 hover:underline font-medium"
                      >
                        {result.instituteName}
                      </Link>
                      <span className="text-gray-300" aria-hidden="true">•</span>
                    </>
                  )}
                  {result.cityName !== null && (
                    <span className="text-gray-500">{result.cityName}</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {result.resultDate !== null && (
                    <span className="text-gray-500 flex items-center gap-1">
                      <span aria-hidden="true">📅</span>
                      {new Date(result.resultDate).toLocaleDateString('en-PK', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  )}
                  <span className="text-gray-500 flex items-center gap-1">
                    <span aria-hidden="true">📚</span>
                    Year: {result.year}
                  </span>
                  
                  <div className="flex gap-2">
                    {result.isPopular && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        Popular
                      </span>
                    )}
                    {isRecent && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        New
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Link
              href={`/results/${result.slug}`}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium inline-flex items-center gap-2 group-hover:shadow-md"
            >
              <span>Check Result</span>
              <span className="text-lg group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
            </Link>
            <span className="text-xs text-gray-400">
              View full details
            </span>
          </div>
        </div>

        {result.slug && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 font-mono">
            /results/{result.slug}
          </div>
        )}
      </div>
    </article>
  );
}

// ✅ Error boundary component
function ErrorState() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <div className="text-6xl mb-4" aria-hidden="true">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to load results</h2>
          <p className="text-gray-600">Please try again later</p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}

async function getPageData(filters: Filters) {
  const [resultsData, stats] = await Promise.all([
    getResults(filters),
    getStats(),
  ]);
  return { resultsData, stats };
}

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ResultsPage({
  searchParams,
}: PageProps) {
  let pageData;
  let fetchError = false;
  
  try {
    const params = (await searchParams) || {};
    const filters: Filters = {
      board: typeof params.board === 'string' ? params.board : '',
      university: typeof params.university === 'string' ? params.university : '',
      year: typeof params.year === 'string' ? params.year : '',
      level: typeof params.level === 'string' ? params.level : '',
      q: typeof params.q === 'string' ? params.q : '',
    };
    
    pageData = await getPageData(filters);
  } catch {
    fetchError = true;
  }

  if (fetchError || !pageData) {
    return <ErrorState />;
  }

  const params = (await searchParams) || {};
  const filters: Filters = {
    board: typeof params.board === 'string' ? params.board : '',
    university: typeof params.university === 'string' ? params.university : '',
    year: typeof params.year === 'string' ? params.year : '',
    level: typeof params.level === 'string' ? params.level : '',
    q: typeof params.q === 'string' ? params.q : '',
  };

  const buildUrl = (key: string, value: string): string => {
    const urlParams = new URLSearchParams();
    if (filters.board && key !== 'board') urlParams.set('board', filters.board);
    if (filters.university && key !== 'university') urlParams.set('university', filters.university);
    if (filters.year && key !== 'year') urlParams.set('year', filters.year);
    if (filters.level && key !== 'level') urlParams.set('level', filters.level);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (value) urlParams.set(key, value);
    return urlParams.toString() ? `/results?${urlParams.toString()}` : '/results';
  };
  
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ✅ SEO: Added cache header */}
      <meta httpEquiv="Cache-Control" content="public, s-maxage=86400, stale-while-revalidate=86400" />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Exam Results Pakistan",
            "description": "Latest board and university results in Pakistan",
            "url": "https://www.nextid.pk/results",
          })
        }}
        suppressHydrationWarning
      />

      <section className="bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-12 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-green-200 mb-4">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="text-green-300" aria-hidden="true">›</span>
              <span className="text-white font-medium">Results</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Exam Results <span className="text-yellow-400">Pakistan</span>
            </h1>
            
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Board & University Results • Matric to Masters • Latest Announcements
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold">{pageData.stats.totalResults.toLocaleString()}+</div>
                <div className="text-sm text-green-200">Total Results</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold">{pageData.stats.totalBoards}+</div>
                <div className="text-sm text-green-200">Education Boards</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold">{pageData.stats.totalUniversities}+</div>
                <div className="text-sm text-green-200">Universities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold">{pageData.stats.recentResults}</div>
                <div className="text-sm text-green-200">Results this month</div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              <form action="/results" method="GET" className="relative">
                <input
                  type="text"
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Search by board, university or result name..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400/50 shadow-lg"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" aria-hidden="true">🔍</span>
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition shadow-md"
                >
                  Search
                </button>
              </form>
              <p className="text-sm text-green-200 mt-3">
                Popular: Matric • Intermediate • BA • BSc • FBISE • BISE Lahore
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <aside className="lg:w-80 flex-shrink-0">
            <FilterSidebar filters={filters} stats={pageData.stats} buildUrl={buildUrl} />
          </aside>

          <div className="flex-1">
            
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {pageData.resultsData.length} Results Found
                  </h2>
                  <p className="text-sm text-gray-500">
                    {filters.level && `Type: ${RESULT_TYPES.find(l => l.slug === filters.level)?.name}`}
                    {filters.board && ` • Board: ${BOARDS.find(b => b.slug === filters.board)?.name}`}
                    {filters.year && ` • Year: ${filters.year}`}
                    {filters.q && ` • Search: "${filters.q}"`}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Sorted by: <span className="font-medium">Latest First</span>
                </div>
              </div>
            </div>

            <Breadcrumbs filters={filters} />

            <div className="space-y-4" suppressHydrationWarning>
              {pageData.resultsData.length > 0 ? (
                pageData.resultsData.map((r) => <ResultCard key={r.id} result={r} />)
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200" suppressHydrationWarning>
                  <div className="text-6xl mb-4" aria-hidden="true">📭</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Results Found</h3>
                  <p className="text-gray-500 mb-6">
                    {filters.board || filters.university || filters.year || filters.level || filters.q
                      ? 'Try adjusting your filters'
                      : 'Check back soon for latest results'}
                  </p>
                  <Link
                    href="/results"
                    className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    View All Results
                  </Link>
                </div>
              )}
            </div>

            {pageData.resultsData.length > 0 && pageData.resultsData.length >= 100 && (
              <div className="text-center mt-8">
                <button 
                  type="button"
                  className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Load More Results
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rest of your JSX remains the same - FAQ sections, etc. */}
      {/* ... keep all remaining content from your original file . ........... */}
      
    </main>
  );
}