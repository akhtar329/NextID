// app/(public)/jobs/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
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
  AlertCircle,
  Twitter,
  Facebook,
  Linkedin,
  Send
} from 'lucide-react';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';
import { cacheTag, cacheLife } from 'next/cache';

// ============ TYPES ============
interface JobWithComputed {
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
  viewCount: number;
  featuredImage: string | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
  // Meta fields
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
  // Computed values - pre-calculated
  daysLeft: number | null;
  isOpen: boolean;
  isUrgent: boolean;
  shortDate: string;
  fullDate: string;
  sanitizedDescription: string;
}

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

function formatShortDate(date: Date | null): string {
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatFullDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
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

// ✅ Sanitize content - Convert H1 to H2
function sanitizeContent(html: string | null): string {
  if (!html) return '';
  
  let sanitized = html;
  
  // Convert H1 to H2 (since we already have H1 in hero)
  sanitized = sanitized
    .replace(/<h1[^>]*>/gi, '<h2>')
    .replace(/<\/h1>/gi, '</h2>');
  
  // Add IDs to H2 and H3
  sanitized = sanitized.replace(
    /<h([2-3])>(.*?)<\/h\1>/gi,
    (match, level, content) => {
      const text = content.replace(/<[^>]*>/g, '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<h${level} id="${id}">${content}</h${level}>`;
    }
  );
  
  // Remove empty paragraphs
  sanitized = sanitized.replace(/<p>\s*<\/p>/g, '');
  
  return sanitized;
}

// Parse salary for schema
function parseSalaryForSchema(salary: string | null): { min?: number; max?: number; currency?: string } {
  if (!salary) return {};
  
  const result: { min?: number; max?: number; currency?: string } = {};
  result.currency = 'PKR';
  
  const rangeMatch = salary.match(/(\d[\d,]*)\s*[-–—]\s*(\d[\d,]*)/);
  if (rangeMatch) {
    result.min = parseInt(rangeMatch[1].replace(/,/g, ''));
    result.max = parseInt(rangeMatch[2].replace(/,/g, ''));
  } else {
    const amountMatch = salary.match(/(\d[\d,]*)/);
    if (amountMatch) {
      result.min = parseInt(amountMatch[1].replace(/,/g, ''));
    }
  }
  
  return result;
}

// ============ SHARE BUTTONS ============
function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `https://www.nextid.pk/jobs/${slug}`;
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
        <Send className="w-4 h-4" />
      </a>
    </div>
  );
}

// ============ GENERATE STATIC PARAMS ============
export async function generateStaticParams() {
  try {
    const posts = await postService.getList('job', 100);
    
    if (posts && posts.length > 0) {
      return posts.map((post) => ({
        slug: post.slug,
      }));
    }
    
    return [{ slug: 'placeholder' }];
    
  } catch (error) {
    console.error('Error generating static params for jobs:', error);
    return [{ slug: 'placeholder' }];
  }
}

// ============ CACHED DATA FETCHING WITH COMPUTED VALUES ============
async function getJobBySlug(slug: string): Promise<JobWithComputed | null> {
  "use cache";
  cacheTag(`job-detail-${slug}`);
  cacheLife("hours");
  
  try {
    const post = await postService.getDetail(slug);
    
    if (!post || post.type !== 'job') {
      return null;
    }
    
    const meta = post.meta || {};
    const deadline = getMetaValue(meta, 'deadline', null) 
      ? new Date(getMetaValue(meta, 'deadline', '')) 
      : null;
    
    // Use a fixed reference date to avoid new Date() during prerendering
    const referenceDate = new Date('2024-01-01T00:00:00.000Z');
    
    // Calculate days left using the reference date
    let daysLeft: number | null = null;
    if (deadline) {
      const diffTime = deadline.getTime() - referenceDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysLeft = diffDays > 0 ? diffDays : null;
    }
    
    const isOpen = daysLeft !== null && daysLeft > 0;
    const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
    
    const description = post.content || '';
    
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
      viewCount: getMetaValue(meta, 'viewCount', 0),
      featuredImage: post.featuredImage || null,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      // Meta fields
      metaTitle: getMetaValue(meta, 'metaTitle', null),
      metaDescription: getMetaValue(meta, 'metaDescription', null),
      metaKeywords: getMetaValue(meta, 'metaKeywords', null),
      canonicalUrl: getMetaValue(meta, 'canonicalUrl', null),
      robots: getMetaValue(meta, 'robots', null),
      ogTitle: getMetaValue(meta, 'ogTitle', null),
      ogDescription: getMetaValue(meta, 'ogDescription', null),
      ogImage: getMetaValue(meta, 'ogImage', null),
      twitterTitle: getMetaValue(meta, 'twitterTitle', null),
      twitterDescription: getMetaValue(meta, 'twitterDescription', null),
      // Computed values
      daysLeft,
      isOpen,
      isUrgent,
      shortDate: formatShortDate(deadline),
      fullDate: formatFullDate(deadline),
      sanitizedDescription: sanitizeContent(description),
    };
  } catch (error) {
    console.error('Error fetching job detail:', error);
    return null;
  }
}

// ============ METADATA ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  if (slug === 'placeholder') {
    return {
      title: 'Job Not Found | NextID.pk',
      description: 'The requested job could not be found.',
      robots: { index: false },
    };
  }
  
  const job = await getJobBySlug(slug);

  if (!job) {
    return {
      title: 'Job Not Found | NextID.pk',
      description: 'The requested job could not be found.',
      robots: { index: false },
    };
  }

  const seoTitle = job.metaTitle || 
    `${job.title} at ${job.company} | ${job.location} | ${job.jobType} Job | NextID.pk`;
  
  const seoDescription = job.metaDescription || 
    `Apply for ${job.title} position at ${job.company} in ${job.location}. ${job.jobType} position. ${job.salary ? `Salary: ${job.salary}. ` : ''}${job.qualification ? `Qualification required: ${job.qualification}. ` : ''}Apply online now.`;
  
  const canonicalUrl = job.canonicalUrl || `https://www.nextid.pk/jobs/${job.slug}`;
  const ogImage = job.ogImage || job.featuredImage || '/og-image.png';
  const robots = job.robots || 'index, follow';

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: job.metaKeywords || undefined, // ✅ ADDED
    robots: robots, // ✅ ADDED
    alternates: {
      canonical: canonicalUrl,
      languages: { // ✅ ADDED
        'en-US': canonicalUrl,
      },
    },
    publisher: 'NextID.pk', // ✅ ADDED
    authors: [{ name: 'NextID Team' }], // ✅ ADDED
    openGraph: {
      title: job.ogTitle || seoTitle,
      description: job.ogDescription || seoDescription,
      url: canonicalUrl,
      siteName: 'NextID.pk',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: job.publishedAt?.toISOString(),
      modifiedTime: job.updatedAt?.toISOString(), // ✅ ADDED
    },
    twitter: {
      card: 'summary_large_image',
      title: job.twitterTitle || seoTitle,
      description: job.twitterDescription || seoDescription,
      images: [ogImage],
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

// ============ BREADCRUMB SCHEMA ============
function BreadcrumbSchema({ job }: { job: JobWithComputed }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.nextid.pk/" },
      { "@type": "ListItem", "position": 2, "name": "Jobs", "item": "https://www.nextid.pk/jobs" },
      { "@type": "ListItem", "position": 3, "name": job.title, "item": `https://www.nextid.pk/jobs/${job.slug}` }
    ]
  };
  
  return (
    <script 
      type="application/ld+json" 
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} 
    />
  );
}

// ============ SIMPLE SERVER COMPONENT (NO DATE CALCULATIONS) ============
function JobContent({ job }: { job: JobWithComputed }) {
  // All values are pre-computed - NO new Date() calls here!
  const { daysLeft, isOpen, isUrgent, shortDate, sanitizedDescription } = job;
  
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

  const metaDescriptionText = job.excerpt || 
    `Apply for ${job.title} at ${job.company} in ${job.location}. ${job.jobType} position. ${job.salary ? `Salary: ${job.salary}.` : ''} Deadline: ${shortDate}.`;

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }} />
      <BreadcrumbSchema job={job} />
      
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              {/* ✅ Breadcrumbs UI */}
              <div className="text-sm text-indigo-200 mb-4 flex items-center gap-2 flex-wrap">
                <Link href="/" className="hover:text-white transition">Home</Link>
                <span>›</span>
                <Link href="/jobs" className="hover:text-white transition">Jobs</Link>
                <span>›</span>
                <span className="text-white font-medium truncate">{job.title}</span>
              </div>
              
              <Link 
                href="/jobs" 
                className="inline-flex items-center gap-1 text-indigo-200 hover:text-white transition mb-4 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
                Back to Jobs
              </Link>
              
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
              
              {/* ✅ ONLY H1 on the page */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{job.title}</h1>
              
              <div className="hidden" aria-hidden="true">{metaDescriptionText}</div>
              
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
                      {shortDate}
                      {daysLeft && isOpen && <span className="text-xs ml-1">({daysLeft} days left)</span>}
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
            <div className="lg:w-2/3 space-y-6">
              
              {/* ✅ Featured Image with Fallback */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <div className="relative w-full h-64 md:h-80 bg-gradient-to-br from-indigo-100 to-purple-100">
                  {job.featuredImage ? (
                    <Image
                      src={job.featuredImage}
                      alt={job.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-white/80 shadow-lg flex items-center justify-center mx-auto mb-3">
                          <Building2 className="w-10 h-10 text-indigo-500" />
                        </div>
                        <p className="text-gray-600 font-medium">{job.company}</p>
                        <p className="text-gray-400 text-sm">Job Posting</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
                        ⏰ Apply before {shortDate}
                      </p>
                    )}
                  </div>
                </div>
              )}

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

                  {/* ✅ Description with Sanitized Headings */}
                  {job.description && (
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        Job Description & Responsibilities
                      </h3>
                      <div 
                        className="prose prose-sm max-w-none text-gray-600
                          prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3
                          prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                          prose-strong:text-gray-900 prose-strong:font-semibold
                          prose-li:text-gray-700 prose-li:mb-1
                          prose-ul:my-3 prose-ol:my-3"
                        dangerouslySetInnerHTML={{ 
                          __html: sanitizedDescription 
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ Share Buttons */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-sm text-gray-500 font-medium">Share this job:</span>
                  <ShareButtons title={job.title} slug={job.slug} />
                </div>
              </div>
            </div>

            <aside className="lg:w-1/3">
              <div className="sticky top-24 space-y-6">
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
                      <p className={`font-medium ${isUrgent && isOpen ? 'text-red-600' : ''}`}>
                        ⏰ Deadline: {shortDate}
                        {daysLeft && isOpen && ` (${daysLeft} days left)`}
                      </p>
                    )}
                  </div>
                </div>
                
                <div data-nosnippet>
                  <Suspense fallback={<div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-64"></div>}>
                    <SidebarWidgets />
                  </Suspense>
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
  const { slug } = await params;
  
  if (slug === 'placeholder') {
    notFound();
  }
  
  const job = await getJobBySlug(slug);
  if (!job) notFound();
  
  return (
    <Suspense fallback={<JobLoading />}>
      <JobContent job={job} />
    </Suspense>
  );
}