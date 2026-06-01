// components/sections/Home/AdmissionSection.tsx

import Link from 'next/link';
import { postService } from '@/services/post/post.service';

// Types
interface Admission {
  id: number;
  name: string;
  slug: string;
  instituteId: number;
  closeDate: Date | null;
  year: number;
  session: string | null;
  instituteName?: string;
  cityName?: string;
  daysLeft?: number | null;
}

// Helper
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined ? value : defaultValue;
}

// Get days left
function getDaysLeft(date: Date | null): number | null {
  if (!date) return null;
  try {
    const deadline = new Date(date);
    const now = new Date();
    deadline.setHours(23, 59, 59, 999);
    now.setHours(23, 59, 59, 999);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  } catch {
    return null;
  }
}

// Format date
function formatDate(date: Date | null): string {
  if (!date) return 'Date TBA';
  try {
    return date.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Date TBA';
  }
}

// Get urgency info
function getUrgencyInfo(daysLeft: number | null | undefined) {
  if (daysLeft === null || daysLeft === undefined) {
    return {
      badgeText: '📅 Admission Open',
      gradient: 'from-blue-600 to-indigo-700',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-700'
    };
  }
  if (daysLeft <= 3) {
    return {
      badgeText: '🔴 DANGER - Closing Soon',
      gradient: 'from-red-600 to-red-700',
      lightBg: 'bg-red-50',
      textColor: 'text-red-700'
    };
  }
  if (daysLeft <= 7) {
    return {
      badgeText: '🟠 WARNING - Limited Time',
      gradient: 'from-orange-500 to-orange-600',
      lightBg: 'bg-orange-50',
      textColor: 'text-orange-700'
    };
  }
  if (daysLeft <= 15) {
    return {
      badgeText: '🟢 SAFE - Good Time',
      gradient: 'from-green-500 to-green-600',
      lightBg: 'bg-green-50',
      textColor: 'text-green-700'
    };
  }
  return {
    badgeText: '🎓 Admission Open',
    gradient: 'from-blue-600 to-indigo-700',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-700'
  };
}

// Get admissions from service and sort by days left (urgent first)
async function getAdmissions(): Promise<Admission[]> {
  try {
    const posts = await postService.getPostsByType('admission', 20);
    
    const admissions: Admission[] = posts.map((post) => ({
      id: post.id,
      name: post.title,
      slug: post.slug,
      instituteId: getMetaValue(post.meta, 'instituteId', 0),
      closeDate: getMetaValue(post.meta, 'closeDate', null) ? new Date(getMetaValue(post.meta, 'closeDate', '')) : null,
      year: getMetaValue(post.meta, 'year', new Date().getFullYear()),
      session: getMetaValue(post.meta, 'session', null),
      instituteName: getMetaValue(post.meta, 'instituteName', 'University'),
      cityName: getMetaValue(post.meta, 'cityName', 'Pakistan'),
    }));
    
    const admissionsWithDays = admissions.map(ad => ({
      ...ad,
      daysLeft: getDaysLeft(ad.closeDate)
    }));
    
    const sortedAdmissions = admissionsWithDays.sort((a, b) => {
      if (a.daysLeft === null && b.daysLeft === null) return 0;
      if (a.daysLeft === null) return 1;
      if (b.daysLeft === null) return -1;
      return (a.daysLeft ?? 999) - (b.daysLeft ?? 999);
    });
    
    return sortedAdmissions;
  } catch (error) {
    console.error("Error fetching admissions:", error);
    return [];
  }
}

// ==================== COMPONENTS ====================

// Main Featured Admission Card
function FeaturedAdmissionCard({ admission }: { admission: Admission }) {
  const daysLeft = admission.daysLeft ?? null;
  const urgency = getUrgencyInfo(daysLeft);
  
  return (
    <Link href={`/admissions/${admission.slug}`} className="block group h-full">
      <div className={`relative bg-gradient-to-br ${urgency.gradient} rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 h-full`}>
        <div className="relative p-5 md:p-6 flex flex-col h-full text-white">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-3">
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs md:text-sm font-semibold px-2.5 py-1 rounded-full">
              {urgency.badgeText}
            </span>
            {daysLeft !== null && (
              <div className="text-right bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <div className="text-xl md:text-2xl font-bold">{daysLeft}</div>
                <div className="text-[10px] md:text-xs opacity-80">days left</div>
              </div>
            )}
          </div>
          
          {/* University Info */}
          <div className="mb-3">
            <div className="flex items-center gap-2 text-white/70 text-xs md:text-sm mb-1">
              <span className="font-medium truncate max-w-[200px]">{admission.instituteName}</span>
              <span>•</span>
              <span className="flex items-center gap-1">📍 {admission.cityName}</span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-yellow-300 transition-colors line-clamp-2">
              {admission.name}
            </h3>
          </div>
          
          {/* Details */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs md:text-sm text-white/70">
            <span>{admission.session || 'Fall'} {admission.year}</span>
            <span>•</span>
            <span>Deadline: {formatDate(admission.closeDate)}</span>
          </div>
          
          {/* Apply Button */}
          <div className="mt-auto pt-3 flex items-center justify-between border-t border-white/20">
            <span className="text-sm md:text-base font-medium">Apply Now →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Small Admission Card
function SmallAdmissionCard({ admission, index }: { admission: Admission; index: number }) {
  const daysLeft = admission.daysLeft ?? null;
  const urgency = getUrgencyInfo(daysLeft);
  const isUrgent = daysLeft !== null && daysLeft <= 3;
  const isWarning = daysLeft !== null && daysLeft <= 7 && daysLeft > 3;
  
  const borderClass = isUrgent ? 'border-l-4 border-l-red-500' : (isWarning ? 'border-l-4 border-l-orange-500' : '');
  
  return (
    <Link href={`/admissions/${admission.slug}`} className="block group">
      <div className={`bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all duration-300 ${borderClass}`}>
        <div className="flex items-start gap-3">
          {/* Rank Badge */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${urgency.gradient}`}>
            {index + 1}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="text-xs md:text-sm font-medium text-gray-500 truncate max-w-[150px]">
                {admission.instituteName}
              </div>
              {daysLeft !== null && (
                <div className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded ${urgency.lightBg} ${urgency.textColor}`}>
                  {daysLeft} days
                </div>
              )}
            </div>
            <h4 className="text-sm md:text-base font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">
              {admission.name}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
              <span>📍 {admission.cityName}</span>
              <span>•</span>
              <span>{admission.year}</span>
            </div>
          </div>
          
          <div className="flex-shrink-0 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
            →
          </div>
        </div>
      </div>
    </Link>
  );
}

// ==================== MAIN COMPONENT ====================
export default async function AdmissionSection() {
  const admissions = await getAdmissions();
  
  if (!admissions || admissions.length === 0) {
    return null;
  }
  
  // Take first 5 admissions only
  const topAdmissions = admissions.slice(0, 5);
  const featuredAdmission = topAdmissions[0];
  const rightTopAdmissions = topAdmissions.slice(1, 3);
  const rightBottomAdmissions = topAdmissions.slice(3, 5);
  
  return (
    <section className="py-10 bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Section Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 rounded-full px-4 py-1.5 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Limited Seats Available</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            University <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Admissions 2026</span>
          </h2>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            Secure your future at Pakistan&apos;s top universities. Apply now for undergraduate and graduate programs.
          </p>
        </div>
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* LEFT - Featured Card (Most Urgent) */}
          <div className="lg:col-span-2">
            <FeaturedAdmissionCard admission={featuredAdmission} />
          </div>
          
          {/* RIGHT - Stack of 2 Small Cards */}
          <div className="space-y-4">
            {rightTopAdmissions.map((admission, idx) => (
              <SmallAdmissionCard key={admission.id} admission={admission} index={idx} />
            ))}
          </div>
        </div>
        
        {/* Bottom Row - 2 More Small Cards */}
        {rightBottomAdmissions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {rightBottomAdmissions.map((admission, idx) => (
              <SmallAdmissionCard key={admission.id} admission={admission} index={idx + 2} />
            ))}
          </div>
        )}
        
        {/* View All Link */}
        <div className="text-center mt-8">
          <Link
            href="/admissions"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all group"
          >
            <span>Browse All Admissions</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <p className="text-xs text-gray-400 mt-2">
            Including public and private sector universities across Pakistan
          </p>
        </div>
        
      </div>
    </section>
  );
}