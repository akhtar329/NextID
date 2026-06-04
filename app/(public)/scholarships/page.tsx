// app/(public)/scholarships/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { postService } from '@/services/post/post.service';
import { unstable_cache } from 'next/cache';
import { 
  GraduationCap, 
  Calendar, 
  TrendingUp, 
  Search,
  ChevronRight,
  Award,
  MapPin,
  Clock,
  Zap,
  DollarSign,
  Globe
} from 'lucide-react';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';

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
  return value !== undefined && value !== null ? value : defaultValue;
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
      const meta = post.meta || {};
      
      let deadline: Date | null = null;
      const deadlineRaw = getMetaValue(meta, 'applicationDeadline', null);
      if (deadlineRaw && typeof deadlineRaw === 'string') {
        try {
          const parsed = new Date(deadlineRaw);
          if (!isNaN(parsed.getTime())) {
            deadline = parsed;
          }
        } catch {
          deadline = null;
        }
      }
      
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
        isFeatured: getMetaValue(meta, 'isFeatured', false),
        isPopular: getMetaValue(meta, 'isPopular', false),
        viewCount: getMetaValue(meta, 'viewCount', 0),
      };
    });
    
    scholarshipsList.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.getTime() - b.deadline.getTime();
    });
    
    if (filters.level && filters.level !== '') {
      const levelMap: Record<string, string[]> = {
        'matric': ['matric', 'ssc', 'secondary'],
        'inter': ['inter', 'intermediate', 'hssc', 'fa', 'fsc', 'ics'],
        'bs': ['bs', 'bachelor', 'bscs', 'bit', 'bba'],
        'ms': ['ms', 'master', 'masters', 'mphil', 'm.phil'],
        'phd': ['phd', 'doctorate', 'doctoral'],
      };
      const keywords = levelMap[filters.level] || [filters.level];
      scholarshipsList = scholarshipsList.filter(s =>
        keywords.some(kw => s.studyLevel.toLowerCase().includes(kw))
      );
    }
    
    if (filters.type && filters.type !== '') {
      scholarshipsList = scholarshipsList.filter(s => {
        const typeSlug = s.type.toLowerCase().replace(/ /g, '-');
        return typeSlug === filters.type;
      });
    }
    
    if (filters.location && filters.location !== '') {
      scholarshipsList = scholarshipsList.filter(s => 
        s.location.toLowerCase() === filters.location!.toLowerCase()
      );
    }
    
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
        const featured = allScholarships.filter(s => {
          const meta = s.meta || {};
          return getMetaValue(meta, 'isFeatured', false);
        }).length;
        const abroad = allScholarships.filter(s => {
          const meta = s.meta || {};
          return getMetaValue(meta, 'location', '').toLowerCase() === 'abroad';
        }).length;
        const fullyFunded = allScholarships.filter(s => {
          const meta = s.meta || {};
          return getMetaValue(meta, 'type', '').toLowerCase().includes('full');
        }).length;
        
        return { total, featured, abroad, fullyFunded };
      } catch (error) {
        console.error('Error fetching stats:', error);
        return { total: 0, featured: 0, abroad: 0, fullyFunded: 0 };
      }
    },
    ['scholarships-stats'],
    { revalidate: 86400, tags: ['scholarships-stats'] }
  )();
}

// ============ LOADING COMPONENT ============
function ScholarshipsLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:w-72 shrink-0">
        <div className="bg-white rounded-xl p-5 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="bg-white rounded-xl p-4 mb-4 animate-pulse"><div className="h-6 bg-gray-200 rounded w-48"></div></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-5 mb-4 animate-pulse">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="flex gap-2"><div className="h-6 bg-gray-200 rounded w-20"></div><div className="h-6 bg-gray-200 rounded w-20"></div></div>
              </div>
              <div className="w-24 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ SCHOLARSHIPS CONTENT COMPONENT ============
async function ScholarshipsContent({ searchParamsPromise }: { searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParamsPromise;
  
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
    <div className="flex flex-col lg:flex-row gap-8">
      
      {/* LEFT SIDEBAR - Filters */}
      <aside className="lg:w-72 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-100">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full"></div>
            Filter Scholarships
          </h2>
          
          {/* Search */}
          <div className="mb-6">
            <form action="/scholarships" method="GET" className="relative">
              <input 
                type="text" 
                name="q" 
                defaultValue={filters.q} 
                placeholder="Search scholarships..." 
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </form>
          </div>

          {/* Study Level */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Study Level</h3>
            <div className="space-y-1">
              {STUDY_LEVELS.map(level => (
                <Link 
                  key={level.slug} 
                  href={buildUrl('level', level.slug)} 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.level === level.slug 
                      ? 'bg-teal-600 text-white' 
                      : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <span>{level.icon}</span>
                  <span>{level.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Scholarship Type */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Scholarship Type</h3>
            <div className="space-y-1">
              {SCHOLARSHIP_TYPES.map(type => (
                <Link 
                  key={type.slug} 
                  href={buildUrl('type', type.slug)} 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.type === type.slug 
                      ? 'bg-teal-600 text-white' 
                      : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <span>{type.icon}</span>
                  <span>{type.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Location</h3>
            <div className="space-y-1">
              {LOCATIONS.map(loc => (
                <Link 
                  key={loc.slug} 
                  href={buildUrl('location', loc.slug)} 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.location === loc.slug 
                      ? 'bg-teal-600 text-white' 
                      : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <span>{loc.icon}</span>
                  <span>{loc.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {(filters.level || filters.type || filters.location || filters.q) && (
            <Link 
              href="/scholarships" 
              className="block text-center text-sm text-teal-600 hover:text-teal-700 mt-4 pt-3 border-t border-gray-100"
            >
              Clear all filters
            </Link>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1">
        
        {/* Stats Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-teal-500" />
              {scholarships.length} Scholarships Found
            </h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {stats.featured} Featured</span>
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {stats.abroad} Abroad</span>
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {stats.fullyFunded} Fully Funded</span>
            </div>
          </div>
          {filters.level && (
            <p className="text-sm text-gray-500 mt-2">Level: {STUDY_LEVELS.find(l => l.slug === filters.level)?.name}</p>
          )}
        </div>

        {/* Scholarships List */}
        <div className="space-y-4">
          {scholarships.length > 0 ? (
            scholarships.map((s) => {
              const daysLeft = getDaysLeft(s.deadline);
              const isOpen = daysLeft !== null && daysLeft > 0;
              const isUrgent = daysLeft !== null && daysLeft <= 7;
              return (
                <article key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all overflow-hidden group">
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        {/* Badges */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {s.isFeatured && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> Featured
                            </span>
                          )}
                          {s.isPopular && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                              <Zap className="w-3 h-3" /> Popular
                            </span>
                          )}
                          {isUrgent && isOpen && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1 animate-pulse">
                              <Clock className="w-3 h-3" /> Urgent
                            </span>
                          )}
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors">
                          <Link href={`/scholarships/${s.slug}`}>{s.title}</Link>
                        </h3>
                        
                        {/* Provider */}
                        <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {s.provider}
                        </p>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium">{s.studyLevel}</span>
                          <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium">{s.type}</span>
                          <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {s.location}
                          </span>
                          {s.amount && (
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1">
                              <DollarSign className="w-3 h-3" /> {s.amount}
                            </span>
                          )}
                        </div>
                        
                        {/* Deadline */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Deadline: <span className="font-medium text-gray-700">{formatDate(s.deadline)}</span></span>
                          </div>
                          {daysLeft && (
                            <div className={`text-right ${isUrgent ? 'text-red-600' : 'text-teal-600'}`}>
                              <div className="text-xs font-bold">{daysLeft} days left</div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <Link 
                        href={`/scholarships/${s.slug}`} 
                        className="flex-shrink-0 px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium inline-flex items-center gap-2"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
              <div className="text-6xl mb-4">🎓</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Scholarships Found</h3>
              <p className="text-gray-500">Try adjusting your filters to see more results</p>
              <Link href="/scholarships" className="inline-block mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">
                View All Scholarships
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* RIGHT SIDEBAR - Widgets */}
      <aside className="lg:w-72 flex-shrink-0">
        <div className="sticky top-24">
          <SidebarWidgets />
        </div>
      </aside>
      
    </div>
  );
}

// ============ MAIN PAGE ============
export default async function ScholarshipsPage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-teal-600 to-emerald-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-3xl text-center mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">Scholarships 2026</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Scholarships <span className="text-yellow-300">2026</span>
            </h1>
            <p className="text-lg text-teal-100">
              Find fully funded, partial, and merit-based scholarships for Pakistani students
            </p>
            
            {/* Hero Search */}
            <div className="max-w-2xl mx-auto mt-8">
              <form action="/scholarships" method="GET" className="relative">
                <input 
                  type="text" 
                  name="q" 
                  placeholder="Search by name, provider, or study level..." 
                  className="w-full pl-12 pr-32 py-4 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-yellow-400/50 shadow-lg" 
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button 
                  type="submit" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Suspense fallback={<ScholarshipsLoading />}>
          <ScholarshipsContent searchParamsPromise={searchParams || Promise.resolve({})} />
        </Suspense>
      </div>
    </main>
  );
}