// app/(public)/programs/[slug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { 
  programs, 
  categories, 
  institutes, 
  admissions,
  admissionOfferings,
  programOfferings, 
  cities,
} from '@/app/lib/schema';
import { eq, and, desc, count, inArray } from 'drizzle-orm';
import { db } from '@/app/lib/db';
import { generateSEO } from '@/app/lib/seo';

export const revalidate = 86400;
export const dynamic = 'force-static';
// remove dynamicparams= true

function formatShortDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface ProgramDetail {
  id: number;
  name: string;
  slug: string;
  detailedOverview: string | null;
  commonEligibility: string | null;
  typicalDuration: string | null;
  careerOutlook: string | null;
  typicalFeeRange: string | null;
  categoryName: string | null;
  featuredImage?: string | null;
}

interface InstituteItem {
  id: number;
  name: string;
  slug: string;
  type: string;
  logo: string | null;
  cityName: string | null;
  citySlug: string | null;
  admissionsCount: number;
  isFeatured: boolean | null;
}

interface AdmissionItem {
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

async function getProgramBySlug(slug: string): Promise<ProgramDetail | null> {
  try {
    const [program] = await db
      .select({
        id: programs.id,
        name: programs.name,
        slug: programs.slug,
        detailedOverview: programs.detailedOverview,
        commonEligibility: programs.commonEligibility,
        typicalDuration: programs.typicalDuration,
        careerOutlook: programs.careerOutlook,
        typicalFeeRange: programs.typicalFeeRange,
        categoryName: categories.name,
        featuredImage: programs.featuredImage,
      })
      .from(programs)
      .leftJoin(categories, eq(programs.categoryId, categories.id))
      .where(eq(programs.slug, slug))
      .limit(1);

    return program || null;
  } catch {
    return null;
  }
}

async function getInstitutesWithStats(programId: number): Promise<InstituteItem[]> {
  try {
    const offerings = await db
      .select({
        id: programOfferings.id,
        instituteId: programOfferings.instituteId,
      })
      .from(programOfferings)
      .where(eq(programOfferings.programId, programId));

    const instituteIds = [...new Set(offerings.map(o => o.instituteId))];
    
    if (instituteIds.length === 0) return [];

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
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .where(and(eq(institutes.status, true), inArray(institutes.id, instituteIds)))
      .orderBy(desc(institutes.isFeatured), institutes.name);

    const offeringMap = new Map(offerings.map(o => [o.instituteId, o.id]));

    const offeringIds = offerings.map(o => o.id);
    let admissionsMap = new Map<number, number>();
    
    if (offeringIds.length > 0) {
      const admissionsCounts = await db
        .select({
          offeringId: admissionOfferings.offeringId,
          count: count(),
        })
        .from(admissionOfferings)
        .where(inArray(admissionOfferings.offeringId, offeringIds))
        .groupBy(admissionOfferings.offeringId);
      
      admissionsMap = new Map(admissionsCounts.map(a => [a.offeringId, Number(a.count)]));
    }

    return institutesList.map((inst) => {
      const offeringId = offeringMap.get(inst.id);
      const admissionsCount = offeringId ? admissionsMap.get(offeringId) || 0 : 0;

      return {
        ...inst,
        admissionsCount,
      };
    }).filter(inst => inst.admissionsCount > 0);
  } catch {
    return [];
  }
}

async function getAdmissions(programId: number, limit = 6): Promise<AdmissionItem[]> {
  try {
    const offerings = await db
      .select({ id: programOfferings.id })
      .from(programOfferings)
      .where(eq(programOfferings.programId, programId));

    const offeringIds = offerings.map(o => o.id);
    
    if (offeringIds.length === 0) return [];

    const result = await db
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
      .innerJoin(admissionOfferings, eq(admissions.id, admissionOfferings.admissionId))
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .where(
        and(
          inArray(admissionOfferings.offeringId, offeringIds),
          eq(admissions.status, 'Open')
        )
      )
      .orderBy(admissions.expectedCloseDate)
      .limit(limit);

    return result as AdmissionItem[];
  } catch {
    return [];
  }
}

async function getStats(programId: number) {
  try {
    const offerings = await db
      .select({ id: programOfferings.id, instituteId: programOfferings.instituteId })
      .from(programOfferings)
      .where(eq(programOfferings.programId, programId));

    const instituteIds = [...new Set(offerings.map(o => o.instituteId))];
    const institutesCount = instituteIds.length;

    let admissionsCount = 0;
    if (offerings.length > 0) {
      const offeringIds = offerings.map(o => o.id);
      const [admissionsResult] = await db
        .select({ count: count() })
        .from(admissionOfferings)
        .where(inArray(admissionOfferings.offeringId, offeringIds));
      admissionsCount = Number(admissionsResult?.count) || 0;
    }

    return {
      institutes: institutesCount,
      admissions: admissionsCount,
      results: 0,
    };
  } catch {
    return { institutes: 0, admissions: 0, results: 0 };
  }
}

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

function formatDescription(text: string | null): React.ReactNode {
  if (!text) return null;
  return text.split('\n\n').map((paragraph, idx) => (
    <p key={idx} className="text-gray-600 leading-relaxed mb-4 last:mb-0">
      {paragraph}
    </p>
  ));
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  const [institutes, admissionsList, stats] = await Promise.all([
    getInstitutesWithStats(program.id),
    getAdmissions(program.id, 6),
    getStats(program.id),
  ]);

  const hasAnyData = institutes.length > 0 || admissionsList.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      
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

      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 text-sm text-blue-200 mb-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                Program
              </span>
              <span>•</span>
              <span>{program.categoryName || 'Category'}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {program.name}
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 max-w-3xl leading-relaxed">
              {program.detailedOverview?.substring(0, 200) || `Complete guide to ${program.name} programs in Pakistan.`}
            </p>

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

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-24 space-y-6">
              
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
                  {program.typicalDuration && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Duration</span>
                      <span className="text-sm font-medium text-gray-900">{program.typicalDuration}</span>
                    </div>
                  )}
                  {program.typicalFeeRange && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Fee Range</span>
                      <span className="text-sm font-medium text-gray-900">{program.typicalFeeRange}</span>
                    </div>
                  )}
                  {program.categoryName && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Category</span>
                      <span className="text-sm font-medium text-gray-900">{program.categoryName}</span>
                    </div>
                  )}
                </div>
              </div>

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
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 order-1 lg:order-2 space-y-8">
            
            {program.commonEligibility && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>📋</span> Eligibility Criteria
                  </h2>
                </div>
                <div className="p-6">
                  <div className="prose prose-blue max-w-none">
                    {formatDescription(program.commonEligibility)}
                  </div>
                </div>
              </div>
            )}

            {program.careerOutlook && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>🚀</span> Career Scope
                  </h2>
                </div>
                <div className="p-6">
                  <div className="prose prose-green max-w-none">
                    {formatDescription(program.careerOutlook)}
                  </div>
                </div>
              </div>
            )}
            
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
                          <Image
                            src={inst.logo}
                            alt={inst.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-contain rounded-lg"
                          />
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
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

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
                            <Image
                              src={adm.instituteLogo}
                              alt={adm.instituteName}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-contain rounded-lg"
                            />
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

            {program.detailedOverview && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span>📖</span> About {program.name}
                  </h2>
                </div>
                <div className="p-6">
                  <div className="prose prose-gray max-w-none">
                    {formatDescription(program.detailedOverview)}
                  </div>
                </div>
              </div>
            )}

            {!hasAnyData && (
              <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Information Coming Soon</h3>
                <p className="text-gray-500">We&apos;re currently gathering information for {program.name}. Please check back later.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}