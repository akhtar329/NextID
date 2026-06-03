// components/sections/Home/JobsSection.tsx

import Link from 'next/link';
import { Briefcase, MapPin, Clock, Eye } from 'lucide-react';
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

function getDaysLeft(date: Date | null): number | null {
  if (!date) return null;
  const today = new Date();
  const deadline = new Date(date);
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : null;
}

export default async function JobsSection() {
  const jobs = await postService.getPostsByType('job', 5);
  
  // Transform data
  const items = jobs.map(post => {
    const meta = post.meta || {};
    const deadline = getMetaValue(meta, 'deadline', null) ? new Date(getMetaValue(meta, 'deadline', '')) : null;
    const daysLeft = getDaysLeft(deadline);
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      company: getMetaValue(meta, 'company', 'Company'),
      location: getMetaValue(meta, 'location', 'Pakistan'),
      jobType: getMetaValue(meta, 'jobType', 'Full Time'),
      deadline: deadline,
      isUrgent: daysLeft !== null && daysLeft <= 7 && daysLeft > 0,
      description: post.excerpt || post.content,
      isFeatured: getMetaValue(meta, 'isFeatured', false),   // ✅ Fixed: from meta
      viewCount: getMetaValue(meta, 'viewCount', 0),         // ✅ Fixed: from meta
    };
  });

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-5 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Latest Jobs
          </h2>
          <p className="text-white/70 text-xs">New career opportunities</p>
        </div>
        <Link href="/jobs" className="text-white/80 hover:text-white text-sm">
          View All →
        </Link>
      </div>
      
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <Link key={item.id} href={`/jobs/${item.slug}`} className="block p-4 hover:bg-purple-50 transition group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.isFeatured && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Featured</span>
                  )}
                  {item.isUrgent && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Urgent</span>
                  )}
                  <span className="text-xs text-gray-500">{item.jobType}</span>
                </div>
                <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition line-clamp-1">
                  {item.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {item.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.location}
                  </span>
                  {item.deadline && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.deadline)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {item.viewCount.toLocaleString()} views
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-purple-600 group-hover:translate-x-1 transition">
                →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}