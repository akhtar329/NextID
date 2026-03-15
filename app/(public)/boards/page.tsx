// app/(public)/boards/page.tsx
// ✅ Professional Boards Page - TypeScript Errors Fixed

import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { boards, cities, results, dateSheets } from '@/app/lib/schema';
import { eq, desc, like, and, or, sql } from 'drizzle-orm';

// ==================== METADATA ====================
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

// ==================== TYPES ====================
interface Board {
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

interface City {
  id: number;
  name: string;
  slug: string;
}

// ==================== CONSTANTS ====================
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

// Province to city mapping
const PROVINCE_CITIES: Record<string, string[]> = {
  'punjab': ['Lahore', 'Rawalpindi', 'Faisalabad', 'Multan', 'Gujranwala', 'Sargodha', 'Sahiwal', 'Bahawalpur'],
  'sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana'],
  'kpk': ['Peshawar', 'Abbottabad', 'Mardan', 'Kohat', 'Dera Ismail Khan'],
  'balochistan': ['Quetta', 'Loralai', 'Khuzdar', 'Turbat'],
  'federal': ['Islamabad'],
};

// Mock established years
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

// ==================== DATA FETCHING ====================
async function getBoards(filters: {
  province?: string;
  type?: string;
  q?: string;
}) {
  try {
    const conditions: any[] = [];

    // Province filter (based on city) - FIXED
    if (filters.province && filters.province !== '') {
      const citiesList = PROVINCE_CITIES[filters.province] || [];
      if (citiesList.length > 0) {
        // Join with cities table and filter by city names
        const cityConditions = citiesList.map(cityName => 
          eq(cities.name, cityName)
        );
        // This will be handled by joining with cities table
        // For now, we'll skip province filter if no join
      }
    }

    // Board type filter
    if (filters.type && filters.type !== '') {
      if (filters.type === 'bise') {
        conditions.push(like(boards.name, '%BISE%'));
      } else if (filters.type === 'fbise') {
        conditions.push(like(boards.name, '%FBISE%'));
      } else if (filters.type === 'akueb') {
        conditions.push(like(boards.name, '%AKUEB%'));
      }
    }

    // Search filter
    if (filters.q) {
      const searchTerm = `%${filters.q}%`;
      // For search without join, just search board name
      conditions.push(like(boards.name, searchTerm));
    }

    const data = await db
      .select({
        id: boards.id,
        name: boards.name,
        slug: boards.slug,
        city: cities.name,
        citySlug: cities.slug,
        website: boards.website,
        description: boards.description,
        resultsCount: sql<number>`(
          SELECT COUNT(*)
          FROM results
          WHERE results.board_id = ${boards.id}
        )`,
        dateSheetsCount: sql<number>`(
          SELECT COUNT(*)
          FROM date_sheets
          WHERE date_sheets.board_id = ${boards.id}
        )`,
        latestResultYear: sql<number | null>`(
          SELECT MAX(results.year)
          FROM results
          WHERE results.board_id = ${boards.id}
        )`,
      })
      .from(boards)
      .leftJoin(cities, eq(boards.cityId, cities.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(boards.name)
      .limit(50);

    // Add established year
    const boardsWithDetails = data.map(board => ({
      ...board,
      established: BOARD_ESTABLISHED[board.slug] || 'N/A',
    }));

    // Apply province filter after fetch (simpler approach)
    let filteredBoards = boardsWithDetails;
    if (filters.province && filters.province !== '') {
      const citiesList = PROVINCE_CITIES[filters.province] || [];
      filteredBoards = boardsWithDetails.filter(board => 
        board.city && citiesList.includes(board.city)
      );
    }

    return filteredBoards;
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
}

async function getStats() {
  try {
    const totalBoards = await db.$count(boards);
    const totalCities = await db.$count(cities);
    
    // Boards with recent results (2026)
    const boardsWithResults = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${boards.id})` })
      .from(boards)
      .innerJoin(results, eq(boards.id, results.boardId))
      .where(eq(results.year, 2026))
      .then(result => Number(result[0]?.count) || 0);

    return {
      totalBoards,
      totalCities,
      boardsWithResults,
    };
  } catch (error) {
    return { totalBoards: 0, totalCities: 0, boardsWithResults: 0 };
  }
}

// ==================== BREADCRUMBS ====================
function Breadcrumbs({ filters }: { filters: any }) {
  const items = [
    { name: 'Home', url: '/' },
    { name: 'Boards', url: '/boards' },
  ];

  if (filters.province) {
    const province = PROVINCES.find(p => p.slug === filters.province);
    if (province) items.push({ name: province.name, url: `/boards?province=${filters.province}` });
  }

  return (
    <nav className="text-sm text-gray-500 mb-4">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.url} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gray-400">/</span>}
            {index === items.length - 1 ? (
              <span className="text-gray-700 font-medium">{item.name}</span>
            ) : (
              <Link href={item.url} className="hover:text-blue-600">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ==================== MAIN PAGE ====================
export default async function BoardsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams || {};
  
  const filters = {
    province: typeof params.province === 'string' ? params.province : '',
    type: typeof params.type === 'string' ? params.type : '',
    q: typeof params.q === 'string' ? params.q : '',
  };

  const [boards, stats] = await Promise.all([
    getBoards(filters),
    getStats(),
  ]);

  const featuredBoards = boards.slice(0, 4);
  const regularBoards = boards.slice(4);

  const buildUrl = (key: string, value: string) => {
    const urlParams = new URLSearchParams();
    if (filters.province && key !== 'province') urlParams.set('province', filters.province);
    if (filters.type && key !== 'type') urlParams.set('type', filters.type);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (value) urlParams.set(key, value);
    return urlParams.toString() ? `/boards?${urlParams.toString()}` : '/boards';
  };

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-amber-700 to-orange-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Education Boards in Pakistan 2026
            </h1>
            <p className="text-xl text-amber-100 mb-8">
              BISE • FBISE • AKUEB • Results • Date Sheets • Model Papers
            </p>
            
            {/* Stats Cards */}
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

            {/* Search Form */}
            <div className="max-w-2xl mx-auto">
              <form action="/boards" method="GET" className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        
        <Breadcrumbs filters={filters} />
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-200">
              <h2 className="font-bold text-lg mb-4">Filter Boards</h2>
              
              {/* Province Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Province</h3>
                <div className="space-y-2">
                  {PROVINCES.map((province) => (
                    <Link
                      key={province.slug}
                      href={buildUrl('province', province.slug)}
                      className={`block px-3 py-2 rounded-lg text-sm ${
                        filters.province === province.slug ? 'bg-amber-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {province.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Board Type Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Board Type</h3>
                <div className="space-y-2">
                  {BOARD_TYPES.map((type) => (
                    <Link
                      key={type.slug}
                      href={buildUrl('type', type.slug)}
                      className={`block px-3 py-2 rounded-lg text-sm ${
                        filters.type === type.slug ? 'bg-amber-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {type.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
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

          {/* Main Content - Boards List */}
          <div className="flex-1">
            
            {/* Results Header */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {boards.length} Education Boards Found
                  </h2>
                  <p className="text-sm text-gray-500">
                    {filters.province && `Province: ${PROVINCES.find(p => p.slug === filters.province)?.name}`}
                    {filters.type && ` • Type: ${BOARD_TYPES.find(t => t.slug === filters.type)?.name}`}
                    {filters.q && ` • Search: "${filters.q}"`}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{boards.filter(b => b.resultsCount > 0).length}</span> with 2026 results
                </div>
              </div>
            </div>

            {/* Featured Boards */}
            {featuredBoards.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-amber-500 mr-2">🏆</span>
                  Major Education Boards
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredBoards.map((board) => (
                    <article key={board.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden">
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <Link href={`/boards/${board.slug}`}>
                            <h4 className="font-bold text-gray-900 mb-1 hover:text-amber-600">
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

            {/* All Boards */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">All Education Boards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {regularBoards.length > 0 ? (
                  regularBoards.map((board) => (
                    <article key={board.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden">
                      <div className="p-5">
                        <Link href={`/boards/${board.slug}`}>
                          <h4 className="font-bold text-gray-900 mb-1 hover:text-amber-600">
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
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Boards Found</h3>
                    <p className="text-gray-500 mb-6">
                      {filters.province || filters.type || filters.q
                        ? 'Try changing your filters'
                        : 'Check back soon for more boards'}
                    </p>
                    <Link
                      href="/boards"
                      className="inline-block px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
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

      {/* SEO Content Section */}
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
                pages for latest date sheets for SSC Part 1 & 2, HSSC Part 1 & 2, and special examinations.
              </p>
              
              <p>
                <strong>Model Papers & Past Papers</strong> are available for all boards to help students prepare 
                for examinations. These include solved papers, guess papers, and marking schemes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
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

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Education Boards in Pakistan 2026",
            "description": "Complete list of education boards in Pakistan with results, date sheets and announcements",
            "numberOfItems": boards.length,
            "itemListElement": boards.slice(0, 10).map((board, index) => ({
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