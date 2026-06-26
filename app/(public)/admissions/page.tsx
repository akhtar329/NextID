// app/(public)/admissions/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { 
  GraduationCap, 
  MapPin,
  Clock, 
  ChevronRight,
  Building2,
  Search,
  X
} from "lucide-react";
import { postService } from "@/services/post/post.service";
import type { ExtendedPost } from "@/services/post/post.service";
import SidebarWidgets from "@/components/sections/Home/SidebarWidgets";
import { generateJsonLd } from "@/lib/seo";
import { cacheTag, cacheLife } from "next/cache";

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

// ============ TYPES ============
interface Program {
  name: string;
  slug?: string;
}

interface AdmissionItem {
  id: number;
  slug: string;
  title: string;
  featuredImage?: string | null;
  instituteName: string;
  cityName: string;
  status: string;
  closeDate: Date | null;
  programs: Program[];
  isFeatured: boolean;
  priorityScore: number;
}

function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
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

// ✅ Calculate priority score
function getPriorityScore(status: string, closeDate: Date | null): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (status !== "Open") return 0;
  if (!closeDate) return 50;
  
  const daysRemaining = Math.ceil((closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining >= 0 && daysRemaining <= 15) {
    return 100 + (15 - daysRemaining);
  }
  if (daysRemaining > 15) {
    return 50 + Math.max(0, 30 - daysRemaining);
  }
  return 10;
}

// ============ CACHED DATA FETCHING ============
async function getAdmissionsData(page: number = 1, limit: number = 10, filter: string = 'all', search: string = '') {
  "use cache";
  cacheTag("admissions-data");
  cacheLife("hours");
  
  try {
    const posts = await postService.getList('admission', 10);
    
    if (!posts || !Array.isArray(posts)) {
      return {
        admissions: [],
        featuredAdmissions: [],
        totalCount: 0,
        openCount: 0,
        closedCount: 0,
        totalPages: 0,
        currentPage: 1
      };
    }
    
    let admissions: AdmissionItem[] = posts.map((post: ExtendedPost) => {
      const meta = post.meta || {};
      const closeDate = getMetaValue(meta, 'closeDate', null) ? new Date(getMetaValue(meta, 'closeDate', '')) : null;
      
      return {
        id: post.id,
        slug: post.slug,
        title: post.title || 'Untitled',
        featuredImage: post.featuredImage,
        instituteName: getMetaValue(meta, 'instituteName', 'University'),
        cityName: getMetaValue(meta, 'cityName', 'Pakistan'),
        status: getMetaValue(meta, 'status', 'Open'),
        closeDate: (closeDate && !isNaN(closeDate.getTime())) ? closeDate : null,
        programs: getMetaValue(meta, 'programs', []),
        isFeatured: post.isFeatured || getMetaValue(meta, 'isFeatured', false),
        priorityScore: 0,
      };
    });
    
    // ✅ Apply filters
    if (filter === 'open') {
      admissions = admissions.filter(a => a.status === 'Open');
    } else if (filter === 'closed') {
      admissions = admissions.filter(a => a.status !== 'Open');
    }
    
    // ✅ Apply search
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      admissions = admissions.filter(a => 
        a.title.toLowerCase().includes(query) ||
        a.instituteName.toLowerCase().includes(query) ||
        a.cityName.toLowerCase().includes(query)
      );
    }
    
    // ✅ Calculate priority scores
    admissions = admissions.map(item => ({
      ...item,
      priorityScore: getPriorityScore(item.status, item.closeDate)
    }));
    
    // ✅ Sort by priority (highest first)
    admissions.sort((a, b) => {
      const aBoost = a.isFeatured ? 10 : 0;
      const bBoost = b.isFeatured ? 10 : 0;
      return (b.priorityScore + bBoost) - (a.priorityScore + aBoost);
    });
    
    const totalCount = admissions.length;
    const openCount = admissions.filter(a => a.status === "Open").length;
    const closedCount = totalCount - openCount;
    
    // ✅ Featured admissions (top 2 from sorted list)
    const featuredAdmissions = admissions.filter(a => a.isFeatured).slice(0, 2);
    
    // ✅ Pagination
    const startIndex = (page - 1) * limit;
    const paginatedAdmissions = admissions.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      admissions: paginatedAdmissions,
      featuredAdmissions,
      totalCount,
      openCount,
      closedCount,
      totalPages,
      currentPage: page
    };
  } catch (error) {
    console.error('Error fetching admissions data:', error);
    return {
      admissions: [],
      featuredAdmissions: [],
      totalCount: 0,
      openCount: 0,
      closedCount: 0,
      totalPages: 0,
      currentPage: 1
    };
  }
}

async function getOpenCountForMetadata() {
  "use cache";
  cacheTag("admissions-metadata");
  cacheLife("hours");
  
  try {
    const posts = await postService.getList('admission', 10);
    if (!posts || !Array.isArray(posts)) return 0;
    return posts.filter(post => getMetaValue(post.meta, 'status', 'Open') === "Open").length;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return 0;
  }
}

// ============ METADATA ============
export async function generateMetadata(): Promise<Metadata> {
  const openCount = await getOpenCountForMetadata();
  const currentYear = "2026";
  
  return {
    title: `Admissions ${currentYear} in Pakistan | NextID.pk`,
    description: `Find ${openCount}+ latest university admissions in Pakistan for ${currentYear}. Check deadlines, eligibility criteria, programs offered, and apply online.`,
    keywords: `admissions ${currentYear}, university admissions Pakistan, college admissions, admission schedule, education Pakistan`,
    robots: 'index, follow',
    alternates: {
      canonical: 'https://www.nextid.pk/admissions',
      languages: {
        'en-US': 'https://www.nextid.pk/admissions',
      },
    },
    publisher: 'NextID.pk',
    authors: [{ name: 'NextID.pk' }],
    openGraph: {
      title: `Admissions ${currentYear} in Pakistan | NextID.pk`,
      description: `Find latest university admissions in Pakistan. Check deadlines and programs.`,
      url: 'https://www.nextid.pk/admissions',
      siteName: 'NextID.pk',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Admissions in Pakistan' }],
      locale: 'en_PK',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Admissions ${currentYear} in Pakistan`,
      description: `Find latest university admissions in Pakistan. Check deadlines and programs.`,
      images: ['/og-image.png'],
      site: '@nextidpk',
      creator: '@nextidpk',
    },
  };
}

// ============ PAGINATION COMPONENT ==========
function Pagination({ currentPage, totalPages, baseUrl, filter, search }: { 
  currentPage: number; 
  totalPages: number; 
  baseUrl: string;
  filter: string;
  search: string;
}) {
  if (totalPages <= 1) return null;
  
  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (filter !== 'all') params.set('filter', filter);
    if (search) params.set('search', search);
    return `${baseUrl}?${params.toString()}`;
  };
  
  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <Link
        href={buildUrl(currentPage - 1)}
        className={`px-3 py-2 rounded-lg border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
      >
        Previous
      </Link>
      
      {startPage > 1 && (
        <>
          <Link href={buildUrl(1)} className="px-3 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50">1</Link>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}
      
      {pages.map(page => (
        <Link
          key={page}
          href={buildUrl(page)}
          className={`px-3 py-2 rounded-lg border ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          {page}
        </Link>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2">...</span>}
          <Link href={buildUrl(totalPages)} className="px-3 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50">
            {totalPages}
          </Link>
        </>
      )}
      
      <Link
        href={buildUrl(currentPage + 1)}
        className={`px-3 py-2 rounded-lg border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
      >
        Next
      </Link>
    </div>
  );
}

// ============ MAIN PAGE ============
export default async function AdmissionsPage({ searchParams }: { searchParams: Promise<{ page?: string; filter?: string; search?: string }> }) {
  return (
    <Suspense fallback={<AdmissionsPageSkeleton />}>
      <AdmissionsContent searchParams={searchParams} />
    </Suspense>
  );
}

// ============ CONTENT COMPONENT ============
async function AdmissionsContent({ searchParams }: { searchParams: Promise<{ page?: string; filter?: string; search?: string }> }) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1');
  const filter = params.filter || 'all';
  const search = params.search || '';
  const currentYear = "2026";
  
  const { admissions, featuredAdmissions, totalCount, openCount, totalPages, currentPage: page } = 
    await getAdmissionsData(currentPage, 10, filter, search);
  
  const jsonLd = generateJsonLd({
    type: 'WebPage',
    title: `Admissions ${currentYear} in Pakistan`,
    description: `Find ${openCount}+ university admissions in Pakistan.`,
    url: 'https://www.nextid.pk/admissions',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Admissions', url: '/admissions' }],
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `Admissions ${currentYear} in Pakistan`,
        "description": `List of ${openCount} open admissions in Pakistan`,
        "numberOfItems": totalCount,
        "url": "https://www.nextid.pk/admissions",
        "itemListElement": admissions.slice(0, 10).map((item: AdmissionItem, index: number) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": `https://www.nextid.pk/admissions/${item.slug}`,
          "name": item.title
        }))
      }) }} />
      
      <main className="min-h-screen bg-gray-50">
        
        {/* ===== HERO SECTION ===== */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm">Admissions {currentYear}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-3">University Admissions</h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              {openCount} admissions currently open across Pakistan
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="font-semibold">{totalCount}</span> Total
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="font-semibold">{openCount}</span> Open
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="font-semibold">{totalCount - openCount}</span> Closed
              </div>
            </div>
          </div>
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* ===== LEFT COLUMN ===== */}
            <main className="lg:w-2/3">
              
              {/* ===== FILTERS & SEARCH ===== */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <form method="GET" className="w-full">
                      <input
                        type="text"
                        name="search"
                        defaultValue={search}
                        placeholder="Search admissions, institutes, cities..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      {search && (
                        <Link 
                          href="/admissions"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </Link>
                      )}
                    </form>
                  </div>
                  
                  {/* Filter */}
                  <div className="flex gap-2">
                    <Link
                      href={filter === 'all' ? '#' : '/admissions'}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        filter === 'all' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </Link>
                    <Link
                      href={filter === 'open' ? '#' : '/admissions?filter=open'}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        filter === 'open' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Open
                    </Link>
                    <Link
                      href={filter === 'closed' ? '#' : '/admissions?filter=closed'}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        filter === 'closed' 
                          ? 'bg-gray-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Closed
                    </Link>
                  </div>
                </div>
              </div>

              {/* ===== FEATURED ADMISSIONS ===== */}
              {featuredAdmissions.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-amber-500 rounded-full"></span>
                    Featured Admissions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {featuredAdmissions.map((item: AdmissionItem) => (
                      <Link key={item.id} href={`/admissions/${item.slug}`} className="group">
                        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100 h-full flex flex-col">
                          
                          {/* Image Area - Fixed Height 140px */}
                          <div className="relative h-[140px] w-full shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden">
                            {item.featuredImage ? (
                              <>
                                <Image 
                                  src={item.featuredImage} 
                                  alt={item.title} 
                                  fill 
                                  className="object-cover group-hover:scale-105 transition duration-500"
                                />
                                {/* Gradient overlay for better text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                              </>
                            ) : (
                              // Beautiful fallback with institute initials
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
                                  <span className="text-2xl font-bold text-blue-600">
                                    {getInitials(item.instituteName)}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                              <span className="bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-lg">
                                Featured
                              </span>
                              {item.status === "Open" && (
                                <span className="bg-green-500 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-lg">
                                  Open
                                </span>
                              )}
                            </div>
                            {item.closeDate && (
                              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {formatDate(item.closeDate)}
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition line-clamp-2 text-base">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1.5">
                              <Building2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{item.instituteName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{item.cityName}</span>
                            </div>
                            {item.programs && item.programs.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {item.programs.slice(0, 2).map((program, idx) => (
                                  <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full truncate max-w-[100px]">
                                    {program.name}
                                  </span>
                                ))}
                                {item.programs.length > 2 && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                                    +{item.programs.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== ALL ADMISSIONS LIST ===== */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                  All Admissions
                  <span className="text-sm font-normal text-gray-500 ml-2">({totalCount})</span>
                </h2>
                
                <div className="space-y-3">
                  {admissions.map((item: AdmissionItem) => (
                    <Link key={item.id} href={`/admissions/${item.slug}`} className="block">
                      <div className="bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group">
                        <div className="p-4 flex items-start gap-4">
                          
                          {/* Thumbnail - Fixed 48x48 with fallback */}
                          <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            {item.featuredImage ? (
                              <div className="relative w-full h-full">
                                <Image 
                                  src={item.featuredImage} 
                                  alt={item.title} 
                                  fill 
                                  className="object-cover group-hover:scale-105 transition duration-300"
                                />
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-blue-600">
                                {getInitials(item.instituteName)}
                              </span>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition line-clamp-1 text-sm md:text-base">
                                {item.title}
                              </h3>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                                item.status === "Open" 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {item.instituteName}
                              </span>
                              <span className="text-gray-300">•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {item.cityName}
                              </span>
                              {item.closeDate && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className={`flex items-center gap-1 ${item.status === "Open" ? 'text-orange-600' : 'text-gray-400'}`}>
                                    <Clock className="w-3 h-3" />
                                    {formatDate(item.closeDate)}
                                  </span>
                                </>
                              )}
                            </div>
                            
                            {item.programs && item.programs.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {item.programs.slice(0, 3).map((program, idx) => (
                                  <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full truncate max-w-[120px]">
                                    {program.name}
                                  </span>
                                ))}
                                {item.programs.length > 3 && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                                    +{item.programs.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 self-center" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                
                {admissions.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700">No admissions found</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {search ? 'Try adjusting your search or filters' : 'Check back later for new admissions'}
                    </p>
                    {search && (
                      <Link href="/admissions" className="inline-block mt-4 text-blue-600 hover:underline text-sm">
                        Clear search
                      </Link>
                    )}
                  </div>
                )}
                
                <Pagination 
                  currentPage={page} 
                  totalPages={totalPages} 
                  baseUrl="/admissions"
                  filter={filter}
                  search={search}
                />
              </div>
            </main>
            
            {/* ===== RIGHT COLUMN ===== */}
            <aside className="lg:w-1/3">
              <div className="lg:sticky lg:top-6 space-y-6">
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

// ============ SKELETON ============
function AdmissionsPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-white/20 rounded-full mx-auto mb-4"></div>
            <div className="h-12 w-96 bg-white/20 rounded-lg mx-auto mb-3"></div>
            <div className="h-6 w-64 bg-white/20 rounded-lg mx-auto"></div>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="h-8 w-32 bg-white/20 rounded-full"></div>
              <div className="h-8 w-24 bg-white/20 rounded-full"></div>
              <div className="h-8 w-28 bg-white/20 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-gray-200 rounded-lg"></div>
              <div className="h-8 w-48 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-gray-200 rounded-xl h-64"></div>
                <div className="bg-gray-200 rounded-xl h-64"></div>
              </div>
              <div className="h-8 w-40 bg-gray-200 rounded mt-8"></div>
              <div className="space-y-3">
                <div className="bg-gray-200 rounded-lg h-20"></div>
                <div className="bg-gray-200 rounded-lg h-20"></div>
                <div className="bg-gray-200 rounded-lg h-20"></div>
              </div>
            </div>
          </div>
          <div className="lg:w-1/3">
            <div className="animate-pulse space-y-6">
              <div className="bg-gray-200 rounded-xl h-64"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}