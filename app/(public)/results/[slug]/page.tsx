// app/(public)/results/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import React from 'react';
import { postService } from '@/services/post/post.service';
import type { ExtendedPost } from '@/services/post/post.service';
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
import { cacheTag, cacheLife } from 'next/cache';

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

function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ============ GENERATE STATIC PARAMS ============
export async function generateStaticParams() {
  try {
    const posts = await postService.getList('result', 100);
    
    if (posts && posts.length > 0) {
      return posts.map((post) => ({
        slug: post.slug,
      }));
    }
    
    // Return placeholder for build validation
    return [{ slug: 'placeholder' }];
    
  } catch (error) {
    console.error('Error generating static params for results:', error);
    return [{ slug: 'placeholder' }];
  }
}

// ============ CACHED DATA FETCHING ============
async function getResultBySlug(slug: string): Promise<ResultDetail | null> {
  "use cache";
  cacheTag(`result-detail-${slug}`);
  cacheLife("hours");
  
  try {
    const post = await postService.getDetail(slug);
    
    if (!post || post.type !== 'result') {
      return null;
    }
    
    const meta = post.meta || {};
    
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
    console.error('Error fetching result detail:', error);
    return null;
  }
}

// ============ METADATA ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  // Handle placeholder
  if (slug === 'placeholder') {
    return {
      title: 'Result Not Found | NextID.pk',
      description: 'The requested result could not be found.',
      robots: { index: false },
    };
  }
  
  const result = await getResultBySlug(slug);

  if (!result) {
    return {
      title: 'Result Not Found | NextID.pk',
      description: 'The requested result could not be found.',
      robots: { index: false },
    };
  }

  const institutionName = result.instituteName || result.boardName || '';
  
  const seoTitle = result.metaTitle || `${institutionName} ${result.year} Result - Check Online | NextID.pk`;
  const seoDescription = result.metaDescription || 
    `${institutionName} Class ${result.year} result announced. Check your ${result.boardName || institutionName} result online by roll number. ${result.cityName ? `Board ${result.cityName}.` : ''} Download result card.`;
  const canonicalUrl = result.canonicalUrl || `https://www.nextid.pk/results/${result.slug}`;
  const ogImage = result.ogImage || result.featuredImage || '/og-image.png';

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
      publishedTime: result.publishedAt?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [ogImage],
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

  const metaDescriptionText = result.excerpt 
    ? result.excerpt.substring(0, 150) 
    : `${institutionName} ${result.year} result. Check online by roll number.`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
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
      }) }} />
      
      <main className="min-h-screen bg-gray-50">
        
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-green-600 to-teal-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              
              <Link 
                href="/results" 
                className="inline-flex items-center gap-1 text-green-200 hover:text-white transition mb-6 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
                Back to Results
              </Link>
              
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
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {result.title}
              </h1>
              
              <div className="hidden" aria-hidden="true">
                {metaDescriptionText}
              </div>
              
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
            
            <div className="lg:w-2/3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                
                <div className="p-6">
                  
                  {result.excerpt && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <p className="text-green-800 text-base leading-relaxed font-medium">
                        {result.excerpt}
                      </p>
                    </div>
                  )}
                  
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

            <aside className="lg:w-1/3">
              <div className="sticky top-24 space-y-6">
                
                <div 
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
                  data-nosnippet
                >
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    How to Check Result?
                  </h3>
                  <ol className="space-y-3 text-sm text-gray-600">
                    <li className="flex gap-2">
                      <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span>Click the "Check Result Online" button above</span>
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
                      <span>Click the "Submit" to view your result</span>
                    </li>
                  </ol>
                </div>
                
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
export default async function ResultDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slugPromise = params.then(p => p.slug);
  
  const resultPromise = slugPromise.then(async (slug) => {
    // Handle placeholder
    if (slug === 'placeholder') {
      notFound();
    }
    
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