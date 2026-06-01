// components/sections/Home/DatesheetSection.tsx

import Link from 'next/link';
import { postService } from '@/services/post/post.service';
import type { Post } from '@/repositories/post/post.repository';
import { unstable_cache } from 'next/cache';

// Types
interface DateSheet {
  id: number;
  title: string;
  slug: string;
  examType: string;
  examDate: Date | null;
  year: number;
  boardName: string | null;
  boardSlug: string | null;
  instituteName: string | null;
  instituteSlug: string | null;
  description: string | null;
  downloadLink: string | null;
  officialLink: string | null;
  isPopular: boolean;
  viewCount: number;
}

// Helper
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined ? value : defaultValue;
}

// Get date sheets
async function getDateSheetsFromPosts(): Promise<DateSheet[]> {
  try {
    const posts = await postService.getPostsByType('date_sheet', 5);
    
    const dateSheets: DateSheet[] = posts.map((post: Post) => {
      const examDate = getMetaValue(post.meta, 'examDate', null) 
        ? new Date(getMetaValue(post.meta, 'examDate', '')) 
        : null;
      
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        examType: getMetaValue(post.meta, 'examType', 'Annual'),
        examDate: examDate,
        year: getMetaValue(post.meta, 'year', new Date().getFullYear()),
        boardName: getMetaValue(post.meta, 'boardName', null),
        boardSlug: getMetaValue(post.meta, 'boardSlug', null),
        instituteName: getMetaValue(post.meta, 'instituteName', null),
        instituteSlug: getMetaValue(post.meta, 'instituteSlug', null),
        description: post.excerpt || post.content,
        downloadLink: getMetaValue(post.meta, 'downloadLink', null),
        officialLink: getMetaValue(post.meta, 'officialLink', null),
        isPopular: post.isPopular || false,
        viewCount: post.viewCount || 0,
      };
    });
    
    return dateSheets.sort((a, b) => {
      if (!a.examDate && !b.examDate) return 0;
      if (!a.examDate) return 1;
      if (!b.examDate) return -1;
      return a.examDate.getTime() - b.examDate.getTime();
    });
    
  } catch (error) {
    console.error('Error fetching date sheets:', error);
    return [];
  }
}

const getCachedDateSheets = unstable_cache(
  getDateSheetsFromPosts,
  ['home-datesheets-posts'],
  { revalidate: 300, tags: ['datesheets-home'] }
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
    const examDate = new Date(date);
    const now = new Date();
    examDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : (diffDays === 0 ? 0 : null);
  } catch {
    return null;
  }
}

function getUrgentLevel(daysLeft: number | null): { level: string; color: string; bg: string } {
  if (daysLeft === null) return { level: 'TBA', color: 'text-gray-500', bg: 'bg-gray-100' };
  if (daysLeft === 0) return { level: 'Today', color: 'text-red-600', bg: 'bg-red-100' };
  if (daysLeft <= 3) return { level: 'Urgent', color: 'text-orange-600', bg: 'bg-orange-100' };
  if (daysLeft <= 7) return { level: 'Soon', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  return { level: 'Upcoming', color: 'text-green-600', bg: 'bg-green-100' };
}

// Date Sheet Card
function DateSheetCard({ sheet }: { sheet: DateSheet }) {
  const daysLeft = getDaysLeft(sheet.examDate);
  const urgent = getUrgentLevel(daysLeft);
  const institutionName = sheet.boardName || sheet.instituteName || 'Education Board';
  
  return (
    <Link href={`/date-sheets/${sheet.slug}`} className="block group">
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
        {/* Left Accent Bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${urgent.bg}`}></div>
        
        <div className="p-5 pl-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Left - Date & Day */}
            <div className="flex items-center gap-4 md:w-32 shrink-0">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800">
                  {sheet.examDate ? new Date(sheet.examDate).getDate() : '--'}
                </div>
                <div className="text-xs text-gray-500 uppercase">
                  {sheet.examDate ? new Date(sheet.examDate).toLocaleDateString('en-PK', { month: 'short' }) : 'TBA'}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${urgent.bg} ${urgent.color}`}>
                {urgent.level}
              </div>
            </div>
            
            {/* Middle - Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {sheet.boardName ? (
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Board</span>
                ) : (
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">University</span>
                )}
                {sheet.isPopular && (
                  <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">⭐ Popular</span>
                )}
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                {institutionName}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                {sheet.title}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                <span>📅 {sheet.year}</span>
                <span>📚 {sheet.examType}</span>
                {sheet.examDate && <span>🗓️ {formatDate(sheet.examDate)}</span>}
              </div>
            </div>
            
            {/* Right - Visit Button */}
            <div className="md:w-auto shrink-0">
              <div className="flex items-center gap-1.5 text-purple-600 font-medium text-sm bg-purple-50 px-3 py-1.5 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-all">
                <span>Visit Date Sheet</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </Link>
  );
}

// Main Component
export default async function DateSheetSection() {
  const dateSheets = await getCachedDateSheets();

  if (!dateSheets.length) return null;

  const totalSheets = dateSheets.length;
  const urgentCount = dateSheets.filter(s => {
    const days = getDaysLeft(s.examDate);
    return days !== null && days <= 7;
  }).length;

  return (
    <section className="py-10 bg-gradient-to-br from-amber-50 via-white to-orange-50/30">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-orange-100 rounded-2xl px-4 py-2 mb-3">
            <span className="text-xl">📋</span>
            <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Exam Schedules 2026</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Date Sheets for{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                Upcoming Exams
              </span>
              <svg className="absolute bottom-0 left-0 w-full h-3 -z-0" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 25 10 50 5 Q 75 0 100 5" stroke="#f97316" strokeWidth="2" fill="none" />
              </svg>
            </span>
          </h2>
          <p className="text-sm text-gray-500">
            {totalSheets} date sheets available • {urgentCount} exams in next 7 days
          </p>
        </div>
        
        {/* Timeline Style List */}
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-orange-200 hidden md:block"></div>
          
          <div className="space-y-4">
            {dateSheets.map((sheet) => (
              <div key={sheet.id} className="relative">
                <div className="absolute left-5 top-6 w-3 h-3 bg-orange-400 rounded-full border-2 border-white hidden md:block"></div>
                <DateSheetCard sheet={sheet} />
              </div>
            ))}
          </div>
        </div>
        
        {/* View All Link */}
        <div className="text-center mt-8">
          <Link
            href="/date-sheets"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg group"
          >
            <span>View All Date Sheets</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
        
      </div>
    </section>
  );
}