// app/(public)/scholarships/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import React from 'react';
import { postService } from '@/services/post/post.service';
import { 
  Calendar, 
  GraduationCap, 
  MapPin, 
  Eye, 
  CheckCircle, 
  Clock,
  ChevronLeft,
  Award,
  DollarSign,
  ExternalLink,
  TrendingUp,
  Zap
} from 'lucide-react';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';
import { generateJsonLd } from '@/lib/seo';

// ============ TYPES ============
interface ScholarshipDetail {
  id: number;
  slug: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  studyLevel: string;
  type: string;
  location: string;
  deadline: Date | null;
  provider: string;
  amount: string | null;
  eligibility: string | null;
  coverage: string | null;
  officialLink: string | null;
  applicationLink: string | null;
  isFeatured: boolean;
  isPopular: boolean;
  viewCount: number;
  // SEO Fields from posts table
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
  if (!date) return 'TBA';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatShortDate(date: Date | null): string {
  if (!date) return 'TBA';
  return new Date(date).toLocaleDateString('en-PK', {
    month: 'short',
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

// ============ DATA FETCHING ============
async function getScholarshipBySlug(slug: string): Promise<ScholarshipDetail | null> {
  try {
    const post = await postService.getPost(slug);
    
    if (!post || post.type !== 'scholarship') {
      return null;
    }
    
    const meta = post.meta || {};
    const seoPost = post as unknown as Record<string, unknown>;
    
    let deadline: Date | null = null;
    const deadlineRaw = getMetaValue(meta, 'applicationDeadline', null);
    if (deadlineRaw && typeof deadlineRaw === 'string') {
      try {
        const parsed = new Date(deadlineRaw);
        if (!isNaN(parsed.getTime())) {
          deadline = parsed;
        }
      } catch {
        deadline = null;
      }
    }
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      studyLevel: getMetaValue(meta, 'studyLevel', 'Various'),
      type: getMetaValue(meta, 'type', 'Merit-Based'),
      location: getMetaValue(meta, 'location', 'Pakistan'),
      deadline: deadline,
      provider: getMetaValue(meta, 'organizationName', getMetaValue(meta, 'provider', 'Various')),
      amount: getMetaValue(meta, 'amount', null),
      eligibility: getMetaValue(meta, 'eligibility', null),
      coverage: getMetaValue(meta, 'coverage', null),
      officialLink: getMetaValue(meta, 'officialLink', null),
      applicationLink: getMetaValue(meta, 'applicationLink', null),
      isFeatured: getMetaValue(meta, 'isFeatured', false),
      isPopular: getMetaValue(meta, 'isPopular', false),
      viewCount: getMetaValue(meta, 'viewCount', 0),
      // ✅ SEO Fields from posts table
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
    console.error('Error fetching scholarship detail:', error);
    return null;
  }
}

// ============ METADATA ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const scholarship = await getScholarshipBySlug(slug);

  if (!scholarship) {
    return {
      title: 'Scholarship Not Found | NextID.pk',
      description: 'The requested scholarship could not be found.',
      robots: { index: false },
    };
  }

  // ✅ Use SEO data from database
  const seoTitle = scholarship.metaTitle || `${scholarship.title} - ${scholarship.studyLevel} Scholarship ${new Date().getFullYear()} | NextID.pk`;
  const seoDescription = scholarship.metaDescription || scholarship.excerpt || `Apply for ${scholarship.title} scholarship offered by ${scholarship.provider}. ${scholarship.amount ? `Award amount: ${scholarship.amount}. ` : ''}Deadline: ${formatShortDate(scholarship.deadline)}.`;
  const seoKeywords = scholarship.metaKeywords || `${scholarship.title} scholarship, ${scholarship.studyLevel} scholarship, ${scholarship.provider} scholarship, ${scholarship.location} scholarship, Pakistan scholarship ${new Date().getFullYear()}`;
  const canonicalUrl = scholarship.canonicalUrl || `https://www.nextid.pk/scholarships/${scholarship.slug}`;
  const robots = scholarship.robots || 'index, follow';
  
  const robotsObj = {
    index: robots.includes('index'),
    follow: robots.includes('follow'),
  };
  
  const ogTitle = scholarship.ogTitle || seoTitle;
  const ogDescription = scholarship.ogDescription || seoDescription;
  const ogImage = scholarship.ogImage || scholarship.featuredImage || '/og-image.png';
  
  const twitterTitle = scholarship.twitterTitle || ogTitle;
  const twitterDescription = scholarship.twitterDescription || ogDescription;

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
      publishedTime: scholarship.publishedAt?.toISOString(),
      modifiedTime: scholarship.updatedAt?.toISOString(),
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
function ScholarshipLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading scholarship details...</p>
      </div>
    </div>
  );
}

// ============ SCHOLARSHIP CONTENT COMPONENT ============
function ScholarshipContent({ scholarshipPromise }: { scholarshipPromise: Promise<ScholarshipDetail | null> }) {
  const scholarship = React.use(scholarshipPromise);
  
  if (!scholarship) return null;
  
  const daysLeft = getDaysLeft(scholarship.deadline);
  const isOpen = daysLeft !== null && daysLeft > 0;
  const isUrgent = daysLeft !== null && daysLeft <= 7;

  // ✅ Generate JSON-LD Structured Data for SEO
  const jsonLd = generateJsonLd({
    type: 'Article',
    title: scholarship.title,
    description: scholarship.excerpt || `Apply for ${scholarship.title} scholarship`,
    url: `https://www.nextid.pk/scholarships/${scholarship.slug}`,
    image: scholarship.featuredImage || undefined,
    datePublished: scholarship.publishedAt?.toISOString(),
    dateModified: scholarship.updatedAt?.toISOString(),
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Scholarships', url: '/scholarships' },
      { name: scholarship.title, url: `/scholarships/${scholarship.slug}` },
    ],
  });

  return (
    <>
      {/* ✅ JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* ✅ Scholarship Schema for better SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOccupationalProgram",
            "name": scholarship.title,
            "description": scholarship.excerpt,
            "provider": {
              "@type": "Organization",
              "name": scholarship.provider,
              "url": scholarship.officialLink || undefined
            },
            "educationalProgramMode": scholarship.studyLevel,
            "financialAidEligible": true,
            "deadline": scholarship.deadline?.toISOString(),
            "url": `https://www.nextid.pk/scholarships/${scholarship.slug}`,
            "amount": scholarship.amount ? {
              "@type": "MonetaryAmount",
              "value": scholarship.amount
            } : undefined
          })
        }}
      />
      
      <main className="min-h-screen bg-gray-50">
        
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-teal-600 to-emerald-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              
              {/* Back Button */}
              <Link 
                href="/scholarships" 
                className="inline-flex items-center gap-1 text-teal-200 hover:text-white transition mb-6 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
                Back to Scholarships
              </Link>
              
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {scholarship.isFeatured && (
                  <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs px-3 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    Featured
                  </span>
                )}
                {scholarship.isPopular && (
                  <span className="inline-flex items-center gap-1 bg-yellow-500 text-white text-xs px-3 py-1 rounded-full">
                    <Zap className="w-3 h-3" />
                    Popular
                  </span>
                )}
                {isOpen && isUrgent && (
                  <span className="inline-flex items-center gap-1 bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-pulse">
                    <Clock className="w-3 h-3" />
                    Urgent - Apply Soon
                  </span>
                )}
                {!isOpen && scholarship.deadline && (
                  <span className="inline-flex items-center gap-1 bg-gray-500 text-white text-xs px-3 py-1 rounded-full">
                    Closed
                  </span>
                )}
              </div>
              
              {/* Title - H1 for SEO */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {scholarship.title}
              </h1>
              
              {/* Provider */}
              <p className="text-xl text-teal-200 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Offered by {scholarship.provider}
              </p>
              
              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-teal-200">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>{scholarship.studyLevel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>{scholarship.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{scholarship.location}</span>
                </div>
                {scholarship.amount && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>{scholarship.amount}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{scholarship.viewCount.toLocaleString()} views</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* MAIN CONTENT */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                
                {/* Content */}
                <div className="p-6">
                  
                  {/* Excerpt */}
                  {scholarship.excerpt && (
                    <div className="mb-6 p-4 bg-teal-50 rounded-lg border-l-4 border-teal-500">
                      <p className="text-teal-800 text-base leading-relaxed">{scholarship.excerpt}</p>
                    </div>
                  )}
                  
                  {/* Scholarship Details */}
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-teal-500" />
                    Scholarship Details
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-gray-500 text-xs mb-1">Provider</div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-teal-500" />
                        {scholarship.provider}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-gray-500 text-xs mb-1">Study Level</div>
                      <div className="font-semibold text-gray-900">{scholarship.studyLevel}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-gray-500 text-xs mb-1">Scholarship Type</div>
                      <div className="font-semibold text-gray-900">{scholarship.type}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-gray-500 text-xs mb-1">Location</div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-teal-500" />
                        {scholarship.location}
                      </div>
                    </div>
                    {scholarship.amount && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-gray-500 text-xs mb-1">Award Amount</div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          {scholarship.amount}
                        </div>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-gray-500 text-xs mb-1">Application Deadline</div>
                      <div className={`font-semibold flex items-center gap-2 ${isUrgent && isOpen ? 'text-red-600' : 'text-gray-900'}`}>
                        <Calendar className="w-4 h-4" />
                        {formatDate(scholarship.deadline)}
                        {daysLeft && isOpen && <span className="text-sm">({daysLeft} days left)</span>}
                      </div>
                    </div>
                  </div>

                  {/* Eligibility Criteria */}
                  {scholarship.eligibility && (
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-500" />
                        Eligibility Criteria
                      </h3>
                      <div 
                        className="prose prose-sm max-w-none text-gray-600"
                        dangerouslySetInnerHTML={{ __html: scholarship.eligibility }}
                      />
                    </div>
                  )}

                  {/* Coverage */}
                  {scholarship.coverage && (
                    <div className="border-t border-gray-100 pt-6 mt-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Coverage</h3>
                      <div 
                        className="prose prose-sm max-w-none text-gray-600"
                        dangerouslySetInnerHTML={{ __html: scholarship.coverage }}
                      />
                    </div>
                  )}

                  {/* Additional Content */}
                  {scholarship.content && (
                    <div className="border-t border-gray-100 pt-6 mt-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
                      <div 
                        className="prose prose-sm max-w-none text-gray-600"
                        dangerouslySetInnerHTML={{ __html: scholarship.content }}
                      />
                    </div>
                  )}

                  {/* Apply Links */}
                  {(scholarship.applicationLink || scholarship.officialLink) && (
                    <div className="border-t border-gray-100 pt-6 mt-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Apply Now</h3>
                      <div className="flex flex-wrap gap-3">
                        {scholarship.applicationLink && (
                          <a 
                            href={scholarship.applicationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-semibold group"
                          >
                            Apply Online
                            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                          </a>
                        )}
                        {scholarship.officialLink && (
                          <a 
                            href={scholarship.officialLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition group"
                          >
                            Official Website
                            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <aside className="lg:w-1/3">
              <div className="sticky top-24 space-y-6">
                
                {/* How to Apply Guide */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500" />
                    How to Apply?
                  </h3>
                  <ol className="space-y-3 text-sm text-gray-600">
                    <li className="flex gap-2">
                      <span className="w-5 h-5 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span>Click the &quot;Apply Online&quot; button above</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span>Fill the application form</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span>Upload required documents</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-5 h-5 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      <span>Submit before deadline</span>
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
export default async function ScholarshipDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slugPromise = params.then(p => p.slug);
  
  const scholarshipPromise = slugPromise.then(async (slug) => {
    const scholarship = await getScholarshipBySlug(slug);
    if (!scholarship) notFound();
    return scholarship;
  });
  
  return (
    <Suspense fallback={<ScholarshipLoading />}>
      <ScholarshipContent scholarshipPromise={scholarshipPromise} />
    </Suspense>
  );
}