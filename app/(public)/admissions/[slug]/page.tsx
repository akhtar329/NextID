// app/(public)/admissions/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import React from 'react';
import { cookies } from 'next/headers';
import ShareButtons from '@/components/ui/ShareButtons';
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

// Types
interface Program {
  name: string;
  slug?: string;
  duration?: string;
  fee?: string;
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

// ============ SEO: Generate Metadata ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  if (slug === 'placeholder') {
    return {
      title: 'Admission Not Found | NextID.pk',
      description: 'The requested admission could not be found.',
      robots: { index: false },
    };
  }
  
  const post = await postService.getDetail(slug);
  
  if (!post || post.type !== 'admission') {
    return {
      title: 'Admission Not Found | NextID.pk',
      description: 'The requested admission could not be found.',
      robots: { index: false },
    };
  }
  
  const meta = post.meta || {};
  const instituteName = getMetaValue(meta, 'instituteName', 'University');
  const closeDate = getMetaValue(meta, 'closeDate', null) ? new Date(getMetaValue(meta, 'closeDate', '')) : null;
  const status = getMetaValue(meta, 'status', 'Open');
  const currentYear = "2026";
  
  const seoTitle = getMetaValue(meta, 'metaTitle', 
    `${instituteName} Admissions ${currentYear} | ${status === 'Open' ? 'Apply Now' : 'Admissions'} | NextID.pk`
  );
  
  const seoDescription = getMetaValue(meta, 'metaDescription', 
    post.excerpt || `Apply for ${instituteName} admissions ${currentYear}. Last date: ${formatDate(closeDate)}. Check eligibility, programs, and apply online.`
  );
  
  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical: `https://www.nextid.pk/admissions/${slug}` },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: `https://www.nextid.pk/admissions/${slug}`,
      siteName: 'NextID.pk',
      images: [{ url: post.featuredImage || '/og-image.png', width: 1200, height: 630 }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [post.featuredImage || '/og-image.png'],
    },
  };
}

// ============ GENERATE STATIC PARAMS ============
export async function generateStaticParams() {
  try {
    const posts = await postService.getList('admission', 100);
    
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

// ============ CLIENT COMPONENT FOR DEADLINE STATUS ============
function DeadlineStatusClient({ closeDate, status, isFeatured }: { closeDate: Date | null; status: string; isFeatured: boolean }) {
  'use client';
  
  const [isDeadlineNear, setIsDeadlineNear] = React.useState(false);
  const [isDeadlinePassed, setIsDeadlinePassed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
    if (!closeDate) return;
    
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setIsDeadlineNear(closeDate < weekFromNow);
    setIsDeadlinePassed(closeDate < now);
  }, [closeDate]);
  
  // During SSR, show default state
  if (!mounted) {
    return (
      <div className="flex flex-wrap gap-3 mb-5">
        {status === "Open" ? (
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
      </div>
    );
  }
  
  return (
    <div className="flex flex-wrap gap-3 mb-5">
      {!isDeadlinePassed && status === "Open" ? (
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
      {isDeadlineNear && !isDeadlinePassed && status === "Open" && (
        <span className="inline-flex items-center gap-2 bg-orange-500 text-white text-sm px-4 py-1.5 rounded-full shadow-lg animate-pulse">
          <AlertCircle className="w-4 h-4" />
          Deadline Approaching!
        </span>
      )}
    </div>
  );
}

// ============ CONTENT COMPONENT ============
async function AdmissionContent({ slugPromise }: { slugPromise: Promise<string> }) {
  // ✅ FIX: Access cookies first to make route dynamic
  await cookies();
  
  const slug = await slugPromise;
  
  if (slug === 'placeholder') {
    notFound();
  }
  
  const post = await postService.getDetail(slug);
  
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
  
  // ✅ Now new Date() is allowed after cookies() access
  const currentYear = new Date().getFullYear().toString();
  
  return (
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
            
            <DeadlineStatusClient closeDate={closeDate} status={status} isFeatured={isFeatured} />
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {post.title}
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
                    <div className="font-semibold text-lg">{formatDate(openDate)}</div>
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
                    <div className="font-semibold text-lg">{formatDate(closeDate)}</div>
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
            
            {/* Featured Image */}
            {post.featuredImage && (
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <div className="relative w-full h-80 md:h-96">
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            )}
            
            {/* Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 md:p-8">
                
                {/* Excerpt */}
                {post.excerpt && (
                  <div className="mb-8 p-5 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                    <p className="text-blue-800 text-base leading-relaxed font-medium">
                      {post.excerpt}
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
                
                {/* Full Content */}
                {post.content && (
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
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  </div>
                )}
                
                {/* Apply Button */}
                {applyLink && status === "Open" && (
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
                {status !== "Open" && (
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
                  Last updated: {formatDate(post.updatedAt || post.createdAt)}
                </p>
                <ShareButtons title={post.title} slug={slug} />
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
                        <span className="text-sm font-semibold text-gray-800">{formatDate(openDate)}</span>
                      </div>
                    )}
                    {closeDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Last Date to Apply</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {formatDate(closeDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Sidebar Widgets */}
              <Suspense fallback={<div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-64"></div>}>
                <SidebarWidgets />
              </Suspense>
            </div>
          </aside>
          
        </div>
      </div>
    </main>
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