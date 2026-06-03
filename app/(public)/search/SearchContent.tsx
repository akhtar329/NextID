// app/(public)/search/SearchContent.tsx

import Link from "next/link";
import { Search, Calendar, Briefcase, GraduationCap, Award, FileText, TrendingUp, Clock } from 'lucide-react';

type SearchItem = {
  id: number;
  title: string;
  slug: string;
  type?: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  meta?: Record<string, unknown> | null;
};

type SearchResponse = {
  success: boolean;
  data: SearchItem[];
  total: number;
  page: number;
  totalPages: number;
};

async function getSearchResults(query: string, page: number): Promise<SearchResponse> {
  try {
    const q = encodeURIComponent(query || "");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/public/search?q=${q}&page=${page}&limit=20`,
      {
        cache: "no-store",
        next: { revalidate: 0 }
      }
    );

    if (!res.ok) {
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }

    const data = await res.json();
    
    return {
      success: true,
      data: Array.isArray(data?.data) ? data.data : [],
      total: data?.total || 0,
      page: data?.page || page,
      totalPages: data?.totalPages || 0
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      data: [],
      total: 0,
      page: 1,
      totalPages: 0
    };
  }
}

function safeNumber(value: string | undefined, fallback: number = 1): number {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function formatDate(date: string | null | undefined): string {
  if (!date) return 'Recent';
  try {
    return new Date(date).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Recent';
  }
}

function getTypeStyles(type: string | undefined) {
  const styles: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
    admission: { 
      icon: <GraduationCap className="w-4 h-4" />, 
      bg: 'bg-blue-100', 
      text: 'text-blue-700',
      label: 'Admission'
    },
    job: { 
      icon: <Briefcase className="w-4 h-4" />, 
      bg: 'bg-purple-100', 
      text: 'text-purple-700',
      label: 'Job'
    },
    scholarship: { 
      icon: <Award className="w-4 h-4" />, 
      bg: 'bg-teal-100', 
      text: 'text-teal-700',
      label: 'Scholarship'
    },
    result: { 
      icon: <FileText className="w-4 h-4" />, 
      bg: 'bg-green-100', 
      text: 'text-green-700',
      label: 'Result'
    },
    news: { 
      icon: <FileText className="w-4 h-4" />, 
      bg: 'bg-red-100', 
      text: 'text-red-700',
      label: 'News'
    },
    date_sheet: { 
      icon: <Calendar className="w-4 h-4" />, 
      bg: 'bg-orange-100', 
      text: 'text-orange-700',
      label: 'Date Sheet'
    },
  };
  return styles[type || ''] || { 
    icon: <FileText className="w-4 h-4" />, 
    bg: 'bg-gray-100', 
    text: 'text-gray-700',
    label: type || 'Result'
  };
}

function getMetaValue(meta: Record<string, unknown> | null | undefined, key: string): string {
  if (!meta) return '';
  const value = meta[key];
  return value && typeof value === 'string' ? value : '';
}

function SearchResultCard({ item }: { item: SearchItem }) {
  const typeStyle = getTypeStyles(item.type);
  const publishedDate = item.publishedAt || item.createdAt;
  
  // Extract additional info based on type
  let subtitle = '';
  let metaInfo = '';
  
  if (item.type === 'admission') {
    subtitle = getMetaValue(item.meta, 'instituteName');
    metaInfo = getMetaValue(item.meta, 'cityName') ? `📍 ${getMetaValue(item.meta, 'cityName')}` : '';
  } else if (item.type === 'job') {
    subtitle = getMetaValue(item.meta, 'company');
    metaInfo = getMetaValue(item.meta, 'location') ? `📍 ${getMetaValue(item.meta, 'location')}` : '';
  } else if (item.type === 'scholarship') {
    subtitle = getMetaValue(item.meta, 'provider');
    metaInfo = getMetaValue(item.meta, 'studyLevel') ? `🎓 ${getMetaValue(item.meta, 'studyLevel')}` : '';
  } else if (item.type === 'result') {
    subtitle = getMetaValue(item.meta, 'boardName') || getMetaValue(item.meta, 'universityName') || '';
    metaInfo = getMetaValue(item.meta, 'year') ? `📅 ${getMetaValue(item.meta, 'year')}` : '';
  } else if (item.type === 'date_sheet') {
    subtitle = getMetaValue(item.meta, 'boardName') || getMetaValue(item.meta, 'instituteName') || '';
    metaInfo = getMetaValue(item.meta, 'examType') ? `📝 ${getMetaValue(item.meta, 'examType')}` : '';
  }
  
  // Determine the correct URL path
  const getUrlPath = () => {
    if (item.type === 'date_sheet') return `/date-sheets/${item.slug}`;
    return `/${item.type}s/${item.slug}`;
  };
  
  return (
    <Link href={getUrlPath()} className="block group">
      <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all">
        <div className="flex items-start gap-4">
          {/* Type Badge */}
          <div className={`flex-shrink-0 w-10 h-10 ${typeStyle.bg} rounded-lg flex items-center justify-center`}>
            <div className={typeStyle.text}>{typeStyle.icon}</div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                {typeStyle.label}
              </span>
              {item.excerpt && (
                <span className="text-xs text-gray-400 line-clamp-1">
                  {item.excerpt.substring(0, 100)}
                </span>
              )}
            </div>
            
            <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition mb-1 line-clamp-2">
              {item.title}
            </h2>
            
            {subtitle && (
              <p className="text-sm text-gray-600 mb-2">
                {subtitle}
              </p>
            )}
            
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {metaInfo && <span>{metaInfo}</span>}
              {publishedDate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(publishedDate)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function SearchContent({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    page?: string;
  };
}) {
  const query = searchParams?.q || "";
  const page = safeNumber(searchParams?.page, 1);

  const { data: results, total, totalPages } = await getSearchResults(query, page);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Search Results
            </h1>
            <p className="text-blue-200 mb-8">
              Find admissions, jobs, scholarships, results and more
            </p>
            
            {/* Search Form */}
            <div className="max-w-2xl mx-auto">
              <form action="/search" method="GET" className="relative">
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Search for admissions, jobs, scholarships, results..."
                  className="w-full pl-12 pr-32 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-8">
        {!query && (
          <div className="text-center py-16 bg-white rounded-xl">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Enter a search term</h2>
            <p className="text-gray-500">Search for admissions, jobs, scholarships, results, news and more...</p>
          </div>
        )}

        {query && results.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No results found</h2>
            <p className="text-gray-500 mb-4">
              We couldn&apos;t find any results for &quot;{query}&quot;
            </p>
            <p className="text-sm text-gray-400">
              Try different keywords or check your spelling
            </p>
          </div>
        )}

        {query && results.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {total} result{total !== 1 ? 's' : ''} for &quot;{query}&quot;
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Showing page {page} of {totalPages}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {results.map((item: SearchItem) => (
                <SearchResultCard key={item.id} item={item} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                {page > 1 && (
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    ← Previous
                  </Link>
                )}
                
                <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                  {page}
                </span>
                
                {page < totalPages && (
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Next →
                  </Link>
                )}
              </div>
            )}

            {/* Search Tips */}
            <div className="mt-8 p-5 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Search Tips
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Use specific keywords like &quot;LUMS admission 2026&quot; or &quot;Software Engineer job&quot;</li>
                <li>• Try different spellings or variations of your search terms</li>
                <li>• Use quotes for exact phrase matching: &quot;computer science&quot;</li>
                <li>• Browse categories for better results</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}