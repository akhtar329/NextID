// app/admissions/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Filter, 
  X, 
  Search,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  ExternalLink,
  TrendingUp,
  School,
  Globe
} from "lucide-react";

import { generateSEO } from "@/lib/seo";
import { postService } from "@/services/post/post.service";

// Types
interface Program {
  id: number;
  name: string;
  slug: string;
}

interface AdmissionItem {
  id: number;
  slug: string;
  title: string;
  name: string;
  instituteName: string;
  instituteLogo: string | null;
  cityName: string;
  status: string;
  openDate: Date | null;
  closeDate: Date | null;
  programs: Program[];
  meta: Record<string, unknown> | null;
}

// Program type for sidebar
interface ProgramType {
  slug: string;
  name: string;
  icon: React.ElementType;
  count: number;
}

// Post type from the service
interface PostFromService {
  id: number;
  slug: string;
  title: string;
  type: string;
  content: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  meta: Record<string, unknown> | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  status: string | null;
  publishedAt: Date | null;
}

// Helper function to safely get meta values
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

// Helper function to get days left
function getDaysLeft(closeDate: Date | null): number | null {
  if (!closeDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(closeDate);
  deadline.setHours(0, 0, 0, 0);
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : (diffDays === 0 ? 0 : null);
}

// ==================== METADATA ====================
export async function generateMetadata(): Promise<Metadata> {
  return generateSEO({
    entityType: "page",
    entityId: 1,
    path: "/admissions",
    title: "Admissions 2026 in Pakistan | NextID.pk",
    description: "Find latest university admissions in Pakistan with deadlines and programs.",
  });
}

// ==================== MAIN PAGE ====================
export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams || {};
  
  const page = Number(params.page || 1);
  const limit = 10;
  
  const city = typeof params.city === "string" ? params.city : "";
  const level = typeof params.level === "string" ? params.level : "";
  const searchQuery = typeof params.q === "string" ? params.q : "";
  
  // Fetch all admissions first
  const allAdmissionsData = await postService.getPostsByType("admission", 1000);
  
  // Filter admissions based on search query
  let filteredAdmissions: PostFromService[] = allAdmissionsData;
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredAdmissions = filteredAdmissions.filter((post: PostFromService) => 
      post.title.toLowerCase().includes(query) ||
      getMetaValue(post.meta, 'instituteName', '').toLowerCase().includes(query) ||
      getMetaValue(post.meta, 'cityName', '').toLowerCase().includes(query)
    );
  }
  
  if (city) {
    filteredAdmissions = filteredAdmissions.filter((post: PostFromService) => 
      getMetaValue(post.meta, 'cityName', '').toLowerCase() === city.toLowerCase()
    );
  }
  
  if (level) {
    filteredAdmissions = filteredAdmissions.filter((post: PostFromService) => 
      getMetaValue(post.meta, 'level', '').toLowerCase() === level.toLowerCase()
    );
  }
  
  const total = filteredAdmissions.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedAdmissions = filteredAdmissions.slice(startIndex, startIndex + limit);
  
  // Transform posts to admission format
  const admissions: AdmissionItem[] = paginatedAdmissions.map((post: PostFromService) => {
    const meta = post.meta || {};
    const programsRaw = getMetaValue(meta, 'programs', []) as Array<{ id: number; name: string; slug: string }>;
    
    const programs: Program[] = programsRaw.map((p: { id: number; name: string; slug: string }) => ({
      id: p.id || Date.now(),
      name: p.name || '',
      slug: p.slug || ''
    })).filter(p => p.name);
    
    // Safely parse dates
    let openDate: Date | null = null;
    let closeDate: Date | null = null;
    
    const openDateRaw = getMetaValue(meta, 'openDate', null);
    const closeDateRaw = getMetaValue(meta, 'closeDate', null);
    
    if (openDateRaw && typeof openDateRaw === 'string') {
      try {
        const parsedDate = new Date(openDateRaw);
        if (!isNaN(parsedDate.getTime())) openDate = parsedDate;
      } catch {
        openDate = null;
      }
    }
    
    if (closeDateRaw && typeof closeDateRaw === 'string') {
      try {
        const parsedDate = new Date(closeDateRaw);
        if (!isNaN(parsedDate.getTime())) closeDate = parsedDate;
      } catch {
        closeDate = null;
      }
    }
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      name: post.title,
      instituteName: getMetaValue(meta, 'instituteName', 'University'),
      instituteLogo: null,
      cityName: getMetaValue(meta, 'cityName', 'Pakistan'),
      status: getMetaValue(meta, 'status', 'Open'),
      openDate: openDate,
      closeDate: closeDate,
      programs: programs,
      meta: post.meta,
    };
  });

  // Get stats from all admissions
  const stats = {
    total: allAdmissionsData.length,
    closingSoon: allAdmissionsData.filter((post: PostFromService) => {
      const closeDate = post.meta?.closeDate as string | undefined;
      if (!closeDate) return false;
      try {
        const daysLeft = getDaysLeft(new Date(closeDate));
        return daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
      } catch {
        return false;
      }
    }).length,
    universities: new Set(allAdmissionsData.map((post: PostFromService) => post.meta?.instituteName as string).filter(Boolean)).size,
    cities: new Set(allAdmissionsData.map((post: PostFromService) => post.meta?.cityName as string).filter(Boolean)).size,
  };

  const buildUrl = (key: string, value: string) => {
    const url = new URLSearchParams();
    if (city && key !== "city") url.set("city", city);
    if (level && key !== "level") url.set("level", level);
    if (searchQuery && key !== "q") url.set("q", searchQuery);
    if (value && value !== "") url.set(key, value);
    return `/admissions?${url.toString()}`;
  };

  const programTypes: ProgramType[] = [
    { slug: "", name: "All Programs", icon: GraduationCap, count: allAdmissionsData.length },
    { slug: "matric", name: "Matriculation", icon: BookOpen, count: allAdmissionsData.filter((post: PostFromService) => post.meta?.level === "matric").length },
    { slug: "inter", name: "Intermediate", icon: BookOpen, count: allAdmissionsData.filter((post: PostFromService) => post.meta?.level === "inter").length },
    { slug: "bs", name: "Bachelor", icon: GraduationCap, count: allAdmissionsData.filter((post: PostFromService) => post.meta?.level === "bs").length },
    { slug: "ms", name: "Masters", icon: Award, count: allAdmissionsData.filter((post: PostFromService) => post.meta?.level === "ms").length },
  ];

  const heroStats = [
    { label: "Active Admissions", value: stats.total, icon: TrendingUp, color: "bg-blue-500" },
    { label: "Closing Soon", value: stats.closingSoon, icon: AlertCircle, color: "bg-red-500" },
    { label: "Universities", value: stats.universities, icon: School, color: "bg-green-500" },
    { label: "Cities", value: stats.cities, icon: Globe, color: "bg-purple-500" },
  ];

  const activeFiltersCount = [city, level, searchQuery].filter(Boolean).length;
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <span className="text-yellow-400 text-sm">🎓</span>
              <span className="text-white text-xs font-semibold tracking-wide">2026 Admissions Now Open</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              University <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Admissions 2026</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
              Find and apply to top universities across Pakistan. Your gateway to quality education begins here.
            </p>
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {heroStats.map((stat, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${stat.color} mb-2`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar - Floating */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-3">
          <form action="/admissions" method="GET" className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search by university, program, or city..."
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button type="submit" className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
              Search Admissions
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            {city && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-sm shadow-sm">
                📍 {city}
                <Link href={buildUrl("city", "")} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </Link>
              </span>
            )}
            {level && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-sm shadow-sm">
                {programTypes.find(p => p.slug === level)?.name}
                <Link href={buildUrl("level", "")} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </Link>
              </span>
            )}
            <Link href="/admissions" className="ml-auto text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              Clear all <span>→</span>
            </Link>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-80 shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Program Filter Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Program Level</h3>
                </div>
                <div className="space-y-1">
                  {programTypes.map((p) => {
                    const active = level === p.slug;
                    const IconComponent = p.icon;
                    return (
                      <Link
                        key={p.slug}
                        href={buildUrl("level", p.slug)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                          active ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md" : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className={`w-4 h-4 ${active ? "text-white" : "text-gray-500"}`} />
                          <span className="font-medium text-sm">{p.name}</span>
                        </div>
                        <span className={`text-xs ${active ? "text-white/80" : "text-gray-400"}`}>{p.count}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Help Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Star className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Need Help?</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Get personalized admission guidance from our experts.</p>
                <Link href="/contact" className="block w-full text-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">
                  Contact Us
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <section className="flex-1">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {total} Admission{total !== 1 ? 's' : ''} Available
                </h2>
                {total > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Showing {startItem} to {endItem} of {total} results
                  </p>
                )}
              </div>
            </div>

            {/* Admissions List */}
            <div className="space-y-5">
              {admissions.length > 0 ? (
                admissions.map((item) => {
                  const isOpen = item.status === "Open";
                  const daysLeft = getDaysLeft(item.closeDate);
                  const isUrgent = daysLeft !== null && daysLeft <= 7;
                  
                  return (
                    <div key={item.id} className="group bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-indigo-200 overflow-hidden">
                      <Link href={`/admissions/${item.slug}`} className="block">
                        <div className="p-5 md:p-6">
                          <div className="flex flex-col md:flex-row gap-5">
                            {/* University Logo */}
                            <div className="shrink-0">
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-sm">
                                <GraduationCap className="w-8 h-8 text-indigo-600" />
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              {/* Header */}
                              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition line-clamp-1">
                                    {item.title}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-gray-600 text-sm font-medium">{item.instituteName}</span>
                                    <span className="text-gray-300">•</span>
                                    <span className="flex items-center gap-1 text-sm text-gray-500">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {item.cityName}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {isUrgent && (
                                    <div className="px-2.5 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      {daysLeft} days left
                                    </div>
                                  )}
                                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                                    isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {isOpen ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                    <span>{item.status}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Programs */}
                              {item.programs && item.programs.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {item.programs.slice(0, 4).map((program) => (
                                    <span key={program.id} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg">
                                      {program.name}
                                    </span>
                                  ))}
                                  {item.programs.length > 4 && (
                                    <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg">
                                      +{item.programs.length - 4} more
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Footer */}
                              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-gray-100">
                                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                  {item.openDate && (
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5" />
                                      Starts: {item.openDate.toLocaleDateString()}
                                    </span>
                                  )}
                                  {item.closeDate && (
                                    <span className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5" />
                                      Deadline: {item.closeDate.toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                
                                <span className="text-indigo-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                                  Apply Now
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900">No admissions found</h3>
                  <p className="text-gray-500 mt-2">Try adjusting your filters or search term</p>
                  <Link href="/admissions" className="inline-block mt-6 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                    Clear all filters
                  </Link>
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
                  {page > 1 && (
                    <Link
                      href={buildUrl("page", String(page - 1))}
                      className="px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1 text-gray-600 hover:bg-gray-50"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Prev
                    </Link>
                  )}
                  
                  {(() => {
                    const pages: number[] = [];
                    const maxVisible = 5;
                    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
                    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
                    
                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }
                    
                    return pages.map((pageNum) => (
                      <Link
                        key={pageNum}
                        href={buildUrl("page", String(pageNum))}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors font-medium ${
                          page === pageNum 
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </Link>
                    ));
                  })()}
                  
                  {page < totalPages && (
                    <Link
                      href={buildUrl("page", String(page + 1))}
                      className="px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1 text-gray-600 hover:bg-gray-50"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}