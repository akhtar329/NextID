// components/sections/Home/AdmissionSection.tsx

import Link from 'next/link';
import Image from 'next/image';
import { GraduationCap, MapPin, Calendar, ChevronRight } from 'lucide-react';
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

export default async function AdmissionSection() {
  const admissions = await postService.getPostsByType('admission', 4);
  
  const items = admissions.map(post => {
    const meta = post.meta || {};
    const closeDate = getMetaValue(meta, 'closeDate', null) ? new Date(getMetaValue(meta, 'closeDate', '')) : null;
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      featuredImage: post.featuredImage,
      instituteName: getMetaValue(meta, 'instituteName', 'University'),
      cityName: getMetaValue(meta, 'cityName', 'Pakistan'),
      closeDate: closeDate,
      programCount: (getMetaValue(meta, 'programs', []) as Array<unknown>).length,
      isFeatured: post.isFeatured || getMetaValue(meta, 'isFeatured', false),
    };
  });

  if (items.length === 0) return null;

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-800">Admissions 2026</h2>
          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Open</span>
        </div>
        <Link href="/admissions" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 2x2 Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((item) => (
          <Link key={item.id} href={`/admissions/${item.slug}`} className="block group">
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 h-full">
              {/* Image */}
              <div className="relative h-40 w-full overflow-hidden">
                {item.featuredImage ? (
                  <Image
                    src={item.featuredImage}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                    <GraduationCap className="w-12 h-12 text-blue-400" />
                  </div>
                )}
                {item.isFeatured && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs px-2 py-1 rounded-full z-10">
                    Featured
                  </span>
                )}
              </div>
              
              {/* Content */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {item.instituteName}
                  </span>
                  {item.closeDate && (
                    <span className="text-xs text-orange-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.closeDate)}
                    </span>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                  {item.title}
                </h3>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.cityName}
                  </span>
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    {item.programCount}+ Programs
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}