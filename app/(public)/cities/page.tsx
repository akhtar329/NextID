// app/(public)/cities/page.tsx (Updated Stats Section)

import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { cities, institutes, admissions, results, news } from '@/app/lib/schema';
import { eq, and, count, sql } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Education Cities in Pakistan | Institutes, Admissions & Results | NextID.pk',
  description: 'Find institutes, universities, admissions, results, and educational news by city in Pakistan.',
  alternates: {
    canonical: 'https://www.nextid.pk/cities',
  },
};

interface CityWithStats {
  id: number;
  name: string;
  slug: string;
  province: string | null;
  isPopular: boolean | null;
  status: boolean | null;
  createdAt: Date | null;
  institutesCount: number;
  admissionsCount: number;
  resultsCount: number;
  newsCount: number;
  totalCount: number;
}

async function getCitiesWithStats(): Promise<CityWithStats[]> {
  try {
    const allCities = await db
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
      .where(eq(cities.status, true))
      .orderBy(cities.name);

    const citiesWithStats = await Promise.all(
      allCities.map(async (city) => {
        const institutesResult = await db
          .select({ count: count() })
          .from(institutes)
          .where(
            and(
              eq(institutes.status, true),
              eq(institutes.cityId, city.id)
            )
          );
        
        const admissionsResult = await db
          .select({ count: count() })
          .from(admissions)
          .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
          .where(
            and(
              eq(institutes.cityId, city.id),
              eq(admissions.status, 'open')
            )
          );
        
        const resultsResult = await db
          .select({ count: count() })
          .from(results)
          .where(
            and(
              eq(results.status, true),
              sql`${results.title} ILIKE ${`%${city.name}%`}`
            )
          );
        
        const newsResult = await db
          .select({ count: count() })
          .from(news)
          .where(
            and(
              eq(news.status, true),
              sql`${news.cityId} = ${city.id} OR 
                  ${news.title} ILIKE ${`%${city.name}%`}`
            )
          );
        
        const institutesCount = institutesResult[0]?.count || 0;
        const admissionsCount = admissionsResult[0]?.count || 0;
        const resultsCount = resultsResult[0]?.count || 0;
        const newsCount = newsResult[0]?.count || 0;
        const totalCount = institutesCount + admissionsCount + resultsCount + newsCount;
        
        return {
          ...city,
          institutesCount,
          admissionsCount,
          resultsCount,
          newsCount,
          totalCount,
        };
      })
    );

    return citiesWithStats.sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return b.totalCount - a.totalCount;
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}

export default async function CitiesPage() {
  const cities = await getCitiesWithStats();

  const totalCities = cities.length;
  const popularCities = cities.filter(c => c.isPopular === true).length;
  const totalInstitutes = cities.reduce((sum, city) => sum + city.institutesCount, 0);
  const totalAdmissions = cities.reduce((sum, city) => sum + city.admissionsCount, 0);
  const totalResults = cities.reduce((sum, city) => sum + city.resultsCount, 0);
  const totalNews = cities.reduce((sum, city) => sum + city.newsCount, 0);
  const topCity = cities.length > 0 ? cities[0].name : 'N/A';

  const citiesByProvince = cities.reduce((acc, city) => {
    const province = city.province || 'Other';
    if (!acc[province]) {
      acc[province] = [];
    }
    acc[province].push(city);
    return acc;
  }, {} as Record<string, CityWithStats[]>);

  const provinceEmoji: Record<string, string> = {
    'Punjab': '🌾',
    'Sindh': '🌊',
    'KPK': '⛰️',
    'Balochistan': '🏜️',
    'ICT': '🏛️',
  };

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-blue-200 mb-4">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span className="text-blue-300">›</span>
              <span className="text-white font-medium">Cities</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Education in</span>{' '}
              <span className="text-yellow-400">Pakistani Cities</span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Find institutes, universities, admissions, results, and educational news by city
            </p>
          </div>
        </div>
      </section>

      {/* Stats Cards - with proper spacing */}
      <div className="container mx-auto px-4 mt-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-blue-600">{totalCities}</div>
            <div className="text-sm text-gray-600">Total Cities</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-purple-600">{totalInstitutes}</div>
            <div className="text-sm text-gray-600">Institutes</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-green-600">{totalAdmissions}</div>
            <div className="text-sm text-gray-600">Admissions</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-orange-600">{totalResults}</div>
            <div className="text-sm text-gray-600">Results</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-yellow-500">{popularCities}</div>
            <div className="text-sm text-gray-600">Popular Cities</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        
        {cities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">🏙️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No city data found</h3>
            <p className="text-gray-500">No educational data available for cities yet.</p>
          </div>
        ) : (
          <>
            {/* Cities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cities.map((city) => {
                const emoji = city.province ? provinceEmoji[city.province] || '🏙️' : '🏙️';
                
                return (
                  <Link
                    key={city.id}
                    href={`/cities/${city.slug}`}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-400"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="text-3xl mb-2 block">{emoji}</span>
                          <span className="text-xs text-gray-500">{city.province || 'Other'}</span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {city.isPopular && (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                              <span className="text-yellow-500">⭐</span> Popular
                            </span>
                          )}
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                            {city.totalCount} Total
                          </span>
                        </div>
                      </div>
                      
                      <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-4">
                        {city.name}
                      </h2>
                      
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="bg-purple-50 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-purple-700">{city.institutesCount}</div>
                          <div className="text-xs text-gray-600">Inst</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-green-700">{city.admissionsCount}</div>
                          <div className="text-xs text-gray-600">Adm</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-orange-700">{city.resultsCount}</div>
                          <div className="text-xs text-gray-600">Res</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-blue-700">{city.newsCount}</div>
                          <div className="text-xs text-gray-600">News</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {city.createdAt ? `Since ${new Date(city.createdAt).getFullYear()}` : ''}
                        </span>
                        <div className="flex items-center text-blue-600 text-sm font-medium">
                          <span>Explore City</span>
                          <svg className="w-4 h-4 ml-2 group-hover:ml-3 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Bottom Section */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Cities by Category */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                  Top Cities by Category
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">🏛️ Most Institutes</span>
                      <span className="text-xs text-gray-500">
                        {Math.max(...cities.map(c => c.institutesCount))} Institutes
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cities.sort((a, b) => b.institutesCount - a.institutesCount).slice(0, 3).map((city, i) => (
                        <span key={city.id} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {i+1}. {city.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">📝 Most Admissions</span>
                      <span className="text-xs text-gray-500">
                        {Math.max(...cities.map(c => c.admissionsCount))} Admissions
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cities.sort((a, b) => b.admissionsCount - a.admissionsCount).slice(0, 3).map((city, i) => (
                        <span key={city.id} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {i+1}. {city.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">📊 Most Results</span>
                      <span className="text-xs text-gray-500">
                        {Math.max(...cities.map(c => c.resultsCount))} Results
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cities.sort((a, b) => b.resultsCount - a.resultsCount).slice(0, 3).map((city, i) => (
                        <span key={city.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          {i+1}. {city.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">📰 Most News</span>
                      <span className="text-xs text-gray-500">
                        {Math.max(...cities.map(c => c.newsCount))} News
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cities.sort((a, b) => b.newsCount - a.newsCount).slice(0, 3).map((city, i) => (
                        <span key={city.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {i+1}. {city.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Province Stats */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                  Province Overview
                </h2>
                
                {Object.entries(citiesByProvince).map(([province, provinceCities]) => {
                  const provinceInstitutes = provinceCities.reduce((sum, c) => sum + c.institutesCount, 0);
                  const provinceAdmissions = provinceCities.reduce((sum, c) => sum + c.admissionsCount, 0);
                  const provinceResults = provinceCities.reduce((sum, c) => sum + c.resultsCount, 0);
                  const provinceNews = provinceCities.reduce((sum, c) => sum + c.newsCount, 0);
                  const provinceTotal = provinceInstitutes + provinceAdmissions + provinceResults + provinceNews;
                  
                  return (
                    <div key={province} className="mb-4 last:mb-0 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{province}</span>
                        <span className="text-sm text-gray-600">
                          {provinceCities.length} cities • {provinceTotal} total
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-1 mb-2">
                        <div className="text-center">
                          <div className="text-xs font-bold text-purple-600">{provinceInstitutes}</div>
                          <div className="text-[10px] text-gray-500">Inst</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-green-600">{provinceAdmissions}</div>
                          <div className="text-[10px] text-gray-500">Adm</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-orange-600">{provinceResults}</div>
                          <div className="text-[10px] text-gray-500">Res</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-blue-600">{provinceNews}</div>
                          <div className="text-[10px] text-gray-500">News</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {provinceCities.map(city => (
                          <span
                            key={city.id}
                            className={`text-[10px] px-2 py-0.5 rounded-full ${
                              city.isPopular 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {city.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}