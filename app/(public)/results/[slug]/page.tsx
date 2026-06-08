// app/(public)/results/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import React from 'react';
import { postService } from '@/services/post/post.service';
import { 
  Calendar, 
  Building2, 
  MapPin, 
  Eye, 
  CheckCircle, 
  Clock,
  ChevronLeft,
  FileText,
  Award,
  ExternalLink,
  TrendingUp
} from 'lucide-react';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';
import { generateJsonLd } from '@/lib/seo';

// ============ TYPES ============
interface ResultDetail {
  id: number;
  slug: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  year: number;
  resultDate: Date | null;
  boardName: string | null;
  boardSlug: string | null;
  instituteName: string | null;
  instituteSlug: string | null;
  cityName: string | null;
  officialLink: string | null;
  isPopular: boolean;
  status: boolean;
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

function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ============ DATA FETCHING ============
async function getResultBySlug(slug: string): Promise<ResultDetail | null> {
  try {
    const post = await postService.getPost(slug);
    
    if (!post || post.type !== 'result') {
      return null;
    }
    
    const meta = post.meta || {};
    const seoPost = post as unknown as Record<string, unknown>;
    
    let resultDate: Date | null = null;
    const resultDateRaw = getMetaValue(meta, 'resultDate', null);
    if (resultDateRaw && typeof resultDateRaw === 'string') {
      try {
        const parsed = new Date(resultDateRaw);
        if (!isNaN(parsed.getTime())) {
          resultDate = parsed;
        }
      } catch {
        resultDate = null;
      }
    }
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      year: getMetaValue(meta, 'year', new Date().getFullYear()),
      resultDate: resultDate,
      boardName: getMetaValue(meta, 'boardName', null),
      boardSlug: getMetaValue(meta, 'boardSlug', null),
      instituteName: getMetaValue(meta, 'universityName', getMetaValue(meta, 'instituteName', null)),
      instituteSlug: getMetaValue(meta, 'universitySlug', getMetaValue(meta, 'instituteSlug', null)),
      cityName: getMetaValue(meta, 'cityName', null),
      officialLink: getMetaValue(meta, 'officialLink', null),
      isPopular: getMetaValue(meta, 'isPopular', false),
      status: getMetaValue(meta, 'status', true),
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
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching result detail:', error);
    return null;
  }
}

// ============ METADATA ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getResultBySlug(slug);

  if (!result) {
    return {
      title: 'Result Not Found | NextID.pk',
      description: 'The requested result could not be found.',
      robots: { index: false },
    };
  }

  const institutionName = result.instituteName || result.boardName || '';
  
  // ✅ IMPROVED: Better SEO description with actual result data
  const seoTitle = result.metaTitle || `${institutionName} ${result.year} Result - Check Online | NextID.pk`;
  const seoDescription = result.metaDescription || 
    ` ${institutionName} Class ${result.year} result announced. Check your ${result.boardName || institutionName} result online by roll number. ${result.cityName ? `Board ${result.cityName}.` : ''} Download result card.`;
  const seoKeywords = result.metaKeywords || `${institutionName} result ${result.year}, ${institutionName} ${result.year} result, ${result.boardName} result, ${result.cityName} board result, Pakistan result ${result.year}`;
  const canonicalUrl = result.canonicalUrl || `https://www.nextid.pk/results/${result.slug}`;
  const robots = result.robots || 'index, follow';
  
  const robotsObj = {
    index: robots.includes('index'),
    follow: robots.includes('follow'),
  };
  
  const ogTitle = result.ogTitle || seoTitle;
  const ogDescription = result.ogDescription || seoDescription;
  const ogImage = result.ogImage || result.featuredImage || '/og-image.png';
  
  const twitterTitle = result.twitterTitle || ogTitle;
  const twitterDescription = result.twitterDescription || ogDescription;

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
      publishedTime: result.publishedAt?.toISOString(),
      modifiedTime: result.updatedAt?.toISOString(),
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
function ResultLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading result details...</p>
      </div>
    </div>
  );
}

// ============ MAIN RESULT CONTENT COMPONENT ============
function ResultContent({ resultPromise }: { resultPromise: Promise<ResultDetail | null> }) {
  const result = React.use(resultPromise);
  
  if (!result) return null;
  
  const institutionName = result.instituteName || result.boardName || '';
  const officialWebsite = result.officialLink;

  // ✅ JSON-LD Structured Data
  const jsonLd = generateJsonLd({
    type: 'Article',
    title: result.title,
    description: result.excerpt || `${institutionName} ${result.year} result check online`,
    url: `https://www.nextid.pk/results/${result.slug}`,
    image: result.featuredImage || undefined,
    datePublished: result.publishedAt?.toISOString(),
    dateModified: result.updatedAt?.toISOString(),
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Results', url: '/results' },
      { name: `${institutionName} Result ${result.year}`, url: `/results/${result.slug}` },
    ],
  });

  // ✅ Extract first 150 characters from excerpt for better snippet
  const metaDescriptionText = result.excerpt 
    ? result.excerpt.substring(0, 150) 
    : `${institutionName} ${result.year} result. Check online by roll number.`;

  return (
    <>
      {/* ✅ JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* ✅ Education Event Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationEvent",
            "name": result.title,
            "description": result.excerpt,
            "startDate": result.resultDate?.toISOString(),
            "location": {
              "@type": "Place",
              "name": institutionName,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": result.cityName || 'Pakistan',
                "addressCountry": "PK"
              }
            },
            "organizer": {
              "@type": "Organization",
              "name": institutionName,
              "url": officialWebsite || undefined
            }
          })
        }}
      />
      
      <main className="min-h-screen bg-gray-50">
        
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-green-600 to-teal-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              
              {/* Back Button */}
              <Link 
                href="/results" 
                className="inline-flex items-center gap-1 text-green-200 hover:text-white transition mb-6 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
                Back to Results
              </Link>
              
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {result.status ? (
                  <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Result Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-yellow-500 text-white text-xs px-3 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    Result Pending
                  </span>
                )}
                {result.isPopular && (
                  <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs px-3 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    Popular
                  </span>
                )}
              </div>
              
              {/* ✅ H1 - IMPROVED: More descriptive for SEO */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {result.title}
              </h1>
              
              {/* ✅ Meta Description hidden div for SEO (Google reads this) */}
              <div className="hidden" aria-hidden="true">
                {metaDescriptionText}
              </div>
              
              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-green-200">
                {institutionName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>{institutionName}</span>
                  </div>
                )}
                {result.cityName && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{result.cityName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Year: {result.year}</span>
                </div>
                {result.resultDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Announced: {formatDate(result.resultDate)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{result.viewCount.toLocaleString()} views</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* ✅ MAIN CONTENT - MOVED HIGHER FOR SEO */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                
                {/* Content */}
                <div className="p-6">
                  
                  {/* ✅ Excerpt - THIS IS WHAT GOOGLE SHOULD SHOW */}
                  {result.excerpt && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <p className="text-green-800 text-base leading-relaxed font-medium">
                        {result.excerpt}
                      </p>
                    </div>
                  )}
                  
                  {/* ✅ Result Information Table - SEO FRIENDLY */}
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-500" />
                    {institutionName} {result.year} Result Details
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-gray-500 text-xs mb-1">Board / Institution</div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-green-500" />
                        {institutionName || '—'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-gray-500 text-xs mb-1">Exam Year</div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-500" />
                        {result.year || '—'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-gray-500 text-xs mb-1">Result Date</div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-500" />
                        {formatDate(result.resultDate) || 'TBA'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-gray-500 text-xs mb-1">Total Views</div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-green-500" />
                        {result.viewCount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Additional Content */}
                  {result.content && (
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Additional Information About {institutionName} Result {result.year}
                      </h3>
                      <div 
                        className="prose prose-sm max-w-none text-gray-600"
                        dangerouslySetInnerHTML={{ __html: result.content }}
                      />
                    </div>
                  )}

                  {/* Official Link */}
                  {officialWebsite && (
                    <div className="border-t border-gray-100 pt-6 mt-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Official Result Link</h3>
                      <a 
                        href={officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition group"
                      >
                        <Award className="w-4 h-4" />
                        Check {institutionName} Result {result.year} Online
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ RIGHT SIDEBAR - ADDED data-nosnippet to hide instructions from Google */}
            <aside className="lg:w-1/3">
              <div className="sticky top-24 space-y-6">
                
                {/* ✅ FIXED: How to Check Guide with data-nosnippet */}
                <div 
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
                  data-nosnippet  // 👈 THIS TELLS GOOGLE NOT TO USE THIS IN SNIPPETS
                >
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    How to Check Result?
                  </h3>
                  <ol className="space-y-3 text-sm text-gray-600">
                    <li className="flex gap-2">
                      <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span>Click the &quot;Check Result Online&quot; button above</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span>Enter your Roll Number</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span>Select your exam type (Annual/Supplementary)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      <span>Click the &quot;Submit&quot; to view your result</span>
                    </li>
                  </ol>
                </div>
                
                {/* Sidebar Widgets */}
                <SidebarWidgets />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

// ============ MAIN PAGE ============
export default async function ResultDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slugPromise = params.then(p => p.slug);
  
  const resultPromise = slugPromise.then(async (slug) => {
    const result = await getResultBySlug(slug);
    if (!result) notFound();
    return result;
  });
  
  return (
    <Suspense fallback={<ResultLoading />}>
      <ResultContent resultPromise={resultPromise} />
    </Suspense>
  );
}