// components/sections/Home/JobsSection.tsx

import Link from 'next/link';
import { Briefcase, MapPin, Calendar, ChevronRight } from 'lucide-react';
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
    month: 'short'
  });
}

export default async function JobsSection() {
  const jobs = await postService.getPostsByType('job', 5);
  
  const items = jobs.map(post => {
    const meta = post.meta || {};
    const lastDate = getMetaValue(meta, 'lastDate', null) ? new Date(getMetaValue(meta, 'lastDate', '')) : null;
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      organization: getMetaValue(meta, 'organization', getMetaValue(meta, 'company', 'Company')),
      location: getMetaValue(meta, 'location', getMetaValue(meta, 'city', 'Pakistan')),
      lastDate: lastDate,
      isUrgent: getMetaValue(meta, 'isUrgent', false),
    };
  });

  if (items.length === 0) return null;

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800">Latest Jobs</h2>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Urgent</span>
        </div>
        <Link href="/jobs" className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Minimal List */}
      <div className="space-y-2">
        {items.map((item) => (
          <Link key={item.id} href={`/jobs/${item.slug}`} className="block group">
            <div className="bg-white rounded-lg p-3 border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition line-clamp-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="font-medium text-gray-600">{item.organization}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </span>
                      {item.lastDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.lastDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {item.isUrgent && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full whitespace-nowrap">
                    Urgent
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}