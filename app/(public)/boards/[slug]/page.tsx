// app/(public)/boards/[slug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { boards, cities, results, dateSheets, news } from '@/app/lib/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';

// ==================== FORMAT DATE FUNCTION ====================
function formatDate(date: Date | null) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date: Date | null) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ==================== TYPES ====================
interface BoardDetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  cityId: number | null;
  cityName: string | null;
  citySlug: string | null;
  cityDescription: string | null;
  province: string | null;
  establishedYear: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
}

interface Result {
  id: number;
  title: string;
  slug: string;
  year: number;
  resultDate: Date | null;
  programName: string | null;
  isPopular: boolean | null;
}

interface DateSheet {
  id: number;
  title: string;
  slug: string;
  examDate: Date | null;
  year: number;
  programName: string | null;
  isPopular: boolean | null;
}

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
  isBreaking: boolean | null;
}

// ==================== GET BOARD BY SLUG ====================
async function getBoardBySlug(slug: string): Promise<BoardDetail | null> {
  try {
    const [board] = await db
      .select({
        id: boards.id,
        name: boards.name,
        slug: boards.slug,
        description: boards.description,
        website: boards.website,
        cityId: boards.cityId,
        cityName: cities.name,
        citySlug: cities.slug,
        cityDescription: cities.description,
        province: cities.province,
        establishedYear: boards.establishedYear,
        contactEmail: boards.contactEmail,
        contactPhone: boards.contactPhone,
        address: boards.address,
        metaTitle: boards.metaTitle,
        metaDescription: boards.metaDescription,
        metaKeywords: boards.metaKeywords,
      })
      .from(boards)
      .leftJoin(cities, eq(boards.cityId, cities.id))
      .where(eq(boards.slug, slug))
      .limit(1);

    return board || null;
  } catch (error) {
    console.error('Error fetching board:', error);
    return null;
  }
}

// ==================== GET RESULTS ====================
async function getResults(boardId: number, limit = 5): Promise<Result[]> {
  try {
    return await db
      .select({
        id: results.id,
        title: results.title,
        slug: results.slug,
        year: results.year,
        resultDate: results.resultDate,
        programName: sql<string>`NULL`,
        isPopular: results.isPopular,
      })
      .from(results)
      .where(eq(results.boardId, boardId))
      .orderBy(desc(results.resultDate), desc(results.year))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching results:', error);
    return [];
  }
}

// ==================== GET DATE SHEETS ====================
async function getDateSheets(boardId: number, limit = 5): Promise<DateSheet[]> {
  try {
    return await db
      .select({
        id: dateSheets.id,
        title: dateSheets.title,
        slug: sql<string>`NULL`,
        examDate: dateSheets.examDate,
        year: sql<number>`EXTRACT(YEAR FROM ${dateSheets.examDate})`,
        programName: sql<string>`NULL`,
        isPopular: dateSheets.isPopular,
      })
      .from(dateSheets)
      .where(eq(dateSheets.boardId, boardId))
      .orderBy(desc(dateSheets.examDate))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching date sheets:', error);
    return [];
  }
}

// ==================== GET NEWS ====================
async function getNews(boardId: number, limit = 5): Promise<NewsItem[]> {
  try {
    return await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        excerpt: news.excerpt,
        publishedAt: news.publishedAt,
        isBreaking: news.isBreaking,
      })
      .from(news)
      .where(eq(news.boardId, boardId))
      .orderBy(desc(news.publishedAt))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

// ==================== GET STATS ====================
async function getStats(boardId: number) {
  try {
    const [resultsCount] = await db
      .select({ count: count() })
      .from(results)
      .where(eq(results.boardId, boardId));

    const [dateSheetsCount] = await db
      .select({ count: count() })
      .from(dateSheets)
      .where(eq(dateSheets.boardId, boardId));

    const [newsCount] = await db
      .select({ count: count() })
      .from(news)
      .where(eq(news.boardId, boardId));

    const [recentResults] = await db
      .select({ count: count() })
      .from(results)
      .where(
        and(
          eq(results.boardId, boardId),
          sql`${results.resultDate} > NOW() - INTERVAL '30 days'`
        )
      );

    return {
      totalResults: Number(resultsCount?.count) || 0,
      totalDateSheets: Number(dateSheetsCount?.count) || 0,
      totalNews: Number(newsCount?.count) || 0,
      recentResults: Number(recentResults?.count) || 0,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { totalResults: 0, totalDateSheets: 0, totalNews: 0, recentResults: 0 };
  }
}

// ==================== GET YEARS ====================
async function getYears(boardId: number) {
  try {
    const years = await db
      .select({ year: results.year })
      .from(results)
      .where(eq(results.boardId, boardId))
      .groupBy(results.year)
      .orderBy(desc(results.year));

    return years.map(y => y.year);
  } catch (error) {
    console.error('Error fetching years:', error);
    return [];
  }
}

// ==================== GENERATE METADATA ====================
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  if (!board) {
    return {
      title: 'Board Not Found | NextID.pk',
      description: 'The requested education board could not be found.',
    };
  }

  const title = board.metaTitle || `${board.name} - Results, Date Sheets & News | NextID.pk`;
  const description = board.metaDescription || `Find all ${board.name} results, date sheets, and announcements. ${board.cityName ? `Based in ${board.cityName}.` : ''} Check exam results online.`;

  return {
    title,
    description,
    keywords: board.metaKeywords || `${board.name}, ${board.name} results, ${board.name} date sheets, education board Pakistan`,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    alternates: {
      canonical: `https://www.nextid.pk/boards/${board.slug}`,
    },
  };
}

// ==================== MAIN PAGE ====================
export default async function BoardDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const board = await getBoardBySlug(slug);
  if (!board) notFound();

  const [results, dateSheets, newsList, stats, years] = await Promise.all([
    getResults(board.id, 5),
    getDateSheets(board.id, 5),
    getNews(board.id, 5),
    getStats(board.id),
    getYears(board.id),
  ]);

  // Helper function to format description with paragraphs
  const formatDescription = (text: string | null) => {
    if (!text) return null;
    return text.split('\n\n').map((paragraph, idx) => (
      <p key={idx} className="text-gray-600 leading-relaxed mb-4 last:mb-0">
        {paragraph}
      </p>
    ));
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      
      {/* Hero Section - Premium Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-red-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-xs font-medium text-white">Educational Board</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              {board.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-white/90">
              {board.cityName && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{board.cityName}{board.province ? `, ${board.province}` : ''}</span>
                </div>
              )}
              {board.establishedYear && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Est. {board.establishedYear}</span>
                </div>
              )}
              {board.website && (
                <a href={board.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9" />
                  </svg>
                  <span>Official Website</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x">
            <div className="py-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalResults}</div>
              <div className="text-xs text-gray-500">Total Results</div>
            </div>
            <div className="py-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalDateSheets}</div>
              <div className="text-xs text-gray-500">Date Sheets</div>
            </div>
            <div className="py-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalNews}</div>
              <div className="text-xs text-gray-500">Announcements</div>
            </div>
            <div className="py-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.recentResults}</div>
              <div className="text-xs text-gray-500">This Month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-24 space-y-6">
              
              {/* Contact Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Information
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {board.address && (
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Address</div>
                        <div className="text-sm text-gray-700 mt-1">{board.address}</div>
                      </div>
                    </div>
                  )}
                  {board.contactPhone && (
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Phone</div>
                        <a href={`tel:${board.contactPhone}`} className="text-sm text-orange-600 hover:underline mt-1 block">
                          {board.contactPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  {board.contactEmail && (
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Email</div>
                        <a href={`mailto:${board.contactEmail}`} className="text-sm text-orange-600 hover:underline mt-1 block break-all">
                          {board.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="#results" className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 transition group">
                    <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 group-hover:bg-orange-200">📊</span>
                    <span className="text-sm text-gray-700 group-hover:text-orange-600">Latest Results ({stats.totalResults})</span>
                  </Link>
                  <Link href="#date-sheets" className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 transition group">
                    <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 group-hover:bg-orange-200">📅</span>
                    <span className="text-sm text-gray-700 group-hover:text-orange-600">Date Sheets ({stats.totalDateSheets})</span>
                  </Link>
                  <Link href="#news" className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 transition group">
                    <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 group-hover:bg-orange-200">📢</span>
                    <span className="text-sm text-gray-700 group-hover:text-orange-600">News & Announcements ({stats.totalNews})</span>
                  </Link>
                </div>
              </div>

              {/* Years */}
              {years.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Browse by Year</h3>
                  <div className="flex flex-wrap gap-2">
                    {years.map(year => (
                      <Link
                        key={year}
                        href={`/boards/${board.slug}/results/${year}`}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-orange-100 hover:text-orange-600 transition"
                      >
                        {year}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-8">
            
            {/* Results Section */}
            <section id="results">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                  Latest Results
                </h2>
                {stats.totalResults > 0 && (
                  <Link href={`/boards/${board.slug}/results`} className="text-sm text-orange-600 hover:underline font-medium">
                    View All →
                  </Link>
                )}
              </div>

              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((res) => (
                    <Link
                      key={res.id}
                      href={`/results/${res.slug}`}
                      className="block bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition mb-2">
                            {res.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md">Year: {res.year}</span>
                            {res.resultDate && (
                              <span className="text-gray-500">Announced: {formatShortDate(res.resultDate)}</span>
                            )}
                          </div>
                        </div>
                        {res.isPopular && (
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                  <div className="text-5xl mb-4">📋</div>
                  <p className="text-gray-500">No results found for {board.name}.</p>
                </div>
              )}
            </section>

            {/* About Section with formatted paragraphs */}
            {(board.description || board.cityDescription || board.cityName) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span>📖</span> About {board.name}
                  </h2>
                </div>
                <div className="p-6">
                  {board.description && (
                    <div className="prose prose-orange max-w-none">
                      {formatDescription(board.description)}
                    </div>
                  )}
                  {board.cityName && board.cityDescription && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span>📍</span> About {board.cityName}
                      </h3>
                      <div className="prose prose-gray max-w-none">
                        {formatDescription(board.cityDescription)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date Sheets Section */}
            {dateSheets.length > 0 && (
              <section id="date-sheets">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                    Date Sheets
                  </h2>
                  <Link href={`/boards/${board.slug}/date-sheets`} className="text-sm text-orange-600 hover:underline font-medium">
                    View All →
                  </Link>
                </div>

                <div className="space-y-4">
                  {dateSheets.map((ds) => (
                    <div
                      key={ds.id}
                      className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {ds.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            {ds.examDate && (
                              <span className="flex items-center gap-1 text-gray-600">
                                📅 Exam Date: {formatDate(ds.examDate)}
                              </span>
                            )}
                            {ds.year && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md">Year: {ds.year}</span>
                            )}
                          </div>
                        </div>
                        {ds.isPopular && (
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* News Section */}
            {newsList.length > 0 && (
              <section id="news">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                    News & Announcements
                  </h2>
                  <Link href={`/boards/${board.slug}/news`} className="text-sm text-orange-600 hover:underline font-medium">
                    View All →
                  </Link>
                </div>

                <div className="space-y-4">
                  {newsList.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="block bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all group"
                    >
                      <div className="flex gap-4">
                        {item.isBreaking && (
                          <div className="flex-shrink-0">
                            <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                              BREAKING
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition mb-2">
                            {item.title}
                          </h3>
                          {item.excerpt && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.excerpt}</p>
                          )}
                          {item.publishedAt && (
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatShortDate(item.publishedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* No Data State */}
            {results.length === 0 && dateSheets.length === 0 && newsList.length === 0 && (
              <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Information Coming Soon</h3>
                <p className="text-gray-500">We're currently updating information for {board.name}. Please check back later.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}