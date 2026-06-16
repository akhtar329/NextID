// app/(public)/date-sheets/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import React from 'react';
import { cookies } from 'next/headers';
import { postService } from '@/services/post/post.service';
import type { ExtendedPost } from '@/services/post/post.service';
import { Calendar, Clock, MapPin, Building2, Eye, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import { cacheTag, cacheLife } from 'next/cache';

// Types
interface DateSheetDetail {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  examType: string;
  examDate: Date | null;
  year: number;
  boardName: string | null;
  boardSlug: string | null;
  instituteName: string | null;
  instituteSlug: string | null;
  cityName: string | null;
  province: string | null;
  isPopular: boolean;
  viewCount: number;
  officialLink: string | null;
  downloadLink: string | null;
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

function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ============ GENERATE STATIC PARAMS ============
export async function generateStaticParams() {
  try {
    const posts = await postService.getList('date_sheet', 100);
    
    if (posts && posts.length > 0) {
      return posts.map((post) => ({
        slug: post.slug,
      }));
    }
    
    return [{ slug: 'placeholder' }];
    
  } catch (error) {
    console.error('Error generating static params for date sheets:', error);
    return [{ slug: 'placeholder' }];
  }
}

// ============ CACHED DATA FETCHING ============
async function getDateSheetDetail(slug: string): Promise<DateSheetDetail | null> {
  "use cache";
  cacheTag(`date-sheet-detail-${slug}`);
  cacheLife("hours");
  
  try {
    const post = await postService.getDetail(slug);
    
    if (!post || post.type !== 'date_sheet') return null;
    
    const meta = post.meta || {};
    
    let examDate: Date | null = null;
    const examDateRaw = getMetaValue(meta, 'examDate', null);
    if (examDateRaw && typeof examDateRaw === 'string') {
      try {
        const parsed = new Date(examDateRaw);
        if (!isNaN(parsed.getTime())) examDate = parsed;
      } catch {
        examDate = null;
      }
    }
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      description: post.content || post.excerpt,
      examType: getMetaValue(meta, 'examType', 'Annual'),
      examDate: examDate,
      year: getMetaValue(meta, 'year', new Date().getFullYear()),
      boardName: getMetaValue(meta, 'boardName', null),
      boardSlug: getMetaValue(meta, 'boardSlug', null),
      instituteName: getMetaValue(meta, 'instituteName', null),
      instituteSlug: getMetaValue(meta, 'instituteSlug', null),
      cityName: getMetaValue(meta, 'cityName', null),
      province: getMetaValue(meta, 'province', null),
      isPopular: getMetaValue(meta, 'isPopular', false),
      viewCount: getMetaValue(meta, 'viewCount', 0),
      officialLink: getMetaValue(meta, 'officialLink', null),
      downloadLink: getMetaValue(meta, 'downloadLink', null),
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
      featuredImage: post.featuredImage || null,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching date sheet detail:', error);
    return null;
  }
}

// ============ SEO: Generate Metadata ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  // Handle placeholder
  if (slug === 'placeholder') {
    return {
      title: 'Date Sheet Not Found | NextID.pk',
      description: 'The requested date sheet could not be found.',
      robots: { index: false },
    };
  }
  
  // ✅ Access cookies first to make route dynamic
  await cookies();
  
  const dateSheet = await getDateSheetDetail(slug);

  if (!dateSheet) {
    return {
      title: 'Date Sheet Not Found | NextID.pk',
      description: 'The requested date sheet could not be found.',
      robots: { index: false },
    };
  }

  const displayName = dateSheet.boardName || dateSheet.instituteName || '';
  // ✅ Now new Date() is allowed after cookies()
  const currentYear = new Date().getFullYear();
  
  const seoTitle = dateSheet.metaTitle || 
    `${displayName} ${dateSheet.examType} Exam Date Sheet ${currentYear} - Official Schedule | NextID.pk`;
  
  const seoDescription = dateSheet.metaDescription || 
    `Check ${displayName} ${dateSheet.examType} examinations date sheet ${currentYear}. View complete exam schedule on official website. ${dateSheet.examDate ? `Exams from ${formatDate(dateSheet.examDate)}.` : ''}`;
  
  const canonicalUrl = dateSheet.canonicalUrl || `https://www.nextid.pk/date-sheets/${dateSheet.slug}`;
  const ogImage = dateSheet.ogImage || dateSheet.featuredImage || '/og-image.png';

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      siteName: 'NextID.pk',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: dateSheet.publishedAt?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [ogImage],
    },
  };
}

// Loading component
function DateSheetLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading date sheet details...</p>
      </div>
    </div>
  );
}

// ============ DATE SHEET DETAILS ============
function DateSheetDetails({ dateSheetPromise }: { dateSheetPromise: Promise<DateSheetDetail | null> }) {
  const dateSheet = React.use(dateSheetPromise);
  
  if (!dateSheet) return null;
  
  const displayName = dateSheet.boardName || dateSheet.instituteName;
  const officialLink = dateSheet.officialLink || undefined;
  const hasOfficialLink = !!officialLink;
  
  const metaDescriptionText = dateSheet.description || 
    `${displayName} ${dateSheet.examType} examinations date sheet for ${dateSheet.year}. Check complete exam schedule including dates, subjects, and timings.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationEvent",
    "name": `${displayName} ${dateSheet.examType} Examinations ${dateSheet.year}`,
    "description": metaDescriptionText,
    "startDate": dateSheet.examDate?.toISOString(),
    "location": {
      "@type": "Place",
      "name": displayName || "Pakistan",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": dateSheet.cityName || "Pakistan",
        "addressCountry": "PK"
      }
    },
    "organizer": {
      "@type": "EducationalOrganization",
      "name": displayName,
      "url": dateSheet.officialLink || undefined
    }
  };
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.nextid.pk/" },
      { "@type": "ListItem", "position": 2, "name": "Date Sheets", "item": "https://www.nextid.pk/date-sheets" },
      { "@type": "ListItem", "position": 3, "name": dateSheet.title, "item": `https://www.nextid.pk/date-sheets/${dateSheet.slug}` }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      
      <main className="min-h-screen bg-gray-50">
        
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-orange-600 to-amber-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              
              {/* Breadcrumbs */}
              <div className="text-sm text-orange-100 mb-6 flex items-center gap-2 flex-wrap">
                <Link href="/" className="hover:text-white transition">Home</Link>
                <span>›</span>
                <Link href="/date-sheets" className="hover:text-white transition">Date Sheets</Link>
                <span>›</span>
                <span className="text-white font-medium truncate">{dateSheet.title}</span>
              </div>

              {dateSheet.isPopular && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                  <span>🔥</span>
                  <span className="text-sm font-medium">Popular Date Sheet</span>
                </div>
              )}

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {dateSheet.title}
              </h1>
              
              <div className="hidden" aria-hidden="true">
                {metaDescriptionText}
              </div>
              
              <p className="text-lg text-orange-100 mb-6">
                {dateSheet.examType} examinations date sheet for {dateSheet.year}.
                {displayName && ` Published by ${displayName}.`}
                <span className="block text-sm text-orange-200 mt-2">
                  📌 Click the button below to view on official website
                </span>
              </p>

              <div className="flex flex-wrap gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-orange-200 text-xs">Year</div>
                  <div className="text-white font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {dateSheet.year}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-orange-200 text-xs">Exam Type</div>
                  <div className="text-white font-semibold flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {dateSheet.examType}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-orange-200 text-xs">Views</div>
                  <div className="text-white font-semibold flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {dateSheet.viewCount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN - MAIN CONTENT */}
            <div className="lg:col-span-2 space-y-6">
              
              {hasOfficialLink && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
                    <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      View Date Sheet Online
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="text-center">
                      <a 
                        href={officialLink ?? undefined}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition font-semibold text-lg group w-full md:w-auto"
                      >
                        <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition" />
                        View {displayName} Date Sheet on Official Website
                        <span className="text-sm text-orange-200 ml-2">↗</span>
                      </a>
                      <p className="text-sm text-gray-500 mt-3">
                        You will be redirected to the official {displayName} website
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {dateSheet.description && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-500" />
                      About This Date Sheet
                    </h2>
                  </div>
                  <div className="p-6 prose prose-sm max-w-none text-gray-700">
                    <div dangerouslySetInnerHTML={{ __html: dateSheet.description }} />
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-500" />
                    {displayName} Exam Schedule {dateSheet.year}
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-xl p-4">
                      <div className="text-orange-500 text-xs font-medium">Exam Type</div>
                      <div className="font-semibold text-gray-900 text-base mt-1">{dateSheet.examType}</div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4">
                      <div className="text-orange-500 text-xs font-medium">Academic Year</div>
                      <div className="font-semibold text-gray-900 text-base mt-1">{dateSheet.year}</div>
                    </div>
                    {dateSheet.examDate && (
                      <div className="bg-orange-50 rounded-xl p-4 md:col-span-2">
                        <div className="text-orange-500 text-xs font-medium">Exam Start Date</div>
                        <div className="font-semibold text-gray-900 text-base mt-1 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          {formatDate(dateSheet.examDate)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100" data-nosnippet>
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  How to View Date Sheet?
                </h3>
                <ol className="space-y-2 text-sm text-blue-700 list-decimal list-inside">
                  <li>Click the <strong>&quot;View Date Sheet on Official Website&quot;</strong> button above</li>
                  <li>You will be redirected to the official {displayName} website</li>
                  <li>Look for the date sheet PDF or exam schedule section</li>
                  <li>Download or save the date sheet for reference</li>
                </ol>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <aside className="space-y-6">
              
              {displayName && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24" data-nosnippet>
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {dateSheet.boardName ? "Board Information" : "Institute Information"}
                    </h3>
                  </div>
                  <div className="p-6 text-center">
                    <div className="text-5xl mb-3">{dateSheet.boardName ? "🏛️" : "🎓"}</div>
                    <h4 className="font-bold text-gray-900 text-lg">{displayName}</h4>
                    {dateSheet.cityName && (
                      <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {dateSheet.cityName}{dateSheet.province ? `, ${dateSheet.province}` : ''}
                      </p>
                    )}
                    {dateSheet.officialLink && (
                      <a 
                        href={dateSheet.officialLink}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="mt-4 text-sm text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                      >
                        Visit Official Website
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-amber-50 rounded-xl p-5 border border-amber-200" data-nosnippet>
                <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <span>ℹ️</span> Important Note
                </h3>
                <p className="text-sm text-amber-700">
                  We provide direct link to the official {displayName} website where the 
                  official date sheet is published. We do not host PDF files directly.
                </p>
              </div>

            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

// ============ MAIN PAGE ============
export default async function DateSheetDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slugPromise = params.then(p => p.slug);
  
  const dataPromise = slugPromise.then(async (slug) => {
    // Handle placeholder
    if (slug === 'placeholder') {
      notFound();
    }
    
    const dateSheet = await getDateSheetDetail(slug);
    if (!dateSheet) notFound();
    return dateSheet;
  });
  
  return (
    <Suspense fallback={<DateSheetLoading />}>
      <DateSheetDetails dateSheetPromise={dataPromise} />
    </Suspense>
  );
}