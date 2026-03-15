// app/(public)/results/[slug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { results, programs, institutes, cities, boards } from '@/app/lib/schema';
import { eq, and, ne } from 'drizzle-orm';

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
    month: 'long',
    year: 'numeric',
  });
}

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

// ==================== GET RESULT BY SLUG ====================
async function getResultBySlug(slug: string): Promise<ResultType | null> {
  try {
    console.log('🔍 Fetching result for slug:', slug);
    
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

    if (!result) {
      console.log('❌ No result found for slug:', slug);
      return null;
    }

    console.log('✅ Found result:', result.id);

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
    console.error('❌ Error fetching result:', error);
    return null;
  }
}

// ==================== RELATED RESULTS ====================
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
    conditions.push(ne(results.slug, result.slug));

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
      .limit(5);
  } catch (error) {
    console.error('Error fetching related results:', error);
    return [];
  }
}

// ==================== STATUS BADGE ====================
function getStatusBadge(status: boolean | null) {
  if (status === true) return { bg: 'bg-green-100', text: 'text-green-700', label: 'Published', icon: '✅' };
  if (status === false) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending', icon: '⏳' };
  return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Unknown', icon: '❓' };
}

// ==================== SEO FUNCTIONS ====================

// Generate unique meta title (50-60 characters)
function generateMetaTitle(result: ResultType): string {
  const programName = result.program?.name || 'Exam';
  const institutionName = result.institute?.name || result.board?.name || 'Board';
  const year = result.year || '2026';
  
  return `${programName} Result ${year} - ${institutionName} | NextID.pk`.substring(0, 60);
}

// Generate unique meta description (150-160 characters)
function generateMetaDescription(result: ResultType): string {
  const programName = result.program?.name || 'exam';
  const institutionName = result.institute?.name || result.board?.name || 'board';
  const cityName = result.institute?.city?.name || result.board?.city?.name || 'Pakistan';
  const year = result.year || '2026';
  const resultDate = result.resultDate ? formatShortDate(result.resultDate) : 'TBA';
  const status = result.status ? 'published' : 'pending';
  
  let description = `Check ${programName} result ${year} for ${institutionName} in ${cityName}. `;
  description += `Result date: ${resultDate}. Status: ${status}. `;
  
  if (result.program?.duration) {
    description += `Program duration: ${result.program.duration}. `;
  }
  
  if (result.officialLink) {
    description += `View official result online. `;
  }
  
  description += `Download marksheet, check passing percentage, and more details.`;
  
  return description.substring(0, 160);
}

// Generate meta keywords
function generateMetaKeywords(result: ResultType): string {
  const programName = result.program?.name || '';
  const institutionName = result.institute?.name || result.board?.name || '';
  const cityName = result.institute?.city?.name || result.board?.city?.name || '';
  const provinceName = result.institute?.city?.province || result.board?.city?.province || '';
  const year = result.year || '2026';
  
  const keywords = [
    programName,
    institutionName,
    cityName,
    provinceName,
    'result',
    `result ${year}`,
    `${programName} result`,
    `${institutionName} result`,
    `${cityName} result`,
    'exam result',
    'board result',
    'university result',
    'Pakistan',
    'marksheet',
    'download result',
    'online result',
    'passing percentage',
    'merit list',
  ].filter(Boolean).join(', ');
  
  return keywords;
}

// ==================== GENERATE UNIQUE CONTENT (800+ words) ====================
function generateRichContent(result: ResultType): string {
  const programName = result.program?.name || 'this program';
  const institutionName = result.institute?.name || result.board?.name || 'the institution';
  const institutionType = result.institute ? 'university' : (result.board ? 'board' : 'institution');
  const cityName = result.institute?.city?.name || result.board?.city?.name || 'Pakistan';
  const provinceName = result.institute?.city?.province || result.board?.city?.province || '';
  const year = result.year || '2026';
  const resultDate = result.resultDate ? formatDate(result.resultDate) : 'to be announced';
  const status = result.status ? 'published' : 'pending';
  const isPopular = result.isPopular ? 'popular' : '';
  
  const programOverview = result.program?.overview || `${programName} is a comprehensive academic program offered at ${institutionName}.`;
  const eligibility = result.program?.eligibility || `Students who have completed their previous education with minimum required marks are eligible.`;
  const duration = result.program?.duration || 'the standard duration';
  const careerScope = result.program?.careerScope || `Graduates can pursue careers in various fields including education, research, and professional services.`;
  const feeRange = result.program?.feeRange || 'competitive fee structure';
  
  return `
    <div class="prose prose-green max-w-none">
      <h2>${programName} Result ${year} - Complete Guide</h2>
      
      <p><strong>${institutionName}</strong> has announced the ${programName} result for the year ${year}. This comprehensive guide provides all the information you need about the result, including how to check online, understanding your marksheet, and what to do next.</p>
      
      <h3>Result Overview</h3>
      <p>The ${programName} examination for the year ${year} was conducted by ${institutionName} in ${cityName}${provinceName ? ', ' + provinceName : ''}. A total number of students appeared in this examination. The result has been ${status} and is now available for students to check online.</p>
      
      <h3>Result Date</h3>
      <p>The official result date for ${programName} ${year} is <strong>${resultDate}</strong>. Students are advised to check the result on this date or shortly after when the online portal becomes active.</p>
      
      <h3>How to Check ${programName} Result ${year}</h3>
      <p>Students can check their result through the following methods:</p>
      <ul>
        <li><strong>Online Portal:</strong> Visit the official website of ${institutionName} and navigate to the results section. Enter your roll number to view your result.</li>
        <li><strong>Direct Link:</strong> ${result.officialLink ? `<a href="${result.officialLink}" target="_blank">Click here to check result directly</a>` : 'Use the official link provided by the institution.'}</li>
        <li><strong>SMS Service:</strong> Some boards also provide result via SMS. Send your roll number to the designated code.</li>
        <li><strong>Gazette:</strong> Traditional method - result gazettes are available at designated centers.</li>
      </ul>
      
      <h3>Understanding Your Marksheet</h3>
      <p>Your marksheet contains important information including:</p>
      <ul>
        <li>Student name and roll number</li>
        <li>Subject-wise marks obtained</li>
        <li>Total marks and percentage</li>
        <li>Grade or division (First, Second, Third)</li>
        <li>Institution name and examination year</li>
      </ul>
      
      <h3>About ${programName} Program</h3>
      <p>${programOverview}</p>
      
      <h3>Eligibility Criteria</h3>
      <p>${eligibility}</p>
      
      <h3>Program Duration</h3>
      <p>The ${programName} program at ${institutionName} has a duration of ${duration}. This includes coursework, practical training, and examinations as per the curriculum.</p>
      
      <h3>Career Prospects</h3>
      <p>${careerScope}</p>
      
      <h3>Fee Structure</h3>
      <p>The fee structure for this program is ${feeRange}. Students are advised to check the official website for detailed fee information including semester-wise breakdown.</p>
      
      <h3>About ${institutionName}</h3>
      <p>${institutionName} is a prestigious ${institutionType} located in ${cityName}${provinceName ? ', ' + provinceName : ''}. Established with the mission to provide quality education, it has been serving students for many years. The institution is known for its academic excellence, experienced faculty, and modern facilities.</p>
      
      ${result.institute?.description ? `<p>${result.institute.description}</p>` : ''}
      ${result.board?.description ? `<p>${result.board.description}</p>` : ''}
      
      <h3>Important Information for Students</h3>
      <ul>
        <li>Keep your roll number handy when checking result online</li>
        <li>Download and save your marksheet for future reference</li>
        <li>In case of any discrepancy, contact the examination department immediately</li>
        <li>Original marksheet will be issued by the institution separately</li>
        <li>For re-checking or re-evaluation, follow the official procedure</li>
      </ul>
      
      <h3>Statistics and Analysis</h3>
      <p>The overall pass percentage for ${programName} ${year} examination is expected to be released soon. Previous years have shown consistent performance with many students achieving top positions. The ${isPopular} nature of this result indicates high interest from students and parents.</p>
      
      <h3>Next Steps After Result</h3>
      <p>After checking your result, here are some important next steps:</p>
      <ul>
        <li>If you have passed, proceed to the next academic year or higher studies</li>
        <li>If you need improvement, check for supplementary examination dates</li>
        <li>Collect your original marksheet from the institution</li>
        <li>Start preparing for upcoming admissions or career opportunities</li>
      </ul>
      
      <h3>Frequently Asked Questions</h3>
      
      <h4>Q: When will the ${programName} result ${year} be announced?</h4>
      <p>A: The result is expected on ${resultDate}. Keep checking the official website for updates.</p>
      
      <h4>Q: How can I check my result online?</h4>
      <p>A: Visit the official website of ${institutionName} and enter your roll number in the results section.</p>
      
      <h4>Q: What if I forget my roll number?</h4>
      <p>A: Contact your institution or the examination department for assistance. You may need to provide your name and other details.</p>
      
      <h4>Q: Can I get a physical copy of my marksheet?</h4>
      <p>A: Yes, original marksheets are issued by the institution. Check with your college or board office for distribution details.</p>
      
      <h4>Q: What is the passing percentage this year?</h4>
      <p>A: The overall statistics including pass percentage will be released after the result announcement.</p>
      
      <p><em>Last updated: ${formatDate(result.updatedAt || result.createdAt)}</em></p>
    </div>
  `;
}

// ==================== METADATA ====================
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  const result = await getResultBySlug(slug);

  if (!result) {
    return {
      title: 'Result Not Found | NextID.pk',
      description: 'The requested result could not be found. Browse other results.',
    };
  }

  const title = generateMetaTitle(result);
  const description = generateMetaDescription(result);
  const keywords = generateMetaKeywords(result);
  
  const institutionName = result.institute?.name || result.board?.name || 'Institution';
  const cityName = result.institute?.city?.name || result.board?.city?.name || 'Pakistan';
  const imageUrl = '/images/results-og.jpg';

  return {
    title,
    description,
    keywords,
    
    alternates: {
      canonical: `https://www.nextid.pk/results/${result.slug}`,
    },
    
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: result.createdAt?.toISOString(),
      modifiedTime: result.updatedAt?.toISOString(),
      authors: ['NextID.pk'],
      tags: [
        result.program?.name || 'Exam',
        institutionName,
        cityName,
        `Year ${result.year}`,
        'Result',
      ].filter(Boolean) as string[],
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      siteName: 'NextID.pk',
    },
    
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// ==================== MAIN PAGE ====================
export default async function ResultDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  console.log('📌 Page slug:', slug);
  
  const result = await getResultBySlug(slug);
  
  if (!result) {
    console.log('❌ No result found, showing 404');
    notFound();
  }

  const relatedResults = await getRelatedResults(result);
  const statusBadge = getStatusBadge(result.status);
  const richContent = generateRichContent(result);

  // Determine institution
  const institutionName = result.institute?.name || result.board?.name;
  const institutionSlug = result.institute?.slug || result.board?.slug;
  const institutionType = result.institute ? 'universities' : 'boards';
  const cityName = result.institute?.city?.name || result.board?.city?.name;
  const provinceName = result.institute?.city?.province || result.board?.city?.province;

  return (
    <>
      {/* FAQ Schema for Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": `When will the ${result.program?.name || 'exam'} result ${result.year} be announced?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `The result is expected on ${result.resultDate ? formatDate(result.resultDate) : 'to be announced'}. Check the official website for updates.`
                }
              },
              {
                "@type": "Question",
                "name": `How can I check ${result.program?.name || 'exam'} result ${result.year}?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `Visit the official website of ${institutionName} and enter your roll number in the results section.`
                }
              },
              {
                "@type": "Question",
                "name": `What is the passing percentage for ${result.program?.name || 'exam'} ${result.year}?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `The passing percentage and other statistics will be released after the result announcement.`
                }
              }
            ]
          })
        }}
      />

      <main className="min-h-screen bg-gray-50">
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
              <span className="text-gray-400">›</span>
              <Link href="/results" className="text-gray-600 hover:text-blue-600">Results</Link>
              <span className="text-gray-400">›</span>
              <span className="text-gray-900 font-medium line-clamp-1">
                {result.title || `${result.program?.name || 'Exam'} Result ${result.year}`}
              </span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {result.title || `${result.program?.name || 'Exam'} Result ${result.year}`}
                </h1>
                
                <div className="flex flex-wrap items-center gap-3 text-gray-600">
                  {institutionName && institutionSlug && (
                    <>
                      <Link 
                        href={`/${institutionType}/${institutionSlug}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {institutionName}
                      </Link>
                      {cityName && (
                        <>
                          <span className="text-gray-400">•</span>
                          <Link 
                            href={`/cities/${result.institute?.city?.slug || result.board?.city?.slug}`}
                            className="hover:text-blue-600"
                          >
                            {cityName}{provinceName ? `, ${provinceName}` : ''}
                          </Link>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-400 font-mono">
                  /results/{result.slug}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${statusBadge.bg} ${statusBadge.text}`}>
                  <span>{statusBadge.icon}</span>
                  {statusBadge.label}
                </span>
                {result.isPopular && (
                  <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    ⭐ Popular Result
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Year</div>
              <div className="font-semibold text-lg">{result.year || 'N/A'}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Result Date</div>
              <div className="font-semibold text-lg">{result.resultDate ? formatDate(result.resultDate) : 'TBA'}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Program</div>
              <div className="font-semibold text-lg">{result.program?.name || 'General'}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Duration</div>
              <div className="font-semibold text-lg">{result.program?.duration || 'N/A'}</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Rich SEO Content (800+ words) */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div dangerouslySetInnerHTML={{ __html: richContent }} />
              </div>
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="space-y-6">
              
              {/* Official Link Card */}
              {result.officialLink ? (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-3">Check Result Online</h3>
                  <p className="text-blue-100 text-sm mb-4">
                    View your result on the official website.
                  </p>
                  <a
                    href={result.officialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-white text-blue-600 text-center py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    View Official Result →
                  </a>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Result Status</h3>
                  <p className="text-gray-600 text-sm">
                    The official result link is not yet available. Please check back later or visit the institution's website.
                  </p>
                </div>
              )}

              {/* Institution Info */}
              {institutionName && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">About {institutionType === 'universities' ? 'University' : 'Board'}</h3>
                  <Link 
                    href={`/${institutionType}/${institutionSlug}`}
                    className="text-xl font-semibold text-blue-600 hover:underline block mb-2"
                  >
                    {institutionName}
                  </Link>
                  {result.institute?.description && (
                    <p className="text-gray-600 text-sm mt-2">{result.institute.description}</p>
                  )}
                  {result.board?.description && (
                    <p className="text-gray-600 text-sm mt-2">{result.board.description}</p>
                  )}
                  {cityName && (
                    <div className="mt-3 text-sm text-gray-500">
                      📍 {cityName}{provinceName ? `, ${provinceName}` : ''}
                    </div>
                  )}
                  {(result.institute?.website || result.board?.website) && (
                    <a
                      href={result.institute?.website || result.board?.website || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      🌐 Visit Official Website
                    </a>
                  )}
                </div>
              )}

              {/* Related Results */}
              {relatedResults.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Related Results</h3>
                  <div className="space-y-3">
                    {relatedResults.map(r => (
                      <Link
                        key={r.id}
                        href={`/results/${r.slug}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition group"
                      >
                        <div className="font-medium text-gray-800 group-hover:text-blue-600">
                          {r.title || `Result ${r.year}`}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>{r.instituteName || r.boardName}</span>
                          {r.resultDate && (
                            <>
                              <span>•</span>
                              <span>{formatShortDate(r.resultDate)}</span>
                            </>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/results?year=2026" className="block text-sm text-blue-600 hover:underline">
                    📚 All 2026 Results
                  </Link>
                  <Link href="/results?level=matric" className="block text-sm text-blue-600 hover:underline">
                    📖 Matric Results
                  </Link>
                  <Link href="/results?level=inter" className="block text-sm text-blue-600 hover:underline">
                    📚 Intermediate Results
                  </Link>
                  <Link href="/results?level=ba" className="block text-sm text-blue-600 hover:underline">
                    🎓 BA/BSc Results
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-8 text-sm text-gray-500 border-t pt-4">
            Last updated: {formatDate(result.updatedAt || result.createdAt)}
          </div>
        </div>
      </main>
    </>
  );
}