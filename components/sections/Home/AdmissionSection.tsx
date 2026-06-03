// components/sections/Home/AdmissionSection.tsx

import Link from 'next/link';
import { GraduationCap, MapPin, Calendar, Eye } from 'lucide-react';
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

export default async function AdmissionSection() {
  const admissions = await postService.getPostsByType('admission', 5);
  
  // Transform data
  const items = admissions.map(post => {
    const meta = post.meta || {};
    const closeDate = getMetaValue(meta, 'closeDate', null) ? new Date(getMetaValue(meta, 'closeDate', '')) : null;
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      instituteName: getMetaValue(meta, 'instituteName', 'University'),
      cityName: getMetaValue(meta, 'cityName', 'Pakistan'),
      closeDate: closeDate,
      programCount: (getMetaValue(meta, 'programs', []) as Array<unknown>).length,
      isFeatured: getMetaValue(meta, 'isFeatured', false),
      viewCount: getMetaValue(meta, 'viewCount', 0),
    };
  });

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Latest Admissions
          </h2>
          <p className="text-white/70 text-xs">University admissions 2026</p>
        </div>
        <Link href="/admissions" className="text-white/80 hover:text-white text-sm">
          View All →
        </Link>
      </div>
      
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <Link key={item.id} href={`/admissions/${item.slug}`} className="block p-4 hover:bg-blue-50 transition group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.isFeatured && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Featured</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition line-clamp-1">
                  {item.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    {item.instituteName}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.cityName}
                  </span>
                  {item.closeDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.closeDate)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {item.viewCount.toLocaleString()} views
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-blue-600 group-hover:translate-x-1 transition">
                →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}