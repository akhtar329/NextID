// app/(public)/boards/page.tsx (OPTIMIZED VERSION - FIXED ESLINT ERRORS)
import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/db/db';
import { boards, cities, results, dateSheets } from '@/db/schema';
import { eq, like, and, sql, count } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

// ✅ 24 hours cache (as requested - single person updates)
export const revalidate = 86400;

export async function generateStaticParams() {
  try {
    const allBoards = await db
      .select({ slug: boards.slug })
      .from(boards)
      .where(eq(boards.status, true))
      .limit(100);
    
    return allBoards.map((item) => ({
      slug: item.slug,
    }));
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: 'Education Boards in Pakistan | BISE, FBISE Results & Date Sheets 2026 | NextID.pk',
  description: 'Complete information about education boards in Pakistan: BISE Lahore, Karachi, Islamabad, FBISE. Check results 2026, date sheets, model papers & announcements.',
  keywords: 'education boards Pakistan, BISE, FBISE, board of intermediate and secondary education, BISE Lahore, BISE Karachi, BISE Rawalpindi, FBISE Islamabad, board results 2026, board date sheets, model papers, board announcements',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': 160,
    },
  },
  alternates: {
    canonical: 'https://www.nextid.pk/boards',
  },
  openGraph: {
    title: 'Education Boards in Pakistan | BISE, FBISE Results 2026',
    description: 'Complete guide to education boards in Pakistan. Check results, date sheets, model papers and announcements.',
    images: ['/images/boards-og.jpg'],
  },
};

interface BoardItem {
  id: number;
  name: string;
  slug: string;
  city: string | null;
  citySlug: string | null;
  website: string | null;
  description: string | null;
  resultsCount: number;
  dateSheetsCount: number;
  latestResultYear: number | null;
  established?: string;
}

interface Stats {
  totalBoards: number;
  totalCities: number;
  boardsWithResults: number;
}

const PROVINCES = [
  { name: 'All Boards', slug: '' },
  { name: 'Punjab Boards', slug: 'punjab' },
  { name: 'Sindh Boards', slug: 'sindh' },
  { name: 'KPK Boards', slug: 'kpk' },
  { name: 'Balochistan Boards', slug: 'balochistan' },
  { name: 'Federal Boards', slug: 'federal' },
];

const BOARD_TYPES = [
  { slug: '', name: 'All Types' },
  { slug: 'bise', name: 'BISE (Boards)' },
  { slug: 'fbise', name: 'FBISE' },
  { slug: 'akueb', name: 'AKUEB' },
];

const PROVINCE_CITIES: Record<string, string[]> = {
  'punjab': ['Lahore', 'Rawalpindi', 'Faisalabad', 'Multan', 'Gujranwala', 'Sargodha', 'Sahiwal', 'Bahawalpur'],
  'sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana'],
  'kpk': ['Peshawar', 'Abbottabad', 'Mardan', 'Kohat', 'Dera Ismail Khan'],
  'balochistan': ['Quetta', 'Loralai', 'Khuzdar', 'Turbat'],
  'federal': ['Islamabad'],
};

const BOARD_ESTABLISHED: Record<string, string> = {
  'bise-lahore': '1954',
  'bise-karachi': '1950',
  'bise-rawalpindi': '1978',
  'bise-multan': '1968',
  'bise-faisalabad': '1988',
  'bise-gujranwala': '1990',
  'bise-sargodha': '1968',
  'bise-sahiwal': '2012',
  'bise-bahawalpur': '1998',
  'fbise': '1975',
  'akueb': '2002',
};

// ✅ ADDED: Cached version of getBoards
async function getBoards(filters: {
  province?: string;
  type?: string;
  q?: string;
}) {
  const cacheKey = `boards-list-${JSON.stringify(filters)}`;
  
  return unstable_cache(
    async () => {
      try {
        const conditions: (ReturnType<typeof eq> | ReturnType<typeof like>)[] = [];
        conditions.push(eq(boards.status, true));

        if (filters.type && filters.type !== '') {
          if (filters.type === 'bise') {
            conditions.push(like(boards.name, '%BISE%'));
          } else if (filters.type === 'fbise') {
            conditions.push(like(boards.name, '%FBISE%'));
          } else if (filters.type === 'akueb') {
            conditions.push(like(boards.name, '%AKUEB%'));
          }
        }

        if (filters.q) {
          const searchTerm = `%${filters.q}%`;
          conditions.push(like(boards.name, searchTerm));
        }

        const boardsData = await db
          .select({
            id: boards.id,
            name: boards.name,
            slug: boards.slug,
            city: cities.name,
            citySlug: cities.slug,
            website: boards.website,
            description: boards.description,
            resultsCount: sql<number>`count(DISTINCT ${results.id})`,
            dateSheetsCount: sql<number>`count(DISTINCT ${dateSheets.id})`,
            latestResultYear: sql<number | null>`max(${results.year})`,
          })
          .from(boards)
          .leftJoin(cities, eq(boards.cityId, cities.id))
          .leftJoin(results, eq(boards.id, results.boardId))
          .leftJoin(dateSheets, eq(boards.id, dateSheets.boardId))
          .where(and(...conditions))
          .groupBy(
            boards.id, boards.name, boards.slug,
            cities.name, cities.slug,
            boards.website, boards.description
          )
          .orderBy(boards.name)
          .limit(100);

        const boardsWithDetails = boardsData.map(board => ({
          ...board,
          resultsCount: board.resultsCount || 0,
          dateSheetsCount: board.dateSheetsCount || 0,
          established: BOARD_ESTABLISHED[board.slug] || 'N/A',
        }));

        let filteredBoards = boardsWithDetails;
        if (filters.province && filters.province !== '') {
          const citiesList = PROVINCE_CITIES[filters.province] || [];
          filteredBoards = boardsWithDetails.filter(board => 
            board.city && citiesList.includes(board.city)
          );
        }

        return filteredBoards;
      } catch (error) {
        console.error('[CACHE] Failed to fetch boards:', error);
        return [];
      }
    },
    [cacheKey],
    {
      revalidate: 86400, // 24 hours as requested
      tags: ['boards-list'],
    }
  )();
}

// ✅ ADDED: Cached version of getStats
async function getStats(): Promise<Stats> {
  return unstable_cache(
    async () => {
      try {
        const [totalBoardsResult, totalCitiesResult, boardsWithResultsResult] = await Promise.all([
          db.select({ count: count() }).from(boards).where(eq(boards.status, true)),
          db.select({ count: count() }).from(cities).where(eq(cities.status, true)),
          db
            .select({ count: sql<number>`COUNT(DISTINCT ${boards.id})` })
            .from(boards)
            .innerJoin(results, eq(boards.id, results.boardId))
            .where(eq(results.year, 2026))
            .then(result => Number(result[0]?.count) || 0),
        ]);

        return {
          totalBoards: Number(totalBoardsResult[0]?.count) || 0,
          totalCities: Number(totalCitiesResult[0]?.count) || 0,
          boardsWithResults: boardsWithResultsResult,
        };
      } catch (error) {
        console.error('[CACHE] Failed to fetch stats:', error);
        return { totalBoards: 0, totalCities: 0, boardsWithResults: 0 };
      }
    },
    ['boards-stats'],
    {
      revalidate: 86400, // 24 hours
      tags: ['boards-stats'],
    }
  )();
}

function Breadcrumbs({ filters }: { filters: { province?: string; type?: string; q?: string } }) {
  const items = [
    { name: 'Home', url: '/' },
    { name: 'Boards', url: '/boards' },
  ];

  if (filters.province) {
    const province = PROVINCES.find(p => p.slug === filters.province);
    if (province) items.push({ name: province.name, url: `/boards?province=${filters.province}` });
  }
  if (filters.type && filters.type !== '') {
    const type = BOARD_TYPES.find(t => t.slug === filters.type);
    if (type) items.push({ name: type.name, url: `/boards?type=${filters.type}` });
  }
  if (filters.q) {
    items.push({ name: `Search: "${filters.q}"`, url: `/boards?q=${filters.q}` });
  }

  return (
    <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.url} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gray-400">/</span>}
            {index === items.length - 1 ? (
              <span className="text-gray-700 font-medium">{item.name}</span>
            ) : (
              <Link href={item.url} className="hover:text-blue-600 transition-colors">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ✅ FIXED: Moved data fetching OUT of the component return
async function getPageData(filters: {
  province?: string;
  type?: string;
  q?: string;
}) {
  const [boardsList, stats] = await Promise.all([
    getBoards(filters),
    getStats(),
  ]);
  return { boards: boardsList, stats };
}

// ✅ FIXED: Error boundary component for rendering errors
function ErrorState() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <div className="text-6xl mb-4" aria-hidden="true">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to load boards</h2>
          <p className="text-gray-600">Please try again later</p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}

// ✅ FIXED: Main component with proper error handling (NO try/catch wrapping JSX)
export default async function BoardsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // ✅ Data fetching happens BEFORE any JSX return
  let pageData;
  let fetchError = false;
  
  try {
    const params = await searchParams || {};
    
    const filters = {
      province: typeof params.province === 'string' ? params.province : '',
      type: typeof params.type === 'string' ? params.type : '',
      q: typeof params.q === 'string' ? params.q : '',
    };

    pageData = await getPageData(filters);
  } catch (error) {
    console.error('[PAGE] Failed to load boards page:', error);
    fetchError = true;
  }

  // ✅ Return error state if fetch failed
  if (fetchError || !pageData) {
    return <ErrorState />;
  }

  const { boards: boardsList, stats } = pageData;
  const filters = {
    province: (await searchParams)?.province as string || '',
    type: (await searchParams)?.type as string || '',
    q: (await searchParams)?.q as string || '',
  };

  const buildUrl = (key: string, value: string) => {
    const urlParams = new URLSearchParams();
    if (filters.province && key !== 'province') urlParams.set('province', filters.province);
    if (filters.type && key !== 'type') urlParams.set('type', filters.type);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (value) urlParams.set(key, value);
    return urlParams.toString() ? `/boards?${urlParams.toString()}` : '/boards';
  };

  const featuredBoards = boardsList.slice(0, 4);
  const regularBoards = boardsList.slice(4);

  // ✅ JSX return with NO try/catch wrapping
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ✅ SEO: Added cache header */}
      <meta httpEquiv="Cache-Control" content="public, s-maxage=86400, stale-while-revalidate=86400" />
      
      <section className="bg-gradient-to-r from-amber-700 to-orange-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Education Boards in Pakistan 2026
            </h1>
            <p className="text-xl text-amber-100 mb-8">
              BISE • FBISE • AKUEB • Results • Date Sheets • Model Papers
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.totalBoards}+</div>
                <div className="text-sm text-amber-200">Education Boards</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.totalCities}+</div>
                <div className="text-sm text-amber-200">Cities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.boardsWithResults}</div>
                <div className="text-sm text-amber-200">Announced Results 2026</div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              <form action="/boards" method="GET" className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">🔍</span>
                  <input
                    type="text"
                    name="q"
                    defaultValue={filters.q}
                    placeholder="Search by board name..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition"
                >
                  Search
                </button>
              </form>
              <p className="text-sm text-amber-200 mt-2">
                Popular: BISE Lahore • FBISE • BISE Karachi • BISE Rawalpindi
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs filters={filters} />
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          <aside className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-200">
              <h2 className="font-bold text-lg mb-4">Filter Boards</h2>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Province</h3>
                <div className="space-y-2">
                  {PROVINCES.map((province) => (
                    <Link
                      key={province.slug}
                      href={buildUrl('province', province.slug)}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.province === province.slug ? 'bg-amber-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {province.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Board Type</h3>
                <div className="space-y-2">
                  {BOARD_TYPES.map((type) => (
                    <Link
                      key={type.slug}
                      href={buildUrl('type', type.slug)}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.type === type.slug ? 'bg-amber-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {type.name}
                    </Link>
                  ))}
                </div>
              </div>

              {(filters.province || filters.type || filters.q) && (
                <Link
                  href="/boards"
                  className="block text-center text-sm text-amber-600 hover:underline mt-4 pt-3 border-t"
                >
                  Clear all filters
                </Link>
              )}
            </div>
          </aside>

          <div className="flex-1">
            
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {boardsList.length} Education Boards Found
                  </h2>
                  <p className="text-sm text-gray-500">
                    {filters.province && `Province: ${PROVINCES.find(p => p.slug === filters.province)?.name}`}
                    {filters.type && ` • Type: ${BOARD_TYPES.find(t => t.slug === filters.type)?.name}`}
                    {filters.q && ` • Search: &quot;${filters.q}&quot;`}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{boardsList.filter(b => b.resultsCount > 0).length}</span> with 2026 results
                </div>
              </div>
            </div>

            {featuredBoards.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-amber-500 mr-2" aria-hidden="true">🏆</span>
                  Major Education Boards
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredBoards.map((board) => (
                    <article key={board.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden">
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <Link href={`/boards/${board.slug}`}>
                            <h4 className="font-bold text-gray-900 mb-1 hover:text-amber-600 transition">
                              {board.name}
                            </h4>
                          </Link>
                          {board.established !== 'N/A' && (
                            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">
                              Est. {board.established}
                            </span>
                          )}
                        </div>
                        {board.city && (
                          <p className="text-sm text-gray-600 mb-2">
                            📍 {board.city}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          <span>📊 {board.resultsCount} Results</span>
                          <span>📅 {board.dateSheetsCount} Date Sheets</span>
                          {board.latestResultYear && (
                            <span className="text-green-600">Latest: {board.latestResultYear}</span>
                          )}
                        </div>
                        {board.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{board.description}</p>
                        )}
                        <div className="flex gap-3">
                          <Link 
                            href={`/boards/${board.slug}`}
                            className="text-sm text-amber-600 hover:underline font-medium"
                          >
                            Board Details →
                          </Link>
                          <Link 
                            href={`/boards/${board.slug}/results`}
                            className="text-sm text-blue-600 hover:underline font-medium"
                          >
                            Results
                          </Link>
                          <Link 
                            href={`/boards/${board.slug}/date-sheets`}
                            className="text-sm text-green-600 hover:underline font-medium"
                          >
                            Date Sheets
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">All Education Boards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {regularBoards.length > 0 ? (
                  regularBoards.map((board) => (
                    <article key={board.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden">
                      <div className="p-5">
                        <Link href={`/boards/${board.slug}`}>
                          <h4 className="font-bold text-gray-900 mb-1 hover:text-amber-600 transition">
                            {board.name}
                          </h4>
                        </Link>
                        {board.city && (
                          <p className="text-sm text-gray-600 mb-2">
                            📍 {board.city}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          <span>📊 {board.resultsCount} Results</span>
                          <span>📅 {board.dateSheetsCount} Date Sheets</span>
                        </div>
                        <div className="flex gap-3">
                          <Link 
                            href={`/boards/${board.slug}`}
                            className="text-sm text-amber-600 hover:underline font-medium"
                          >
                            Details
                          </Link>
                          <Link 
                            href={`/boards/${board.slug}/results`}
                            className="text-sm text-blue-600 hover:underline font-medium"
                          >
                            Results
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="col-span-2 bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                    <div className="text-6xl mb-4" aria-hidden="true">📋</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Boards Found</h3>
                    <p className="text-gray-500 mb-6">
                      {filters.province || filters.type || filters.q
                        ? 'Try changing your filters'
                        : 'Check back soon for more boards'}
                    </p>
                    <Link
                      href="/boards"
                      className="inline-block px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                    >
                      View All Boards
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white py-12 border-t border-gray-200 mt-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Complete Guide to Education Boards in Pakistan
            </h2>
            
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>Education Boards in Pakistan</strong> are responsible for conducting examinations and announcing results 
                for Matric (SSC) and Intermediate (HSSC) levels. The main boards include 
                <Link href="/boards/bise-lahore" className="text-amber-600 hover:underline"> BISE Lahore</Link>, 
                <Link href="/boards/bise-karachi" className="text-amber-600 hover:underline"> BISE Karachi</Link>, 
                <Link href="/boards/bise-rawalpindi" className="text-amber-600 hover:underline"> BISE Rawalpindi</Link>, 
                <Link href="/boards/fbise" className="text-amber-600 hover:underline"> FBISE Islamabad</Link>, and 
                <Link href="/boards/akueb" className="text-amber-600 hover:underline"> AKUEB</Link>. 
                Each board operates under its respective province or territory.
              </p>
              
              <p>
                <strong>Board Results 2026</strong> are announced annually in July-September for annual examinations. 
                Students can check their results online by roll number. Most boards also offer gazettes, 
                position holders lists, and supplementary examination schedules.
              </p>
              
              <p>
                <strong>Date Sheets 2026</strong> are released 1-2 months before examinations. Check individual board 
                pages for latest date sheets for SSC Part 1 &amp; 2, HSSC Part 1 &amp; 2, and special examinations.
              </p>
              
              <p>
                <strong>Model Papers &amp; Past Papers</strong> are available for all boards to help students prepare 
                for examinations. These include solved papers, guess papers, and marking schemes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions About Education Boards
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">How many education boards are in Pakistan?</h3>
              <p className="text-gray-600 text-sm">
                There are over 30 education boards in Pakistan including provincial BISE boards, FBISE (Federal), and AKUEB (Aga Khan University Board).
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">When are board results announced?</h3>
              <p className="text-gray-600 text-sm">
                Matric (SSC) results are typically announced in July, while Intermediate (HSSC) results are announced in August-September each year.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">How can I check my board result online?</h3>
              <p className="text-gray-600 text-sm">
                Visit the respective board page, enter your roll number in the search box, and view your result instantly. Results are also available on official board websites.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">What is the difference between BISE and FBISE?</h3>
              <p className="text-gray-600 text-sm">
                BISE (Board of Intermediate and Secondary Education) operates at provincial level, while FBISE (Federal Board) caters to educational institutions in Islamabad, across Pakistan, and overseas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Education Boards in Pakistan 2026",
            "description": "Complete list of education boards in Pakistan with results, date sheets and announcements",
            "numberOfItems": boardsList.length,
            "itemListElement": boardsList.slice(0, 10).map((board, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "url": `https://www.nextid.pk/boards/${board.slug}`,
              "name": board.name
            }))
          })
        }}
      />
    </main>
  );
}