// app/(public)/admissions/page.tsx
// ✅ Updated - Showing full admission names

import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { admissions, programs, institutes, cities, degrees, levels } from '@/app/lib/schema';
import { eq, desc, like, and, or, sql } from 'drizzle-orm';

// ==================== METADATA ====================
export const metadata: Metadata = {
  title: 'Admissions 2026 Pakistan – Last Date, Fees & Apply Online | NextID.pk',
  description: 'Matric to MBA admissions 2026 in Pakistan. Check updated last dates, fees and entry test details for top colleges and universities. Apply online now.',
  keywords: 'admissions 2026, university admissions Pakistan, college admissions, last date admissions, admission fees, entry test, matric admissions, intermediate admissions, BS programs, MBA admissions, MS programs, medical admissions, engineering admissions',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': 160,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: 'https://nextid.pk/admissions',
  },
};

// ==================== TYPES ====================
type LevelType = 'matric' | 'inter' | 'ba' | 'bs' | 'bba' | 'mba' | 'ms' | 'medical' | 'engineering' | 'law';

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

// ==================== GET CITIES WITH ADMISSION COUNTS ====================
async function getCitiesWithAdmissionCounts() {
  try {
    // Get all active cities
    const allCities = await db
      .select({
        id: cities.id,
        name: cities.name,
        slug: cities.slug,
        province: cities.province,
        isPopular: cities.isPopular,
      })
      .from(cities)
      .where(eq(cities.status, true))
      .orderBy(cities.name);

    // Get admission counts for each city
    const citiesWithCounts = await Promise.all(
      allCities.map(async (city) => {
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(admissions)
          .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
          .where(
            and(
              eq(admissions.status, 'Open'),
              eq(institutes.cityId, city.id)
            )
          );
        
        const count = Number(result[0]?.count) || 0;
        
        return {
          ...city,
          count,
        };
      })
    );

    // Filter cities with admissions and sort by count
    return citiesWithCounts
      .filter(city => city.count > 0)
      .sort((a, b) => b.count - a.count);
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

    if (filters.level) {
      const keywords = LEVEL_KEYWORDS[filters.level] || [];
      if (keywords.length > 0) {
        const levelConditions = keywords.map(keyword => 
          like(programs.name, `%${keyword}%`)
        );
        conditions.push(or(...levelConditions));
      }
    }

    if (filters.q) {
      const words = filters.q.trim().split(/\s+/);
      const searchConditions = words.flatMap(word => {
        const term = `%${word}%`;
        return [
          like(institutes.name, term),
          like(programs.name, term),
          like(cities.name, term),
        ];
      });
      conditions.push(or(...searchConditions));
    }

    const data = await db
      .select({
        id: admissions.id,
        // ✅ Get all needed fields
        name: admissions.name,
        slug: admissions.slug,
        // Program details
        program: programs.name,
        programSlug: programs.slug,
        // Institute details
        university: institutes.name,
        universitySlug: institutes.slug,
        universityType: institutes.type,
        // City details
        city: cities.name,
        citySlug: cities.slug,
        // Admission details
        deadline: admissions.expectedCloseDate,
        status: admissions.status,
        year: admissions.year,
        session: admissions.session,
        // ✅ Additional fields for full name
        degreeName: programs.name, // This will be enhanced
      })
      .from(admissions)
      .innerJoin(programs, eq(admissions.programId, programs.id))
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .innerJoin(cities, eq(institutes.cityId, cities.id))
      .where(and(...conditions))
      .orderBy(admissions.expectedCloseDate)
      .limit(100);

    return data;
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
}

async function getStats() {
  try {
    const totalAdmissions = await db.$count(admissions, eq(admissions.status, 'Open'));
    const totalUniversities = await db.$count(institutes, eq(institutes.status, true));
    const totalCities = await db.$count(cities, eq(cities.status, true));

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
      )
      .then(result => Number(result[0]?.count) || 0);

    return { 
      totalAdmissions: Number(totalAdmissions) || 0, 
      totalUniversities: Number(totalUniversities) || 0, 
      totalCities: Number(totalCities) || 0, 
      closingSoon: Number(closingSoon) || 0 
    };
  } catch (error) {
    return { totalAdmissions: 0, totalUniversities: 0, totalCities: 0, closingSoon: 0 };
  }
}

// ==================== HELPER FUNCTION TO FORMAT ADMISSION NAME ====================
function formatAdmissionName(ad: any): string {
  // If name exists in database, use it
  if (ad.name) return ad.name;
  
  // Otherwise generate a nice name
  const program = ad.program || 'Program';
  const university = ad.university || 'University';
  const city = ad.city || '';
  const year = ad.year || '2026';
  
  // Determine degree type from program name
  let degreeType = '';
  if (program.toLowerCase().includes('bs ') || program.includes('BS ')) degreeType = 'BS';
  else if (program.toLowerCase().includes('ba ') || program.includes('BA ')) degreeType = 'BA';
  else if (program.toLowerCase().includes('bsc ') || program.includes('BSc ')) degreeType = 'BSc';
  else if (program.toLowerCase().includes('ma ') || program.includes('MA ')) degreeType = 'MA';
  else if (program.toLowerCase().includes('ms ') || program.includes('MS ')) degreeType = 'MS';
  else if (program.toLowerCase().includes('mba')) degreeType = 'MBA';
  else if (program.toLowerCase().includes('mbbs')) degreeType = 'MBBS';
  else if (program.toLowerCase().includes('bds')) degreeType = 'BDS';
  else if (program.toLowerCase().includes('llb')) degreeType = 'LLB';
  else if (program.toLowerCase().includes('bed') || program.includes('B.Ed')) degreeType = 'B.Ed';
  else if (program.toLowerCase().includes('pharm')) degreeType = 'Pharm.D';
  
  if (degreeType) {
    return `${degreeType} ${program.replace(degreeType, '').trim()} Admissions ${year} at ${university}, ${city}`;
  }
  
  return `${program} Admissions ${year} at ${university}, ${city}`;
}

// ==================== BREADCRUMBS COMPONENT ====================
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
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-4">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.url} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gray-400">/</span>}
            {index === items.length - 1 ? (
              <span className="text-gray-700 font-medium">{item.name}</span>
            ) : (
              <Link href={item.url} className="hover:text-blue-600 transition">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ==================== MAIN PAGE ====================
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

  const [admissions, stats, citiesWithCounts] = await Promise.all([
    getAdmissions(filters),
    getStats(),
    getCitiesWithAdmissionCounts(),
  ]);

  const uniqueUniversities = new Set(admissions.map(a => a.university)).size;

  // Build filter URLs
  const buildUrl = (key: string, value: string) => {
    const urlParams = new URLSearchParams();
    if (filters.city && key !== 'city') urlParams.set('city', filters.city);
    if (filters.level && key !== 'level') urlParams.set('level', filters.level);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (value) urlParams.set(key, value);
    return urlParams.toString() ? `/admissions?${urlParams.toString()}` : '/admissions';
  };

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Admissions 2026 Pakistan
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Matric to MBA • Last Dates • Fees • Entry Test Details
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.totalAdmissions}+</div>
                <div className="text-sm text-blue-200">Open Admissions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.totalUniversities}+</div>
                <div className="text-sm text-blue-200">Universities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.totalCities}+</div>
                <div className="text-sm text-blue-200">Cities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.closingSoon}</div>
                <div className="text-sm text-blue-200">Closing Soon</div>
              </div>
            </div>

            {/* Search Form */}
            <div className="max-w-2xl mx-auto">
              <form action="/admissions" method="GET" className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    name="q"
                    defaultValue={filters.q}
                    placeholder="Search by university, program or city..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    aria-label="Search admissions"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition"
                  aria-label="Search"
                >
                  Search
                </button>
              </form>
              <p className="text-sm text-blue-200 mt-2">
                Popular: NUST • FAST • LUMS • Lahore • Karachi • BS CS • MBA
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        
        {/* Breadcrumbs */}
        <Breadcrumbs filters={filters} programTypes={PROGRAM_TYPES} citiesWithCounts={citiesWithCounts} />
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-80 flex-shrink-0" aria-label="Admission filters">
            <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-200">
              <h2 className="font-bold text-lg mb-4">Filter Admissions</h2>
              
              {/* Level Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Education Level</h3>
                <div className="space-y-2">
                  {PROGRAM_TYPES.map((level) => (
                    <Link
                      key={level.slug}
                      href={buildUrl('level', level.slug)}
                      className={`block px-3 py-2 rounded-lg text-sm ${
                        filters.level === level.slug
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                      aria-label={level.description}
                    >
                      <span className="mr-2">{level.icon}</span>
                      {level.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* City Filter - with Real Counts */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">City</h3>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={buildUrl('city', '')}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      !filters.city ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-label="All cities"
                  >
                    All ({stats.totalAdmissions})
                  </Link>
                  {citiesWithCounts.map((city) => (
                    <Link
                      key={city.slug}
                      href={buildUrl('city', city.slug)}
                      className={`px-3 py-1.5 rounded-full text-sm ${
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
                <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-100">
                  <h4 className="font-semibold text-blue-800 text-sm mb-2">Quick Info</h4>
                  <p className="text-xs text-gray-600 mb-1">
                    <span className="font-medium">💰 Fee Range:</span> {FEE_RANGES[filters.level as LevelType]}
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">📝 Entry Test:</span> {ENTRY_TEST[filters.level as LevelType]}
                  </p>
                </div>
              )}

              {/* Clear Filters */}
              {(filters.city || filters.level || filters.q) && (
                <Link
                  href="/admissions"
                  className="block text-center text-sm text-blue-600 hover:underline mt-4 pt-3 border-t"
                >
                  Clear all filters
                </Link>
              )}
            </div>
          </aside>

          {/* Main Content - Admissions List */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {admissions.length} Admissions Found
                  </h2>
                  <p className="text-sm text-gray-500">
                    {filters.level && `Level: ${PROGRAM_TYPES.find(l => l.slug === filters.level)?.name}`}
                    {filters.city && ` • City: ${citiesWithCounts.find(c => c.slug === filters.city)?.name}`}
                    {filters.q && ` • Search: "${filters.q}"`}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{uniqueUniversities}</span> Universities • 
                  <span className="font-medium ml-1">{admissions.length}</span> Programs
                </div>
              </div>
            </div>

            {/* Admissions Cards with Full Names */}
            <div className="space-y-4">
              {admissions.length > 0 ? (
                admissions.map((ad) => {
                  const daysLeft = ad.deadline
                    ? Math.ceil((new Date(ad.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;
                  const isUrgent = daysLeft && daysLeft <= 30;
                  
                  // ✅ Use slug from database
                  const admissionSlug = ad.slug;
                  
                  // ✅ Get full admission name
                  const fullName = formatAdmissionName(ad);

                  return (
                    <article key={ad.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden">
                      <div className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            {/* ✅ Show full name with degree, program, university, city */}
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              <Link href={`/admissions/${admissionSlug}`} className="hover:text-blue-600">
                                {fullName}
                              </Link>
                            </h3>
                            
                            {/* ✅ Also show program/university/city separately for quick reference */}
                            <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                              <span className="font-medium text-gray-700">{ad.program}</span>
                              <span>•</span>
                              <Link href={`/universities/${ad.universitySlug}`} className="text-blue-600 hover:underline">
                                {ad.university}
                              </Link>
                              <span>•</span>
                              <Link href={`/cities/${ad.citySlug}`} className="hover:text-blue-600">
                                {ad.city}
                              </Link>
                            </div>
                            
                            {/* Program Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                              <div className="bg-gray-50 rounded-lg p-2">
                                <span className="text-gray-500 text-xs">Last Date</span>
                                <div className="font-medium">
                                  {ad.deadline ? new Date(ad.deadline).toLocaleDateString() : 'TBA'}
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-2">
                                <span className="text-gray-500 text-xs">Fee Range</span>
                                <div className="font-medium">
                                  {filters.level && FEE_RANGES[filters.level as LevelType]
                                    ? FEE_RANGES[filters.level as LevelType]
                                    : 'Contact university'}
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-2">
                                <span className="text-gray-500 text-xs">Entry Test</span>
                                <div className="font-medium">
                                  {filters.level && ENTRY_TEST[filters.level as LevelType]
                                    ? ENTRY_TEST[filters.level as LevelType]
                                    : 'Check requirements'}
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-2">
                                <span className="text-gray-500 text-xs">Session</span>
                                <div className="font-medium">{ad.session || 'Fall 2026'}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            {isUrgent && (
                              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                ⏰ {daysLeft} days left
                              </span>
                            )}
                            <Link
                              href={`/admissions/${admissionSlug}`}
                              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
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
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Admissions Found</h3>
                  <p className="text-gray-500 mb-6">
                    {filters.level || filters.city || filters.q 
                      ? 'Try changing your filters'
                      : 'Check back soon for latest admissions'}
                  </p>
                  <Link
                    href="/admissions"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
      <section className="bg-white py-12 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              About Admissions 2026 in Pakistan
            </h2>
            
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>Admissions 2026 in Pakistan</strong> are now open in top universities and colleges across the country. 
                Students can apply for {PROGRAM_TYPES.filter(p => p.slug).map((p, i, arr) => (
                  <span key={p.slug}>
                    <Link href={`/admissions?level=${p.slug}`} className="text-blue-600 hover:underline">
                      {p.name}
                    </Link>
                    {i < arr.length - 2 ? ', ' : i === arr.length - 2 ? ' and ' : ''}
                  </span>
                ))} programs. 
                Major cities including {citiesWithCounts.slice(0, 5).map((city, i, arr) => (
                  <span key={city.slug}>
                    <Link href={`/admissions?city=${city.slug}`} className="text-blue-600 hover:underline">
                      {city.name}
                    </Link>
                    {i < arr.length - 2 ? ', ' : i === arr.length - 2 ? ' and ' : ''}
                  </span>
                ))} have numerous admission opportunities.
              </p>
              
              <p>
                <strong>Last dates for admissions 2026</strong> vary by university and program. Most universities close 
                admissions by March-April for Fall semester. Students are advised to check individual program deadlines 
                and apply well before the last date. Late applications are usually not accepted. Keep track of 
                <span className="text-orange-600 font-medium"> urgent deadlines</span> highlighted in our listings above.
              </p>
              
              <p>
                <strong>Admission fees and entry tests</strong> are important factors in the admission process. 
                Fee ranges from PKR 5,000 for Matric to PKR 800,000 for Medical programs per semester. 
                Entry test requirements include NTS, GAT, MDCAT, ECAT, NET, and university-specific tests 
                depending on the program. Merit-based admissions are common for Matric and Intermediate levels.
              </p>
              
              <p>
                <strong>Top universities accepting admissions 2026</strong> include {citiesWithCounts.slice(0, 3).map((city, i, arr) => (
                  <span key={city.slug}>
                    <Link href={`/admissions?city=${city.slug}`} className="text-blue-600 hover:underline">
                      {city.name}
                    </Link>
                    {i < arr.length - 2 ? ', ' : i === arr.length - 2 ? ' and ' : ''}
                  </span>
                ))}. Check individual university pages for program-specific merit, fee structure, and scholarship opportunities.
              </p>
            </div>

            {/* City-wise Admission Stats */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {citiesWithCounts.slice(0, 4).map(city => (
                <Link
                  key={city.slug}
                  href={`/admissions?city=${city.slug}`}
                  className="bg-blue-50 rounded-lg p-4 text-center hover:bg-blue-100 transition"
                >
                  <div className="text-2xl font-bold text-blue-700">{city.count}</div>
                  <div className="text-sm text-gray-600">in {city.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white border-t border-gray-200 mt-0">
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions About Admissions 2026
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">When do admissions start in Pakistan?</h3>
              <p className="text-gray-600 text-sm">
                Most universities start admissions in July-August for Fall semester and December-January for Spring semester. Matric and Intermediate admissions usually begin after results announcement in August-September.
              </p>
            </article>
            
            <article className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">What is the last date for admissions 2026?</h3>
              <p className="text-gray-600 text-sm">
                Last dates vary by university and program. Check individual admission listings above. Many top universities close admissions by March-April for Fall semester.
              </p>
            </article>
            
            <article className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">How much are admission fees in Pakistan?</h3>
              <p className="text-gray-600 text-sm">
                Fee ranges: Matric (PKR 5k-25k/sem), Intermediate (PKR 8k-35k/sem), BS (PKR 40k-150k/sem), MBA (PKR 80k-300k/sem), Medical (PKR 200k-800k/sem). Check specific program details above.
              </p>
            </article>
            
            <article className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">Do I need to take an entry test?</h3>
              <p className="text-gray-600 text-sm">
                Entry test requirements: BS (NTS/University Test), MBA (NTS/GAT), Medical (MDCAT/NUMS), Engineering (NET/ECAT), Law (LAT). Matric and Intermediate are merit-based.
              </p>
            </article>
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
            "numberOfItems": admissions.length,
            "itemListElement": admissions.slice(0, 10).map((ad, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "url": `https://nextid.pk/admissions/${ad.slug}`,
              "name": formatAdmissionName(ad)
            }))
          })
        }}
      />

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
              }
            ]
          })
        }}
      />
    </main>
  );
}