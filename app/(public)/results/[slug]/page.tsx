import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { results, programs, institutes, cities, boards } from '@/app/lib/schema';
import { eq, and, ne, desc } from 'drizzle-orm';

// ==================== TYPES ====================
interface ProgramType {
  id: number;
  name: string | null;
  slug: string | null;
  degreeId: number | null;
  overview: string | null;
  eligibility: string | null;
  duration: string | null;
  careerScope: string | null;
  feeRange: string | null;
}

interface CityType {
  id: number;
  name: string | null;
  slug: string | null;
  province: string | null;
}

interface InstituteType {
  id: number;
  name: string | null;
  slug: string | null;
  type: string | null;
  cityId: number | null;
  description: string | null;
  website: string | null;
  city: CityType | null;
}

interface BoardType {
  id: number;
  name: string | null;
  slug: string | null;
  cityId: number | null;
  website: string | null;
  description: string | null;
  city: CityType | null;
}

interface ResultType {
  id: number;
  slug: string | null;
  title: string | null;
  programId: number | null;
  instituteId: number | null;
  boardId: number | null;
  universityId: number | null;
  year: number | null;
  resultDate: Date | null;
  officialLink: string | null;
  isPopular: boolean | null;
  status: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  program: ProgramType | null;
  institute: InstituteType | null;
  board: BoardType | null;
}

// ==================== HELPER FUNCTIONS ====================
function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    month: 'long',
    year: 'numeric',
  });
}

// ==================== GET RESULT BY SLUG ====================
async function getResultBySlug(slug: string): Promise<ResultType | null> {
  try {
    const [result] = await db
      .select({
        id: results.id,
        slug: results.slug,
        title: results.title,
        programId: results.programId,
        instituteId: results.instituteId,
        boardId: results.boardId,
        universityId: results.universityId,
        year: results.year,
        resultDate: results.resultDate,
        officialLink: results.officialLink,
        isPopular: results.isPopular,
        status: results.status,
        createdAt: results.createdAt,
        updatedAt: results.updatedAt,
      })
      .from(results)
      .where(eq(results.slug, slug))
      .limit(1);

    if (!result) return null;

    // Get program details
    let program: ProgramType | null = null;
    if (result.programId) {
      const [prog] = await db
        .select({
          id: programs.id,
          name: programs.name,
          slug: programs.slug,
          degreeId: programs.degreeId,
          overview: programs.overview,
          eligibility: programs.eligibility,
          duration: programs.duration,
          careerScope: programs.careerScope,
          feeRange: programs.feeRange,
        })
        .from(programs)
        .where(eq(programs.id, result.programId))
        .limit(1);
      program = prog || null;
    }

    // Get institute/university details
    let institute: InstituteType | null = null;
    const instituteId = result.instituteId || result.universityId;
    
    if (instituteId) {
      const [inst] = await db
        .select({
          id: institutes.id,
          name: institutes.name,
          slug: institutes.slug,
          type: institutes.type,
          cityId: institutes.cityId,
          description: institutes.description,
          website: institutes.website,
        })
        .from(institutes)
        .where(eq(institutes.id, instituteId))
        .limit(1);

      if (inst) {
        let city: CityType | null = null;
        if (inst.cityId) {
          const [c] = await db
            .select({
              id: cities.id,
              name: cities.name,
              slug: cities.slug,
              province: cities.province,
            })
            .from(cities)
            .where(eq(cities.id, inst.cityId))
            .limit(1);
          city = c || null;
        }
        institute = { ...inst, city };
      }
    }

    // Get board details
    let board: BoardType | null = null;
    if (result.boardId) {
      const [b] = await db
        .select({
          id: boards.id,
          name: boards.name,
          slug: boards.slug,
          cityId: boards.cityId,
          website: boards.website,
          description: boards.description,
        })
        .from(boards)
        .where(eq(boards.id, result.boardId))
        .limit(1);

      if (b) {
        let city: CityType | null = null;
        if (b.cityId) {
          const [c] = await db
            .select({
              id: cities.id,
              name: cities.name,
              slug: cities.slug,
              province: cities.province,
            })
            .from(cities)
            .where(eq(cities.id, b.cityId))
            .limit(1);
          city = c || null;
        }
        board = { ...b, city };
      }
    }

    return { ...result, program, institute, board };
  } catch (error) {
    console.error('Error fetching result:', error);
    return null;
  }
}

// ==================== GET RELATED RESULTS ====================
async function getRelatedResults(result: ResultType) {
  if (!result.slug) return [];
  
  try {
    const conditions = [];
    
    if (result.instituteId) {
      conditions.push(eq(results.instituteId, result.instituteId));
    } else if (result.universityId) {
      conditions.push(eq(results.universityId, result.universityId));
    } else if (result.boardId) {
      conditions.push(eq(results.boardId, result.boardId));
    }
    
    if (result.year) {
      conditions.push(eq(results.year, result.year));
    }
    
    conditions.push(eq(results.status, true));
    conditions.push(ne(results.slug, result.slug || ''));

    return await db
      .select({
        id: results.id,
        slug: results.slug,
        title: results.title,
        year: results.year,
        resultDate: results.resultDate,
        instituteName: institutes.name,
        boardName: boards.name,
      })
      .from(results)
      .leftJoin(institutes, eq(results.instituteId, institutes.id))
      .leftJoin(boards, eq(results.boardId, boards.id))
      .where(and(...conditions))
      .orderBy(desc(results.resultDate))
      .limit(5);
  } catch (error) {
    console.error('Error fetching related results:', error);
    return [];
  }
}

// ==================== SEO FUNCTIONS ====================
function generateMetaTitle(result: ResultType): string {
  const programName = result.program?.name || 'Exam';
  const institutionName = result.institute?.name || result.board?.name || 'Board';
  const year = result.year || '2026';
  
  let title = `${programName} Result ${year} - ${institutionName} | NextID.pk`;
  if (title.length > 60) title = title.substring(0, 57) + '...';
  return title;
}

function generateMetaDescription(result: ResultType): string {
  const programName = result.program?.name || 'exam';
  const institutionName = result.institute?.name || result.board?.name || 'board';
  const cityName = result.institute?.city?.name || result.board?.city?.name || 'Pakistan';
  const year = result.year || '2026';
  const resultDate = result.resultDate ? formatShortDate(result.resultDate) : 'TBA';
  const status = result.status ? 'published' : 'pending';
  
  let description = `Check ${programName} result ${year} for ${institutionName} in ${cityName}. Result date: ${resultDate}. Status: ${status}. `;
  description += `Download marksheet, check passing percentage at NextID.pk.`;
  
  if (description.length > 160) description = description.substring(0, 157) + '...';
  return description;
}

// ==================== METADATA ====================
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getResultBySlug(slug);

  if (!result) {
    return { title: 'Result Not Found', robots: { index: false } };
  }

  return {
    title: generateMetaTitle(result),
    description: generateMetaDescription(result),
    alternates: { canonical: `https://www.nextid.pk/results/${result.slug}` },
    openGraph: {
      title: generateMetaTitle(result),
      description: generateMetaDescription(result),
      type: 'article',
      images: ['/images/results-og.jpg'],
    },
  };
}

// ==================== STATUS BADGE ====================
function getStatusBadge(status: boolean | null) {
  if (status === true) return { bg: 'bg-green-100', text: 'text-green-700', label: 'Result Published', icon: '✅' };
  if (status === false) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Result Pending', icon: '⏳' };
  return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Unknown', icon: '❓' };
}

// ==================== MAIN PAGE (Server Component - NO CLIENT) ====================
export default async function ResultDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getResultBySlug(slug);
  
  if (!result) notFound();

  const relatedResults = await getRelatedResults(result);
  const statusBadge = getStatusBadge(result.status);

  // Determine institution info
  const institutionName = result.institute?.name || result.board?.name || '';
  const institutionSlug = result.institute?.slug || result.board?.slug || '';
  const institutionType = result.institute ? 'universities' : 'boards';
  const cityName = result.institute?.city?.name || result.board?.city?.name || '';
  const officialWebsite = result.institute?.website || result.board?.website || '';

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            {/* Breadcrumbs */}
            <div className="text-sm text-green-200 mb-4">
              <Link href="/" className="hover:text-white">Home</Link>
              {' / '}
              <Link href="/results" className="hover:text-white">Results</Link>
              {' / '}
              <span className="text-white">{result.title || result.program?.name || 'Result'}</span>
            </div>
            
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${statusBadge.bg} ${statusBadge.text}`}>
              <span>{statusBadge.icon}</span>
              <span>{statusBadge.label}</span>
              {result.isPopular && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white rounded-full text-xs">Popular</span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {result.title || `${result.program?.name || 'Exam'} Result ${result.year || '2026'}`}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-green-200">
              {institutionName && (
                <div className="flex items-center gap-1">
                  <span>🏛️</span>
                  <Link href={`/${institutionType}/${institutionSlug}`} className="hover:text-white">
                    {institutionName}
                  </Link>
                </div>
              )}
              {cityName && (
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <span>{cityName}</span>
                </div>
              )}
              {result.year && (
                <div className="flex items-center gap-1">
                  <span>📅</span>
                  <span>Year: {result.year}</span>
                </div>
              )}
              {result.resultDate && (
                <div className="flex items-center gap-1">
                  <span>⏰</span>
                  <span>Announced: {formatDate(result.resultDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content */}
          <div className="flex-1">
            {/* Result Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Result Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Program</p>
                  <p className="font-semibold text-gray-900">{result.program?.name || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Institution</p>
                  <p className="font-semibold text-gray-900">{institutionName || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Result Year</p>
                  <p className="font-semibold text-gray-900">{result.year || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Announcement Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(result.resultDate) || 'TBA'}</p>
                </div>
              </div>

              {/* Official Links */}
              {(result.officialLink || officialWebsite) && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Official Resources</h3>
                  <div className="flex flex-wrap gap-3">
                    {result.officialLink && (
                      <a 
                        href={result.officialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <span>📄</span> Check Result Online
                      </a>
                    )}
                    {officialWebsite && (
                      <a 
                        href={officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                      >
                        <span>🌐</span> Official Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Program Details */}
            {result.program && (result.program.overview || result.program.eligibility || result.program.duration) && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Program Details</h2>
                {result.program.overview && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800">Overview</h3>
                    <p className="text-gray-600">{result.program.overview}</p>
                  </div>
                )}
                {result.program.eligibility && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800">Eligibility</h3>
                    <p className="text-gray-600">{result.program.eligibility}</p>
                  </div>
                )}
                {result.program.duration && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800">Duration</h3>
                    <p className="text-gray-600">{result.program.duration}</p>
                  </div>
                )}
                {result.program.careerScope && (
                  <div>
                    <h3 className="font-semibold text-gray-800">Career Scope</h3>
                    <p className="text-gray-600">{result.program.careerScope}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80">
            {/* How to Check Result */}
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>📝</span> How to Check Result?
              </h3>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Click the "Check Result Online" button above</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Enter your Roll Number</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Select your exam type (Annual/Supplementary)</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>Click "Submit" to view your result</span>
                </li>
              </ol>
            </div>

            {/* Related Results */}
            {relatedResults.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">Related Results</h3>
                <div className="space-y-3">
                  {relatedResults.map((rel) => (
                    <Link key={rel.id} href={`/results/${rel.slug}`} className="block p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition">
                      <p className="font-medium text-gray-800 text-sm">{rel.title || rel.instituteName || rel.boardName}</p>
                      <p className="text-xs text-gray-500">{rel.year}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationEvent",
            "name": result.title || `${result.program?.name} Result ${result.year}`,
            "description": generateMetaDescription(result),
            "startDate": result.resultDate?.toISOString(),
            "location": {
              "@type": "Place",
              "name": institutionName,
              "address": { "@type": "PostalAddress", "addressLocality": cityName, "addressCountry": "PK" }
            },
            "organizer": {
              "@type": "Organization",
              "name": institutionName,
              "url": officialWebsite
            }
          })
        }}
      />
    </main>
  );
}