// app/(public)/scholarships/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { postService } from '@/services/post/post.service';
import { unstable_cache } from 'next/cache';

export const revalidate = 86400;

// ============ TYPES ============
interface ScholarshipItem {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  studyLevel: string;
  type: string;
  location: string;
  deadline: Date | null;
  provider: string;
  amount: string | null;
  isFeatured: boolean;
  isPopular: boolean;
  viewCount: number;
}

interface Filters {
  level?: string;
  type?: string;
  location?: string;
  q?: string;
}

interface Stats {
  total: number;
  featured: number;
  abroad: number;
  fullyFunded: number;
}

// ============ CONSTANTS ============
const STUDY_LEVELS = [
  { slug: '', name: 'All Levels', icon: '📚' },
  { slug: 'matric', name: 'Matric', icon: '📖' },
  { slug: 'inter', name: 'Intermediate', icon: '📘' },
  { slug: 'bs', name: 'Bachelor (BS)', icon: '🎓' },
  { slug: 'ms', name: 'Master (MS/MPhil)', icon: '🎓' },
  { slug: 'phd', name: 'PhD', icon: '🔬' },
];

const SCHOLARSHIP_TYPES = [
  { slug: '', name: 'All Types', icon: '💰' },
  { slug: 'fully-funded', name: 'Fully Funded', icon: '💎' },
  { slug: 'partial', name: 'Partial', icon: '📖' },
  { slug: 'merit-based', name: 'Merit Based', icon: '⭐' },
  { slug: 'need-based', name: 'Need Based', icon: '🤝' },
];

const LOCATIONS = [
  { slug: '', name: 'All Locations', icon: '🌍' },
  { slug: 'pakistan', name: 'Pakistan', icon: '🇵🇰' },
  { slug: 'abroad', name: 'Abroad', icon: '✈️' },
];

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined ? value : defaultValue;
}

function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getDaysLeft(date: Date | null): number | null {
  if (!date) return null;
  const today = new Date();
  const deadline = new Date(date);
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : null;
}

// ============ METADATA ============
export const metadata: Metadata = {
  title: 'Scholarships in Pakistan 2026 | Fully Funded & Partial | NextID.pk',
  description: 'Find latest scholarships for Pakistani students. Fully funded, partial, merit-based, need-based scholarships for Matric to PhD.',
};

// ============ DATA FETCHING ============
async function getScholarships(filters: Filters): Promise<ScholarshipItem[]> {
  try {
    const allScholarships = await postService.getPostsByType('scholarship', 200);
    
    let scholarshipsList: ScholarshipItem[] = allScholarships.map(post => {
      const meta = post.meta;
      const deadline = getMetaValue(meta, 'applicationDeadline', null) 
        ? new Date(getMetaValue(meta, 'applicationDeadline', '')) 
        : null;
      
      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        studyLevel: getMetaValue(meta, 'studyLevel', 'Various'),
        type: getMetaValue(meta, 'type', 'Merit-Based'),
        location: getMetaValue(meta, 'location', 'Pakistan'),
        deadline: deadline,
        provider: getMetaValue(meta, 'organizationName', getMetaValue(meta, 'provider', 'Various')),
        amount: getMetaValue(meta, 'amount', null),
        isFeatured: post.isFeatured || false,
        isPopular: post.isPopular || false,
        viewCount: post.viewCount || 0,
      };
    });
    
    // Sort by deadline (closest first)
    scholarshipsList.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.getTime() - b.deadline.getTime();
    });
    
    // Filter by study level
    if (filters.level && filters.level !== '') {
      scholarshipsList = scholarshipsList.filter(s => 
        s.studyLevel.toLowerCase().includes(filters.level!.toLowerCase())
      );
    }
    
    // Filter by type
    if (filters.type && filters.type !== '') {
      scholarshipsList = scholarshipsList.filter(s => {
        const typeSlug = s.type.toLowerCase().replace(/ /g, '-');
        return typeSlug === filters.type;
      });
    }
    
    // Filter by location - FIXED
  if (filters.location && filters.location !== '') {
  const locationFilter = filters.location as string;
  scholarshipsList = scholarshipsList.filter(s => 
    s.location.toLowerCase() === locationFilter.toLowerCase()
  );
}
    
    // Filter by search query
    if (filters.q) {
      const query = filters.q.toLowerCase();
      scholarshipsList = scholarshipsList.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.provider.toLowerCase().includes(query) ||
        s.studyLevel.toLowerCase().includes(query)
      );
    }
    
    return scholarshipsList;
  } catch (err) {
    console.error('Error fetching scholarships:', err);
    return [];
  }
}

async function getStats(): Promise<Stats> {
  return unstable_cache(
    async () => {
      try {
        const allScholarships = await postService.getPostsByType('scholarship', 500);
        
        const total = allScholarships.length;
        const featured = allScholarships.filter(s => s.isFeatured).length;
        const abroad = allScholarships.filter(s => {
          const meta = s.meta;
          return getMetaValue<string>(meta, 'location', '') === 'abroad';
        }).length;
        const fullyFunded = allScholarships.filter(s => {
          const meta = s.meta;
          return getMetaValue<string>(meta, 'type', '').toLowerCase().includes('full');
        }).length;
        
        return { total, featured, abroad, fullyFunded };
      } catch {
        return { total: 0, featured: 0, abroad: 0, fullyFunded: 0 };
      }
    },
    ['scholarships-stats'],
    { revalidate: 86400, tags: ['scholarships-stats'] }
  )();
}

// ============ COMPONENTS ============
function FilterSidebar({ filters, buildUrl }: { filters: Filters; buildUrl: (key: string, value: string) => string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-200">
      <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-teal-600 rounded-full"></span>
        Filter Scholarships
      </h2>
      
      <div className="mb-6">
        <form action="/scholarships" method="GET" className="relative">
          <input
            type="text"
            name="q"
            defaultValue={filters.q}
            placeholder="Search scholarships..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </form>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Study Level</h3>
        <div className="space-y-1">
          {STUDY_LEVELS.map(level => (
            <Link
              key={level.slug}
              href={buildUrl('level', level.slug)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.level === level.slug ? 'bg-teal-600 text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span>{level.icon}</span>
              <span>{level.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Scholarship Type</h3>
        <div className="space-y-1">
          {SCHOLARSHIP_TYPES.map(type => (
            <Link
              key={type.slug}
              href={buildUrl('type', type.slug)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.type === type.slug ? 'bg-teal-600 text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Location</h3>
        <div className="space-y-1">
          {LOCATIONS.map(loc => (
            <Link
              key={loc.slug}
              href={buildUrl('location', loc.slug)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.location === loc.slug ? 'bg-teal-600 text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span>{loc.icon}</span>
              <span>{loc.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {(filters.level || filters.type || filters.location || filters.q) && (
        <Link href="/scholarships" className="block text-center text-sm text-teal-600 hover:text-teal-700 mt-4 pt-3 border-t">
          Clear all filters
        </Link>
      )}
    </div>
  );
}

function ScholarshipCard({ scholarship }: { scholarship: ScholarshipItem }) {
  const daysLeft = getDaysLeft(scholarship.deadline);
  const isOpen = daysLeft !== null && daysLeft > 0;
  const isUrgent = daysLeft !== null && daysLeft <= 7;
  
  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-teal-300 overflow-hidden group">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {scholarship.isFeatured && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">⭐ Featured</span>
              )}
              {isUrgent && isOpen && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium animate-pulse">🔴 Urgent</span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors">
              <Link href={`/scholarships/${scholarship.slug}`}>{scholarship.title}</Link>
            </h3>
            <p className="text-sm text-gray-500 mb-3">{scholarship.provider}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">{scholarship.studyLevel}</span>
              <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">{scholarship.type}</span>
              <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">{scholarship.location}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div>
                <div className="text-xs text-gray-500">Deadline</div>
                <div className="text-sm font-semibold text-gray-900">{formatDate(scholarship.deadline)}</div>
              </div>
              {daysLeft && (
                <div className={`text-right ${isUrgent ? 'text-red-600' : 'text-teal-600'}`}>
                  <div className="text-lg font-bold">{daysLeft}</div>
                  <div className="text-[10px]">days left</div>
                </div>
              )}
            </div>
          </div>
          <Link
            href={`/scholarships/${scholarship.slug}`}
            className="flex-shrink-0 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium"
          >
            View Details →
          </Link>
        </div>
      </div>
    </article>
  );
}

// ============ MAIN PAGE ============
export default async function ScholarshipsPage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams || {};
  
  const filters: Filters = {
    level: typeof params.level === 'string' ? params.level : '',
    type: typeof params.type === 'string' ? params.type : '',
    location: typeof params.location === 'string' ? params.location : '',
    q: typeof params.q === 'string' ? params.q : '',
  };

  const [scholarships, stats] = await Promise.all([
    getScholarships(filters),
    getStats(),
  ]);

  const buildUrl = (key: string, value: string): string => {
    const urlParams = new URLSearchParams();
    if (filters.level && key !== 'level') urlParams.set('level', filters.level);
    if (filters.type && key !== 'type') urlParams.set('type', filters.type);
    if (filters.location && key !== 'location') urlParams.set('location', filters.location);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (value) urlParams.set(key, value);
    return urlParams.toString() ? `/scholarships?${urlParams.toString()}` : '/scholarships';
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <meta httpEquiv="Cache-Control" content="public, s-maxage=86400, stale-while-revalidate=86400" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 py-12 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Scholarships <span className="text-yellow-400">2026</span>
            </h1>
            <p className="text-xl text-teal-100 mb-8">
              Find fully funded, partial, and merit-based scholarships for Pakistani students
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{stats.total}+</div>
                <div className="text-sm text-teal-200">Scholarships</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{stats.featured}</div>
                <div className="text-sm text-teal-200">Featured</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{stats.abroad}</div>
                <div className="text-sm text-teal-200">Abroad</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{stats.fullyFunded}</div>
                <div className="text-sm text-teal-200">Fully Funded</div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              <form action="/scholarships" method="GET" className="relative">
                <input
                  type="text"
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Search by name, provider, or study level..."
                  className="w-full pl-12 pr-32 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400/50 shadow-lg"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition">
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <aside className="lg:w-80 flex-shrink-0">
            <FilterSidebar filters={filters} buildUrl={buildUrl} />
          </aside>

          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {scholarships.length} Scholarships Found
              </h2>
              {filters.level && <p className="text-sm text-gray-500 mt-1">Level: {STUDY_LEVELS.find(l => l.slug === filters.level)?.name}</p>}
              {filters.type && <p className="text-sm text-gray-500">Type: {SCHOLARSHIP_TYPES.find(t => t.slug === filters.type)?.name}</p>}
            </div>

            <div className="space-y-4">
              {scholarships.length > 0 ? (
                scholarships.map((s) => <ScholarshipCard key={s.id} scholarship={s} />)
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                  <div className="text-6xl mb-4">🎓</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Scholarships Found</h3>
                  <p className="text-gray-500">Try adjusting your filters</p>
                  <Link href="/scholarships" className="inline-block mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">
                    View All Scholarships
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}