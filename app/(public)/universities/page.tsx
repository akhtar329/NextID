// app/(public)/universities/page.tsx (COMPLETE OPTIMIZED VERSION)
import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { institutes, cities, programOfferings, admissions } from '@/app/lib/schema';
import { eq, desc, like, and, or, sql, count, inArray, SQL } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

// ✅ SINGLE revalidate - 24 hours as requested
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Top Universities in Pakistan 2026 | Rankings, Admissions & Fees | NextID.pk',
  description: 'Find top universities in Pakistan: NUST, FAST, LUMS, Punjab University, Karachi University. Check rankings, admissions 2026, fees, programs & eligibility',
  keywords: 'universities in Pakistan, top universities Pakistan, NUST, FAST, LUMS, Punjab University, Karachi University, university rankings Pakistan, university admissions 2026, university fees, university programs',
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
    canonical: 'https://www.nextid.pk/universities',
  },
  openGraph: {
    title: 'Top Universities in Pakistan 2026 | Rankings & Admissions',
    description: 'Complete guide to universities in Pakistan. Check rankings, programs, admissions, fees & eligibility.',
    images: ['/images/universities-og.jpg'],
  },
};

interface University {
  id: number;
  name: string;
  slug: string;
  type: string;
  city: string;
  citySlug: string;
  established: string | null;
  website: string | null;
  description: string | null;
  programsCount: number;
  admissionsCount: number;
  isFeatured: boolean | null;
  ranking?: number;
}

interface Filters {
  city?: string;
  type?: string;
  q?: string;
}

const CITIES = [
  { slug: '', name: 'All Cities' },
  { slug: 'lahore', name: 'Lahore' },
  { slug: 'karachi', name: 'Karachi' },
  { slug: 'islamabad', name: 'Islamabad' },
  { slug: 'rawalpindi', name: 'Rawalpindi' },
  { slug: 'faisalabad', name: 'Faisalabad' },
  { slug: 'multan', name: 'Multan' },
  { slug: 'peshawar', name: 'Peshawar' },
  { slug: 'quetta', name: 'Quetta' },
  { slug: 'gujranwala', name: 'Gujranwala' },
];

const UNIVERSITY_RANKINGS: Record<string, number> = {
  'nust': 1,
  'lums': 2,
  'fast': 3,
  'pu': 4,
  'comsats': 5,
  'ku': 6,
  'uet': 7,
  'iba': 8,
  'giki': 9,
  'air': 10,
};

// ✅ OPTIMIZED: Cached version of getUniversities
async function getUniversities(filters: Filters): Promise<University[]> {
  const cacheKey = `universities-list-${JSON.stringify(filters)}`;
  
  return unstable_cache(
    async () => {
      try {
        const conditions: SQL[] = [];

        if (filters.city) {
          conditions.push(eq(cities.slug, filters.city));
        }

        if (filters.type) {
          conditions.push(eq(institutes.type, filters.type));
        }

        if (filters.q) {
          const searchTerm = `%${filters.q}%`;
          conditions.push(
            or(
              like(institutes.name, searchTerm),
              like(cities.name, searchTerm)
            ) as SQL
          );
        }

        const institutesList = await db
          .select({
            id: institutes.id,
            name: institutes.name,
            slug: institutes.slug,
            type: institutes.type,
            city: cities.name,
            citySlug: cities.slug,
            website: institutes.website,
            description: institutes.description,
            isFeatured: institutes.isFeatured,
          })
          .from(institutes)
          .innerJoin(cities, eq(institutes.cityId, cities.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(institutes.isFeatured), institutes.name)
          .limit(100);

        if (institutesList.length === 0) return [];

        const instituteIds = institutesList.map(i => i.id);

        const [programsCounts, admissionsCounts] = await Promise.all([
          db
            .select({
              instituteId: programOfferings.instituteId,
              count: count(),
            })
            .from(programOfferings)
            .where(inArray(programOfferings.instituteId, instituteIds))
            .groupBy(programOfferings.instituteId),
          
          db
            .select({
              instituteId: admissions.instituteId,
              count: count(),
            })
            .from(admissions)
            .where(and(inArray(admissions.instituteId, instituteIds), eq(admissions.status, 'Open')))
            .groupBy(admissions.instituteId),
        ]);

        const programsMap = new Map(programsCounts.map(p => [p.instituteId, Number(p.count)]));
        const admissionsMap = new Map(admissionsCounts.map(a => [a.instituteId, Number(a.count)]));

        const institutesWithStats = institutesList.map((inst) => ({
          ...inst,
          programsCount: programsMap.get(inst.id) || 0,
          admissionsCount: admissionsMap.get(inst.id) || 0,
          established: null,
        }));

        const universitiesWithRanking = institutesWithStats.map(uni => ({
          ...uni,
          ranking: UNIVERSITY_RANKINGS[uni.slug] || 999,
        }));

        return universitiesWithRanking.sort((a, b) => (a.ranking || 999) - (b.ranking || 999));
      } catch (error) {
        console.error('[CACHE] Failed to fetch universities:', error);
        return [];
      }
    },
    [cacheKey],
    {
      revalidate: 86400,
      tags: ['universities'],
    }
  )();
}

// ✅ OPTIMIZED: Cached version of getStats
async function getStats() {
  return unstable_cache(
    async () => {
      try {
        const [totalInstitutes] = await db.select({ count: count() }).from(institutes);
        const [totalCities] = await db.select({ count: count() }).from(cities);
        
        const institutesWithAdmissions = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${institutes.id})` })
          .from(institutes)
          .innerJoin(admissions, eq(institutes.id, admissions.instituteId))
          .where(eq(admissions.status, 'Open'))
          .then(result => Number(result[0]?.count) || 0);

        return {
          totalInstitutes: Number(totalInstitutes?.count) || 0,
          totalCities: Number(totalCities?.count) || 0,
          institutesWithAdmissions,
        };
      } catch (error) {
        console.error('[CACHE] Failed to fetch stats:', error);
        return { totalInstitutes: 0, totalCities: 0, institutesWithAdmissions: 0 };
      }
    },
    ['universities-stats'],
    {
      revalidate: 86400,
      tags: ['universities-stats'],
    }
  )();
}

// ✅ Error boundary component
function ErrorState() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <div className="text-6xl mb-4" aria-hidden="true">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to load universities</h2>
          <p className="text-gray-600">Please try again later</p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}

function Breadcrumbs({ filters }: { filters: Filters }) {
  const items = [
    { name: 'Home', url: '/' },
    { name: 'Universities', url: '/universities' },
  ];

  if (filters.city) {
    const city = CITIES.find(c => c.slug === filters.city);
    if (city) items.push({ name: city.name, url: `/universities?city=${filters.city}` });
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

export default async function UniversitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  let universities: University[] = [];
  let stats = { totalInstitutes: 0, totalCities: 0, institutesWithAdmissions: 0 };
  let fetchError = false;
  
  try {
    const params = await searchParams || {};
    
    const filters: Filters = {
      city: typeof params.city === 'string' ? params.city : '',
      type: typeof params.type === 'string' ? params.type : '',
      q: typeof params.q === 'string' ? params.q : '',
    };

    [universities, stats] = await Promise.all([
      getUniversities(filters),
      getStats(),
    ]);
  } catch (error) {
    console.error('[PAGE] Failed to load universities:', error);
    fetchError = true;
  }

  if (fetchError) {
    return <ErrorState />;
  }

  const params = await searchParams || {};
  const filters: Filters = {
    city: typeof params.city === 'string' ? params.city : '',
    type: typeof params.type === 'string' ? params.type : '',
    q: typeof params.q === 'string' ? params.q : '',
  };

  const featuredUniversities = universities.filter(u => u.isFeatured).slice(0, 4);
  const regularUniversities = universities.filter(u => !u.isFeatured);

  const buildUrl = (key: string, value: string) => {
    const urlParams = new URLSearchParams();
    if (filters.city && key !== 'city') urlParams.set('city', filters.city);
    if (filters.type && key !== 'type') urlParams.set('type', filters.type);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (value) urlParams.set(key, value);
    return urlParams.toString() ? `/universities?${urlParams.toString()}` : '/universities';
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ✅ SEO: Added cache header */}
      <meta httpEquiv="Cache-Control" content="public, s-maxage=86400, stale-while-revalidate=86400" />
      
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Top Universities in Pakistan 2026
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              NUST • FAST • LUMS • Punjab University • Karachi University • 200+ Universities
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.totalInstitutes}+</div>
                <div className="text-sm text-blue-200">Universities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.totalCities}+</div>
                <div className="text-sm text-blue-200">Cities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.institutesWithAdmissions}+</div>
                <div className="text-sm text-blue-200">Accepting Admissions</div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              <form action="/universities" method="GET" className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    name="q"
                    defaultValue={filters.q}
                    placeholder="Search by university name or city..."
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
              <p className="text-sm text-blue-200 mt-2">
                Popular: NUST • FAST • LUMS • Punjab University • Karachi • Lahore
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
              <h2 className="font-bold text-lg mb-4">Filter Universities</h2>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">City</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <Link
                    href={buildUrl('city', '')}
                    className={`block px-3 py-2 rounded-lg text-sm ${
                      !filters.city ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    All Cities
                  </Link>
                  {CITIES.filter(c => c.slug).map((city) => (
                    <Link
                      key={city.slug}
                      href={buildUrl('city', city.slug)}
                      className={`block px-3 py-2 rounded-lg text-sm ${
                        filters.city === city.slug ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {city.name}
                    </Link>
                  ))}
                </div>
              </div>

              {(filters.city || filters.type || filters.q) && (
                <Link
                  href="/universities"
                  className="block text-center text-sm text-blue-600 hover:underline mt-4 pt-3 border-t"
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
                    {universities.length} Universities Found
                  </h2>
                  <p className="text-sm text-gray-500">
                    {filters.city && `City: ${CITIES.find(c => c.slug === filters.city)?.name}`}
                    {filters.q && ` • Search: "${filters.q}"`}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{universities.filter(u => u.admissionsCount > 0).length}</span> accepting admissions
                </div>
              </div>
            </div>

            {featuredUniversities.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-yellow-500 mr-2">⭐</span>
                  Top Ranked Universities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredUniversities.map((uni) => (
                    <article key={uni.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden">
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <Link href={`/universities/${uni.slug}`}>
                            <h4 className="font-bold text-gray-900 mb-1 hover:text-blue-600">
                              {uni.name}
                            </h4>
                          </Link>
                          {uni.ranking && uni.ranking < 10 && (
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                              #{uni.ranking} Rank
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {uni.type === 'public' ? '🏛️ Public' : '🏢 Private'} • 📍 {uni.city}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          <span>📚 {uni.programsCount}+ Programs</span>
                          {uni.admissionsCount > 0 && (
                            <span className="text-green-600">📝 {uni.admissionsCount} Open</span>
                          )}
                        </div>
                        {uni.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{uni.description}</p>
                        )}
                        <div className="flex gap-2">
                          <Link 
                            href={`/universities/${uni.slug}`}
                            className="text-sm text-blue-600 hover:underline font-medium"
                          >
                            View Details →
                          </Link>
                          {uni.admissionsCount > 0 && (
                            <Link 
                              href={`/universities/${uni.slug}/admissions`}
                              className="text-sm text-green-600 hover:underline font-medium"
                            >
                              Admissions Open
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">All Universities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {regularUniversities.length > 0 ? (
                  regularUniversities.map((uni) => (
                    <article key={uni.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden">
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <Link href={`/universities/${uni.slug}`}>
                            <h4 className="font-bold text-gray-900 mb-1 hover:text-blue-600">
                              {uni.name}
                            </h4>
                          </Link>
                          {uni.ranking && uni.ranking < 20 && (
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              #{uni.ranking}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {uni.type === 'public' ? '🏛️ Public' : '🏢 Private'} • 📍 {uni.city}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          <span>📚 {uni.programsCount}+ Programs</span>
                          {uni.admissionsCount > 0 && (
                            <span className="text-green-600">📝 {uni.admissionsCount} Open</span>
                          )}
                        </div>
                        <Link 
                          href={`/universities/${uni.slug}`}
                          className="text-sm text-blue-600 hover:underline font-medium"
                        >
                          View Details →
                        </Link>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="col-span-2 bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                    <div className="text-6xl mb-4">🏛️</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Universities Found</h3>
                    <p className="text-gray-500 mb-6">
                      {filters.city || filters.type || filters.q
                        ? 'Try changing your filters'
                        : 'Check back soon for more universities'}
                    </p>
                    <Link
                      href="/universities"
                      className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View All Universities
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {universities.length >= 100 && (
              <div className="mt-6 text-center">
                <button className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Load More Universities
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="bg-white py-12 border-t border-gray-200 mt-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Complete Guide to Universities in Pakistan 2026
            </h2>
            
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>Top Universities in Pakistan</strong> include 
                <Link href="/universities/nust" className="text-blue-600 hover:underline"> NUST (National University of Sciences and Technology)</Link>, 
                <Link href="/universities/lums" className="text-blue-600 hover:underline"> LUMS (Lahore University of Management Sciences)</Link>, 
                <Link href="/universities/fast" className="text-blue-600 hover:underline"> FAST (National University of Computer and Emerging Sciences)</Link>, 
                <Link href="/universities/pu" className="text-blue-600 hover:underline"> Punjab University</Link>, and 
                <Link href="/universities/ku" className="text-blue-600 hover:underline"> Karachi University</Link>. 
                These institutions offer world-class education in engineering, business, computer science, medicine and arts.
              </p>
              
              <p>
                <strong>University Admissions 2026</strong> are now open in major cities including 
                <Link href="/cities/lahore/universities" className="text-blue-600 hover:underline"> Lahore</Link>, 
                <Link href="/cities/karachi/universities" className="text-blue-600 hover:underline"> Karachi</Link>, 
                <Link href="/cities/islamabad/universities" className="text-blue-600 hover:underline"> Islamabad</Link>, and 
                <Link href="/cities/rawalpindi/universities" className="text-blue-600 hover:underline"> Rawalpindi</Link>. 
                Check admission deadlines, merit criteria, fee structures and program offerings for each university.
              </p>
              
              <p>
                <strong>University Rankings in Pakistan</strong> are based on factors like faculty qualifications, research output, 
                employer reputation, and international collaborations. NUST, LUMS, FAST, COMSATS and GIKI consistently rank 
                among the top engineering and technology institutions in the country.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions About Universities
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">Which is the No. 1 university in Pakistan?</h3>
              <p className="text-gray-600 text-sm">
                NUST (National University of Sciences and Technology) is consistently ranked as the top university in Pakistan for engineering and technology. LUMS leads in business and management education.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">How many universities are there in Pakistan?</h3>
              <p className="text-gray-600 text-sm">
                There are over 200 universities in Pakistan, including both public and private sector institutions, recognized by the Higher Education Commission (HEC).
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">Which city has the most universities?</h3>
              <p className="text-gray-600 text-sm">
                Lahore has the highest number of universities in Pakistan, followed by Karachi, Islamabad, and Rawalpindi. Each city offers diverse programs across multiple disciplines.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">When do university admissions start?</h3>
              <p className="text-gray-600 text-sm">
                Most universities start admissions in July-August for Fall semester and December-January for Spring semester. Check individual university pages for exact dates.
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
            "name": "Universities in Pakistan 2026",
            "description": "Complete list of universities in Pakistan with rankings, programs and admissions",
            "numberOfItems": universities.length,
            "itemListElement": universities.slice(0, 10).map((uni, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "url": `https://www.nextid.pk/universities/${uni.slug}`,
              "name": uni.name
            }))
          })
        }}
      />
    </main>
  );
}