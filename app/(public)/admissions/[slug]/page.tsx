// app/(public)/admissions/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { 
  Calendar, 
  MapPin, 
  Building2, 
  Clock, 
  ChevronLeft,
  GraduationCap,
  FileText,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { postService } from '@/services/post/post.service';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';

// ============ TYPES ============
interface Program {
  name: string;
  slug?: string;
  duration?: string;
  fee?: string;
}

interface AdmissionWithComputed {
  id: number;
  slug: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  isFeatured: boolean;
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
  // Admission specific
  instituteName: string;
  cityName: string;
  openDate: Date | null;
  closeDate: Date | null;
  programs: Program[];
  eligibility: string;
  applicationFee: string;
  applyLink: string;
  status: string;
  // Computed values
  isOpen: boolean;
  isDeadlineNear: boolean;
  isDeadlinePassed: boolean;
  formattedOpenDate: string;
  formattedCloseDate: string;
  currentYear: string;
}

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

// ✅ FIXED: Format date - handles both Date and string
function formatDate(date: Date | string | null): string {
  if (!date) return 'TBA';
  
  // ✅ Convert to Date object if string
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // ✅ Check if valid date
  if (isNaN(dateObj.getTime())) return 'TBA';
  
  return dateObj.toLocaleDateString('en-PK', { 
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

// ✅ Sanitize content to avoid duplicate H1
function sanitizeContent(html: string | null): string {
  if (!html) return '';
  
  // Convert H1 to H2 (since we already have H1 in hero)
  let sanitized = html
    .replace(/<h1[^>]*>/gi, '<h2>')
    .replace(/<\/h1>/gi, '</h2>');
  
  // Remove empty paragraphs
  sanitized = sanitized.replace(/<p>\s*<\/p>/g, '');
  
  return sanitized;
}

// ============ GENERATE STATIC PARAMS ============
export async function generateStaticParams() {
  try {
    const posts = await postService.getList('admission', 10);
    
    if (posts && posts.length > 0) {
      return posts.map((post) => ({
        slug: post.slug,
      }));
    }
    
    return [{ slug: 'placeholder' }];
    
  } catch (error) {
    console.error('Error generating static params for admissions:', error);
    return [{ slug: 'placeholder' }];
  }
}

// ============ DATA FETCHING ============

async function getAdmissionBySlug(slug: string): Promise<AdmissionWithComputed | null> {
  try {
    const post = await postService.getDetail(slug);
    
    if (!post || post.type !== 'admission') {
      return null;
    }
    
    const meta = post.meta || {};
    
    // ✅ Parse dates - CONVERT TO DATE OBJECT
    const openDate = getMetaValue(meta, 'openDate', null) 
      ? new Date(getMetaValue(meta, 'openDate', '')) 
      : null;
    const closeDate = getMetaValue(meta, 'closeDate', null) 
      ? new Date(getMetaValue(meta, 'closeDate', '')) 
      : null;
    
    // ✅ FIX: Convert publishedAt and updatedAt to Date objects
    const publishedAt = post.publishedAt ? new Date(post.publishedAt) : null;
    const updatedAt = post.updatedAt ? new Date(post.updatedAt) : null;
    
    // Get programs
    const programs = getMetaValue(meta, 'programs', []) as Program[];
    
    // Get status
    const status = getMetaValue(meta, 'status', 'Open');
    
    // Compute date-related values using reference date
    const referenceDate = new Date('2024-01-01T00:00:00.000Z');
    let isOpen = status === 'Open';
    let isDeadlineNear = false;
    let isDeadlinePassed = false;
    
    if (closeDate) {
      const diffTime = closeDate.getTime() - referenceDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isOpen = status === 'Open' && diffDays > 0;
      isDeadlineNear = diffDays > 0 && diffDays <= 7;
      isDeadlinePassed = diffDays <= 0;
    }
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage || null,
      isFeatured: post.isFeatured || getMetaValue(meta, 'isFeatured', false),
      publishedAt: publishedAt, // ✅ Now Date object
      updatedAt: updatedAt,     // ✅ Now Date object
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
      // Admission specific
      instituteName: getMetaValue(meta, 'instituteName', 'University'),
      cityName: getMetaValue(meta, 'cityName', 'Pakistan'),
      openDate: openDate,
      closeDate: closeDate,
      programs: programs,
      eligibility: getMetaValue(meta, 'eligibility', ''),
      applicationFee: getMetaValue(meta, 'applicationFee', ''),
      applyLink: getMetaValue(meta, 'applyLink', ''),
      status: status,
      // Computed values
      isOpen,
      isDeadlineNear,
      isDeadlinePassed,
      formattedOpenDate: formatDate(openDate),
      formattedCloseDate: formatDate(closeDate),
      currentYear: '2026',
    };
  } catch (error) {
    console.error('Error fetching admission detail:', error);
    return null;
  }
}

// ============ METADATA ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  if (slug === 'placeholder') {
    return {
      title: 'Admission Not Found | NextID.pk',
      description: 'The requested admission could not be found.',
      robots: { index: false },
    };
  }
  
  const admission = await getAdmissionBySlug(slug);
  
  if (!admission) {
    return {
      title: 'Admission Not Found | NextID.pk',
      description: 'The requested admission could not be found.',
      robots: { index: false },
    };
  }
  
  // Build SEO metadata
  const seoTitle = admission.metaTitle || 
    `${admission.instituteName} Admissions ${admission.currentYear} | ${admission.isOpen ? 'Apply Now' : 'Admissions'} | NextID.pk`;
  
  const seoDescription = admission.metaDescription || 
    admission.excerpt || 
    `Apply for ${admission.instituteName} admissions ${admission.currentYear}. Last date: ${admission.formattedCloseDate}. Check eligibility, programs, and apply online.`;
  
  const canonicalUrl = admission.canonicalUrl || `https://www.nextid.pk/admissions/${admission.slug}`;
  const ogImage = admission.ogImage || admission.featuredImage || '/og-image.png';
  
  // Robots meta
  const robots = admission.robots || 'index, follow';
  
  return {
    title: seoTitle,
    description: seoDescription,
    keywords: admission.metaKeywords || undefined,
    robots: robots,
    alternates: { 
      canonical: canonicalUrl,
      languages: {
        'en-US': canonicalUrl,
      },
    },
    publisher: 'NextID.pk',
    authors: [{ name: 'NextID.pk' }],
    openGraph: {
      title: admission.ogTitle || seoTitle,
      description: admission.ogDescription || seoDescription,
      url: canonicalUrl,
      siteName: 'NextID.pk',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: admission.publishedAt?.toISOString(),
      modifiedTime: admission.updatedAt?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: admission.twitterTitle || seoTitle,
      description: admission.twitterDescription || seoDescription,
      images: [ogImage],
    },
  };
}

// ============ LOADING COMPONENT ============
function AdmissionLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading admission details...</p>
      </div>
    </div>
  );
}

// ============ SCHEMA MARKUP COMPONENT ============
function AdmissionSchema({ admission }: { admission: AdmissionWithComputed }) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": admission.instituteName,
    "description": admission.excerpt || `${admission.instituteName} admissions ${admission.currentYear}`,
    "url": `https://www.nextid.pk/admissions/${admission.slug}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": admission.cityName,
      "addressCountry": "PK"
    },
    "makesOffer": admission.programs.map((program: Program) => ({
      "@type": "Course",
      "name": program.name,
      "description": program.duration || `${program.name} program`,
      "educationalCredentialAwarded": program.name
    }))
  };
  
  // Add date info if available
  if (admission.openDate) {
    schema.startDate = admission.openDate.toISOString();
  }
  if (admission.closeDate) {
    schema.endDate = admission.closeDate.toISOString();
  }
  
  return (
    <script 
      type="application/ld+json" 
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} 
    />
  );
}

// ============ BREADCRUMB SCHEMA ============
function BreadcrumbSchema({ admission }: { admission: AdmissionWithComputed }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.nextid.pk/" },
      { "@type": "ListItem", "position": 2, "name": "Admissions", "item": "https://www.nextid.pk/admissions" },
      { "@type": "ListItem", "position": 3, "name": admission.title, "item": `https://www.nextid.pk/admissions/${admission.slug}` }
    ]
  };
  
  return (
    <script 
      type="application/ld+json" 
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} 
    />
  );
}

// ============ CONTENT COMPONENT ============
function AdmissionContent({ admission }: { admission: AdmissionWithComputed }) {
  const {
    title,
    content,
    excerpt,
    featuredImage,
    isFeatured,
    instituteName,
    cityName,
    openDate,
    closeDate,
    programs,
    eligibility,
    applicationFee,
    applyLink,
    isOpen,
    isDeadlineNear,
    isDeadlinePassed,
    formattedOpenDate,
    formattedCloseDate,
    currentYear,
    slug
  } = admission;

  return (
    <>
      <AdmissionSchema admission={admission} />
      <BreadcrumbSchema admission={admission} />
      
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          <div className="relative container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              <Link 
                href="/admissions" 
                className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition mb-6 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
                Back to Admissions
              </Link>
              
              {/* Status Badges */}
              <div className="flex flex-wrap gap-3 mb-5">
                {!isDeadlinePassed && isOpen ? (
                  <span className="inline-flex items-center gap-2 bg-green-500 text-white text-sm px-4 py-1.5 rounded-full shadow-lg">
                    <CheckCircle className="w-4 h-4" />
                    Admissions Open
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 bg-gray-500 text-white text-sm px-4 py-1.5 rounded-full shadow-lg">
                    Admissions Closed
                  </span>
                )}
                {isFeatured && (
                  <span className="inline-flex items-center gap-2 bg-amber-500 text-white text-sm px-4 py-1.5 rounded-full shadow-lg">
                    Featured
                  </span>
                )}
                {isDeadlineNear && !isDeadlinePassed && isOpen && (
                  <span className="inline-flex items-center gap-2 bg-orange-500 text-white text-sm px-4 py-1.5 rounded-full shadow-lg animate-pulse">
                    <AlertCircle className="w-4 h-4" />
                    Deadline Approaching!
                  </span>
                )}
              </div>
              
              {/* ✅ ONLY H1 on the page */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {title}
              </h1>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Building2 className="w-4 h-4" />
                  <span>{instituteName}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <MapPin className="w-4 h-4" />
                  <span>{cityName}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                {openDate && (
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-blue-200">Application Starts</div>
                      <div className="font-semibold text-lg">{formattedOpenDate}</div>
                    </div>
                  </div>
                )}
                {closeDate && (
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-blue-200">Application Deadline</div>
                      <div className="font-semibold text-lg">{formattedCloseDate}</div>
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
            <main className="lg:w-2/3 space-y-6">
              
              {/* Quick Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {programs.length > 0 && (
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                    <GraduationCap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">{programs.length}</div>
                    <div className="text-xs text-gray-500">Programs Offered</div>
                  </div>
                )}
                {applicationFee && (
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                    <div className="text-2xl font-bold text-gray-800">{applicationFee}</div>
                    <div className="text-xs text-gray-500">Application Fee</div>
                  </div>
                )}
                <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-gray-800">{currentYear}</div>
                  <div className="text-xs text-gray-500">Academic Year</div>
                </div>
              </div>
              
              {/* Featured Image with Fallback */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <div className="relative w-full h-80 md:h-96 bg-gradient-to-br from-blue-100 to-indigo-100">
                  {featuredImage ? (
                    <Image
                      src={featuredImage}
                      alt={title}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 rounded-full bg-white/80 shadow-lg flex items-center justify-center mx-auto mb-4">
                          <span className="text-4xl font-bold text-blue-600">
                            {getInitials(instituteName)}
                          </span>
                        </div>
                        <p className="text-gray-600 font-medium">{instituteName}</p>
                        <p className="text-gray-400 text-sm">Admissions {currentYear}</p>
                      </div>
                    </div>
                  )}
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>
              
              {/* Content Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8">
                  
                  {/* Excerpt */}
                  {excerpt && (
                    <div className="mb-8 p-5 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                      <p className="text-blue-800 text-base leading-relaxed font-medium">
                        {excerpt}
                      </p>
                    </div>
                  )}
                  
                  {/* Programs Offered */}
                  {programs && programs.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        Programs Offered
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {programs.map((program: Program, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-gray-800">{program.name}</div>
                              {program.duration && <div className="text-xs text-gray-500">{program.duration}</div>}
                              {program.fee && <div className="text-xs text-gray-500">Fee: {program.fee}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Eligibility Criteria */}
                  {eligibility && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Eligibility Criteria
                      </h2>
                      <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-5 rounded-lg">
                        <div dangerouslySetInnerHTML={{ __html: eligibility }} />
                      </div>
                    </div>
                  )}
                  
                  {/* Full Content - Sanitized to avoid duplicate H1 */}
                  {content && (
                    <div className="mb-8">
                      <div 
                        className="prose prose-sm md:prose-base max-w-none
                          prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3
                          prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                          prose-strong:text-gray-900 prose-strong:font-semibold
                          prose-li:text-gray-700 prose-li:mb-1
                          prose-ul:my-3 prose-ol:my-3
                          prose-img:rounded-lg prose-img:shadow-md"
                        dangerouslySetInnerHTML={{ 
                          __html: sanitizeContent(content) 
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Apply Button */}
                  {applyLink && isOpen && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <a
                        href={applyLink}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-4 rounded-xl transition-all group shadow-lg hover:shadow-xl"
                      >
                        <ExternalLink className="w-5 h-5" />
                        Apply Now for {instituteName} Admission {currentYear}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </a>
                      <p className="text-xs text-gray-400 mt-3">
                        You will be redirected to the official admission portal
                      </p>
                    </div>
                  )}
                  
                  {/* Closed Message */}
                  {!isOpen && (
                    <div className="mt-8 p-5 bg-gray-100 rounded-xl text-center">
                      <AlertCircle className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-600 font-medium">Admissions are currently closed</p>
                      <p className="text-sm text-gray-500 mt-1">Check back for next intake</p>
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                <div className="border-t border-gray-100 px-6 md:px-8 py-4 bg-gray-50 flex justify-between items-center flex-wrap gap-3">
                  <p className="text-xs text-gray-400">
                    Last updated: {formatDate(admission.updatedAt || admission.publishedAt)}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Share: </span>
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=https://www.nextid.pk/admissions/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition"
                    >
                      Facebook
                    </a>
                    <a 
                      href={`https://twitter.com/intent/tweet?url=https://www.nextid.pk/admissions/${slug}&text=${encodeURIComponent(title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-400 transition"
                    >
                      Twitter
                    </a>
                    <a 
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=https://www.nextid.pk/admissions/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-700 transition"
                    >
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </main>
            
            {/* RIGHT COLUMN - Sidebar */}
            <aside className="lg:w-1/3">
              <div className="lg:sticky lg:top-6 space-y-6">
                
                {/* Important Dates Card */}
                {(openDate || closeDate) && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Important Dates
                    </h3>
                    <div className="space-y-3">
                      {openDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Application Starts</span>
                          <span className="text-sm font-semibold text-gray-800">{formattedOpenDate}</span>
                        </div>
                      )}
                      {closeDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Last Date to Apply</span>
                          <span className={`text-sm font-semibold ${isDeadlineNear && isOpen ? 'text-orange-600' : 'text-gray-800'}`}>
                            {formattedCloseDate}
                            {isDeadlineNear && isOpen && (
                              <span className="text-xs text-orange-500 ml-1">⚠️ Near</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Quick Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    Quick Stats
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Institute</span>
                      <span className="font-medium text-gray-800">{instituteName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">City</span>
                      <span className="font-medium text-gray-800">{cityName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Programs</span>
                      <span className="font-medium text-gray-800">{programs.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className={`font-medium ${isOpen ? 'text-green-600' : 'text-gray-500'}`}>
                        {isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Sidebar Widgets */}
                <Suspense fallback={<div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-64"></div>}>
                  <SidebarWidgets />
                </Suspense>
              </div>
            </aside>
            
          </div>
        </div>
      </main>
    </>
  );
}

// ============ MAIN PAGE ============
export default async function AdmissionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  if (slug === 'placeholder') {
    notFound();
  }
  
  const admission = await getAdmissionBySlug(slug);
  if (!admission) notFound();
  
  return (
    <Suspense fallback={<AdmissionLoading />}>
      <AdmissionContent admission={admission} />
    </Suspense>
  );
}