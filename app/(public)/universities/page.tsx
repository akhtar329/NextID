'use client';

import Link from 'next/link';
import { Building2, MapPin, BookOpen, GraduationCap, Star, Award, ArrowRight } from 'lucide-react';
import { University } from '@/types/universities.types';

// ✅ Safe component with default values and null checks
export default function UniversityCard({ university, featured = false }: { university: University; featured?: boolean }) {
  // ✅ Safely access properties with fallback values
  const {
    id = 0,
    slug = '',
    name = 'University',
    city = 'Location',
    type = 'public',
    programsCount = 0,
    admissionsCount = 0,
    ranking = 0,
    description = '',
  } = university || {};
  
  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Featured Badge */}
      {featured && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-lg">
            <Star className="w-3 h-3 fill-current" />
            <span>Top Ranked</span>
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="p-6">
        {/* University Logo Placeholder */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-7 h-7 text-blue-600" />
          </div>
          {/* ✅ Safe ranking check with proper condition */}
          {ranking && ranking > 0 && ranking <= 10 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg">
              <Award className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-semibold text-blue-600">#{ranking}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link href={`/universities/${slug}`}>
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition line-clamp-1">
            {name}
          </h3>
        </Link>

        {/* Location & Type */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="w-3.5 h-3.5" />
            <span>{city || 'Location'}</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full" />
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Building2 className="w-3.5 h-3.5" />
            <span>{type === 'public' ? 'Public' : 'Private'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-sm text-gray-600">{programsCount || 0}+ Programs</span>
          </div>
          {(admissionsCount && admissionsCount > 0) && (
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-green-500" />
              <span className="text-sm text-green-600 font-medium">{admissionsCount} Open</span>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Link
            href={`/universities/${slug}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 text-sm font-medium rounded-xl hover:bg-blue-50 hover:text-blue-600 transition"
          >
            View Details
            <ArrowRight className="w-4 h-4" />
          </Link>
          {(admissionsCount && admissionsCount > 0) && (
            <Link
              href={`/universities/${slug}/admissions`}
              className="px-4 py-2.5 bg-green-50 text-green-600 text-sm font-medium rounded-xl hover:bg-green-100 transition"
            >
              Apply Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}