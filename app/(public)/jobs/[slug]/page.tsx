// app/(public)/jobs/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { postService } from '@/services/post/post.service';

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

interface RelatedJob {
  id: number;
  slug: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  deadline: Date | null;
}

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
    month: 'long',
    year: 'numeric'
  });
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
      isFeatured: getMetaValue(meta, 'isFeatured', false),  // ✅ Fixed: from meta
      isUrgent: daysLeft !== null && daysLeft <= 7 && daysLeft > 0,
      viewCount: getMetaValue(meta, 'viewCount', 0),
    };
  } catch (error) {
    console.error('Error fetching job detail:', error);
    return null;
  }
}

async function getRelatedJobs(currentSlug: string): Promise<RelatedJob[]> {
  try {
    const allJobs = await postService.getPostsByType('job', 10);
    
    return allJobs
      .filter(post => post.slug !== currentSlug)
      .slice(0, 5)
      .map(post => {
        const meta = post.meta || {};
        const deadline = getMetaValue(meta, 'deadline', null) 
          ? new Date(getMetaValue(meta, 'deadline', '')) 
          : null;
        return {
          id: post.id,
          slug: post.slug,
          title: post.title,
          company: getMetaValue(meta, 'company', 'Company'),
          location: getMetaValue(meta, 'location', 'Pakistan'),
          jobType: getMetaValue(meta, 'jobType', 'Full Time'),
          deadline: deadline,
        };
      });
  } catch {
    return [];
  }
}

// ============ METADATA ============
function generateMetaTitle(job: JobDetail): string {
  return `${job.title} at ${job.company} - ${job.location} | NextID.pk`;
}

function generateMetaDescription(job: JobDetail): string {
  return `Apply for ${job.title} position at ${job.company} in ${job.location}. ${job.jobType} position. ${job.experience ? `Experience: ${job.experience}. ` : ''}Deadline: ${formatShortDate(job.deadline)}.`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) {
    return { title: 'Job Not Found', robots: { index: false } };
  }

  return {
    title: generateMetaTitle(job),
    description: generateMetaDescription(job),
    alternates: { canonical: `https://www.nextid.pk/jobs/${job.slug}` },
    openGraph: {
      title: job.title,
      description: generateMetaDescription(job),
      type: 'article',
    },
  };
}

// ============ MAIN PAGE ============
export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  
  if (!job) {
    notFound();
  }
  
  const relatedJobs = await getRelatedJobs(slug);
  const daysLeft = getDaysLeft(job.deadline);
  const isOpen = daysLeft !== null && daysLeft > 0;
  const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  const getTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('full')) return 'bg-green-100 text-green-700';
    if (t.includes('part')) return 'bg-orange-100 text-orange-700';
    if (t.includes('remote')) return 'bg-purple-100 text-purple-700';
    if (t.includes('contract')) return 'bg-yellow-100 text-yellow-700';
    if (t.includes('intern')) return 'bg-pink-100 text-pink-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            {/* Breadcrumbs */}
            <div className="text-sm text-blue-200 mb-4">
              <Link href="/" className="hover:text-white">Home</Link>
              {' / '}
              <Link href="/jobs" className="hover:text-white">Jobs</Link>
              {' / '}
              <span className="text-white">{job.title}</span>
            </div>
            
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {job.isFeatured && (
                <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-medium">⭐ Featured</span>
              )}
              {isUrgent && isOpen && (
                <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium animate-pulse">🔴 Urgent Hiring</span>
              )}
              {!isOpen && job.deadline && (
                <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-sm font-medium">Closed</span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(job.jobType)}`}>
                {job.jobType}
              </span>
            </div>
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {job.title}
            </h1>
            
            {/* Company */}
            <p className="text-xl text-blue-200 mb-4">
              at {job.company} • {job.location}
            </p>
            
            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-blue-200">
              {job.salary && (
                <div className="flex items-center gap-1">
                  <span>💰</span>
                  <span>{job.salary}</span>
                </div>
              )}
              {job.experience && (
                <div className="flex items-center gap-1">
                  <span>📅</span>
                  <span>Experience: {job.experience}</span>
                </div>
              )}
              {job.industry && (
                <div className="flex items-center gap-1">
                  <span>🏢</span>
                  <span>{job.industry}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-semibold text-gray-900">{job.company}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-semibold text-gray-900">{job.location}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Job Type</p>
                  <p className="font-semibold text-gray-900">{job.jobType}</p>
                </div>
                {job.salary && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Salary</p>
                    <p className="font-semibold text-gray-900">{job.salary}</p>
                  </div>
                )}
                {job.experience && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Experience Required</p>
                    <p className="font-semibold text-gray-900">{job.experience}</p>
                  </div>
                )}
                {job.qualification && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Qualification</p>
                    <p className="font-semibold text-gray-900">{job.qualification}</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Application Deadline</p>
                  <p className={`font-semibold ${isUrgent && isOpen ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(job.deadline)}
                    {daysLeft && isOpen && <span className="ml-2 text-sm">({daysLeft} days left)</span>}
                  </p>
                </div>
              </div>

              {job.description && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Job Description</h3>
                  <div 
                    className="prose prose-sm max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                </div>
              )}

              {(job.applicationLink || job.officialLink) && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <h3 className="font-semibold text-gray-900 mb-3">How to Apply</h3>
                  <div className="flex flex-wrap gap-3">
                    {job.applicationLink && (
                      <a 
                        href={job.applicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                      >
                        Apply Now →
                      </a>
                    )}
                    {job.officialLink && (
                      <a 
                        href={job.officialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                      >
                        Company Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="lg:w-80">
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>📝</span> Application Tips
              </h3>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Read the job description carefully</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Update your CV/Resume</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Write a tailored cover letter</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>Submit before the deadline</span>
                </li>
              </ol>
            </div>

            {relatedJobs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">Related Jobs</h3>
                <div className="space-y-3">
                  {relatedJobs.map((rel) => (
                    <Link key={rel.id} href={`/jobs/${rel.slug}`} className="block p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition">
                      <p className="font-medium text-gray-800 text-sm line-clamp-2">{rel.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{rel.company} • {rel.location}</p>
                      <p className="text-xs text-gray-400 mt-1">{rel.jobType}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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