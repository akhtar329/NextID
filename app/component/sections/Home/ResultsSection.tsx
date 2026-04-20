// app/component/sections/Home/ResultsSection.tsx
// ✅ Fixed Tailwind conflict - No warnings

import Link from 'next/link';
import { db } from '@/app/lib/db';
import { results, boards, institutes } from '@/app/lib/schema';
import { eq, desc } from 'drizzle-orm';

// Types
interface Result {
  id: number;
  slug: string;
  title: string;
  year: number;
  resultDate: Date | null;
  programName: string | null;
  boardName: string | null;
  boardSlug: string | null;
  universityName: string | null;
  universitySlug: string | null;
  isPopular: boolean | null;
  viewCount?: number | null;
}

// Server-side data fetching
async function getResults(): Promise<Result[]> {
  try {
    const resultsData = await db
      .select({
        id: results.id,
        slug: results.slug,
        title: results.title,
        year: results.year,
        resultDate: results.resultDate,
        programName: results.title,
        boardName: boards.name,
        boardSlug: boards.slug,
        universityName: institutes.name,
        universitySlug: institutes.slug,
        isPopular: results.isPopular,
        viewCount: results.viewCount,
      })
      .from(results)
      .leftJoin(boards, eq(results.boardId, boards.id))
      .leftJoin(institutes, eq(results.instituteId, institutes.id))
      .where(eq(results.status, true))
      .orderBy(desc(results.resultDate), desc(results.year))
      .limit(50);

    return resultsData;
  } catch (error) {
    console.error('Error fetching results:', error);
    return [];
  }
}

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

function formatViews(views?: number | null): string {
  if (!views) return '0 views';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
  return `${views} views`;
}

// Result Card Component
function ResultCard({ result, index }: { result: Result; index: number }) {
  const institutionName = result.boardName || result.universityName || 'Unknown';
  const institutionType = result.boardName ? 'Board' : 'University';
  const isRecent = result.resultDate && (new Date().getTime() - new Date(result.resultDate).getTime()) < 30 * 24 * 60 * 60 * 1000;
  
  return (
    <Link
      href={`/results/${result.slug}`}
      className="group block bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all hover:border-blue-300 overflow-hidden"
    >
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-[10px] md:text-xs font-bold">
                {index + 1}
              </div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${
                institutionType === 'Board' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {institutionType}
              </span>
              {result.isPopular && (
                <span className="inline-flex items-center gap-1 text-yellow-500 text-xs">
                  <span>⭐</span>
                  <span className="hidden sm:inline text-[10px]">Popular</span>
                </span>
              )}
              {isRecent && (
                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">
                  New
                </span>
              )}
            </div>
            
            <h3 className="text-sm md:text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {institutionName}
            </h3>
            
            <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-1">
              {result.programName || result.title || 'Results Announced'}
            </p>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2 text-[10px] md:text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span>📅</span> Year: {result.year}
              </span>
              {result.resultDate && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1">
                    <span>🕒</span> {getTimeAgo(result.resultDate)}
                  </span>
                </>
              )}
              {result.viewCount && result.viewCount > 0 && (
                <>
                  <span className="text-gray-300 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1 hidden sm:flex">
                    <span>👁️</span> {formatViews(result.viewCount)}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <div className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white text-xs md:text-sm font-medium rounded-lg group-hover:bg-blue-700 transition-colors whitespace-nowrap">
              View Result →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Stats Card Component
function StatsCard({ 
  label, 
  value, 
  color, 
  icon 
}: { 
  label: string; 
  value: number; 
  color: string; 
  icon: string;
}) {
  return (
    <div className="bg-white rounded-xl p-3 md:p-4 text-center border border-gray-200 shadow-sm">
      <div className="text-2xl md:text-3xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs md:text-sm text-gray-600 flex items-center justify-center gap-1">
        <span>{icon}</span> {label}
      </div>
    </div>
  );
}

// Main Server Component
export default async function ResultsSection() {
  const resultsData = await getResults();

  if (!resultsData.length) {
    return null;
  }

  const currentDate = new Date();
  const thisMonth = resultsData.filter(r => {
    if (!r.resultDate) return false;
    const date = new Date(r.resultDate);
    return date.getMonth() === currentDate.getMonth() && 
           date.getFullYear() === currentDate.getFullYear();
  }).length;
  
  const boardResults = resultsData.filter(r => r.boardName).length;
  const universityResults = resultsData.filter(r => r.universityName).length;
  const popularResults = resultsData.filter(r => r.isPopular).length;
  
  const latestResults = resultsData
    .filter(r => {
      if (!r.resultDate) return false;
      const date = new Date(r.resultDate);
      const diffDays = Math.ceil((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    })
    .slice(0, 6);

  return (
    <section className="py-8 md:py-12 bg-gradient-to-br from-gray-50 to-blue-50/20">
      <div className="container mx-auto px-4 max-w-6xl">
        
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-block mb-3">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-1 rounded-full">
              📊 Latest Updates
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Exam Results in Pakistan
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
            Check {thisMonth} new results announced this month
            {popularResults > 0 && ` • ${popularResults} popular results available`}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <StatsCard label="Total Results" value={resultsData.length} color="#2563EB" icon="📋" />
          <StatsCard label="Board Results" value={boardResults} color="#16A34A" icon="🏛️" />
          <StatsCard label="University Results" value={universityResults} color="#9333EA" icon="🎓" />
          <StatsCard label="This Month" value={thisMonth} color="#EA580C" icon="📅" />
        </div>

        {latestResults.length > 0 && (
          <div className="mb-8 md:mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-5 md:h-6 bg-blue-600 rounded-full"></span>
                🔥 Latest Results
              </h3>
              <Link 
                href="/results" 
                className="text-xs md:text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {latestResults.map((result, index) => (
                <ResultCard key={result.id} result={result} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* ✅ Fixed: Desktop Table View */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-5 md:h-6 bg-green-600 rounded-full"></span>
              All Results
            </h3>
          </div>
          
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Institution</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resultsData.slice(0, 10).map((result, idx) => {
                  const institutionName = result.boardName || result.universityName || 'Unknown';
                  const institutionType = result.boardName ? 'Board' : 'University';
                  
                  return (
                    <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          institutionType === 'Board' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {institutionType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{institutionName}</div>
                        {result.isPopular && (
                          <span className="inline-flex items-center gap-1 text-yellow-500 text-xs mt-1">
                            ⭐ Popular
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {result.programName || result.title || 'General'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                          {result.year}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(result.resultDate)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/results/${result.slug}`}
                          className="inline-flex px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ Fixed: Mobile Card View - No Tailwind conflict */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-green-600 rounded-full"></span>
              All Results
            </h3>
          </div>
          <div className="space-y-3">
            {resultsData.slice(0, 10).map((result, idx) => {
              const institutionName = result.boardName || result.universityName || 'Unknown';
              const institutionType = result.boardName ? 'Board' : 'University';
              
              return (
                <Link
                  key={result.id}
                  href={`/results/${result.slug}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400 font-medium">#{idx + 1}</span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          institutionType === 'Board' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {institutionType}
                        </span>
                        {result.isPopular && <span className="text-yellow-500 text-xs">⭐</span>}
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{institutionName}</h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                        {result.programName || result.title || 'Results Announced'}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                        <span>Year {result.year}</span>
                        <span>•</span>
                        <span>{formatDate(result.resultDate)}</span>
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-blue-600 text-white text-xs rounded-lg whitespace-nowrap">
                      View →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {resultsData.length > 10 && (
          <div className="text-center mt-8 md:mt-10">
            <Link
              href="/results"
              className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm md:text-base font-semibold rounded-lg hover:shadow-lg transition-all group"
            >
              <span>Browse All {resultsData.length} Results</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}