// app/(public)/programs/[slug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { programs, degrees, levels, categories, institutes, admissions, results, cities } from '@/app/lib/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';

// ==================== FORMAT DATE FUNCTION ====================
function formatDate(date: Date | null) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ==================== FORMAT SHORT DATE ====================
function formatShortDate(date: Date | null) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    month: 'short',
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
}

interface InstituteWithStats {
  id: number;
  name: string;
  slug: string;
  type: string;
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
    // Get all institutes that offer this program
    const institutesList = await db
      .select({
        id: institutes.id,
        name: institutes.name,
        slug: institutes.slug,
        type: institutes.type,
        isFeatured: institutes.isFeatured,
        cityName: cities.name,
        citySlug: cities.slug,
      })
      .from(institutes)
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .where(eq(institutes.status, true))
      .orderBy(desc(institutes.isFeatured), institutes.name);

    // Get admission counts for each institute for this program
    const institutesWithStats = await Promise.all(
      institutesList.map(async (inst) => {
        const [admissionsResult] = await db
          .select({ count: count() })
          .from(admissions)
          .where(
            and(
              eq(admissions.instituteId, inst.id),
              eq(admissions.programId, programId),
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

    // Filter institutes that have either admissions or results
    return institutesWithStats.filter(
      inst => inst.admissionsCount > 0 || inst.resultsCount > 0
    );
  } catch (error) {
    console.error('Error fetching institutes:', error);
    return [];
  }
}

// ==================== GET ADMISSIONS ====================
async function getAdmissions(programId: number, limit = 5) {
  try {
    return await db
      .select({
        id: admissions.id,
        title: programs.name,
        slug: admissions.slug,
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        expectedCloseDate: admissions.expectedCloseDate,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        cityName: cities.name,
      })
      .from(admissions)
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .innerJoin(programs, eq(admissions.programId, programs.id))
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .where(
        and(
          eq(admissions.programId, programId),
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
async function getResults(programId: number, limit = 5) {
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
      .from(institutes)
      .innerJoin(admissions, eq(institutes.id, admissions.instituteId))
      .where(eq(admissions.programId, programId));

    const [admissionsCount] = await db
      .select({ count: count() })
      .from(admissions)
      .where(eq(admissions.programId, programId));

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
    return {
      title: 'Program Not Found | NextID.pk',
      description: 'The requested program could not be found.',
    };
  }

  const title = `${program.name} Program - Admissions, Universities & Results | NextID.pk`;
  const description = `Find all ${program.name} admissions, universities, and results in Pakistan. Check eligibility, duration, fee structure, and career scope. ${program.overview?.substring(0, 100)}...`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    alternates: {
      canonical: `https://nextid.pk/programs/${program.slug}`,
    },
  };
}

// ==================== MAIN PAGE ====================
export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  const [institutes, admissions, results, stats] = await Promise.all([
    getInstitutesWithStats(program.id),
    getAdmissions(program.id, 6),
    getResults(program.id, 6),
    getStats(program.id),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="text-gray-400">›</span>
            <Link href="/programs" className="text-gray-600 hover:text-blue-600">Programs</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">{program.name}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 text-sm text-blue-200 mb-4">
              <span>{program.levelName || 'Program'}</span>
              <span>•</span>
              <span>{program.categoryName || 'Category'}</span>
              <span>•</span>
              <span>{program.degreeName || 'Degree'}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{program.name}</h1>
            
            <p className="text-xl text-blue-100 mb-6 max-w-3xl">
              {program.overview || `Complete guide to ${program.name} programs in Pakistan.`}
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{stats.institutes}</div>
                <div className="text-sm text-blue-200">Universities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{stats.admissions}</div>
                <div className="text-sm text-blue-200">Open Admissions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{stats.results}</div>
                <div className="text-sm text-blue-200">Results</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Sidebar - Program Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Program Details</h2>
              
              <div className="space-y-4">
                {program.duration && (
                  <div>
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="font-semibold">{program.duration}</div>
                  </div>
                )}
                
                {program.feeRange && (
                  <div>
                    <div className="text-sm text-gray-500">Fee Range</div>
                    <div className="font-semibold">{program.feeRange}</div>
                  </div>
                )}
                
                {program.levelName && (
                  <div>
                    <div className="text-sm text-gray-500">Level</div>
                    <div className="font-semibold">{program.levelName}</div>
                  </div>
                )}
                
                {program.categoryName && (
                  <div>
                    <div className="text-sm text-gray-500">Category</div>
                    <div className="font-semibold">{program.categoryName}</div>
                  </div>
                )}
                
                {program.degreeName && (
                  <div>
                    <div className="text-sm text-gray-500">Degree</div>
                    <div className="font-semibold">{program.degreeName}</div>
                  </div>
                )}
              </div>

              {program.eligibility && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-2">Eligibility</h3>
                  <p className="text-sm text-gray-600">{program.eligibility}</p>
                </div>
              )}

              {program.careerScope && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-2">Career Scope</h3>
                  <p className="text-sm text-gray-600">{program.careerScope}</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Universities, Admissions, Results */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Universities Offering This Program */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Universities Offering {program.name}</h2>
                <Link href={`/programs/${program.slug}/universities`} className="text-sm text-blue-600 hover:underline">
                  View All ({stats.institutes})
                </Link>
              </div>

              {institutes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {institutes.slice(0, 4).map((inst) => (
                    <Link
                      key={inst.id}
                      href={`/universities/${inst.slug}`}
                      className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600">
                            {inst.name}
                          </h3>
                          {inst.cityName && (
                            <p className="text-sm text-gray-500">{inst.cityName}</p>
                          )}
                        </div>
                        {inst.isFeatured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-3 text-sm">
                        {inst.admissionsCount > 0 && (
                          <span className="text-green-600">
                            📝 {inst.admissionsCount} Admission{inst.admissionsCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {inst.resultsCount > 0 && (
                          <span className="text-orange-600">
                            📊 {inst.resultsCount} Result{inst.resultsCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                  <p className="text-gray-500">No universities found offering this program.</p>
                </div>
              )}
            </section>

            {/* Open Admissions */}
            {admissions.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Open Admissions</h2>
                  <Link href={`/admissions?program=${program.slug}`} className="text-sm text-blue-600 hover:underline">
                    View All ({stats.admissions})
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {admissions.map((adm) => (
                    <Link
                      key={adm.id}
                      href={`/admissions/${adm.slug}`}
                      className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600">
                          {adm.instituteName}
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Open
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        Session: {adm.session || 'Fall'} {adm.year}
                      </p>
                      
                      {adm.cityName && (
                        <p className="text-xs text-gray-400">{adm.cityName}</p>
                      )}
                      
                      {adm.expectedCloseDate && (
                        <p className="text-xs text-orange-600 mt-2">
                          Closes: {formatShortDate(adm.expectedCloseDate)}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Results */}
            {results.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Results</h2>
                  <Link href={`/results?program=${program.slug}`} className="text-sm text-blue-600 hover:underline">
                    View All ({stats.results})
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((res) => (
                    <Link
                      key={res.id}
                      href={`/results/${res.slug}`}
                      className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600">
                          {res.instituteName}
                        </h3>
                        {res.isPopular && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {res.title || `Result ${res.year}`}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{res.cityName}</span>
                        {res.resultDate && (
                          <span className="text-gray-500">{formatShortDate(res.resultDate)}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* No Data State */}
            {institutes.length === 0 && admissions.length === 0 && results.length === 0 && (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Information Available</h3>
                <p className="text-gray-500">
                  We're currently updating information for {program.name}. Please check back later.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEO Content Section */}
      <section className="bg-white py-12 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-blue">
            <h2>About {program.name} Program in Pakistan</h2>
            
            <p>
              <strong>{program.name}</strong> is a popular academic program offered by numerous universities across Pakistan. 
              This comprehensive guide provides detailed information about {program.name} admissions, eligibility criteria, 
              fee structure, career prospects, and results from various institutions.
            </p>

            {program.overview && (
              <>
                <h3>Program Overview</h3>
                <p>{program.overview}</p>
              </>
            )}

            <h3>Universities Offering {program.name}</h3>
            <p>
              {program.name} is offered by {stats.institutes} universities across Pakistan including 
              {institutes.slice(0, 5).map((inst, i, arr) => (
                <span key={inst.id}>
                  {' '}<Link href={`/universities/${inst.slug}`} className="text-blue-600 hover:underline">{inst.name}</Link>
                  {i < arr.length - 2 ? ',' : i === arr.length - 2 ? ' and' : ''}
                </span>
              ))}. These institutions provide quality education and recognized degrees.
            </p>

            <h3>Admission Process</h3>
            <p>
              Admissions for {program.name} are typically announced twice a year for Fall and Spring semesters. 
              Currently, there {stats.admissions === 1 ? 'is' : 'are'} <strong>{stats.admissions} open admission{stats.admissions !== 1 ? 's' : ''}</strong> available. 
              The admission process usually involves submitting an online application, providing educational documents, 
              and in some cases, passing an entry test.
            </p>

            <h3>Eligibility Criteria</h3>
            <p>{program.eligibility || 'Eligibility criteria vary by university. Generally, candidates must have completed their previous education with minimum required marks.'}</p>

            <h3>Career Opportunities</h3>
            <p>{program.careerScope || `Graduates of ${program.name} have excellent career opportunities in both public and private sectors.`}</p>

            <h3>Results and Merit Lists</h3>
            <p>
              Universities announce results and merit lists for {program.name} admissions periodically. 
              We have <strong>{stats.results} result{stats.results !== 1 ? 's' : ''}</strong> available for various institutions. 
              Students can check their results online by providing their roll numbers.
            </p>

            <h3>Fee Structure</h3>
            <p>
              The fee structure for {program.name} varies by institution. {program.feeRange ? 
              `Typically, it ranges from ${program.feeRange}.` : 
              'Students are advised to check individual university websites for detailed fee information.'}
            </p>

            <p className="text-sm text-gray-500 mt-8">
              Last updated: {new Date().toLocaleDateString('en-PK')}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}