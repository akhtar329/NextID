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
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  latitude: string | null;
  longitude: string | null;
  population: number | null;
  area: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  isPopular: boolean | null;
  status: boolean | null;
  createdAt: Date | null;
}

interface Institute {
  id: number;
  name: string;
  slug: string;
  type: string | null;
  logo: string | null;
  isFeatured: boolean | null;
  programsCount: number;
  admissionsCount: number;
  resultsCount: number;
}

interface Admission {
  id: number;
  slug: string;
  instituteName: string | null;
  instituteSlug: string | null;
  instituteLogo: string | null;
  year: number;
  session: string | null;
  status: string | null;
  expectedCloseDate: Date | null;
}

interface Result {
  id: number;
  title: string;
  slug: string;
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
        description: cities.description,
        imageUrl: cities.imageUrl,
        thumbnailUrl: cities.thumbnailUrl,
        latitude: cities.latitude,
        longitude: cities.longitude,
        population: cities.population,
        area: cities.area,
        metaTitle: cities.metaTitle,
        metaDescription: cities.metaDescription,
        metaKeywords: cities.metaKeywords,
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
        logo: institutes.logo,
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
        slug: admissions.slug,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        instituteLogo: institutes.logo,
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
      title: 'City Not Found',
      description: 'The requested city could not be found.',
    };
  }

  return {
    title: city.metaTitle || `${city.name} - Educational Institutions, Admissions & Results`,
    description: city.metaDescription || `Comprehensive guide to education in ${city.name}. Find universities, colleges, open admissions, exam results, and latest news.`,
    keywords: city.metaKeywords || `${city.name} education, ${city.name} universities, ${city.name} admissions, ${city.name} results`,
    openGraph: {
      title: city.metaTitle || `${city.name} Education Guide`,
      description: city.metaDescription || `Complete information about educational institutions, admissions, and results in ${city.name}.`,
      type: 'website',
      images: city.imageUrl ? [{ url: city.imageUrl }] : undefined,
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

  const [institutesList, admissionsList, resultsList, newsList, stats, years] = await Promise.all([
    getInstitutes(city.id, 6),
    getAdmissions(city.id, 5),
    getResults(city.id, 5),
    getNews(city.id, 5),
    getStats(city.id),
    getYears(city.id),
  ]);

  const hasAnyData = institutesList.length > 0 || admissionsList.length > 0 || resultsList.length > 0 || newsList.length > 0;

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
        {city.imageUrl && (
          <div className="absolute inset-0">
            <img 
              src={city.imageUrl} 
              alt={city.name}
              className="w-full h-full object-cover opacity-20"
            />
          </div>
        )}
        <div className="relative container mx-auto px-4 py-16 lg:py-20">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {city.name}
              </h1>
              {city.isPopular && (
                <span className="px-3 py-1 bg-yellow-500 text-black text-xs font-semibold rounded-full">
                  Popular
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-purple-200 mb-8">
              {city.province && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {city.province}
                </span>
              )}
              {city.population && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {city.population.toLocaleString()}+
                </span>
              )}
              {city.area && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  {city.area}
                </span>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl md:text-3xl font-bold">{stats.institutes}</div>
                <div className="text-xs text-purple-200 mt-1">Educational Institutes</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl md:text-3xl font-bold">{stats.admissions}</div>
                <div className="text-xs text-purple-200 mt-1">Open Admissions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl md:text-3xl font-bold">{stats.results}</div>
                <div className="text-xs text-purple-200 mt-1">Results Available</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl md:text-3xl font-bold">{stats.news}</div>
                <div className="text-xs text-purple-200 mt-1">Latest News</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
                Quick Information
              </h2>
              
              <div className="space-y-4">
                {city.province && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Province</span>
                    <span className="text-sm font-medium text-gray-900">{city.province}</span>
                  </div>
                )}
                {city.population && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Population</span>
                    <span className="text-sm font-medium text-gray-900">{city.population.toLocaleString()}+</span>
                  </div>
                )}
                {city.area && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Area</span>
                    <span className="text-sm font-medium text-gray-900">{city.area}</span>
                  </div>
                )}
                {years.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Available Years</div>
                    <div className="flex flex-wrap gap-2">
                      {years.slice(0, 8).map(year => (
                        <Link
                          key={year}
                          href={`/cities/${city.slug}/year/${year}`}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-purple-100 hover:text-purple-700 transition"
                        >
                          {year}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Browse by Category</h3>
                <div className="space-y-2">
                  {stats.institutes > 0 && (
                    <Link href="#institutes" className="flex items-center justify-between text-sm text-gray-600 hover:text-purple-600 py-1">
                      <span>🏛️ Institutes & Universities</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{stats.institutes}</span>
                    </Link>
                  )}
                  {stats.admissions > 0 && (
                    <Link href="#admissions" className="flex items-center justify-between text-sm text-gray-600 hover:text-purple-600 py-1">
                      <span>📝 Open Admissions</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{stats.admissions}</span>
                    </Link>
                  )}
                  {stats.results > 0 && (
                    <Link href="#results" className="flex items-center justify-between text-sm text-gray-600 hover:text-purple-600 py-1">
                      <span>📊 Exam Results</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{stats.results}</span>
                    </Link>
                  )}
                  {stats.news > 0 && (
                    <Link href="#news" className="flex items-center justify-between text-sm text-gray-600 hover:text-purple-600 py-1">
                      <span>📰 Latest News</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{stats.news}</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-10">
            
            {/* City Description */}
            {city.description && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <p className="text-gray-700 leading-relaxed">{city.description}</p>
              </div>
            )}
            
            {/* Institutes Section */}
            {institutesList.length > 0 && (
              <section id="institutes">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    Institutes in {city.name}
                  </h2>
                  {stats.institutes > 6 && (
                    <Link href={`/cities/${city.slug}/institutes`} className="text-sm text-purple-600 hover:underline">
                      View all {stats.institutes}
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {institutesList.map((inst) => (
                    <Link
                      key={inst.id}
                      href={`/universities/${inst.slug}`}
                      className="group bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md hover:border-purple-200 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {inst.logo ? (
                          <img src={inst.logo} alt={inst.name} className="w-12 h-12 object-contain rounded-lg" />
                        ) : (
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl">
                            🏛️
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition">
                            {inst.name}
                          </h3>
                          {inst.type && (
                            <p className="text-xs text-gray-500 mt-0.5">{inst.type}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {inst.programsCount > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                                📚 {inst.programsCount}
                              </span>
                            )}
                            {inst.admissionsCount > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">
                                📝 {inst.admissionsCount}
                              </span>
                            )}
                            {inst.resultsCount > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">
                                📊 {inst.resultsCount}
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

            {/* Admissions Section */}
            {admissionsList.length > 0 && (
              <section id="admissions">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    Open Admissions
                  </h2>
                  {stats.admissions > 5 && (
                    <Link href={`/cities/${city.slug}/admissions`} className="text-sm text-purple-600 hover:underline">
                      View all {stats.admissions}
                    </Link>
                  )}
                </div>

                <div className="space-y-3">
                  {admissionsList.map((adm) => (
                    <Link
                      key={adm.id}
                      href={`/admissions/${adm.slug}`}
                      className="block bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md hover:border-purple-200 transition-all"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          {adm.instituteLogo ? (
                            <img src={adm.instituteLogo} alt={adm.instituteName || ''} className="w-10 h-10 object-contain" />
                          ) : (
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-lg">
                              📝
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">
                              {adm.instituteName}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {adm.session || 'Annual'} {adm.year}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            {adm.status}
                          </span>
                          {adm.expectedCloseDate && (
                            <span className="text-xs text-gray-500">
                              Until {formatShortDate(adm.expectedCloseDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Results Section */}
            {resultsList.length > 0 && (
              <section id="results">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    Recent Results
                  </h2>
                  {stats.results > 5 && (
                    <Link href={`/cities/${city.slug}/results`} className="text-sm text-purple-600 hover:underline">
                      View all {stats.results}
                    </Link>
                  )}
                </div>

                <div className="space-y-3">
                  {resultsList.map((res) => (
                    <Link
                      key={res.id}
                      href={`/results/${res.slug}`}
                      className="block bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md hover:border-purple-200 transition-all"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">
                            {res.instituteName}
                          </h3>
                          <p className="text-sm text-gray-600">{res.title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{res.year}</span>
                          {res.isPopular && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* News Section */}
            {newsList.length > 0 && (
              <section id="news">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    Latest News
                  </h2>
                  {stats.news > 5 && (
                    <Link href={`/cities/${city.slug}/news`} className="text-sm text-purple-600 hover:underline">
                      View all {stats.news}
                    </Link>
                  )}
                </div>

                <div className="space-y-3">
                  {newsList.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="block bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md hover:border-purple-200 transition-all"
                    >
                      <div className="flex gap-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="w-14 h-14 object-cover rounded-lg" />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                            📰
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {item.isBreaking && (
                              <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full">
                                BREAKING
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatShortDate(item.publishedAt)}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 line-clamp-2">
                            {item.title}
                          </h3>
                          {item.excerpt && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.excerpt}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* No Data State */}
            {!hasAnyData && (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Information Coming Soon</h3>
                <p className="text-gray-500 text-sm">
                  We're currently gathering information for {city.name}. Please check back later.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}