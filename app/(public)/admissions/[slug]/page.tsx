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
  ExternalLink
} from 'lucide-react';
import { postService } from '@/services/post/post.service';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';
import { generateJsonLd } from '@/lib/seo';

// Types
interface Program {
  name: string;
  slug?: string;
}

// Helper functions
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ============ SEO: Generate Metadata from Database (IMPROVED) ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await postService.getPost(slug);
  
  if (!post || post.type !== 'admission') {
    return {
      title: 'Admission Not Found | NextID.pk',
      description: 'The requested admission could not be found.',
      robots: { index: false },
    };
  }
  
  const meta = post.meta || {};
  const instituteName = getMetaValue(meta, 'instituteName', 'University');
  const cityName = getMetaValue(meta, 'cityName', '');
  const programs = getMetaValue(meta, 'programs', []) as Program[];
  const closeDate = getMetaValue(meta, 'closeDate', null) ? new Date(getMetaValue(meta, 'closeDate', '')) : null;
  const status = getMetaValue(meta, 'status', 'Open');
  
  // ✅ IMPROVED: Better SEO title with deadline and status
  const deadlineText = closeDate ? ` (Deadline: ${formatDate(closeDate)})` : '';
  const statusText = status === 'Open' ? 'Open - Apply Now' : 'Closed';
  
  const seoTitle = getMetaValue(meta, 'metaTitle', 
    `${instituteName} Admissions ${new Date().getFullYear()} | ${statusText}${deadlineText} | ${post.title}`
  );
  
  // ✅ IMPROVED: Better meta description with programs list
  const programsText = programs.length > 0 
    ? ` Programs: ${programs.slice(0, 3).map(p => p.name).join(', ')}${programs.length > 3 ? '...' : ''}.` 
    : '';
  
  const seoDescription = getMetaValue(meta, 'metaDescription', 
    post.excerpt || 
    `${instituteName} admissions ${new Date().getFullYear()} ${status === 'Open' ? 'are open' : 'status'}.${programsText} Check eligibility criteria, apply online, last date ${formatDate(closeDate)}. ${instituteName}${cityName ? ' ' + cityName + '.' : ''}`
  );
  
  const seoKeywords = getMetaValue(meta, 'metaKeywords', 
    `${instituteName} admission ${new Date().getFullYear()}, ${instituteName} admissions, ${programs.map(p => p.name).join(', ')}, university admission Pakistan, college admission`
  );
  
  const canonicalUrl = getMetaValue(meta, 'canonicalUrl', `https://www.nextid.pk/admissions/${slug}`);
  const robots = getMetaValue(meta, 'robots', 'index, follow');
  
  const robotsObj = {
    index: robots.includes('index'),
    follow: robots.includes('follow'),
  };
  
  const ogTitle = getMetaValue(meta, 'ogTitle', seoTitle);
  const ogDescription = getMetaValue(meta, 'ogDescription', seoDescription);
  const ogImage = getMetaValue(meta, 'ogImage', post.featuredImage || '/og-image.png');
  
  const twitterTitle = getMetaValue(meta, 'twitterTitle', ogTitle);
  const twitterDescription = getMetaValue(meta, 'twitterDescription', ogDescription);
  const twitterImage = getMetaValue(meta, 'twitterImage', ogImage);
  
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
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
      locale: 'en_PK',
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
    },
    twitter: {
      card: getMetaValue(meta, 'twitterCard', 'summary_large_image'),
      title: twitterTitle,
      description: twitterDescription,
      images: [twitterImage],
      site: '@nextidpk',
      creator: '@nextidpk',
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

// ============ CONTENT COMPONENT ============
async function AdmissionContent({ slugPromise }: { slugPromise: Promise<string> }) {
  const slug = await slugPromise;
  const post = await postService.getPost(slug);
  
  if (!post || post.type !== 'admission') {
    notFound();
  }
  
  const meta = post.meta || {};
  const openDate = getMetaValue(meta, 'openDate', null) ? new Date(getMetaValue(meta, 'openDate', '')) : null;
  const closeDate = getMetaValue(meta, 'closeDate', null) ? new Date(getMetaValue(meta, 'closeDate', '')) : null;
  const instituteName = getMetaValue(meta, 'instituteName', 'University');
  const cityName = getMetaValue(meta, 'cityName', 'Pakistan');
  const programs = getMetaValue(meta, 'programs', []) as Program[];
  const eligibility = getMetaValue(meta, 'eligibility', '');
  const applicationFee = getMetaValue(meta, 'applicationFee', '');
  const applyLink = getMetaValue(meta, 'applyLink', '');
  const status = getMetaValue(meta, 'status', 'Open');
  const isFeatured = post.isFeatured || getMetaValue(meta, 'isFeatured', false);
  
  // Deadline calculation
  const isDeadlineNear = (() => {
    if (!closeDate) return false;
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return closeDate < weekFromNow;
  })();
  
  // ✅ Create SEO description text for hidden div
  const programsForMeta = programs.length > 0 
    ? programs.map(p => p.name).join(', ') 
    : 'various programs';
  
  const metaDescriptionText = post.excerpt || 
    `${instituteName} admissions ${new Date().getFullYear()} ${status === 'Open' ? 'are now open' : 'status'}. Apply for ${programsForMeta}. Last date: ${formatDate(closeDate)}. Eligibility: ${eligibility.substring(0, 100)}...`;
  
  // ✅ Generate JSON-LD Structured Data for SEO (IMPROVED)
  const jsonLd = generateJsonLd({
    type: 'Event',  // Admission is an event type
    title: post.title,
    description: metaDescriptionText,
    url: `https://www.nextid.pk/admissions/${slug}`,
    image: post.featuredImage || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Admissions', url: '/admissions' },
      { name: `${instituteName} Admissions`, url: `/admissions/${slug}` },
    ],
  });
  
  // ✅ Additional EducationEvent Schema for better SEO
  const educationEventSchema = {
    "@context": "https://schema.org",
    "@type": "EducationEvent",
    "name": `${instituteName} Admissions ${new Date().getFullYear()}`,
    "description": metaDescriptionText,
    "startDate": openDate?.toISOString(),
    "endDate": closeDate?.toISOString(),
    "eventStatus": status === 'Open' 
      ? "https://schema.org/EventScheduled" 
      : "https://schema.org/EventCancelled",
    "location": {
      "@type": "Place",
      "name": instituteName,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": cityName,
        "addressCountry": "PK"
      }
    },
    "organizer": {
      "@type": "EducationalOrganization",
      "name": instituteName,
      "url": applyLink || undefined
    },
    "offers": applicationFee ? {
      "@type": "Offer",
      "price": applicationFee,
      "priceCurrency": "PKR",
      "availability": status === 'Open' ? "https://schema.org/InStock" : "https://schema.org/SoldOut"
    } : undefined
  };
  
  return (
    <>
      {/* ✅ JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* ✅ Education Event Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(educationEventSchema) }}
      />
      
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              {/* Back Button */}
              <Link 
                href="/admissions" 
                className="inline-flex items-center gap-1 text-blue-200 hover:text-white transition mb-6 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
                Back to Admissions
              </Link>
              
              {/* Status Badge */}
              <div className="flex flex-wrap gap-2 mb-4">
                {status === "Open" ? (
                  <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Admissions Open
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-gray-500 text-white text-xs px-3 py-1 rounded-full">
                    Admissions Closed
                  </span>
                )}
                {isFeatured && (
                  <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs px-3 py-1 rounded-full">
                    ⭐ Featured
                  </span>
                )}
                {isDeadlineNear && status === "Open" && (
                  <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-xs px-3 py-1 rounded-full animate-pulse">
                    <AlertCircle className="w-3 h-3" />
                    Deadline Approaching
                  </span>
                )}
              </div>
              
              {/* ✅ H1 - IMPROVED: More descriptive */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {status === 'Open' ? '📢 ' : ''}{post.title}
              </h1>
              
              {/* ✅ Hidden SEO description for Google */}
              <div className="hidden" aria-hidden="true">
                {metaDescriptionText}
              </div>
              
              {/* Institute Info */}
              <div className="flex flex-wrap gap-4 text-blue-200 mb-6">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>{instituteName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{cityName}</span>
                </div>
              </div>
              
              {/* Dates */}
              <div className="flex flex-wrap gap-6 text-sm">
                {openDate && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Calendar className="w-4 h-4" />
                    <div>
                      <div className="text-xs text-blue-200">Application Starts</div>
                      <div className="font-semibold">{formatDate(openDate)}</div>
                    </div>
                  </div>
                )}
                {closeDate && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Clock className="w-4 h-4" />
                    <div>
                      <div className="text-xs text-blue-200">Deadline</div>
                      <div className="font-semibold">
                        {formatDate(closeDate)}
                        {isDeadlineNear && status === "Open" && (
                          <span className="ml-2 text-xs text-orange-200">(Soon!)</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Section with Sidebar */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* ✅ MAIN CONTENT - MOVED HIGHER FOR SEO */}
            <main className="lg:w-2/3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                
                {/* Featured Image */}
                {post.featuredImage && (
                  <div className="relative w-full h-72 md:h-96">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                )}
                
                {/* Content */}
                <div className="p-6 md:p-8">
                  
                  {/* ✅ Excerpt - THIS IS WHAT GOOGLE SHOULD SHOW */}
                  {post.excerpt && (
                    <div className="mb-8 p-5 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                      <p className="text-blue-800 text-base leading-relaxed font-medium">
                        {post.excerpt}
                      </p>
                    </div>
                  )}
                  
                  {/* ✅ Programs Offered - WITH BETTER HEADING FOR SEO */}
                  {programs && programs.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        Programs Offered at {instituteName}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {programs.map((program: Program, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-gray-700">{program.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* ✅ Eligibility Criteria */}
                  {eligibility && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Eligibility Criteria for {instituteName} Admission {new Date().getFullYear()}
                      </h2>
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <p>{eligibility}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Main Content */}
                  {post.content && (
                    <div 
                      className="prose prose-sm md:prose-base max-w-none
                        prose-headings:text-gray-900 prose-headings:font-bold
                        prose-p:text-gray-700 prose-p:leading-relaxed
                        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-gray-900
                        prose-li:text-gray-700
                        prose-img:rounded-lg"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  )}
                  
                  {/* Application Fee */}
                  {applicationFee && (
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Application Fee:</span> {applicationFee}
                      </p>
                    </div>
                  )}
                  
                  {/* ✅ Apply Button - BETTER TEXT FOR SEO */}
                  {applyLink && status === "Open" && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <a
                        href={applyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all group"
                      >
                        Apply Now for {instituteName} Admission {new Date().getFullYear()}
                        <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                <div className="border-t border-gray-100 px-6 md:px-8 py-4 bg-gray-50">
                  <p className="text-xs text-gray-400">
                    Last updated: {formatDate(post.updatedAt || post.createdAt)}
                  </p>
                </div>
              </div>
            </main>
            
            {/* ✅ SIDEBAR - ADDED data-nosnippet if there are instructions */}
            <aside className="lg:w-1/3">
              <div className="lg:sticky lg:top-6 space-y-6">
                {/* ✅ If SidebarWidgets has instructions, add data-nosnippet */}
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
export default async function AdmissionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slugPromise = params.then(p => p.slug);
  
  return (
    <Suspense fallback={<AdmissionLoading />}>
      <AdmissionContent slugPromise={slugPromise} />
    </Suspense>
  );
}