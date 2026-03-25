// app/(public)/admissions/[slug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { admissions, admissionPrograms, programs, institutes, cities, degrees } from '@/app/lib/schema';
import { eq, and, ne, desc } from 'drizzle-orm';
import AdmissionClient from './AdmissionClient';

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
  featuredImage?: string | null;
  logo?: string | null;
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
  featuredImage?: string | null;
  galleryImages?: string | null; // JSON string of image URLs
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

function formatShortDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', { 
    day: 'numeric', 
    month: 'short', 
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

function getDaysRemaining(date: Date | null): number | null {
  if (!date) return null;
  const today = new Date();
  const target = new Date(date);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ==================== GET ADMISSION BY SLUG ====================
async function getAdmissionBySlug(slug: string): Promise<AdmissionWithPrograms | null> {
  try {

    
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
        featuredImage: admissions.featuredImage,
        galleryImages: admissions.galleryImages,
      })
      .from(admissions)
      .where(eq(admissions.slug, slug))
      .limit(1);
    
    if (admissionResult.length === 0) {

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
          featuredImage: institutes.featuredImage,
        })
        .from(institutes)
        .where(eq(institutes.id, admission.instituteId))
        .limit(1);
      
      if (instituteResult[0]) {
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

    // Get ALL programs for this admission
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
          id: p.id,
          name: p.name,
          slug: p.slug,
          degreeName,
          overview: p.overview,
          eligibility: p.eligibility,
          duration: p.duration,
          careerScope: p.careerScope,
          feeRange: p.feeRange,
        };
      })
    );

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
    if (!admission.institute?.id) return [];
    
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
          ne(admissions.slug, admission.slug)
        )
      )
      .orderBy(desc(admissions.createdAt))
      .limit(5);
    
    return related;
  } catch (error) {
    console.error('Error fetching related admissions:', error);
    return [];
  }
}

// ==================== GET ADMISSIONS IN SAME CITY ====================
async function getCityAdmissions(admission: AdmissionWithPrograms) {
  try {
    if (!admission.institute?.city?.id) return [];
    
    const cityAdmissions = await db
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
          eq(institutes.cityId, admission.institute.city.id),
          ne(admissions.slug, admission.slug),
          eq(admissions.status, 'Open')
        )
      )
      .orderBy(desc(admissions.createdAt))
      .limit(5);
    
    return cityAdmissions;
  } catch (error) {
    console.error('Error fetching city admissions:', error);
    return [];
  }
}

// ==================== STATUS BADGE ====================
function getStatusBadge(status: string) {
  const badges = {
    'Open': { bg: 'bg-green-100', text: 'text-green-700', label: '✅ Applications Open', icon: '🟢' },
    'Closed': { bg: 'bg-red-100', text: 'text-red-700', label: '❌ Applications Closed', icon: '🔴' },
    'Expected': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏰ Opening Soon', icon: '🟡' },
  };
  return badges[status as keyof typeof badges] || { 
    bg: 'bg-gray-100', 
    text: 'text-gray-700', 
    label: status,
    icon: '📌'
  };
}

// ==================== SEO FUNCTIONS ====================
function generateMetaTitle(admission: AdmissionWithPrograms): string {
  const instituteName = admission.institute?.name || 'University';
  const year = admission.year || '2026';
  const cityName = admission.institute?.city?.name || 'Pakistan';
  const status = admission.status?.toLowerCase() || 'open';
  
  let title = '';
  if (status === 'open') {
    title = `Admissions Open ${year} at ${instituteName}, ${cityName} | NextID.pk`;
  } else if (status === 'expected') {
    title = `Admissions Expected ${year} at ${instituteName}, ${cityName} | NextID.pk`;
  } else {
    title = `Admissions Closed ${year} at ${instituteName}, ${cityName} | NextID.pk`;
  }
  
  if (title.length > 60) {
    title = title.substring(0, 57) + '...';
  }
  return title;
}

function generateMetaDescription(admission: AdmissionWithPrograms): string {
  const instituteName = admission.institute?.name || 'university';
  const cityName = admission.institute?.city?.name || 'Pakistan';
  const year = admission.year || '2026';
  const status = admission.status?.toLowerCase() || 'open';
  const deadline = admission.expectedCloseDate ? formatSeoDate(admission.expectedCloseDate) : 'TBA';
  const programCount = admission.programs.length;
  const programNames = admission.programs.slice(0, 3).map(p => p.name).join(', ');
  
  let description = `${instituteName} in ${cityName} has announced admissions for ${year}. `;
  
  if (programCount > 0) {
    description += `Offering ${programCount} programs including ${programNames}. `;
  }
  
  if (status === 'open') {
    description += `Last date to apply: ${deadline}. `;
  } else if (status === 'expected') {
    description += `Expected to open on ${admission.expectedOpenDate ? formatSeoDate(admission.expectedOpenDate) : 'soon'}. `;
  }
  
  description += `Check eligibility criteria, merit information, and apply online at NextID.pk.`;
  
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }
  return description;
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

  const canonicalUrl = `https://www.nextid.pk/admissions/${admission.slug}`;
  
  // Use featured image if available
  const ogImage = admission.featuredImage || '/images/og-admissions.jpg';

  return {
    title: generateMetaTitle(admission),
    description: generateMetaDescription(admission),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: generateMetaTitle(admission),
      description: generateMetaDescription(admission),
      url: canonicalUrl,
      type: 'article',
      publishedTime: admission.createdAt?.toISOString(),
      modifiedTime: admission.updatedAt?.toISOString(),
      siteName: 'NextID.pk',
      locale: 'en_PK',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${admission.institute?.name} Admissions ${admission.year}`,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: generateMetaTitle(admission),
      description: generateMetaDescription(admission),
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': 160,
      },
    },
  };
}

// ==================== MAIN PAGE (Server Component) ====================
export default async function AdmissionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const admission = await getAdmissionBySlug(slug);
  
  if (!admission) {
    notFound();
  }

  const relatedAdmissions = await getRelatedAdmissions(admission);
  const cityAdmissions = await getCityAdmissions(admission);
  const statusBadge = getStatusBadge(admission.status);
  const daysRemaining = getDaysRemaining(admission.expectedCloseDate);
  
  // Get ALL programs
  const allPrograms = admission.programs;
  
  // Group programs by degree level
  const undergradPrograms = admission.programs.filter(p => 
    p.degreeName?.toLowerCase().includes('bachelor') || 
    p.degreeName?.toLowerCase().includes('bs') ||
    p.degreeName?.toLowerCase().includes('bsc')
  );
  
  const gradPrograms = admission.programs.filter(p => 
    p.degreeName?.toLowerCase().includes('master') || 
    p.degreeName?.toLowerCase().includes('ms') ||
    p.degreeName?.toLowerCase().includes('m.phil') ||
    p.degreeName?.toLowerCase().includes('phd')
  );
  
  const diplomaPrograms = admission.programs.filter(p => 
    p.degreeName?.toLowerCase().includes('diploma') || 
    p.degreeName?.toLowerCase().includes('certificate')
  );

  // Parse gallery images
  let galleryImagesArray: string[] = [];
  if (admission.galleryImages) {
    try {
      galleryImagesArray = JSON.parse(admission.galleryImages);
    } catch (e) {
      console.error('Error parsing gallery images:', e);
    }
  }

  // Convert dates to ISO strings for serialization
  const serializedAdmission = {
    ...admission,
    expectedOpenDate: admission.expectedOpenDate?.toISOString() || null,
    expectedCloseDate: admission.expectedCloseDate?.toISOString() || null,
    createdAt: admission.createdAt?.toISOString() || null,
    updatedAt: admission.updatedAt?.toISOString() || null,
    featuredImage: admission.featuredImage || null,
    galleryImages: galleryImagesArray,
  };

  // Prepare data for client component
  const admissionData = {
    admission: serializedAdmission,
    relatedAdmissions: relatedAdmissions || [],
    cityAdmissions: cityAdmissions || [],
    statusBadge,
    daysRemaining,
    undergradPrograms: undergradPrograms,
    gradPrograms: gradPrograms,
    diplomaPrograms: diplomaPrograms,
    formattedPostedDate: formatShortDate(admission.createdAt) || '—',
    formattedLastDate: formatShortDate(admission.expectedCloseDate) || 'TBA',
    formattedDeadline: formatDate(admission.expectedCloseDate) || 'TBA',
    formattedOpenDate: formatDate(admission.expectedOpenDate) || 'TBA',
    formattedLastUpdated: formatDate(admission.updatedAt || admission.createdAt),
  };

  return <AdmissionClient data={admissionData} />;
}