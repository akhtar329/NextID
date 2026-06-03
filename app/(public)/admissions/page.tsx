// app/(public)/admissions/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, MapPin, Calendar, Clock } from "lucide-react";
import { postService } from "@/services/post/post.service";

// Helper functions
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const metadata: Metadata = {
  title: "Admissions 2026 in Pakistan | NextID.pk",
  description: "Find latest university admissions in Pakistan with deadlines and programs.",
};

export default async function AdmissionsPage() {
  // Fetch data from service
  const posts = await postService.getPostsByType('admission', 50);
  
  // Transform data
  const admissions = posts.map(post => {
    const meta = post.meta || {};
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      instituteName: getMetaValue(meta, 'instituteName', 'University'),
      cityName: getMetaValue(meta, 'cityName', 'Pakistan'),
      status: getMetaValue(meta, 'status', 'Open'),
      openDate: getMetaValue(meta, 'openDate', null) ? new Date(getMetaValue(meta, 'openDate', '')) : null,
      closeDate: getMetaValue(meta, 'closeDate', null) ? new Date(getMetaValue(meta, 'closeDate', '')) : null,
      programs: getMetaValue(meta, 'programs', []),
    };
  });

  const isOpen = (status: string) => status === "Open";

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            University Admissions 2026
          </h1>
          <p className="text-xl text-blue-100">
            Find and apply to top universities across Pakistan
          </p>
        </div>
      </div>

      {/* Admissions List */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Latest Admissions ({admissions.length})
            </h2>
          </div>

          {/* List */}
          <div className="space-y-5">
            {admissions.map((item) => (
              <Link 
                key={item.id} 
                href={`/admissions/${item.slug}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start gap-5">
                    {/* Icon */}
                    <div className="shrink-0 w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                      <GraduationCap className="w-7 h-7 text-blue-600" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition line-clamp-1">
                          {item.title}
                        </h3>
                        
                        {/* Status Badge */}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isOpen(item.status) 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      
                      {/* Institute & Location */}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                        <span className="font-medium text-gray-700">{item.instituteName}</span>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {item.cityName}
                        </span>
                      </div>
                      
                      {/* Programs */}
                      {item.programs && item.programs.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.programs.slice(0, 4).map((program: any, idx: number) => (
                            <span key={idx} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                              {program.name}
                            </span>
                          ))}
                          {item.programs.length > 4 && (
                            <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full">
                              +{item.programs.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Dates */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-2 border-t border-gray-100">
                        {item.openDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Starts: {formatDate(item.openDate)}
                          </span>
                        )}
                        {item.closeDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Deadline: {formatDate(item.closeDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Empty State */}
          {admissions.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No admissions found</h3>
              <p className="text-gray-500">Check back later for new admissions</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}