// app/(public)/scholarships/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
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
}

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
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
    return { title: 'Scholarship Not Found', robots: { index: false } };
  }

  return {
    title: `${scholarship.title} - ${scholarship.studyLevel} Scholarship | NextID.pk`,
    description: scholarship.excerpt || `Apply for ${scholarship.title} offered by ${scholarship.provider}. Deadline: ${formatShortDate(scholarship.deadline)}.`,
    alternates: { canonical: `https://www.nextid.pk/scholarships/${scholarship.slug}` },
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
async function ScholarshipContent({ slugPromise }: { slugPromise: Promise<string> }) {
  const slug = await slugPromise;
  const scholarship = await getScholarshipBySlug(slug);
  
  if (!scholarship) {
    notFound();
  }
  
  const daysLeft = getDaysLeft(scholarship.deadline);
  const isOpen = daysLeft !== null && daysLeft > 0;
  const isUrgent = daysLeft !== null && daysLeft <= 7;

  return (
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
            
            {/* Title */}
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

      {/* Schema Markup */}
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
              "name": scholarship.provider
            },
            "educationalProgramMode": scholarship.studyLevel,
            "financialAidEligible": true,
            "deadline": scholarship.deadline?.toISOString(),
            "url": `https://www.nextid.pk/scholarships/${scholarship.slug}`
          })
        }}
      />
    </main>
  );
}

// ============ MAIN PAGE ============
export default async function ScholarshipDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slugPromise = params.then(p => p.slug);
  
  return (
    <Suspense fallback={<ScholarshipLoading />}>
      <ScholarshipContent slugPromise={slugPromise} />
    </Suspense>
  );
}