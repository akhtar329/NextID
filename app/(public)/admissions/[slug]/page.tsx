// app/(public)/admissions/[slug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { admissions, admissionOfferings, programOfferings, programs, institutes, cities, seoMetadata } from '@/app/lib/schema';
import { eq, and, ne, desc } from 'drizzle-orm';

export const revalidate = 86400;
export const dynamic = 'force-static';
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const allAdmissions = await db
      .select({ slug: admissions.slug })
      .from(admissions)
      .where(eq(admissions.status, 'Open'))
      .limit(200);
    
    return allAdmissions.map((item) => ({
      slug: item.slug,
    }));
  } catch {
    return [];
  }
}

interface ProgramWithDetails {
  id: number;
  name: string;
  slug: string;
  duration: string | null;
  feeRange: string | null;
  specificEligibility: string | null;
  degreeName?: string | null;
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

interface RelatedAdmission {
  id: number;
  name: string | null;
  slug: string | null;
  year: number | null;
  session: string | null;
  status: string | null;
  instituteName: string | null;
  instituteSlug: string | null;
}

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

async function getAdmissionBySlug(slug: string): Promise<AdmissionWithPrograms | null> {
  try {
    const result = await db
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
        instituteId_field: institutes.id,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        instituteType: institutes.type,
        instituteDescription: institutes.description,
        instituteWebsite: institutes.website,
        instituteLogo: institutes.logo,
        instituteFeaturedImage: institutes.featuredImage,
        instituteCityId: institutes.cityId,
        cityId_field: cities.id,
        cityName: cities.name,
        citySlug: cities.slug,
        cityProvince: cities.province,
        programId: programs.id,
        programName: programs.name,
        programSlug: programs.slug,
        programDuration: programOfferings.duration,
        programFeeRange: programOfferings.feeRange,
        programEligibility: programOfferings.specificEligibility,
      })
      .from(admissions)
      .leftJoin(institutes, eq(admissions.instituteId, institutes.id))
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .leftJoin(admissionOfferings, eq(admissions.id, admissionOfferings.admissionId))
      .leftJoin(programOfferings, eq(admissionOfferings.offeringId, programOfferings.id))
      .leftJoin(programs, eq(programOfferings.programId, programs.id))
      .where(eq(admissions.slug, slug));

    if (result.length === 0) return null;

    const firstRow = result[0];
    let institute: InstituteType | null = null;
    
    if (firstRow.instituteId_field) {
      let city: CityType | null = null;
      if (firstRow.cityId_field) {
        city = {
          id: firstRow.cityId_field,
          name: firstRow.cityName || '',
          slug: firstRow.citySlug || '',
          province: firstRow.cityProvince,
        };
      }
      
      institute = {
        id: firstRow.instituteId_field,
        name: firstRow.instituteName || '',
        slug: firstRow.instituteSlug || '',
        type: firstRow.instituteType,
        description: firstRow.instituteDescription,
        website: firstRow.instituteWebsite,
        logo: firstRow.instituteLogo,
        featuredImage: firstRow.instituteFeaturedImage,
        city,
      };
    }

    const programsMap = new Map<number, ProgramWithDetails>();
    
    for (const row of result) {
      if (row.programId && !programsMap.has(row.programId)) {
        programsMap.set(row.programId, {
          id: row.programId,
          name: row.programName || '',
          slug: row.programSlug || '',
          duration: row.programDuration,
          feeRange: row.programFeeRange,
          specificEligibility: row.programEligibility,
        });
      }
    }

    const programsList = Array.from(programsMap.values());
    let galleryImagesValue: string | null | undefined = firstRow.galleryImages as string | null | undefined;
    if (galleryImagesValue === null) galleryImagesValue = undefined;

    return {
      id: firstRow.id,
      name: firstRow.name,
      slug: firstRow.slug,
      year: firstRow.year,
      session: firstRow.session,
      status: firstRow.status as 'Expected' | 'Open' | 'Closed',
      expectedOpenDate: firstRow.expectedOpenDate,
      expectedCloseDate: firstRow.expectedCloseDate,
      meritInfo: firstRow.meritInfo,
      note: firstRow.note,
      officialLink: firstRow.officialLink,
      institute,
      programs: programsList,
      programCount: programsList.length,
      createdAt: firstRow.createdAt,
      updatedAt: firstRow.updatedAt,
      featuredImage: firstRow.featuredImage,
      galleryImages: galleryImagesValue,
    };
  } catch {
    return null;
  }
}

async function getRelatedAdmissions(admission: AdmissionWithPrograms): Promise<RelatedAdmission[]> {
  if (!admission.institute?.id) return [];
  
  try {
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
      .where(and(
        eq(admissions.instituteId, admission.institute.id),
        ne(admissions.slug, admission.slug)
      ))
      .orderBy(desc(admissions.createdAt))
      .limit(5);
  } catch {
    return [];
  }
}

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
  } catch {
    return null;
  }
}

function getStatusBadge(status: string) {
  const badges = {
    'Open': { bg: 'bg-green-100', text: 'text-green-700', label: 'Applications Open', icon: '🟢' },
    'Closed': { bg: 'bg-red-100', text: 'text-red-700', label: 'Applications Closed', icon: '🔴' },
    'Expected': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Opening Soon', icon: '🟡' },
  };
  return badges[status as keyof typeof badges] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status, icon: '📌' };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const admission = await getAdmissionBySlug(slug);
  
  if (!admission) {
    return { title: 'Admission Not Found', robots: { index: false } };
  }

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

async function getPageData(slug: string) {
  const admission = await getAdmissionBySlug(slug);
  if (!admission) return { admission: null, relatedAdmissions: [] };
  
  const relatedAdmissions = await getRelatedAdmissions(admission);
  return { admission, relatedAdmissions };
}

export default async function AdmissionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  let pageData;
  
  try {
    const { slug } = await params;
    pageData = await getPageData(slug);
    
    if (!pageData.admission) {
      notFound();
    }
  } catch {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4" aria-hidden="true">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to load admission details</h2>
            <p className="text-gray-600">Please try again later</p>
            <Link
              href="/admissions"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View All Admissions
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { admission, relatedAdmissions } = pageData;
  const statusBadge = getStatusBadge(admission.status);
  const daysRemaining = getDaysRemaining(admission.expectedCloseDate);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <div className="text-sm text-blue-200 mb-4">
              <Link href="/" className="hover:text-white">Home</Link>
              {' / '}
              <Link href="/admissions" className="hover:text-white">Admissions</Link>
              {' / '}
              <span className="text-white">{admission.institute?.name}</span>
            </div>
            
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
          
          <div className="flex-1">
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

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Available Programs 
                {admission.programCount > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({admission.programCount} {admission.programCount === 1 ? 'Program' : 'Programs'})
                  </span>
                )}
              </h2>
              
              {admission.programs.length > 0 ? (
                <div className="space-y-4">
                  {admission.programs.map((program, index) => (
                    <div key={program.id || index} className="border-b border-gray-100 pb-4 last:border-0">
                      <Link href={`/programs/${program.slug}`}>
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                          {program.name}
                        </h3>
                      </Link>
                      {program.duration && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Duration:</span> {program.duration}
                        </p>
                      )}
                      {program.feeRange && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Fee Range:</span> {program.feeRange}
                        </p>
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
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <div className="text-4xl mb-3">📚</div>
                  <p className="text-gray-600">Program details will be updated soon.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    For more information, please visit the official website.
                  </p>
                </div>
              )}
            </div>

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

          <aside className="lg:w-80">
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