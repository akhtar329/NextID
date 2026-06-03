// app/(public)/results/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { postService } from '@/services/post/post.service';

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
}

interface RelatedResult {
  id: number;
  slug: string;
  title: string;
  year: number;
  resultDate: Date | null;
  instituteName: string | null;
  boardName: string | null;
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

function formatShortDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
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
    
    // Parse date safely
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
      isPopular: getMetaValue(meta, 'isPopular', false),  // ✅ Fixed: from meta
      status: getMetaValue(meta, 'status', true),
      viewCount: getMetaValue(meta, 'viewCount', 0),      // ✅ Fixed: from meta
    };
  } catch (error) {
    console.error('Error fetching result detail:', error);
    return null;
  }
}

async function getRelatedResults(currentResult: ResultDetail): Promise<RelatedResult[]> {
  try {
    const allResults = await postService.getPostsByType('result', 20);
    
    const related = allResults
      .filter(post => post.slug !== currentResult.slug)
      .slice(0, 5)
      .map(post => {
        const meta = post.meta || {};
        
        // Parse date safely
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
          year: getMetaValue(meta, 'year', new Date().getFullYear()),
          resultDate: resultDate,
          instituteName: getMetaValue(meta, 'universityName', getMetaValue(meta, 'instituteName', null)),
          boardName: getMetaValue(meta, 'boardName', null),
        };
      });
    
    return related;
  } catch (error) {
    console.error('Error fetching related results:', error);
    return [];
  }
}

// ============ METADATA ============
function generateMetaTitle(result: ResultDetail): string {
  const institutionName = result.instituteName || result.boardName || 'Board';
  const year = result.year;
  return `${institutionName} Result ${year} | Check Online | NextID.pk`;
}

function generateMetaDescription(result: ResultDetail): string {
  const institutionName = result.instituteName || result.boardName || 'board';
  const year = result.year;
  const resultDate = result.resultDate ? formatShortDate(result.resultDate) : 'TBA';
  return `Check ${institutionName} result ${year} online. Result date: ${resultDate}. Download marksheet at NextID.pk.`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getResultBySlug(slug);

  if (!result) {
    return { title: 'Result Not Found', robots: { index: false } };
  }

  return {
    title: generateMetaTitle(result),
    description: generateMetaDescription(result),
    alternates: { canonical: `https://www.nextid.pk/results/${result.slug}` },
    openGraph: {
      title: generateMetaTitle(result),
      description: generateMetaDescription(result),
      type: 'article',
      images: ['/images/results-og.jpg'],
    },
  };
}

function getStatusBadge(status: boolean) {
  if (status) return { bg: 'bg-green-100', text: 'text-green-700', label: 'Result Published', icon: '✅' };
  return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Result Pending', icon: '⏳' };
}

// ============ MAIN PAGE ============
export default async function ResultDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getResultBySlug(slug);
  
  if (!result) {
    notFound();
  }
  
  const relatedResults = await getRelatedResults(result);
  const statusBadge = getStatusBadge(result.status);
  const institutionName = result.instituteName || result.boardName || '';
  const institutionSlug = result.instituteSlug || result.boardSlug || '';
  const institutionType = result.instituteName ? 'universities' : 'boards';
  const officialWebsite = result.officialLink;

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            {/* Breadcrumbs */}
            <div className="text-sm text-green-200 mb-4">
              <Link href="/" className="hover:text-white">Home</Link>
              {' / '}
              <Link href="/results" className="hover:text-white">Results</Link>
              {' / '}
              <span className="text-white">{result.title}</span>
            </div>
            
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${statusBadge.bg} ${statusBadge.text}`}>
              <span>{statusBadge.icon}</span>
              <span>{statusBadge.label}</span>
              {result.isPopular && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white rounded-full text-xs">Popular</span>
              )}
            </div>
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {result.title}
            </h1>
            
            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-green-200">
              {institutionName && (
                <div className="flex items-center gap-1">
                  <span>🏛️</span>
                  {institutionSlug ? (
                    <Link href={`/${institutionType}/${institutionSlug}`} className="hover:text-white">
                      {institutionName}
                    </Link>
                  ) : (
                    <span>{institutionName}</span>
                  )}
                </div>
              )}
              {result.cityName && (
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <span>{result.cityName}</span>
                </div>
              )}
              {result.year && (
                <div className="flex items-center gap-1">
                  <span>📅</span>
                  <span>Year: {result.year}</span>
                </div>
              )}
              {result.resultDate && (
                <div className="flex items-center gap-1">
                  <span>⏰</span>
                  <span>Announced: {formatDate(result.resultDate)}</span>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Result Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Institution</p>
                  <p className="font-semibold text-gray-900">{institutionName || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Result Year</p>
                  <p className="font-semibold text-gray-900">{result.year || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Announcement Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(result.resultDate) || 'TBA'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Total Views</p>
                  <p className="font-semibold text-gray-900">{result.viewCount.toLocaleString()}</p>
                </div>
              </div>

              {result.content && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
                  <div 
                    className="prose prose-sm max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: result.content }}
                  />
                </div>
              )}

              {officialWebsite && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <h3 className="font-semibold text-gray-900 mb-3">Official Resources</h3>
                  <div className="flex flex-wrap gap-3">
                    <a 
                      href={officialWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <span>📄</span> Check Result Online
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="lg:w-80">
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>📝</span> How to Check Result?
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
                  <span>Click &quot;Submit&quot; to view your result</span>
                </li>
              </ol>
            </div>

            {relatedResults.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">Related Results</h3>
                <div className="space-y-3">
                  {relatedResults.map((rel) => (
                    <Link key={rel.id} href={`/results/${rel.slug}`} className="block p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition">
                      <p className="font-medium text-gray-800 text-sm">{rel.title}</p>
                      <p className="text-xs text-gray-500">{rel.year}</p>
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
            "@type": "EducationEvent",
            "name": result.title,
            "description": generateMetaDescription(result),
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
              "name": institutionName
            }
          })
        }}
      />
    </main>
  );
}