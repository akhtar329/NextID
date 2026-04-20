// app/component/sections/Home/ResultsSection.tsx
// ✅ Server Component - Only Highlights (No heavy table)

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
  boardName: string | null;
  boardSlug: string | null;
  universityName: string | null;
  universitySlug: string | null;
  isPopular: boolean | null;
  viewCount?: number | null;
}

// Server-side data fetching - Only get latest and popular results
async function getHighlightResults(): Promise<Result[]> {
  try {
    // Get latest 6 results (for "Latest Results" section)
    const latestResults = await db
      .select({
        id: results.id,
        slug: results.slug,
        title: results.title,
        year: results.year,
        resultDate: results.resultDate,
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
      .limit(6);

    return latestResults;
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

// Result Card Component
function ResultCard({ result, index }: { result: Result; index: number }) {
  const institutionName = result.boardName || result.universityName || 'Pakistan';
  const institutionType = result.boardName ? 'Board' : 'University';
  const isRecent = result.resultDate && (new Date().getTime() - new Date(result.resultDate).getTime()) < 30 * 24 * 60 * 60 * 1000;
  
  return (
    <Link
      href={`/results/${result.slug}`}
      className="group block bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all hover:border-blue-200 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left content */}
          <div className="flex-1 min-w-0">
            {/* Type Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
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
            
            {/* Institution Name */}
            <h3 className="text-sm md:text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {institutionName}
            </h3>
            
            {/* Program/Title */}
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
              {result.title}
            </p>
            
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <span>📅</span> {result.year}
              </span>
              {result.resultDate && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span>🕒</span> {getTimeAgo(result.resultDate)}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* CTA Button */}
          <div className="flex-shrink-0">
            <div className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors whitespace-nowrap">
              Check Result →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Main Server Component
export default async function ResultsSection() {
  const resultsData = await getHighlightResults();

  if (!resultsData.length) {
    return null;
  }

  // Simple stats
  const totalResults = resultsData.length;
  const popularCount = resultsData.filter(r => r.isPopular).length;
  const boardCount = resultsData.filter(r => r.boardName).length;
  const universityCount = resultsData.filter(r => r.universityName).length;

  return (
    <section className="py-8 md:py-12 bg-gradient-to-br from-gray-50 to-blue-50/20">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Section Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-block mb-3">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-1 rounded-full">
              📊 Latest Exam Results
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Recent Results in Pakistan
          </h2>
          <p className="text-sm text-gray-500">
            {totalResults} recent results • {popularCount} popular • {boardCount} boards • {universityCount} universities
          </p>
        </div>

        {/* Results Grid - Simple and Clean */}
        <div className="space-y-3">
          {resultsData.map((result, index) => (
            <ResultCard key={result.id} result={result} index={index} />
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-8">
          <Link
            href="/results"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-blue-600 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-600 hover:text-white transition-all group"
          >
            <span>View All Results</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <p className="text-xs text-gray-400 mt-3">
            Matric, Intermediate, BA, BSc, MA, MSc and more
          </p>
        </div>
      </div>
    </section>
  );
}