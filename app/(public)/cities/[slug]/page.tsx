// app/(public)/cities/[slug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { cities, institutes, admissions, results, news } from '@/app/lib/schema';
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
    year: 'numeric',
  });
}

// ==================== TYPES ====================
interface CityDetail {
  id: number;
  name: string;
  slug: string;
  province: string | null;
  isPopular: boolean | null;
  status: boolean | null;
  createdAt: Date | null;
}

interface Institute {
  id: number;
  name: string;
  slug: string;
  type: string | null;
  isFeatured: boolean | null;
  programsCount: number;
  admissionsCount: number;
  resultsCount: number;
}

interface Admission {
  id: number;
  title: string | null;
  slug: string;
  programName: string | null;
  instituteName: string | null;
  instituteSlug: string | null;
  year: number;
  session: string | null;
  status: string | null;
  expectedCloseDate: Date | null;
}

interface Result {
  id: number;
  title: string;
  slug: string;
  programName: string | null;
  instituteName: string | null;
  instituteSlug: string | null;
  year: number;
  resultDate: Date | null;
  isPopular: boolean | null;
}

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  isBreaking: boolean | null;
}

// ==================== GET CITY BY SLUG ====================
async function getCityBySlug(slug: string): Promise<CityDetail | null> {
  try {
    const [city] = await db
      .select({
        id: cities.id,
        name: cities.name,
        slug: cities.slug,
        province: cities.province,
        isPopular: cities.isPopular,
        status: cities.status,
        createdAt: cities.createdAt,
      })
      .from(cities)
      .where(eq(cities.slug, slug))
      .limit(1);

    return city || null;
  } catch (error) {
    console.error('Error fetching city:', error);
    return null;
  }
}

// ==================== GET INSTITUTES ====================
async function getInstitutes(cityId: number, limit = 6): Promise<Institute[]> {
  try {
    const institutesList = await db
      .select({
        id: institutes.id,
        name: institutes.name,
        slug: institutes.slug,
        type: institutes.type,
        isFeatured: institutes.isFeatured,
      })
      .from(institutes)
      .where(
        and(
          eq(institutes.cityId, cityId),
          eq(institutes.status, true)
        )
      )
      .orderBy(desc(institutes.isFeatured), institutes.name)
      .limit(limit);

    const institutesWithStats = await Promise.all(
      institutesList.map(async (inst) => {
        const [programsCount] = await db
          .select({ count: count() })
          .from(sql`program_institutes`)
          .where(sql`institute_id = ${inst.id}`);

        const [admissionsCount] = await db
          .select({ count: count() })
          .from(admissions)
          .where(
            and(
              eq(admissions.instituteId, inst.id),
              eq(admissions.status, 'Open')
            )
          );

        const [resultsCount] = await db
          .select({ count: count() })
          .from(results)
          .where(eq(results.instituteId, inst.id));

        return {
          ...inst,
          programsCount: Number(programsCount?.count) || 0,
          admissionsCount: Number(admissionsCount?.count) || 0,
          resultsCount: Number(resultsCount?.count) || 0,
        };
      })
    );

    return institutesWithStats;
  } catch (error) {
    console.error('Error fetching institutes:', error);
    return [];
  }
}

// ==================== GET ADMISSIONS ====================
async function getAdmissions(cityId: number, limit = 5): Promise<Admission[]> {
  try {
    const admissionsList = await db
      .select({
        id: admissions.id,
        title: sql<string>`NULL`,
        slug: admissions.slug,
        programName: sql<string>`NULL`,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        expectedCloseDate: admissions.expectedCloseDate,
      })
      .from(admissions)
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .where(
        and(
          eq(institutes.cityId, cityId),
          eq(admissions.status, 'Open')
        )
      )
      .orderBy(admissions.expectedCloseDate)
      .limit(limit);

    return admissionsList;
  } catch (error) {
    console.error('Error fetching admissions:', error);
    return [];
  }
}

// ==================== GET RESULTS ====================
async function getResults(cityId: number, limit = 5): Promise<Result[]> {
  try {
    const resultsList = await db
      .select({
        id: results.id,
        title: results.title,
        slug: results.slug,
        programName: sql<string>`NULL`,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        year: results.year,
        resultDate: results.resultDate,
        isPopular: results.isPopular,
      })
      .from(results)
      .innerJoin(institutes, eq(results.instituteId, institutes.id))
      .where(
        and(
          eq(institutes.cityId, cityId),
          eq(results.status, true)
        )
      )
      .orderBy(desc(results.resultDate), desc(results.year))
      .limit(limit);

    return resultsList;
  } catch (error) {
    console.error('Error fetching results:', error);
    return [];
  }
}

// ==================== GET NEWS ====================
async function getNews(cityId: number, limit = 5): Promise<NewsItem[]> {
  try {
    return await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        excerpt: news.excerpt,
        imageUrl: news.imageUrl,
        publishedAt: news.publishedAt,
        isBreaking: news.isBreaking,
      })
      .from(news)
      .where(
        and(
          eq(news.cityId, cityId),
          eq(news.status, true)
        )
      )
      .orderBy(desc(news.publishedAt))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

// ==================== GET STATS ====================
async function getStats(cityId: number) {
  try {
    const [institutesCount] = await db
      .select({ count: count() })
      .from(institutes)
      .where(
        and(
          eq(institutes.cityId, cityId),
          eq(institutes.status, true)
        )
      );

    const [admissionsCount] = await db
      .select({ count: count() })
      .from(admissions)
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .where(
        and(
          eq(institutes.cityId, cityId),
          eq(admissions.status, 'Open')
        )
      );

    const [resultsCount] = await db
      .select({ count: count() })
      .from(results)
      .innerJoin(institutes, eq(results.instituteId, institutes.id))
      .where(eq(institutes.cityId, cityId));

    const [newsCount] = await db
      .select({ count: count() })
      .from(news)
      .where(eq(news.cityId, cityId));

    return {
      institutes: Number(institutesCount?.count) || 0,
      admissions: Number(admissionsCount?.count) || 0,
      results: Number(resultsCount?.count) || 0,
      news: Number(newsCount?.count) || 0,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { institutes: 0, admissions: 0, results: 0, news: 0 };
  }
}

// ==================== GET YEARS ====================
async function getYears(cityId: number) {
  try {
    const years = await db
      .select({ year: admissions.year })
      .from(admissions)
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .where(eq(institutes.cityId, cityId))
      .groupBy(admissions.year)
      .orderBy(desc(admissions.year));

    return years.map(y => y.year);
  } catch (error) {
    console.error('Error fetching years:', error);
    return [];
  }
}

// ==================== GENERATE METADATA ====================
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityBySlug(slug);

  if (!city) {
    return {
      title: 'City Not Found | NextID.pk',
      description: 'The requested city could not be found.',
    };
  }

  const title = `${city.name} Education - Universities, Admissions & Results | NextID.pk`;
  const description = `Find all educational institutions, universities, admissions, and results in ${city.name}${city.province ? `, ${city.province}` : ''}. Check latest updates and announcements.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    alternates: {
      canonical: `https://www.nextid.pk/cities/${city.slug}`,
    },
  };
}

// ==================== MAIN PAGE ====================
export default async function CityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const [institutes, admissions, results, news, stats, years] = await Promise.all([
    getInstitutes(city.id, 6),
    getAdmissions(city.id, 5),
    getResults(city.id, 5),
    getNews(city.id, 5),
    getStats(city.id),
    getYears(city.id),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="text-gray-400">›</span>
            <Link href="/cities" className="text-gray-600 hover:text-blue-600">Cities</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">{city.name}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-5xl md:text-6xl font-bold">{city.name}</h1>
              {city.isPopular && (
                <span className="px-3 py-1 bg-yellow-500 text-sm rounded-full">
                  ⭐ Popular
                </span>
              )}
            </div>
            
            <p className="text-xl text-purple-200 mb-8">
              {city.province || 'Pakistan'} • Education Hub
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{stats.institutes}</div>
                <div className="text-sm text-purple-200">Institutes</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{stats.admissions}</div>
                <div className="text-sm text-purple-200">Open Admissions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{stats.results}</div>
                <div className="text-sm text-purple-200">Results</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{stats.news}</div>
                <div className="text-sm text-purple-200">News</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">City Information</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Province</div>
                  <div className="font-semibold">{city.province || 'N/A'}</div>
                </div>
                
                {years.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-500">Available Years</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {years.slice(0, 5).map(year => (
                        <Link
                          key={year}
                          href={`/cities/${city.slug}/year/${year}`}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-purple-100"
                        >
                          {year}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="#institutes" className="block text-sm text-purple-600 hover:underline">
                    🏛️ Institutes ({stats.institutes})
                  </Link>
                  <Link href="#admissions" className="block text-sm text-purple-600 hover:underline">
                    📝 Open Admissions ({stats.admissions})
                  </Link>
                  <Link href="#results" className="block text-sm text-purple-600 hover:underline">
                    📊 Results ({stats.results})
                  </Link>
                  <Link href="#news" className="block text-sm text-purple-600 hover:underline">
                    📰 News ({stats.news})
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Institutes Section */}
            <section id="institutes">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Institutes in {city.name}</h2>
                <Link href={`/cities/${city.slug}/institutes`} className="text-sm text-purple-600 hover:underline">
                  View All ({stats.institutes})
                </Link>
              </div>

              {institutes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {institutes.map((inst) => (
                    <Link
                      key={inst.id}
                      href={`/universities/${inst.slug}`}
                      className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 group-hover:text-purple-600">
                          {inst.name}
                        </h3>
                        {inst.isFeatured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{inst.type || 'Institute'}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {inst.programsCount > 0 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            📚 {inst.programsCount} Programs
                          </span>
                        )}
                        {inst.admissionsCount > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            📝 {inst.admissionsCount} Open
                          </span>
                        )}
                        {inst.resultsCount > 0 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                            📊 {inst.resultsCount} Results
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                  <p className="text-gray-500">No institutes found in {city.name}.</p>
                </div>
              )}
            </section>

            {/* Admissions Section */}
            {admissions.length > 0 && (
              <section id="admissions">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Open Admissions in {city.name}</h2>
                  <Link href={`/cities/${city.slug}/admissions`} className="text-sm text-purple-600 hover:underline">
                    View All ({stats.admissions})
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {admissions.map((adm) => (
                    <Link
                      key={adm.id}
                      href={`/admissions/${adm.slug}`}
                      className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-purple-600 mb-1">
                            {adm.instituteName}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Session: {adm.session || 'Fall'} {adm.year}
                          </p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              {adm.status}
                            </span>
                            {adm.expectedCloseDate && (
                              <span className="text-gray-500">
                                Closes: {formatShortDate(adm.expectedCloseDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Results Section */}
            {results.length > 0 && (
              <section id="results">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Results in {city.name}</h2>
                  <Link href={`/cities/${city.slug}/results`} className="text-sm text-purple-600 hover:underline">
                    View All ({stats.results})
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {results.map((res) => (
                    <Link
                      key={res.id}
                      href={`/results/${res.slug}`}
                      className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-purple-600 mb-1">
                            {res.instituteName}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {res.title || `Result ${res.year}`}
                          </p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-gray-500">Year: {res.year}</span>
                            {res.resultDate && (
                              <>
                                <span>•</span>
                                <span className="text-gray-500">
                                  {formatShortDate(res.resultDate)}
                                </span>
                              </>
                            )}
                            {res.isPopular && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* News Section */}
            {news.length > 0 && (
              <section id="news">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Latest News in {city.name}</h2>
                  <Link href={`/cities/${city.slug}/news`} className="text-sm text-purple-600 hover:underline">
                    View All ({stats.news})
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {news.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition group"
                    >
                      <div className="flex gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                            📰
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {item.isBreaking && (
                              <span className="px-1.5 py-0.5 bg-red-600 text-white text-xs rounded-full">
                                BREAKING
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatShortDate(item.publishedAt)}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 group-hover:text-purple-600 line-clamp-2">
                            {item.title}
                          </h3>
                          {item.excerpt && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                              {item.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* SEO Content Section */}
      <section className="bg-white py-12 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-purple">
            <h2>About Education in {city.name}</h2>
            
            <p>
              <strong>{city.name}</strong> is a major educational hub in {city.province || 'Pakistan'}. 
              The city is home to {stats.institutes} educational institutions offering diverse programs 
              in various disciplines. Students from across the country come to {city.name} for quality education.
            </p>

            <h3>Educational Institutions</h3>
            <p>
              {city.name} hosts {stats.institutes} institutes including universities, colleges, and professional 
              training centers. These institutions offer programs ranging from matriculation to doctoral studies 
              in fields like engineering, medicine, business, arts, and sciences.
            </p>

            <h3>Admissions in {city.name}</h3>
            <p>
              Currently, there {stats.admissions === 1 ? 'is' : 'are'} <strong>{stats.admissions} open admission{stats.admissions !== 1 ? 's' : ''}</strong> 
              in {city.name}. Students can apply for various programs in top institutions. The admission process 
              typically includes online application, document submission, and entry tests for certain programs.
            </p>

            <h3>Results and Announcements</h3>
            <p>
              We have <strong>{stats.results} results</strong> and <strong>{stats.news} news updates</strong> 
              from institutions in {city.name}. Students can check their exam results, merit lists, and 
              important announcements through our platform.
            </p>

            <h3>Popular Institutions</h3>
            <ul>
              {institutes.slice(0, 5).map(inst => (
                <li key={inst.id}>
                  <Link href={`/universities/${inst.slug}`} className="text-purple-600 hover:underline">
                    {inst.name}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="text-sm text-gray-500 mt-8">
              Last updated: {new Date().toLocaleDateString('en-PK')}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}