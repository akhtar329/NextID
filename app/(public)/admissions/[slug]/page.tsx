// app/(public)/admissions/[slug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { admissions, admissionPrograms, programs, institutes, cities, degrees } from '@/app/lib/schema';
import { eq, and, ne, inArray } from 'drizzle-orm';

// ==================== TYPES ====================
interface ProgramWithDetails {
  id: number;
  name: string;
  slug: string;
  degreeName: string | null;
  overview: string | null;
  eligibility: string | null;
  duration: string | null;
  careerScope: string | null;
  feeRange: string | null;
}

interface CityType {
  id: number;
  name: string;
  slug: string;
  province: string | null;
}

interface InstituteType {
  id: number;
  name: string;
  slug: string;
  type: string | null;
  description: string | null;
  website: string | null;
  city: CityType | null;
}

interface AdmissionWithPrograms {
  id: number;
  name: string;
  slug: string;
  year: number;
  session: string | null;
  status: 'Expected' | 'Open' | 'Closed';
  expectedOpenDate: Date | null;
  expectedCloseDate: Date | null;
  meritInfo: string | null;
  note: string | null;
  officialLink: string | null;
  institute: InstituteType | null;
  programs: ProgramWithDetails[];
  programCount: number;
  createdAt: Date | null;
  updatedAt: Date | null;

}

// ==================== HELPER FUNCTIONS ====================
function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

function formatSeoDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', { 
    month: 'long', 
    year: 'numeric' 
  });
}

function getProgramsText(programs: ProgramWithDetails[]): string {
  if (programs.length === 0) return 'programs';
  if (programs.length === 1) return programs[0].name;
  if (programs.length === 2) return `${programs[0].name} and ${programs[1].name}`;
  
  const firstTwo = programs.slice(0, 2).map(p => p.name).join(', ');
  return `${firstTwo} and ${programs.length - 2} other programs`;
}

// ==================== GET ADMISSION BY SLUG ====================
async function getAdmissionBySlug(slug: string): Promise<AdmissionWithPrograms | null> {
  try {
    console.log('🔍 Looking for admission with slug:', slug);
    
    // Get admission with institute details
    const admissionResult = await db
      .select({
        id: admissions.id,
        name: admissions.name,
        slug: admissions.slug,
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        expectedOpenDate: admissions.expectedOpenDate,
        expectedCloseDate: admissions.expectedCloseDate,
        meritInfo: admissions.meritInfo,
        note: admissions.note,
        officialLink: admissions.officialLink,
        instituteId: admissions.instituteId,

        createdAt: admissions.createdAt,
    updatedAt: admissions.updatedAt,
      })
      .from(admissions)
      .where(eq(admissions.slug, slug))
      .limit(1);
    
    if (admissionResult.length === 0) {
      console.log('❌ Admission not found with slug:', slug);
      return null;
    }
    
    const admission = admissionResult[0];
    
    // Get institute details
    let institute: InstituteType | null = null;
    if (admission.instituteId) {
      const instituteResult = await db
        .select({
          id: institutes.id,
          name: institutes.name,
          slug: institutes.slug,
          type: institutes.type,
          description: institutes.description,
          website: institutes.website,
          cityId: institutes.cityId,
        })
        .from(institutes)
        .where(eq(institutes.id, admission.instituteId))
        .limit(1);
      
      if (instituteResult[0]) {
        // Get city details
        let city: CityType | null = null;
        if (instituteResult[0].cityId) {
          const cityResult = await db
            .select({
              id: cities.id,
              name: cities.name,
              slug: cities.slug,
              province: cities.province,
            })
            .from(cities)
            .where(eq(cities.id, instituteResult[0].cityId))
            .limit(1);
          
          city = cityResult[0] || null;
        }

        institute = {
          ...instituteResult[0],
          city,
        };
      }
    }

    // Get all programs for this admission
    const programList = await db
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
      .from(admissionPrograms)
      .innerJoin(programs, eq(admissionPrograms.programId, programs.id))
      .where(eq(admissionPrograms.admissionId, admission.id));

    // Get degree names for programs
    const programsWithDegrees: ProgramWithDetails[] = await Promise.all(
      programList.map(async (p) => {
        let degreeName: string | null = null;
        if (p.degreeId) {
          const degreeResult = await db
            .select({ name: degrees.name })
            .from(degrees)
            .where(eq(degrees.id, p.degreeId))
            .limit(1);
          degreeName = degreeResult[0]?.name || null;
        }
        
        return {
          ...p,
          degreeName,
        };
      })
    );

    console.log(`✅ Found admission with ${programsWithDegrees.length} programs`);

    return {
      ...admission,
      status: admission.status as 'Expected' | 'Open' | 'Closed',
      institute,
      programs: programsWithDegrees,
      programCount: programsWithDegrees.length,
    };

  } catch (error) {
    console.error('❌ Error fetching admission:', error);
    return null;
  }
}

// ==================== GET RELATED ADMISSIONS ====================
async function getRelatedAdmissions(admission: AdmissionWithPrograms) {
  try {
    if (!admission.institute?.id || !admission.slug) return [];
    
    const related = await db
      .select({
        id: admissions.id,
        name: admissions.name,
        slug: admissions.slug,
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
      })
      .from(admissions)
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .where(
        and(
          eq(admissions.instituteId, admission.institute.id),
          eq(admissions.status, 'Open'),
          ne(admissions.slug, admission.slug)
        )
      )
      .limit(5);
    
    return related;
  } catch (error) {
    console.error('Error fetching related admissions:', error);
    return [];
  }
}

// ==================== STATUS BADGE ====================
function getStatusBadge(status: string) {
  const badges = {
    'Open': { bg: 'bg-green-100', text: 'text-green-700', label: 'Applications Open', icon: 'Open' },
    'Closed': { bg: 'bg-red-100', text: 'text-red-700', label: 'Applications Closed', icon: 'Closed' },
    'Expected': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Opening Soon', icon: 'Expected' },
  };
  return badges[status as keyof typeof badges] || { 
    bg: 'bg-gray-100', 
    text: 'text-gray-700', 
    label: status,
    icon: 'Status'
  };
}

// ==================== SEO FUNCTIONS ====================

function generateMetaTitle(admission: AdmissionWithPrograms): string {
  const instituteName = admission.institute?.name || 'University';
  const year = admission.year || '2026';
  const cityName = admission.institute?.city?.name || 'Pakistan';
  const status = admission.status?.toLowerCase() || 'open';
  
  // Create title based on program count
  const programsText = getProgramsText(admission.programs);
  
  if (status === 'open') {
    return `Admissions Open ${year} at ${instituteName}, ${cityName} - Multiple Programs`.substring(0, 60);
  } else if (status === 'expected') {
    return `Admissions Expected ${year} at ${instituteName}, ${cityName} - Apply Soon`.substring(0, 60);
  } else {
    return `Admissions Closed ${year} at ${instituteName}, ${cityName} - Check Next Cycle`.substring(0, 60);
  }
}

function generateMetaDescription(admission: AdmissionWithPrograms): string {
  const instituteName = admission.institute?.name || 'university';
  const cityName = admission.institute?.city?.name || 'Pakistan';
  const year = admission.year || '2026';
  const status = admission.status?.toLowerCase() || 'open';
  const deadline = admission.expectedCloseDate ? formatSeoDate(admission.expectedCloseDate) : 'TBA';
  const session = admission.session || 'Fall';
  
  // List programs naturally
  const programNames = admission.programs.map(p => p.name).join(', ');
  const programCount = admission.programs.length;
  
  let description = '';
  
  if (status === 'open') {
    description = `${instituteName} in ${cityName}, Pakistan has opened admissions for ${year}. `;
    if (programCount === 1) {
      description += `Applications are open for ${admission.programs[0].name}. `;
    } else if (programCount <= 3) {
      description += `Applications are open for multiple programs including ${programNames}. `;
    } else {
      description += `Applications are open for ${programCount} different programs. `;
    }
    description += `The last date to apply is ${deadline} for the ${session} session. `;
  } else if (status === 'expected') {
    description = `${instituteName} in ${cityName}, Pakistan will soon announce admissions for ${year}. `;
    description += `The ${session} session admissions are expected to open with the deadline of ${deadline}. `;
  } else {
    description = `${instituteName} in ${cityName}, Pakistan has closed admissions for ${year}. `;
    description += `The last date for applications was ${deadline} for the ${session} session. `;
  }
  
  // Add eligibility info
  if (admission.programs.length > 0) {
    const firstProgram = admission.programs[0];
    if (firstProgram.eligibility) {
      description += `Eligibility: ${firstProgram.eligibility.substring(0, 100)}. `;
    }
    if (firstProgram.feeRange) {
      description += `Fee range: ${firstProgram.feeRange}. `;
    }
  }
  
  // Add call to action
  description += `Visit NextID.pk for complete admission details, program list, and application process for ${instituteName} admissions ${year}.`;
  
  return description.substring(0, 160);
}

function generateMetaKeywords(admission: AdmissionWithPrograms): string {
  const instituteName = admission.institute?.name || '';
  const cityName = admission.institute?.city?.name || '';
  const provinceName = admission.institute?.city?.province || '';
  const year = admission.year || '2026';
  const status = admission.status || '';
  const session = admission.session || '';
  
  // Add all program names
  const programKeywords = admission.programs.map(p => p.name).join(', ');
  
  const keywords = [
    instituteName,
    cityName,
    provinceName,
    'admissions',
    `admissions ${year}`,
    `${instituteName} admissions`,
    `${cityName} admissions`,
    programKeywords,
    'university admissions',
    'college admissions',
    'Pakistan education',
    'apply online',
    'last date',
    'merit list',
    'fee structure',
    'eligibility criteria',
    status.toLowerCase(),
    session,
    `admission ${year}`,
    'study in Pakistan',
    'higher education',
  ].filter(Boolean).join(', ');
  
  return keywords;
}

// Generate FAQ structured data
function generateFAQStructuredData(admission: AdmissionWithPrograms) {
  const instituteName = admission.institute?.name || 'the university';
  const year = admission.year || '2026';
  const deadline = admission.expectedCloseDate ? formatSeoDate(admission.expectedCloseDate) : 'TBA';
  const openDate = admission.expectedOpenDate ? formatSeoDate(admission.expectedOpenDate) : 'TBA';
  
  const programNames = admission.programs.map(p => p.name).join(', ');
  const programCount = admission.programs.length;
  
  // Create FAQs dynamically based on program count
  const faqs = [
    {
      "@type": "Question",
      "name": `When do admissions ${year} start at ${instituteName}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `Admissions ${year} at ${instituteName} are expected to open on ${openDate}. Candidates are advised to check the official website for exact dates.`
      }
    },
    {
      "@type": "Question",
      "name": `What is the last date for admissions ${year} at ${instituteName}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `The last date for admissions ${year} at ${instituteName} is ${deadline}. Applications received after this date will not be considered.`
      }
    }
  ];
  
  // Add program-specific FAQs
  if (programCount > 0) {
    faqs.push({
      "@type": "Question",
      "name": `What programs are available for admissions ${year} at ${instituteName}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `${instituteName} is offering admissions in ${programCount} program(s) including ${programNames}. Each program has its own eligibility criteria and duration.`
      }
    });
  }
  
  // Add status-specific FAQ
  faqs.push({
    "@type": "Question",
    "name": `Are admissions ${year} open at ${instituteName}?`,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": admission.status === 'Open' 
        ? `Yes, admissions ${year} are currently open at ${instituteName}. Interested candidates should submit their applications before ${deadline}.`
        : admission.status === 'Expected'
          ? `Admissions ${year} at ${instituteName} are expected to open soon on ${openDate}. Stay tuned for announcements.`
          : `Admissions ${year} at ${instituteName} are now closed. The last date was ${deadline}. Check back for the next cycle.`
    }
  });
  
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs
  };
}

// Generate breadcrumb data
function generateBreadcrumbData(admission: AdmissionWithPrograms) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.nextid.pk/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Admissions",
        "item": "https://www.nextid.pk/admissions"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `${admission.institute?.name} Admissions ${admission.year}`,
        "item": `https://www.nextid.pk/admissions/${admission.slug}`
      }
    ]
  };
}

// Generate natural article content
function generateArticleContent(admission: AdmissionWithPrograms): string {
  const instituteName = admission.institute?.name || 'the university';
  const cityName = admission.institute?.city?.name || 'Pakistan';
  const year = admission.year || '2026';
  const status = admission.status || 'Open';
  const session = admission.session || 'Fall';
  const deadline = admission.expectedCloseDate ? formatSeoDate(admission.expectedCloseDate) : 'the announced deadline';
  
  const programCount = admission.programs.length;
  const programList = admission.programs.map(p => 
    `<li><strong>${p.name}</strong> - Duration: ${p.duration || 'Standard'}, Fee: ${p.feeRange || 'Contact university'}</li>`
  ).join('');
  
  return `
    <h2>Complete Guide to ${instituteName} Admissions ${year}</h2>
    
    <p><strong>${instituteName}</strong>, located in ${cityName}, has announced admissions for the year ${year}. This comprehensive guide provides all the information you need about available programs, eligibility criteria, and the application process.</p>
    
    <h3>Available Programs (${programCount})</h3>
    <p>${instituteName} is offering admissions in the following programs for the ${session} session:</p>
    <ul>
      ${programList}
    </ul>
    
    <h3>Admission Status</h3>
    <p>The admission status for ${year} at ${instituteName} is <strong>${status}</strong>. ${
      status === 'Open' 
        ? `Applications are being accepted until ${deadline}. Prospective students are encouraged to apply early.` 
        : status === 'Expected'
          ? `Applications will open on ${admission.expectedOpenDate ? formatSeoDate(admission.expectedOpenDate) : 'the announced date'}.`
          : `Applications for ${year} are now closed. The deadline was ${deadline}.`
    }</p>
    
    <h3>General Eligibility Criteria</h3>
    <p>While each program may have specific requirements, general eligibility includes:</p>
    <ul>
      <li>Completion of previous education from a recognized board/university</li>
      <li>Minimum marks/CGPA as specified by the program</li>
      <li>Entry test scores (where applicable)</li>
      <li>Any program-specific prerequisites</li>
    </ul>
    
    <h3>Application Process</h3>
    <p>To apply for admissions at ${instituteName}:</p>
    <ol>
      <li>Visit the official website of ${instituteName}</li>
      <li>Register on the admissions portal</li>
      <li>Fill out the application form with accurate information</li>
      <li>Select your preferred program(s)</li>
      <li>Upload required documents</li>
      <li>Pay the application fee</li>
      <li>Submit before the deadline: ${deadline}</li>
    </ol>
    
    <h3>Required Documents</h3>
    <ul>
      <li>Educational certificates and transcripts</li>
      <li>CNIC or B-Form</li>
      <li>Passport-sized photographs</li>
      <li>Entry test score card (if applicable)</li>
      <li>Domicile certificate</li>
      <li>Any program-specific requirements</li>
    </ul>
    
    <h3>Why Choose ${instituteName}?</h3>
    <p>${instituteName} is known for academic excellence, experienced faculty, modern facilities, and strong industry connections. Students benefit from quality education and excellent career opportunities.</p>
    
    <h3>Contact Information</h3>
    <p>For queries regarding admissions ${year}:</p>
    <ul>
      <li><strong>Admissions Office:</strong> ${instituteName}, ${cityName}</li>
      <li><strong>Official Website:</strong> <a href="${admission.institute?.website || '#'}">${admission.institute?.website || 'Visit website'}</a></li>
    </ul>
    
    <p><em>Last updated: ${formatDate(admission.updatedAt || admission.createdAt)}</em></p>
  `;
}

// ==================== METADATA ====================
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  const admission = await getAdmissionBySlug(slug);
  
  if (!admission) {
    return {
      title: 'Admission Not Found | NextID.pk',
      description: 'The requested admission information could not be found.',
      robots: { index: false },
    };
  }

  const title = generateMetaTitle(admission);
  const description = generateMetaDescription(admission);
  const keywords = generateMetaKeywords(admission);
  const canonicalUrl = `https://www.nextid.pk/admissions/${admission.slug}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${admission.institute?.name} Admissions ${admission.year} | NextID.pk`,
      description: description.substring(0, 160),
      type: 'article',
      publishedTime: admission.createdAt?.toISOString(),
      modifiedTime: admission.updatedAt?.toISOString(),
      images: [{ url: '/images/og-admissions.jpg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${admission.institute?.name} Admissions ${admission.year}`,
      description: description.substring(0, 160),
    },
    robots: { index: true, follow: true },
  };
}

// ==================== MAIN PAGE ====================
export default async function AdmissionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const admission = await getAdmissionBySlug(slug);
  
  if (!admission) {
    notFound();
  }

  const relatedAdmissions = await getRelatedAdmissions(admission);
  const statusBadge = getStatusBadge(admission.status);
  const faqData = generateFAQStructuredData(admission);
  const breadcrumbData = generateBreadcrumbData(admission);
  const articleContent = generateArticleContent(admission);

  // Natural description of programs
  const programDescription = admission.programCount === 1 
    ? admission.programs[0].name
    : admission.programCount === 2
      ? `${admission.programs[0].name} and ${admission.programs[1].name}`
      : `${admission.programs.length} programs including ${admission.programs.slice(0, 3).map(p => p.name).join(', ')}`;

  return (
    <>
      {/* Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} />

      <main className="min-h-screen bg-gray-50">
        
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
              <span className="text-gray-400">›</span>
              <Link href="/admissions" className="text-gray-600 hover:text-blue-600">Admissions</Link>
              <span className="text-gray-400">›</span>
              <span className="text-gray-900 font-medium line-clamp-1">
                {admission.institute?.name} Admissions {admission.year}
              </span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {admission.institute?.name} Admissions {admission.year}
                </h1>
                
                {/* Natural Program List */}
                <div className="text-gray-700 mb-3">
                  <span className="font-medium">Offering admissions in: </span>
                  <span className="text-gray-600">{programDescription}</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-gray-600">
                  <span>{admission.institute?.city?.name}, {admission.institute?.city?.province || 'Pakistan'}</span>
                  {admission.institute?.type && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span>{admission.institute.type}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusBadge.bg} ${statusBadge.text}`}>
                  {statusBadge.label}
                </span>
                {admission.session && (
                  <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
                    Session: {admission.session} {admission.year}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Applications Open</div>
              <div className="font-semibold">
                {admission.expectedOpenDate ? formatDate(admission.expectedOpenDate) : 'Opening Soon'}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Last Date</div>
              <div className="font-semibold">
                {admission.expectedCloseDate ? formatDate(admission.expectedCloseDate) : 'To Be Announced'}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Available Programs</div>
              <div className="font-semibold">{admission.programCount}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Institute Type</div>
              <div className="font-semibold">{admission.institute?.type || 'University'}</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* All Programs Section */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Available Programs</h2>
                <div className="space-y-4">
                  {admission.programs.map((program, index) => (
                    <div key={program.id} className="border-b last:border-0 pb-4 last:pb-0">
                      <Link 
                        href={`/programs/${program.slug}`}
                        className="text-lg font-semibold text-blue-600 hover:underline"
                      >
                        {program.name}
                      </Link>
                      
                      <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                        {program.duration && (
                          <div className="text-gray-600">
                            <span className="font-medium">Duration:</span> {program.duration}
                          </div>
                        )}
                        {program.feeRange && (
                          <div className="text-gray-600">
                            <span className="font-medium">Fee Range:</span> {program.feeRange}
                          </div>
                        )}
                      </div>
                      
                      {program.eligibility && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Eligibility:</span> {program.eligibility.substring(0, 150)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Merit Info (if common) */}
              {admission.meritInfo && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Merit Information</h2>
                  <div className="text-gray-700 leading-relaxed">
                    {admission.meritInfo}
                  </div>
                </div>
              )}

              {/* Notes */}
              {admission.note && (
                <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                  <h2 className="text-xl font-bold text-yellow-800 mb-4">Important Notes</h2>
                  <div className="text-yellow-700 leading-relaxed">
                    {admission.note}
                  </div>
                </div>
              )}

              {/* Article Content */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div 
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: articleContent }}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Apply Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-3">Apply Now</h3>
                <p className="text-blue-100 text-sm mb-4">
                  {admission.status === 'Open' 
                    ? `${admission.programCount} programs accepting applications. Don't miss the deadline.` 
                    : admission.status === 'Expected'
                      ? `Applications for ${admission.programCount} programs will open soon.`
                      : 'Applications are now closed.'}
                </p>
                {admission.officialLink ? (
                  <a
                    href={admission.officialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-white text-blue-600 text-center py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    {admission.status === 'Open' ? 'Apply Online' : 'Visit Website'}
                  </a>
                ) : (
                  <button
                    disabled
                    className="block w-full bg-gray-300 text-gray-600 text-center py-3 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Link Coming Soon
                  </button>
                )}
              </div>

              {/* Institute Info */}
              {admission.institute && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">About {admission.institute.name}</h3>
                  {admission.institute.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {admission.institute.description}
                    </p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Location:</span> {admission.institute.city?.name}, {admission.institute.city?.province || 'Pakistan'}</div>
                    <div><span className="font-medium">Type:</span> {admission.institute.type}</div>
                    {admission.institute.website && (
                      <a href={admission.institute.website} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline block">
                        Visit Official Website →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Related Admissions */}
              {relatedAdmissions.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">More from {admission.institute?.name}</h3>
                  <div className="space-y-3">
                    {relatedAdmissions.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/admissions/${rel.slug}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition"
                      >
                        <div className="font-medium text-gray-800">{rel.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {rel.session && `${rel.session} `}{rel.year}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-8 text-sm text-gray-500 border-t pt-4">
            Last updated: {formatDate(admission.updatedAt || admission.createdAt)}
          </div>
        </div>
      </main>
    </>
  );
}