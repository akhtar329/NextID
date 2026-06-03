// components/sections/Home/ScholarshipsSection.tsx

import Link from 'next/link';
import { Award, Calendar, Eye } from 'lucide-react';
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

export default async function ScholarshipsSection() {
  const scholarships = await postService.getPostsByType('scholarship', 5);
  
  // Transform data
  const items = scholarships.map(post => {
    const meta = post.meta || {};
    const deadline = getMetaValue(meta, 'applicationDeadline', null) ? new Date(getMetaValue(meta, 'applicationDeadline', '')) : null;
    const daysLeft = getDaysLeft(deadline);
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      provider: getMetaValue(meta, 'organizationName', getMetaValue(meta, 'provider', 'Various')),
      studyLevel: getMetaValue(meta, 'studyLevel', 'Various'),
      deadline: deadline,
      isUrgent: daysLeft !== null && daysLeft <= 7 && daysLeft > 0,
      isFeatured: getMetaValue(meta, 'isFeatured', false),
      viewCount: getMetaValue(meta, 'viewCount', 0),
    };
  });

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-5 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <Award className="w-5 h-5" />
            Scholarships
          </h2>
          <p className="text-white/70 text-xs">Funding opportunities</p>
        </div>
        <Link href="/scholarships" className="text-white/80 hover:text-white text-sm">
          View All →
        </Link>
      </div>
      
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <Link key={item.id} href={`/scholarships/${item.slug}`} className="block p-4 hover:bg-teal-50 transition group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.isFeatured && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Featured</span>
                  )}
                  {item.isUrgent && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Urgent</span>
                  )}
                  <span className="text-xs text-gray-500">{item.studyLevel}</span>
                </div>
                <h3 className="font-semibold text-gray-800 group-hover:text-teal-600 transition line-clamp-1">
                  {item.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    {item.provider}
                  </span>
                  {item.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.deadline)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {item.viewCount.toLocaleString()} views
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-teal-600 group-hover:translate-x-1 transition">
                →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}