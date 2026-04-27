// app/(public)/programs/page.tsx (OPTIMIZED VERSION)
import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { programs, categories, programOfferings } from '@/app/lib/schema';
import { eq, desc, count, inArray } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

// ✅ SINGLE revalidate - 24 hours as requested
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Programs | BS, BSc, Engineering, Medical & More | NextID.pk',
  description: 'Browse all educational programs in Pakistan including BS, BSc, Engineering, Medical, and professional programs. Find program details, universities, and admissions.',
  keywords: 'programs in Pakistan, BS program, BSc program, Engineering program, Medical program, professional programs',
  openGraph: {
    title: 'Educational Programs in Pakistan | BS, BSc, Engineering & More',
    description: 'Complete guide to educational programs in Pakistan. Browse all programs with details, universities, and admissions.',
    type: 'website',
    url: 'https://www.nextid.pk/programs',
  },
  alternates: {
    canonical: 'https://www.nextid.pk/programs',
  },
};

interface ProgramWithStats {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  isFeatured: boolean | null;
  categoryName: string | null;
  categorySlug: string | null;
  institutesCount: number;
}

// ✅ OPTIMIZED: Cached version of getProgramsWithStats
async function getProgramsWithStats(): Promise<ProgramWithStats[]> {
  return unstable_cache(
    async () => {
      try {
        const allPrograms = await db
          .select({
            id: programs.id,
            name: programs.name,
            slug: programs.slug,
            shortDescription: programs.shortDescription,
            isFeatured: programs.isFeatured,
            status: programs.status,
            categoryId: programs.categoryId,
          })
          .from(programs)
          .where(eq(programs.status, true))
          .orderBy(desc(programs.isFeatured), programs.name);

        if (allPrograms.length === 0) {
          return [];
        }

        const programIds = allPrograms.map(p => p.id);
        const categoryIds = [...new Set(allPrograms.map(p => p.categoryId).filter((id): id is number => id !== null))];
        
        let categoryMap = new Map<number, { name: string; slug: string }>();
        
        if (categoryIds.length > 0) {
          const categoriesList = await db
            .select({
              id: categories.id,
              name: categories.name,
              slug: categories.slug,
            })
            .from(categories)
            .where(inArray(categories.id, categoryIds));
          
          categoryMap = new Map(categoriesList.map(c => [c.id, { name: c.name, slug: c.slug }]));
        }

        const institutesCounts = await db
          .select({
            programId: programOfferings.programId,
            count: count(),
          })
          .from(programOfferings)
          .where(inArray(programOfferings.programId, programIds))
          .groupBy(programOfferings.programId);

        const institutesMap = new Map(institutesCounts.map(i => [i.programId, Number(i.count)]));

        const programsWithStats = allPrograms.map((program) => {
          const category = program.categoryId ? categoryMap.get(program.categoryId) : null;
          const institutesCount = institutesMap.get(program.id) || 0;

          return {
            id: program.id,
            name: program.name,
            slug: program.slug,
            shortDescription: program.shortDescription,
            isFeatured: program.isFeatured,
            categoryName: category?.name || null,
            categorySlug: category?.slug || null,
            institutesCount,
          };
        });

        return programsWithStats;
      } catch (error) {
        console.error('[CACHE] Failed to fetch programs:', error);
        return [];
      }
    },
    ['programs-with-stats'],
    {
      revalidate: 86400, // 24 hours as requested
      tags: ['programs'],
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to load programs</h2>
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

const categoryIcons: Record<string, string> = {
  'Engineering': '⚙️',
  'Medical': '🏥',
  'Business': '💼',
  'Arts': '🎨',
  'Science': '🔬',
  'Commerce': '📊',
  'IT': '💻',
  'Computer Science': '🖥️',
  'Law': '⚖️',
  'Education': '📚',
  'Agriculture': '🌾',
  'Pharmacy': '💊',
  'Nursing': '🩺',
  'Dental': '🦷',
  'Architecture': '🏛️',
  'Fashion': '👗',
  'Media': '📺',
  'Psychology': '🧠',
};

const defaultIcon = '📚';

export default async function ProgramsPage() {
  let programsList: ProgramWithStats[] = [];
  let fetchError = false;
  
  try {
    programsList = await getProgramsWithStats();
  } catch (error) {
    console.error('[PAGE] Failed to load programs:', error);
    fetchError = true;
  }

  if (fetchError) {
    return <ErrorState />;
  }

  const programsByCategory = programsList.reduce((acc, program) => {
    const category = program.categoryName || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(program);
    return acc;
  }, {} as Record<string, ProgramWithStats[]>);

  const totalPrograms = programsList.length;
  const totalCategories = Object.keys(programsByCategory).length;
  const totalInstitutes = programsList.reduce((sum, p) => sum + p.institutesCount, 0);
  const featuredPrograms = programsList.filter(p => p.isFeatured).length;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ✅ SEO: Added cache header */}
      <meta httpEquiv="Cache-Control" content="public, s-maxage=86400, stale-while-revalidate=86400" />
      
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
              <span className="text-white font-medium">Programs</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Educational</span>{' '}
              <span className="text-yellow-400">Programs</span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Browse all educational programs including BS, BSc, Engineering, Medical, and professional programs
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 mt-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{totalPrograms}</div>
                <div className="text-sm text-gray-600">Total Programs</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📂</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{totalCategories}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏛️</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{totalInstitutes}</div>
                <div className="text-sm text-gray-600">Universities</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-600">{featuredPrograms}</div>
                <div className="text-sm text-gray-600">Featured</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        
        {programsList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No programs found</h3>
            <p className="text-gray-500">No educational programs available yet.</p>
          </div>
        ) : (
          <>
            {Object.entries(programsByCategory).map(([categoryName, categoryPrograms]) => {
              const icon = categoryIcons[categoryName] || defaultIcon;
              
              return (
                <section key={`category-${categoryName}`} className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="text-3xl">{icon}</span>
                    <span>{categoryName} Programs</span>
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({categoryPrograms.length} programs)
                    </span>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {categoryPrograms.slice(0, 6).map((program) => (
                      <Link
                        key={program.id}
                        href={`/programs/${program.slug}`}
                        className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-5 border border-gray-200 hover:border-blue-400"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">
                            {program.name}
                          </h3>
                          {program.isFeatured && (
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                              Featured
                            </span>
                          )}
                        </div>
                        
                        {program.shortDescription && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {program.shortDescription}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="text-base">🏛️</span>
                            <span>{program.institutesCount} Universities</span>
                          </div>
                          <div className="flex items-center text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                            <span>View Details</span>
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  {categoryPrograms.length > 6 && (
                    <div className="text-center mt-4">
                      <Link
                        href={`/categories/${categoryPrograms[0]?.categorySlug || ''}`}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all {categoryPrograms.length} programs in {categoryName}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </section>
              );
            })}

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-yellow-600 rounded-full"></span>
                  ⭐ Most Popular Programs
                </h2>
                
                <div className="space-y-3">
                  {programsList
                    .filter(p => p.institutesCount > 0)
                    .sort((a, b) => b.institutesCount - a.institutesCount)
                    .slice(0, 5)
                    .map((program, index) => (
                      <Link
                        key={program.id}
                        href={`/programs/${program.slug}`}
                        className="flex items-center gap-3 p-2 hover:bg-yellow-50 rounded-lg transition-colors group"
                      >
                        <span className="text-xl w-8 text-center font-bold text-yellow-600">{index + 1}.</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 group-hover:text-yellow-600">
                            {program.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {program.institutesCount} universities
                          </div>
                        </div>
                        <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                      </Link>
                    ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-green-600 rounded-full"></span>
                  🔗 Quick Links
                </h2>
                
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/categories"
                    className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors"
                  >
                    <div className="text-2xl mb-1">📂</div>
                    <div className="text-sm font-medium text-purple-700">Categories</div>
                  </Link>
                  
                  <Link
                    href="/degrees"
                    className="p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-center transition-colors"
                  >
                    <div className="text-2xl mb-1">🎓</div>
                    <div className="text-sm font-medium text-indigo-700">Degrees</div>
                  </Link>
                  
                  <Link
                    href="/institutes"
                    className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors"
                  >
                    <div className="text-2xl mb-1">🏛️</div>
                    <div className="text-sm font-medium text-blue-700">Universities</div>
                  </Link>
                  
                  <Link
                    href="/admissions"
                    className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors"
                  >
                    <div className="text-2xl mb-1">📝</div>
                    <div className="text-sm font-medium text-green-700">Admissions</div>
                  </Link>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(programsByCategory).slice(0, 8).map(category => (
                      <span
                        key={category}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                      >
                        {category}
                      </span>
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