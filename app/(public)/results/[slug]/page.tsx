// app/(public)/results/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
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
  TrendingUp,
  Twitter,
  Facebook,
  Linkedin,
  Mail
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
  sanitizedContent: string;
  formattedDate: string;
  institutionName: string;
}

// ============ CONSTANTS ============
const CURRENT_YEAR = '2026';
const REFERENCE_DATE = new Date('2024-01-01T00:00:00.000Z');

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

// ✅ FIXED: Safe date formatter with type checking
function formatDateStatic(date: Date | string | null): string {
  if (!date) return '';
  
  // ✅ Convert string to Date if needed
  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return '';
  }
  
  // ✅ Check if valid date
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ✅ Helper to safely convert date to Date object
function safeParseDate(date: Date | string | null): Date | null {
  if (!date) return null;
  
  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return null;
  }
  
  if (isNaN(dateObj.getTime())) {
    return null;
  }
  
  return dateObj;
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

// ============ SHARE BUTTONS ============
function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `https://www.nextid.pk/results/${slug}`;
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

// ============ BREADCRUMB SCHEMA ============
function BreadcrumbSchema({ result }: { result: ResultDetail }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.nextid.pk/" },
      { "@type": "ListItem", "position": 2, "name": "Results", "item": "https://www.nextid.pk/results" },
      { "@type": "ListItem", "position": 3, "name": result.title, "item": `https://www.nextid.pk/results/${result.slug}` }
    ]
  };
  
  return (
    <script 
      type="application/ld+json" 
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} 
    />
  );
}

// ============ GENERATE STATIC PARAMS ============
export async function generateStaticParams() {
  try {
    const posts = await postService.getList('result', 10);
    
    if (posts && posts.length > 0) {
      return posts.map((post) => ({
        slug: post.slug,
      }));
    }
    
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
    
    // ✅ Safely parse resultDate
    const resultDateRaw = getMetaValue(meta, 'resultDate', null);
    const resultDate = safeParseDate(resultDateRaw);
    
    // ✅ Safely parse publishedAt and updatedAt
    const publishedAt = safeParseDate(post.publishedAt);
    const updatedAt = safeParseDate(post.updatedAt);
    
    // ✅ Static year (no new Date())
    const year = getMetaValue(meta, 'year', parseInt(CURRENT_YEAR));
    const boardName = getMetaValue(meta, 'boardName', null);
    const instituteName = getMetaValue(meta, 'universityName', getMetaValue(meta, 'instituteName', null));
    const institutionName = instituteName || boardName || '';
    const content = post.content || '';
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      year: year,
      resultDate: resultDate, // ✅ Now Date object or null
      boardName: boardName,
      boardSlug: getMetaValue(meta, 'boardSlug', null),
      instituteName: instituteName,
      instituteSlug: getMetaValue(meta, 'universitySlug', getMetaValue(meta, 'instituteSlug', null)),
      cityName: getMetaValue(meta, 'cityName', null),
      officialLink: getMetaValue(meta, 'officialLink', null),
      isPopular: getMetaValue(meta, 'isPopular', false),
      status: getMetaValue(meta, 'status', true),
      viewCount: getMetaValue(meta, 'viewCount', 0),
      featuredImage: post.featuredImage || null,
      publishedAt: publishedAt, // ✅ Now Date object or null
      updatedAt: updatedAt,     // ✅ Now Date object or null
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
      sanitizedContent: sanitizeContent(content),
      formattedDate: formatDateStatic(resultDate),
      institutionName: institutionName,
    };
  } catch (error) {
    console.error('Error fetching result detail:', error);
    return null;
  }
}

// ============ METADATA ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
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

  const institutionName = result.institutionName;
  const seoTitle = result.metaTitle || `${institutionName} ${result.year} Result - Check Online | NextID.pk`;
  const seoDescription = result.metaDescription || 
    `${institutionName} Class ${result.year} result announced. Check your ${result.boardName || institutionName} result online by roll number. ${result.cityName ? `Board ${result.cityName}.` : ''} Download result card.`;
  const canonicalUrl = result.canonicalUrl || `https://www.nextid.pk/results/${result.slug}`;
  const ogImage = result.ogImage || result.featuredImage || '/og-image.png';
  const robots = result.robots || 'index, follow';

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: result.metaKeywords || undefined,
    robots: robots,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-US': canonicalUrl,
      },
    },
    publisher: 'NextID.pk',
    authors: [{ name: 'NextID Team' }],
    openGraph: {
      title: result.ogTitle || seoTitle,
      description: result.ogDescription || seoDescription,
      url: canonicalUrl,
      siteName: 'NextID.pk',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: result.publishedAt?.toISOString(),
      modifiedTime: result.updatedAt?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: result.twitterTitle || seoTitle,
      description: result.twitterDescription || seoDescription,
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

// ============ MAIN RESULT CONTENT COMPONENT (SERVER) ============
async function ResultContent({ slug }: { slug: string }) {
  if (slug === 'placeholder') {
    notFound();
  }
  
  const result = await getResultBySlug(slug);
  
  if (!result) {
    notFound();
  }
  
  const institutionName = result.institutionName;
  const officialWebsite = result.officialLink;
  const statusText = result.status ? 'Published' : 'Pending';

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
      <BreadcrumbSchema result={result} />
      
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
              
              {/* ✅ Breadcrumbs UI */}
              <div className="text-sm text-green-200 mb-2 flex items-center gap-2 flex-wrap">
                <Link href="/" className="hover:text-white transition">Home</Link>
                <span>›</span>
                <Link href="/results" className="hover:text-white transition">Results</Link>
                <span>›</span>
                <span className="text-white font-medium truncate">{result.title}</span>
              </div>
              
              <Link 
                href="/results" 
                className="inline-flex items-center gap-1 text-green-200 hover:text-white transition mb-4 group"
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
              
              {/* ✅ ONLY H1 on the page */}
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
                    <span>Announced: {result.formattedDate}</span>
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
              
              {/* ✅ Featured Image with Fallback */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 mb-6">
                <div className="relative w-full h-64 md:h-80 bg-gradient-to-br from-green-100 to-teal-100">
                  {result.featuredImage ? (
                    <Image
                      src={result.featuredImage}
                      alt={result.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-white/80 shadow-lg flex items-center justify-center mx-auto mb-3">
                          <Award className="w-10 h-10 text-green-500" />
                        </div>
                        <p className="text-gray-600 font-medium">{institutionName}</p>
                        <p className="text-gray-400 text-sm">Result {result.year}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
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
                        {result.formattedDate || 'TBA'}
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

                  {/* ✅ Content with Sanitized Headings */}
                  {result.content && (
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Additional Information About {institutionName} Result {result.year}
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
                          __html: result.sanitizedContent 
                        }}
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
              
              {/* ✅ Share Buttons */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-sm text-gray-500 font-medium">Share this result:</span>
                  <ShareButtons title={result.title} slug={result.slug} />
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
  const { slug } = await params;
  
  return (
    <Suspense fallback={<ResultLoading />}>
      <ResultContent slug={slug} />
    </Suspense>
  );
}