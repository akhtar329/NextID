// app/(public)/degrees/[slug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { 
  degrees, 
  levels, 
  categories, 
  programs, 
  institutes,
  admissions,
  admissionOfferings,
  programOfferings,
  results,
  seoMetadata
} from '@/app/lib/schema';
import { eq, and, desc, inArray, isNotNull } from 'drizzle-orm';

export const revalidate = 86400;
export const dynamic = 'force-static';
export const dynamicParams = true;

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

interface DegreeWithDetails {
  id: number;
  name: string;
  slug: string;
  fullForm: string | null;
  levelId: number | null;
  displayOrder: number | null;
  status: boolean | null;
  description: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface LevelDetails {
  id: number;
  name: string;
  slug: string;
}

interface CategoryDetails {
  id: number;
  name: string;
  slug: string;
}

interface ProgramDetails {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  typicalDuration: string | null;
  isFeatured: boolean | null;
  categoryId: number | null;
}

interface InstituteDetails {
  id: number;
  name: string;
  slug: string;
  type: string | null;
  isFeatured: boolean | null;
}

interface AdmissionDetails {
  id: number;
  name: string;
  slug: string;
  year: number;
  session: string | null;
  status: string | null;
}

interface ResultDetails {
  id: number;
  title: string;
  slug: string;
  year: number;
  resultDate: Date | null;
}

async function getSeoMetadata(entityType: string, entityId: number) {
  try {
    const [seo] = await db
      .select()
      .from(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityType, entityType),
          eq(seoMetadata.entityId, entityId)
        )
      )
      .limit(1);
    return seo || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const degreeResult = await db
      .select()
      .from(degrees)
      .where(and(eq(degrees.slug, slug), eq(degrees.status, true)))
      .limit(1);

    if (!degreeResult.length) {
      return {
        title: 'Degree Not Found | NextID.pk',
      };
    }

    const degree = degreeResult[0];
    const seo = await getSeoMetadata('degree', degree.id);

    return {
      title: seo?.metaTitle || `${degree.name} ${degree.fullForm || ''} Degree Programs, Admissions & Institutes | NextID.pk`,
      description: seo?.metaDescription || `Find ${degree.name} ${degree.fullForm || ''} degree programs, admissions, institutes and results in Pakistan.`,
      openGraph: {
        title: seo?.ogTitle || `${degree.name} Degree Guide`,
        description: seo?.ogDescription || `Complete information about ${degree.name} degree programs, admissions, and results in Pakistan.`,
        type: 'website',
        images: seo?.ogImage ? [{ url: seo.ogImage }] : undefined,
      },
      alternates: {
        canonical: seo?.canonicalUrl || `https://www.nextid.pk/degrees/${degree.slug}`,
      },
    };
  } catch {
    return {
      title: 'Degree | NextID.pk',
    };
  }
}

async function getDegreeData(slug: string) {
  try {
    const degreeResult = await db
      .select()
      .from(degrees)
      .where(and(eq(degrees.slug, slug), eq(degrees.status, true)))
      .limit(1);

    if (!degreeResult.length) {
      return null;
    }

    const degree = degreeResult[0] as DegreeWithDetails;

    const level = degree.levelId != null
      ? (
          await db
            .select()
            .from(levels)
            .where(eq(levels.id, degree.levelId))
            .limit(1)
        )[0] as LevelDetails | undefined
      : null;

    const categoryResult = await db
      .select()
      .from(categories)
      .where(eq(categories.status, true))
      .limit(1);
    const category = categoryResult[0] as CategoryDetails | undefined;

    const programsList = await db
      .select()
      .from(programs)
      .where(eq(programs.status, true))
      .orderBy(desc(programs.isFeatured), programs.name)
      .limit(20) as ProgramDetails[];

    const programIds = programsList.map(p => p.id).filter(id => id != null);

    let institutesList: InstituteDetails[] = [];
    if (programIds.length > 0) {
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
        .limit(30) as InstituteDetails[];
    }

    let admissionsList: AdmissionDetails[] = [];
    if (programIds.length > 0) {
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
            .limit(10) as AdmissionDetails[];
        }
      }
    }

    let resultsList: ResultDetails[] = [];
    resultsList = await db
      .select({
        id: results.id,
        title: results.title,
        slug: results.slug,
        year: results.year,
        resultDate: results.resultDate,
      })
      .from(results)
      .where(eq(results.status, true))
      .orderBy(desc(results.resultDate), desc(results.createdAt))
      .limit(10) as ResultDetails[];

    const uniqueInstitutes = Array.from(
      new Map(institutesList.map(item => [item.id, item])).values()
    );
    
    const uniqueAdmissions = Array.from(
      new Map(admissionsList.map(item => [item.id, item])).values()
    );
    
    const uniqueResults = Array.from(
      new Map(resultsList.map(item => [item.id, item])).values()
    );

    const stats = {
      totalPrograms: programsList.length,
      totalInstitutes: uniqueInstitutes.length,
      totalAdmissions: uniqueAdmissions.length,
      totalResults: uniqueResults.length,
    };

    return {
      degree,
      level,
      category,
      programs: programsList,
      institutes: uniqueInstitutes.slice(0, 12),
      admissions: uniqueAdmissions,
      results: uniqueResults,
      stats,
    };
  } catch {
    return null;
  }
}

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

const degreeColors: Record<string, string> = {
  'BS': 'from-blue-500 to-cyan-600',
  'BA': 'from-purple-500 to-pink-600',
  'BSc': 'from-green-500 to-emerald-600',
  'BBA': 'from-indigo-500 to-purple-600',
  'MBBS': 'from-red-500 to-pink-600',
  'BDS': 'from-cyan-500 to-blue-600',
  'PharmD': 'from-yellow-500 to-amber-600',
  'MA': 'from-orange-500 to-red-600',
  'MSc': 'from-teal-500 to-green-600',
  'MBA': 'from-violet-500 to-purple-600',
  'PhD': 'from-rose-500 to-pink-600',
};

const defaultIcon = '🎓';
const defaultColor = 'from-gray-600 to-slate-600';

export default async function DegreeDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getDegreeData(slug);

  if (!data) {
    notFound();
  }

  const { degree, level, category, programs, institutes, admissions, results, stats } = data;
  const icon = degreeIcons[degree.name] || defaultIcon;
  const gradientColor = degreeColors[degree.name] || defaultColor;

  return (
    <main className="min-h-screen bg-gray-50">
      
      <section className={`bg-gradient-to-br ${gradientColor} text-white relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-white/80 mb-4 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span className="text-white/60">›</span>
              <Link href="/degrees" className="hover:text-white transition-colors">
                Degrees
              </Link>
              <span className="text-white/60">›</span>
              {level && (
                <>
                  <Link href={`/levels/${level.slug}`} className="hover:text-white transition-colors">
                    {level.name}
                  </Link>
                  <span className="text-white/60">›</span>
                </>
              )}
              <span className="text-white font-medium">{degree.name}</span>
            </div>
            
            <div className="flex items-start gap-6">
              <div className="text-7xl">{icon}</div>
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  <span className="text-white">{degree.name}</span>
                </h1>
                {degree.fullForm && (
                  <p className="text-2xl text-white/90 mb-4">{degree.fullForm}</p>
                )}
                
                <div className="flex flex-wrap gap-3 mb-6">
                  {level && (
                    <Link
                      href={`/levels/${level.slug}`}
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-3 py-1 rounded-full text-sm transition-colors"
                    >
                      {level.name}
                    </Link>
                  )}
                  {category && (
                    <Link
                      href={`/categories/${category.slug}`}
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-3 py-1 rounded-full text-sm transition-colors"
                    >
                      {category.name}
                    </Link>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold text-white">{stats.totalPrograms}</div>
                    <div className="text-xs text-white/70">Programs</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold text-white">{stats.totalInstitutes}</div>
                    <div className="text-xs text-white/70">Institutes</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold text-white">{stats.totalAdmissions}</div>
                    <div className="text-xs text-white/70">Open Admissions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        
        {programs.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-8 bg-blue-600 rounded-full"></span>
                {degree.name} Programs
              </h2>
              <Link
                href={`/programs?degree=${degree.slug}`}
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
            {institutes.length > 0 ? (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-purple-600 rounded-full"></span>
                    Institutes Offering {degree.name}
                  </h2>
                  <Link
                    href={`/institutes?degree=${degree.slug}`}
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
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
                <div className="text-4xl mb-3">🏛️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Institutes Yet</h3>
                <p className="text-gray-500">No institutes found offering {degree.name} degree.</p>
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
                    href={`/admissions?degree=${degree.slug}`}
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
                <p className="text-sm text-gray-500">No current admissions for {degree.name}.</p>
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
                    href={`/results?degree=${degree.slug}`}
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
                <p className="text-sm text-gray-500">No results announced for {degree.name} yet.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className={`w-1.5 h-6 ${gradientColor.split(' ')[0]} rounded-full`}></span>
              About {degree.name} Degree
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Overview</h3>
                <p className="text-sm text-gray-600">
                  {degree.fullForm || degree.name} is a {level?.name?.toLowerCase() || ''} level degree 
                  in the {category?.name || ''} category. It offers {stats.totalPrograms} different programs 
                  across {stats.totalInstitutes} institutes in Pakistan.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalPrograms}</div>
                  <div className="text-xs text-gray-600">Programs</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalInstitutes}</div>
                  <div className="text-xs text-gray-600">Institutes</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalAdmissions}</div>
                  <div className="text-xs text-gray-600">Open Admissions</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.totalResults}</div>
                  <div className="text-xs text-gray-600">Results</div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Level</span>
                  {level ? (
                    <Link href={`/levels/${level.slug}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                      {level.name}
                    </Link>
                  ) : (
                    <span className="text-gray-900">-</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Category</span>
                  {category ? (
                    <Link href={`/categories/${category.slug}`} className="text-purple-600 hover:text-purple-700 font-medium">
                      {category.name}
                    </Link>
                  ) : (
                    <span className="text-gray-900">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {programs.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className={`w-1.5 h-6 ${gradientColor.split(' ')[0]} rounded-full`}></span>
              Quick Links: {degree.name} Programs
            </h2>
            
            <div className="flex flex-wrap gap-2">
              {programs.slice(0, 20).map((program) => (
                <Link
                  key={`quick-program-${program.id}`}
                  href={`/programs/${program.slug}`}
                  className="bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 px-3 py-1.5 rounded-full text-sm transition-colors"
                >
                  {program.name}
                </Link>
              ))}
              {programs.length > 20 && (
                <span className="text-sm text-gray-500 px-3 py-1.5">
                  +{programs.length - 20} more
                </span>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}