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
    day: 'numeric',
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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      
      {/* Hero Section - Premium Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-800">
        <div className="absolute inset-0 bg-black/20"></div>
        {city.imageUrl && (
          <div className="absolute inset-0">
            <img src={city.imageUrl} alt={city.name} className="w-full h-full object-cover opacity-30" />
          </div>
        )}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative container mx-auto px-4 py-20 z-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-xs font-medium text-white">Educational Hub</span>
              </div>
              {city.isPopular && (
                <span className="px-3 py-1 bg-yellow-500 text-black text-xs font-semibold rounded-full">
                  ⭐ Popular City
                </span>
              )}
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              {city.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-white/90">
              {city.province && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{city.province}</span>
                </div>
              )}
              {city.population && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{city.population.toLocaleString()}+</span>
                </div>
              )}
              {city.area && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span>{city.area}</span>
                </div>
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
              <div className="text-2xl font-bold text-purple-600">{stats.institutes}</div>
              <div className="text-xs text-gray-500">Educational Institutes</div>
            </div>
            <div className="py-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.admissions}</div>
              <div className="text-xs text-gray-500">Open Admissions</div>
            </div>
            <div className="py-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.results}</div>
              <div className="text-xs text-gray-500">Results Available</div>
            </div>
            <div className="py-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.news}</div>
              <div className="text-xs text-gray-500">Latest News</div>
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
              
              {/* Quick Info Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Quick Information
                  </h3>
                </div>
                <div className="p-6 space-y-4">
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
                  {city.latitude && city.longitude && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Coordinates</span>
                      <span className="text-sm text-gray-600">{city.latitude}, {city.longitude}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Years Card */}
              {years.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Browse by Year</h3>
                  <div className="flex flex-wrap gap-2">
                    {years.map(year => (
                      <Link
                        key={year}
                        href={`/cities/${city.slug}/year/${year}`}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-purple-100 hover:text-purple-600 transition"
                      >
                        {year}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
                <div className="space-y-2">
                  {stats.institutes > 0 && (
                    <Link href="#institutes" className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 transition group">
                      <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 group-hover:bg-purple-200">🏛️</span>
                      <span className="text-sm text-gray-700 group-hover:text-purple-600">Institutes & Universities ({stats.institutes})</span>
                    </Link>
                  )}
                  {stats.admissions > 0 && (
                    <Link href="#admissions" className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 transition group">
                      <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 group-hover:bg-green-200">📝</span>
                      <span className="text-sm text-gray-700 group-hover:text-purple-600">Open Admissions ({stats.admissions})</span>
                    </Link>
                  )}
                  {stats.results > 0 && (
                    <Link href="#results" className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 transition group">
                      <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 group-hover:bg-orange-200">📊</span>
                      <span className="text-sm text-gray-700 group-hover:text-purple-600">Exam Results ({stats.results})</span>
                    </Link>
                  )}
                  {stats.news > 0 && (
                    <Link href="#news" className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 transition group">
                      <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-200">📰</span>
                      <span className="text-sm text-gray-700 group-hover:text-purple-600">Latest News ({stats.news})</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-8">
            
            {/* Institutes Section - TOP */}
            {institutesList.length > 0 && (
              <section id="institutes">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                    Institutes in {city.name}
                  </h2>
                  {stats.institutes > 6 && (
                    <Link href={`/cities/${city.slug}/institutes`} className="text-sm text-purple-600 hover:underline font-medium">
                      View All →
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {institutesList.map((inst) => (
                    <Link
                      key={inst.id}
                      href={`/universities/${inst.slug}`}
                      className="group bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {inst.logo ? (
                          <img src={inst.logo} alt={inst.name} className="w-14 h-14 object-contain rounded-xl" />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center text-2xl">
                            🏛️
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition text-lg">
                            {inst.name}
                          </h3>
                          {inst.type && (
                            <p className="text-sm text-gray-500 mt-1">{inst.type}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {inst.programsCount > 0 && (
                              <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full">
                                📚 {inst.programsCount} Programs
                              </span>
                            )}
                            {inst.admissionsCount > 0 && (
                              <span className="text-xs px-2.5 py-1 bg-green-50 text-green-600 rounded-full">
                                📝 {inst.admissionsCount} Open
                              </span>
                            )}
                            {inst.resultsCount > 0 && (
                              <span className="text-xs px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full">
                                📊 {inst.resultsCount} Results
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                    Open Admissions
                  </h2>
                  {stats.admissions > 5 && (
                    <Link href={`/cities/${city.slug}/admissions`} className="text-sm text-purple-600 hover:underline font-medium">
                      View All →
                    </Link>
                  )}
                </div>

                <div className="space-y-4">
                  {admissionsList.map((adm) => (
                    <Link
                      key={adm.id}
                      href={`/admissions/${adm.slug}`}
                      className="block bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all group"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          {adm.instituteLogo ? (
                            <img src={adm.instituteLogo} alt={adm.instituteName || ''} className="w-12 h-12 object-contain rounded-xl" />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center text-xl">
                              📝
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition">
                              {adm.instituteName}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {adm.session || 'Annual'} {adm.year}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                            {adm.status}
                          </span>
                          {adm.expectedCloseDate && (
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                    Recent Results
                  </h2>
                  {stats.results > 5 && (
                    <Link href={`/cities/${city.slug}/results`} className="text-sm text-purple-600 hover:underline font-medium">
                      View All →
                    </Link>
                  )}
                </div>

                <div className="space-y-4">
                  {resultsList.map((res) => (
                    <Link
                      key={res.id}
                      href={`/results/${res.slug}`}
                      className="block bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all group"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition text-lg">
                            {res.instituteName}
                          </h3>
                          <p className="text-gray-600 mt-1">{res.title}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full">
                            {res.year}
                          </span>
                          {res.isPopular && (
                            <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                              ⭐ Popular
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                    Latest News
                  </h2>
                  {stats.news > 5 && (
                    <Link href={`/cities/${city.slug}/news`} className="text-sm text-purple-600 hover:underline font-medium">
                      View All →
                    </Link>
                  )}
                </div>

                <div className="space-y-4">
                  {newsList.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="block bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all group"
                    >
                      <div className="flex gap-4">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="w-20 h-20 object-cover rounded-xl" />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center text-3xl">
                            📰
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {item.isBreaking && (
                              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                                BREAKING
                              </span>
                            )}
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatShortDate(item.publishedAt)}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition text-lg mb-2">
                            {item.title}
                          </h3>
                          {item.excerpt && (
                            <p className="text-gray-600 line-clamp-2">{item.excerpt}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* About Section - BOTTOM (with proper paragraph formatting) */}
            {city.description && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span>📖</span> About {city.name}
                  </h2>
                </div>
                <div className="p-6">
                  <div className="prose prose-purple max-w-none">
                    {city.description.split('\n\n').map((paragraph, idx) => (
                      <p key={idx} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* No Data State */}
            {!hasAnyData && (
              <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Information Coming Soon</h3>
                <p className="text-gray-500">We're currently gathering information for {city.name}. Please check back later.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}