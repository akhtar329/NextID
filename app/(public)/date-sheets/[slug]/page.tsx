// app/(public)/date-sheets/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { postService } from '@/services/post/post.service';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  Eye, 
  ExternalLink, 
  FileText, 
  AlertCircle,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  ChevronLeft
} from 'lucide-react';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';
import { cacheTag, cacheLife } from 'next/cache';

// ============ TYPES ============
interface DateSheetWithComputed {
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
  // Computed values
  formattedDate: string;
  displayName: string;
  currentYear: string;
}

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' });
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

// ============ SHARE BUTTONS ============
function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `https://www.nextid.pk/date-sheets/${slug}`;
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
        <Mail className="w-4 h-4" />
      </a>
    </div>
  );
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
async function getDateSheetDetail(slug: string): Promise<DateSheetWithComputed | null> {
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
    
    // ✅ FIXED: Static year (no new Date())
    const currentYear = '2026';
    const year = getMetaValue(meta, 'year', parseInt(currentYear));
    const boardName = getMetaValue(meta, 'boardName', null);
    const instituteName = getMetaValue(meta, 'instituteName', null);
    const displayName = boardName || instituteName || 'Education Board';
  
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      description: post.content || post.excerpt,
      examType: getMetaValue(meta, 'examType', 'Annual'),
      examDate: examDate,
      year: year,
      boardName: boardName,
      boardSlug: getMetaValue(meta, 'boardSlug', null),
      instituteName: instituteName,
      instituteSlug: getMetaValue(meta, 'instituteSlug', null),
      cityName: getMetaValue(meta, 'cityName', null),
      province: getMetaValue(meta, 'province', null),
      isPopular: getMetaValue(meta, 'isPopular', false),
      viewCount: getMetaValue(meta, 'viewCount', 0),
      officialLink: getMetaValue(meta, 'officialLink', null),
      downloadLink: getMetaValue(meta, 'downloadLink', null),
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
      formattedDate: formatDate(examDate),
      displayName: displayName,
      currentYear: currentYear,
    };
  } catch (error) {
    console.error('Error fetching date sheet detail:', error);
    return null;
  }
}

// ============ METADATA ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  if (slug === 'placeholder') {
    return {
      title: 'Date Sheet Not Found | NextID.pk',
      description: 'The requested date sheet could not be found.',
      robots: { index: false },
    };
  }
  
  const dateSheet = await getDateSheetDetail(slug);

  if (!dateSheet) {
    return {
      title: 'Date Sheet Not Found | NextID.pk',
      description: 'The requested date sheet could not be found.',
      robots: { index: false },
    };
  }

  const seoTitle = dateSheet.metaTitle || 
    `${dateSheet.displayName} ${dateSheet.examType} Exam Date Sheet ${dateSheet.currentYear} - Official Schedule | NextID.pk`;
  
  const seoDescription = dateSheet.metaDescription || 
    `Check ${dateSheet.displayName} ${dateSheet.examType} examinations date sheet ${dateSheet.currentYear}. View complete exam schedule on official website. ${dateSheet.examDate ? `Exams from ${dateSheet.formattedDate}.` : ''}`;
  
  const canonicalUrl = dateSheet.canonicalUrl || `https://www.nextid.pk/date-sheets/${dateSheet.slug}`;
  const ogImage = dateSheet.ogImage || dateSheet.featuredImage || '/og-image.png';
  const robots = dateSheet.robots || 'index, follow';

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: dateSheet.metaKeywords || undefined, // ✅ ADDED
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
      title: dateSheet.ogTitle || seoTitle,
      description: dateSheet.ogDescription || seoDescription,
      url: canonicalUrl,
      siteName: 'NextID.pk',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: dateSheet.publishedAt?.toISOString(),
      modifiedTime: dateSheet.updatedAt?.toISOString(), // ✅ ADDED
    },
    twitter: {
      card: 'summary_large_image',
      title: dateSheet.twitterTitle || seoTitle,
      description: dateSheet.twitterDescription || seoDescription,
      images: [ogImage],
    },
  };
}

// ============ LOADING COMPONENT ============
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

// ============ SCHEMA: BREADCRUMB ============
function BreadcrumbSchema({ dateSheet }: { dateSheet: DateSheetWithComputed }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.nextid.pk/" },
      { "@type": "ListItem", "position": 2, "name": "Date Sheets", "item": "https://www.nextid.pk/date-sheets" },
      { "@type": "ListItem", "position": 3, "name": dateSheet.title, "item": `https://www.nextid.pk/date-sheets/${dateSheet.slug}` }
    ]
  };
  
  return (
    <script 
      type="application/ld+json" 
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} 
    />
  );
}

// ============ DATE SHEET DETAILS (SERVER COMPONENT) ============
async function DateSheetDetails({ slug }: { slug: string }) {
  const dateSheet = await getDateSheetDetail(slug);
  
  if (!dateSheet) return null;
  
  const displayName = dateSheet.displayName;
  const officialLink = dateSheet.officialLink;
  const hasOfficialLink = !!officialLink;
  const sanitizedDescription = sanitizeContent(dateSheet.description);
  
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BreadcrumbSchema dateSheet={dateSheet} />
      
      <main className="min-h-screen bg-gray-50">
        
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-orange-600 to-amber-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              
              <Link 
                href="/date-sheets" 
                className="inline-flex items-center gap-2 text-orange-200 hover:text-white transition mb-6 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
                Back to Date Sheets
              </Link>

              {dateSheet.isPopular && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                  <span>🔥</span>
                  <span className="text-sm font-medium">Popular Date Sheet</span>
                </div>
              )}

              {/* ✅ ONLY H1 on the page */}
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
              
              {/* Featured Image with Fallback */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <div className="relative w-full h-64 md:h-80 bg-gradient-to-br from-orange-100 to-amber-100">
                  {dateSheet.featuredImage ? (
                    <Image
                      src={dateSheet.featuredImage}
                      alt={dateSheet.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-white/80 shadow-lg flex items-center justify-center mx-auto mb-3">
                          <FileText className="w-10 h-10 text-orange-500" />
                        </div>
                        <p className="text-gray-600 font-medium">{displayName}</p>
                        <p className="text-gray-400 text-sm">Date Sheet {dateSheet.year}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
                        href={officialLink}
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

              {/* Description/Content with Sanitized Headings */}
              {dateSheet.description && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-500" />
                      About This Date Sheet
                    </h2>
                  </div>
                  <div className="p-6">
                    <div 
                      className="prose prose-sm max-w-none text-gray-700
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
                </div>
              )}

              {/* Exam Schedule Info */}
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
                          {dateSheet.formattedDate}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* How to View */}
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

              {/* Share Buttons */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-sm text-gray-500 font-medium">Share this date sheet:</span>
                  <ShareButtons title={dateSheet.title} slug={dateSheet.slug} />
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <aside className="space-y-6">
              
              {/* Institute/Board Info */}
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

              {/* Important Note */}
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-200" data-nosnippet>
                <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <span>ℹ️</span> Important Note
                </h3>
                <p className="text-sm text-amber-700">
                  We provide direct link to the official {displayName} website where the 
                  official date sheet is published. We do not host PDF files directly.
                </p>
              </div>

              {/* Sidebar Widgets */}
              <Suspense fallback={<div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-64"></div>}>
                <SidebarWidgets />
              </Suspense>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

// ============ MAIN PAGE ============
export default async function DateSheetDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  if (slug === 'placeholder') {
    notFound();
  }
  
  return (
    <Suspense fallback={<DateSheetLoading />}>
      <DateSheetDetails slug={slug} />
    </Suspense>
  );
}