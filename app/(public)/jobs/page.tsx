// app/(public)/jobs/page.tsx

export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import React from 'react';
import { postService } from '@/services/post/post.service';
import { unstable_cache } from 'next/cache';
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
  Eye
} from 'lucide-react';
import { generateJsonLd } from '@/lib/seo';

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
}

interface Filters {
  jobType?: string;
  location?: string;
  experience?: string;
  q?: string;
}

interface Stats {
  total: number;
  featured: number;
  urgent: number;
  fullTime: number;
  remote: number;
}

// ============ CONSTANTS ============
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

// ============ METADATA (Fixed - No new Date()) ============
export async function generateMetadata(): Promise<Metadata> {
  // ✅ Use static year
  const currentYear = "2026";
  const allJobs = await postService.getPostsByType('job', 200);
  const totalJobs = allJobs.length;
  
  return {
    title: `Jobs in Pakistan ${currentYear} | ${totalJobs}+ Latest Education & IT Jobs | NextID.pk`,
    description: `Find ${totalJobs}+ latest jobs in education, IT, management, and administration for ${currentYear}. Full time, part time, remote jobs for fresh and experienced professionals. Apply now!`,
    keywords: `jobs in Pakistan ${currentYear}, latest jobs ${currentYear}, education jobs, IT jobs, management jobs, fresh jobs, experienced jobs, Pakistan careers`,
    alternates: {
      canonical: 'https://www.nextid.pk/jobs',
    },
    openGraph: {
      title: `Jobs in Pakistan ${currentYear} - Latest Career Opportunities | NextID.pk`,
      description: `Find thousands of jobs in education, IT, management, and administration. Apply online for the latest career opportunities.`,
      url: 'https://www.nextid.pk/jobs',
      siteName: 'NextID.pk',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Jobs in Pakistan',
        },
      ],
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

// ============ DATA FETCHING ============
async function getJobs(filters: Filters): Promise<JobItem[]> {
  try {
    const allJobs = await postService.getPostsByType('job', 200);
    
    let jobsList: JobItem[] = allJobs.map(post => {
      const meta = post.meta || {};
      const deadline = getMetaValue(meta, 'deadline', null) 
        ? new Date(getMetaValue(meta, 'deadline', '')) 
        : null;
      
      const daysLeft = getDaysLeft(deadline);
      
      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        company: getMetaValue(meta, 'company', 'Company'),
        location: getMetaValue(meta, 'location', 'Pakistan'),
        jobType: getMetaValue(meta, 'jobType', 'Full Time'),
        salary: getMetaValue(meta, 'salary', null),
        experience: getMetaValue(meta, 'experience', null),
        deadline: deadline,
        isFeatured: getMetaValue(meta, 'isFeatured', false),
        isUrgent: daysLeft !== null && daysLeft <= 7 && daysLeft > 0,
        viewCount: getMetaValue(meta, 'viewCount', 0),
      };
    });
    
    // Sort by deadline (closest first)
    jobsList.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.getTime() - b.deadline.getTime();
    });
    
    // Filter by job type
    if (filters.jobType && filters.jobType !== '') {
      jobsList = jobsList.filter(j => {
        const typeSlug = j.jobType.toLowerCase().replace(/ /g, '-');
        return typeSlug === filters.jobType;
      });
    }
    
    // Filter by location
    if (filters.location && filters.location !== '') {
      jobsList = jobsList.filter(j => 
        j.location.toLowerCase() === filters.location?.toLowerCase()
      );
    }
    
    // Filter by search query
    if (filters.q) {
      const query = filters.q.toLowerCase();
      jobsList = jobsList.filter(j =>
        j.title.toLowerCase().includes(query) ||
        j.company.toLowerCase().includes(query) ||
        j.location.toLowerCase().includes(query)
      );
    }
    
    return jobsList;
  } catch (err) {
    console.error('Error fetching jobs:', err);
    return [];
  }
}

async function getStats(): Promise<Stats> {
  return unstable_cache(
    async () => {
      try {
        const allJobs = await postService.getPostsByType('job', 500);
        
        const total = allJobs.length;
        const featured = allJobs.filter(j => {
          const meta = j.meta || {};
          return getMetaValue(meta, 'isFeatured', false);
        }).length;
        const urgent = allJobs.filter(j => {
          const meta = j.meta || {};
          const deadline = getMetaValue(meta, 'deadline', null);
          if (!deadline) return false;
          const daysLeft = getDaysLeft(new Date(deadline));
          return daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
        }).length;
        const fullTime = allJobs.filter(j => {
          const meta = j.meta || {};
          return getMetaValue(meta, 'jobType', '').toLowerCase().includes('full');
        }).length;
        const remote = allJobs.filter(j => {
          const meta = j.meta || {};
          return getMetaValue(meta, 'jobType', '').toLowerCase().includes('remote') ||
                 getMetaValue(meta, 'location', '').toLowerCase() === 'remote';
        }).length;
        
        return { total, featured, urgent, fullTime, remote };
      } catch (error) {
        console.error('Error fetching stats:', error);
        return { total: 0, featured: 0, urgent: 0, fullTime: 0, remote: 0 };
      }
    },
    ['jobs-stats'],
    { revalidate: 86400, tags: ['jobs-stats'] }
  )();
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

// ============ JOBS CONTENT COMPONENT ============
async function JobsContent({ searchParamsPromise }: { searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParamsPromise;
  
  const filters: Filters = {
    jobType: typeof params.jobType === 'string' ? params.jobType : '',
    location: typeof params.location === 'string' ? params.location : '',
    experience: typeof params.experience === 'string' ? params.experience : '',
    q: typeof params.q === 'string' ? params.q : '',
  };

  const [jobs, stats] = await Promise.all([
    getJobs(filters),
    getStats(),
  ]);

  const buildUrl = (key: string, value: string): string => {
    const urlParams = new URLSearchParams();
    if (filters.jobType && key !== 'jobType') urlParams.set('jobType', filters.jobType);
    if (filters.location && key !== 'location') urlParams.set('location', filters.location);
    if (filters.experience && key !== 'experience') urlParams.set('experience', filters.experience);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (value) urlParams.set(key, value);
    return urlParams.toString() ? `/jobs?${urlParams.toString()}` : '/jobs';
  };

  // ✅ Use static year
  const currentYear = "2026";

  // ✅ Generate JSON-LD Structured Data for SEO
  const jsonLd = generateJsonLd({
    type: 'WebPage',
    title: `Jobs in ${currentYear} - Career Opportunities Pakistan`,
    description: `Find ${jobs.length} latest job opportunities in education, IT, and management sectors`,
    url: 'https://www.nextid.pk/jobs',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Jobs', url: '/jobs' },
    ],
  });

  // ✅ ItemList Schema for jobs listing
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Jobs in Pakistan ${currentYear}`,
    "description": `List of ${jobs.length} latest job opportunities in education, IT, and management sectors`,
    "numberOfItems": jobs.length,
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
      {/* ✅ JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR - Filters */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-100">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              <Filter className="w-4 h-4 text-indigo-500" />
              Filter Jobs
            </h2>
            
            {/* Search */}
            <div className="mb-6">
              <form action="/jobs" method="GET" className="relative">
                <input 
                  type="text" 
                  name="q" 
                  defaultValue={filters.q} 
                  placeholder="Search jobs..." 
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
            </div>

            {/* Job Type */}
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

            {/* Location */}
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

            {/* Clear Filters */}
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
          
          {/* Stats Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-500" />
                {jobs.length} Jobs Found
              </h2>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {stats.featured} Featured</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-red-500" /> {stats.urgent} Urgent</span>
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {stats.fullTime} Full Time</span>
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-4">
            {jobs.length > 0 ? (
              jobs.map((job) => {
                const daysLeft = getDaysLeft(job.deadline);
                const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
                const isExpired = daysLeft !== null && daysLeft <= 0;
                
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
                          {/* Badges */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                          
                          {/* Title */}
                          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                            <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
                          </h3>
                          
                          {/* Company */}
                          <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {job.company}
                          </p>
                          
                          {/* Details */}
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
                          
                          {/* Deadline */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Deadline: <span className="font-medium text-gray-700">{formatDate(job.deadline)}</span></span>
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
                        
                        {/* Action Button */}
                        <Link 
                          href={`/jobs/${job.slug}`} 
                          className="flex-shrink-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium text-center whitespace-nowrap"
                        >
                          View Details →
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
        </div>
      </div>
    </>
  );
}

// ============ MAIN PAGE ============
export default async function JobsPage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // ✅ Use static year
  const currentYear = "2026";
  
  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section - Professional */}
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
            
            {/* Hero Search */}
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

      {/* Content Container */}
      <div className="container mx-auto px-4 py-12">
        <Suspense fallback={<JobsLoading />}>
          <JobsContent searchParamsPromise={searchParams || Promise.resolve({})} />
        </Suspense>
      </div>
    </main>
  );
}