// app/(public)/jobs/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import React from 'react';
import { postService } from '@/services/post/post.service';
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Clock, 
  Building2,
  GraduationCap,
  FileText,
  ExternalLink,
  ChevronLeft,
  TrendingUp,
  Zap,
  CheckCircle,
  Users,
  Mail
} from 'lucide-react';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';

// ============ TYPES ============
interface JobDetail {
  id: number;
  slug: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  company: string;
  location: string;
  jobType: string;
  salary: string | null;
  experience: string | null;
  deadline: Date | null;
  description: string | null;
  qualification: string | null;
  industry: string | null;
  officialLink: string | null;
  applicationLink: string | null;
  isFeatured: boolean;
  isUrgent: boolean;
  viewCount: number;
}

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

function formatShortDate(date: Date | null): string {
  if (!date) return 'TBA';
  return new Date(date).toLocaleDateString('en-PK', {
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

// ============ DATA FETCHING ============
async function getJobBySlug(slug: string): Promise<JobDetail | null> {
  try {
    const post = await postService.getPost(slug);
    
    if (!post || post.type !== 'job') {
      return null;
    }
    
    const meta = post.meta || {};
    const deadline = getMetaValue(meta, 'deadline', null) 
      ? new Date(getMetaValue(meta, 'deadline', '')) 
      : null;
    
    const daysLeft = getDaysLeft(deadline);
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      company: getMetaValue(meta, 'company', 'Company'),
      location: getMetaValue(meta, 'location', 'Pakistan'),
      jobType: getMetaValue(meta, 'jobType', 'Full Time'),
      salary: getMetaValue(meta, 'salary', null),
      experience: getMetaValue(meta, 'experience', null),
      deadline: deadline,
      description: post.content,
      qualification: getMetaValue(meta, 'qualification', null),
      industry: getMetaValue(meta, 'industry', null),
      officialLink: getMetaValue(meta, 'officialLink', null),
      applicationLink: getMetaValue(meta, 'applicationLink', null),
      isFeatured: getMetaValue(meta, 'isFeatured', false),
      isUrgent: daysLeft !== null && daysLeft <= 7 && daysLeft > 0,
      viewCount: getMetaValue(meta, 'viewCount', 0),
    };
  } catch (error) {
    console.error('Error fetching job detail:', error);
    return null;
  }
}

// ============ METADATA ============
function generateMetaTitle(job: JobDetail): string {
  return `${job.title} at ${job.company} - ${job.location} | NextID.pk`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) {
    return { title: 'Job Not Found', robots: { index: false } };
  }

  return {
    title: generateMetaTitle(job),
    description: job.excerpt || `Apply for ${job.title} position at ${job.company} in ${job.location}.`,
    alternates: { canonical: `https://www.nextid.pk/jobs/${job.slug}` },
  };
}

// ============ LOADING COMPONENT ============
function JobLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading job details...</p>
      </div>
    </div>
  );
}

// ============ JOB CONTENT COMPONENT ============
async function JobContent({ slugPromise }: { slugPromise: Promise<string> }) {
  const slug = await slugPromise;
  const job = await getJobBySlug(slug);
  
  if (!job) {
    notFound();
  }
  
  const daysLeft = getDaysLeft(job.deadline);
  const isOpen = daysLeft !== null && daysLeft > 0;
  const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  const getTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('full')) return 'bg-green-100 text-green-700';
    if (t.includes('part')) return 'bg-orange-100 text-orange-700';
    if (t.includes('remote')) return 'bg-purple-100 text-purple-700';
    if (t.includes('contract')) return 'bg-amber-100 text-amber-700';
    if (t.includes('intern')) return 'bg-pink-100 text-pink-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section - Professional */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            
            {/* Back Button */}
            <Link 
              href="/jobs" 
              className="inline-flex items-center gap-1 text-indigo-200 hover:text-white transition mb-6 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
              Back to Jobs
            </Link>
            
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {job.isFeatured && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-medium">
                  <TrendingUp className="w-3 h-3" /> Featured
                </span>
              )}
              {isUrgent && isOpen && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-medium animate-pulse">
                  <Zap className="w-3 h-3" /> Urgent Hiring
                </span>
              )}
              {!isOpen && job.deadline && (
                <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-xs font-medium">Closed</span>
              )}
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(job.jobType)}`}>
                <Briefcase className="w-3 h-3" /> {job.jobType}
              </span>
            </div>
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {job.title}
            </h1>
            
            {/* Company & Location */}
            <div className="flex flex-wrap gap-4 text-indigo-200 mb-6">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{job.company}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
            </div>
            
            {/* Info Cards */}
            <div className="flex flex-wrap gap-4">
              {job.salary && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-indigo-200 text-xs">Salary</div>
                  <div className="text-white font-semibold flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {job.salary}
                  </div>
                </div>
              )}
              {job.experience && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-indigo-200 text-xs">Experience</div>
                  <div className="text-white font-semibold flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {job.experience}
                  </div>
                </div>
              )}
              {job.deadline && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-indigo-200 text-xs">Deadline</div>
                  <div className={`font-semibold flex items-center gap-1 ${isUrgent && isOpen ? 'text-yellow-300' : 'text-white'}`}>
                    <Calendar className="w-4 h-4" />
                    {formatShortDate(job.deadline)}
                    {daysLeft && isOpen && <span className="text-xs">({daysLeft} days left)</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT COLUMN - Main Content */}
          <div className="lg:w-2/3 space-y-6">
            
            {/* Job Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Job Details
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-gray-500 text-xs mb-1">Company</div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-500" />
                      {job.company}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-gray-500 text-xs mb-1">Location</div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      {job.location}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-gray-500 text-xs mb-1">Job Type</div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-500" />
                      {job.jobType}
                    </div>
                  </div>
                  {job.industry && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-gray-500 text-xs mb-1">Industry</div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500" />
                        {job.industry}
                      </div>
                    </div>
                  )}
                  {job.qualification && (
                    <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                      <div className="text-gray-500 text-xs mb-1">Qualification</div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-500" />
                        {job.qualification}
                      </div>
                    </div>
                  )}
                </div>

                {/* Job Description */}
                {job.description && (
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      Job Description
                    </h3>
                    <div 
                      className="prose prose-sm max-w-none text-gray-600"
                      dangerouslySetInnerHTML={{ __html: job.description }}
                    />
                  </div>
                )}

                {/* Application Links */}
                {(job.applicationLink || job.officialLink) && (
                  <div className="border-t border-gray-100 pt-6 mt-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-500" />
                      How to Apply
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {job.applicationLink && (
                        <a 
                          href={job.applicationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold group"
                        >
                          Apply Now
                          <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                        </a>
                      )}
                      {job.officialLink && (
                        <a 
                          href={job.officialLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition group"
                        >
                          Company Website
                          <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="lg:w-1/3">
            <div className="sticky top-24 space-y-6">
              
              {/* Application Tips */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Application Tips
                  </h3>
                </div>
                <div className="p-5">
                  <ol className="space-y-3 text-sm text-gray-600">
                    <li className="flex gap-2">
                      <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span>Read the job description carefully</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span>Update your CV/Resume</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span>Write a tailored cover letter</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      <span>Submit before the deadline</span>
                    </li>
                  </ol>
                </div>
              </div>
              
              {/* Sidebar Widgets */}
              <SidebarWidgets />
            </div>
          </aside>
        </div>
      </div>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": job.title,
            "description": job.description?.substring(0, 500),
            "hiringOrganization": {
              "@type": "Organization",
              "name": job.company
            },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": job.location,
                "addressCountry": "PK"
              }
            },
            "employmentType": job.jobType,
            "datePosted": new Date().toISOString(),
            "validThrough": job.deadline?.toISOString(),
            "url": `https://www.nextid.pk/jobs/${job.slug}`
          })
        }}
      />
    </main>
  );
}

// ============ MAIN PAGE ============
export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slugPromise = params.then(p => p.slug);
  
  return (
    <Suspense fallback={<JobLoading />}>
      <JobContent slugPromise={slugPromise} />
    </Suspense>
  );
}