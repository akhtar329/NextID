// app/(public)/jobs/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { postService } from '@/services/post/post.service';
import { unstable_cache } from 'next/cache';

export const revalidate = 86400;

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

const EXPERIENCE_LEVELS = [
  { slug: '', name: 'Any Experience' },
  { slug: 'fresh', name: 'Fresh Graduate' },
  { slug: '1-2-years', name: '1-2 Years' },
  { slug: '3-5-years', name: '3-5 Years' },
  { slug: '5-plus-years', name: '5+ Years' },
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

function getUrgencyLevel(daysLeft: number | null): 'urgent' | 'normal' | 'expired' {
  if (daysLeft === null) return 'normal';
  if (daysLeft <= 0) return 'expired';
  if (daysLeft <= 7) return 'urgent';
  return 'normal';
}

// ============ METADATA ============
export const metadata: Metadata = {
  title: 'Jobs in Pakistan 2026 | Latest Education & IT Jobs | NextID.pk',
  description: 'Find latest jobs in education, IT, management, and administration. Full time, part time, remote jobs for fresh and experienced professionals.',
};

// ============ DATA FETCHING ============
async function getJobs(filters: Filters): Promise<JobItem[]> {
  try {
    const allJobs = await postService.getPostsByType('job', 200);
    
    let jobsList: JobItem[] = allJobs.map(post => {
      const meta = post.meta;
      const deadline = getMetaValue(meta, 'deadline', null) 
        ? new Date(getMetaValue(meta, 'deadline', '')) 
        : null;
      
      const daysLeft = getDaysLeft(deadline);
      const urgency = getUrgencyLevel(daysLeft);
      
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
        isFeatured: post.isFeatured || false,
        isUrgent: urgency === 'urgent',
        viewCount: post.viewCount || 0,
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
    
    // Filter by experience
    if (filters.experience && filters.experience !== '') {
      jobsList = jobsList.filter(j => {
        if (!j.experience) return false;
        const expLower = j.experience.toLowerCase();
        switch (filters.experience) {
          case 'fresh':
            return expLower.includes('fresh') || expLower.includes('0') || expLower.includes('entry');
          case '1-2-years':
            return expLower.includes('1-2') || expLower.includes('1 year') || expLower.includes('2 year');
          case '3-5-years':
            return expLower.includes('3-5') || expLower.includes('3 year') || expLower.includes('4 year') || expLower.includes('5 year');
          case '5-plus-years':
            return expLower.includes('5+') || expLower.includes('5 year') || expLower.includes('6 year') || expLower.includes('7 year');
          default:
            return true;
        }
      });
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
        const featured = allJobs.filter(j => j.isFeatured).length;
        
        // Calculate urgent jobs (deadline within 7 days)
        const urgent = allJobs.filter(j => {
          const meta = j.meta;
          const deadline = getMetaValue(meta, 'deadline', null);
          if (!deadline) return false;
          const daysLeft = getDaysLeft(new Date(deadline));
          return daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
        }).length;
        
        const fullTime = allJobs.filter(j => {
          const meta = j.meta;
          return getMetaValue(meta, 'jobType', '').toLowerCase().includes('full');
        }).length;
        
        const remote = allJobs.filter(j => {
          const meta = j.meta;
          return getMetaValue(meta, 'jobType', '').toLowerCase().includes('remote') ||
                 getMetaValue(meta, 'location', '').toLowerCase() === 'remote';
        }).length;
        
        return { total, featured, urgent, fullTime, remote };
      } catch {
        return { total: 0, featured: 0, urgent: 0, fullTime: 0, remote: 0 };
      }
    },
    ['jobs-stats'],
    { revalidate: 86400, tags: ['jobs-stats'] }
  )();
}

// ============ COMPONENTS ============
function FilterSidebar({ filters, buildUrl }: { filters: Filters; buildUrl: (key: string, value: string) => string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-200">
      <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
        Filter Jobs
      </h2>
      
      <div className="mb-6">
        <form action="/jobs" method="GET" className="relative">
          <input
            type="text"
            name="q"
            defaultValue={filters.q}
            placeholder="Search jobs..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </form>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Job Type</h3>
        <div className="space-y-1">
          {JOB_TYPES.map(type => (
            <Link
              key={type.slug}
              href={buildUrl('jobType', type.slug)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.jobType === type.slug ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
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
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {LOCATIONS.map(loc => (
            <Link
              key={loc.slug}
              href={buildUrl('location', loc.slug)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.location === loc.slug ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span>{loc.icon}</span>
              <span>{loc.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Experience</h3>
        <div className="space-y-1">
          {EXPERIENCE_LEVELS.map(exp => (
            <Link
              key={exp.slug}
              href={buildUrl('experience', exp.slug)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.experience === exp.slug ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span>{exp.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {(filters.jobType || filters.location || filters.experience || filters.q) && (
        <Link href="/jobs" className="block text-center text-sm text-blue-600 hover:text-blue-700 mt-4 pt-3 border-t">
          Clear all filters
        </Link>
      )}
    </div>
  );
}

function JobCard({ job }: { job: JobItem }) {
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
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-blue-300 overflow-hidden group">
      <div className="p-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {job.isFeatured && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">⭐ Featured</span>
              )}
              {isUrgent && !isExpired && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium animate-pulse">🔴 Urgent</span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(job.jobType)}`}>
                {job.jobType}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
            </h3>
            <p className="text-sm text-gray-600 mb-2">{job.company}</p>
            <div className="flex flex-wrap gap-3 mb-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">📍 {job.location}</span>
              {job.salary && <span className="flex items-center gap-1">💰 {job.salary}</span>}
              {job.experience && <span className="flex items-center gap-1">📅 {job.experience}</span>}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div>
                <div className="text-xs text-gray-500">Application Deadline</div>
                <div className="text-sm font-semibold text-gray-900">{formatDate(job.deadline)}</div>
              </div>
              {daysLeft && !isExpired && (
                <div className={`text-right ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
                  <div className="text-lg font-bold">{daysLeft}</div>
                  <div className="text-[10px]">days left</div>
                </div>
              )}
              {isExpired && (
                <div className="text-right text-gray-400">
                  <div className="text-sm">Expired</div>
                </div>
              )}
            </div>
          </div>
          <Link
            href={`/jobs/${job.slug}`}
            className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium text-center"
          >
            View Details →
          </Link>
        </div>
      </div>
    </article>
  );
}

// ============ MAIN PAGE ============
export default async function JobsPage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams || {};
  
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

  return (
    <main className="min-h-screen bg-gray-50">
      <meta httpEquiv="Cache-Control" content="public, s-maxage=86400, stale-while-revalidate=86400" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 py-12 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Latest Jobs <span className="text-yellow-400">2026</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Find teaching, IT, management, and administrative jobs across Pakistan
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <div className="text-2xl font-bold">{stats.total}+</div>
                <div className="text-xs text-blue-200">Jobs</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <div className="text-2xl font-bold">{stats.featured}</div>
                <div className="text-xs text-blue-200">Featured</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <div className="text-2xl font-bold">{stats.urgent}</div>
                <div className="text-xs text-blue-200">Urgent</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <div className="text-2xl font-bold">{stats.fullTime}</div>
                <div className="text-xs text-blue-200">Full Time</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <div className="text-2xl font-bold">{stats.remote}</div>
                <div className="text-xs text-blue-200">Remote</div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              <form action="/jobs" method="GET" className="relative">
                <input
                  type="text"
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Search by title, company, or location..."
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
                {jobs.length} Jobs Found
              </h2>
              {filters.jobType && <p className="text-sm text-gray-500 mt-1">Type: {JOB_TYPES.find(t => t.slug === filters.jobType)?.name}</p>}
              {filters.location && <p className="text-sm text-gray-500">Location: {LOCATIONS.find(l => l.slug === filters.location)?.name}</p>}
            </div>

            <div className="space-y-4">
              {jobs.length > 0 ? (
                jobs.map((j) => <JobCard key={j.id} job={j} />)
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                  <div className="text-6xl mb-4">💼</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Jobs Found</h3>
                  <p className="text-gray-500">Try adjusting your filters</p>
                  <Link href="/jobs" className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    View All Jobs
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