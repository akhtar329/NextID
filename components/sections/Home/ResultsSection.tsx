// components/sections/Home/ResultsSection.tsx

import Link from 'next/link';
import { postService } from '@/services/post/post.service';
import type { Post } from '@/repositories/post/post.repository';
import { unstable_cache } from 'next/cache';

// Types
interface Result {
  id: number;
  slug: string;
  title: string;
  year: number;
  resultDate: Date | null;
  boardName: string | null;
  boardSlug: string | null;
  universityName: string | null;
  universitySlug: string | null;
  isPopular: boolean | null;
  viewCount?: number | null;
}

// Helper to safely extract meta values
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined ? value : defaultValue;
}

// Get results from posts service
async function getResultsFromPosts(): Promise<Result[]> {
  try {
    const posts = await postService.getPostsByType('result', 5);
    
    return posts.map((post: Post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      year: getMetaValue(post.meta, 'year', new Date().getFullYear()),
      resultDate: getMetaValue(post.meta, 'resultDate', null) ? new Date(getMetaValue(post.meta, 'resultDate', '')) : null,
      boardName: getMetaValue(post.meta, 'boardName', null),
      boardSlug: getMetaValue(post.meta, 'boardSlug', null),
      universityName: getMetaValue(post.meta, 'universityName', null),
      universitySlug: getMetaValue(post.meta, 'universitySlug', null),
      isPopular: post.isPopular || false,
      viewCount: post.viewCount || 0,
    }));
  } catch (error) {
    console.error("Error fetching results:", error);
    return [];
  }
}

// CACHED version - 5 minutes
const getCachedResults = unstable_cache(
  getResultsFromPosts,
  ['home-results-self'],
  { revalidate: 300, tags: ['results-home'] }
);

// Helper functions
function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  try {
    return date.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
}

function getTimeAgo(date: Date | null): string {
  if (!date) return '';
  try {
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return formatDate(date);
  } catch {
    return '';
  }
}

// Result Card Component
function ResultCard({ result, index }: { result: Result; index: number }) {
  const institutionName = result.boardName || result.universityName || 'Pakistan';
  const institutionType = result.boardName ? 'Board' : 'University';
  const isRecent = result.resultDate && (new Date().getTime() - new Date(result.resultDate).getTime()) < 30 * 24 * 60 * 60 * 1000;
  const isPopular = result.isPopular;
  
  // Get color based on institution type
  const typeColor = institutionType === 'Board' 
    ? 'bg-emerald-100 text-emerald-700' 
    : 'bg-indigo-100 text-indigo-700';
  
  return (
    <Link
      href={`/results/${result.slug}`}
      className="group block bg-white rounded-xl border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 overflow-hidden"
    >
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Left Content */}
          <div className="flex-1 min-w-0">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold ${typeColor}`}>
                {institutionType}
              </span>
              {isPopular && (
                <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-600 text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>Popular</span>
                </span>
              )}
              {isRecent && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  New
                </span>
              )}
            </div>
            
            {/* Institution Name */}
            <h3 className="text-sm md:text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {institutionName}
            </h3>
            
            {/* Result Title */}
            <p className="text-xs md:text-sm text-gray-500 mt-1 line-clamp-1">
              {result.title}
            </p>
            
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] md:text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {result.year}
              </span>
              {result.resultDate && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {getTimeAgo(result.resultDate)}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* CTA Button */}
          <div className="flex-shrink-0">
            <div className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs md:text-sm font-medium rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all whitespace-nowrap flex items-center gap-1">
              <span>Check Result</span>
              <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-4 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl md:text-3xl font-bold">{value}</div>
          <div className="text-xs md:text-sm opacity-90 mt-1">{title}</div>
        </div>
        <div className="text-3xl md:text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );
}

// Main Component
export default async function ResultsSection() {
  const resultsData = await getCachedResults();

  if (!resultsData.length) {
    return null;
  }

  const totalResults = resultsData.length;
  const popularCount = resultsData.filter(r => r.isPopular).length;
  const boardCount = resultsData.filter(r => r.boardName).length;
  const universityCount = resultsData.filter(r => r.universityName).length;
  const recentCount = resultsData.filter(r => {
    if (!r.resultDate) return false;
    const diffDays = Math.ceil((new Date().getTime() - new Date(r.resultDate).getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;

  return (
    <section className="py-10 bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-50 rounded-full px-4 py-1.5 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Latest Announcements</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Recent <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Exam Results</span>
          </h2>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            Check the latest board and university examination results from across Pakistan
          </p>
        </div>
        
        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatsCard title="Total Results" value={totalResults} icon="📊" color="from-indigo-500 to-indigo-700" />
          <StatsCard title="Popular" value={popularCount} icon="⭐" color="from-yellow-500 to-yellow-700" />
          <StatsCard title="Boards" value={boardCount} icon="🏛️" color="from-emerald-500 to-emerald-700" />
          <StatsCard title="Universities" value={universityCount} icon="🎓" color="from-purple-500 to-purple-700" />
        </div>
        
        {/* Recent Results Badge */}
        {recentCount > 0 && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              {recentCount} new results added recently
            </span>
          </div>
        )}
        
        {/* Results List */}
        <div className="space-y-3">
          {resultsData.map((result, index) => (
            <ResultCard key={result.id} result={result} index={index} />
          ))}
        </div>
        
        {/* View All Link */}
        <div className="text-center mt-8">
          <Link
            href="/results"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-indigo-600 text-indigo-600 text-sm font-semibold rounded-xl hover:bg-indigo-600 hover:text-white transition-all group shadow-sm hover:shadow-md"
          >
            <span>View All Results</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-xs text-gray-400 mt-3">
            Matric, Intermediate, BA, BSc, MA, MSc and more
          </p>
        </div>
        
      </div>
    </section>
  );
}