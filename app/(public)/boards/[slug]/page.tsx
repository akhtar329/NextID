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

// ==================== FORMAT SHORT DATE ====================
function formatShortDate(date: Date | null) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    month: 'short',
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
  province: string | null;
  establishedYear?: number | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
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
        province: cities.province,
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

  const title = `${board.name} - Results, Date Sheets & News | NextID.pk`;
  const description = `Find all ${board.name} results, date sheets, and announcements. ${board.cityName ? `Based in ${board.cityName}` : ''} Board of Intermediate and Secondary Education. Check exam results online.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    alternates: {
      canonical: `https://nextid.pk/boards/${board.slug}`,
    },
  };
}

// ==================== MAIN PAGE ====================
export default async function BoardDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const board = await getBoardBySlug(slug);
  if (!board) notFound();

  const [results, dateSheets, news, stats, years] = await Promise.all([
    getResults(board.id, 5),
    getDateSheets(board.id, 5),
    getNews(board.id, 5),
    getStats(board.id),
    getYears(board.id),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="text-gray-400">›</span>
            <Link href="/boards" className="text-gray-600 hover:text-blue-600">Boards</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">{board.name}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl">
            {/* Board Name */}
            <h1 className="text-5xl md:text-6xl font-bold mb-4">{board.name}</h1>
            
            {/* Location and Website */}
            <div className="flex flex-wrap items-center gap-4 text-lg mb-8">
              {board.cityName && (
                <span className="flex items-center gap-2">
                  <span>📍</span>
                  {board.cityName}{board.province ? `, ${board.province}` : ''}
                </span>
              )}
              {board.website && (
                <a href={board.website} target="_blank" rel="noopener" className="text-orange-200 hover:text-white flex items-center gap-2">
                  <span>🌐</span> Official Website
                </a>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{stats.totalResults}</div>
                <div className="text-sm text-orange-200">Total Results</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{stats.totalDateSheets}</div>
                <div className="text-sm text-orange-200">Date Sheets</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{stats.totalNews}</div>
                <div className="text-sm text-orange-200">Announcements</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{stats.recentResults}</div>
                <div className="text-sm text-orange-200">This Month</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Sidebar - Board Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Board Information</h2>
              
              <div className="space-y-4">
                {board.cityName && (
                  <div>
                    <div className="text-sm text-gray-500">Location</div>
                    <div className="font-semibold">
                      {board.cityName}
                      {board.province && <span className="text-gray-400">, {board.province}</span>}
                    </div>
                  </div>
                )}
                
                {board.website && (
                  <div>
                    <div className="text-sm text-gray-500">Website</div>
                    <a href={board.website} target="_blank" rel="noopener" className="text-orange-600 hover:underline text-sm">
                      {board.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                {years.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-500">Available Years</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {years.slice(0, 5).map(year => (
                        <Link
                          key={year}
                          href={`/boards/${board.slug}/results/${year}`}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-orange-100"
                        >
                          {year}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {board.description && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-sm text-gray-600">{board.description}</p>
                </div>
              )}

              {/* Quick Links */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="#results" className="block text-sm text-orange-600 hover:underline">
                    📊 Latest Results ({stats.totalResults})
                  </Link>
                  <Link href="#date-sheets" className="block text-sm text-orange-600 hover:underline">
                    📅 Date Sheets ({stats.totalDateSheets})
                  </Link>
                  <Link href="#news" className="block text-sm text-orange-600 hover:underline">
                    📢 News & Announcements ({stats.totalNews})
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Results, Date Sheets, News */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Results Section */}
            <section id="results">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Latest Results</h2>
                <Link href={`/boards/${board.slug}/results`} className="text-sm text-orange-600 hover:underline">
                  View All ({stats.totalResults})
                </Link>
              </div>

              {results.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {results.map((res) => (
                    <Link
                      key={res.id}
                      href={`/results/${res.slug}`}
                      className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-orange-600 mb-1">
                            {res.title}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>Year: {res.year}</span>
                            {res.resultDate && (
                              <>
                                <span>•</span>
                                <span>Announced: {formatShortDate(res.resultDate)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {res.isPopular && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                  <p className="text-gray-500">No results found for this board.</p>
                </div>
              )}
            </section>

            {/* Date Sheets Section */}
            {dateSheets.length > 0 && (
              <section id="date-sheets">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Date Sheets</h2>
                  <Link href={`/boards/${board.slug}/date-sheets`} className="text-sm text-orange-600 hover:underline">
                    View All ({stats.totalDateSheets})
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {dateSheets.map((ds) => (
                    <div
                      key={ds.id}
                      className="bg-white rounded-xl p-5 border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 mb-1">
                            {ds.title}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            {ds.examDate && (
                              <span>📅 Exam Date: {formatDate(ds.examDate)}</span>
                            )}
                            {ds.year && (
                              <>
                                <span>•</span>
                                <span>Year: {ds.year}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {ds.isPopular && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
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
            {news.length > 0 && (
              <section id="news">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">News & Announcements</h2>
                  <Link href={`/boards/${board.slug}/news`} className="text-sm text-orange-600 hover:underline">
                    View All ({stats.totalNews})
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {news.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition group"
                    >
                      <div className="flex items-start gap-3">
                        {item.isBreaking && (
                          <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full flex-shrink-0">
                            BREAKING
                          </span>
                        )}
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-orange-600 mb-1">
                            {item.title}
                          </h3>
                          {item.excerpt && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.excerpt}</p>
                          )}
                          {item.publishedAt && (
                            <p className="text-xs text-gray-500">
                              Published: {formatShortDate(item.publishedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* No Data State */}
            {results.length === 0 && dateSheets.length === 0 && news.length === 0 && (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Information Available</h3>
                <p className="text-gray-500">
                  We're currently updating information for {board.name}. Please check back later.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEO Content Section */}
      <section className="bg-white py-12 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-orange">
            <h2>About {board.name}</h2>
            
            <p>
              <strong>{board.name}</strong> is one of the leading education boards in {board.cityName || 'Pakistan'}. 
              It is responsible for conducting examinations and announcing results for secondary and higher secondary education.
            </p>

            {board.description && (
              <>
                <h3>Overview</h3>
                <p>{board.description}</p>
              </>
            )}

            <h3>Examinations</h3>
            <p>
              The board conducts annual examinations for Matric (SSC) and Intermediate (HSSC) levels. 
              With {stats.totalResults} results available, students can check their results online through the official portal.
            </p>

            <h3>Results and Date Sheets</h3>
            <p>
              {board.name} announces results for annual and supplementary examinations. We have <strong>{stats.totalResults} results</strong> 
              and <strong>{stats.totalDateSheets} date sheets</strong> available. Students can check their results by providing their roll numbers.
            </p>

            <h3>Latest Announcements</h3>
            <p>
              Stay updated with the latest news and announcements from {board.name}. We provide <strong>{stats.totalNews} news updates</strong> 
              regarding examination schedules, result dates, and important notifications.
            </p>

            <h3>Contact Information</h3>
            <p>
              For any queries regarding examinations, results, or date sheets, students can visit the official website or contact the board office.
            </p>

            <p className="text-sm text-gray-500 mt-8">
              Last updated: {new Date().toLocaleDateString('en-PK')}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}