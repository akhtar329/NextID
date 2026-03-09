// app/(public)/programs/page.tsx
// ✅ Professional Programs Page - SEO Optimized

import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { programs, degrees, categories, levels, institutes } from '@/app/lib/schema';
import { eq, desc, like, and, or, sql } from 'drizzle-orm';

// ==================== METADATA ====================
export const metadata: Metadata = {
  title: 'Academic Programs 2026 | BS, MBA, MS, BBA in Pakistan | NextID.pk',
  description: 'Explore BS, MBA, MS, BBA, Medical & Engineering programs in Pakistan. Check eligibility, duration, fees & admission details for 2026. Apply online now.',
  keywords: 'programs in Pakistan, academic programs, BS programs, MBA programs, MS programs, BBA programs, medical programs, engineering programs, computer science, business administration',
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
  alternates: {
    canonical: 'https://nextid.pk/programs',
  },
  openGraph: {
    title: 'Academic Programs 2026 in Pakistan | BS, MBA, MS',
    description: 'Explore all academic programs in Pakistan. Find details, eligibility, duration and fees.',
    images: ['/images/programs-og.jpg'],
  },
};

// ==================== TYPES ====================
type ProgramLevel = 'matric' | 'inter' | 'bachelor' | 'master' | 'doctoral';
type ProgramCategory = 'cs' | 'engineering' | 'business' | 'medical' | 'arts' | 'law' | 'others';

interface ProgramItem {
  id: number;
  name: string;
  slug: string;
  degreeName: string | null;
  levelName: string | null;
  categoryName: string | null;
  duration: string | null;
  feeRange: string | null;
  isFeatured: boolean | null;
  instituteCount: number;
}

// ==================== CONSTANTS ====================
const PROGRAM_LEVELS = [
  { slug: '', name: 'All Levels', icon: '📋' },
  { slug: 'matric', name: 'Matric / O-Level', icon: '📚' },
  { slug: 'inter', name: 'Intermediate / A-Level', icon: '📖' },
  { slug: 'bachelor', name: 'Bachelor (14 Years)', icon: '🎓' },
  { slug: 'master', name: 'Master (16 Years)', icon: '🎓' },
  { slug: 'doctoral', name: 'Doctoral (PhD)', icon: '🔬' },
];

const PROGRAM_CATEGORIES = [
  { slug: '', name: 'All Categories', icon: '📋' },
  { slug: 'cs', name: 'Computer Science & IT', icon: '💻' },
  { slug: 'engineering', name: 'Engineering', icon: '⚙️' },
  { slug: 'business', name: 'Business & Management', icon: '💼' },
  { slug: 'medical', name: 'Medical & Health', icon: '🩺' },
  { slug: 'arts', name: 'Arts & Humanities', icon: '🎨' },
  { slug: 'law', name: 'Law', icon: '⚖️' },
  { slug: 'others', name: 'Other Programs', icon: '📚' },
];

// Category keywords for filtering
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'cs': ['Computer', 'IT', 'Software', 'Data Science', 'AI', 'Cyber Security', 'Information Technology'],
  'engineering': ['Engineering', 'Civil', 'Mechanical', 'Electrical', 'Chemical', 'Industrial'],
  'business': ['Business', 'Management', 'MBA', 'BBA', 'Commerce', 'Accounting', 'Finance', 'Marketing'],
  'medical': ['Medical', 'MBBS', 'BDS', 'Pharmacy', 'Nursing', 'Health', 'Medicine'],
  'arts': ['Arts', 'Humanities', 'English', 'History', 'Philosophy', 'Psychology', 'Sociology'],
  'law': ['Law', 'LLB', 'LLM', 'Juris'],
};

// ==================== DATA FETCHING ====================

async function getPrograms(filters: {
  level?: string;
  category?: string;
  q?: string;
}) {
  try {
    const conditions: any[] = [];

    // ✅ LEVEL FILTER - FIXED
    if (filters.level && filters.level !== '') {
      // Level slugs ko IDs mein map karo
      const levelMap: Record<string, number> = {
        'matric': 1,   // Matric / O-Level
        'inter': 2,     // Intermediate / A-Level
        'bachelor': 3,  // Bachelor (14 Years)
        'master': 4,    // Master (16 Years)
        'doctoral': 5,  // Doctoral (PhD)
      };
      
      const levelId = levelMap[filters.level];
      if (levelId) {
        // Degrees ke through levels filter
        conditions.push(eq(degrees.levelId, levelId));
      }
    }

    // Category filter
    if (filters.category && filters.category !== '') {
      const categoryMap: Record<string, string[]> = {
        'cs': ['Computer', 'IT', 'Software', 'Data Science'],
        'engineering': ['Engineering', 'Civil', 'Mechanical', 'Electrical'],
        'business': ['Business', 'Management', 'MBA', 'BBA', 'Commerce'],
        'medical': ['Medical', 'MBBS', 'BDS', 'Pharmacy', 'Nursing'],
        'arts': ['Arts', 'Humanities', 'English', 'History'],
        'law': ['Law', 'LLB', 'LLM'],
      };
      
      const keywords = categoryMap[filters.category] || [];
      if (keywords.length > 0) {
        const categoryConditions = keywords.map(keyword => 
          like(programs.name, `%${keyword}%`)
        );
        conditions.push(or(...categoryConditions));
      }
    }

    // Search filter
    if (filters.q) {
      const searchTerm = `%${filters.q}%`;
      const searchConditions = [
        like(programs.name, searchTerm),
        like(degrees.name, searchTerm),
      ];
      conditions.push(or(...searchConditions));
    }

    // Rest of the query...
    const data = await db
      .select({
        id: programs.id,
        name: programs.name,
        slug: programs.slug,
        degreeName: degrees.name,
        levelName: levels.name,
        categoryName: categories.name,
        duration: programs.duration,
        feeRange: programs.feeRange,
        isFeatured: programs.isFeatured,
        instituteCount: sql<number>`(
          SELECT COUNT(*) 
          FROM program_institutes 
          WHERE program_institutes.program_id = ${programs.id}
        )`,
      })
      .from(programs)
      .leftJoin(degrees, eq(programs.degreeId, degrees.id))
      .leftJoin(levels, eq(degrees.levelId, levels.id))
      .leftJoin(categories, eq(degrees.categoryId, categories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(programs.isFeatured), programs.name)
      .limit(100);

    return data;
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
}

async function getStats() {
  try {
    const totalPrograms = await db.$count(programs);
    const totalDegrees = await db.$count(degrees);
    const totalCategories = await db.$count(categories);

    return {
      totalPrograms,
      totalDegrees,
      totalCategories,
    };
  } catch (error) {
    return { totalPrograms: 0, totalDegrees: 0, totalCategories: 0 };
  }
}

// ==================== BREADCRUMBS ====================
function Breadcrumbs({ filters }: { filters: any }) {
  const items = [
    { name: 'Home', url: '/' },
    { name: 'Programs', url: '/programs' },
  ];

  if (filters.category) {
    const cat = PROGRAM_CATEGORIES.find(c => c.slug === filters.category);
    if (cat) items.push({ name: cat.name, url: `/programs?category=${filters.category}` });
  }

  if (filters.level) {
    const level = PROGRAM_LEVELS.find(l => l.slug === filters.level);
    if (level) items.push({ name: level.name, url: `/programs?level=${filters.level}` });
  }

  return (
    <nav className="text-sm text-gray-500 mb-4">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.url} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gray-400">/</span>}
            {index === items.length - 1 ? (
              <span className="text-gray-700 font-medium">{item.name}</span>
            ) : (
              <Link href={item.url} className="hover:text-blue-600">
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
export default async function ProgramsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams || {};
  
  const filters = {
    level: typeof params.level === 'string' ? params.level : '',
    category: typeof params.category === 'string' ? params.category : '',
    q: typeof params.q === 'string' ? params.q : '',
  };

  const [programs, stats] = await Promise.all([
    getPrograms(filters),
    getStats(),
  ]);

  const featuredPrograms = programs.filter(p => p.isFeatured).slice(0, 6);
  const regularPrograms = programs.filter(p => !p.isFeatured);

  const buildUrl = (key: string, value: string) => {
    const urlParams = new URLSearchParams();
    if (filters.level && key !== 'level') urlParams.set('level', filters.level);
    if (filters.category && key !== 'category') urlParams.set('category', filters.category);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (value) urlParams.set(key, value);
    return urlParams.toString() ? `/programs?${urlParams.toString()}` : '/programs';
  };

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Academic Programs 2026 in Pakistan
            </h1>
            <p className="text-xl text-purple-100 mb-8">
              BS • MBA • MS • BBA • Medical • Engineering • Law & More
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.totalPrograms}+</div>
                <div className="text-sm text-purple-200">Programs</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.totalDegrees}+</div>
                <div className="text-sm text-purple-200">Degrees</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.totalCategories}+</div>
                <div className="text-sm text-purple-200">Categories</div>
              </div>
            </div>

            {/* Search Form */}
            <div className="max-w-2xl mx-auto">
              <form action="/programs" method="GET" className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    name="q"
                    defaultValue={filters.q}
                    placeholder="Search programs, degrees or categories..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition"
                >
                  Search
                </button>
              </form>
              <p className="text-sm text-purple-200 mt-2">
                Popular: BS Computer Science • MBA • BBA • MBBS • LLB
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        
        <Breadcrumbs filters={filters} />
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-200">
              <h2 className="font-bold text-lg mb-4">Filter Programs</h2>
              
              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Categories</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {PROGRAM_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={buildUrl('category', cat.slug)}
                      className={`block px-3 py-2 rounded-lg text-sm ${
                        filters.category === cat.slug
                          ? 'bg-purple-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="mr-2">{cat.icon}</span>
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Levels */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Education Level</h3>
                <div className="space-y-2">
                  {PROGRAM_LEVELS.map((level) => (
                    <Link
                      key={level.slug}
                      href={buildUrl('level', level.slug)}
                      className={`block px-3 py-2 rounded-lg text-sm ${
                        filters.level === level.slug
                          ? 'bg-purple-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="mr-2">{level.icon}</span>
                      {level.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(filters.category || filters.level || filters.q) && (
                <Link
                  href="/programs"
                  className="block text-center text-sm text-purple-600 hover:underline mt-4 pt-3 border-t"
                >
                  Clear all filters
                </Link>
              )}
            </div>
          </aside>

          {/* Main Content - Programs List */}
          <div className="flex-1">
            
            {/* Results Header */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {programs.length} Programs Found
                  </h2>
                  <p className="text-sm text-gray-500">
                    {filters.category && `Category: ${PROGRAM_CATEGORIES.find(c => c.slug === filters.category)?.name}`}
                    {filters.level && ` • Level: ${PROGRAM_LEVELS.find(l => l.slug === filters.level)?.name}`}
                    {filters.q && ` • Search: "${filters.q}"`}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{stats.totalDegrees}</span> Degree Types
                </div>
              </div>
            </div>

            {/* Featured Programs */}
            {featuredPrograms.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-yellow-500 mr-2">⭐</span>
                  Featured Programs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredPrograms.map((program) => (
                    <article key={program.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden">
                      <div className="p-5">
                        <Link href={`/programs/${program.slug}`}>
                          <h4 className="font-bold text-gray-900 mb-1 hover:text-purple-600">
                            {program.name}
                          </h4>
                        </Link>
                        <p className="text-sm text-gray-600 mb-2">
                          {program.degreeName} • {program.levelName || 'Bachelor'}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {program.duration && <span>⏱️ {program.duration}</span>}
                          {program.feeRange && <span>💰 {program.feeRange}</span>}
                          <span>🏛️ {program.instituteCount}+ institutes</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* All Programs */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">All Programs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {regularPrograms.length > 0 ? (
                  regularPrograms.map((program) => (
                    <article key={program.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden">
                      <div className="p-5">
                        <Link href={`/programs/${program.slug}`}>
                          <h4 className="font-bold text-gray-900 mb-1 hover:text-purple-600">
                            {program.name}
                          </h4>
                        </Link>
                        <p className="text-sm text-gray-600 mb-2">
                          {program.degreeName} • {program.categoryName || 'General'}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          {program.duration && <span>⏱️ {program.duration}</span>}
                          {program.feeRange && <span>💰 {program.feeRange}</span>}
                          <span>🏛️ {program.instituteCount} institutes</span>
                        </div>
                        <div className="mt-3">
                          <Link 
                            href={`/programs/${program.slug}`}
                            className="text-sm text-purple-600 hover:underline font-medium"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="col-span-2 bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Programs Found</h3>
                    <p className="text-gray-500 mb-6">
                      {filters.category || filters.level || filters.q
                        ? 'Try changing your filters'
                        : 'Check back soon for more programs'}
                    </p>
                    <Link
                      href="/programs"
                      className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      View All Programs
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Load More (if needed) */}
            {programs.length >= 100 && (
              <div className="mt-6 text-center">
                <button className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Load More Programs
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEO Content Section */}
      <section className="bg-white py-12 border-t border-gray-200 mt-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              About Academic Programs in Pakistan
            </h2>
            
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>BS Programs (4-Year)</strong> are undergraduate degrees offered in various disciplines including 
                <Link href="/programs/bs-computer-science" className="text-purple-600 hover:underline"> Computer Science</Link>, 
                <Link href="/programs/bs-electrical-engineering" className="text-purple-600 hover:underline"> Engineering</Link>, 
                <Link href="/programs/bs-business" className="text-purple-600 hover:underline"> Business Administration</Link>, and 
                <Link href="/programs/bs-economics" className="text-purple-600 hover:underline"> Economics</Link>. 
                Eligibility typically requires FSc/ICS/FA with minimum 50% marks.
              </p>
              
              <p>
                <strong>MBA Programs</strong> are offered by top business schools including 
                <Link href="/universities/lums" className="text-purple-600 hover:underline"> LUMS</Link>, 
                <Link href="/universities/iba" className="text-purple-600 hover:underline"> IBA</Link>, and 
                <Link href="/universities/fast" className="text-purple-600 hover:underline"> FAST</Link>. 
                Executive MBA, 1.5-year, and 2-year programs available for working professionals.
              </p>
              
              <p>
                <strong>MS/MPhil Programs</strong> are postgraduate degrees requiring 16 years of education. 
                Duration is typically 2 years including thesis. Popular fields include Computer Science, 
                Business Administration, Economics, and various sciences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions About Programs
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">What is the difference between BS and BSc?</h3>
              <p className="text-gray-600 text-sm">
                BS (Bachelor of Science) is typically a 4-year program while BSc is often 2 years. BS is more comprehensive and internationally recognized.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">What are the eligibility criteria for BS programs?</h3>
              <p className="text-gray-600 text-sm">
                Generally, at least 45-50% marks in Intermediate (FA/FSc/ICS/ICom) with relevant subjects. Some universities require entry tests.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">How long is an MBA program?</h3>
              <p className="text-gray-600 text-sm">
                MBA programs are typically 1.5 to 2 years. Executive MBA for working professionals is usually 2 years with weekend classes.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">What is the duration of MS/MPhil programs?</h3>
              <p className="text-gray-600 text-sm">
                MS/MPhil programs are typically 2 years including coursework and thesis. Some universities offer 1.5-year programs.
              </p>
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
            "name": "Academic Programs in Pakistan 2026",
            "description": "Complete list of academic programs offered in Pakistan",
            "numberOfItems": programs.length,
            "itemListElement": programs.slice(0, 10).map((program, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "url": `https://nextid.pk/programs/${program.slug}`,
              "name": program.name
            }))
          })
        }}
      />
    </main>
  );
}