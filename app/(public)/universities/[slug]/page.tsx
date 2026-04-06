import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { 
  institutes, 
  cities, 
  programs, 
  admissions,
  admissionOfferings,
  programOfferings,
  results, 
} from '@/app/lib/schema';
import { eq, and, desc, count, sql, inArray, isNotNull } from 'drizzle-orm';

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
interface UniversityDetail {
  id: number;
  name: string;
  slug: string;
  type: string | null;
  description: string | null;
  website: string | null;
  cityId: number | null;
  cityName: string | null;
  citySlug: string | null;
  province: string | null;
}

interface Program {
  id: number;
  name: string;
  slug: string;
  typicalDuration: string | null;
  typicalFeeRange: string | null;
  admissionsCount: number;
  resultsCount: number;
}

interface Admission {
  id: number;
  programName: string;
  programSlug: string;
  slug: string;
  year: number;
  session: string | null;
  status: string | null;
  expectedCloseDate: Date | null;
}

interface Result {
  id: number;
  title: string;
  slug: string;
  year: number;
  resultDate: Date | null;
  isPopular: boolean | null;
}

// ==================== GET UNIVERSITY BY SLUG ====================
async function getUniversityBySlug(slug: string): Promise<UniversityDetail | null> {
  try {
    const [university] = await db
      .select({
        id: institutes.id,
        name: institutes.name,
        slug: institutes.slug,
        type: institutes.type,
        description: institutes.description,
        website: institutes.website,
        cityId: institutes.cityId,
        cityName: cities.name,
        citySlug: cities.slug,
        province: cities.province,
      })
      .from(institutes)
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .where(eq(institutes.slug, slug))
      .limit(1);

    return university || null;
  } catch (error) {
    console.error('Error fetching university:', error);
    return null;
  }
}

// ==================== GET PROGRAMS WITH STATS ====================
async function getProgramsWithStats(universityId: number): Promise<Program[]> {
  try {
    // Get programs through programOfferings
    const programsList = await db
      .select({
        id: programs.id,
        name: programs.name,
        slug: programs.slug,
        typicalDuration: programs.typicalDuration,
        typicalFeeRange: programs.typicalFeeRange,
      })
      .from(programs)
      .innerJoin(programOfferings, eq(programs.id, programOfferings.programId))
      .where(eq(programOfferings.instituteId, universityId))
      .orderBy(programs.name);

    // Get offerings for this university
    const offerings = await db
      .select({ id: programOfferings.id, programId: programOfferings.programId })
      .from(programOfferings)
      .where(eq(programOfferings.instituteId, universityId));

    const offeringMap = new Map(offerings.map(o => [o.programId, o.id]));

    const programsWithStats = await Promise.all(
      programsList.map(async (prog) => {
        const offeringId = offeringMap.get(prog.id);
        
        let admissionsCount = 0;
        if (offeringId) {
          const [admissionsResult] = await db
            .select({ count: count() })
            .from(admissionOfferings)
            .where(eq(admissionOfferings.offeringId, offeringId));
          admissionsCount = Number(admissionsResult?.count) || 0;
        }

        return {
          ...prog,
          admissionsCount,
          resultsCount: 0,
        };
      })
    );

    return programsWithStats;
  } catch (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
}

// ==================== GET ADMISSIONS ====================
async function getAdmissions(universityId: number, limit = 5): Promise<Admission[]> {
  try {
    // Get offerings for this university
    const offerings = await db
      .select({ id: programOfferings.id, programId: programOfferings.programId })
      .from(programOfferings)
      .where(eq(programOfferings.instituteId, universityId));

    const offeringIds = offerings.map(o => o.id);
    
    if (offeringIds.length === 0) return [];

    // Get admissions through admissionOfferings
    const admissionsList = await db
      .select({
        admissionId: admissionOfferings.admissionId,
        offeringId: admissionOfferings.offeringId,
      })
      .from(admissionOfferings)
      .where(inArray(admissionOfferings.offeringId, offeringIds));

    const admissionIds = admissionsList.map(a => a.admissionId);
    
    if (admissionIds.length === 0) return [];

    // Create a map of offeringId to programId
    const offeringToProgram = new Map(offerings.map(o => [o.id, o.programId]));
    
    // Get program names
    const programMap = new Map();
    for (const prog of offerings) {
      const [program] = await db
        .select({ name: programs.name, slug: programs.slug })
        .from(programs)
        .where(eq(programs.id, prog.programId))
        .limit(1);
      if (program) {
        programMap.set(prog.id, program);
      }
    }

    // Get admission details
    const result = await db
      .select({
        id: admissions.id,
        slug: admissions.slug,
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        expectedCloseDate: admissions.expectedCloseDate,
        offeringId: admissionOfferings.offeringId,
      })
      .from(admissions)
      .innerJoin(admissionOfferings, eq(admissions.id, admissionOfferings.admissionId))
      .where(inArray(admissions.id, admissionIds))
      .orderBy(admissions.expectedCloseDate)
      .limit(limit);

    return result.map(r => {
      const program = programMap.get(r.offeringId);
      return {
        id: r.id,
        programName: program?.name || 'Program',
        programSlug: program?.slug || '',
        slug: r.slug || '',
        year: r.year || 2026,
        session: r.session,
        status: r.status,
        expectedCloseDate: r.expectedCloseDate,
      };
    });
  } catch (error) {
    console.error('Error fetching admissions:', error);
    return [];
  }
}

// ==================== GET RESULTS ====================
async function getResults(universityId: number, limit = 5): Promise<Result[]> {
  try {
    return await db
      .select({
        id: results.id,
        title: results.title,
        slug: results.slug,
        year: results.year,
        resultDate: results.resultDate,
        isPopular: results.isPopular,
      })
      .from(results)
      .where(eq(results.instituteId, universityId))
      .orderBy(desc(results.resultDate), desc(results.year))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching results:', error);
    return [];
  }
}

// ==================== GET STATS ====================
async function getStats(universityId: number) {
  try {
    // Get programs count through programOfferings
    const [programsCount] = await db
      .select({ count: count() })
      .from(programOfferings)
      .where(eq(programOfferings.instituteId, universityId));

    // Get offerings for admissions count
    const offerings = await db
      .select({ id: programOfferings.id })
      .from(programOfferings)
      .where(eq(programOfferings.instituteId, universityId));

    const offeringIds = offerings.map(o => o.id);
    
    let admissionsCount = 0;
    let openAdmissions = 0;
    
    if (offeringIds.length > 0) {
      // Get admission IDs through admissionOfferings
      const admissionLinks = await db
        .select({ admissionId: admissionOfferings.admissionId })
        .from(admissionOfferings)
        .where(inArray(admissionOfferings.offeringId, offeringIds));
      
      const admissionIds = admissionLinks.map(a => a.admissionId);
      
      if (admissionIds.length > 0) {
        const [admissionsResult] = await db
          .select({ count: count() })
          .from(admissions)
          .where(inArray(admissions.id, admissionIds));
        admissionsCount = Number(admissionsResult?.count) || 0;

        const [openResult] = await db
          .select({ count: count() })
          .from(admissions)
          .where(and(inArray(admissions.id, admissionIds), eq(admissions.status, 'Open')));
        openAdmissions = Number(openResult?.count) || 0;
      }
    }

    const [resultsCount] = await db
      .select({ count: count() })
      .from(results)
      .where(eq(results.instituteId, universityId));

    return {
      totalPrograms: Number(programsCount?.count) || 0,
      totalAdmissions: admissionsCount,
      totalResults: Number(resultsCount?.count) || 0,
      openAdmissions,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { totalPrograms: 0, totalAdmissions: 0, totalResults: 0, openAdmissions: 0 };
  }
}

// ==================== GET SIMILAR UNIVERSITIES ====================
async function getSimilarUniversities(cityId: number | null, currentId: number, limit = 3) {
  if (!cityId) return [];
  
  try {
    return await db
      .select({
        id: institutes.id,
        name: institutes.name,
        slug: institutes.slug,
        type: institutes.type,
        cityName: cities.name,
      })
      .from(institutes)
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .where(
        and(
          eq(institutes.cityId, cityId),
          eq(institutes.status, true),
          sql`${institutes.id} != ${currentId}`
        )
      )
      .limit(limit);
  } catch (error) {
    console.error('Error fetching similar universities:', error);
    return [];
  }
}

// ==================== GENERATE METADATA ====================
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const university = await getUniversityBySlug(slug);

  if (!university) {
    return {
      title: 'University Not Found | NextID.pk',
      description: 'The requested university could not be found.',
    };
  }

  const title = `${university.name} - Admissions, Programs & Results | NextID.pk`;
  const description = `Find all ${university.name} admissions, programs, and results. ${university.type || 'University'} in ${university.cityName || 'Pakistan'}. Check eligibility, fee structure, and apply online.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    alternates: {
      canonical: `https://www.nextid.pk/universities/${university.slug}`,
    },
  };
}

// ==================== MAIN PAGE ====================
export default async function UniversityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const university = await getUniversityBySlug(slug);
  if (!university) notFound();

  const [programs, admissions, results, stats, similarUniversities] = await Promise.all([
    getProgramsWithStats(university.id),
    getAdmissions(university.id, 4),
    getResults(university.id, 4),
    getStats(university.id),
    getSimilarUniversities(university.cityId, university.id, 3),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="text-gray-400">›</span>
            <Link href="/universities" className="text-gray-600 hover:text-blue-600">Universities</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">{university.name}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">{university.name}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-lg mb-8">
              {university.type && (
                <span className="px-4 py-1.5 bg-yellow-500 text-gray-900 rounded-full text-sm font-medium">
                  {university.type}
                </span>
              )}
              {university.cityName && (
                <span className="flex items-center gap-2">
                  <span>📍</span>
                  {university.cityName}{university.province ? `, ${university.province}` : ''}
                </span>
              )}
              {university.website && (
                <a href={university.website} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-white flex items-center gap-2">
                  <span>🌐</span> Official Website
                </a>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{stats.totalPrograms}</div>
                <div className="text-sm text-blue-200">Programs Offered</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{stats.openAdmissions}</div>
                <div className="text-sm text-blue-200">Open Admissions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{stats.totalResults}</div>
                <div className="text-sm text-blue-200">Results Announced</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{programs.length}</div>
                <div className="text-sm text-blue-200">Active Programs</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Sidebar - University Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">University Information</h2>
              
              <div className="space-y-4">
                {university.type && (
                  <div>
                    <div className="text-sm text-gray-500">Type</div>
                    <div className="font-semibold">{university.type}</div>
                  </div>
                )}
                
                {university.cityName && (
                  <div>
                    <div className="text-sm text-gray-500">Location</div>
                    <div className="font-semibold">
                      {university.cityName}
                      {university.province && <span className="text-gray-400">, {university.province}</span>}
                    </div>
                  </div>
                )}
                
                {university.website && (
                  <div>
                    <div className="text-sm text-gray-500">Website</div>
                    <a href={university.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                      {university.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>

              {university.description && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-sm text-gray-600">{university.description}</p>
                </div>
              )}

              {/* Quick Links */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="#programs" className="block text-sm text-blue-600 hover:underline">
                    📚 All Programs ({stats.totalPrograms})
                  </Link>
                  <Link href="#admissions" className="block text-sm text-blue-600 hover:underline">
                    📝 Open Admissions ({stats.openAdmissions})
                  </Link>
                  <Link href="#results" className="block text-sm text-blue-600 hover:underline">
                    📊 Recent Results ({stats.totalResults})
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Programs, Admissions, Results */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Programs Section */}
            <section id="programs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Programs Offered</h2>
                <Link href={`/universities/${university.slug}/programs`} className="text-sm text-blue-600 hover:underline">
                  View All ({stats.totalPrograms})
                </Link>
              </div>

              {programs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {programs.slice(0, 6).map((prog) => (
                    <Link
                      key={prog.id}
                      href={`/programs/${prog.slug}`}
                      className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition group"
                    >
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 mb-2">
                        {prog.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-xs mb-2">
                        {prog.typicalDuration && (
                          <span className="px-2 py-1 bg-gray-100 rounded-full">⏱️ {prog.typicalDuration}</span>
                        )}
                        {prog.typicalFeeRange && (
                          <span className="px-2 py-1 bg-gray-100 rounded-full">💰 {prog.typicalFeeRange}</span>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs">
                        {prog.admissionsCount > 0 && (
                          <span className="text-green-600">📝 {prog.admissionsCount} Open</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                  <p className="text-gray-500">No programs found for this university.</p>
                </div>
              )}
            </section>

            {/* Open Admissions Section */}
            {admissions.length > 0 && (
              <section id="admissions">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Open Admissions</h2>
                  <Link href={`/universities/${university.slug}/admissions`} className="text-sm text-blue-600 hover:underline">
                    View All ({stats.totalAdmissions})
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {admissions.map((adm) => (
                    <Link
                      key={adm.id}
                      href={`/admissions/${adm.slug}`}
                      className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600">
                          {adm.programName}
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Open
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Session: {adm.session || 'Fall'} {adm.year}
                      </p>
                      {adm.expectedCloseDate && (
                        <p className="text-xs text-orange-600">
                          Closes: {formatShortDate(adm.expectedCloseDate)}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Results Section */}
            {results.length > 0 && (
              <section id="results">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Results</h2>
                  <Link href={`/universities/${university.slug}/results`} className="text-sm text-blue-600 hover:underline">
                    View All ({stats.totalResults})
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((res) => (
                    <Link
                      key={res.id}
                      href={`/results/${res.slug}`}
                      className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600">
                          {res.title || `Result ${res.year}`}
                        </h3>
                        {res.isPopular && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Year: {res.year}
                      </p>
                      {res.resultDate && (
                        <p className="text-xs text-gray-500">
                          Announced: {formatShortDate(res.resultDate)}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Similar Universities */}
            {similarUniversities.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Similar Universities</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {similarUniversities.map((uni) => (
                    <Link
                      key={uni.id}
                      href={`/universities/${uni.slug}`}
                      className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition text-center"
                    >
                      <div className="text-3xl mb-2">🏛️</div>
                      <h3 className="font-semibold text-gray-900 hover:text-blue-600">{uni.name}</h3>
                      <p className="text-xs text-gray-500">{uni.cityName}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* SEO Content Section */}
      <section className="bg-white py-12 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-blue">
            <h2>About {university.name}</h2>
            
            <p>
              <strong>{university.name}</strong> is a prestigious {university.type?.toLowerCase() || 'educational'} institution 
              located in {university.cityName || 'Pakistan'}. It offers a wide range of academic programs 
              including {programs.slice(0, 5).map(p => p.name).join(', ')} and many more.
            </p>

            {university.description && (
              <>
                <h3>Overview</h3>
                <p>{university.description}</p>
              </>
            )}

            <h3>Academic Programs</h3>
            <p>
              {university.name} offers {stats.totalPrograms} academic programs across various disciplines. 
              Currently, there {stats.openAdmissions === 1 ? 'is' : 'are'} <strong>{stats.openAdmissions} open admission{stats.openAdmissions !== 1 ? 's' : ''}</strong> available.
              Students can choose from undergraduate, graduate, and doctoral programs based on their interests and career goals.
            </p>

            <h3>Admission Process</h3>
            <p>
              Admissions at {university.name} are announced for Fall and Spring semesters. The admission process typically 
              involves submitting an online application, providing educational documents, and appearing for an entry test 
              (if required). Prospective students are advised to check the official website for specific program requirements 
              and deadlines.
            </p>

            <h3>Results and Merit Lists</h3>
            <p>
              The university announces results and merit lists periodically. We have <strong>{stats.totalResults} result{stats.totalResults !== 1 ? 's' : ''}</strong> 
              available for various programs. Students can check their results online by providing their roll numbers 
              or through the official university portal.
            </p>

            <h3>Location and Campus</h3>
            <p>
              Situated in {university.cityName}{university.province ? `, ${university.province}` : ''}, the campus provides 
              modern facilities including libraries, laboratories, and sports complexes. The university is committed to 
              providing quality education and fostering academic excellence.
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