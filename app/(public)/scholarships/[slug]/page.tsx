// app/(public)/scholarships/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { postService } from '@/services/post/post.service';

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

interface RelatedScholarship {
  id: number;
  slug: string;
  title: string;
  studyLevel: string;
  deadline: Date | null;
  provider: string;
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
    
    // Parse date safely
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
      isFeatured: getMetaValue(meta, 'isFeatured', false),  // ✅ Fixed: from meta
      isPopular: getMetaValue(meta, 'isPopular', false),    // ✅ Fixed: from meta
      viewCount: getMetaValue(meta, 'viewCount', 0),        // ✅ Fixed: from meta
    };
  } catch (error) {
    console.error('Error fetching scholarship detail:', error);
    return null;
  }
}

async function getRelatedScholarships(currentSlug: string): Promise<RelatedScholarship[]> {
  try {
    const allScholarships = await postService.getPostsByType('scholarship', 20);
    
    const related = allScholarships
      .filter(post => post.slug !== currentSlug)
      .slice(0, 5)
      .map(post => {
        const meta = post.meta || {};
        
        // Parse date safely
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
          studyLevel: getMetaValue(meta, 'studyLevel', 'Various'),
          deadline: deadline,
          provider: getMetaValue(meta, 'organizationName', getMetaValue(meta, 'provider', 'Various')),
        };
      });
    
    return related;
  } catch (error) {
    console.error('Error fetching related scholarships:', error);
    return [];
  }
}

// ============ METADATA ============
function generateMetaTitle(scholarship: ScholarshipDetail): string {
  return `${scholarship.title} - ${scholarship.studyLevel} Scholarship | NextID.pk`;
}

function generateMetaDescription(scholarship: ScholarshipDetail): string {
  return `Apply for ${scholarship.title} offered by ${scholarship.provider}. ${scholarship.type} scholarship for ${scholarship.studyLevel} students. Deadline: ${formatShortDate(scholarship.deadline)}.`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const scholarship = await getScholarshipBySlug(slug);

  if (!scholarship) {
    return { title: 'Scholarship Not Found', robots: { index: false } };
  }

  return {
    title: generateMetaTitle(scholarship),
    description: generateMetaDescription(scholarship),
    alternates: { canonical: `https://www.nextid.pk/scholarships/${scholarship.slug}` },
    openGraph: {
      title: scholarship.title,
      description: generateMetaDescription(scholarship),
      type: 'article',
    },
  };
}

// ============ MAIN PAGE ============
export default async function ScholarshipDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const scholarship = await getScholarshipBySlug(slug);
  
  if (!scholarship) {
    notFound();
  }
  
  const relatedScholarships = await getRelatedScholarships(slug);
  const daysLeft = getDaysLeft(scholarship.deadline);
  const isOpen = daysLeft !== null && daysLeft > 0;
  const isUrgent = daysLeft !== null && daysLeft <= 7;

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            {/* Breadcrumbs */}
            <div className="text-sm text-teal-200 mb-4">
              <Link href="/" className="hover:text-white">Home</Link>
              {' / '}
              <Link href="/scholarships" className="hover:text-white">Scholarships</Link>
              {' / '}
              <span className="text-white">{scholarship.title}</span>
            </div>
            
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {scholarship.isFeatured && (
                <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-medium">⭐ Featured</span>
              )}
              {scholarship.isPopular && (
                <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-medium">🔥 Popular</span>
              )}
              {isOpen && isUrgent && (
                <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium animate-pulse">🔴 Urgent - Apply Soon</span>
              )}
              {!isOpen && scholarship.deadline && (
                <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-sm font-medium">Closed</span>
              )}
            </div>
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {scholarship.title}
            </h1>
            
            {/* Provider */}
            <p className="text-xl text-teal-200 mb-4">
              Offered by {scholarship.provider}
            </p>
            
            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-teal-200">
              <div className="flex items-center gap-1">
                <span>📚</span>
                <span>{scholarship.studyLevel}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>💰</span>
                <span>{scholarship.type}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>📍</span>
                <span>{scholarship.location}</span>
              </div>
              {scholarship.amount && (
                <div className="flex items-center gap-1">
                  <span>💵</span>
                  <span>{scholarship.amount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Scholarship Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Provider</p>
                  <p className="font-semibold text-gray-900">{scholarship.provider}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Study Level</p>
                  <p className="font-semibold text-gray-900">{scholarship.studyLevel}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Scholarship Type</p>
                  <p className="font-semibold text-gray-900">{scholarship.type}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-semibold text-gray-900">{scholarship.location}</p>
                </div>
                {scholarship.amount && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Award Amount</p>
                    <p className="font-semibold text-gray-900">{scholarship.amount}</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Application Deadline</p>
                  <p className={`font-semibold ${isUrgent && isOpen ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(scholarship.deadline)}
                    {daysLeft && isOpen && <span className="ml-2 text-sm">({daysLeft} days left)</span>}
                  </p>
                </div>
              </div>

              {scholarship.eligibility && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Eligibility Criteria</h3>
                  <div 
                    className="prose prose-sm max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: scholarship.eligibility }}
                  />
                </div>
              )}

              {scholarship.coverage && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <h3 className="font-semibold text-gray-900 mb-3">Coverage</h3>
                  <div 
                    className="prose prose-sm max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: scholarship.coverage }}
                  />
                </div>
              )}

              {scholarship.content && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
                  <div 
                    className="prose prose-sm max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: scholarship.content }}
                  />
                </div>
              )}

              {(scholarship.applicationLink || scholarship.officialLink) && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <h3 className="font-semibold text-gray-900 mb-3">Apply Now</h3>
                  <div className="flex flex-wrap gap-3">
                    {scholarship.applicationLink && (
                      <a 
                        href={scholarship.applicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-semibold"
                      >
                        Apply Online →
                      </a>
                    )}
                    {scholarship.officialLink && (
                      <a 
                        href={scholarship.officialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                      >
                        Official Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="lg:w-80">
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>📝</span> How to Apply?
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

            {relatedScholarships.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">Related Scholarships</h3>
                <div className="space-y-3">
                  {relatedScholarships.map((rel) => (
                    <Link key={rel.id} href={`/scholarships/${rel.slug}`} className="block p-3 bg-gray-50 rounded-lg hover:bg-teal-50 transition">
                      <p className="font-medium text-gray-800 text-sm line-clamp-2">{rel.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{rel.provider} • {rel.studyLevel}</p>
                      {rel.deadline && (
                        <p className="text-xs text-gray-400 mt-1">Deadline: {formatShortDate(rel.deadline)}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
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