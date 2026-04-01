// app/(public)/programs/[slug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  programs, 
  degrees, 
  levels, 
  categories, 
  institutes, 
  admissions,
  admissionPrograms,
  results, 
  cities,
  programInstitutes,
  seoMetadata
} from '@/app/lib/schema';
import { eq, and, desc, count, sql, isNotNull } from 'drizzle-orm';
import { db } from '@/app/lib/db';
import { generateSEO } from '@/app/lib/seo';

// ==================== FORMAT DATE FUNCTIONS ====================
function formatDate(date: Date | null) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date: Date | null) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ==================== TYPES ====================
interface ProgramDetail {
  id: number;
  name: string;
  slug: string;
  overview: string | null;
  eligibility: string | null;
  duration: string | null;
  careerScope: string | null;
  feeRange: string | null;
  degreeName: string | null;
  levelName: string | null;
  categoryName: string | null;
  featuredImage?: string | null;
}

interface InstituteWithStats {
  id: number;
  name: string;
  slug: string;
  type: string;
  logo: string | null;
  cityName: string | null;
  citySlug: string | null;
  admissionsCount: number;
  resultsCount: number;
  isFeatured: boolean | null;
}

interface Admission {
  id: number;
  title: string;
  slug: string;
  year: number;
  session: string | null;
  status: string | null;
  expectedCloseDate: Date | null;
  instituteName: string;
  instituteSlug: string;
  instituteLogo: string | null;
  cityName: string | null;
}

interface Result {
  id: number;
  title: string;
  slug: string;
  year: number;
  resultDate: Date | null;
  instituteName: string;
  instituteSlug: string;
  instituteLogo: string | null;
  cityName: string | null;
  isPopular: boolean | null;
}

// ==================== GET PROGRAM BY SLUG ====================
async function getProgramBySlug(slug: string): Promise<ProgramDetail | null> {
  try {
    const [program] = await db
      .select({
        id: programs.id,
        name: programs.name,
        slug: programs.slug,
        overview: programs.overview,
        eligibility: programs.eligibility,
        duration: programs.duration,
        careerScope: programs.careerScope,
        feeRange: programs.feeRange,
        degreeName: degrees.name,
        levelName: levels.name,
        categoryName: categories.name,
      })
      .from(programs)
      .leftJoin(degrees, eq(programs.degreeId, degrees.id))
      .leftJoin(levels, eq(degrees.levelId, levels.id))
      .leftJoin(categories, eq(degrees.categoryId, categories.id))
      .where(eq(programs.slug, slug))
      .limit(1);

    return program || null;
  } catch (error) {
    console.error('Error fetching program:', error);
    return null;
  }
}

// ==================== GET INSTITUTES WITH STATS ====================
async function getInstitutesWithStats(programId: number) {
  try {
    const institutesList = await db
      .select({
        id: institutes.id,
        name: institutes.name,
        slug: institutes.slug,
        type: institutes.type,
        logo: institutes.logo,
        isFeatured: institutes.isFeatured,
        cityName: cities.name,
        citySlug: cities.slug,
      })
      .from(institutes)
      .innerJoin(programInstitutes, eq(institutes.id, programInstitutes.instituteId))
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .where(
        and(
          eq(institutes.status, true),
          eq(programInstitutes.programId, programId)
        )
      )
      .orderBy(desc(institutes.isFeatured), institutes.name);

    const institutesWithStats = await Promise.all(
      institutesList.map(async (inst) => {
        const [admissionsResult] = await db
          .select({ count: count() })
          .from(admissions)
          .innerJoin(admissionPrograms, eq(admissions.id, admissionPrograms.admissionId))
          .where(
            and(
              eq(admissions.instituteId, inst.id),
              eq(admissionPrograms.programId, programId),
              eq(admissions.status, 'Open')
            )
          );

        const [resultsResult] = await db
          .select({ count: count() })
          .from(results)
          .where(
            and(
              eq(results.instituteId, inst.id),
              eq(results.programId, programId)
            )
          );

        return {
          ...inst,
          admissionsCount: Number(admissionsResult?.count) || 0,
          resultsCount: Number(resultsResult?.count) || 0,
        };
      })
    );

    return institutesWithStats.filter(
      inst => inst.admissionsCount > 0 || inst.resultsCount > 0
    );
  } catch (error) {
    console.error('Error fetching institutes:', error);
    return [];
  }
}

// ==================== GET ADMISSIONS ====================
async function getAdmissions(programId: number, limit = 6) {
  try {
    return await db
      .select({
        id: admissions.id,
        title: admissions.name,
        slug: admissions.slug,
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        expectedCloseDate: admissions.expectedCloseDate,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        instituteLogo: institutes.logo,
        cityName: cities.name,
      })
      .from(admissions)
      .innerJoin(admissionPrograms, eq(admissions.id, admissionPrograms.admissionId))
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .where(
        and(
          eq(admissionPrograms.programId, programId),
          eq(admissions.status, 'Open')
        )
      )
      .orderBy(admissions.expectedCloseDate)
      .limit(limit);
  } catch (error) {
    console.error('Error fetching admissions:', error);
    return [];
  }
}

// ==================== GET RESULTS ====================
async function getResults(programId: number, limit = 6) {
  try {
    return await db
      .select({
        id: results.id,
        title: results.title,
        slug: results.slug,
        year: results.year,
        resultDate: results.resultDate,
        isPopular: results.isPopular,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        instituteLogo: institutes.logo,
        cityName: cities.name,
      })
      .from(results)
      .innerJoin(institutes, eq(results.instituteId, institutes.id))
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .where(eq(results.programId, programId))
      .orderBy(desc(results.resultDate), desc(results.year))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching results:', error);
    return [];
  }
}

// ==================== GET STATS ====================
async function getStats(programId: number) {
  try {
    const [institutesCount] = await db
      .select({ count: count() })
      .from(programInstitutes)
      .where(eq(programInstitutes.programId, programId));

    const [admissionsCount] = await db
      .select({ count: count() })
      .from(admissionPrograms)
      .where(eq(admissionPrograms.programId, programId));

    const [resultsCount] = await db
      .select({ count: count() })
      .from(results)
      .where(eq(results.programId, programId));

    return {
      institutes: Number(institutesCount?.count) || 0,
      admissions: Number(admissionsCount?.count) || 0,
      results: Number(resultsCount?.count) || 0,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { institutes: 0, admissions: 0, results: 0 };
  }
}

// ==================== GENERATE METADATA ====================
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);

  if (!program) {
    return generateSEO({
      title: "Program Not Found",
      description: "The requested program could not be found.",
      noIndex: true,
    });
  }

  return generateSEO({
    entityType: "program",
    entityId: program.id,
    path: `/programs/${slug}`,
    title: `${program.name} Program - Admissions, Universities & Results | NextID.pk`,
    description: `Complete guide to ${program.name} program in Pakistan. Check eligibility, duration, fee structure, career scope, open admissions, and results from top universities.`,
    image: "/program-default.jpg",
  });
}

// ==================== HELPER: Format Description ====================
function formatDescription(text: string | null) {
  if (!text) return null;
  return text.split('\n\n').map((paragraph, idx) => (
    <p key={idx} className="text-gray-600 leading-relaxed mb-4 last:mb-0">
      {paragraph}
    </p>
  ));
}

// ==================== MAIN PAGE ====================
export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  const [institutes, admissionsList, resultsList, stats] = await Promise.all([
    getInstitutesWithStats(program.id),
    getAdmissions(program.id, 6),
    getResults(program.id, 6),
    getStats(program.id),
  ]);

  const hasAnyData = institutes.length > 0 || admissionsList.length > 0 || resultsList.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="text-gray-400">›</span>
            <Link href="/programs" className="text-gray-600 hover:text-blue-600">Programs</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium line-clamp-1">{program.name}</span>
          </div>
        </div>
      </div>

      {/* Hero Section - Premium Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 text-sm text-blue-200 mb-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                {program.levelName || 'Program'}
              </span>
              <span>•</span>
              <span>{program.categoryName || 'Category'}</span>
              <span>•</span>
              <span>{program.degreeName || 'Degree'}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {program.name}
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 max-w-3xl leading-relaxed">
              {program.overview?.substring(0, 200) || `Complete guide to ${program.name} programs in Pakistan.`}
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="text-2xl md:text-3xl font-bold">{stats.institutes}</div>
                <div className="text-xs text-blue-200 mt-1">Universities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="text-2xl md:text-3xl font-bold">{stats.admissions}</div>
                <div className="text-xs text-blue-200 mt-1">Open Admissions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="text-2xl md:text-3xl font-bold">{stats.results}</div>
                <div className="text-xs text-blue-200 mt-1">Results</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Sidebar - Program Info */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-24 space-y-6">
              
              {/* Program Details Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Program Details
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {program.duration && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Duration</span>
                      <span className="text-sm font-medium text-gray-900">{program.duration}</span>
                    </div>
                  )}
                  {program.feeRange && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Fee Range</span>
                      <span className="text-sm font-medium text-gray-900">{program.feeRange}</span>
                    </div>
                  )}
                  {program.levelName && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Level</span>
                      <span className="text-sm font-medium text-gray-900">{program.levelName}</span>
                    </div>
                  )}
                  {program.categoryName && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Category</span>
                      <span className="text-sm font-medium text-gray-900">{program.categoryName}</span>
                    </div>
                  )}
                  {program.degreeName && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Degree</span>
                      <span className="text-sm font-medium text-gray-900">{program.degreeName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
                <div className="space-y-2">
                  {stats.institutes > 0 && (
                    <Link href="#universities" className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition group">
                      <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-200">🏛️</span>
                      <span className="text-sm text-gray-700 group-hover:text-blue-600">Universities ({stats.institutes})</span>
                    </Link>
                  )}
                  {stats.admissions > 0 && (
                    <Link href="#admissions" className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition group">
                      <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 group-hover:bg-green-200">📝</span>
                      <span className="text-sm text-gray-700 group-hover:text-green-600">Open Admissions ({stats.admissions})</span>
                    </Link>
                  )}
                  {stats.results > 0 && (
                    <Link href="#results" className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 transition group">
                      <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 group-hover:bg-orange-200">📊</span>
                      <span className="text-sm text-gray-700 group-hover:text-orange-600">Results ({stats.results})</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-8">
            
            {/* Eligibility Section */}
            {program.eligibility && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>📋</span> Eligibility Criteria
                  </h2>
                </div>
                <div className="p-6">
                  <div className="prose prose-blue max-w-none">
                    {formatDescription(program.eligibility)}
                  </div>
                </div>
              </div>
            )}

            {/* Career Scope Section */}
            {program.careerScope && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>🚀</span> Career Scope
                  </h2>
                </div>
                <div className="p-6">
                  <div className="prose prose-green max-w-none">
                    {formatDescription(program.careerScope)}
                  </div>
                </div>
              </div>
            )}
            
            {/* Universities Section */}
            {institutes.length > 0 && (
              <section id="universities">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                    Universities Offering {program.name}
                  </h2>
                  {stats.institutes > 4 && (
                    <Link href={`/programs/${program.slug}/universities`} className="text-sm text-blue-600 hover:underline font-medium">
                      View All →
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {institutes.slice(0, 4).map((inst) => (
                    <Link
                      key={inst.id}
                      href={`/universities/${inst.slug}`}
                      className="group bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {inst.logo ? (
                          <img src={inst.logo} alt={inst.name} className="w-12 h-12 object-contain rounded-lg" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center text-xl">
                            🏛️
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition">
                            {inst.name}
                          </h3>
                          {inst.cityName && (
                            <p className="text-xs text-gray-500 mt-0.5">{inst.cityName}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {inst.admissionsCount > 0 && (
                              <span className="text-xs px-2.5 py-1 bg-green-50 text-green-600 rounded-full">
                                📝 {inst.admissionsCount} Open
                              </span>
                            )}
                            {inst.resultsCount > 0 && (
                              <span className="text-xs px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full">
                                📊 {inst.resultsCount} Results
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Admissions Section */}
            {admissionsList.length > 0 && (
              <section id="admissions">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                    Open Admissions
                  </h2>
                  {stats.admissions > 6 && (
                    <Link href={`/admissions?program=${program.slug}`} className="text-sm text-blue-600 hover:underline font-medium">
                      View All →
                    </Link>
                  )}
                </div>

                <div className="space-y-4">
                  {admissionsList.map((adm) => (
                    <Link
                      key={adm.id}
                      href={`/admissions/${adm.slug}`}
                      className="block bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all group"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          {adm.instituteLogo ? (
                            <img src={adm.instituteLogo} alt={adm.instituteName} className="w-12 h-12 object-contain rounded-lg" />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center text-xl">
                              📝
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition">
                              {adm.instituteName}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {adm.session || 'Annual'} {adm.year}
                            </p>
                            {adm.cityName && (
                              <p className="text-xs text-gray-400 mt-1">{adm.cityName}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                            {adm.status}
                          </span>
                          {adm.expectedCloseDate && (
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Until {formatShortDate(adm.expectedCloseDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Results Section */}
            {resultsList.length > 0 && (
              <section id="results">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                    Recent Results
                  </h2>
                  {stats.results > 6 && (
                    <Link href={`/results?program=${program.slug}`} className="text-sm text-blue-600 hover:underline font-medium">
                      View All →
                    </Link>
                  )}
                </div>

                <div className="space-y-4">
                  {resultsList.map((res) => (
                    <Link
                      key={res.id}
                      href={`/results/${res.slug}`}
                      className="block bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all group"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          {res.instituteLogo ? (
                            <img src={res.instituteLogo} alt={res.instituteName} className="w-12 h-12 object-contain rounded-lg" />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center text-xl">
                              📊
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition">
                              {res.instituteName}
                            </h3>
                            <p className="text-sm text-gray-600 mt-0.5">{res.title}</p>
                            {res.cityName && (
                              <p className="text-xs text-gray-400 mt-1">{res.cityName}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full">
                            {res.year}
                          </span>
                          {res.isPopular && (
                            <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                              ⭐ Popular
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Overview Section - Bottom */}
            {program.overview && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span>📖</span> About {program.name}
                  </h2>
                </div>
                <div className="p-6">
                  <div className="prose prose-gray max-w-none">
                    {formatDescription(program.overview)}
                  </div>
                </div>
              </div>
            )}

            {/* No Data State */}
            {!hasAnyData && (
              <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Information Coming Soon</h3>
                <p className="text-gray-500">We're currently gathering information for {program.name}. Please check back later.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}