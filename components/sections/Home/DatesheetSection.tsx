// components/sections/Home/DatesheetSection.tsx

import Link from 'next/link';
import { Calendar, ChevronRight, FileText, Clock, ExternalLink } from 'lucide-react';
import { postService } from '@/services/post/post.service';
import type { ExtendedPost } from '@/services/post/post.service';

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

export default async function DateSheetSection() {
  // ✅ NEW: getList function with limit 5
  const dateSheets = await postService.getList('date_sheet', 5);
  
  const items = dateSheets.map((post: ExtendedPost) => {
    const meta = post.meta || {};
    const examStartDate = getMetaValue(meta, 'examStartDate', null) ? new Date(getMetaValue(meta, 'examStartDate', '')) : null;
    const examEndDate = getMetaValue(meta, 'examEndDate', null) ? new Date(getMetaValue(meta, 'examEndDate', '')) : null;
    
    // External URL for redirection
    const externalUrl = getMetaValue(meta, 'externalUrl', '') || 
                        getMetaValue(meta, 'officialUrl', '') ||
                        getMetaValue(meta, 'boardWebsite', '') ||
                        getMetaValue(meta, 'redirectUrl', '');
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      boardName: getMetaValue(meta, 'boardName', getMetaValue(meta, 'board', 'Board')),
      examType: getMetaValue(meta, 'examType', getMetaValue(meta, 'type', 'Annual')),
      className: getMetaValue(meta, 'className', getMetaValue(meta, 'class', '')),
      examStartDate: examStartDate,
      examEndDate: examEndDate,
      externalUrl: externalUrl,
      isReleased: getMetaValue(meta, 'isReleased', true),
    };
  });

  if (items.length === 0) return null;

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800">Date Sheets</h2>
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Official</span>
        </div>
        <Link href="/date-sheets" className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Date Sheet List - External Redirect */}
      <div className="space-y-3">
        {items.map((item) => {
          // Use external URL if available, otherwise go to internal page
          const redirectUrl = item.externalUrl || `/date-sheets/${item.slug}`;
          const isExternal = !!item.externalUrl;
          
          return (
            <a
              key={item.id}
              href={redirectUrl}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="block group cursor-pointer"
            >
              <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-3">
                  {/* PDF Icon */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex flex-col items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-orange-600" />
                    <span className="text-[10px] font-bold text-orange-600 mt-0.5">PDF</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{item.boardName}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{item.examType}</span>
                      {item.className && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs font-medium text-orange-600">{item.className}</span>
                        </>
                      )}
                    </div>
                    
                    <h3 className="font-medium text-gray-700 group-hover:text-orange-600 transition line-clamp-1">
                      {item.title}
                    </h3>
                    
                    {(item.examStartDate || item.examEndDate) && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {item.examStartDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            From: {formatDate(item.examStartDate)}
                          </span>
                        )}
                        {item.examEndDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            To: {formatDate(item.examEndDate)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* View/Redirect Button */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded-lg group-hover:bg-orange-600 transition">
                      <span className="text-sm font-medium">View on Website</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    {isExternal && (
                      <span className="text-xs text-gray-400">Official Board Website</span>
                    )}
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
      
      {/* Note for users */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
          <ExternalLink className="w-3 h-3" />
          Click to view on official board website
        </p>
      </div>
    </div>
  );
}