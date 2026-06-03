// app/(public)/results/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { postService } from '@/services/post/post.service';
import { unstable_cache } from 'next/cache';


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

function isResultRecent(resultDate: Date | null): boolean {
  if (!resultDate) return false;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return new Date(resultDate).getTime() > thirtyDaysAgo;
}

// ============ METADATA ============
export const metadata: Metadata = {
  title: 'All Exam Results 2026 Pakistan | Board & University Results | NextID.pk',
  description: 'Check latest board and university results 2026 in Pakistan. BISE Lahore, Karachi, Islamabad, FBISE results. Matric, Intermediate, BA, BSc, MA, MSc results.',
};

// ============ DATA FETCHING ============
async function getResults(filters: Filters): Promise<ResultItem[]> {
  try {
    const allResults = await postService.getPostsByType('result', 200);
    
    // Transform to ResultItem format
    let resultsList: ResultItem[] = allResults.map(post => {
      const meta = post.meta || {};
      
      // Parse date safely
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
        isPopular: getMetaValue(meta, 'isPopular', false),  // ✅ Fixed: from meta
        viewCount: getMetaValue(meta, 'viewCount', 0),      // ✅ Fixed: from meta
      };
    });
    
    // Sort by result date (newest first)
    resultsList.sort((a, b) => {
      const dateA = a.resultDate ? new Date(a.resultDate).getTime() : 0;
      const dateB = b.resultDate ? new Date(b.resultDate).getTime() : 0;
      return dateB - dateA;
    });
    
    // Filter by board
    if (filters.board) {
      resultsList = resultsList.filter(r => 
        r.boardSlug?.toLowerCase() === filters.board?.toLowerCase()
      );
    }
    
    // Filter by year
    if (filters.year) {
      resultsList = resultsList.filter(r => r.year === parseInt(filters.year!));
    }
    
    // Filter by level (title search)
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
    
    // Filter by search query
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
        
        const recentResults = allResults.filter(r => {
          const meta = r.meta || {};
          const resultDateRaw = getMetaValue(meta, 'resultDate', null);
          if (!resultDateRaw || typeof resultDateRaw !== 'string') return false;
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          try {
            return new Date(resultDateRaw).getTime() > thirtyDaysAgo;
          } catch {
            return false;
          }
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

// ============ COMPONENTS ============
function Breadcrumbs({ filters }: { filters: Filters }) {
  return (
    <nav className="text-sm text-gray-500 mb-4">
      <ol className="flex flex-wrap items-center gap-2">
        <li><Link href="/" className="hover:text-green-600">Home</Link></li>
        <li className="text-gray-400">/</li>
        <li className="text-gray-700 font-medium">Results</li>
        {filters.board && (
          <>
            <li className="text-gray-400">/</li>
            <li className="text-gray-700">{filters.board}</li>
          </>
        )}
        {filters.year && (
          <>
            <li className="text-gray-400">/</li>
            <li className="text-gray-700">{filters.year}</li>
          </>
        )}
      </ol>
    </nav>
  );
}

function FilterSidebar({ filters, stats, buildUrl }: { filters: Filters; stats: Stats; buildUrl: (key: string, value: string) => string }) {
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </form>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Result Type</h3>
        <div className="space-y-1">
          {RESULT_TYPES.map(t => (
            <Link
              key={t.slug}
              href={buildUrl('level', t.slug)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.level === t.slug ? 'bg-green-600 text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{t.icon}</span>
                {t.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Education Boards</h3>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          <Link
            href={buildUrl('board', '')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              !filters.board ? 'bg-green-600 text-white' : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span>All Boards</span>
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
              <span className="text-xs text-gray-400">{b.city}</span>
            </Link>
          ))}
        </div>
      </div>

      {stats.years.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Year</h3>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildUrl('year', '')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                !filters.year ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </Link>
            {stats.years.slice(0, 6).map(y => (
              <Link
                key={y}
                href={buildUrl('year', y.toString())}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  filters.year === y.toString() ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(filters.board || filters.year || filters.level || filters.q) && (
        <Link href="/results" className="block text-center text-sm text-green-600 hover:text-green-700 mt-4 pt-3 border-t">
          Clear all filters
        </Link>
      )}
    </div>
  );
}

function ResultCard({ result }: { result: ResultItem }) {
  const isRecent = isResultRecent(result.resultDate);
  const institutionName = result.boardName || result.instituteName || 'Education Board';
  
  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-green-300 overflow-hidden group">
      <div className="p-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">
                📄
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                  <Link href={`/results/${result.slug}`}>{result.title}</Link>
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 mb-2">
                  <span className="font-medium text-green-600">{institutionName}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {result.resultDate && (
                    <span className="text-gray-500 flex items-center gap-1">
                      📅 {formatDate(result.resultDate)}
                    </span>
                  )}
                  <span className="text-gray-500 flex items-center gap-1">
                    📚 Year: {result.year}
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
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium inline-flex items-center gap-2"
            >
              <span>Check Result</span>
              <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

// ============ MAIN PAGE ============
export default async function ResultsPage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams || {};
  
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

  return (
    <main className="min-h-screen bg-gray-50">
      <meta httpEquiv="Cache-Control" content="public, s-maxage=86400, stale-while-revalidate=86400" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 py-12 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Exam Results <span className="text-yellow-400">Pakistan</span>
            </h1>
            <p className="text-xl text-green-100 mb-8">
              Board & University Results • Matric to Masters • Latest Announcements
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{stats.totalResults.toLocaleString()}+</div>
                <div className="text-sm text-green-200">Total Results</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{stats.totalBoards}+</div>
                <div className="text-sm text-green-200">Education Boards</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{stats.totalUniversities}+</div>
                <div className="text-sm text-green-200">Universities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{stats.recentResults}</div>
                <div className="text-sm text-green-200">This Month</div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              <form action="/results" method="GET" className="relative">
                <input
                  type="text"
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Search by board, university or result name..."
                  className="w-full pl-12 pr-32 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400/50 shadow-lg"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition">
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <aside className="lg:w-80 flex-shrink-0">
            <FilterSidebar filters={filters} stats={stats} buildUrl={buildUrl} />
          </aside>

          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {resultsData.length} Results Found
              </h2>
              {filters.level && <p className="text-sm text-gray-500 mt-1">Type: {RESULT_TYPES.find(l => l.slug === filters.level)?.name}</p>}
            </div>

            <Breadcrumbs filters={filters} />

            <div className="space-y-4">
              {resultsData.length > 0 ? (
                resultsData.map((r) => <ResultCard key={r.id} result={r} />)
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Results Found</h3>
                  <p className="text-gray-500">Try adjusting your filters</p>
                  <Link href="/results" className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    View All Results
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}