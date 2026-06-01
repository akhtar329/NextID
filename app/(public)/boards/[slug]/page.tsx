// app/(public)/boards/[slug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db/db';
import { boards, cities, results, dateSheets, news, seoMetadata } from '@/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';

export const revalidate = 86400;
 
export const fetchCache = 'force-cache';
// remove dynamicparams= true

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

function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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
  establishedYear: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  seo?: {
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    robots: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
  } | null;
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

interface BoardStats {
  totalResults: number;
  totalDateSheets: number;
  totalNews: number;
  recentResults: number;
}

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
        establishedYear: boards.establishedYear,
        contactEmail: boards.contactEmail,
        contactPhone: boards.contactPhone,
        address: boards.address,
      })
      .from(boards)
      .leftJoin(cities, eq(boards.cityId, cities.id))
      .where(eq(boards.slug, slug))
      .limit(1);

    if (!board) return null;

    const [seo] = await db
      .select({
        metaTitle: seoMetadata.metaTitle,
        metaDescription: seoMetadata.metaDescription,
        canonicalUrl: seoMetadata.canonicalUrl,
        robots: seoMetadata.robots,
        ogTitle: seoMetadata.ogTitle,
        ogDescription: seoMetadata.ogDescription,
        ogImage: seoMetadata.ogImage,
      })
      .from(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityType, 'board'),
          eq(seoMetadata.entityId, board.id)
        )
      )
      .limit(1);

    return {
      ...board,
      seo: seo || null,
    };
  } catch {
    return null;
  }
}

async function getBoardData(boardId: number) {
  const [resultsList, dateSheetsList, newsList, stats, years] = await Promise.all([
    db
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
      .limit(5),
    
    db
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
      .limit(5),
    
    db
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
      .limit(5),
    
    (async () => {
      const [resultsCount, dateSheetsCount, newsCount, recentResults] = await Promise.all([
        db.select({ count: count() }).from(results).where(eq(results.boardId, boardId)),
        db.select({ count: count() }).from(dateSheets).where(eq(dateSheets.boardId, boardId)),
        db.select({ count: count() }).from(news).where(eq(news.boardId, boardId)),
        db
          .select({ count: count() })
          .from(results)
          .where(
            and(
              eq(results.boardId, boardId),
              sql`${results.resultDate} > NOW() - INTERVAL '30 days'`
            )
          ),
      ]);

      return {
        totalResults: Number(resultsCount[0]?.count) || 0,
        totalDateSheets: Number(dateSheetsCount[0]?.count) || 0,
        totalNews: Number(newsCount[0]?.count) || 0,
        recentResults: Number(recentResults[0]?.count) || 0,
      };
    })(),
    
    db
      .select({ year: results.year })
      .from(results)
      .where(eq(results.boardId, boardId))
      .groupBy(results.year)
      .orderBy(desc(results.year))
      .then(years => years.map(y => y.year)),
  ]);

  return {
    results: resultsList,
    dateSheets: dateSheetsList,
    news: newsList,
    stats,
    years,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  if (!board) {
    return {
      title: 'Board Not Found | NextID.pk',
      description: 'The requested education board could not be found.',
    };
  }

  const title = board.seo?.metaTitle || `${board.name} - Results, Date Sheets & News | NextID.pk`;
  const description = board.seo?.metaDescription || `Find all ${board.name} results, date sheets, and announcements. ${board.cityName ? `Based in ${board.cityName}.` : ''} Check exam results online.`;

  return {
    title,
    description,
    openGraph: {
      title: board.seo?.ogTitle || title,
      description: board.seo?.ogDescription || description,
      images: board.seo?.ogImage ? [{ url: board.seo.ogImage }] : undefined,
      type: 'website',
    },
    alternates: {
      canonical: board.seo?.canonicalUrl || `https://www.nextid.pk/boards/${board.slug}`,
    },
    robots: board.seo?.robots ? {
      index: board.seo.robots.includes('index'),
      follow: board.seo.robots.includes('follow'),
    } : { index: true, follow: true },
  };
}

function formatDescription(text: string | null): React.ReactNode {
  if (!text) return null;
  return text.split('\n\n').map((paragraph, idx) => (
    <p key={idx} className="text-gray-600 leading-relaxed mb-4 last:mb-0">
      {paragraph}
    </p>
  ));
}

async function getPageData(slug: string) {
  const board = await getBoardBySlug(slug);
  if (!board) return { board: null, results: [], dateSheets: [], newsList: [], stats: null, years: [] };
  
  const { results, dateSheets, news, stats, years } = await getBoardData(board.id);
  return { board, results, dateSheets, newsList: news, stats, years };
}

export default async function BoardDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  let pageData;
  
  try {
    const { slug } = await params;
    pageData = await getPageData(slug);
    
    if (!pageData.board) {
      notFound();
    }
  } catch {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4" aria-hidden="true">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to load board details</h2>
            <p className="text-gray-600">Please try again later</p>
            <Link
              href="/boards"
              className="inline-block mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              View All Boards
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { board, results, dateSheets, newsList, stats, years } = pageData;

  const hasResults = stats.totalResults > 0;
  const hasDateSheets = stats.totalDateSheets > 0;
  const hasNews = stats.totalNews > 0;
  const hasAbout = board.description && board.description.trim() !== "";
  const hasAnyContent = hasResults || hasDateSheets || hasNews || hasAbout;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-red-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {board.name}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-white/90">
              {board.cityName && (
                <span className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {board.cityName}{board.province ? `, ${board.province}` : ''}
                </span>
              )}
              {board.establishedYear && (
                <span className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Est. {board.establishedYear}
                </span>
              )}
              {board.website && (
                <a href={board.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-white transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9" />
                  </svg>
                  Official Website
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              {hasResults && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold">{stats.totalResults}</div>
                  <div className="text-xs text-orange-200">Results</div>
                </div>
              )}
              {hasDateSheets && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold">{stats.totalDateSheets}</div>
                  <div className="text-xs text-orange-200">Date Sheets</div>
                </div>
              )}
              {hasNews && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold">{stats.totalNews}</div>
                  <div className="text-xs text-orange-200">Announcements</div>
                </div>
              )}
              {stats.recentResults > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold">{stats.recentResults}</div>
                  <div className="text-xs text-orange-200">This Month</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <aside className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-24 space-y-6">
              {(board.address || board.contactPhone || board.contactEmail) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Contact Information</h3>
                  </div>
                  <div className="p-5 space-y-3">
                    {board.address && (
                      <div className="flex gap-2 text-sm">
                        <span className="text-gray-400" aria-hidden="true">📍</span>
                        <span className="text-gray-600">{board.address}</span>
                      </div>
                    )}
                    {board.contactPhone && (
                      <div className="flex gap-2 text-sm">
                        <span className="text-gray-400" aria-hidden="true">📞</span>
                        <a href={`tel:${board.contactPhone}`} className="text-orange-600 hover:underline">
                          {board.contactPhone}
                        </a>
                      </div>
                    )}
                    {board.contactEmail && (
                      <div className="flex gap-2 text-sm">
                        <span className="text-gray-400" aria-hidden="true">✉️</span>
                        <a href={`mailto:${board.contactEmail}`} className="text-orange-600 hover:underline break-all">
                          {board.contactEmail}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(hasResults || hasDateSheets || hasNews) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
                  <div className="space-y-1">
                    {hasResults && (
                      <Link href="#results" className="block text-sm text-gray-600 hover:text-orange-600 py-1">
                        📊 Results ({stats.totalResults})
                      </Link>
                    )}
                    {hasDateSheets && (
                      <Link href="#date-sheets" className="block text-sm text-gray-600 hover:text-orange-600 py-1">
                        📅 Date Sheets ({stats.totalDateSheets})
                      </Link>
                    )}
                    {hasNews && (
                      <Link href="#news" className="block text-sm text-gray-600 hover:text-orange-600 py-1">
                        📢 News ({stats.totalNews})
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {years.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Browse by Year</h3>
                  <div className="flex flex-wrap gap-2">
                    {years.map(year => (
                      <Link
                        key={year}
                        href={`/boards/${board.slug}/results/${year}`}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm hover:bg-orange-100 hover:text-orange-600 transition"
                      >
                        {year}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <div className="lg:col-span-2 order-1 lg:order-2 space-y-8">
            
            {hasResults && (
              <section id="results">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-bold text-gray-900">Latest Results</h2>
                  <Link href={`/boards/${board.slug}/results`} className="text-sm text-orange-600 hover:underline">
                    View All →
                  </Link>
                </div>

                <div className="space-y-3">
                  {results.map((res) => (
                    <Link
                      key={res.id}
                      href={`/results/${res.slug}`}
                      className="block bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md hover:border-orange-200 transition group"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-orange-600">
                            {res.title}
                          </h3>
                          <div className="text-sm text-gray-500 mt-1">
                            Year: {res.year}
                            {res.resultDate && ` • Announced: ${formatShortDate(res.resultDate)}`}
                          </div>
                        </div>
                        {res.isPopular && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {hasDateSheets && (
              <section id="date-sheets">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-bold text-gray-900">Date Sheets</h2>
                  <Link href={`/boards/${board.slug}/date-sheets`} className="text-sm text-orange-600 hover:underline">
                    View All →
                  </Link>
                </div>

                <div className="space-y-3">
                  {dateSheets.map((ds) => (
                    <div key={ds.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{ds.title}</h3>
                          <div className="text-sm text-gray-500 mt-1">
                            {ds.examDate && `📅 Exam Date: ${formatDate(ds.examDate)}`}
                            {ds.year && ` • Year: ${ds.year}`}
                          </div>
                        </div>
                        {ds.isPopular && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {hasNews && (
              <section id="news">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-bold text-gray-900">News &amp; Announcements</h2>
                  <Link href={`/boards/${board.slug}/news`} className="text-sm text-orange-600 hover:underline">
                    View All →
                  </Link>
                </div>

                <div className="space-y-3">
                  {newsList.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="block bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md hover:border-orange-200 transition group"
                    >
                      <div className="flex gap-3">
                        {item.isBreaking && (
                          <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                            BREAKING
                          </span>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-orange-600">
                            {item.title}
                          </h3>
                          {item.excerpt && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>
                          )}
                          {item.publishedAt && (
                            <div className="text-xs text-gray-400 mt-2">
                              📅 {formatShortDate(item.publishedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {hasAbout && (
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">About {board.name}</h2>
                </div>
                <div className="p-6">
                  <div className="text-gray-700 leading-relaxed space-y-3">
                    {formatDescription(board.description)}
                  </div>
                </div>
              </section>
            )}

            {!hasAnyContent && (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <div className="text-5xl mb-4" aria-hidden="true">📚</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Information Coming Soon</h3>
                <p className="text-gray-500">We&apos;re currently updating information for {board.name}. Please check back later.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}