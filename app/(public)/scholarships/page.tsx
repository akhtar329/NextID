// app/(public)/scholarships/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { postService } from '@/services/post/post.service';
import type { ExtendedPost } from '@/services/post/post.service';
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
  Twitter,
  Facebook,
  Linkedin,
  Mail
} from 'lucide-react';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';
import { generateJsonLd } from '@/lib/seo';

// ============ CONSTANTS ============
const ITEMS_PER_PAGE = 10;
const CURRENT_YEAR = '2026';
const REFERENCE_DATE = new Date('2024-01-01T00:00:00.000Z');

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
  featuredImage: string | null;
}

interface Filters {
  level?: string;
  type?: string;
  location?: string;
  q?: string;
  page?: number;
}

interface PaginatedResponse {
  scholarships: ScholarshipItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface Stats {
  total: number;
  featured: number;
  abroad: number;
  fullyFunded: number;
}

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

// ✅ FIXED: Static date with reference
function formatDateStatic(date: Date | null): string {
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// ✅ FIXED: Get days left using reference date
function getDaysLeftStatic(deadline: Date | null, referenceDate: Date): number | null {
  if (!deadline) return null;
  const diffTime = deadline.getTime() - referenceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

// ============ SHARE BUTTONS ============
function ShareButtons({ title, url }: { title: string; url: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  
  return (
    <div className="flex gap-2">
      <a href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer nofollow"
        className="w-8 h-8 bg-black hover:bg-gray-800 text-white rounded-lg flex items-center justify-center transition">
        <Twitter className="w-4 h-4" />
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer nofollow"
        className="w-8 h-8 bg-blue-700 hover:bg-blue-800 text-white rounded-lg flex items-center justify-center transition">
        <Facebook className="w-4 h-4" />
      </a>
      <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer nofollow"
        className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition">
        <Linkedin className="w-4 h-4" />
      </a>
      <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
        className="w-8 h-8 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center transition">
        <Mail className="w-4 h-4" />
      </a>
    </div>
  );
}

// ============ DATA FETCHING ============
async function getAllScholarships(): Promise<ExtendedPost[]> {
  try {
    const scholarships = await postService.getList('scholarship', 1000);
    return scholarships || [];
  } catch (error) {
    console.error('Error fetching all scholarships:', error);
    return [];
  }
}

async function getStats(): Promise<Stats> {
  try {
    const allScholarships = await getAllScholarships();
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
}

async function getPaginatedScholarships(filters: Filters): Promise<PaginatedResponse> {
  try {
    const allScholarships = await getAllScholarships();
    
    let scholarshipsList: ScholarshipItem[] = allScholarships.map((post: ExtendedPost) => {
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
        featuredImage: post.featuredImage || null,
      };
    });
    
    // Sort by deadline (nearest first)
    scholarshipsList.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.getTime() - b.deadline.getTime();
    });
    
    // Apply filters
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
    
    const totalCount = scholarshipsList.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const currentPage = filters.page || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedScholarships = scholarshipsList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    return {
      scholarships: paginatedScholarships,
      totalCount,
      totalPages,
      currentPage,
    };
  } catch (error) {
    console.error('Error fetching paginated scholarships:', error);
    return {
      scholarships: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }
}

// ============ METADATA ============
export async function generateMetadata(): Promise<Metadata> {
  const allScholarships = await getAllScholarships();
  const totalScholarships = allScholarships.length;
  const currentYear = CURRENT_YEAR;
  
  const fullyFunded = allScholarships.filter(s => {
    const meta = s.meta || {};
    return getMetaValue(meta, 'type', '').toLowerCase().includes('full');
  }).length;
  
  return {
    title: `Scholarships ${currentYear} in Pakistan | ${totalScholarships}+ Fully Funded & Partial | NextID.pk`,
    description: `Find ${fullyFunded}+ fully funded and ${totalScholarships - fullyFunded}+ partial scholarships for Pakistani students ${currentYear}. Merit-based, need-based scholarships for Matric to PhD. Apply now!`,
    keywords: `scholarships ${currentYear}, scholarships in Pakistan, fully funded scholarships, merit scholarships, need-based scholarships, study abroad scholarships`,
    robots: 'index, follow',
    alternates: {
      canonical: 'https://www.nextid.pk/scholarships',
      languages: {
        'en-US': 'https://www.nextid.pk/scholarships',
      },
    },
    publisher: 'NextID.pk',
    authors: [{ name: 'NextID.pk' }],
    openGraph: {
      title: `Scholarships ${currentYear} Pakistan - Fully Funded & Partial | NextID.pk`,
      description: `Find ${totalScholarships}+ scholarships for Pakistani students including fully funded, merit-based, and need-based opportunities.`,
      url: 'https://www.nextid.pk/scholarships',
      siteName: 'NextID.pk',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Scholarships in Pakistan' }],
      locale: 'en_PK',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Scholarships ${currentYear} Pakistan`,
      description: `Find the best scholarship opportunities for Pakistani students. Apply now for fully funded and partial scholarships.`,
      images: ['/og-image.png'],
      site: '@nextidpk',
      creator: '@nextidpk',
    },
  };
}

// ============ PAGINATION COMPONENT ============
function Pagination({ currentPage, totalPages, baseUrl, filters }: { 
  currentPage: number; 
  totalPages: number; 
  baseUrl: string;
  filters: Filters;
}) {
  if (totalPages <= 1) return null;
  
  const buildPageUrl = (page: number): string => {
    const urlParams = new URLSearchParams();
    if (filters.level && filters.level !== '') urlParams.set('level', filters.level);
    if (filters.type && filters.type !== '') urlParams.set('type', filters.type);
    if (filters.location && filters.location !== '') urlParams.set('location', filters.location);
    if (filters.q) urlParams.set('q', filters.q);
    if (page > 1) urlParams.set('page', page.toString());
    return urlParams.toString() ? `${baseUrl}?${urlParams.toString()}` : baseUrl;
  };
  
  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return (
    <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
      <Link
        href={buildPageUrl(currentPage - 1)}
        className={`px-3 py-2 rounded-lg border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
      >
        Previous
      </Link>
      
      {startPage > 1 && (
        <>
          <Link href={buildPageUrl(1)} className="px-3 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50">1</Link>
          {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
        </>
      )}
      
      {pages.map(page => (
        <Link
          key={page}
          href={buildPageUrl(page)}
          className={`px-3 py-2 rounded-lg border ${currentPage === page ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          {page}
        </Link>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
          <Link href={buildPageUrl(totalPages)} className="px-3 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50">
            {totalPages}
          </Link>
        </>
      )}
      
      <Link
        href={buildPageUrl(currentPage + 1)}
        className={`px-3 py-2 rounded-lg border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
      >
        Next
      </Link>
    </div>
  );
}

// ============ STATS CARDS ============
function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-teal-600">{stats.total}</div>
        <div className="text-xs text-gray-500">Total Scholarships</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-amber-600">{stats.featured}</div>
        <div className="text-xs text-gray-500">Featured</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.abroad}</div>
        <div className="text-xs text-gray-500">Abroad</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.fullyFunded}</div>
        <div className="text-xs text-gray-500">Fully Funded</div>
      </div>
    </div>
  );
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
    page: typeof params.page === 'string' ? parseInt(params.page) : 1,
  };

  const [paginatedData, stats] = await Promise.all([
    getPaginatedScholarships(filters),
    getStats(),
  ]);

  const { scholarships, totalCount, totalPages, currentPage } = paginatedData;

  const buildUrl = (key: string, value: string): string => {
    const urlParams = new URLSearchParams();
    if (filters.level && filters.level !== '' && key !== 'level') urlParams.set('level', filters.level);
    if (filters.type && filters.type !== '' && key !== 'type') urlParams.set('type', filters.type);
    if (filters.location && filters.location !== '' && key !== 'location') urlParams.set('location', filters.location);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (currentPage !== 1 && key !== 'page') urlParams.set('page', currentPage.toString());
    if (value) urlParams.set(key, value);
    return urlParams.toString() ? `/scholarships?${urlParams.toString()}` : '/scholarships';
  };

  const currentYear = CURRENT_YEAR;
  const shareUrl = 'https://www.nextid.pk/scholarships';
  const shareTitle = `Scholarships ${currentYear} - Study Opportunities for Pakistani Students`;
  
  const jsonLd = generateJsonLd({
    type: 'WebPage',
    title: `Scholarships ${currentYear} - Study Opportunities for Pakistani Students`,
    description: `Find ${totalCount} scholarship opportunities for Pakistani students`,
    url: 'https://www.nextid.pk/scholarships',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Scholarships', url: '/scholarships' },
    ],
  });
  
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Scholarships ${currentYear} for Pakistani Students`,
    "description": `List of ${totalCount} scholarship opportunities including fully funded and partial scholarships`,
    "numberOfItems": totalCount,
    "url": "https://www.nextid.pk/scholarships",
    "itemListElement": scholarships.slice(0, 10).map((scholarship, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.nextid.pk/scholarships/${scholarship.slug}`,
      "name": scholarship.title
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      
      {/* ✅ Breadcrumbs UI */}
      <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-teal-600 transition">Home</Link>
        <span>›</span>
        <span className="text-gray-700 font-medium">Scholarships</span>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR - Filters */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-100">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full"></div>
              Filter Scholarships
            </h2>
            
            <div className="mb-6">
              <form action="/scholarships" method="GET" className="relative">
                <input 
                  type="text" 
                  name="q" 
                  defaultValue={filters.q || ''} 
                  placeholder="Search scholarships..." 
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
            </div>

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
          
          {/* ✅ Stats Cards */}
          <StatsCards stats={stats} />
          
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-teal-500" />
                Showing {scholarships.length} of {totalCount} Scholarships
              </h2>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>
          </div>

          {/* ✅ Share Buttons */}
          <div className="bg-white rounded-xl shadow-sm p-3 mb-4 border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-gray-500 font-medium">Share this page:</span>
              <ShareButtons title={shareTitle} url={shareUrl} />
            </div>
          </div>

          <div className="space-y-4">
            {scholarships.length > 0 ? (
              scholarships.map((s) => {
                const daysLeft = getDaysLeftStatic(s.deadline, REFERENCE_DATE);
                const isOpen = daysLeft !== null && daysLeft > 0;
                const isUrgent = daysLeft !== null && daysLeft <= 7;
                const displayName = s.provider;
                
                return (
                  <article key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all overflow-hidden group">
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          {/* ✅ Image with Fallback */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                              {s.featuredImage ? (
                                <Image
                                  src={s.featuredImage}
                                  alt={s.provider}
                                  width={40}
                                  height={40}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <span className="text-sm font-bold text-teal-600">
                                  {getInitials(displayName)}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
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
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors">
                            <Link href={`/scholarships/${s.slug}`}>{s.title}</Link>
                          </h3>
                          
                          <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {s.provider}
                          </p>
                          
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
                            <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium flex items-center gap-1">
                              👁️ {s.viewCount.toLocaleString()} views
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Deadline: <span className="font-medium text-gray-700">{formatDateStatic(s.deadline)}</span></span>
                            </div>
                            {daysLeft && isOpen && (
                              <div className={`text-right ${isUrgent ? 'text-red-600' : 'text-teal-600'}`}>
                                <div className="text-xs font-bold">{daysLeft} days left</div>
                              </div>
                            )}
                          </div>
                        </div>
                        
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
          
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            baseUrl="/scholarships" 
            filters={filters}
          />
        </div>
        
        <aside className="lg:w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <Suspense fallback={<div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-64"></div>}>
              <SidebarWidgets />
            </Suspense>
          </div>
        </aside>
        
      </div>
    </>
  );
}

// ============ MAIN PAGE ============
export default async function ScholarshipsPage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const currentYear = CURRENT_YEAR;
  
  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* ✅ Breadcrumbs UI */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-teal-600 transition">Home</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">Scholarships</span>
        </nav>
      </div>
      
      <div className="relative bg-gradient-to-r from-teal-600 to-emerald-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-3xl text-center mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">Scholarships {currentYear}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Scholarships <span className="text-yellow-300">{currentYear}</span>
            </h1>
            <p className="text-lg text-teal-100">
              Find fully funded, partial, and merit-based scholarships for Pakistani students
            </p>
            
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