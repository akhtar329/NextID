// components/sections/Home/SidebarWidgets.tsx

import Link from 'next/link';
import { postService } from '@/services/post/post.service';
import { unstable_cache } from 'next/cache';
import NewsletterWidget from './NewsletterWidget';

// ==================== TYPES ====================
interface CityWithCount {
  id: number;
  name: string;
  slug: string;
  universityCount: number;
}

interface BoardWithStats {
  id: number;
  name: string;
  slug: string;
  resultCount: number;
  dateSheetCount: number;
}

interface ProgramWithCount {
  id: number;
  name: string;
  slug: string;
  categoryName: string | null;
  universityCount: number;
}

interface UniversityWithCounts {
  id: number;
  name: string;
  slug: string;
  programCount: number;
  admissionCount: number;
}

// ==================== HELPER ====================
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined ? value : defaultValue;
}

// ==================== CITIES DATA (from admission posts) ====================
async function getCitiesData(): Promise<CityWithCount[]> {
  try {
    const admissions = await postService.getPostsByType('admission', 100);
    
    const cityMap = new Map<string, { name: string; slug: string; count: number }>();
    
    for (const admission of admissions) {
      const cityName = getMetaValue(admission.meta, 'cityName', '');
      const citySlug = getMetaValue(admission.meta, 'citySlug', '');
      
      if (cityName && citySlug) {
        if (!cityMap.has(citySlug)) {
          cityMap.set(citySlug, { name: cityName, slug: citySlug, count: 0 });
        }
        cityMap.get(citySlug)!.count++;
      }
    }
    
    return Array.from(cityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((city, index) => ({
        id: index + 1,
        name: city.name,
        slug: city.slug,
        universityCount: city.count,
      }));
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}

// ==================== BOARDS DATA (from result and date_sheet posts) ====================
async function getBoardsData(): Promise<BoardWithStats[]> {
  try {
    const [results, dateSheets] = await Promise.all([
      postService.getPostsByType('result', 100),
      postService.getPostsByType('date_sheet', 100),
    ]);
    
    const boardMap = new Map<string, { name: string; slug: string; resultCount: number; dateSheetCount: number }>();
    
    for (const result of results) {
      const boardName = getMetaValue(result.meta, 'boardName', '');
      const boardSlug = getMetaValue(result.meta, 'boardSlug', '');
      
      if (boardName && boardSlug) {
        if (!boardMap.has(boardSlug)) {
          boardMap.set(boardSlug, { name: boardName, slug: boardSlug, resultCount: 0, dateSheetCount: 0 });
        }
        boardMap.get(boardSlug)!.resultCount++;
      }
    }
    
    for (const ds of dateSheets) {
      const boardName = getMetaValue(ds.meta, 'boardName', '');
      const boardSlug = getMetaValue(ds.meta, 'boardSlug', '');
      
      if (boardName && boardSlug) {
        if (!boardMap.has(boardSlug)) {
          boardMap.set(boardSlug, { name: boardName, slug: boardSlug, resultCount: 0, dateSheetCount: 0 });
        }
        boardMap.get(boardSlug)!.dateSheetCount++;
      }
    }
    
    return Array.from(boardMap.values())
      .sort((a, b) => b.resultCount - a.resultCount)
      .slice(0, 5)
      .map((board, index) => ({
        id: index + 1,
        name: board.name,
        slug: board.slug,
        resultCount: board.resultCount,
        dateSheetCount: board.dateSheetCount,
      }));
  } catch (error) {
    console.error('Error fetching boards:', error);
    return [];
  }
}

// ==================== PROGRAMS DATA (from admission posts) ====================
async function getProgramsData(): Promise<ProgramWithCount[]> {
  try {
    const admissions = await postService.getPostsByType('admission', 100);
    
    const programMap = new Map<string, { name: string; slug: string; categoryName: string | null; count: number }>();
    
    for (const admission of admissions) {
      const programs = getMetaValue(admission.meta, 'programs', []) as Array<{ name: string; slug: string; degreeName?: string }>;
      
      for (const prog of programs) {
        if (prog.name && prog.slug) {
          if (!programMap.has(prog.slug)) {
            programMap.set(prog.slug, {
              name: prog.name,
              slug: prog.slug,
              categoryName: prog.degreeName || null,
              count: 0,
            });
          }
          programMap.get(prog.slug)!.count++;
        }
      }
    }
    
    return Array.from(programMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((program, index) => ({
        id: index + 1,
        name: program.name,
        slug: program.slug,
        categoryName: program.categoryName,
        universityCount: program.count,
      }));
  } catch (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
}

// ==================== UNIVERSITIES DATA (from admission posts) ====================
async function getUniversitiesData(): Promise<UniversityWithCounts[]> {
  try {
    const admissions = await postService.getPostsByType('admission', 100);
    
    const uniMap = new Map<string, { name: string; slug: string; programCount: number; admissionCount: number }>();
    
    for (const admission of admissions) {
      const instituteName = getMetaValue(admission.meta, 'instituteName', '');
      const instituteSlug = getMetaValue(admission.meta, 'instituteSlug', '');
      const programs = getMetaValue(admission.meta, 'programs', []) as Array<{ name: string }>;
      
      if (instituteName && instituteSlug) {
        if (!uniMap.has(instituteSlug)) {
          uniMap.set(instituteSlug, {
            name: instituteName,
            slug: instituteSlug,
            programCount: 0,
            admissionCount: 0,
          });
        }
        uniMap.get(instituteSlug)!.admissionCount++;
        uniMap.get(instituteSlug)!.programCount += programs.length;
      }
    }
    
    return Array.from(uniMap.values())
      .sort((a, b) => b.programCount - a.programCount)
      .slice(0, 5)
      .map((uni, index) => ({
        id: index + 1,
        name: uni.name,
        slug: uni.slug,
        programCount: uni.programCount,
        admissionCount: uni.admissionCount,
      }));
  } catch (error) {
    console.error('Error fetching universities:', error);
    return [];
  }
}

// ==================== CACHED VERSIONS ====================
const getCachedCities = unstable_cache(
  getCitiesData,
  ['sidebar-cities'],
  { revalidate: 86400, tags: ['sidebar-cities'] }
);

const getCachedBoards = unstable_cache(
  getBoardsData,
  ['sidebar-boards'],
  { revalidate: 86400, tags: ['sidebar-boards'] }
);

const getCachedPrograms = unstable_cache(
  getProgramsData,
  ['sidebar-programs'],
  { revalidate: 86400, tags: ['sidebar-programs'] }
);

const getCachedUniversities = unstable_cache(
  getUniversitiesData,
  ['sidebar-universities'],
  { revalidate: 86400, tags: ['sidebar-universities'] }
);

// ==================== WIDGET COMPONENTS ====================

async function CitiesWidget() {
  const cities = await getCachedCities();
  if (!cities.length) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="text-lg font-bold text-gray-900">🏙️ Popular Cities</h3>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Top {cities.length}</span>
      </div>
      <div className="space-y-2">
        {cities.map((city) => (
          <Link key={city.id} href={`/cities/${city.slug}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group">
            <span className="text-gray-700 group-hover:text-blue-600 font-medium">{city.name}</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{city.universityCount} Universities</span>
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t text-center">
        <Link href="/cities" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
          View All Cities <span>→</span>
        </Link>
      </div>
    </div>
  );
}

async function BoardsWidget() {
  const boards = await getCachedBoards();
  if (!boards.length) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="text-lg font-bold text-gray-900">📋 Education Boards</h3>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
      </div>
      <div className="space-y-3">
        {boards.map((board) => (
          <Link key={board.id} href={`/boards/${board.slug}`} className="block p-2 rounded-lg hover:bg-gray-50 group">
            <div className="font-medium text-gray-800 group-hover:text-blue-600">{board.name}</div>
            <div className="flex items-center gap-3 text-xs mt-1">
              <span className="text-blue-600">📊 {board.resultCount} Results</span>
              <span className="text-orange-600">📅 {board.dateSheetCount} Date Sheets</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t text-center">
        <Link href="/boards" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
          View All Boards <span>→</span>
        </Link>
      </div>
    </div>
  );
}

async function ProgramsWidget() {
  const programs = await getCachedPrograms();
  if (!programs.length) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="text-lg font-bold text-gray-900">🎓 Top Programs</h3>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Most Offered</span>
      </div>
      <div className="space-y-2">
        {programs.map((program) => (
          <Link key={program.id} href={`/programs/${program.slug}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group">
            <div>
              <div className="font-medium text-gray-800 group-hover:text-blue-600">{program.name}</div>
              {program.categoryName && <div className="text-xs text-gray-500">{program.categoryName}</div>}
            </div>
            <span className="text-xs bg-blue-100 px-2 py-1 rounded-full">{program.universityCount} Universities</span>
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t text-center">
        <Link href="/programs" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
          View All Programs <span>→</span>
        </Link>
      </div>
    </div>
  );
}

async function UniversitiesWidget() {
  const universities = await getCachedUniversities();
  if (!universities.length) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="text-lg font-bold text-gray-900">🏛️ Featured Universities</h3>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Top Picks</span>
      </div>
      <div className="space-y-3">
        {universities.map((uni) => (
          <Link key={uni.id} href={`/universities/${uni.slug}`} className="block p-2 rounded-lg hover:bg-gray-50 group">
            <div className="font-medium text-gray-800 group-hover:text-blue-600">{uni.name}</div>
            <div className="flex items-center gap-3 text-xs mt-1">
              <span className="text-purple-600">📚 {uni.programCount} Programs</span>
              <span className="text-green-600">🎯 {uni.admissionCount} Admissions</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t text-center">
        <Link href="/universities" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
          View All Universities <span>→</span>
        </Link>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default async function SidebarWidgets() {
  const [cities, boards, programs, universities] = await Promise.all([
    getCachedCities(),
    getCachedBoards(),
    getCachedPrograms(),
    getCachedUniversities(),
  ]);
  
  const hasData = cities.length > 0 || boards.length > 0 || programs.length > 0 || universities.length > 0;
  if (!hasData) return null;
  
  return (
    <div className="space-y-6">
      {cities.length > 0 && <CitiesWidget />}
      {boards.length > 0 && <BoardsWidget />}
      {programs.length > 0 && <ProgramsWidget />}
      {universities.length > 0 && <UniversitiesWidget />}
      <NewsletterWidget />
    </div>
  );
}