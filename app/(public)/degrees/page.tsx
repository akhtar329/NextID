// app/(public)/degrees/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { degrees, levels, categories, programs } from '@/app/lib/schema';
import { eq, and, count, inArray, desc } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Degrees | BS, BA, BSc, MA, MSc & More | NextID.pk',
  description: 'Browse all educational degrees in Pakistan including BS, BA, BSc, MA, MSc, and professional degrees.',
  alternates: {
    canonical: 'https://www.nextid.pk/degrees',
  },
};

interface DegreeWithStats {
  id: number;
  name: string;
  slug: string;
  fullForm: string | null;
  levelId: number;
  categoryId: number;
  displayOrder: number | null;
  status: boolean | null;
  createdAt: Date | null;
  levelName: string;
  levelSlug: string;
  categoryName: string;
  categorySlug: string;
  programsCount: number;
}

async function getDegreesWithStats(): Promise<DegreeWithStats[]> {
  try {
    // Get all degrees
    const allDegrees = await db
      .select({
        id: degrees.id,
        name: degrees.name,
        slug: degrees.slug,
        fullForm: degrees.fullForm,
        levelId: degrees.levelId,
        categoryId: degrees.categoryId,
        displayOrder: degrees.displayOrder,
        status: degrees.status,
        createdAt: degrees.createdAt,
      })
      .from(degrees)
      .where(eq(degrees.status, true))
      .orderBy(degrees.displayOrder, degrees.name);

    if (allDegrees.length === 0) {
      return [];
    }

    // Get levels for these degrees
    const levelIds = [...new Set(allDegrees.map(d => d.levelId))];
    const levelsList = await db
      .select({
        id: levels.id,
        name: levels.name,
        slug: levels.slug,
      })
      .from(levels)
      .where(inArray(levels.id, levelIds));

    const levelMap = new Map(levelsList.map(l => [l.id, l]));

    // Get categories for these degrees
    const categoryIds = [...new Set(allDegrees.map(d => d.categoryId))];
    const categoriesList = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .where(inArray(categories.id, categoryIds));

    const categoryMap = new Map(categoriesList.map(c => [c.id, c]));

    // Get programs count for each degree
    const degreesWithStats = await Promise.all(
      allDegrees.map(async (degree) => {
        const programsResult = await db
          .select({ count: count() })
          .from(programs)
          .where(and(eq(programs.degreeId, degree.id), eq(programs.status, true)));

        const programsCount = programsResult[0]?.count || 0;
        const level = levelMap.get(degree.levelId);
        const category = categoryMap.get(degree.categoryId);

        return {
          ...degree,
          levelName: level?.name || 'Unknown',
          levelSlug: level?.slug || '',
          categoryName: category?.name || 'Unknown',
          categorySlug: category?.slug || '',
          programsCount,
        };
      })
    );

    return degreesWithStats;
  } catch (error) {
    console.error('Error fetching degrees:', error);
    return [];
  }
}

// Icons for degrees
const degreeIcons: Record<string, string> = {
  'BS': '🔬',
  'BA': '🎨',
  'BSc': '📊',
  'BBA': '💼',
  'BCom': '📈',
  'BEd': '📚',
  'LLB': '⚖️',
  'MBBS': '🏥',
  'BDS': '🦷',
  'DVM': '🐾',
  'PharmD': '💊',
  'MA': '📖',
  'MSc': '🔭',
  'MBA': '📊',
  'MCom': '📉',
  'MEd': '📘',
  'LLM': '⚖️',
  'MS': '🔬',
  'MPhil': '🎓',
  'PhD': '👨‍🎓',
};

// Default icon
const defaultIcon = '🎓';

export default async function DegreesPage() {
  const degrees = await getDegreesWithStats();

  // Group degrees by level
  const degreesByLevel = degrees.reduce((acc, degree) => {
    const level = degree.levelName;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(degree);
    return acc;
  }, {} as Record<string, DegreeWithStats[]>);

  // Calculate stats
  const totalDegrees = degrees.length;
  const totalLevels = Object.keys(degreesByLevel).length;
  const totalPrograms = degrees.reduce((sum, d) => sum + d.programsCount, 0);
  const popularDegrees = degrees.filter(d => d.programsCount > 0).length;

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-indigo-200 mb-4">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span className="text-indigo-300">›</span>
              <span className="text-white font-medium">Degrees</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Educational</span>{' '}
              <span className="text-yellow-400">Degrees</span>
            </h1>
            
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Browse all degrees from Matric to PhD including BS, BA, BSc, MA, MSc and professional programs
            </p>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 mt-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎓</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-indigo-600">{totalDegrees}</div>
                <div className="text-sm text-gray-600">Total Degrees</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{totalLevels}</div>
                <div className="text-sm text-gray-600">Levels</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{totalPrograms}</div>
                <div className="text-sm text-gray-600">Programs</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{popularDegrees}</div>
                <div className="text-sm text-gray-600">Active Degrees</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        
        {degrees.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No degrees found</h3>
            <p className="text-gray-500">No educational degrees available yet.</p>
          </div>
        ) : (
          <>
            {/* Degrees by Level */}
            {Object.entries(degreesByLevel).map(([levelName, levelDegrees]) => (
              <section key={`level-${levelName}`} className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-8 bg-indigo-600 rounded-full"></span>
                  {levelName} Degrees
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({levelDegrees.length} degrees)
                  </span>
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {levelDegrees.map((degree) => {
                    const icon = degreeIcons[degree.name] || defaultIcon;
                    
                    return (
                      <Link
                        key={`degree-${degree.id}`}
                        href={`/degrees/${degree.slug}`}
                        className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-5 border border-gray-200 hover:border-indigo-400 group"
                      >
                        <div className="text-4xl mb-3 text-center">{icon}</div>
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-center">
                          {degree.name}
                        </h3>
                        {degree.fullForm && (
                          <p className="text-xs text-gray-500 text-center mt-1 line-clamp-1">
                            {degree.fullForm}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {degree.categoryName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {degree.programsCount} programs
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* Bottom Sections */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Popular Degrees */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-yellow-600 rounded-full"></span>
                  ⭐ Most Popular
                </h2>
                
                <div className="space-y-3">
                  {degrees
                    .sort((a, b) => b.programsCount - a.programsCount)
                    .slice(0, 5)
                    .map((degree, index) => (
                      <Link
                        key={`popular-${degree.id}`}
                        href={`/degrees/${degree.slug}`}
                        className="flex items-center gap-3 p-2 hover:bg-yellow-50 rounded-lg transition-colors group"
                      >
                        <span className="text-xl w-8 text-center">{index + 1}.</span>
                        <span className="text-2xl">{degreeIcons[degree.name] || defaultIcon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 group-hover:text-yellow-600">
                            {degree.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {degree.programsCount} programs
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>

              {/* By Category */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
                  📊 By Category
                </h2>
                
                <div className="space-y-2">
                  {Array.from(new Set(degrees.map(d => d.categoryName))).slice(0, 8).map(category => {
                    const count = degrees.filter(d => d.categoryName === category).length;
                    return (
                      <Link
                        key={`cat-${category}`}
                        href={`/categories/${degrees.find(d => d.categoryName === category)?.categorySlug}`}
                        className="flex items-center justify-between p-2 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <span className="text-gray-700">{category}</span>
                        <span className="text-sm font-medium text-purple-600">{count}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-green-600 rounded-full"></span>
                  🔗 Quick Links
                </h2>
                
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/levels"
                    className="p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-center transition-colors"
                  >
                    <div className="text-2xl mb-1">📊</div>
                    <div className="text-sm font-medium text-indigo-700">Levels</div>
                  </Link>
                  
                  <Link
                    href="/categories"
                    className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors"
                  >
                    <div className="text-2xl mb-1">📂</div>
                    <div className="text-sm font-medium text-purple-700">Categories</div>
                  </Link>
                  
                  <Link
                    href="/programs"
                    className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors"
                  >
                    <div className="text-2xl mb-1">📚</div>
                    <div className="text-sm font-medium text-blue-700">Programs</div>
                  </Link>
                  
                  <Link
                    href="/institutes"
                    className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors"
                  >
                    <div className="text-2xl mb-1">🏛️</div>
                    <div className="text-sm font-medium text-green-700">Institutes</div>
                  </Link>
                </div>

                {/* Degree Tags */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Popular Degrees</h3>
                  <div className="flex flex-wrap gap-1">
                    {degrees.slice(0, 8).map(degree => (
                      <Link
                        key={`tag-${degree.id}`}
                        href={`/degrees/${degree.slug}`}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                      >
                        {degree.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}