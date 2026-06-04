// components/sections/Home/ResultsSection.tsx

import Link from 'next/link';
import {  ChevronRight} from 'lucide-react';
import { postService } from '@/services/post/post.service';

function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export default async function ResultsSection() {
  const results = await postService.getPostsByType('result', 5);
  
  const items = results.map(post => {
    const meta = post.meta || {};
    const resultDate = getMetaValue(meta, 'resultDate', null) ? new Date(getMetaValue(meta, 'resultDate', '')) : null;
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      boardName: getMetaValue(meta, 'boardName', getMetaValue(meta, 'board', 'Board')),
      examType: getMetaValue(meta, 'examType', getMetaValue(meta, 'type', 'Annual')),
      resultDate: resultDate,
      isFeatured: post.isFeatured || getMetaValue(meta, 'isFeatured', false),
    };
  });

  if (items.length === 0) return null;

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-teal-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800">Results</h2>
          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Latest</span>
        </div>
        <Link href="/results" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Simple List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="divide-y divide-gray-100">
          {items.map((item, index) => (
            <Link key={item.id} href={`/results/${item.slug}`} className="block hover:bg-green-50/30 transition group">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  {/* Rank/Number */}
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{item.boardName}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{item.examType}</span>
                      {item.isFeatured && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">⭐</span>
                      )}
                    </div>
                    <h3 className="text-sm text-gray-600 group-hover:text-green-600 transition line-clamp-1">
                      {item.title}
                    </h3>
                  </div>
                  
                  {item.resultDate && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{formatDate(item.resultDate)}</div>
                      <div className="text-xs text-green-600 group-hover:opacity-100 opacity-0 transition">Check →</div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}