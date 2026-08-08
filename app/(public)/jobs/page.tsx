// app/(public)/jobs/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { postService } from '@/services/post/post.service';
import type { ExtendedPost } from '@/services/post/post.service';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Zap,
  Search,
  Filter,
  Building2,
  Calendar,
  Eye,
  ChevronRight,
  Twitter,
  Facebook,
  Linkedin,
  Mail
} from 'lucide-react';
import { generateJsonLd } from '@/lib/seo';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';

// ============ TYPES ============
interface JobItem {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  company: string;
  location: string;
  jobType: string;
  salary: string | null;
  experience: string | null;
  deadline: Date | null;
  isFeatured: boolean;
  isUrgent: boolean;
  viewCount: number;
  featuredImage: string | null;
}

interface Filters {
  jobType?: string;
  location?: string;
  experience?: string;
  q?: string;
  page?: number;
}

interface PaginatedResponse {
  jobs: JobItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface Stats {
  total: number;
  featured: number;
  urgent: number;
  fullTime: number;
  remote: number;
}

// ============ CONSTANTS ============
const ITEMS_PER_PAGE = 10;
const CURRENT_YEAR = '2026';
const REFERENCE_DATE = new Date('2024-01-01T00:00:00.000Z');

const JOB_TYPES = [
  { slug: '', name: 'All Types', icon: '💼' },
  { slug: 'full-time', name: 'Full Time', icon: '📅' },
  { slug: 'part-time', name: 'Part Time', icon: '⏰' },
  { slug: 'remote', name: 'Remote', icon: '🏠' },
  { slug: 'contract', name: 'Contract', icon: '📝' },
  { slug: 'internship', name: 'Internship', icon: '🎓' },
];

const LOCATIONS = [
  { slug: '', name: 'All Cities', icon: '🌍' },
  { slug: 'lahore', name: 'Lahore', icon: '🏛️' },
  { slug: 'karachi', name: 'Karachi', icon: '🌊' },
  { slug: 'islamabad', name: 'Islamabad', icon: '🏔️' },
  { slug: 'rawalpindi', name: 'Rawalpindi', icon: '🏔️' },
  { slug: 'multan', name: 'Multan', icon: '🏛️' },
  { slug: 'faisalabad', name: 'Faisalabad', icon: '🏛️' },
  { slug: 'remote', name: 'Remote', icon: '🏠' },
];

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
async function getAllJobs(): Promise<ExtendedPost[]> {
  try {
    const jobs = await postService.getList('job', 1000);
    return jobs || [];
  } catch (error) {
    console.error('Error fetching all jobs:', error);
    return [];
  }
}

async function getPaginatedJobs(filters: Filters): Promise<PaginatedResponse> {
  const currentPage = filters.page || 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  
  try {
    let allJobs = await getAllJobs();
    
    // Filter by search query
    if (filters.q) {
      const query = filters.q.toLowerCase();
      allJobs = allJobs.filter(job =>
        job.title.toLowerCase().includes(query) ||
        getMetaValue(job.meta, 'company', '').toLowerCase().includes(query) ||
        getMetaValue(job.meta, 'location', '').toLowerCase().includes(query)
      );
    }
    
    // Filter by job type
    if (filters.jobType && filters.jobType !== '') {
      allJobs = allJobs.filter(job => {
        const jobType = getMetaValue(job.meta, 'jobType', 'Full Time');
        const typeSlug = jobType.toLowerCase().replace(/ /g, '-');
        return typeSlug === filters.jobType;
      });
    }
    
    // Filter by location
    if (filters.location && filters.location !== '') {
      allJobs = allJobs.filter(job => 
        getMetaValue(job.meta, 'location', 'Pakistan').toLowerCase() === filters.location?.toLowerCase()
      );
    }
    
    const jobsList: JobItem[] = allJobs.map(job => {
      const meta = job.meta || {};
      const deadline = getMetaValue(meta, 'deadline', null) 
        ? new Date(getMetaValue(meta, 'deadline', '')) 
        : null;
      
      // ✅ FIXED: Use static reference date
      const daysLeft = getDaysLeftStatic(deadline, REFERENCE_DATE);
      
      return {
        id: job.id,
        slug: job.slug,
        title: job.title,
        excerpt: job.excerpt,
        company: getMetaValue(meta, 'company', 'Company'),
        location: getMetaValue(meta, 'location', 'Pakistan'),
        jobType: getMetaValue(meta, 'jobType', 'Full Time'),
        salary: getMetaValue(meta, 'salary', null),
        experience: getMetaValue(meta, 'experience', null),
        deadline: deadline,
        isFeatured: getMetaValue(meta, 'isFeatured', false),
        isUrgent: daysLeft !== null && daysLeft <= 7 && daysLeft > 0,
        viewCount: getMetaValue(meta, 'viewCount', 0),
        featuredImage: job.featuredImage || null,
      };
    });
    
    // Sort by deadline (closest first)
    jobsList.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.getTime() - b.deadline.getTime();
    });
    
    const totalCount = jobsList.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const paginatedJobs = jobsList.slice(offset, offset + ITEMS_PER_PAGE);
    
    return {
      jobs: paginatedJobs,
      totalCount,
      totalPages,
      currentPage,
    };
  } catch (error) {
    console.error('Error fetching paginated jobs:', error);
    return {
      jobs: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }
}

async function getStats(): Promise<Stats> {
  try {
    const allJobs = await getAllJobs();
    
    const total = allJobs.length;
    const featured = allJobs.filter(j => getMetaValue(j.meta, 'isFeatured', false)).length;
    // ✅ FIXED: Use static reference date
    const urgent = allJobs.filter(j => {
      const deadline = getMetaValue(j.meta, 'deadline', null);
      if (!deadline) return false;
      const daysLeft = getDaysLeftStatic(new Date(deadline), REFERENCE_DATE);
      return daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
    }).length;
    const fullTime = allJobs.filter(j => {
      const jobType = getMetaValue(j.meta, 'jobType', '');
      return jobType.toLowerCase().includes('full');
    }).length;
    const remote = allJobs.filter(j => {
      const jobType = getMetaValue(j.meta, 'jobType', '');
      const location = getMetaValue(j.meta, 'location', '');
      return jobType.toLowerCase().includes('remote') || location.toLowerCase() === 'remote';
    }).length;
    
    return { total, featured, urgent, fullTime, remote };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { total: 0, featured: 0, urgent: 0, fullTime: 0, remote: 0 };
  }
}

// ============ METADATA ============
export async function generateMetadata(): Promise<Metadata> {
  const allJobs = await getAllJobs();
  const totalJobs = allJobs.length;
  const currentYear = CURRENT_YEAR;
  
  return {
    title: `Jobs in Pakistan ${currentYear} | ${totalJobs}+ Latest Education & IT Jobs | NextID.pk`,
    description: `Find ${totalJobs}+ latest jobs in education, IT, management, and administration for ${currentYear}. Full time, part time, remote jobs for fresh and experienced professionals. Apply now!`,
    keywords: `jobs in Pakistan ${currentYear}, latest jobs ${currentYear}, education jobs, IT jobs, management jobs, fresh jobs, experienced jobs, Pakistan careers`,
    robots: 'index, follow',
    alternates: {
      canonical: 'https://www.nextid.pk/jobs',
      languages: {
        'en-US': 'https://www.nextid.pk/jobs',
      },
    },
    publisher: 'NextID.pk',
    authors: [{ name: 'NextID.pk' }],
    openGraph: {
      title: `Jobs in Pakistan ${currentYear} - Latest Career Opportunities | NextID.pk`,
      description: `Find thousands of jobs in education, IT, management, and administration. Apply online for the latest career opportunities.`,
      url: 'https://www.nextid.pk/jobs',
      siteName: 'NextID.pk',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Jobs in Pakistan' }],
      locale: 'en_PK',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Jobs in Pakistan ${currentYear} - Career Opportunities`,
      description: `Find the latest job opportunities in education, IT, and management sectors.`,
      images: ['/og-image.png'],
      site: '@nextidpk',
      creator: '@nextidpk',
    },
  };
}

// ============ PAGINATION COMPONENT ============
function Pagination({ currentPage, totalPages, buildUrl }: { 
  currentPage: number; 
  totalPages: number; 
  buildUrl: (key: string, value: string) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
  for (let i = startPage; i <= endPage; i++) pages.push(i);

  return (
    <div className="flex justify-center mt-8">
      <nav className="flex items-center gap-2 flex-wrap" aria-label="Pagination">
        {currentPage > 1 && (
          <Link href={buildUrl('page', String(currentPage - 1))} className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
            ← Previous
          </Link>
        )}
        {startPage > 1 && (
          <>
            <Link href={buildUrl('page', '1')} className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">1</Link>
            {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
          </>
        )}
        {pages.map(page => (
          <Link 
            key={page} 
            href={buildUrl('page', String(page))} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              page === currentPage 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {page}
          </Link>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
            <Link href={buildUrl('page', String(totalPages))} className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">{totalPages}</Link>
          </>
        )}
        {currentPage < totalPages && (
          <Link href={buildUrl('page', String(currentPage + 1))} className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
            Next →
          </Link>
        )}
      </nav>
    </div>
  );
}

// ============ LOADING COMPONENT ============
function JobsLoading() {
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

// ============ STATS CARDS ============
function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
        <div className="text-xs text-gray-500">Total Jobs</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-amber-600">{stats.featured}</div>
        <div className="text-xs text-gray-500">Featured</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
        <div className="text-xs text-gray-500">Urgent</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.fullTime}</div>
        <div className="text-xs text-gray-500">Full Time</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-purple-600">{stats.remote}</div>
        <div className="text-xs text-gray-500">Remote</div>
      </div>
    </div>
  );
}

// ============ JOBS CONTENT COMPONENT (SERVER) ============
async function JobsContent({ searchParamsPromise }: { searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await searchParamsPromise;
  
  const currentPage = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const filters: Filters = {
    jobType: typeof searchParams.jobType === 'string' ? searchParams.jobType : '',
    location: typeof searchParams.location === 'string' ? searchParams.location : '',
    experience: typeof searchParams.experience === 'string' ? searchParams.experience : '',
    q: typeof searchParams.q === 'string' ? searchParams.q : '',
    page: currentPage,
  };

  const [paginatedData, stats] = await Promise.all([
    getPaginatedJobs(filters),
    getStats(),
  ]);

  const { jobs, totalCount, totalPages, currentPage: page } = paginatedData;

  const buildUrl = (key: string, value: string): string => {
    const urlParams = new URLSearchParams();
    if (filters.jobType && key !== 'jobType') urlParams.set('jobType', filters.jobType);
    if (filters.location && key !== 'location') urlParams.set('location', filters.location);
    if (filters.experience && key !== 'experience') urlParams.set('experience', filters.experience);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (page !== 1 && key !== 'page') urlParams.set('page', page.toString());
    if (value) urlParams.set(key, value);
    return urlParams.toString() ? `/jobs?${urlParams.toString()}` : '/jobs';
  };

  const currentYear = CURRENT_YEAR;
  const shareUrl = 'https://www.nextid.pk/jobs';
  const shareTitle = `Jobs in ${currentYear} - Career Opportunities Pakistan`;

  const jsonLd = generateJsonLd({
    type: 'WebPage',
    title: `Jobs in ${currentYear} - Career Opportunities Pakistan`,
    description: `Find ${totalCount} latest job opportunities in education, IT, and management sectors`,
    url: 'https://www.nextid.pk/jobs',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Jobs', url: '/jobs' },
    ],
  });

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Jobs in Pakistan ${currentYear}`,
    "description": `List of ${totalCount} latest job opportunities in education, IT, and management sectors`,
    "numberOfItems": totalCount,
    "url": "https://www.nextid.pk/jobs",
    "itemListElement": jobs.slice(0, 10).map((job, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.nextid.pk/jobs/${job.slug}`,
      "name": job.title
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR - Filters */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-100">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              <Filter className="w-4 h-4 text-indigo-500" />
              Filter Jobs
            </h2>
            
            <div className="mb-6">
              <form action="/jobs" method="GET" className="relative">
                <input 
                  type="text" 
                  name="q" 
                  defaultValue={filters.q || ''} 
                  placeholder="Search jobs..." 
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Job Type</h3>
              <div className="space-y-1">
                {JOB_TYPES.map(type => (
                  <Link 
                    key={type.slug} 
                    href={buildUrl('jobType', type.slug)} 
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.jobType === type.slug 
                        ? 'bg-indigo-600 text-white' 
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
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {LOCATIONS.map(loc => (
                  <Link 
                    key={loc.slug} 
                    href={buildUrl('location', loc.slug)} 
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.location === loc.slug 
                        ? 'bg-indigo-600 text-white' 
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <span>{loc.icon}</span>
                    <span>{loc.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {(filters.jobType || filters.location || filters.experience || filters.q) && (
              <Link 
                href="/jobs" 
                className="block text-center text-sm text-indigo-600 hover:text-indigo-700 mt-4 pt-3 border-t border-gray-100"
              >
                Clear all filters
              </Link>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1">
          
          {/* Stats Cards */}
          <StatsCards stats={stats} />
          
          {/* Results Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-500" />
                Showing {jobs.length} of {totalCount} Jobs
              </h2>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Page {page} of {totalPages}</span>
              </div>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="bg-white rounded-xl shadow-sm p-3 mb-6 border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-gray-500 font-medium">Share this page:</span>
              <ShareButtons title={shareTitle} url={shareUrl} />
            </div>
          </div>

          <div className="space-y-4">
            {jobs.length > 0 ? (
              jobs.map((job) => {
                const daysLeft = getDaysLeftStatic(job.deadline, REFERENCE_DATE);
                const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
                const isExpired = daysLeft !== null && daysLeft <= 0;
                const displayName = job.company;
                
                const getTypeColor = (type: string) => {
                  const t = type.toLowerCase();
                  if (t.includes('full')) return 'bg-green-100 text-green-700';
                  if (t.includes('part')) return 'bg-orange-100 text-orange-700';
                  if (t.includes('remote')) return 'bg-purple-100 text-purple-700';
                  if (t.includes('contract')) return 'bg-amber-100 text-amber-700';
                  return 'bg-gray-100 text-gray-700';
                };
                
                return (
                  <article key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden group">
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          {/* Company Logo / Image */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                              {job.featuredImage ? (
                                <Image
                                  src={job.featuredImage}
                                  alt={job.company}
                                  width={40}
                                  height={40}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <span className="text-sm font-bold text-indigo-600">
                                  {getInitials(displayName)}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {job.isFeatured && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> Featured
                                  </span>
                                )}
                                {isUrgent && !isExpired && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1 animate-pulse">
                                    <Zap className="w-3 h-3" /> Urgent
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(job.jobType)}`}>
                                  {job.jobType}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                            <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
                          </h3>
                          
                          <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {job.company}
                          </p>
                          
                          <div className="flex flex-wrap gap-3 mb-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {job.location}
                            </span>
                            {job.salary && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5" /> {job.salary}
                              </span>
                            )}
                            {job.experience && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {job.experience}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" /> {job.viewCount.toLocaleString()} views
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Deadline: <span className="font-medium text-gray-700">{formatDateStatic(job.deadline)}</span></span>
                            </div>
                            {daysLeft && !isExpired && (
                              <div className={`text-right ${isUrgent ? 'text-red-600' : 'text-indigo-600'}`}>
                                <div className="text-xs font-bold">{daysLeft} days left</div>
                              </div>
                            )}
                            {isExpired && (
                              <div className="text-right text-gray-400 text-xs">Expired</div>
                            )}
                          </div>
                        </div>
                        
                        <Link 
                          href={`/jobs/${job.slug}`} 
                          className="flex-shrink-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium text-center whitespace-nowrap inline-flex items-center gap-1"
                        >
                          View Details <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
                <div className="text-6xl mb-4">💼</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Jobs Found</h3>
                <p className="text-gray-500">Try adjusting your filters to see more results</p>
                <Link href="/jobs" className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                  View All Jobs
                </Link>
              </div>
            )}
          </div>
          
          <Pagination currentPage={page} totalPages={totalPages} buildUrl={buildUrl} />
        </div>

        {/* RIGHT SIDEBAR - Widgets */}
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
export default async function JobsPage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const currentYear = CURRENT_YEAR;
  
  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Breadcrumbs UI */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-indigo-600 transition">Home</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">Jobs</span>
        </nav>
      </div>
      
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-3xl text-center mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm font-medium">Jobs in Pakistan {currentYear}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your <span className="text-yellow-300">Dream Job</span>
            </h1>
            <p className="text-lg text-indigo-100">
              Teaching, IT, Management, and Administrative positions across Pakistan
            </p>
            
            <div className="max-w-2xl mx-auto mt-8">
              <form action="/jobs" method="GET" className="relative">
                <input 
                  type="text" 
                  name="q" 
                  placeholder="Search by title, company, or location..." 
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
        <Suspense fallback={<JobsLoading />}>
          <JobsContent searchParamsPromise={searchParams || Promise.resolve({})} />
        </Suspense>
      </div>
    </main>
  );
}