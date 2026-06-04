// app/(public)/date-sheets/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import React from 'react';
import { postService } from '@/services/post/post.service';
import { Calendar, Clock, MapPin, Building2, Eye, Download, ExternalLink, FileText } from 'lucide-react';

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

// Helper function to safely extract meta values
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Get date sheet detail from posts service
async function getDateSheetDetail(slug: string): Promise<DateSheetDetail | null> {
  try {
    const post = await postService.getPost(slug);
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

// Metadata generation
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dateSheet = await getDateSheetDetail(slug);

  if (!dateSheet) {
    return { title: 'Date Sheet Not Found', robots: 'noindex, nofollow' };
  }

  return {
    title: `${dateSheet.title} - Download ${dateSheet.examType} Schedule ${dateSheet.year} | NextID.pk`,
    description: `Download official ${dateSheet.title}. Complete ${dateSheet.examType} examinations date sheet for ${dateSheet.year}.`,
    alternates: { canonical: `https://www.nextid.pk/date-sheets/${dateSheet.slug}` },
  };
}

// Loading component
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

// Date Sheet Details Client Component
function DateSheetDetails({ dateSheetPromise }: { dateSheetPromise: Promise<DateSheetDetail | null> }) {
  const dateSheet = React.use(dateSheetPromise);
  
  if (!dateSheet) return null;
  
  const boardOrInstitute = dateSheet.boardName || dateSheet.instituteName;
  const hasDownloadLinks = dateSheet.officialLink || dateSheet.downloadLink;

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-600 to-amber-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumbs */}
            <div className="text-sm text-orange-100 mb-6 flex items-center gap-2 flex-wrap">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <span>›</span>
              <Link href="/date-sheets" className="hover:text-white transition">Date Sheets</Link>
              <span>›</span>
              <span className="text-white font-medium truncate">{dateSheet.title}</span>
            </div>

            {/* Popular Badge */}
            {dateSheet.isPopular && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <span className="text-yellow-300">🔥</span>
                <span className="text-sm font-medium text-white">Popular Date Sheet</span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {dateSheet.title}
            </h1>
            
            {/* Description */}
            <p className="text-lg text-orange-100 mb-6">
              Download official {dateSheet.examType} examinations date sheet for {dateSheet.year}.
              {boardOrInstitute && ` Published by ${boardOrInstitute}.`}
            </p>

            {/* Info Cards */}
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
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Download Section */}
            {hasDownloadLinks && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
                  <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Download Date Sheet
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dateSheet.officialLink && (
                      <a 
                        href={dateSheet.officialLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium group"
                      >
                        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                        Official Website
                      </a>
                    )}
                    {dateSheet.downloadLink && (
                      <a 
                        href={dateSheet.downloadLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition font-medium group"
                      >
                        <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition" />
                        Download PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Description Section */}
            {dateSheet.description && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-500" />
                    About This Date Sheet
                  </h2>
                </div>
                <div className="p-6 prose prose-sm max-w-none text-gray-700">
                  <div dangerouslySetInnerHTML={{ __html: dateSheet.description }} />
                </div>
              </div>
            )}

            {/* Exam Schedule Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  Exam Schedule Details
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-orange-50 rounded-xl p-4">
                    <div className="text-orange-500 text-xs font-medium">Exam Type</div>
                    <div className="font-semibold text-gray-900 text-base mt-1">{dateSheet.examType}</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <div className="text-orange-500 text-xs font-medium">Year</div>
                    <div className="font-semibold text-gray-900 text-base mt-1">{dateSheet.year}</div>
                  </div>
                  {dateSheet.examDate && (
                    <div className="bg-orange-50 rounded-xl p-4 md:col-span-2">
                      <div className="text-orange-500 text-xs font-medium">Exam Date</div>
                      <div className="font-semibold text-gray-900 text-base mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        {formatDate(dateSheet.examDate)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            {boardOrInstitute && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {dateSheet.boardName ? "Board Information" : "Institute Information"}
                  </h3>
                </div>
                <div className="p-6 text-center">
                  <div className="text-5xl mb-3">{dateSheet.boardName ? "🏛️" : "🎓"}</div>
                  <h4 className="font-bold text-gray-900 text-lg">{boardOrInstitute}</h4>
                  {dateSheet.cityName && (
                    <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {dateSheet.cityName}{dateSheet.province ? `, ${dateSheet.province}` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Help Section */}
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <span>💡</span> Need Help?
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                Having trouble downloading? Visit the official website directly.
              </p>
              {dateSheet.officialLink && (
                <a 
                  href={dateSheet.officialLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                >
                  Go to Official Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

// ============ MAIN PAGE ============
export default async function DateSheetDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slugPromise = params.then(p => p.slug);
  
  const dataPromise = slugPromise.then(async (slug) => {
    const dateSheet = await getDateSheetDetail(slug);
    if (!dateSheet) notFound();
    return dateSheet;
  });
  
  return (
    <Suspense fallback={<DateSheetLoading />}>
      <DateSheetDetails dateSheetPromise={dataPromise} />
    </Suspense>
  );
}