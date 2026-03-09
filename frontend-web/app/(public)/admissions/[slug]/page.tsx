// app/(public)/admissions/[slug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { admissions, programs, institutes, cities } from '@/app/lib/schema';
import { eq, and, ne } from 'drizzle-orm';

// ==================== FORMAT DATE FUNCTION ====================
function formatDate(date: Date | null) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-PK', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

// ==================== FORMAT SHORT DATE FOR SEO ====================
function formatSeoDate(date: Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-PK', { 
    month: 'long', 
    year: 'numeric' 
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

interface AdmissionType {
  id: number;
  name: string | null;
  slug: string | null;
  programId: number | null;
  instituteId: number | null;
  year: number | null;
  session: string | null;
  status: string | null;
  expectedOpenDate: Date | null;
  expectedCloseDate: Date | null;
  meritInfo: string | null;
  note: string | null;
  officialLink: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  program: ProgramType | null;
  institute: InstituteType | null;
}

// ==================== GET ADMISSION BY SLUG ====================
async function getAdmissionBySlug(slug: string): Promise<AdmissionType | null> {
  try {
    console.log('Looking for admission with slug:', slug);
    
    const admissionResult = await db
      .select({
        id: admissions.id,
        name: admissions.name,
        slug: admissions.slug,
        programId: admissions.programId,
        instituteId: admissions.instituteId,
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        expectedOpenDate: admissions.expectedOpenDate,
        expectedCloseDate: admissions.expectedCloseDate,
        meritInfo: admissions.meritInfo,
        note: admissions.note,
        officialLink: admissions.officialLink,
        createdAt: admissions.createdAt,
        updatedAt: admissions.updatedAt,
      })
      .from(admissions)
      .where(eq(admissions.slug, slug))
      .limit(1);
    
    if (admissionResult.length === 0) {
      console.log('Admission not found with slug:', slug);
      return null;
    }
    
    const admission = admissionResult[0];
    console.log('Found admission:', admission.id);
    
    // Get program details
    let program = null;
    if (admission.programId) {
      const programResult = await db
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
        .where(eq(programs.id, admission.programId))
        .limit(1);
      
      program = programResult[0] || null;
    }

    // Get institute details
    let institute = null;
    if (admission.instituteId) {
      const instituteResult = await db
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
        .where(eq(institutes.id, admission.instituteId))
        .limit(1);
      
      if (instituteResult[0]) {
        // Get city details
        let city = null;
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

    return {
      ...admission,
      program,
      institute,
    };
  } catch (error) {
    console.error('Error fetching admission:', error);
    return null;
  }
}

// ==================== GET RELATED ADMISSIONS ====================
async function getRelatedAdmissions(admission: AdmissionType) {
  try {
    if (!admission.programId || !admission.slug) return [];
    
    const related = await db
      .select({
        id: admissions.id,
        name: admissions.name,
        slug: admissions.slug,
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        programName: programs.name,
        programSlug: programs.slug,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
      })
      .from(admissions)
      .innerJoin(programs, eq(admissions.programId, programs.id))
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .where(
        and(
          eq(admissions.programId, admission.programId),
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
function getStatusBadge(status: string | null) {
  const badges = {
    'Open': { bg: 'bg-green-100', text: 'text-green-700', label: 'Open', icon: 'Open' },
    'Closed': { bg: 'bg-red-100', text: 'text-red-700', label: 'Closed', icon: 'Closed' },
    'Expected': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Expected Soon', icon: 'Expected' },
  };
  return badges[status as keyof typeof badges] || { 
    bg: 'bg-gray-100', 
    text: 'text-gray-700', 
    label: status || 'Unknown',
    icon: 'Status'
  };
}

// ==================== SEO FUNCTIONS ====================

// Generate unique meta title for each admission (50-60 characters)
function generateMetaTitle(admission: AdmissionType): string {
  const programName = admission.program?.name || 'Program';
  const instituteName = admission.institute?.name || 'University';
  const year = admission.year || '2026';
  const cityName = admission.institute?.city?.name || 'Pakistan';
  const status = admission.status?.toLowerCase() || 'open';
  
  if (status === 'open') {
    return `${programName} Admissions ${year} - Apply Now at ${instituteName}, ${cityName}`.substring(0, 60);
  } else if (status === 'expected') {
    return `${programName} Admissions ${year} Expected Soon - ${instituteName}, ${cityName}`.substring(0, 60);
  } else {
    return `${programName} Admissions ${year} Closed - Check Results at ${instituteName}`.substring(0, 60);
  }
}

// Generate comprehensive meta description (150-160 characters) - NO EMOJIS
function generateMetaDescription(admission: AdmissionType): string {
  const programName = admission.program?.name || 'program';
  const instituteName = admission.institute?.name || 'university';
  const cityName = admission.institute?.city?.name || 'Pakistan';
  const year = admission.year || '2026';
  const status = admission.status?.toLowerCase() || 'open';
  const deadline = admission.expectedCloseDate ? formatSeoDate(admission.expectedCloseDate) : 'TBA';
  const duration = admission.program?.duration || '4 years';
  const feeRange = admission.program?.feeRange || 'Contact university for fee details';
  const session = admission.session || 'Fall';
  
  let description = '';
  
  if (status === 'open') {
    description = `${programName} admissions ${year} are now open at ${instituteName} in ${cityName}, Pakistan. The last date to apply is ${deadline} for the ${session} session. This ${duration} program offers comprehensive education in ${programName}. `;
  } else if (status === 'expected') {
    description = `${programName} admissions ${year} at ${instituteName} in ${cityName}, Pakistan are expected to open soon. The expected closing date is ${deadline} for the ${session} session. Prepare your application for this ${duration} program. `;
  } else {
    description = `${programName} admissions ${year} at ${instituteName} in ${cityName}, Pakistan are now closed. The last date for applications was ${deadline} for the ${session} session. Check back for the next admission cycle. `;
  }
  
  // Add eligibility if available
  if (admission.program?.eligibility) {
    const shortEligibility = admission.program.eligibility.substring(0, 100);
    description += `Eligibility: ${shortEligibility}. `;
  }
  
  // Add fee range
  description += `Fee range: ${feeRange}. `;
  
  // Add merit info if available
  if (admission.meritInfo) {
    description += `Merit information is available on the official website. `;
  }
  
  // Add call to action
  description += `Visit NextID.pk for complete admission details, application process, and official links for ${instituteName} admissions ${year}.`;
  
  return description.substring(0, 160);
}

// Generate meta keywords
function generateMetaKeywords(admission: AdmissionType): string {
  const programName = admission.program?.name || '';
  const instituteName = admission.institute?.name || '';
  const cityName = admission.institute?.city?.name || '';
  const provinceName = admission.institute?.city?.province || '';
  const year = admission.year || '2026';
  const status = admission.status || '';
  const session = admission.session || '';
  
  const keywords = [
    programName,
    instituteName,
    cityName,
    provinceName,
    'admissions',
    `admissions ${year}`,
    `${programName} admissions ${year}`,
    `${instituteName} admissions`,
    `${cityName} admissions`,
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
    'university application',
    'education portal Pakistan',
    'admission guide',
    'how to apply',
  ].filter(Boolean).join(', ');
  
  return keywords;
}

// Generate Open Graph title
function generateOgTitle(admission: AdmissionType): string {
  const programName = admission.program?.name || 'Program';
  const instituteName = admission.institute?.name || 'University';
  const year = admission.year || '2026';
  
  return `${programName} Admissions ${year} at ${instituteName} | NextID.pk`;
}

// Generate Open Graph description - NO EMOJIS
function generateOgDescription(admission: AdmissionType): string {
  const programName = admission.program?.name || 'Program';
  const instituteName = admission.institute?.name || 'University';
  const cityName = admission.institute?.city?.name || 'Pakistan';
  const year = admission.year || '2026';
  const deadline = admission.expectedCloseDate ? formatSeoDate(admission.expectedCloseDate) : 'TBA';
  const status = admission.status?.toLowerCase() || 'open';
  
  let description = '';
  
  if (status === 'open') {
    description = `${programName} admissions ${year} are open at ${instituteName} in ${cityName}, Pakistan. `;
  } else if (status === 'expected') {
    description = `${programName} admissions ${year} are expected soon at ${instituteName} in ${cityName}, Pakistan. `;
  } else {
    description = `${programName} admissions ${year} are closed at ${instituteName} in ${cityName}, Pakistan. `;
  }
  
  description += `Last date to apply: ${deadline}. Check eligibility, merit criteria, fee structure, and apply online through the official website.`;
  
  return description.substring(0, 200);
}

// Generate Twitter title
function generateTwitterTitle(admission: AdmissionType): string {
  const programName = admission.program?.name || 'Program';
  const instituteName = admission.institute?.name || 'University';
  const year = admission.year || '2026';
  
  return `${programName} Admissions ${year} | ${instituteName}`;
}

// Generate FAQ structured data
function generateFAQStructuredData(admission: AdmissionType) {
  const programName = admission.program?.name || 'the program';
  const instituteName = admission.institute?.name || 'the university';
  const year = admission.year || '2026';
  const deadline = admission.expectedCloseDate ? formatSeoDate(admission.expectedCloseDate) : 'TBA';
  const openDate = admission.expectedOpenDate ? formatSeoDate(admission.expectedOpenDate) : 'TBA';
  const duration = admission.program?.duration || '4 years';
  const feeRange = admission.program?.feeRange || 'Contact university for detailed fee structure';
  const eligibility = admission.program?.eligibility || 'Check the official website for complete eligibility requirements';
  
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `When do ${programName} admissions ${year} start at ${instituteName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${programName} admissions ${year} at ${instituteName} are expected to open on ${openDate}. Candidates are advised to check the official website for exact dates and application process.`
        }
      },
      {
        "@type": "Question",
        "name": `What is the last date for ${programName} admissions ${year} at ${instituteName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `The last date for ${programName} admissions ${year} at ${instituteName} is ${deadline}. Applications received after this date will not be considered.`
        }
      },
      {
        "@type": "Question",
        "name": `What is the eligibility criteria for ${programName} at ${instituteName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${eligibility} Candidates must meet the minimum requirements to be considered for admission.`
        }
      },
      {
        "@type": "Question",
        "name": `What is the duration of the ${programName} program at ${instituteName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `The ${programName} program at ${instituteName} has a duration of ${duration}. The program is designed to provide comprehensive education and training in the field.`
        }
      },
      {
        "@type": "Question",
        "name": `What is the fee structure for ${programName} at ${instituteName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${feeRange}. For detailed fee information including semester-wise breakdown and scholarship opportunities, please visit the official website or contact the admissions office.`
        }
      },
      {
        "@type": "Question",
        "name": `Is ${programName} admissions ${year} open at ${instituteName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": admission.status === 'Open' 
            ? `Yes, ${programName} admissions ${year} are currently open at ${instituteName}. Interested candidates should submit their applications before the deadline of ${deadline}.`
            : admission.status === 'Expected'
              ? `${programName} admissions ${year} at ${instituteName} are expected to open soon. The expected opening date is ${openDate}. Stay tuned for official announcements.`
              : `${programName} admissions ${year} at ${instituteName} are now closed. The last date for applications was ${deadline}. Interested candidates can check back for the next admission cycle.`
        }
      }
    ]
  };
}

// Generate breadcrumb structured data
function generateBreadcrumbData(admission: AdmissionType) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://nextid.pk/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Admissions",
        "item": "https://nextid.pk/admissions"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `${admission.program?.name} Admissions ${admission.year}`,
        "item": `https://nextid.pk/admissions/${admission.slug}`
      }
    ]
  };
}

// Generate article content for SEO (500+ words)
function generateArticleContent(admission: AdmissionType): string {
  const programName = admission.program?.name || 'this program';
  const instituteName = admission.institute?.name || 'the university';
  const cityName = admission.institute?.city?.name || 'Pakistan';
  const provinceName = admission.institute?.city?.province || '';
  const year = admission.year || '2026';
  const status = admission.status || 'Open';
  const session = admission.session || 'Fall';
  const deadline = admission.expectedCloseDate ? formatSeoDate(admission.expectedCloseDate) : 'the announced deadline';
  const openDate = admission.expectedOpenDate ? formatSeoDate(admission.expectedOpenDate) : 'TBA';
  const duration = admission.program?.duration || 'the standard duration';
  const feeRange = admission.program?.feeRange || 'competitive fee structure';
  const eligibility = admission.program?.eligibility || 'specific eligibility criteria';
  const careerScope = admission.program?.careerScope || 'excellent career opportunities';
  
  return `
    <h2>Complete Guide to ${programName} Admissions ${year} at ${instituteName}</h2>
    
    <p><strong>${instituteName}</strong>, located in ${cityName}${provinceName ? ', ' + provinceName : ''}, has announced admissions for the ${programName} program for the year ${year}. This comprehensive guide provides all the information you need to apply successfully.</p>
    
    <h3>About ${programName} Program</h3>
    <p>The ${programName} program at ${instituteName} is designed to provide students with in-depth knowledge and practical skills in the field. With a duration of ${duration}, this program prepares graduates for successful careers in various sectors. Students receive quality education from experienced faculty members and have access to modern facilities and resources.</p>
    
    <h3>Admission Status for ${year}</h3>
    <p>The admission status for ${programName} at ${instituteName} is currently <strong>${status}</strong>. ${
      status === 'Open' 
        ? `Applications are being accepted until the deadline of ${deadline}. Interested candidates are encouraged to apply as soon as possible to secure their place.` 
        : status === 'Expected'
          ? `Applications are expected to open on ${openDate} for the ${session} session. Prospective students should prepare their documents in advance.`
          : `Applications for the ${year} session are now closed. The last date for submissions was ${deadline}. Candidates can check back for the next admission cycle.`
    }</p>
    
    <h3>Eligibility Criteria</h3>
    <p>To be eligible for admission to the ${programName} program at ${instituteName}, candidates must meet the following requirements:</p>
    <ul>
      <li>${eligibility}</li>
      <li>Applicants must have completed their previous education from a recognized institution</li>
      <li>Minimum percentage or CGPA requirements as specified by the university</li>
      <li>Entry test scores (if applicable) must meet the cutoff criteria</li>
      <li>Any additional requirements specific to the program</li>
    </ul>
    
    <h3>Application Process</h3>
    <p>The application process for ${programName} admissions ${year} at ${instituteName} involves the following steps:</p>
    <ol>
      <li>Visit the official website of ${instituteName}</li>
      <li>Register and create an account on the admissions portal</li>
      <li>Fill out the online application form with accurate personal and academic information</li>
      <li>Upload required documents (educational certificates, CNIC/B-Form, photographs, etc.)</li>
      <li>Pay the application processing fee</li>
      <li>Submit the application before the deadline of ${deadline}</li>
      <li>Download and keep a copy of the submitted application for future reference</li>
    </ol>
    
    <h3>Required Documents</h3>
    <p>Applicants should prepare the following documents before starting the application process:</p>
    <ul>
      <li>Educational certificates and transcripts (Matric, Intermediate, Bachelor's, etc.)</li>
      <li>CNIC or B-Form (for Pakistani citizens)</li>
      <li>Passport-sized photographs</li>
      <li>Entry test score card (if applicable)</li>
      <li>Domicile certificate</li>
      <li>Experience certificates (if required for the program)</li>
      <li>Any other documents specified by the university</li>
    </ul>
    
    <h3>Fee Structure</h3>
    <p>The fee structure for the ${programName} program at ${instituteName} is ${feeRange}. Students are advised to check the official website for a detailed breakdown of tuition fees, admission fees, and other charges. Scholarships and financial aid options may be available for eligible students.</p>
    
    <h3>Important Dates</h3>
    <ul>
      <li><strong>Application Start Date:</strong> ${openDate}</li>
      <li><strong>Application Deadline:</strong> ${deadline}</li>
      <li><strong>Entry Test Date:</strong> Check official website</li>
      <li><strong>Merit List Announcement:</strong> To be announced</li>
      <li><strong>Classes Commencement:</strong> ${session} ${year}</li>
    </ul>
    
    <h3>Career Prospects</h3>
    <p>Graduates of the ${programName} program from ${instituteName} have ${careerScope}. They can pursue careers in both public and private sectors, including government organizations, multinational companies, educational institutions, research organizations, and more. The degree opens doors to various job roles such as specialist, consultant, analyst, manager, and entrepreneur depending on the field of study.</p>
    
    <h3>Why Choose ${instituteName}?</h3>
    <p>${instituteName} is one of the leading educational institutions in ${cityName}, known for its academic excellence, experienced faculty, modern facilities, and strong industry connections. Students benefit from:</p>
    <ul>
      <li>Quality education delivered by qualified and experienced faculty members</li>
      <li>State-of-the-art laboratories and libraries</li>
      <li>Industry partnerships and internship opportunities</li>
      <li>Career counseling and placement services</li>
      <li>Vibrant campus life with extracurricular activities</li>
      <li>Alumni network that supports professional growth</li>
    </ul>
    
    <h3>Contact Information</h3>
    <p>For any queries regarding ${programName} admissions ${year} at ${instituteName}, prospective students can contact:</p>
    <ul>
      <li><strong>Admissions Office:</strong> ${instituteName}, ${cityName}</li>
      <li><strong>Official Website:</strong> <a href="${admission.institute?.website || '#'}">${admission.institute?.website || 'Visit website'}</a></li>
      <li><strong>Email:</strong> admissions@${instituteName.toLowerCase().replace(/\s+/g, '')}.edu.pk</li>
      <li><strong>Phone:</strong> Contact via official website</li>
    </ul>
    
    <p><em>Last updated: ${formatDate(admission.updatedAt || admission.createdAt)}</em></p>
  `;
}

// ==================== GENERATE METADATA ====================
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  const admission = await getAdmissionBySlug(slug);
  
  if (!admission) {
    return {
      title: 'Admission Not Found | NextID.pk',
      description: 'The requested admission information could not be found. Browse other admissions in Pakistan.',
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const title = generateMetaTitle(admission);
  const description = generateMetaDescription(admission);
  const keywords = generateMetaKeywords(admission);
  const ogTitle = generateOgTitle(admission);
  const ogDescription = generateOgDescription(admission);
  const twitterTitle = generateTwitterTitle(admission);
  
  const canonicalUrl = `https://nextid.pk/admissions/${admission.slug}`;
  const imageUrl = '/images/og-admissions.jpg';
  const publishedTime = admission.createdAt?.toISOString();
  const modifiedTime = admission.updatedAt?.toISOString();

  return {
    title,
    description,
    keywords,
    
    alternates: {
      canonical: canonicalUrl,
    },
    
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'article',
      publishedTime,
      modifiedTime,
      authors: ['NextID.pk'],
      tags: [
        'Admissions',
        admission.program?.name || 'Program',
        admission.institute?.name || 'University',
        admission.institute?.city?.name || 'City',
        `Year ${admission.year}`,
        admission.status || 'Status',
      ].filter(Boolean) as string[],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      siteName: 'NextID.pk',
    },
    
    twitter: {
      card: 'summary_large_image',
      title: twitterTitle,
      description: ogDescription,
      images: [imageUrl],
      site: '@nextidpk',
      creator: '@nextidpk',
    },
    
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    verification: {
      google: 'your-google-verification-code',
    },
    
    category: 'education',
    generator: 'NextID.pk',
    applicationName: 'NextID.pk',
    referrer: 'origin-when-cross-origin',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    
    bookmarks: [canonicalUrl],
    manifest: '/manifest.json',
    
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
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

  // Generate structured data
  const faqData = generateFAQStructuredData(admission);
  const breadcrumbData = generateBreadcrumbData(admission);
  const articleContent = generateArticleContent(admission);

  return (
    <>
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "NextID.pk",
          "url": "https://nextid.pk",
          "logo": "https://nextid.pk/logo.png",
          "description": "Pakistan's leading education portal for admissions, results, and educational news."
        }) }}
      />
      
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />

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
                {admission.name || `${admission.program?.name} ${admission.year}`}
              </span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          
          {/* Header with Status */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {admission.name || `${admission.program?.name} Admissions ${admission.year}`}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-gray-600">
                  <Link 
                    href={`/universities/${admission.institute?.slug}`}
                    className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                  >
                    <span>University:</span> {admission.institute?.name}
                  </Link>
                  {admission.institute?.city && (
                    <>
                      <span className="text-gray-400">|</span>
                      <Link 
                        href={`/cities/${admission.institute.city.slug}`}
                        className="hover:text-blue-600 flex items-center gap-1"
                      >
                        <span>City:</span> {admission.institute.city.name}
                      </Link>
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
                    Session: {admission.session}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info Grid - Without emojis */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Opening Date</div>
              <div className="font-semibold">
                {admission.expectedOpenDate ? formatDate(admission.expectedOpenDate) : 'To Be Announced'}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Closing Date</div>
              <div className="font-semibold">
                {admission.expectedCloseDate ? formatDate(admission.expectedCloseDate) : 'To Be Announced'}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Program Duration</div>
              <div className="font-semibold">{admission.program?.duration || 'Information Not Available'}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Fee Range</div>
              <div className="font-semibold">{admission.program?.feeRange || 'Contact University'}</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Main Content (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Program Overview */}
              {admission.program?.overview && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Program Overview</h2>
                  <div className="text-gray-700 leading-relaxed">
                    {admission.program.overview}
                  </div>
                </div>
              )}

              {/* Eligibility Criteria */}
              {admission.program?.eligibility && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Eligibility Criteria</h2>
                  <div className="text-gray-700 leading-relaxed">
                    {admission.program.eligibility}
                  </div>
                </div>
              )}

              {/* Merit Information */}
              {admission.meritInfo && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Merit Information</h2>
                  <div className="text-gray-700 leading-relaxed">
                    {admission.meritInfo}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {admission.note && (
                <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                  <h2 className="text-xl font-bold text-yellow-800 mb-4">Important Notes</h2>
                  <div className="text-yellow-700 leading-relaxed">
                    {admission.note}
                  </div>
                </div>
              )}

              {/* SEO Article Content */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div 
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: articleContent }}
                />
              </div>
            </div>

            {/* Right Column - Sidebar (1/3 width) */}
            <div className="space-y-6">
              
              {/* Apply Now Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-3">Ready to Apply?</h3>
                <p className="text-blue-100 text-sm mb-4">
                  {admission.status === 'Open' 
                    ? 'Don\'t miss this opportunity. Apply now before the deadline.' 
                    : admission.status === 'Expected'
                      ? 'Applications will open soon. Stay tuned for updates.'
                      : 'This admission is now closed. Check other open admissions.'}
                </p>
                {admission.officialLink ? (
                  <a
                    href={admission.officialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-white text-blue-600 text-center py-3 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105"
                  >
                    {admission.status === 'Open' ? 'Apply Online' : 'Visit Website'}
                  </a>
                ) : (
                  <button
                    disabled
                    className="block w-full bg-gray-300 text-gray-600 text-center py-3 rounded-lg font-semibold cursor-not-allowed"
                  >
                    {admission.status === 'Open' ? 'Application Link Coming Soon' : 'No Application Link Available'}
                  </button>
                )}
                <p className="text-xs text-blue-200 mt-3 text-center">
                  Official website will open in new tab
                </p>
              </div>

              {/* Institute Info */}
              {admission.institute && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">About the Institute</h3>
                  <Link 
                    href={`/universities/${admission.institute.slug}`}
                    className="text-xl font-semibold text-blue-600 hover:underline block mb-2"
                  >
                    {admission.institute.name}
                  </Link>
                  {admission.institute.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {admission.institute.description}
                    </p>
                  )}
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Institution Type:</span> {admission.institute.type}
                    </div>
                    {admission.institute.website && (
                      <a
                        href={admission.institute.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Visit Official Website
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Related Admissions */}
              {relatedAdmissions.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Related Admissions</h3>
                  <div className="space-y-3">
                    {relatedAdmissions.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/admissions/${rel.slug}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition group"
                      >
                        <div className="font-medium text-gray-800 group-hover:text-orange-600">
                          {rel.instituteName}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>Year: {rel.year}</span>
                          {rel.session && (
                            <>
                              <span>|</span>
                              <span>Session: {rel.session}</span>
                            </>
                          )}
                          {rel.status === 'Open' && (
                            <>
                              <span>|</span>
                              <span className="text-green-600 font-medium">Open</span>
                            </>
                          )}
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
            Last updated: {admission.updatedAt ? formatDate(admission.updatedAt) : formatDate(admission.createdAt)}
          </div>
        </div>
      </main>
    </>
  );
}