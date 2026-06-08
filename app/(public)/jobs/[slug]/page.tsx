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
  Mail,
  AlertCircle
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
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  featuredImage: string | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
}

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

function getSeoField<T>(obj: Record<string, unknown>, key: string): T | null {
  const value = obj[key];
  return value !== undefined && value !== null ? (value as T) : null;
}

function formatShortDate(date: Date | null): string {
  if (!date) return 'TBA';
  return new Date(date).toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
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

// Parse salary for schema
function parseSalaryForSchema(salary: string | null): { min?: number; max?: number; currency?: string } {
  if (!salary) return {};
  
  const result: { min?: number; max?: number; currency?: string } = {};
  result.currency = 'PKR';
  
  // Check for range like "50,000 - 80,000"
  const rangeMatch = salary.match(/(\d[\d,]*)\s*[-–—]\s*(\d[\d,]*)/);
  if (rangeMatch) {
    result.min = parseInt(rangeMatch[1].replace(/,/g, ''));
    result.max = parseInt(rangeMatch[2].replace(/,/g, ''));
  } else {
    // Single amount
    const amountMatch = salary.match(/(\d[\d,]*)/);
    if (amountMatch) {
      result.min = parseInt(amountMatch[1].replace(/,/g, ''));
    }
  }
  
  return result;
}

// ============ DATA FETCHING ============
async function getJobBySlug(slug: string): Promise<JobDetail | null> {
  try {
    const post = await postService.getPost(slug);
    
    if (!post || post.type !== 'job') {
      return null;
    }
    
    const meta = post.meta || {};
    const seoPost = post as unknown as Record<string, unknown>;
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
      metaTitle: getSeoField<string>(seoPost, 'metaTitle'),
      metaDescription: getSeoField<string>(seoPost, 'metaDescription'),
      metaKeywords: getSeoField<string>(seoPost, 'metaKeywords'),
      canonicalUrl: getSeoField<string>(seoPost, 'canonicalUrl'),
      robots: getSeoField<string>(seoPost, 'robots'),
      ogTitle: getSeoField<string>(seoPost, 'ogTitle'),
      ogDescription: getSeoField<string>(seoPost, 'ogDescription'),
      ogImage: getSeoField<string>(seoPost, 'ogImage') || getSeoField<string>(seoPost, 'featuredImage'),
      twitterTitle: getSeoField<string>(seoPost, 'twitterTitle'),
      twitterDescription: getSeoField<string>(seoPost, 'twitterDescription'),
      featuredImage: getSeoField<string>(seoPost, 'featuredImage'),
      publishedAt: seoPost.publishedAt as Date | null,
      updatedAt: seoPost.updatedAt as Date | null,
    };
  } catch (error) {
    console.error('Error fetching job detail:', error);
    return null;
  }
}

// ============ METADATA (IMPROVED) ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) {
    return {
      title: 'Job Not Found | NextID.pk',
      description: 'The requested job could not be found.',
      robots: { index: false },
    };
  }

  const daysLeft = getDaysLeft(job.deadline);
  const urgencyText = daysLeft && daysLeft <= 7 ? `Apply urgently! ${daysLeft} days left. ` : '';
  
  // ✅ IMPROVED: Better SEO title with urgency
  const seoTitle = job.metaTitle || 
    `${job.title} at ${job.company} | ${job.location} | ${job.jobType} Job ${job.deadline && daysLeft && daysLeft > 0 ? `Apply by ${formatShortDate(job.deadline)}` : ''} | NextID.pk`;
  
  // ✅ IMPROVED: Better meta description
  const seoDescription = job.metaDescription || 
    `${urgencyText}Apply for ${job.title} position at ${job.company} in ${job.location}. ${job.jobType} position. ${job.salary ? `Salary: ${job.salary}. ` : ''}${job.qualification ? `Qualification required: ${job.qualification}. ` : ''}Apply online now.`;
  
  const seoKeywords = job.metaKeywords || 
    `${job.title}, ${job.company} jobs, ${job.location} jobs, ${job.jobType} jobs, Pakistan careers, ${job.industry || ''} jobs`;
  
  const canonicalUrl = job.canonicalUrl || `https://www.nextid.pk/jobs/${job.slug}`;
  const robots = job.robots || 'index, follow';
  
  const robotsObj = {
    index: robots.includes('index'),
    follow: robots.includes('follow'),
  };
  
  const ogTitle = job.ogTitle || seoTitle;
  const ogDescription = job.ogDescription || seoDescription;
  const ogImage = job.ogImage || job.featuredImage || '/og-image.png';
  
  const twitterTitle = job.twitterTitle || ogTitle;
  const twitterDescription = job.twitterDescription || ogDescription;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    metadataBase: new URL('https://www.nextid.pk'),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: robotsObj,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      siteName: 'NextID.pk',
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
      locale: 'en_PK',
      type: 'article',
      publishedTime: job.publishedAt?.toISOString(),
      modifiedTime: job.updatedAt?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: twitterTitle,
      description: twitterDescription,
      images: [ogImage],
      site: '@nextidpk',
      creator: '@nextidpk',
    },
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

// ============ JOB CONTENT COMPONENT (IMPROVED) ============
function JobContent({ jobPromise }: { jobPromise: Promise<JobDetail | null> }) {
  const job = React.use(jobPromise);
  
  if (!job) return null;
  
  const daysLeft = getDaysLeft(job.deadline);
  const isOpen = daysLeft !== null && daysLeft > 0;
  const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  
  // Parse salary for schema
  const salaryData = parseSalaryForSchema(job.salary);

  const getTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('full')) return 'bg-green-100 text-green-700';
    if (t.includes('part')) return 'bg-orange-100 text-orange-700';
    if (t.includes('remote')) return 'bg-purple-100 text-purple-700';
    if (t.includes('contract')) return 'bg-amber-100 text-amber-700';
    if (t.includes('intern')) return 'bg-pink-100 text-pink-700';
    return 'bg-gray-100 text-gray-700';
  };

  // ✅ Create SEO description for hidden div
  const metaDescriptionText = job.excerpt || 
    `Apply for ${job.title} at ${job.company} in ${job.location}. ${job.jobType} position. ${job.salary ? `Salary: ${job.salary}.` : ''} Deadline: ${formatShortDate(job.deadline)}.`;

  // ✅ IMPROVED: Complete JobPosting Schema
  const jobPostingSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description?.substring(0, 1000) || job.excerpt,
    "datePosted": job.publishedAt?.toISOString(),
    "validThrough": job.deadline?.toISOString(),
    "employmentType": job.jobType.toUpperCase().includes('FULL') ? "FULL_TIME" : 
                       job.jobType.toUpperCase().includes('PART') ? "PART_TIME" :
                       job.jobType.toUpperCase().includes('CONTRACT') ? "CONTRACTOR" :
                       job.jobType.toUpperCase().includes('REMOTE') ? "REMOTE" : "OTHER",
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company,
      "logo": `https://www.nextid.pk/images/companies/${job.company.toLowerCase().replace(/\s+/g, '-')}.png`,
      "sameAs": job.officialLink || undefined
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location,
        "addressCountry": "PK"
      }
    },
    "jobLocationType": job.jobType.toLowerCase().includes('remote') ? "TELECOMMUTE" : "ONSITE",
    ...(salaryData.min && {
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": salaryData.currency || "PKR",
        "value": {
          "@type": "QuantitativeValue",
          "minValue": salaryData.min,
          "maxValue": salaryData.max || salaryData.min,
          "unitText": "MONTH"
        }
      }
    }),
    "qualifications": job.qualification,
    "experienceRequirements": job.experience,
    "industry": job.industry,
    "url": `https://www.nextid.pk/jobs/${job.slug}`,
    "identifier": {
      "@type": "PropertyValue",
      "name": "Job ID",
      "value": job.id.toString()
    }
  };
  
  // ✅ Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.nextid.pk/" },
      { "@type": "ListItem", "position": 2, "name": "Jobs", "item": "https://www.nextid.pk/jobs" },
      { "@type": "ListItem", "position": 3, "name": job.title, "item": `https://www.nextid.pk/jobs/${job.slug}` }
    ]
  };

  return (
    <>
      {/* ✅ JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      
      <main className="min-h-screen bg-gray-50">
        
        {/* Hero Section */}
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
              
              {/* ✅ H1 - IMPROVED */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {job.title}
              </h1>
              
              {/* ✅ Hidden SEO description */}
              <div className="hidden" aria-hidden="true">
                {metaDescriptionText}
              </div>
              
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
            
            {/* ✅ LEFT COLUMN - MAIN CONTENT (Comes first for SEO) */}
            <div className="lg:w-2/3 space-y-6">
              
              {/* ✅ Apply Now Button - Prominent placement */}
              {(job.applicationLink || job.officialLink) && isOpen && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-green-800 mb-3 flex items-center justify-center gap-2">
                      <Mail className="w-5 h-5" />
                      Apply for this Position
                    </h2>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {job.applicationLink && (
                        <a 
                          href={job.applicationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold text-lg group"
                        >
                          Apply Now for {job.title}
                          <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                        </a>
                      )}
                    </div>
                    {job.deadline && (
                      <p className="text-sm text-green-700 mt-3">
                        ⏰ Apply before {formatShortDate(job.deadline)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Job Details Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    Job Details - {job.title} at {job.company}
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
                        <div className="text-gray-500 text-xs mb-1">Qualification Required</div>
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
                        Job Description & Responsibilities
                      </h3>
                      <div 
                        className="prose prose-sm max-w-none text-gray-600"
                        dangerouslySetInnerHTML={{ __html: job.description }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ RIGHT SIDEBAR - WITH data-nosnippet */}
            <aside className="lg:w-1/3">
              <div className="sticky top-24 space-y-6">
                
                {/* ✅ Application Tips - WITH data-nosnippet */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" data-nosnippet>
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
                
                {/* ✅ Job Summary Card - Important info in sidebar */}
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100" data-nosnippet>
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Quick Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Position:</span> {job.title}</p>
                    <p><span className="font-medium">Company:</span> {job.company}</p>
                    <p><span className="font-medium">Location:</span> {job.location}</p>
                    {job.salary && <p><span className="font-medium">Salary:</span> {job.salary}</p>}
                    {job.deadline && (
                      <p className="text-red-600 font-medium">
                        ⏰ Deadline: {formatShortDate(job.deadline)}
                        {daysLeft && isOpen && ` (${daysLeft} days left)`}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Sidebar Widgets with data-nosnippet */}
                <div data-nosnippet>
                  <SidebarWidgets />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

// ============ MAIN PAGE ============
export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slugPromise = params.then(p => p.slug);
  
  const jobPromise = slugPromise.then(async (slug) => {
    const job = await getJobBySlug(slug);
    if (!job) notFound();
    return job;
  });
  
  return (
    <Suspense fallback={<JobLoading />}>
      <JobContent jobPromise={jobPromise} />
    </Suspense>
  );
}