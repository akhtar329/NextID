// app/(public)/admissions/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { admissions, admissionPrograms, programs, institutes, degrees, cities, seoMetadata } from '@/app/lib/schema';
import { eq, desc, like, and, or, sql } from 'drizzle-orm';
import { generateSEO } from '@/app/lib/seo';

// ==================== TYPES ====================
type LevelType = 'matric' | 'inter' | 'ba' | 'bs' | 'bba' | 'mba' | 'ms' | 'medical' | 'engineering' | 'law';

type AdmissionWithDetails = {
  id: number;
  name: string;
  slug: string;
  year: number;
  session: string | null;
  status: string;
  expectedCloseDate: Date | null;
  instituteId: number;
  instituteName: string;
  instituteSlug: string;
  instituteType: string | null;
  instituteLogo: string | null;
  cityId: number;
  cityName: string;
  citySlug: string;
  programs: {
    id: number;
    name: string;
    slug: string;
    degreeName: string | null;
  }[];
};

// ==================== CONSTANTS ====================
const PROGRAM_TYPES: { slug: LevelType | ''; name: string; icon: string; description: string }[] = [
  { slug: '', name: 'All Programs', icon: '📋', description: 'All admission programs in Pakistan' },
  { slug: 'matric', name: 'Matric / O-Level', icon: '📚', description: 'Matric and O-Level admissions 2026' },
  { slug: 'inter', name: 'Intermediate / A-Level', icon: '📖', description: 'Intermediate and A-Level admissions 2026' },
  { slug: 'ba', name: 'Bachelor (BA/BSc)', icon: '🎓', description: 'Bachelor degree admissions 2026' },
  { slug: 'bs', name: 'BS Programs (4-Year)', icon: '🎓', description: 'BS 4-year programs admissions 2026' },
  { slug: 'bba', name: 'BBA', icon: '📊', description: 'BBA admissions 2026 in Pakistan' },
  { slug: 'mba', name: 'MBA', icon: '💼', description: 'MBA admissions 2026 in Pakistan' },
  { slug: 'ms', name: 'MS/MPhil', icon: '🔬', description: 'MS and MPhil admissions 2026' },
  { slug: 'medical', name: 'Medical (MBBS/BDS)', icon: '🩺', description: 'Medical and dental admissions 2026' },
  { slug: 'engineering', name: 'Engineering', icon: '⚙️', description: 'Engineering admissions 2026' },
  { slug: 'law', name: 'Law (LLB)', icon: '⚖️', description: 'Law and LLB admissions 2026' },
];

const LEVEL_KEYWORDS: Record<LevelType, string[]> = {
  'matric': ['Matric', 'O-Level', 'SSC', 'Secondary'],
  'inter': ['Intermediate', 'A-Level', 'HSSC', 'FA', 'FSc', 'ICS', 'ICom'],
  'ba': ['BA', 'BSc', 'Bachelor', 'B.Com', 'B.Ed'],
  'bs': ['BS', 'BSC', 'Bachelor', '4-Year'],
  'bba': ['BBA', 'Bachelor of Business'],
  'mba': ['MBA', 'Master of Business'],
  'ms': ['MS', 'MPhil', 'Master', 'MSc', 'MA'],
  'medical': ['MBBS', 'BDS', 'Medical', 'Nursing', 'Pharm'],
  'engineering': ['Engineering', 'Civil', 'Mechanical', 'Electrical', 'Chemical'],
  'law': ['LLB', 'Law', 'Juris'],
};

const FEE_RANGES: Record<LevelType, string> = {
  'matric': 'PKR 5,000 - 25,000/semester',
  'inter': 'PKR 8,000 - 35,000/semester',
  'ba': 'PKR 15,000 - 50,000/semester',
  'bs': 'PKR 40,000 - 150,000/semester',
  'bba': 'PKR 50,000 - 200,000/semester',
  'mba': 'PKR 80,000 - 300,000/semester',
  'ms': 'PKR 60,000 - 250,000/semester',
  'medical': 'PKR 200,000 - 800,000/semester',
  'engineering': 'PKR 50,000 - 180,000/semester',
  'law': 'PKR 40,000 - 150,000/semester',
};

const ENTRY_TEST: Record<LevelType, string> = {
  'matric': 'No entry test required',
  'inter': 'Merit-based admission',
  'ba': 'Merit-based admission',
  'bs': 'NTS / University entry test required',
  'bba': 'NTS / University entry test required',
  'mba': 'NTS / GAT / University test required',
  'ms': 'GAT / University test required',
  'medical': 'MDCAT / NUMS required',
  'engineering': 'NET / ECAT required',
  'law': 'LAT required',
};

// ==================== METADATA ====================
export async function generateMetadata(): Promise<Metadata> {
  return generateSEO({
    entityType: 'page',
    entityId: 1, // admissions page ID - you can change this
    path: '/admissions',
    title: 'All Admissions 2026 in Pakistan – Matric, Inter, BS, MS & Apply Online | NextID.pk',
    description: 'Explore all 2026 admissions in Pakistan for Matric, Inter, BS, MS & professional programs. Check last dates, fees, entry test info & apply online now.',
    image: '/images/og-admissions.jpg',
  });
}
// ==================== GET CITIES WITH ADMISSION COUNTS ====================
async function getCitiesWithAdmissionCounts() {
  try {
    const result = await db
      .select({
        id: cities.id,
        name: cities.name,
        slug: cities.slug,
        province: cities.province,
        isPopular: cities.isPopular,
        count: sql<number>`count(distinct ${admissions.id})`.as('count')
      })
      .from(cities)
      .innerJoin(institutes, eq(institutes.cityId, cities.id))
      .innerJoin(admissions, eq(admissions.instituteId, institutes.id))
      .where(eq(admissions.status, 'Open'))
      .groupBy(cities.id, cities.name, cities.slug, cities.province, cities.isPopular)
      .orderBy(sql`count desc`);

    return result;
  } catch (error) {
    console.error('Error getting city counts:', error);
    return [];
  }
}

// ==================== DATA FETCHING ====================
async function getAdmissions(filters: {
  city?: string;
  level?: LevelType;
  q?: string;
}) {
  try {
    const conditions: any[] = [eq(admissions.status, 'Open')];

    if (filters.city) {
      conditions.push(eq(cities.slug, filters.city));
    }

    if (filters.q) {
      const words = filters.q.trim().split(/\s+/);
      const searchConditions = words.flatMap(word => {
        const term = `%${word}%`;
        return [
          like(institutes.name, term),
          like(admissions.name, term),
        ];
      });
      conditions.push(or(...searchConditions));
    }

    const whereClause = conditions.length === 1 
      ? conditions[0]
      : and(...conditions);

    const admissionsList = await db
      .select({
        id: admissions.id,
        name: admissions.name,
        slug: admissions.slug,
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        expectedCloseDate: admissions.expectedCloseDate,
        instituteId: admissions.instituteId,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        instituteType: institutes.type,
        instituteLogo: institutes.logo,
        cityId: cities.id,
        cityName: cities.name,
        citySlug: cities.slug,
      })
      .from(admissions)
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .innerJoin(cities, eq(institutes.cityId, cities.id))
      .where(whereClause)
      .orderBy(admissions.expectedCloseDate)
      .limit(100);

    if (admissionsList.length === 0) return [];

    const admissionsWithPrograms = await Promise.all(
      admissionsList.map(async (ad) => {
        const admissionProgramsList = await db
          .select({
            id: programs.id,
            name: programs.name,
            slug: programs.slug,
            degreeName: degrees.name,
          })
          .from(admissionPrograms)
          .innerJoin(programs, eq(admissionPrograms.programId, programs.id))
          .innerJoin(degrees, eq(programs.degreeId, degrees.id))
          .where(eq(admissionPrograms.admissionId, ad.id));

        return {
          ...ad,
          programs: admissionProgramsList,
        };
      })
    );

    if (filters.level && filters.level in LEVEL_KEYWORDS) {
      const keywords = LEVEL_KEYWORDS[filters.level];
      return admissionsWithPrograms.filter(ad => 
        ad.programs.some(program => 
          keywords.some(keyword => 
            program.name.toLowerCase().includes(keyword.toLowerCase())
          )
        )
      );
    }

    return admissionsWithPrograms;
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
}

async function getStats() {
  try {
    const totalAdmissions = await db
      .select({ count: sql<number>`count(*)` })
      .from(admissions)
      .where(eq(admissions.status, 'Open'));

    const totalUniversities = await db
      .select({ count: sql<number>`count(*)` })
      .from(institutes)
      .where(eq(institutes.status, true));

    const totalCities = await db
      .select({ count: sql<number>`count(*)` })
      .from(cities)
      .where(eq(cities.status, true));

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const closingSoon = await db
      .select({ count: sql<number>`count(*)` })
      .from(admissions)
      .where(
        and(
          eq(admissions.status, 'Open'),
          sql`${admissions.expectedCloseDate} < ${thirtyDaysFromNow}`
        )
      );

    return { 
      totalAdmissions: Number(totalAdmissions[0]?.count) || 0, 
      totalUniversities: Number(totalUniversities[0]?.count) || 0, 
      totalCities: Number(totalCities[0]?.count) || 0, 
      closingSoon: Number(closingSoon[0]?.count) || 0 
    };
  } catch (error) {
    console.error('Stats error:', error);
    return { totalAdmissions: 0, totalUniversities: 0, totalCities: 0, closingSoon: 0 };
  }
}

function formatAdmissionName(ad: AdmissionWithDetails): string {
  if (ad.name) return ad.name;
  
  const university = ad.instituteName || 'University';
  const city = ad.cityName || '';
  const year = ad.year || '2026';
  
  if (ad.programs && ad.programs.length > 0) {
    if (ad.programs.length === 1) {
      return `${ad.programs[0].name} Admissions ${year} at ${university}, ${city}`;
    } else {
      const programCount = ad.programs.length;
      return `Multiple Programs (${programCount}) Admissions ${year} at ${university}, ${city}`;
    }
  }
  
  return `Admissions ${year} at ${university}, ${city}`;
}

function Breadcrumbs({ filters, programTypes, citiesWithCounts }: { 
  filters: { city?: string; level?: string; q?: string };
  programTypes: typeof PROGRAM_TYPES;
  citiesWithCounts: any[];
}) {
  const items = [
    { name: 'Home', url: '/' },
    { name: 'Admissions', url: '/admissions' },
  ];

  if (filters.level) {
    const level = programTypes.find(l => l.slug === filters.level);
    if (level) {
      items.push({ name: level.name, url: `/admissions?level=${filters.level}` });
    }
  }

  if (filters.city) {
    const city = citiesWithCounts.find(c => c.slug === filters.city);
    if (city) {
      items.push({ name: city.name, url: `/admissions?city=${filters.city}` });
    }
  }

  if (filters.q) {
    items.push({ name: `Search: ${filters.q}`, url: `/admissions?q=${filters.q}` });
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => (
          <li key={item.url} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gray-400">›</span>}
            {index === items.length - 1 ? (
              <span className="text-gray-700 font-medium">{item.name}</span>
            ) : (
              <Link href={item.url} className="text-gray-500 hover:text-blue-600 transition">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams || {};
  
  const filters = {
    city: typeof params.city === 'string' ? params.city : '',
    level: typeof params.level === 'string' ? params.level as LevelType : undefined,
    q: typeof params.q === 'string' ? params.q : '',
  };

  const [admissionsList, stats, citiesWithCounts] = await Promise.all([
    getAdmissions(filters),
    getStats(),
    getCitiesWithAdmissionCounts(),
  ]);

  const uniqueUniversities = new Set(admissionsList.map(a => a.instituteName)).size;
  const totalPrograms = admissionsList.reduce((sum, ad) => sum + ad.programs.length, 0);

  const buildUrl = (key: string, value: string) => {
    const urlParams = new URLSearchParams();
    if (filters.city && key !== 'city') urlParams.set('city', filters.city);
    if (filters.level && key !== 'level') urlParams.set('level', filters.level);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (value) urlParams.set(key, value);
    return urlParams.toString() ? `/admissions?${urlParams.toString()}` : '/admissions';
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      
      {/* Hero Section - Premium Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-white">Admissions Open for 2026</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Admissions 2026 <span className="text-yellow-300">Pakistan</span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Matric to MBA • Last Dates • Fees • Entry Test Details • Apply Online
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/20 transition">
                <div className="text-3xl font-bold">{stats.totalAdmissions}+</div>
                <div className="text-sm text-blue-200 mt-1">Open Admissions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/20 transition">
                <div className="text-3xl font-bold">{stats.totalUniversities}+</div>
                <div className="text-sm text-blue-200 mt-1">Universities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/20 transition">
                <div className="text-3xl font-bold">{stats.totalCities}+</div>
                <div className="text-sm text-blue-200 mt-1">Cities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/20 transition">
                <div className="text-3xl font-bold text-yellow-300">{stats.closingSoon}</div>
                <div className="text-sm text-blue-200 mt-1">Closing Soon</div>
              </div>
            </div>

            {/* Search Form */}
            <div className="max-w-2xl mx-auto">
              <form action="/admissions" method="GET" className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    name="q"
                    defaultValue={filters.q}
                    placeholder="Search by university or program..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-lg"
                    aria-label="Search admissions"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-300 transition shadow-lg"
                  aria-label="Search"
                >
                  Search
                </button>
              </form>
              <p className="text-sm text-blue-200 mt-4">
                Popular: NUST • FAST • LUMS • Lahore • Karachi • BS CS • MBA • Engineering
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        
        <Breadcrumbs filters={filters} programTypes={PROGRAM_TYPES} citiesWithCounts={citiesWithCounts} />
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-80 flex-shrink-0" aria-label="Admission filters">
            <div className="sticky top-24 space-y-6">
              
              {/* Program Type Filter */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter Admissions
                  </h2>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Education Level</h3>
                  <div className="space-y-1">
                    {PROGRAM_TYPES.map((level) => (
                      <Link
                        key={level.slug}
                        href={buildUrl('level', level.slug)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                          filters.level === level.slug
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                        aria-label={level.description}
                      >
                        <span className="text-lg">{level.icon}</span>
                        <span className="flex-1">{level.name}</span>
                        {filters.level === level.slug && (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* City Filter */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <span>📍</span> City
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={buildUrl('city', '')}
                    className={`px-3 py-1.5 rounded-full text-sm transition ${
                      !filters.city ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-label="All cities"
                  >
                    All ({stats.totalAdmissions})
                  </Link>
                  {citiesWithCounts.slice(0, 8).map((city) => (
                    <Link
                      key={city.slug}
                      href={buildUrl('city', city.slug)}
                      className={`px-3 py-1.5 rounded-full text-sm transition ${
                        filters.city === city.slug ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      aria-label={`Admissions in ${city.name}`}
                    >
                      {city.name} <span className="text-xs opacity-75">({city.count})</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick Info */}
              {filters.level && FEE_RANGES[filters.level as LevelType] && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                  <h4 className="font-semibold text-blue-800 text-sm mb-3 flex items-center gap-2">
                    <span>ℹ️</span> Quick Info
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium text-gray-900">💰 Fee Range:</span> {FEE_RANGES[filters.level as LevelType]}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium text-gray-900">📝 Entry Test:</span> {ENTRY_TEST[filters.level as LevelType]}
                    </p>
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              {(filters.city || filters.level || filters.q) && (
                <Link
                  href="/admissions"
                  className="block text-center text-sm text-blue-600 hover:underline py-3 border-t"
                >
                  Clear all filters
                </Link>
              )}
            </div>
          </aside>

          {/* Main Content - Admissions List */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {admissionsList.length} Admissions Found
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {filters.level && `Level: ${PROGRAM_TYPES.find(l => l.slug === filters.level)?.name}`}
                    {filters.city && ` • City: ${citiesWithCounts.find(c => c.slug === filters.city)?.name}`}
                    {filters.q && ` • Search: "${filters.q}"`}
                  </p>
                </div>
                <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                  <span className="font-medium text-gray-700">{uniqueUniversities}</span> Universities • 
                  <span className="font-medium text-gray-700 ml-1">{totalPrograms}</span> Programs
                </div>
              </div>
            </div>

            {/* Admissions Cards */}
            <div className="space-y-5">
              {admissionsList.length > 0 ? (
                admissionsList.map((ad) => {
                  const daysLeft = ad.expectedCloseDate
                    ? Math.ceil((new Date(ad.expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;
                  const isUrgent = daysLeft && daysLeft <= 30;
                  const fullName = formatAdmissionName(ad);
                  const displayPrograms = ad.programs.slice(0, 3);
                  const remainingCount = ad.programs.length - 3;

                  return (
                    <article key={ad.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all overflow-hidden group">
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              {ad.instituteLogo ? (
                                <img src={ad.instituteLogo} alt={ad.instituteName} className="w-14 h-14 object-contain rounded-xl flex-shrink-0" />
                              ) : (
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                                  🏛️
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                  <Link href={`/admissions/${ad.slug}`} className="hover:text-blue-600 transition">
                                    {fullName}
                                  </Link>
                                </h3>
                                
                                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
                                  <Link href={`/universities/${ad.instituteSlug}`} className="text-blue-600 hover:underline font-medium">
                                    {ad.instituteName}
                                  </Link>
                                  <span>•</span>
                                  <Link href={`/cities/${ad.citySlug}`} className="hover:text-blue-600">
                                    {ad.cityName}
                                  </Link>
                                  {ad.instituteType && (
                                    <>
                                      <span>•</span>
                                      <span className="text-gray-500">{ad.instituteType}</span>
                                    </>
                                  )}
                                </div>
                                
                                <div className="mb-4">
                                  <div className="flex flex-wrap gap-2">
                                    {displayPrograms.map(program => (
                                      <Link
                                        key={program.id}
                                        href={`/programs/${program.slug}`}
                                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs hover:bg-blue-100 transition"
                                      >
                                        {program.name}
                                      </Link>
                                    ))}
                                    {remainingCount > 0 && (
                                      <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs">
                                        +{remainingCount} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="bg-gray-50 rounded-xl p-3">
                                    <span className="text-gray-500 text-xs">Last Date</span>
                                    <div className="font-semibold text-gray-800 text-sm">
                                      {ad.expectedCloseDate 
                                        ? new Date(ad.expectedCloseDate).toLocaleDateString('en-PK', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                          })
                                        : 'TBA'}
                                    </div>
                                  </div>
                                  <div className="bg-gray-50 rounded-xl p-3">
                                    <span className="text-gray-500 text-xs">Session</span>
                                    <div className="font-semibold text-gray-800 text-sm">{ad.session || 'Fall 2026'}</div>
                                  </div>
                                  <div className="bg-gray-50 rounded-xl p-3">
                                    <span className="text-gray-500 text-xs">Year</span>
                                    <div className="font-semibold text-gray-800 text-sm">{ad.year}</div>
                                  </div>
                                  <div className="bg-gray-50 rounded-xl p-3">
                                    <span className="text-gray-500 text-xs">Status</span>
                                    <div>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                        ${ad.status === 'Open' ? 'bg-green-100 text-green-700' : 
                                          ad.status === 'Expected' ? 'bg-yellow-100 text-yellow-700' : 
                                          'bg-red-100 text-red-700'}`}>
                                        {ad.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-3 flex-shrink-0">
                            {isUrgent && (
                              <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold animate-pulse">
                                ⏰ {daysLeft} days left
                              </span>
                            )}
                            <Link
                              href={`/admissions/${ad.slug}`}
                              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium whitespace-nowrap shadow-sm"
                            >
                              View Details →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-100">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Admissions Found</h3>
                  <p className="text-gray-500 mb-6">
                    {filters.level || filters.city || filters.q 
                      ? 'Try changing your filters to see more results'
                      : 'Check back soon for latest admissions'}
                  </p>
                  <Link
                    href="/admissions"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  >
                    View All Admissions
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SEO Content Section */}
      <section className="bg-white py-16 border-t border-gray-100 mt-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">About Admissions 2026 in Pakistan</h2>
            
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">Admissions 2026 in Pakistan</strong> are now open in top universities and colleges across the country. 
                Students can apply for {PROGRAM_TYPES.filter(p => p.slug).map((p, i, arr) => (
                  <span key={p.slug}>
                    <Link href={`/admissions?level=${p.slug}`} className="text-blue-600 hover:underline font-medium">
                      {p.name}
                    </Link>
                    {i < arr.length - 2 ? ', ' : i === arr.length - 2 ? ' and ' : ''}
                  </span>
                ))} programs. 
                Major cities including {citiesWithCounts.slice(0, 5).map((city, i, arr) => (
                  <span key={city.slug}>
                    <Link href={`/admissions?city=${city.slug}`} className="text-blue-600 hover:underline font-medium">
                      {city.name}
                    </Link>
                    {i < arr.length - 2 ? ', ' : i === arr.length - 2 ? ' and ' : ''}
                  </span>
                ))} have numerous admission opportunities.
              </p>
              
              <p>
                <strong className="text-gray-900">Last dates for admissions 2026</strong> vary by university and program. Most universities close 
                admissions by March-April for Fall semester. Students are advised to check individual program deadlines 
                and apply well before the last date. Late applications are usually not accepted. Keep track of 
                <span className="text-red-600 font-medium"> urgent deadlines</span> highlighted in our listings above.
              </p>
              
              <p>
                <strong className="text-gray-900">Admission fees and entry tests</strong> are important factors in the admission process. 
                Fee ranges from PKR 5,000 for Matric to PKR 800,000 for Medical programs per semester. 
                Entry test requirements include NTS, GAT, MDCAT, ECAT, NET, and university-specific tests 
                depending on the program. Merit-based admissions are common for Matric and Intermediate levels.
              </p>
              
              <p>
                <strong className="text-gray-900">Top universities accepting admissions 2026</strong> include NUST, FAST, LUMS, University of the Punjab, 
                and Karachi University. Check individual university pages for program-specific merit, fee structure, and 
                scholarship opportunities.
              </p>
            </div>

            {/* City-wise Admission Stats */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {citiesWithCounts.slice(0, 4).map(city => (
                <Link
                  key={city.slug}
                  href={`/admissions?city=${city.slug}`}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 text-center hover:shadow-md transition group"
                >
                  <div className="text-3xl font-bold text-blue-700">{city.count}</div>
                  <div className="text-sm text-gray-600 mt-1 group-hover:text-blue-600">in {city.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-blue-600">📅</span> When do admissions start in Pakistan?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Most universities start admissions in July-August for Fall semester and December-January for Spring semester. Matric and Intermediate admissions usually begin after results announcement in August-September.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-red-600">⏰</span> What is the last date for admissions 2026?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Last dates vary by university and program. Check individual admission listings above. Many top universities close admissions by March-April for Fall semester.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-green-600">💰</span> How much are admission fees in Pakistan?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Fee ranges: Matric (PKR 5k-25k/sem), Intermediate (PKR 8k-35k/sem), BS (PKR 40k-150k/sem), MBA (PKR 80k-300k/sem), Medical (PKR 200k-800k/sem). Check specific program details above.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-purple-600">📝</span> Do I need to take an entry test?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Entry test requirements: BS (NTS/University Test), MBA (NTS/GAT), Medical (MDCAT/NUMS), Engineering (NET/ECAT), Law (LAT). Matric and Intermediate are merit-based.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Admissions 2026 in Pakistan",
            "description": "Latest admissions in Pakistani universities and colleges",
            "numberOfItems": admissionsList.length,
            "itemListElement": admissionsList.slice(0, 10).map((ad, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "url": `https://www.nextid.pk/admissions/${ad.slug}`,
              "name": formatAdmissionName(ad)
            }))
          })
        }}
      />
    </main>
  );
}