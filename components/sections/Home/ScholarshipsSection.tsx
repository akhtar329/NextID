// components/sections/Home/ScholarshipsSection.tsx

import Link from 'next/link';
import { postService } from '@/services/post/post.service';
import type { Post } from '@/repositories/post/post.repository';
import { unstable_cache } from 'next/cache';

// Types
interface Scholarship {
  id: number;
  title: string;
  slug: string;
  studyLevel: string;
  type: string;
  location: string;
  deadline: Date | null;
  provider: string;
  description: string | null;
}

// Helper
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined ? value : defaultValue;
}

// Get scholarships
async function getScholarshipsFromPosts(): Promise<Scholarship[]> {
  try {
    const posts = await postService.getPostsByType('scholarship', 6);
    
    const scholarships: Scholarship[] = posts.map((post: Post) => {
      const deadline = getMetaValue(post.meta, 'applicationDeadline', null) 
        ? new Date(getMetaValue(post.meta, 'applicationDeadline', '')) 
        : null;
      
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        studyLevel: getMetaValue(post.meta, 'studyLevel', 'Various'),
        type: getMetaValue(post.meta, 'type', 'Merit-Based'),
        location: getMetaValue(post.meta, 'location', 'Pakistan'),
        deadline: deadline,
        provider: getMetaValue(post.meta, 'organizationName', getMetaValue(post.meta, 'provider', 'Various')),
        description: post.excerpt || post.content,
      };
    });
    
    return scholarships;
  } catch (error) {
    console.error('Error fetching scholarships:', error);
    return [];
  }
}

const getCachedScholarships = unstable_cache(
  getScholarshipsFromPosts,
  ['home-scholarships-posts'],
  { revalidate: 300, tags: ['scholarships-home'] }
);

function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
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

function getTypeColor(type: string): { bg: string; text: string; icon: string; gradient: string } {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('full') || lowerType === 'fully funded') {
    return { bg: 'bg-green-50', text: 'text-green-700', icon: '💰', gradient: 'from-green-500 to-emerald-500' };
  }
  if (lowerType.includes('partial')) {
    return { bg: 'bg-blue-50', text: 'text-blue-700', icon: '📖', gradient: 'from-blue-500 to-cyan-500' };
  }
  return { bg: 'bg-gray-50', text: 'text-gray-700', icon: '🎓', gradient: 'from-gray-500 to-gray-600' };
}

function getLocationColor(location: string): { bg: string; text: string; icon: string; flag: string } {
  const lowerLocation = location.toLowerCase();
  if (lowerLocation === 'pakistan') {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '🇵🇰', flag: '🇵🇰' };
  }
  if (lowerLocation === 'abroad') {
    return { bg: 'bg-purple-50', text: 'text-purple-700', icon: '✈️', flag: '🌍' };
  }
  return { bg: 'bg-gray-50', text: 'text-gray-700', icon: '🌍', flag: '🌍' };
}

function getLevelColor(level: string): { bg: string; text: string; icon: string; gradient: string } {
  const colors: Record<string, { bg: string; text: string; icon: string; gradient: string }> = {
    'Matric': { bg: 'bg-amber-50', text: 'text-amber-700', icon: '📚', gradient: 'from-amber-500 to-orange-500' },
    'Inter': { bg: 'bg-orange-50', text: 'text-orange-700', icon: '📖', gradient: 'from-orange-500 to-red-500' },
    'BS': { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: '🎓', gradient: 'from-indigo-500 to-purple-500' },
    'MS': { bg: 'bg-teal-50', text: 'text-teal-700', icon: '📘', gradient: 'from-teal-500 to-cyan-500' },
    'PhD': { bg: 'bg-rose-50', text: 'text-rose-700', icon: '🔬', gradient: 'from-rose-500 to-pink-500' },
  };
  return colors[level] || { bg: 'bg-gray-50', text: 'text-gray-700', icon: '📚', gradient: 'from-gray-500 to-gray-600' };
}

// Stats Card Component
function StatsCard({ title, value, icon, gradient, description }: { title: string; value: number; icon: string; gradient: string; description?: string }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg transform hover:scale-105 transition-transform duration-300`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl md:text-4xl font-bold">{value}</div>
          <div className="text-sm font-medium opacity-90 mt-1">{title}</div>
          {description && <div className="text-xs opacity-75 mt-1">{description}</div>}
        </div>
        <div className="text-4xl md:text-5xl opacity-80">{icon}</div>
      </div>
    </div>
  );
}

// Scholarship Card - More Attractive
function ScholarshipCard({ scholarship }: { scholarship: Scholarship }) {
  const typeColor = getTypeColor(scholarship.type);
  const levelColor = getLevelColor(scholarship.studyLevel);
  const locationColor = getLocationColor(scholarship.location);
  const daysLeft = getDaysLeft(scholarship.deadline);
  const isOpen = daysLeft !== null && daysLeft > 0;
  const isUrgent = daysLeft !== null && daysLeft <= 7;
  const isVeryUrgent = daysLeft !== null && daysLeft <= 3;
  
  const urgencyColor = isVeryUrgent ? 'from-red-500 to-red-600' : (isUrgent ? 'from-orange-500 to-orange-600' : 'from-teal-500 to-emerald-500');
  const urgencyText = isVeryUrgent ? '🔴 Very Urgent' : (isUrgent ? '🟠 Urgent' : 'Open');
  
  return (
    <Link href={`/scholarships/${scholarship.slug}`} className="block group">
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 h-full transform hover:-translate-y-1">
        {/* Top Gradient Bar with Animation */}
        <div className={`h-1.5 bg-gradient-to-r ${urgencyColor} ${isUrgent ? 'animate-pulse' : ''}`}></div>
        
        {/* Featured Badge */}
        {isUrgent && (
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
              {isVeryUrgent ? 'Closing Soon!' : 'Limited Seats!'}
            </div>
          </div>
        )}
        
        <div className="p-5">
          {/* Header with Icon */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${levelColor.gradient} flex items-center justify-center text-white text-xl shadow-md`}>
              {levelColor.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeColor.bg} ${typeColor.text}`}>
                  <span>{typeColor.icon}</span>
                  {scholarship.type}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${locationColor.bg} ${locationColor.text}`}>
                  {locationColor.flag} {scholarship.location}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2 mt-2">
                {scholarship.title}
              </h3>
            </div>
          </div>
          
          {/* Provider */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 pl-14">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>{scholarship.provider}</span>
          </div>
          
          {/* Study Level Badge */}
          <div className="mb-4 pl-14">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${levelColor.bg} ${levelColor.text} border border-current/20`}>
              <span className="text-base">{levelColor.icon}</span>
              <span>{scholarship.studyLevel} Level</span>
            </div>
          </div>
          
          {/* Deadline Counter */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500 font-medium">Application Deadline</div>
              <div className="text-sm font-bold text-gray-900">
                {formatDate(scholarship.deadline)}
              </div>
            </div>
            {daysLeft && (
              <div className={`text-center ${isUrgent ? 'bg-red-50' : 'bg-teal-50'} rounded-xl px-4 py-2 min-w-[80px]`}>
                <div className={`text-2xl font-bold ${isUrgent ? 'text-red-600' : 'text-teal-600'}`}>
                  {daysLeft}
                </div>
                <div className="text-[10px] text-gray-500">days left</div>
              </div>
            )}
          </div>
          
          {/* Action Button with Arrow */}
          <div className="mt-4 pt-1">
            <div className={`flex items-center justify-between text-sm font-semibold ${isUrgent ? 'text-red-600' : 'text-teal-600'} group-hover:gap-3 transition-all duration-300`}>
              <span>{isUrgent ? 'Apply Immediately →' : 'View Details →'}</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Main Component
export default async function ScholarshipsSection() {
  const scholarships = await getCachedScholarships();

  if (!scholarships.length) {
    return null;
  }

  const totalScholarships = scholarships.length;
  const openCount = scholarships.filter(s => {
    const days = getDaysLeft(s.deadline);
    return days !== null && days > 0;
  }).length;
  const urgentCount = scholarships.filter(s => {
    const days = getDaysLeft(s.deadline);
    return days !== null && days <= 7;
  }).length;
  const abroadCount = scholarships.filter(s => s.location.toLowerCase() === 'abroad').length;
  const fullyFundedCount = scholarships.filter(s => s.type.toLowerCase().includes('full')).length;

  return (
    <section className="py-12 bg-gradient-to-br from-teal-50/50 via-white to-emerald-50/30">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Section Header - More Attractive */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-full px-5 py-2 mb-4 shadow-sm">
            <span className="text-xl animate-pulse">🎓</span>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Funding Opportunities</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Latest{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
                Scholarships
              </span>
              <svg className="absolute bottom-0 left-0 w-full h-4 -z-0" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 25 10 50 5 Q 75 0 100 5" stroke="#14b8a6" strokeWidth="2" fill="none" />
              </svg>
            </span>
            {' '}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Discover fully funded, partial, and merit-based scholarships for Pakistani students
          </p>
        </div>
        
        {/* Stats Cards Row - More Attractive */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatsCard title="Total Scholarships" value={totalScholarships} icon="🎓" gradient="from-teal-500 to-teal-600" description="All opportunities" />
          <StatsCard title="Open Now" value={openCount} icon="✅" gradient="from-green-500 to-green-600" description="Apply today" />
          <StatsCard title="Urgent" value={urgentCount} icon="⚡" gradient="from-orange-500 to-red-500" description="Closing soon" />
          <StatsCard title="Fully Funded" value={fullyFundedCount} icon="💰" gradient="from-amber-500 to-amber-600" description="Full coverage" />
        </div>
        
        {/* Scholarships Grid - 2 columns for better visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scholarships.map((scholarship) => (
            <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
          ))}
        </div>
        
        {/* View All Link - More Attractive */}
        <div className="text-center mt-12">
          <Link
            href="/scholarships"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-base font-bold rounded-2xl hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl group"
          >
            <span>Explore All Scholarships</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            Explore 500+ scholarship opportunities for Pakistani students
          </p>
        </div>
        
      </div>
    </section>
  );
}