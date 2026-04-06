import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { 
  categories, 
  institutes, 
  admissions, 
  admissionOfferings,
  programOfferings,
  results, 
  news, 
  programs, 
  degrees, 
  levels 
} from '@/app/lib/schema';
import { eq, and, sql, inArray, isNotNull } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Education Categories | Institutes, Admissions, Results & News | NextID.pk',
  description: 'Browse educational categories including institutes, universities, admissions, results, and news in Pakistan.',
  alternates: {
    canonical: 'https://www.nextid.pk/categories',
  },
};

interface CategoryWithStats {
  id: number;
  name: string;
  slug: string;
  displayOrder: number | null;
  status: boolean | null;
  createdAt: Date | null;
  institutesCount: number;
  admissionsCount: number;
  resultsCount: number;
  newsCount: number;
  totalCount: number;
  degreesCount: number;
  programsCount: number;
}

// SQL helper functions
const countAll = sql<number>`count(*)`;
const countDistinct = (column: any) => sql<number>`count(distinct ${column})`;

async function getCategoriesWithStats(): Promise<CategoryWithStats[]> {
  try {
    // Get all categories
    const allCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        displayOrder: categories.displayOrder,
        status: categories.status,
        createdAt: categories.createdAt,
      })
      .from(categories)
      .where(eq(categories.status, true))
      .orderBy(categories.displayOrder, categories.name);

    // Calculate stats for each category
    const categoriesWithStats = await Promise.all(
      allCategories.map(async (category) => {
        // ✅ UPDATED: Get programs directly by categoryId
        const programsInCategory = await db
          .select({ id: programs.id })
          .from(programs)
          .where(and(
            eq(programs.categoryId, category.id),
            eq(programs.status, true)
          ));

        const programIds = programsInCategory.map(p => p.id);

        // ✅ UPDATED: Get degrees (no categoryId in new schema - fetch all degrees)
        const degreesList = await db
          .select({ id: degrees.id })
          .from(degrees)
          .where(eq(degrees.status, true));

        // ✅ UPDATED: Get institutes through programOfferings
        let institutesCount = 0;
        if (programIds.length > 0) {
          const institutesResult = await db
            .select({ value: countDistinct(institutes.id) })
            .from(institutes)
            .innerJoin(programOfferings, eq(institutes.id, programOfferings.instituteId))
            .where(
              and(
                eq(institutes.status, true),
                inArray(programOfferings.programId, programIds)
              )
            );
          institutesCount = Number(institutesResult[0]?.value) || 0;
        }

        // ✅ UPDATED: Get admissions count through admissionOfferings + programOfferings
        let admissionsCount = 0;
        if (programIds.length > 0) {
          // First get offeringIds for these programs
          const offeringIds = await db
            .select({ id: programOfferings.id })
            .from(programOfferings)
            .where(inArray(programOfferings.programId, programIds));
          
          const offeringIdList = offeringIds.map(o => o.id);
          
          if (offeringIdList.length > 0) {
            const admissionsResult = await db
              .select({ value: countDistinct(admissions.id) })
              .from(admissions)
              .innerJoin(admissionOfferings, eq(admissions.id, admissionOfferings.admissionId))
              .where(
                and(
                  eq(admissions.status, 'Open'),
                  inArray(admissionOfferings.offeringId, offeringIdList),
                  isNotNull(admissionOfferings.offeringId)
                )
              );
            admissionsCount = Number(admissionsResult[0]?.value) || 0;
          }
        }

        // ✅ UPDATED: Get results count (no direct programId in results)
        let resultsCount = 0;
        if (programIds.length > 0) {
          // Note: results are linked through resultOfferings table
          // This is a simplified count - adjust based on your schema
          const resultsResult = await db
            .select({ value: countAll })
            .from(results)
            .where(
              and(
                eq(results.status, true)
              )
            );
          resultsCount = Number(resultsResult[0]?.value) || 0;
        }

        // Get news count (search by category name)
        const newsResult = await db
          .select({ value: countAll })
          .from(news)
          .where(
            and(
              eq(news.status, true),
              sql`${news.title} ILIKE ${`%${category.name}%`} OR 
                  ${news.content} ILIKE ${`%${category.name}%`} OR
                  ${news.excerpt} ILIKE ${`%${category.name}%`}`
            )
          );

        // ✅ UPDATED: Get degrees count (all degrees, no category filter)
        const degreesResult = await db
          .select({ value: countAll })
          .from(degrees)
          .where(eq(degrees.status, true));

        // ✅ UPDATED: Get programs count (by categoryId directly)
        const programsCount = programsInCategory.length;

        const newsCount = Number(newsResult[0]?.value) || 0;
        const degreesCount = Number(degreesResult[0]?.value) || 0;
        const totalCount = institutesCount + admissionsCount + resultsCount + newsCount + degreesCount + programsCount;

        return {
          ...category,
          institutesCount,
          admissionsCount,
          resultsCount,
          newsCount,
          degreesCount,
          programsCount,
          totalCount,
        };
      })
    );

    // Sort categories by display order and total count
    return categoriesWithStats.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return (a.displayOrder || 999) - (b.displayOrder || 999);
      }
      return b.totalCount - a.totalCount;
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Default icons and colors for categories
const defaultIcons: Record<string, string> = {
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

const defaultColors: Record<string, string> = {
  'Engineering': 'from-orange-600 to-red-600',
  'Medical': 'from-red-600 to-pink-600',
  'Business': 'from-indigo-600 to-purple-600',
  'Arts': 'from-pink-600 to-rose-600',
  'Science': 'from-teal-600 to-cyan-600',
  'Commerce': 'from-gray-600 to-slate-600',
  'IT': 'from-blue-600 to-violet-600',
  'Computer Science': 'from-cyan-600 to-blue-600',
  'Law': 'from-amber-600 to-yellow-600',
  'Education': 'from-green-600 to-emerald-600',
  'Agriculture': 'from-lime-600 to-green-600',
  'Pharmacy': 'from-purple-600 to-pink-600',
  'Nursing': 'from-sky-600 to-blue-600',
  'Dental': 'from-cyan-600 to-teal-600',
  'Architecture': 'from-stone-600 to-neutral-600',
  'Fashion': 'from-fuchsia-600 to-pink-600',
  'Media': 'from-violet-600 to-purple-600',
  'Psychology': 'from-indigo-600 to-blue-600',
};

export default async function CategoriesPage() {
  const categories = await getCategoriesWithStats();

  // Calculate overall stats
  const totalCategories = categories.length;
  const totalInstitutes = categories.reduce((sum, cat) => sum + cat.institutesCount, 0);
  const totalAdmissions = categories.reduce((sum, cat) => sum + cat.admissionsCount, 0);
  const totalResults = categories.reduce((sum, cat) => sum + cat.resultsCount, 0);
  const totalNews = categories.reduce((sum, cat) => sum + cat.newsCount, 0);
  const totalDegrees = categories.reduce((sum, cat) => sum + cat.degreesCount, 0);
  const totalPrograms = categories.reduce((sum, cat) => sum + cat.programsCount, 0);

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-purple-200 mb-4">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span className="text-purple-300">›</span>
              <span className="text-white font-medium">Categories</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Educational</span>{' '}
              <span className="text-yellow-400">Categories</span>
            </h1>
            
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Browse programs, degrees, institutes, admissions, results, and news by category
            </p>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 mt-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-purple-600">{totalCategories}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-indigo-600">{totalDegrees}</div>
            <div className="text-sm text-gray-600">Degrees</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-blue-600">{totalPrograms}</div>
            <div className="text-sm text-gray-600">Programs</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-cyan-600">{totalInstitutes}</div>
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
            <div className="text-3xl font-bold text-yellow-500">{totalNews}</div>
            <div className="text-sm text-gray-600">News</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        
        {categories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-500">No educational categories available yet.</p>
          </div>
        ) : (
          <>
            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => {
                const icon = defaultIcons[category.name] || '📂';
                const gradientColor = defaultColors[category.name] || 'from-gray-600 to-slate-600';
                
                return (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-purple-400"
                  >
                    {/* Category Header */}
                    <div className={`bg-gradient-to-r ${gradientColor} p-4 text-white`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{icon}</span>
                          <div>
                            <h2 className="text-xl font-bold">{category.name}</h2>
                          </div>
                        </div>
                        <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                          #{category.displayOrder || 0}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-indigo-50 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-indigo-700">{category.degreesCount}</div>
                          <div className="text-xs text-gray-600">Degrees</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-blue-700">{category.programsCount}</div>
                          <div className="text-xs text-gray-600">Programs</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-purple-700">{category.institutesCount}</div>
                          <div className="text-xs text-gray-600">Inst</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-green-700">{category.admissionsCount}</div>
                          <div className="text-xs text-gray-600">Adm</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-orange-700">{category.resultsCount}</div>
                          <div className="text-xs text-gray-600">Res</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-yellow-600">{category.newsCount}</div>
                          <div className="text-xs text-gray-600">News</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Total: {category.totalCount} items
                        </span>
                        <div className="flex items-center text-purple-600 text-sm font-medium">
                          <span>Explore</span>
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

            {/* Bottom Sections */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Top Categories by Content */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
                  🔥 Top Categories
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Most Degrees</h3>
                    <div className="space-y-2">
                      {categories.sort((a, b) => b.degreesCount - a.degreesCount).slice(0, 3).map((cat, i) => (
                        <div key={cat.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{i+1}. {cat.name}</span>
                          <span className="font-bold text-indigo-600">{cat.degreesCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Most Programs</h3>
                    <div className="space-y-2">
                      {categories.sort((a, b) => b.programsCount - a.programsCount).slice(0, 3).map((cat, i) => (
                        <div key={cat.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{i+1}. {cat.name}</span>
                          <span className="font-bold text-blue-600">{cat.programsCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Most Institutes</h3>
                    <div className="space-y-2">
                      {categories.sort((a, b) => b.institutesCount - a.institutesCount).slice(0, 3).map((cat, i) => (
                        <div key={cat.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{i+1}. {cat.name}</span>
                          <span className="font-bold text-purple-600">{cat.institutesCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-green-600 rounded-full"></span>
                  📊 Category Stats
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Most Admissions</h3>
                    <div className="space-y-2">
                      {categories.sort((a, b) => b.admissionsCount - a.admissionsCount).slice(0, 3).map((cat, i) => (
                        <div key={cat.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{i+1}. {cat.name}</span>
                          <span className="font-bold text-green-600">{cat.admissionsCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Most Results</h3>
                    <div className="space-y-2">
                      {categories.sort((a, b) => b.resultsCount - a.resultsCount).slice(0, 3).map((cat, i) => (
                        <div key={cat.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{i+1}. {cat.name}</span>
                          <span className="font-bold text-orange-600">{cat.resultsCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Most News</h3>
                    <div className="space-y-2">
                      {categories.sort((a, b) => b.newsCount - a.newsCount).slice(0, 3).map((cat, i) => (
                        <div key={cat.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{i+1}. {cat.name}</span>
                          <span className="font-bold text-yellow-600">{cat.newsCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-orange-600 rounded-full"></span>
                  🔗 Quick Links
                </h2>
                
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/degrees"
                    className="p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-center transition-colors group"
                  >
                    <div className="text-2xl mb-1">🎓</div>
                    <div className="text-sm font-medium text-indigo-700">Degrees</div>
                  </Link>
                  
                  <Link
                    href="/programs"
                    className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors group"
                  >
                    <div className="text-2xl mb-1">📚</div>
                    <div className="text-sm font-medium text-blue-700">Programs</div>
                  </Link>
                  
                  <Link
                    href="/institutes"
                    className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors group"
                  >
                    <div className="text-2xl mb-1">🏛️</div>
                    <div className="text-sm font-medium text-purple-700">Institutes</div>
                  </Link>
                  
                  <Link
                    href="/admissions"
                    className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors group"
                  >
                    <div className="text-2xl mb-1">📝</div>
                    <div className="text-sm font-medium text-green-700">Admissions</div>
                  </Link>
                  
                  <Link
                    href="/results"
                    className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors group"
                  >
                    <div className="text-2xl mb-1">📊</div>
                    <div className="text-sm font-medium text-orange-700">Results</div>
                  </Link>
                  
                  <Link
                    href="/news"
                    className="p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center transition-colors group"
                  >
                    <div className="text-2xl mb-1">📰</div>
                    <div className="text-sm font-medium text-yellow-600">News</div>
                  </Link>
                </div>

                {/* Category Tags */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">All Categories</h3>
                  <div className="flex flex-wrap gap-1">
                    {categories.slice(0, 12).map(cat => (
                      <Link
                        key={cat.id}
                        href={`/categories/${cat.slug}`}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full hover:bg-purple-100 hover:text-purple-700 transition-colors"
                      >
                        {cat.name}
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