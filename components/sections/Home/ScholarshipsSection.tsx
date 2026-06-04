// components/sections/Home/ScholarshipsSection.tsx

import Link from 'next/link';
import Image from 'next/image';
import { Award, ChevronRight, DollarSign } from 'lucide-react';
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

export default async function ScholarshipsSection() {
  const scholarships = await postService.getPostsByType('scholarship', 4);
  
  const items = scholarships.map(post => {
    const meta = post.meta || {};
    const deadline = getMetaValue(meta, 'deadline', null) ? new Date(getMetaValue(meta, 'deadline', '')) : null;
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      featuredImage: post.featuredImage,
      organization: getMetaValue(meta, 'organization', getMetaValue(meta, 'provider', 'Organization')),
      amount: getMetaValue(meta, 'amount', getMetaValue(meta, 'funding', '')),
      deadline: deadline,
      isFullyFunded: getMetaValue(meta, 'isFullyFunded', false),
    };
  });

  if (items.length === 0) return null;

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800">Scholarships</h2>
          <span className="text-xs bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full">Funded</span>
        </div>
        <Link href="/scholarships" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 2x2 Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((item) => (
          <Link key={item.id} href={`/scholarships/${item.slug}`} className="block group">
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 h-full">
              {/* Image */}
              <div className="relative h-36 w-full overflow-hidden">
                {item.featuredImage ? (
                  <Image
                    src={item.featuredImage}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                    <Award className="w-12 h-12 text-teal-400" />
                  </div>
                )}
                {item.isFullyFunded && (
                  <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full z-10">
                    Fully Funded
                  </span>
                )}
              </div>
              
              {/* Content */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                    {item.organization}
                  </span>
                  {item.amount && (
                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {item.amount}
                    </span>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-teal-600 transition-colors mb-2">
                  {item.title}
                </h3>
                
                {item.deadline && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Deadline:</span>
                    <span className="text-orange-600 font-medium">{formatDate(item.deadline)}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}