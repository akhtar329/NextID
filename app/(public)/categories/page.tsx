// app/(public)/categories/page.tsx
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
} from '@/app/lib/schema';
import { eq, and, sql, inArray, isNotNull, count } from 'drizzle-orm';

export const revalidate = 86400;
export const dynamic = 'force-static';
export const fetchCache = 'force-cache';

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

async function getCategoriesWithStats(): Promise<CategoryWithStats[]> {
  try {
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

    if (allCategories.length === 0) return [];

    const categoryIds = allCategories.map(c => c.id);
    const validCategoryIds = categoryIds.filter((id): id is number => id !== null);

    const programsCounts = await db
      .select({
        categoryId: programs.categoryId,
        count: count(),
      })
      .from(programs)
      .where(and(
        inArray(programs.categoryId, validCategoryIds),
        eq(programs.status, true)
      ))
      .groupBy(programs.categoryId);

    const degreesTotal = await db
      .select({ count: count() })
      .from(degrees)
      .where(eq(degrees.status, true))
      .then(r => Number(r[0]?.count) || 0);

    const programIdsByCategory = new Map<number, number[]>();
    
    const allPrograms = await db
      .select({ id: programs.id, categoryId: programs.categoryId })
      .from(programs)
      .where(and(
        inArray(programs.categoryId, validCategoryIds),
        eq(programs.status, true)
      ));

    for (const p of allPrograms) {
      const catId = p.categoryId;
      if (catId !== null) {
        if (!programIdsByCategory.has(catId)) {
          programIdsByCategory.set(catId, []);
        }
        programIdsByCategory.get(catId)!.push(p.id);
      }
    }

    const institutesCounts = new Map<number, number>();
    for (const [categoryId, pIds] of programIdsByCategory) {
      if (pIds.length > 0) {
        const result = await db
          .select({ count: count() })
          .from(institutes)
          .innerJoin(programOfferings, eq(institutes.id, programOfferings.instituteId))
          .where(and(
            eq(institutes.status, true),
            inArray(programOfferings.programId, pIds)
          ))
          .then(r => Number(r[0]?.count) || 0);
        institutesCounts.set(categoryId, result);
      } else {
        institutesCounts.set(categoryId, 0);
      }
    }

    const admissionsCounts = new Map<number, number>();
    for (const [categoryId, pIds] of programIdsByCategory) {
      if (pIds.length > 0) {
        const offerings = await db
          .select({ id: programOfferings.id })
          .from(programOfferings)
          .where(inArray(programOfferings.programId, pIds));
        
        const offeringIds = offerings.map(o => o.id);
        
        if (offeringIds.length > 0) {
          const result = await db
            .select({ count: count() })
            .from(admissions)
            .innerJoin(admissionOfferings, eq(admissions.id, admissionOfferings.admissionId))
            .where(and(
              eq(admissions.status, 'Open'),
              inArray(admissionOfferings.offeringId, offeringIds),
              isNotNull(admissionOfferings.offeringId)
            ))
            .then(r => Number(r[0]?.count) || 0);
          admissionsCounts.set(categoryId, result);
        } else {
          admissionsCounts.set(categoryId, 0);
        }
      } else {
        admissionsCounts.set(categoryId, 0);
      }
    }

    const resultsCounts = new Map<number, number>();
    for (const category of allCategories) {
      const result = await db
        .select({ count: count() })
        .from(results)
        .where(and(
          eq(results.status, true),
          sql`${results.title} ILIKE ${`%${category.name}%`}`
        ))
        .then(r => Number(r[0]?.count) || 0);
      resultsCounts.set(category.id, result);
    }

    const newsCounts = new Map<number, number>();
    for (const category of allCategories) {
      const result = await db
        .select({ count: count() })
        .from(news)
        .where(and(
          eq(news.status, true),
          sql`${news.title} ILIKE ${`%${category.name}%`} OR 
              ${news.content} ILIKE ${`%${category.name}%`} OR
              ${news.excerpt} ILIKE ${`%${category.name}%`}`
        ))
        .then(r => Number(r[0]?.count) || 0);
      newsCounts.set(category.id, result);
    }

    const categoriesWithStats: CategoryWithStats[] = allCategories.map(category => {
      const programsCount = programsCounts.find(p => p.categoryId === category.id)?.count || 0;
      const institutesCount = institutesCounts.get(category.id) || 0;
      const admissionsCount = admissionsCounts.get(category.id) || 0;
      const resultsCount = resultsCounts.get(category.id) || 0;
      const newsCount = newsCounts.get(category.id) || 0;
      
      const totalCount = institutesCount + admissionsCount + resultsCount + newsCount + degreesTotal + programsCount;

      return {
        ...category,
        institutesCount,
        admissionsCount,
        resultsCount,
        newsCount,
        degreesCount: degreesTotal,
        programsCount,
        totalCount,
      };
    });

    return categoriesWithStats.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return (a.displayOrder || 999) - (b.displayOrder || 999);
      }
      return b.totalCount - a.totalCount;
    });
    
  } catch {
    return [];
  }
}

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

async function getPageData() {
  const categories = await getCategoriesWithStats();
  
  const totalCategories = categories.length;
  const totalInstitutes = categories.reduce((sum, cat) => sum + cat.institutesCount, 0);
  const totalAdmissions = categories.reduce((sum, cat) => sum + cat.admissionsCount, 0);
  const totalResults = categories.reduce((sum, cat) => sum + cat.resultsCount, 0);
  const totalNews = categories.reduce((sum, cat) => sum + cat.newsCount, 0);
  const totalDegrees = categories.reduce((sum, cat) => sum + cat.degreesCount, 0);
  const totalPrograms = categories.reduce((sum, cat) => sum + cat.programsCount, 0);
  
  return {
    categories,
    stats: {
      totalCategories,
      totalInstitutes,
      totalAdmissions,
      totalResults,
      totalNews,
      totalDegrees,
      totalPrograms,
    },
  };
}

export default async function CategoriesPage() {
  let pageData;
  
  try {
    pageData = await getPageData();
  } catch {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4" aria-hidden="true">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to load categories</h2>
            <p className="text-gray-600">Please try again later</p>
            <Link
              href="/"
              className="inline-block mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { categories, stats } = pageData;

  return (
    <main className="min-h-screen bg-gray-50">
      
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
              <span className="text-purple-300" aria-hidden="true">›</span>
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

      <div className="container mx-auto px-4 mt-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-purple-600">{stats.totalCategories}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-indigo-600">{stats.totalDegrees}</div>
            <div className="text-sm text-gray-600">Degrees</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-blue-600">{stats.totalPrograms}</div>
            <div className="text-sm text-gray-600">Programs</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-cyan-600">{stats.totalInstitutes}</div>
            <div className="text-sm text-gray-600">Institutes</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-green-600">{stats.totalAdmissions}</div>
            <div className="text-sm text-gray-600">Admissions</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-orange-600">{stats.totalResults}</div>
            <div className="text-sm text-gray-600">Results</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-3xl font-bold text-yellow-500">{stats.totalNews}</div>
            <div className="text-sm text-gray-600">News</div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        
        {categories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4" aria-hidden="true">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-500">No educational categories available yet.</p>
          </div>
        ) : (
          <>
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

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
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