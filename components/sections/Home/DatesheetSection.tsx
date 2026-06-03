// components/sections/Home/DatesheetSection.tsx

import Link from 'next/link';
import { Calendar, Eye, Clock } from 'lucide-react';
import { postService } from '@/services/post/post.service';

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

export default async function DatesheetSection() {
  const dateSheets = await postService.getPostsByType('date_sheet', 6);
  
  // Transform data
  const items = dateSheets.map(post => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    examType: getMetaValue(post.meta, 'examType', 'Annual'),
    examDate: getMetaValue(post.meta, 'examDate', null) ? new Date(getMetaValue(post.meta, 'examDate', '')) : null,
    boardName: getMetaValue(post.meta, 'boardName', null),
    instituteName: getMetaValue(post.meta, 'instituteName', null),
    officialLink: getMetaValue(post.meta, 'officialLink', null),
    isPopular: getMetaValue(post.meta, 'isPopular', false),      // ✅ Fixed: from meta
    viewCount: getMetaValue(post.meta, 'viewCount', 0),          // ✅ Fixed: from meta
  }));

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Exam Date Sheets
          </h2>
          <p className="text-white/70 text-xs">Latest exam schedules</p>
        </div>
        <Link href="/date-sheets" className="text-white/80 hover:text-white text-sm">
          View All →
        </Link>
      </div>
      
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <Link key={item.id} href={`/date-sheets/${item.slug}`} className="block p-4 hover:bg-orange-50 transition group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.isPopular && (
                    <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">Popular</span>
                  )}
                  <span className="text-xs text-gray-500">{item.examType}</span>
                </div>
                <h3 className="font-semibold text-gray-800 group-hover:text-orange-600 transition line-clamp-1">
                  {item.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(item.examDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {item.viewCount.toLocaleString()} views
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-orange-600 group-hover:translate-x-1 transition">
                →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}