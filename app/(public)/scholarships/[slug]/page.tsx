// app/(public)/scholarships/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { postService, getCurrentYear, getDaysLeft, formatShortDate, isDeadlineNear } from '@/services/post/post.service';
import { cacheTag, cacheLife } from 'next/cache';
import { 
  GraduationCap, MapPin, Eye, CheckCircle, Clock,
  ChevronLeft, Award, DollarSign, ExternalLink, TrendingUp, Zap, AlertCircle,
  Twitter, Facebook, Linkedin, Mail
} from 'lucide-react';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';

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

// Extended type with computed values
interface ScholarshipWithComputed extends ScholarshipDetail {
  computedDaysLeft: number | null;
  computedShortDate: string;
  computedFormattedDate: string;
  computedIsUrgent: boolean;
  computedIsOpen: boolean;
  sanitizedContent: string;
  sanitizedEligibility: string;
  sanitizedCoverage: string;
}

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
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

function parseAmountForSchema(amount: string | null): { value: number; currency: string; unitText: string } | null {
  if (!amount) return null;
  const match = amount.match(/(\d[\d,]*)/);
  if (!match) return null;
  const value = parseInt(match[1].replace(/,/g, ''));
  let unitText = "MONTH";
  if (amount.toLowerCase().includes('year') || amount.toLowerCase().includes('annual')) unitText = "YEAR";
  let currency = "PKR";
  if (amount.toLowerCase().includes('usd') || amount.toLowerCase().includes('dollar')) currency = "USD";
  return { value, currency, unitText };
}

// ✅ Format full date with type checking
function formatFullDate(date: Date | string | null): string {
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

// ============ SHARE BUTTONS ============
function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `https://www.nextid.pk/scholarships/${slug}`;
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
function BreadcrumbSchema({ scholarship }: { scholarship: ScholarshipWithComputed }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.nextid.pk/" },
      { "@type": "ListItem", "position": 2, "name": "Scholarships", "item": "https://www.nextid.pk/scholarships" },
      { "@type": "ListItem", "position": 3, "name": scholarship.title, "item": `https://www.nextid.pk/scholarships/${scholarship.slug}` }
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
    const posts = await postService.getList('scholarship', 10);
    if (posts && posts.length > 0) {
      return posts.map((post) => ({ slug: post.slug }));
    }
    return [{ slug: 'placeholder' }];
  } catch (error) {
    console.error('Error generating static params:', error);
    return [{ slug: 'placeholder' }];
  }
}

// ============ CACHED DATA FETCHING ============
async function getScholarshipBySlug(slug: string): Promise<ScholarshipWithComputed | null> {
  "use cache";
  cacheTag(`scholarship-detail-${slug}`);
  cacheLife("hours");
  
  try {
    const post = await postService.getDetail(slug);
    if (!post || post.type !== 'scholarship') return null;
    
    const meta = post.meta || {};
    
    // ✅ Safely parse deadline
    const deadlineRaw = getMetaValue(meta, 'applicationDeadline', null);
    const deadline = safeParseDate(deadlineRaw);
    
    // ✅ Safely parse publishedAt and updatedAt
    const publishedAt = safeParseDate(post.publishedAt);
    const updatedAt = safeParseDate(post.updatedAt);
    
    // ✅ Use static reference date for calculations
    const referenceDate = new Date('2024-01-01T00:00:00.000Z');
    
    // ✅ Compute date-related values using reference date
    let computedDaysLeft: number | null = null;
    if (deadline) {
      const diffTime = deadline.getTime() - referenceDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      computedDaysLeft = diffDays > 0 ? diffDays : null;
    }
    
    const computedShortDate = deadline 
      ? deadline.toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'TBA';
    
    const computedFormattedDate = formatFullDate(deadline);
    const computedIsUrgent = computedDaysLeft !== null && computedDaysLeft <= 14 && computedDaysLeft > 0;
    const computedIsOpen = computedDaysLeft !== null && computedDaysLeft > 0;
    
    const content = post.content || '';
    const eligibility = getMetaValue(meta, 'eligibility', '');
    const coverage = getMetaValue(meta, 'coverage', '');
    
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
      eligibility: eligibility,
      coverage: coverage, 
      officialLink: getMetaValue(meta, 'officialLink', null),
      applicationLink: getMetaValue(meta, 'applicationLink', null),
      isFeatured: getMetaValue(meta, 'isFeatured', false), 
      isPopular: getMetaValue(meta, 'isPopular', false),
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
      publishedAt: publishedAt, // ✅ Now Date object or null
      updatedAt: updatedAt,     // ✅ Now Date object or null
      // Computed values
      computedDaysLeft,
      computedShortDate,
      computedFormattedDate,
      computedIsUrgent,
      computedIsOpen,
      sanitizedContent: sanitizeContent(content),
      sanitizedEligibility: sanitizeContent(eligibility),
      sanitizedCoverage: sanitizeContent(coverage),
    };
  } catch (error) {
    console.error('Error fetching scholarship detail:', error);
    return null;
  }
}

// ============ METADATA ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug === 'placeholder') {
    return { title: 'Scholarship Not Found | NextID.pk', description: 'The requested scholarship could not be found.', robots: { index: false } };
  }
  
  await cookies();
  const scholarship = await getScholarshipBySlug(slug);
  if (!scholarship) {
    return { title: 'Scholarship Not Found | NextID.pk', description: 'The requested scholarship could not be found.', robots: { index: false } };
  }

  const currentYear = await getCurrentYear();
  const urgencyText = scholarship.computedIsUrgent && scholarship.computedDaysLeft ? `Apply urgently! ${scholarship.computedDaysLeft} days left. ` : '';
  const robots = scholarship.robots || 'index, follow';
  
  return {
    title: scholarship.metaTitle || `${scholarship.title} - ${scholarship.studyLevel} Scholarship ${currentYear}`,
    description: scholarship.metaDescription || `${urgencyText}Apply for ${scholarship.title} scholarship. Deadline: ${scholarship.computedShortDate}.`,
    keywords: scholarship.metaKeywords || undefined,
    robots: robots,
    alternates: {
      canonical: scholarship.canonicalUrl || `https://www.nextid.pk/scholarships/${scholarship.slug}`,
      languages: {
        'en-US': scholarship.canonicalUrl || `https://www.nextid.pk/scholarships/${scholarship.slug}`,
      },
    },
    publisher: 'NextID.pk',
    authors: [{ name: 'NextID Team' }],
    openGraph: {
      title: scholarship.ogTitle || scholarship.metaTitle || `${scholarship.title} - ${scholarship.studyLevel} Scholarship ${currentYear}`,
      description: scholarship.ogDescription || scholarship.metaDescription || `${urgencyText}Apply for ${scholarship.title} scholarship. Deadline: ${scholarship.computedShortDate}.`,
      url: scholarship.canonicalUrl || `https://www.nextid.pk/scholarships/${scholarship.slug}`,
      siteName: 'NextID.pk',
      images: [{ url: scholarship.ogImage || scholarship.featuredImage || '/og-image.png', width: 1200, height: 630 }],
      type: 'article',
      publishedTime: scholarship.publishedAt?.toISOString(),
      modifiedTime: scholarship.updatedAt?.toISOString(),
    },
    twitter: { 
      card: 'summary_large_image', 
      title: scholarship.twitterTitle || scholarship.metaTitle || `${scholarship.title} - ${scholarship.studyLevel} Scholarship ${currentYear}`, 
      description: scholarship.twitterDescription || scholarship.metaDescription || `${urgencyText}Apply for ${scholarship.title} scholarship. Deadline: ${scholarship.computedShortDate}.`,
      images: [scholarship.ogImage || scholarship.featuredImage || '/og-image.png'] 
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
function ScholarshipContent({ scholarship }: { scholarship: ScholarshipWithComputed }) {
  const daysLeft = scholarship.computedDaysLeft;
  const shortDate = scholarship.computedShortDate;
  const formattedDate = scholarship.computedFormattedDate;
  const isUrgent = scholarship.computedIsUrgent;
  const isOpen = scholarship.computedIsOpen;
  
  const amountData = parseAmountForSchema(scholarship.amount);
  
  const metaDescriptionText = scholarship.excerpt || `${scholarship.title} scholarship offered by ${scholarship.provider}. Deadline: ${shortDate || 'TBA'}. Apply online.`;

  const scholarshipSchema = {
    "@context": "https://schema.org",
    "@type": "Scholarship",
    "name": scholarship.title,
    "description": scholarship.excerpt || metaDescriptionText,
    "url": `https://www.nextid.pk/scholarships/${scholarship.slug}`,
    "provider": { "@type": "Organization", "name": scholarship.provider, "url": scholarship.officialLink || undefined },
    "eligibleRegion": { "@type": "Place", "name": scholarship.location, "address": { "@type": "PostalAddress", "addressCountry": scholarship.location.includes('Pakistan') ? "PK" : undefined } },
    "educationalProgramLevel": scholarship.studyLevel,
    "financialAidType": scholarship.type,
    ...(amountData && { "amount": { "@type": "MonetaryAmount", "value": amountData.value, "currency": amountData.currency, "unitText": amountData.unitText } }),
    "deadline": scholarship.deadline?.toISOString(),
    "eligibility": scholarship.eligibility,
    "applicationLink": scholarship.applicationLink || scholarship.officialLink,
    "datePublished": scholarship.publishedAt?.toISOString(),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(scholarshipSchema) }} />
      <BreadcrumbSchema scholarship={scholarship} />
      
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-teal-600 to-emerald-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              {/* ✅ Breadcrumbs UI */}
              <div className="text-sm text-teal-200 mb-2 flex items-center gap-2 flex-wrap">
                <Link href="/" className="hover:text-white transition">Home</Link>
                <span>›</span>
                <Link href="/scholarships" className="hover:text-white transition">Scholarships</Link>
                <span>›</span>
                <span className="text-white font-medium truncate">{scholarship.title}</span>
              </div>
              
              <Link href="/scholarships" className="inline-flex items-center gap-1 text-teal-200 hover:text-white transition mb-4 group">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
                Back to Scholarships
              </Link>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {scholarship.isFeatured && <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs px-3 py-1 rounded-full"><TrendingUp className="w-3 h-3" /> Featured</span>}
                {scholarship.isPopular && <span className="inline-flex items-center gap-1 bg-yellow-500 text-white text-xs px-3 py-1 rounded-full"><Zap className="w-3 h-3" /> Popular</span>}
                {isOpen && isUrgent && <span className="inline-flex items-center gap-1 bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-pulse"><Clock className="w-3 h-3" /> Deadline Approaching</span>}
                {!isOpen && scholarship.deadline && <span className="inline-flex items-center gap-1 bg-gray-500 text-white text-xs px-3 py-1 rounded-full">Closed</span>}
              </div>
              
              {/* ✅ ONLY H1 on the page */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{scholarship.title}</h1>
              <div className="hidden" aria-hidden="true">{metaDescriptionText}</div>
              <p className="text-xl text-teal-200 mb-4 flex items-center gap-2"><Award className="w-5 h-5" /> Offered by {scholarship.provider}</p>
              
              <div className="flex flex-wrap gap-4 text-teal-200">
                <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4" />{scholarship.studyLevel}</div>
                <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" />{scholarship.type}</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{scholarship.location}</div>
                {scholarship.amount && <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg"><DollarSign className="w-4 h-4" /><span className="font-semibold">{scholarship.amount}</span></div>}
                <div className="flex items-center gap-2"><Eye className="w-4 h-4" />{scholarship.viewCount.toLocaleString()} views</div>
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
                <div className="relative w-full h-64 md:h-80 bg-gradient-to-br from-teal-100 to-emerald-100">
                  {scholarship.featuredImage ? (
                    <Image
                      src={scholarship.featuredImage}
                      alt={scholarship.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-white/80 shadow-lg flex items-center justify-center mx-auto mb-3">
                          <Award className="w-10 h-10 text-teal-500" />
                        </div>
                        <p className="text-gray-600 font-medium">{scholarship.provider}</p>
                        <p className="text-gray-400 text-sm">Scholarship</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {(scholarship.applicationLink || scholarship.officialLink) && isOpen && (
                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 mb-6 border border-green-200">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-teal-800 mb-3 flex items-center justify-center gap-2"><Award className="w-5 h-5" /> Apply for {scholarship.title}</h2>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {scholarship.applicationLink && (
                        <a href={scholarship.applicationLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition font-semibold text-lg group">
                          Apply Now for {scholarship.provider} Scholarship
                          <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                        </a>
                      )}
                    </div>
                    {scholarship.deadline && <p className="text-sm text-teal-700 mt-3">⏰ Apply before {formattedDate || 'TBA'}{daysLeft && ` (${daysLeft} days remaining)`}</p>}
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  {scholarship.excerpt && (
                    <div className="mb-6 p-4 bg-teal-50 rounded-lg border-l-4 border-teal-500">
                      <p className="text-teal-800 text-base leading-relaxed font-medium">📌 <span className="font-bold">Scholarship Highlights:</span> {scholarship.excerpt}</p>
                    </div>
                  )}
                  
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-teal-500" /> {scholarship.title} - Scholarship Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4"><div className="text-gray-500 text-xs mb-1">Provider</div><div className="font-semibold">{scholarship.provider}</div></div>
                    <div className="bg-gray-50 rounded-lg p-4"><div className="text-gray-500 text-xs mb-1">Study Level</div><div className="font-semibold">{scholarship.studyLevel}</div></div>
                    <div className="bg-gray-50 rounded-lg p-4"><div className="text-gray-500 text-xs mb-1">Scholarship Type</div><div className="font-semibold">{scholarship.type}</div></div>
                    <div className="bg-gray-50 rounded-lg p-4"><div className="text-gray-500 text-xs mb-1">Location</div><div className="font-semibold">{scholarship.location}</div></div>
                    {scholarship.amount && <div className="bg-gray-50 rounded-lg p-4"><div className="text-gray-500 text-xs mb-1">Amount</div><div className="font-semibold">{scholarship.amount}</div></div>}
                    <div className="bg-gray-50 rounded-lg p-4"><div className="text-gray-500 text-xs mb-1">Deadline</div><div className={`font-semibold ${isUrgent && isOpen ? 'text-red-600' : ''}`}>{formattedDate || 'TBA'}{daysLeft && isOpen && <span className="text-sm ml-1">({daysLeft} days left)</span>}</div></div>
                  </div>

                  {/* ✅ Eligibility with Sanitized Headings */}
                  {scholarship.eligibility && (
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-500" /> Eligibility Criteria</h3>
                      <div 
                        className="prose prose-sm max-w-none
                          prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3
                          prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                          prose-strong:text-gray-900 prose-strong:font-semibold
                          prose-li:text-gray-700 prose-li:mb-1
                          prose-ul:my-3 prose-ol:my-3"
                        dangerouslySetInnerHTML={{ __html: scholarship.sanitizedEligibility }} 
                      />
                    </div>
                  )}

                  {/* ✅ Coverage with Sanitized Headings */}
                  {scholarship.coverage && (
                    <div className="border-t border-gray-100 pt-6 mt-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-teal-500" /> Scholarship Coverage</h3>
                      <div 
                        className="prose prose-sm max-w-none
                          prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3
                          prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                          prose-strong:text-gray-900 prose-strong:font-semibold
                          prose-li:text-gray-700 prose-li:mb-1
                          prose-ul:my-3 prose-ol:my-3"
                        dangerouslySetInnerHTML={{ __html: scholarship.sanitizedCoverage }} 
                      />
                    </div>
                  )}

                  {/* ✅ Content with Sanitized Headings */}
                  {scholarship.content && (
                    <div className="border-t border-gray-100 pt-6 mt-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
                      <div 
                        className="prose prose-sm max-w-none
                          prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3
                          prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                          prose-strong:text-gray-900 prose-strong:font-semibold
                          prose-li:text-gray-700 prose-li:mb-1
                          prose-ul:my-3 prose-ol:my-3"
                        dangerouslySetInnerHTML={{ __html: scholarship.sanitizedContent }} 
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* ✅ Share Buttons */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-sm text-gray-500 font-medium">Share this scholarship:</span>
                  <ShareButtons title={scholarship.title} slug={scholarship.slug} />
                </div>
              </div>
            </div>

            <aside className="lg:w-1/3">
              <div className="sticky top-24 space-y-6">
                <div className="bg-teal-50 rounded-xl p-5 border border-teal-100" data-nosnippet>
                  <h3 className="font-semibold text-teal-800 mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Quick Summary</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">🎓 Scholarship:</span> {scholarship.title}</p>
                    <p><span className="font-medium">🏢 Provider:</span> {scholarship.provider}</p>
                    <p><span className="font-medium">📚 Study Level:</span> {scholarship.studyLevel}</p>
                    <p><span className="font-medium">📍 Location:</span> {scholarship.location}</p>
                    {scholarship.amount && <p><span className="font-medium">💰 Amount:</span> {scholarship.amount}</p>}
                    {scholarship.deadline && <p className={`font-medium ${isUrgent && isOpen ? 'text-red-600' : ''}`}>⏰ Deadline: {shortDate || 'TBA'}{daysLeft && isOpen && ` (${daysLeft} days left)`}</p>}
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5" data-nosnippet>
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-500" /> How to Apply?</h3>
                  <ol className="space-y-3 text-sm text-gray-600 list-decimal list-inside">
                    <li>Click the &quot;Apply Now&quot; button above</li>
                    <li>Fill the online application form</li>
                    <li>Upload required documents (CV, transcripts, etc.)</li>
                    <li>Submit application before the deadline</li>
                  </ol>
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
export default async function ScholarshipDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slugPromise = params.then(p => p.slug);
  
  const scholarship = await slugPromise.then(async (slug) => {
    if (slug === 'placeholder') notFound();
    const data = await getScholarshipBySlug(slug);
    if (!data) notFound();
    return data;
  });
  
  return (
    <Suspense fallback={<ScholarshipLoading />}>
      <ScholarshipContent scholarship={scholarship} />
    </Suspense>
  );
}