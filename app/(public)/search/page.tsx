// app/(public)/search/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import React from 'react';
import { Search, Calendar, Briefcase, GraduationCap, Award, FileText, Clock } from 'lucide-react';
import { postService } from '@/services/post/post.service';
import type { ExtendedPost } from '@/services/post/post.service';
import { cacheTag, cacheLife } from 'next/cache';

export const metadata: Metadata = {
  title: 'Search Results | NextID.pk',
  description: 'Search for admissions, jobs, scholarships, results, news and more on NextID.pk',
};

// Types
interface SearchResultItem {
  id: number;
  slug: string;
  title: string;
  type: string;
  excerpt: string | null;
  publishedAt: Date | null;
  meta: Record<string, unknown> | null;
}

// Helper function
function getMetaValue(meta: Record<string, unknown> | null, key: string): string {
  if (!meta) return '';
  const value = meta[key];
  return value && typeof value === 'string' ? value : '';
}

function formatDate(date: Date | null): string {
  if (!date) return 'Recent';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getTypeStyles(type: string) {
  const styles: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
    admission: { icon: <GraduationCap className="w-4 h-4" />, bg: 'bg-blue-100', text: 'text-blue-700', label: 'Admission' },
    job: { icon: <Briefcase className="w-4 h-4" />, bg: 'bg-purple-100', text: 'text-purple-700', label: 'Job' },
    scholarship: { icon: <Award className="w-4 h-4" />, bg: 'bg-teal-100', text: 'text-teal-700', label: 'Scholarship' },
    result: { icon: <FileText className="w-4 h-4" />, bg: 'bg-green-100', text: 'text-green-700', label: 'Result' },
    news: { icon: <FileText className="w-4 h-4" />, bg: 'bg-red-100', text: 'text-red-700', label: 'News' },
    date_sheet: { icon: <Calendar className="w-4 h-4" />, bg: 'bg-orange-100', text: 'text-orange-700', label: 'Date Sheet' },
    blog: { icon: <FileText className="w-4 h-4" />, bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Blog' },
  };
  return styles[type] || { icon: <FileText className="w-4 h-4" />, bg: 'bg-gray-100', text: 'text-gray-700', label: type };
}

// Search Result Card Component
function SearchResultCard({ result }: { result: SearchResultItem }) {
  const typeStyle = getTypeStyles(result.type);
  const publishedDate = result.publishedAt;
  
  let subtitle = '';
  let metaInfo = '';
  
  if (result.type === 'admission') {
    subtitle = getMetaValue(result.meta, 'instituteName');
    metaInfo = getMetaValue(result.meta, 'cityName') ? `📍 ${getMetaValue(result.meta, 'cityName')}` : '';
  } else if (result.type === 'job') {
    subtitle = getMetaValue(result.meta, 'company');
    metaInfo = getMetaValue(result.meta, 'location') ? `📍 ${getMetaValue(result.meta, 'location')}` : '';
  } else if (result.type === 'scholarship') {
    subtitle = getMetaValue(result.meta, 'provider');
    metaInfo = getMetaValue(result.meta, 'studyLevel') ? `🎓 ${getMetaValue(result.meta, 'studyLevel')}` : '';
  } else if (result.type === 'result') {
    subtitle = getMetaValue(result.meta, 'boardName') || getMetaValue(result.meta, 'universityName') || '';
    metaInfo = getMetaValue(result.meta, 'year') ? `📅 ${getMetaValue(result.meta, 'year')}` : '';
  } else if (result.type === 'date_sheet') {
    subtitle = getMetaValue(result.meta, 'boardName') || getMetaValue(result.meta, 'instituteName') || '';
    metaInfo = getMetaValue(result.meta, 'examType') ? `📝 ${getMetaValue(result.meta, 'examType')}` : '';
  } else if (result.type === 'blog') {
    subtitle = getMetaValue(result.meta, 'authorName') || '';
    metaInfo = getMetaValue(result.meta, 'category') ? `📚 ${getMetaValue(result.meta, 'category')}` : '';
  }
  
  const getUrlPath = () => {
    if (result.type === 'date_sheet') return `/date-sheets/${result.slug}`;
    if (result.type === 'blog') return `/blog/${result.slug}`;
    return `/${result.type}s/${result.slug}`;
  };
  
  return (
    <Link href={getUrlPath()} className="block group">
      <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 ${typeStyle.bg} rounded-lg flex items-center justify-center`}>
            <div className={typeStyle.text}>{typeStyle.icon}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                {typeStyle.label}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition mb-1 line-clamp-2">
              {result.title}
            </h2>
            {subtitle && <p className="text-sm text-gray-600 mb-2">{subtitle}</p>}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {metaInfo && <span>{metaInfo}</span>}
              {publishedDate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(new Date(publishedDate))}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Search Form Component (Client Component)
function SearchForm({ initialQuery }: { initialQuery: string }) {
  'use client';
  
  const [query, setQuery] = React.useState(initialQuery);
  
  return (
    <form action="/search" method="GET" className="relative">
      <input
        type="text"
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for admissions, jobs, scholarships, results..."
        className="w-full pl-12 pr-32 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
        autoFocus
      />
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
        Search
      </button>
    </form>
  );
}

// ============ LOADING COMPONENT ============
function SearchLoading() {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

// ============ CACHED SEARCH FUNCTION ============
async function getAllSearchablePosts(): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("search-all-posts");
  cacheLife("hours");
  
  try {
    const types = ['admission', 'job', 'scholarship', 'result', 'news', 'date_sheet', 'blog'] as const;
    
    type SearchablePostType = (typeof types)[number];
    const results = await Promise.all(
      types.map((type: SearchablePostType) => postService.getList(type, 500))
    );
    
    const allPosts = results.flat();
    return allPosts;
  } catch (error) {
    console.error('Error fetching searchable posts:', error);
    return [];
  }
}

// ============ SEARCH CONTENT COMPONENT ============
async function SearchContent({ searchParamsPromise }: { searchParamsPromise: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParamsPromise;
  const query = params.q || '';
  const page = parseInt(params.page || '1');
  const limit = 20;
  
  let results: SearchResultItem[] = [];
  let total = 0;
  let totalPages = 0;
  
  if (query) {
    // ✅ NEW: Get all posts from cache
    const allPosts = await getAllSearchablePosts();
    
    // Filter by search query
    const filtered = allPosts.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase())
    );
    
    total = filtered.length;
    totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    results = filtered.slice(start, start + limit).map(item => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      type: item.type,
      excerpt: item.excerpt,
      publishedAt: item.publishedAt,
      meta: item.meta,
    }));
  }
  
  return (
    <>
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Search Results</h1>
            <p className="text-blue-200 mb-8">Find admissions, jobs, scholarships, results and more</p>
            <div className="max-w-2xl mx-auto">
              <SearchForm initialQuery={query} />
            </div>
          </div>
        </div>
      </div>
      
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
            <p className="text-gray-500 mb-4">We couldn&apos;t find any results for &quot;{query}&quot;</p>
          </div>
        )}
        
        {query && results.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{total} result{total !== 1 ? 's' : ''} for &quot;{query}&quot;</h2>
                <p className="text-sm text-gray-500 mt-1">Showing page {page} of {totalPages}</p>
              </div>
            </div>
            <div className="space-y-4">
              {results.map((result) => (
                <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                {page > 1 && (
                  <Link href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">
                    ← Previous
                  </Link>
                )}
                <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">{page}</span>
                {page < totalPages && (
                  <Link href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">
                    Next →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ============ MAIN PAGE ============
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={<SearchLoading />}>
        <SearchContent searchParamsPromise={searchParams} />
      </Suspense>
    </main>
  );
}