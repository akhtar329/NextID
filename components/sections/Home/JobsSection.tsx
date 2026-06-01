// components/sections/Home/JobsSection.tsx

import Link from 'next/link';
import { postService } from '@/services/post/post.service';
import type { Post } from '@/repositories/post/post.repository';
import { unstable_cache } from 'next/cache';

// Types
interface Job {
  id: number;
  title: string;
  slug: string;
  company: string;
  location: string;
  jobType: string;
  salary: string | null;
  experience: string | null;
  deadline: Date | null;
  description: string | null;
  isFeatured: boolean;
  viewCount: number;
}

// Helper
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined ? value : defaultValue;
}

// Get jobs from posts service
async function getJobsFromPosts(): Promise<Job[]> {
  try {
    const posts = await postService.getPostsByType('job', 5);
    
    const jobs: Job[] = posts.map((post: Post) => {
      const deadline = getMetaValue(post.meta, 'deadline', null) 
        ? new Date(getMetaValue(post.meta, 'deadline', '')) 
        : null;
      
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        company: getMetaValue(post.meta, 'company', 'Company'),
        location: getMetaValue(post.meta, 'location', 'Pakistan'),
        jobType: getMetaValue(post.meta, 'jobType', 'Full Time'),
        salary: getMetaValue(post.meta, 'salary', null),
        experience: getMetaValue(post.meta, 'experience', null),
        deadline: deadline,
        description: post.excerpt || post.content,
        isFeatured: post.isFeatured || false,
        viewCount: post.viewCount || 0,
      };
    });
    
    return jobs.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.getTime() - b.deadline.getTime();
    });
    
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
}

const getCachedJobs = unstable_cache(
  getJobsFromPosts,
  ['home-jobs-posts'],
  { revalidate: 300, tags: ['jobs-home'] }
);

function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  try {
    return date.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Date TBA';
  }
}

function getDaysLeft(date: Date | null): number | null {
  if (!date) return null;
  try {
    const deadline = new Date(date);
    const now = new Date();
    deadline.setHours(23, 59, 59, 999);
    now.setHours(23, 59, 59, 999);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  } catch {
    return null;
  }
}

// Simple Stats Row
function StatsRow({ total, urgent, featured }: { total: number; urgent: number; featured: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
        <span className="text-xl">💼</span>
        <span className="text-sm font-semibold text-blue-700">{total} Total Jobs</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full">
        <span className="text-xl">⚡</span>
        <span className="text-sm font-semibold text-red-700">{urgent} Urgent Hiring</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full">
        <span className="text-xl">⭐</span>
        <span className="text-sm font-semibold text-amber-700">{featured} Featured Jobs</span>
      </div>
    </div>
  );
}

// Job Row Component - Table Style
function JobRow({ job, index }: { job: Job; index: number }) {
  const daysLeft = getDaysLeft(job.deadline);
  const isUrgent = daysLeft !== null && daysLeft <= 7;
  
  return (
    <Link href={`/jobs/${job.slug}`} className="block group">
      <div className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-300 ${index === 0 ? 'bg-gradient-to-r from-blue-50/30 to-transparent' : ''}`}>
        <div className="py-4 px-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            
            {/* Left - Job Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {job.isFeatured && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    ⭐ Featured
                  </span>
                )}
                {isUrgent && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded animate-pulse">
                    🔴 Urgent
                  </span>
                )}
                <span className="text-[10px] text-gray-400">Job ID: {job.id}</span>
              </div>
              <h3 className="text-base md:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {job.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {job.company}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {job.experience || 'Experience not specified'}
                </span>
              </div>
            </div>
            
            {/* Middle - Job Type & Salary */}
            <div className="md:w-48">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${
                  job.jobType === 'Full Time' ? 'bg-green-50 text-green-700' :
                  job.jobType === 'Part Time' ? 'bg-orange-50 text-orange-700' :
                  job.jobType === 'Remote' ? 'bg-purple-50 text-purple-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  {job.jobType}
                </span>
                {job.salary && (
                  <span className="text-xs font-medium text-gray-700">{job.salary}</span>
                )}
              </div>
            </div>
            
            {/* Right - Deadline & Action */}
            <div className="md:w-48 flex items-center justify-between gap-4">
              <div className="text-center">
                <div className="text-[10px] text-gray-400">Deadline</div>
                <div className={`text-sm font-semibold ${isUrgent ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatDate(job.deadline)}
                </div>
                {daysLeft && (
                  <div className={`text-[9px] ${isUrgent ? 'text-red-500' : 'text-gray-400'}`}>
                    {daysLeft} days left
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                <div className={`flex items-center gap-1 text-xs font-medium ${isUrgent ? 'text-red-600' : 'text-blue-600'} group-hover:gap-2 transition-all`}>
                  <span>Apply</span>
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </Link>
  );
}

// Main Component
export default async function JobsSection() {
  const jobs = await getCachedJobs();

  if (!jobs.length) {
    return null;
  }

  const totalJobs = jobs.length;
  const urgentCount = jobs.filter(j => {
    const days = getDaysLeft(j.deadline);
    return days !== null && days <= 7;
  }).length;
  const featuredCount = jobs.filter(j => j.isFeatured).length;

  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Section Header - Different Style */}
        <div className="border-l-4 border-blue-500 pl-4 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">💼</span>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Career Opportunities</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Latest Job Openings
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Find teaching, administrative, and corporate jobs across Pakistan
          </p>
        </div>
        
        {/* Stats Row - Different from other sections */}
        <StatsRow total={totalJobs} urgent={urgentCount} featured={featuredCount} />
        
        {/* Jobs Table Header */}
        <div className="hidden md:block bg-gray-50 rounded-t-xl px-2 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Position & Company</span>
            </div>
            <div className="md:w-48">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type & Salary</span>
            </div>
            <div className="md:w-48">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</span>
            </div>
          </div>
        </div>
        
        {/* Jobs List */}
        <div className="divide-y divide-gray-100">
          {jobs.map((job, index) => (
            <JobRow key={job.id} job={job} index={index} />
          ))}
        </div>
        
        {/* View All Link */}
        <div className="text-center mt-8">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-blue-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-600 hover:text-white transition-all group"
          >
            <span>Browse All Jobs</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-xs text-gray-400 mt-3">
            New jobs added daily in education and corporate sectors
          </p>
        </div>
        
      </div>
    </section>
  );
}