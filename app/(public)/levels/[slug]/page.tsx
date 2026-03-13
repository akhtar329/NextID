// app/(public)/levels/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { 
  levels, 
  degrees, 
  programs, 
  categories,
  institutes,
  admissions,
  admissionPrograms,  // ✅ Add this
  results,
  programInstitutes 
} from '@/app/lib/schema';
import { eq, and, desc, inArray, sql, isNotNull } from 'drizzle-orm';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const level = await db
      .select()
      .from(levels)
      .where(and(eq(levels.slug, slug), eq(levels.status, true)))
      .limit(1);

    if (!level.length) {
      return {
        title: 'Level Not Found | NextID.pk',
      };
    }

    const lvl = level[0];

    return {
      title: `${lvl.name} ${lvl.fullForm || ''} Programs, Degrees & Admissions | NextID.pk`,
      description: `Find ${lvl.name} ${lvl.fullForm || ''} programs, degrees, institutes, admissions and results in Pakistan.`,
      alternates: {
        canonical: `https://nextid.pk/levels/${lvl.slug}`,
      },
    };
  } catch (error) {
    return {
      title: 'Level | NextID.pk',
    };
  }
}

async function getLevelData(slug: string) {
  try {
    // Get level details
    const levelResult = await db
      .select()
      .from(levels)
      .where(and(eq(levels.slug, slug), eq(levels.status, true)))
      .limit(1);

    if (!levelResult.length) {
      return null;
    }

    const level = levelResult[0];

    // Get all degrees in this level
    const degreesList = await db
      .select({
        id: degrees.id,
        name: degrees.name,
        slug: degrees.slug,
        fullForm: degrees.fullForm,
        categoryId: degrees.categoryId,
        displayOrder: degrees.displayOrder,
      })
      .from(degrees)
      .where(and(eq(degrees.levelId, level.id), eq(degrees.status, true)))
      .orderBy(degrees.displayOrder, degrees.name);

    const degreeIds = degreesList.map(d => d.id);

    // Get categories for these degrees
    let categoriesList: any[] = [];
    if (degreeIds.length > 0) {
      const categoryIds = [...new Set(degreesList.map(d => d.categoryId))];
      if (categoryIds.length > 0) {
        categoriesList = await db
          .select()
          .from(categories)
          .where(and(inArray(categories.id, categoryIds), eq(categories.status, true)))
          .orderBy(categories.displayOrder, categories.name);
      }
    }

    // Get programs in these degrees
    let programsList: any[] = [];
    let programIds: number[] = [];

    if (degreeIds.length > 0) {
      programsList = await db
        .select()
        .from(programs)
        .where(and(inArray(programs.degreeId, degreeIds), eq(programs.status, true)))
        .orderBy(desc(programs.isFeatured), programs.name);

      programIds = programsList.map(p => p.id).filter(id => id != null);
    }

    // Get institutes offering these programs
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
          .innerJoin(programInstitutes, eq(institutes.id, programInstitutes.instituteId))
          .where(
            and(
              eq(institutes.status, true),
              inArray(programInstitutes.programId, programIds)
            )
          )
          .orderBy(desc(institutes.isFeatured), institutes.name)
          .limit(30);
      } catch (error) {
        console.error('Error fetching institutes:', error);
        institutesList = [];
      }
    }

    // ✅ FIXED: Get active admissions using junction table
    let admissionsList: any[] = [];
    if (programIds.length > 0) {
      try {
        const validProgramIds = programIds.filter(id => id != null && id > 0);
        
        if (validProgramIds.length > 0) {
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
            .innerJoin(admissionPrograms, eq(admissions.id, admissionPrograms.admissionId))
            .where(
              and(
                inArray(admissionPrograms.programId, validProgramIds),
                eq(admissions.status, 'Open'),
                isNotNull(admissionPrograms.programId)
              )
            )
            .orderBy(desc(admissions.createdAt))
            .limit(10);
        }
      } catch (error) {
        console.error('Error fetching admissions:', error);
        admissionsList = [];
      }
    }

    // Get recent results in this level
    let resultsList: any[] = [];
    if (programIds.length > 0) {
      try {
        const validProgramIds = programIds.filter(id => id != null && id > 0);
        
        if (validProgramIds.length > 0) {
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
                inArray(results.programId, validProgramIds),
                eq(results.status, true),
                isNotNull(results.programId)
              )
            )
            .orderBy(desc(results.resultDate), desc(results.createdAt))
            .limit(10);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
        resultsList = [];
      }
    }

    // Remove duplicates
    const uniqueInstitutes = Array.from(
      new Map(institutesList.map(item => [item.id, item])).values()
    );
    
    const uniqueAdmissions = Array.from(
      new Map(admissionsList.map(item => [item.id, item])).values()
    );
    
    const uniqueResults = Array.from(
      new Map(resultsList.map(item => [item.id, item])).values()
    );

    // Get stats
    const stats = {
      totalDegrees: degreesList.length,
      totalPrograms: programsList.length,
      totalCategories: categoriesList.length,
      totalInstitutes: uniqueInstitutes.length,
      totalAdmissions: uniqueAdmissions.length,
      totalResults: uniqueResults.length,
    };

    return {
      level,
      degrees: degreesList,
      categories: categoriesList,
      programs: programsList.slice(0, 15),
      institutes: uniqueInstitutes.slice(0, 15),
      admissions: uniqueAdmissions,
      results: uniqueResults,
      stats,
    };
  } catch (error) {
    console.error('Error fetching level data:', error);
    return null;
  }
}

// Icons for levels
const levelIcons: Record<string, string> = {
  'Matric': '📘',
  'Intermediate': '📗',
  'Bachelor': '📕',
  'Master': '📙',
  'PhD': '🎓',
  'Diploma': '📜',
  'Certificate': '📄',
  'Post Graduate': '📚',
};

// Colors for levels
const levelColors: Record<string, string> = {
  'Matric': 'from-green-500 to-emerald-600',
  'Intermediate': 'from-blue-500 to-cyan-600',
  'Bachelor': 'from-purple-500 to-indigo-600',
  'Master': 'from-orange-500 to-red-600',
  'PhD': 'from-pink-500 to-rose-600',
  'Diploma': 'from-yellow-500 to-amber-600',
  'Certificate': 'from-teal-500 to-green-600',
  'Post Graduate': 'from-indigo-500 to-purple-600',
};

// Category icons
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
};

export default async function LevelDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getLevelData(slug);

  if (!data) {
    notFound();
  }

  const { level, degrees, categories, programs, institutes, admissions, results, stats } = data;
  const icon = levelIcons[level.name] || '📘';
  const gradientColor = levelColors[level.name] || 'from-gray-600 to-slate-600';

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <section className={`bg-gradient-to-br ${gradientColor} text-white relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-white/80 mb-4">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span className="text-white/60">›</span>
              <Link href="/levels" className="hover:text-white transition-colors">
                Levels
              </Link>
              <span className="text-white/60">›</span>
              <span className="text-white font-medium">{level.name}</span>
            </div>
            
            <div className="flex items-start gap-6">
              <div className="text-7xl">{icon}</div>
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  <span className="text-white">{level.name}</span>
                </h1>
                {level.fullForm && (
                  <p className="text-2xl text-white/90 mb-4">{level.fullForm}</p>
                )}
                <p className="text-xl text-white/80 mb-6 max-w-2xl">
                  Explore {level.name.toLowerCase()} programs, degrees, and institutes in Pakistan
                </p>
                
                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold text-white">{stats.totalDegrees}</div>
                    <div className="text-xs text-white/70">Degrees</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold text-white">{stats.totalPrograms}</div>
                    <div className="text-xs text-white/70">Programs</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold text-white">{stats.totalCategories}</div>
                    <div className="text-xs text-white/70">Categories</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold text-white">{stats.totalInstitutes}</div>
                    <div className="text-xs text-white/70">Institutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        
        {/* Categories Section */}
        {categories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-8 bg-purple-600 rounded-full"></span>
                Categories in {level.name}
              </h2>
              <Link
                href={`/categories?level=${level.slug}`}
                className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                View All Categories
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={`category-${category.id}`}
                  href={`/categories/${category.slug}?level=${level.slug}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 text-center border border-gray-200 hover:border-purple-400 group"
                >
                  <div className="text-3xl mb-2">{categoryIcons[category.name] || '📂'}</div>
                  <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {category.name}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Degrees Section */}
        {degrees.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-8 bg-indigo-600 rounded-full"></span>
                {level.name} Degrees
              </h2>
              <Link
                href={`/degrees?level=${level.slug}`}
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                View All Degrees
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {degrees.map((degree) => (
                <Link
                  key={`degree-${degree.id}`}
                  href={`/degrees/${degree.slug}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 border border-gray-200 hover:border-indigo-400 group"
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

        {/* Programs Section */}
        {programs.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-8 bg-blue-600 rounded-full"></span>
                Popular {level.name} Programs
              </h2>
              <Link
                href={`/programs?level=${level.slug}`}
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
                  
                  {program.overview && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{program.overview}</p>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {program.duration && (
                      <span className="flex items-center gap-1">
                        <span>⏱️</span> {program.duration}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Institutes Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Institutes List */}
          <div className="lg:col-span-2">
            {institutes.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-purple-600 rounded-full"></span>
                    Institutes Offering {level.name}
                  </h2>
                  <Link
                    href={`/institutes?level=${level.slug}`}
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
                <p className="text-gray-500">No institutes found for {level.name} level.</p>
              </div>
            )}
          </div>

          {/* Admissions Section */}
          <div className="lg:col-span-1">
            {admissions.length > 0 ? (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-green-600 rounded-full"></span>
                    Open Admissions
                  </h2>
                  <Link
                    href={`/admissions?level=${level.slug}`}
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
                <p className="text-sm text-gray-500">No current admissions in {level.name}.</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Results */}
          <div>
            {results.length > 0 ? (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-orange-600 rounded-full"></span>
                    Recent Results
                  </h2>
                  <Link
                    href={`/results?level=${level.slug}`}
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
                <p className="text-sm text-gray-500">No results announced for {level.name} yet.</p>
              </div>
            )}
          </div>

          {/* Level Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className={`w-1.5 h-6 ${gradientColor.split(' ')[0]} rounded-full`}></span>
              About {level.name} Level
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Overview</h3>
                <p className="text-sm text-gray-600">
                  {level.name} {level.fullForm ? `(${level.fullForm})` : ''} is an important educational level in Pakistan. 
                  It offers {stats.totalDegrees} different degrees across {stats.totalCategories} categories, 
                  with {stats.totalPrograms} programs available at {stats.totalInstitutes} institutes.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-indigo-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600">{stats.totalDegrees}</div>
                  <div className="text-xs text-gray-600">Degrees</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalCategories}</div>
                  <div className="text-xs text-gray-600">Categories</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalPrograms}</div>
                  <div className="text-xs text-gray-600">Programs</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalAdmissions}</div>
                  <div className="text-xs text-gray-600">Open Admissions</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links - Degrees */}
        {degrees.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className={`w-1.5 h-6 ${gradientColor.split(' ')[0]} rounded-full`}></span>
              Quick Links: {level.name} Degrees
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