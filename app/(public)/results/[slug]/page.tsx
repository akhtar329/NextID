// app/(public)/results/[slug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { results, institutes, cities, boards } from '@/app/lib/schema';
import { eq, and, ne, desc } from 'drizzle-orm';

export const revalidate = 86400;
export const dynamic = 'force-static';
export const fetchCache = 'force-cache';
export const dynamicParams = true;

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

interface CityType {
  id: number;
  name: string | null;
  slug: string | null;
  province: string | null;
}

interface InstituteType {
  id: number;
  name: string | null;
  slug: string | null;
  type: string | null;
  cityId: number | null;
  description: string | null;
  website: string | null;
  city: CityType | null;
}

interface BoardType {
  id: number;
  name: string | null;
  slug: string | null;
  cityId: number | null;
  website: string | null;
  description: string | null;
  city: CityType | null;
}

interface ResultType {
  id: number;
  slug: string | null;
  title: string | null;
  instituteId: number | null;
  boardId: number | null;
  year: number | null;
  resultDate: Date | null;
  officialLink: string | null;
  isPopular: boolean | null;
  status: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  institute: InstituteType | null;
  board: BoardType | null;
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
    month: 'long',
    year: 'numeric',
  });
}

async function getResultBySlug(slug: string): Promise<ResultType | null> {
  try {
    const [result] = await db
      .select({
        id: results.id,
        slug: results.slug,
        title: results.title,
        instituteId: results.instituteId,
        boardId: results.boardId,
        year: results.year,
        resultDate: results.resultDate,
        officialLink: results.officialLink,
        isPopular: results.isPopular,
        status: results.status,
        createdAt: results.createdAt,
        updatedAt: results.updatedAt,
        instituteId_field: institutes.id,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        instituteType: institutes.type,
        instituteCityId: institutes.cityId,
        instituteDescription: institutes.description,
        instituteWebsite: institutes.website,
        boardId_field: boards.id,
        boardName: boards.name,
        boardSlug: boards.slug,
        boardCityId: boards.cityId,
        boardWebsite: boards.website,
        boardDescription: boards.description,
      })
      .from(results)
      .leftJoin(institutes, eq(results.instituteId, institutes.id))
      .leftJoin(boards, eq(results.boardId, boards.id))
      .where(eq(results.slug, slug))
      .limit(1);

    if (!result) return null;

    let instituteCity: CityType | null = null;
    let boardCity: CityType | null = null;

    if (result.instituteCityId) {
      const [city] = await db
        .select({
          id: cities.id,
          name: cities.name,
          slug: cities.slug,
          province: cities.province,
        })
        .from(cities)
        .where(eq(cities.id, result.instituteCityId))
        .limit(1);
      instituteCity = city || null;
    }

    if (result.boardCityId) {
      const [city] = await db
        .select({
          id: cities.id,
          name: cities.name,
          slug: cities.slug,
          province: cities.province,
        })
        .from(cities)
        .where(eq(cities.id, result.boardCityId))
        .limit(1);
      boardCity = city || null;
    }

    let institute: InstituteType | null = null;
    if (result.instituteId_field) {
      institute = {
        id: result.instituteId_field,
        name: result.instituteName,
        slug: result.instituteSlug,
        type: result.instituteType,
        cityId: result.instituteCityId,
        description: result.instituteDescription,
        website: result.instituteWebsite,
        city: instituteCity,
      };
    }

    let board: BoardType | null = null;
    if (result.boardId_field) {
      board = {
        id: result.boardId_field,
        name: result.boardName,
        slug: result.boardSlug,
        cityId: result.boardCityId,
        website: result.boardWebsite,
        description: result.boardDescription,
        city: boardCity,
      };
    }

    return {
      id: result.id,
      slug: result.slug,
      title: result.title,
      instituteId: result.instituteId,
      boardId: result.boardId,
      year: result.year,
      resultDate: result.resultDate,
      officialLink: result.officialLink,
      isPopular: result.isPopular,
      status: result.status,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      institute,
      board,
    };
  } catch {
    return null;
  }
}

async function getRelatedResults(result: ResultType) {
  if (!result.slug) return [];
  
  try {
    const conditions = [];
    
    if (result.instituteId) {
      conditions.push(eq(results.instituteId, result.instituteId));
    } else if (result.boardId) {
      conditions.push(eq(results.boardId, result.boardId));
    }
    
    if (result.year) {
      conditions.push(eq(results.year, result.year));
    }
    
    conditions.push(eq(results.status, true));
    conditions.push(ne(results.slug, result.slug || ''));

    return await db
      .select({
        id: results.id,
        slug: results.slug,
        title: results.title,
        year: results.year,
        resultDate: results.resultDate,
        instituteName: institutes.name,
        boardName: boards.name,
      })
      .from(results)
      .leftJoin(institutes, eq(results.instituteId, institutes.id))
      .leftJoin(boards, eq(results.boardId, boards.id))
      .where(and(...conditions))
      .orderBy(desc(results.resultDate))
      .limit(5);
  } catch {
    return [];
  }
}

function generateMetaTitle(result: ResultType): string {
  const institutionName = result.institute?.name || result.board?.name || 'Board';
  const year = result.year || '2026';
  
  let title = `Result ${year} - ${institutionName} | NextID.pk`;
  if (title.length > 60) title = title.substring(0, 57) + '...';
  return title;
}

function generateMetaDescription(result: ResultType): string {
  const institutionName = result.institute?.name || result.board?.name || 'board';
  const cityName = result.institute?.city?.name || result.board?.city?.name || 'Pakistan';
  const year = result.year || '2026';
  const resultDate = result.resultDate ? formatShortDate(result.resultDate) : 'TBA';
  const status = result.status ? 'published' : 'pending';
  
  let description = `Check ${institutionName} result ${year} in ${cityName}. Result date: ${resultDate}. Status: ${status}. `;
  description += `Download marksheet, check passing percentage at NextID.pk.`;
  
  if (description.length > 160) description = description.substring(0, 157) + '...';
  return description;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getResultBySlug(slug);

  if (!result) {
    return { title: 'Result Not Found', robots: { index: false } };
  }

  return {
    title: generateMetaTitle(result),
    description: generateMetaDescription(result),
    alternates: { canonical: `https://www.nextid.pk/results/${result.slug}` },
    openGraph: {
      title: generateMetaTitle(result),
      description: generateMetaDescription(result),
      type: 'article',
      images: ['/images/results-og.jpg'],
    },
  };
}

function getStatusBadge(status: boolean | null) {
  if (status === true) return { bg: 'bg-green-100', text: 'text-green-700', label: 'Result Published', icon: '✅' };
  if (status === false) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Result Pending', icon: '⏳' };
  return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Unknown', icon: '❓' };
}

async function getPageData(slug: string) {
  const result = await getResultBySlug(slug);
  if (!result) return { result: null, relatedResults: [] };
  
  const relatedResults = await getRelatedResults(result);
  return { result, relatedResults };
}

export default async function ResultDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  let pageData;
  
  try {
    const { slug } = await params;
    pageData = await getPageData(slug);
    
    if (!pageData.result) {
      notFound();
    }
  } catch {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4" aria-hidden="true">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to load result</h2>
            <p className="text-gray-600">Please try again later</p>
            <Link
              href="/results"
              className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              View All Results
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { result, relatedResults } = pageData;
  const statusBadge = getStatusBadge(result.status);

  const institutionName = result.institute?.name || result.board?.name || '';
  const institutionSlug = result.institute?.slug || result.board?.slug || '';
  const institutionType = result.institute ? 'universities' : 'boards';
  const cityName = result.institute?.city?.name || result.board?.city?.name || '';
  const officialWebsite = result.institute?.website || result.board?.website || '';

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-700 to-emerald-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <div className="text-sm text-green-200 mb-4">
              <Link href="/" className="hover:text-white">Home</Link>
              {' / '}
              <Link href="/results" className="hover:text-white">Results</Link>
              {' / '}
              <span className="text-white">{result.title || 'Result'}</span>
            </div>
            
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${statusBadge.bg} ${statusBadge.text}`}>
              <span>{statusBadge.icon}</span>
              <span>{statusBadge.label}</span>
              {result.isPopular && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white rounded-full text-xs">Popular</span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {result.title || `Result ${result.year || '2026'}`}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-green-200">
              {institutionName && (
                <div className="flex items-center gap-1">
                  <span>🏛️</span>
                  <Link href={`/${institutionType}/${institutionSlug}`} className="hover:text-white">
                    {institutionName}
                  </Link>
                </div>
              )}
              {cityName && (
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <span>{cityName}</span>
                </div>
              )}
              {result.year && (
                <div className="flex items-center gap-1">
                  <span>📅</span>
                  <span>Year: {result.year}</span>
                </div>
              )}
              {result.resultDate && (
                <div className="flex items-center gap-1">
                  <span>⏰</span>
                  <span>Announced: {formatDate(result.resultDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Result Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Institution</p>
                  <p className="font-semibold text-gray-900">{institutionName || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Result Year</p>
                  <p className="font-semibold text-gray-900">{result.year || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Announcement Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(result.resultDate) || 'TBA'}</p>
                </div>
              </div>

              {(result.officialLink || officialWebsite) && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Official Resources</h3>
                  <div className="flex flex-wrap gap-3">
                    {result.officialLink && (
                      <a 
                        href={result.officialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <span>📄</span> Check Result Online
                      </a>
                    )}
                    {officialWebsite && (
                      <a 
                        href={officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                      >
                        <span>🌐</span> Official Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="lg:w-80">
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>📝</span> How to Check Result?
              </h3>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Click the &quot;Check Result Online&quot; button above</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Enter your Roll Number</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Select your exam type (Annual/Supplementary)</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>Click &quot;Submit&quot; to view your result</span>
                </li>
              </ol>
            </div>

            {relatedResults.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">Related Results</h3>
                <div className="space-y-3">
                  {relatedResults.map((rel) => (
                    <Link key={rel.id} href={`/results/${rel.slug}`} className="block p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition">
                      <p className="font-medium text-gray-800 text-sm">{rel.title || rel.instituteName || rel.boardName}</p>
                      <p className="text-xs text-gray-500">{rel.year}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationEvent",
            "name": result.title || `Result ${result.year}`,
            "description": generateMetaDescription(result),
            "startDate": result.resultDate?.toISOString(),
            "location": {
              "@type": "Place",
              "name": institutionName,
              "address": { "@type": "PostalAddress", "addressLocality": cityName, "addressCountry": "PK" }
            },
            "organizer": {
              "@type": "Organization",
              "name": institutionName,
              "url": officialWebsite
            }
          })
        }}
      />
    </main>
  );
}