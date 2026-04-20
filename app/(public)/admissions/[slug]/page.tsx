// app/(public)/admissions/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image'; // ✅ Added for optimized images
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { admissions, admissionOfferings, programOfferings, programs, institutes, cities, seoMetadata } from '@/app/lib/schema';
import { eq, and, ne, desc } from 'drizzle-orm';

// ==================== TYPES ====================
interface ProgramWithDetails {
  id: number;
  name: string;
  slug: string;
  duration: string | null;
  feeRange: string | null;
  specificEligibility: string | null;
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
  galleryImages?: string | null;
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

function getDaysRemaining(date: Date | null): number | null {
  if (!date) return null;
  const today = new Date();
  const target = new Date(date);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : null;
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
    
    if (admissionResult.length === 0) return null;
    
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
          logo: institutes.logo,
          featuredImage: institutes.featuredImage,
          cityId: institutes.cityId,
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
          id: instituteResult[0].id,
          name: instituteResult[0].name,
          slug: instituteResult[0].slug,
          type: instituteResult[0].type,
          description: instituteResult[0].description,
          website: instituteResult[0].website,
          logo: instituteResult[0].logo,
          featuredImage: instituteResult[0].featuredImage,
          city,
        };
      }
    }

    // Fetch programs using admissionOfferings + programOfferings
    const programsResult = await db
      .select({
        id: programs.id,
        name: programs.name,
        slug: programs.slug,
        duration: programOfferings.duration,
        feeRange: programOfferings.feeRange,
        specificEligibility: programOfferings.specificEligibility,
      })
      .from(admissionOfferings)
      .innerJoin(programOfferings, eq(admissionOfferings.offeringId, programOfferings.id))
      .innerJoin(programs, eq(programOfferings.programId, programs.id))
      .where(eq(admissionOfferings.admissionId, admission.id));

    const programsWithDetails: ProgramWithDetails[] = programsResult.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      duration: p.duration,
      feeRange: p.feeRange,
      specificEligibility: p.specificEligibility,
    }));

    return {
      ...admission,
      status: admission.status as 'Expected' | 'Open' | 'Closed',
      institute,
      programs: programsWithDetails,
      programCount: programsWithDetails.length,
      galleryImages: admission.galleryImages as string | null | undefined,
    };

  } catch (error) {
    console.error('Error fetching admission:', error);
    return null;
  }
}

// ==================== GET RELATED ADMISSIONS ====================
async function getRelatedAdmissions(admission: AdmissionWithPrograms) {
  try {
    if (!admission.institute?.id) return [];
    return await db
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
      .where(and(eq(admissions.instituteId, admission.institute.id), ne(admissions.slug, admission.slug)))
      .orderBy(desc(admissions.createdAt))
      .limit(5);
  } catch {
    return [];
  }
}

// ==================== GET SEO METADATA FROM DATABASE ====================
async function getSEOMetadata(admissionId: number) {
  try {
    const result = await db
      .select({
        metaTitle: seoMetadata.metaTitle,
        metaDescription: seoMetadata.metaDescription,
        canonicalUrl: seoMetadata.canonicalUrl,
        ogTitle: seoMetadata.ogTitle,
        ogDescription: seoMetadata.ogDescription,
        ogImage: seoMetadata.ogImage,
      })
      .from(seoMetadata)
      .where(and(
        eq(seoMetadata.entityType, 'admission'),
        eq(seoMetadata.entityId, admissionId)
      ))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching SEO metadata:', error);
    return null;
  }
}

// ==================== STATUS BADGE ====================
function getStatusBadge(status: string) {
  const badges = {
    'Open': { bg: 'bg-green-100', text: 'text-green-700', label: 'Applications Open', icon: '🟢' },
    'Closed': { bg: 'bg-red-100', text: 'text-red-700', label: 'Applications Closed', icon: '🔴' },
    'Expected': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Opening Soon', icon: '🟡' },
  };
  return badges[status as keyof typeof badges] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status, icon: '📌' };
}

// ==================== METADATA (from database seo_metadata table) ====================
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  // First get admission to get ID for SEO metadata
  const admission = await getAdmissionBySlug(slug);
  
  if (!admission) {
    return { title: 'Admission Not Found', robots: { index: false } };
  }

  // Try to get SEO metadata from database using admission ID
  const seoData = await getSEOMetadata(admission.id);
  
  if (seoData?.metaTitle && seoData?.metaDescription) {
    return {
      title: seoData.metaTitle,
      description: seoData.metaDescription,
      alternates: seoData.canonicalUrl ? { canonical: seoData.canonicalUrl } : undefined,
      openGraph: {
        title: seoData.ogTitle || seoData.metaTitle,
        description: seoData.ogDescription || seoData.metaDescription,
        images: seoData.ogImage ? [{ url: seoData.ogImage }] : undefined,
        type: 'article',
      },
    };
  }
  
  // Fallback: dynamic metadata
  const instituteName = admission.institute?.name || 'University';
  const year = admission.year || '2026';
  
  return {
    title: `${admission.name || `${instituteName} Admissions ${year}`} | NextID.pk`,
    description: `${instituteName} admissions ${year}. ${admission.programCount} programs offered. Last date: ${formatDate(admission.expectedCloseDate) || 'TBA'}. Apply online at NextID.pk`,
    alternates: { canonical: `https://www.nextid.pk/admissions/${admission.slug}` },
    openGraph: {
      title: `${instituteName} Admissions ${year}`,
      description: `Apply for ${admission.programs.slice(0, 3).map(p => p.name).join(', ')} at ${instituteName}`,
      url: `https://www.nextid.pk/admissions/${admission.slug}`,
      type: 'article',
    },
  };
}

// ==================== MAIN PAGE ====================
export default async function AdmissionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admission = await getAdmissionBySlug(slug);
  
  if (!admission) notFound();

  const relatedAdmissions = await getRelatedAdmissions(admission);
  const statusBadge = getStatusBadge(admission.status);
  const daysRemaining = getDaysRemaining(admission.expectedCloseDate);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            {/* Breadcrumbs */}
            <div className="text-sm text-blue-200 mb-4">
              <Link href="/" className="hover:text-white">Home</Link>
              {' / '}
              <Link href="/admissions" className="hover:text-white">Admissions</Link>
              {' / '}
              <span className="text-white">{admission.institute?.name}</span>
            </div>
            
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${statusBadge.bg} ${statusBadge.text}`}>
              <span>{statusBadge.icon}</span>
              <span>{statusBadge.label}</span>
              {daysRemaining && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                  {daysRemaining} days left
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {admission.name || `${admission.institute?.name} Admissions ${admission.year}`}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-blue-200">
              {admission.institute?.city && (
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <Link href={`/cities/${admission.institute.city.slug}`} className="hover:text-white">
                    {admission.institute.city.name}
                  </Link>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span>📅</span>
                <span>Session: {admission.session || `Fall ${admission.year}`}</span>
              </div>
              {admission.expectedCloseDate && (
                <div className="flex items-center gap-1">
                  <span>⏰</span>
                  <span>Last Date: {formatDate(admission.expectedCloseDate)}</span>
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
            {/* Institute Info Card */}
            {admission.institute && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
                <div className="flex items-start gap-4">
                  {admission.institute.logo && (
                    <Image
                      src={admission.institute.logo}
                      alt={admission.institute.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-contain rounded-lg"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{admission.institute.name}</h2>
                    <p className="text-gray-600">{admission.institute.description}</p>
                    {admission.institute.website && (
                      <a href={admission.institute.website} target="_blank" rel="noopener noreferrer" 
                         className="inline-block mt-3 text-blue-600 hover:underline">
                        Visit Official Website →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Programs Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Programs</h2>
              <div className="space-y-4">
                {admission.programs.map((program) => (
                  <div key={program.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <Link href={`/programs/${program.slug}`}>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                        {program.name}
                      </h3>
                    </Link>
                    {program.duration && (
                      <p className="text-sm text-gray-600 mt-1">Duration: {program.duration}</p>
                    )}
                    {program.feeRange && (
                      <p className="text-sm text-gray-600">Fee Range: {program.feeRange}</p>
                    )}
                    {program.specificEligibility && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Eligibility:</p>
                        <p className="text-sm text-gray-600">{program.specificEligibility}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Important Information */}
            {(admission.meritInfo || admission.note || admission.officialLink) && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Important Information</h2>
                {admission.meritInfo && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800">Merit Information</h3>
                    <p className="text-gray-600">{admission.meritInfo}</p>
                  </div>
                )}
                {admission.note && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800">Additional Notes</h3>
                    <p className="text-gray-600">{admission.note}</p>
                  </div>
                )}
                {admission.officialLink && (
                  <a href={admission.officialLink} target="_blank" rel="noopener noreferrer"
                     className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Apply Online →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80">
            {/* Related Admissions */}
            {relatedAdmissions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-3">Related Admissions</h3>
                <div className="space-y-3">
                  {relatedAdmissions.map((rel) => (
                    <Link key={rel.id} href={`/admissions/${rel.slug}`} className="block p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition">
                      <p className="font-medium text-gray-800 text-sm">{rel.name || rel.instituteName}</p>
                      <p className="text-xs text-gray-500">{rel.year} • {rel.session || 'Fall'}</p>
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
            "@type": "EducationalOrganization",
            "name": admission.institute?.name,
            "url": `https://www.nextid.pk/admissions/${admission.slug}`,
            "description": `${admission.institute?.name} admissions ${admission.year}`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": admission.institute?.city?.name,
              "addressCountry": "PK"
            }
          })
        }}
      />
    </main>
  );
}