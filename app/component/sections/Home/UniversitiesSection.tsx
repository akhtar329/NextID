// app/component/sections/Home/UniversitiesSection.tsx
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { institutes, cities, programOfferings } from '@/app/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';

interface University {
  id: number;
  name: string;
  slug: string;
  type: string;
  city: string | null;
  citySlug: string | null;
  description: string | null;
  website: string | null;
  isFeatured: boolean | null;
  programCount: number;
}

async function getFeaturedUniversities(): Promise<University[]> {
  try {
    const universitiesData = await db
      .select({
        id: institutes.id,
        name: institutes.name,
        slug: institutes.slug,
        type: institutes.type,
        city: cities.name,
        citySlug: cities.slug,
        description: institutes.description,
        website: institutes.website,
        isFeatured: institutes.isFeatured,
        programCount: sql<number>`count(distinct ${programOfferings.id})`,
      })
      .from(institutes)
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .leftJoin(programOfferings, eq(institutes.id, programOfferings.instituteId))
      .where(eq(institutes.status, true))
      .groupBy(
        institutes.id, 
        institutes.name, 
        institutes.slug, 
        institutes.type, 
        cities.name, 
        cities.slug, 
        institutes.description, 
        institutes.website, 
        institutes.isFeatured
      )
      .orderBy(desc(institutes.isFeatured), desc(sql`count(distinct ${programOfferings.id})`))
      .limit(10);

    return universitiesData.map(uni => ({
      ...uni,
      programCount: Number(uni.programCount) || 0,
    }));
  } catch {
    return [];
  }
}

function getTypeColor(type: string): string {
  const typeLower = type?.toLowerCase();
  if (typeLower === 'public') return 'bg-green-100 text-green-800';
  if (typeLower === 'private') return 'bg-purple-100 text-purple-800';
  return 'bg-blue-100 text-blue-800';
}

function UniversityMobileCard({ university }: { university: University }) {
  const typeColor = getTypeColor(university.type);
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏛️</div>
            <div>
              <div className="text-lg font-semibold text-gray-900 line-clamp-1">
                {university.name}
              </div>
              <div className="text-sm text-gray-600">
                {university.city || 'Pakistan'}
              </div>
            </div>
          </div>
          {university.isFeatured && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
              ⭐ Featured
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeColor}`}>
            {university.type || 'University'}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            📚 {university.programCount} Programs
          </span>
        </div>

        {university.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {university.description}
          </p>
        )}

        <Link
          href={`/universities/${university.slug}`}
          className="block w-full text-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}

function UniversityTableRow({ university }: { university: University }) {
  const typeColor = getTypeColor(university.type);
  
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="text-2xl">🏛️</div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {university.name}
            </div>
            {university.isFeatured && (
              <span className="inline-flex items-center px-2 py-0.5 mt-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                ⭐ Featured
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          {university.city || '-'}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeColor}`}>
          {university.type || 'University'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          📚 {university.programCount} Programs
        </span>
      </td>
      <td className="px-6 py-4">
        <Link
          href={`/universities/${university.slug}`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Details →
        </Link>
      </td>
    </tr>
  );
}

export default async function UniversitiesSection() {
  const universities = await getFeaturedUniversities();

  if (!universities.length) {
    return null;
  }

  const uniqueCities = [...new Set(universities.map(u => u.city).filter(Boolean))];
  const publicCount = universities.filter(u => u.type?.toLowerCase() === 'public').length;
  const privateCount = universities.filter(u => u.type?.toLowerCase() === 'private').length;
  const featuredCount = universities.filter(u => u.isFeatured).length;

  return (
    <section className="py-12 bg-gradient-to-br from-gray-50 to-blue-50/20">
      <div className="container mx-auto px-4 max-w-6xl">
        
        <div className="text-center mb-10">
          <div className="inline-block mb-3">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-1 rounded-full">
              🎓 Higher Education
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Top Universities in Pakistan
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
            Explore leading educational institutions offering quality higher education across {uniqueCities.length}+ cities
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{universities.length}</div>
            <div className="text-xs text-gray-600">Total Universities</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{publicCount}</div>
            <div className="text-xs text-gray-600">Public Sector</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{privateCount}</div>
            <div className="text-xs text-gray-600">Private Sector</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{featuredCount}</div>
            <div className="text-xs text-gray-600">Featured</div>
          </div>
        </div>

        <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  University Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  City
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  Programs
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {universities.slice(0, 6).map((university) => (
                <UniversityTableRow key={university.id} university={university} />
              ))}
            </tbody>
          </table>

          {universities.length > 6 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing 6 of {universities.length} universities
              </p>
              <Link
                href="/universities"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View All Universities →
              </Link>
            </div>
          )}
        </div>

        <div className="lg:hidden space-y-4">
          {universities.slice(0, 4).map((university) => (
            <UniversityMobileCard key={university.id} university={university} />
          ))}
          
          {universities.length > 4 && (
            <div className="text-center pt-4">
              <Link
                href="/universities"
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All {universities.length} Universities →
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}