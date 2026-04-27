import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { 
  categories, 
  degrees, 
  programs, 
  institutes, 
  admissions,
  admissionOfferings,
  programOfferings,
  results, 
  news,
} from '@/app/lib/schema';
import { eq, and, desc, inArray, sql, isNotNull } from 'drizzle-orm';

export const revalidate = 86400;
export const dynamic = 'force-static';
export const dynamicParams = true;

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const category = await db
      .select()
      .from(categories)
      .where(and(eq(categories.slug, slug), eq(categories.status, true)))
      .limit(1);

    if (!category.length) {
      return {
        title: 'Category Not Found | NextID.pk',
      };
    }

    const cat = category[0];

    return {
      title: `${cat.name} Programs, Degrees, Institutes & Admissions | NextID.pk`,
      description: `Find ${cat.name} programs, degrees, institutes, admissions, results and educational news in Pakistan.`,
      alternates: {
        canonical: `https://www.nextid.pk/categories/${cat.slug}`,
      },
    };
  } catch {
    return {
      title: 'Category | NextID.pk',
    };
  }
}

async function getCategoryData(slug: string) {
  try {
    const categoryResult = await db
      .select()
      .from(categories)
      .where(and(eq(categories.slug, slug), eq(categories.status, true)))
      .limit(1);

    if (!categoryResult.length) {
      return null;
    }

    const category = categoryResult[0];

    const programsList = await db
      .select()
      .from(programs)
      .where(and(eq(programs.categoryId, category.id), eq(programs.status, true)))
      .orderBy(desc(programs.isFeatured), programs.name);

    const programIds = programsList.map(p => p.id).filter(id => id != null);

    const degreesList = await db
      .select()
      .from(degrees)
      .where(eq(degrees.status, true))
      .orderBy(degrees.displayOrder, degrees.name);

    let institutesList: any[] = [];
    if (programIds.length > 0) {
      try {
        institutesList = await db
          .selectDistinct({
            id: institutes.id,
            name: institutes.name,
            slug: institutes.slug,
            type: institutes.type,
            isFeatured: institutes.isFeatured,
          })
          .from(institutes)
          .innerJoin(programOfferings, eq(institutes.id, programOfferings.instituteId))
          .where(
            and(
              eq(institutes.status, true),
              inArray(programOfferings.programId, programIds)
            )
          )
          .orderBy(desc(institutes.isFeatured), institutes.name)
          .limit(20);
      } catch {
        institutesList = [];
      }
    }

    let admissionsList: any[] = [];
    if (programIds.length > 0) {
      try {
        const validProgramIds = programIds.filter(id => id != null && id > 0);
        
        if (validProgramIds.length > 0) {
          const offeringIds = await db
            .select({ id: programOfferings.id })
            .from(programOfferings)
            .where(inArray(programOfferings.programId, validProgramIds));
          
          const offeringIdList = offeringIds.map(o => o.id);
          
          if (offeringIdList.length > 0) {
            admissionsList = await db
              .select({
                id: admissions.id,
                name: admissions.name,
                slug: admissions.slug,
                year: admissions.year,
                session: admissions.session,
                status: admissions.status,
              })
              .from(admissions)
              .innerJoin(admissionOfferings, eq(admissions.id, admissionOfferings.admissionId))
              .where(
                and(
                  inArray(admissionOfferings.offeringId, offeringIdList),
                  eq(admissions.status, 'Open'),
                  isNotNull(admissionOfferings.offeringId)
                )
              )
              .orderBy(desc(admissions.createdAt))
              .limit(10);
          }
        }
      } catch {
        admissionsList = [];
      }
    }

    let resultsList: any[] = [];
    if (programIds.length > 0) {
      try {
        const validProgramIds = programIds.filter(id => id != null && id > 0);
        
        if (validProgramIds.length > 0) {
          const offeringIds = await db
            .select({ id: programOfferings.id })
            .from(programOfferings)
            .where(inArray(programOfferings.programId, validProgramIds));
          
          const offeringIdList = offeringIds.map(o => o.id);
          
          if (offeringIdList.length > 0) {
            resultsList = await db
              .select({
                id: results.id,
                title: results.title,
                slug: results.slug,
                year: results.year,
                resultDate: results.resultDate,
              })
              .from(results)
              .where(
                and(
                  eq(results.status, true),
                  isNotNull(results.id)
                )
              )
              .orderBy(desc(results.resultDate), desc(results.createdAt))
              .limit(10);
          }
        }
      } catch {
        resultsList = [];
      }
    }

    let newsList: any[] = [];
    try {
      newsList = await db
        .select({
          id: news.id,
          title: news.title,
          slug: news.slug,
          excerpt: news.excerpt,
          publishedAt: news.publishedAt,
          isBreaking: news.isBreaking,
        })
        .from(news)
        .where(
          and(
            eq(news.status, true),
            sql`${news.title} ILIKE ${`%${category.name}%`} OR 
                ${news.content} ILIKE ${`%${category.name}%`}`
          )
        )
        .orderBy(desc(news.isBreaking), desc(news.publishedAt))
        .limit(10);
    } catch {
      newsList = [];
    }

    const uniqueInstitutes = Array.from(
      new Map(institutesList.map(item => [item.id, item])).values()
    );
    
    const uniqueAdmissions = Array.from(
      new Map(admissionsList.map(item => [item.id, item])).values()
    );
    
    const uniqueResults = Array.from(
      new Map(resultsList.map(item => [item.id, item])).values()
    );
    
    const uniqueNews = Array.from(
      new Map(newsList.map(item => [item.id, item])).values()
    );

    const stats = {
      totalDegrees: degreesList.length,
      totalPrograms: programsList.length,
      totalInstitutes: uniqueInstitutes.length,
      totalAdmissions: uniqueAdmissions.length,
      totalResults: uniqueResults.length,
      totalNews: uniqueNews.length,
    };

    return {
      category,
      degrees: degreesList,
      programs: programsList.slice(0, 12),
      institutes: uniqueInstitutes.slice(0, 12),
      admissions: uniqueAdmissions,
      results: uniqueResults,
      news: uniqueNews,
      stats,
    };
  } catch {
    return null;
  }
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

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCategoryData(slug);

  if (!data) {
    notFound();
  }

  const { category, degrees, programs, institutes, admissions, results, news, stats } = data;
  const icon = categoryIcons[category.name] || '📂';

  return (
    <main className="min-h-screen bg-gray-50">
      
      <section className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-purple-200 mb-4">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span className="text-purple-300">›</span>
              <Link href="/categories" className="hover:text-white transition-colors">
                Categories
              </Link>
              <span className="text-purple-300">›</span>
              <span className="text-white font-medium">{category.name}</span>
            </div>
            
            <div className="flex items-start gap-6">
              <div className="text-7xl">{icon}</div>
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="text-white">{category.name}</span>
                </h1>
                <p className="text-xl text-purple-100 mb-6 max-w-2xl">
                  Explore {category.name.toLowerCase()} programs, degrees, institutes, admissions, and results
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold text-white">{stats.totalDegrees}</div>
                    <div className="text-xs text-purple-200">Degrees</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold text-white">{stats.totalPrograms}</div>
                    <div className="text-xs text-purple-200">Programs</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold text-white">{stats.totalInstitutes}</div>
                    <div className="text-xs text-purple-200">Institutes</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold text-white">{stats.totalAdmissions}</div>
                    <div className="text-xs text-purple-200">Open Admissions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        
        {degrees.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-8 bg-indigo-600 rounded-full"></span>
                Degrees in {category.name}
              </h2>
              <Link
                href={`/degrees?category=${category.slug}`}
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                View All Degrees
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {degrees.map((degree) => (
                <Link
                  key={`degree-${degree.id}`}
                  href={`/degrees/${degree.slug}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 text-center border border-gray-200 hover:border-indigo-400 group"
                >
                  <div className="text-3xl mb-2">🎓</div>
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {degree.name}
                  </h3>
                  {degree.fullForm && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{degree.fullForm}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {programs.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-8 bg-blue-600 rounded-full"></span>
                Popular Programs
              </h2>
              <Link
                href={`/programs?category=${category.slug}`}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View All Programs
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((program) => (
                <Link
                  key={`program-${program.id}`}
                  href={`/programs/${program.slug}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-200 hover:border-blue-400 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {program.name}
                    </h3>
                    {program.isFeatured && (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  {program.shortDescription && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{program.shortDescription}</p>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {program.typicalDuration && (
                      <span className="flex items-center gap-1">
                        <span>⏱️</span> {program.typicalDuration}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          <div className="lg:col-span-2">
            {institutes.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-purple-600 rounded-full"></span>
                    Institutes Offering {category.name}
                  </h2>
                  <Link
                    href={`/institutes?category=${category.slug}`}
                    className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 text-sm"
                  >
                    View All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {institutes.map((institute) => (
                    <Link
                      key={`institute-${institute.id}`}
                      href={`/institutes/${institute.slug}`}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 border border-gray-200 hover:border-purple-400 flex items-start gap-3"
                    >
                      <div className="text-3xl">🏛️</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 hover:text-purple-600 transition-colors">
                          {institute.name}
                        </h3>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full inline-block mt-1">
                          {institute.type}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            
            {institutes.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
                <div className="text-4xl mb-3">🏛️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Institutes Yet</h3>
                <p className="text-gray-500">No institutes found for {category.name} category.</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {admissions.length > 0 ? (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-green-600 rounded-full"></span>
                    Open Admissions
                  </h2>
                  <Link
                    href={`/admissions?category=${category.slug}`}
                    className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1 text-sm"
                  >
                    View All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {admissions.map((admission) => (
                    <Link
                      key={`admission-${admission.id}`}
                      href={`/admissions/${admission.slug}`}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 border border-gray-200 hover:border-green-400 block"
                    >
                      <h3 className="font-bold text-gray-900 hover:text-green-600 transition-colors line-clamp-1">
                        {admission.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          {admission.year}
                        </span>
                        {admission.session && (
                          <span className="text-gray-500">{admission.session}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center border border-gray-200">
                <div className="text-4xl mb-2">📝</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Open Admissions</h3>
                <p className="text-sm text-gray-500">No current admissions in {category.name}.</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          <div>
            {results.length > 0 ? (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-orange-600 rounded-full"></span>
                    Recent Results
                  </h2>
                  <Link
                    href={`/results?category=${category.slug}`}
                    className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 text-sm"
                  >
                    View All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {results.map((result) => (
                    <Link
                      key={`result-${result.id}`}
                      href={`/results/${result.slug}`}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 border border-gray-200 hover:border-orange-400 flex items-center justify-between"
                    >
                      <div>
                        <h3 className="font-bold text-gray-900 hover:text-orange-600 transition-colors">
                          {result.title}
                        </h3>
                        <span className="text-xs text-gray-500">Year: {result.year}</span>
                      </div>
                      {result.resultDate && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          {new Date(result.resultDate).toLocaleDateString()}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center border border-gray-200">
                <div className="text-4xl mb-2">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Results Yet</h3>
                <p className="text-sm text-gray-500">No results announced for {category.name} yet.</p>
              </div>
            )}
          </div>

          <div>
            {news.length > 0 ? (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-yellow-600 rounded-full"></span>
                    Latest News
                  </h2>
                  <Link
                    href={`/news?category=${category.slug}`}
                    className="text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1 text-sm"
                  >
                    View All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {news.map((item) => (
                    <Link
                      key={`news-${item.id}`}
                      href={`/news/${item.slug}`}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 border border-gray-200 hover:border-yellow-400 block"
                    >
                      <div className="flex items-start gap-2">
                        {item.isBreaking && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                            BREAKING
                          </span>
                        )}
                        <div>
                          <h3 className="font-bold text-gray-900 hover:text-yellow-600 transition-colors line-clamp-1">
                            {item.title}
                          </h3>
                          {item.excerpt && (
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.excerpt}</p>
                          )}
                          <span className="text-xs text-gray-400 mt-2 block">
                            {item.publishedAt && new Date(item.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center border border-gray-200">
                <div className="text-4xl mb-2">📰</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No News Yet</h3>
                <p className="text-sm text-gray-500">No news available for {category.name}.</p>
              </div>
            )}
          </div>
        </div>

        {degrees.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gray-600 rounded-full"></span>
              Quick Links: {category.name} Degrees
            </h2>
            
            <div className="flex flex-wrap gap-2">
              {degrees.map((degree) => (
                <Link
                  key={`quick-degree-${degree.id}`}
                  href={`/degrees/${degree.slug}`}
                  className="bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 px-3 py-1.5 rounded-full text-sm transition-colors"
                >
                  {degree.name} {degree.fullForm && `(${degree.fullForm})`}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}