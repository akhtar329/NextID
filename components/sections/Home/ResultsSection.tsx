// components/sections/Home/ResultsSection.tsx

import Link from 'next/link';
import { FileText, Calendar, Eye } from 'lucide-react';
import { postService } from '@/services/post/post.service';

// ✅ Static year (build time pe fix)
const CURRENT_YEAR = 2026;

// Helper function
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
  
  // Transform data
  const items = results.map(post => {
    const meta = post.meta || {};
    const resultDate = getMetaValue(meta, 'resultDate', null) ? new Date(getMetaValue(meta, 'resultDate', '')) : null;
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      boardName: getMetaValue(meta, 'boardName', null),
      instituteName: getMetaValue(meta, 'universityName', null),
      year: getMetaValue(meta, 'year', CURRENT_YEAR), // ✅ Fixed: static year
      resultDate: resultDate,
      isPopular: getMetaValue(meta, 'isPopular', false),
      viewCount: getMetaValue(meta, 'viewCount', 0),
    };
  });

  if (items.length === 0) return null;

  const institutionName = (item: typeof items[0]) => item.boardName || item.instituteName || 'Board/University';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-green-500 px-5 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Latest Results
          </h2>
          <p className="text-white/70 text-xs">Board & university results</p>
        </div>
        <Link href="/results" className="text-white/80 hover:text-white text-sm">
          View All →
        </Link>
      </div>
      
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <Link key={item.id} href={`/results/${item.slug}`} className="block p-4 hover:bg-green-50 transition group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.isPopular && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Popular</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition line-clamp-1">
                  {item.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    {institutionName(item)}
                  </span>
                  <span className="flex items-center gap-1">
                    📅 Year: {item.year}
                  </span>
                  {item.resultDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.resultDate)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {item.viewCount.toLocaleString()} views
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-green-600 group-hover:translate-x-1 transition">
                →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}