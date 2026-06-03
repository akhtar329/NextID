// app/(public)/date-sheets/[slug]/page.tsx

import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { postService } from '@/services/post/post.service';



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
}

interface DateSheetPageProps {
  params: Promise<{ slug: string }>;
}

// Helper function to safely extract meta values
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

// Share Button Component (defined outside render)
function ShareButton({ title, url }: { title: string; url: string }) {
  'use client';
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Download ${title}`,
          url: url,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.log('Error copying:', err);
        alert('Failed to copy link');
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium flex items-center justify-center gap-2"
    >
      📋 Share Link
    </button>
  );
}

// Get date sheet detail from posts service
async function getDateSheetDetail(slug: string): Promise<DateSheetDetail | null> {
  try {
    const post = await postService.getPost(slug);
    
    if (!post || post.type !== 'date_sheet') {
      return null;
    }
    
    const meta = post.meta || {};
    
    // Parse date safely
    let examDate: Date | null = null;
    const examDateRaw = getMetaValue(meta, 'examDate', null);
    if (examDateRaw && typeof examDateRaw === 'string') {
      try {
        const parsed = new Date(examDateRaw);
        if (!isNaN(parsed.getTime())) {
          examDate = parsed;
        }
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
    };
  } catch (error) {
    console.error('Error fetching date sheet detail:', error);
    return null;
  }
}

export async function generateMetadata({ params }: DateSheetPageProps): Promise<Metadata> {
  const { slug } = await params;
  const dateSheet = await getDateSheetDetail(slug);

  if (!dateSheet) {
    return {
      title: "Date Sheet Not Found | NextID.pk",
      description: "The requested date sheet could not be found.",
      robots: "noindex, nofollow",
    };
  }

  return {
    title: `${dateSheet.title} - Download ${dateSheet.examType} Exams Schedule ${dateSheet.year} | NextID.pk`,
    description: `Download official ${dateSheet.title}. Complete ${dateSheet.examType} examinations date sheet for ${dateSheet.year}.`,
    alternates: {
      canonical: `https://www.nextid.pk/date-sheets/${slug}`,
    },
    openGraph: {
      title: dateSheet.title,
      description: `Download official ${dateSheet.title} for ${dateSheet.year}`,
      url: `https://www.nextid.pk/date-sheets/${slug}`,
      siteName: "NextID.pk",
      type: "article",
    },
  };
}

export default async function DateSheetDetailPage({ params }: DateSheetPageProps) {
  const { slug } = await params;
  const dateSheet = await getDateSheetDetail(slug);

  if (!dateSheet) {
    notFound();
  }

  const examDate = dateSheet.examDate;
  const boardOrInstitute = dateSheet.boardName || dateSheet.instituteName;
  const currentUrl = `https://www.nextid.pk/date-sheets/${slug}`;

  // Format date for display
  function formatDate(date: Date | null): string {
    if (!date) return 'TBA';
    return date.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            "name": boardOrInstitute || "Educational Board",
            "url": currentUrl,
            "description": dateSheet.description,
          }),
        }}
      />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-teal-800">
          <div className="container mx-auto px-4 py-12 relative z-10">
            <div className="max-w-4xl mx-auto">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2 text-sm text-green-100 mb-6">
                <Link href="/" className="hover:text-white transition">Home</Link>
                <span>›</span>
                <Link href="/date-sheets" className="hover:text-white transition">Date Sheets</Link>
                <span>›</span>
                <span className="text-white font-medium truncate">{dateSheet.title}</span>
              </nav>

              {/* Popular Badge */}
              {dateSheet.isPopular && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 backdrop-blur-sm rounded-full mb-4">
                  <span className="text-yellow-300">⭐</span>
                  <span className="text-sm font-medium text-white">Popular Date Sheet</span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {dateSheet.title}
              </h1>
              
              {/* Description */}
              <p className="text-lg text-green-100 mb-6">
                Download official {dateSheet.examType} examinations date sheet for {dateSheet.year}.
                {boardOrInstitute && ` Published by ${boardOrInstitute}.`}
              </p>

              {/* Info Cards */}
              <div className="flex flex-wrap gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <span className="text-green-200 text-sm">📅 Year</span>
                  <div className="text-white font-semibold">{dateSheet.year}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <span className="text-green-200 text-sm">📝 Exam Type</span>
                  <div className="text-white font-semibold">{dateSheet.examType}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <span className="text-green-200 text-sm">👁️ Views</span>
                  <div className="text-white font-semibold">{dateSheet.viewCount.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Download Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
                  <h2 className="text-white font-semibold text-lg">📄 Download Date Sheet</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dateSheet.officialLink && (
                      <a
                        href={dateSheet.officialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
                      >
                        🌐 Official Website
                      </a>
                    )}
                    {dateSheet.downloadLink && (
                      <a
                        href={dateSheet.downloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium"
                      >
                        📥 Download PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Description Section */}
              {dateSheet.description && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">📖 About This Date Sheet</h2>
                  </div>
                  <div className="p-6 prose prose-green max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: dateSheet.description }} />
                  </div>
                </div>
              )}

              {/* Exam Schedule Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800">📅 Exam Schedule</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-gray-500 text-sm">📝 Exam Type</div>
                      <div className="font-semibold text-gray-900 text-lg mt-1">
                        {dateSheet.examType}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-gray-500 text-sm">📅 Year</div>
                      <div className="font-semibold text-gray-900 text-lg mt-1">{dateSheet.year}</div>
                    </div>
                    {examDate && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-gray-500 text-sm">📆 Exam Date</div>
                        <div className="font-semibold text-gray-900 text-lg mt-1">
                          {formatDate(examDate)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              
              {/* Board/Institute Info Card */}
              {boardOrInstitute && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
                    <h3 className="text-white font-semibold">
                      🏛️ {dateSheet.boardName ? "Board" : "Institute"} Information
                    </h3>
                  </div>
                  <div className="p-6 text-center">
                    <div className="text-5xl mb-3">{dateSheet.boardName ? "🏛️" : "🎓"}</div>
                    <h4 className="font-bold text-gray-900 text-lg">
                      {boardOrInstitute}
                    </h4>
                    {dateSheet.cityName && (
                      <p className="text-sm text-gray-500 mt-2">
                        📍 {dateSheet.cityName}{dateSheet.province ? `, ${dateSheet.province}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Share Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📢</span> Share This Date Sheet
                </h3>
                <ShareButton title={dateSheet.title} url={currentUrl} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}