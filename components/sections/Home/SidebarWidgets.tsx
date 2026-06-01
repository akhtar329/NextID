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
  return value !== undefined && value !== null ? value : defaultValue;
}

// ==================== FALLBACK DATA (for testing/development) ====================
const FALLBACK_CITIES: CityWithCount[] = [
  { id: 1, name: "Karachi", slug: "karachi", universityCount: 45 },
  { id: 2, name: "Lahore", slug: "lahore", universityCount: 38 },
  { id: 3, name: "Islamabad", slug: "islamabad", universityCount: 32 },
  { id: 4, name: "Rawalpindi", slug: "rawalpindi", universityCount: 28 },
  { id: 5, name: "Multan", slug: "multan", universityCount: 21 },
];

const FALLBACK_BOARDS: BoardWithStats[] = [
  { id: 1, name: "BISE Lahore", slug: "bise-lahore", resultCount: 24, dateSheetCount: 12 },
  { id: 2, name: "BISE Karachi", slug: "bise-karachi", resultCount: 22, dateSheetCount: 11 },
  { id: 3, name: "FBISE Islamabad", slug: "fbise-islamabad", resultCount: 20, dateSheetCount: 10 },
  { id: 4, name: "BISE Rawalpindi", slug: "bise-rawalpindi", resultCount: 18, dateSheetCount: 9 },
  { id: 5, name: "BISE Multan", slug: "bise-multan", resultCount: 16, dateSheetCount: 8 },
];

const FALLBACK_PROGRAMS: ProgramWithCount[] = [
  { id: 1, name: "Computer Science", slug: "computer-science", categoryName: "Engineering", universityCount: 52 },
  { id: 2, name: "Business Administration", slug: "business-administration", categoryName: "Business", universityCount: 48 },
  { id: 3, name: "Electrical Engineering", slug: "electrical-engineering", categoryName: "Engineering", universityCount: 35 },
  { id: 4, name: "Medicine (MBBS)", slug: "mbbs", categoryName: "Medical", universityCount: 28 },
  { id: 5, name: "Economics", slug: "economics", categoryName: "Social Sciences", universityCount: 24 },
];

const FALLBACK_UNIVERSITIES: UniversityWithCounts[] = [
  { id: 1, name: "University of Karachi", slug: "university-of-karachi", programCount: 45, admissionCount: 12 },
  { id: 2, name: "Punjab University", slug: "punjab-university", programCount: 42, admissionCount: 10 },
  { id: 3, name: "NUST Islamabad", slug: "nust-islamabad", programCount: 38, admissionCount: 9 },
  { id: 4, name: "LUMS Lahore", slug: "lums-lahore", programCount: 35, admissionCount: 8 },
  { id: 5, name: "COMSATS University", slug: "comsats", programCount: 32, admissionCount: 7 },
];

// ==================== CITIES DATA (from post table) ====================
async function getCitiesData(): Promise<CityWithCount[]> {
  try {
    console.log('📊 Fetching admission posts for cities...');
    const admissions = await postService.getPostsByType('admission', 200);
    
    console.log(`📊 Found ${admissions.length} admission posts`);
    
    if (!admissions || admissions.length === 0) {
      console.log('⚠️ No admission posts found, using fallback data');
      return FALLBACK_CITIES;
    }
    
    const cityMap = new Map<string, { name: string; slug: string; count: number }>();
    
    for (const admission of admissions) {
      // Try multiple possible field names in meta
      const cityName = getMetaValue(admission.meta, 'cityName', '') as string || 
                       getMetaValue(admission.meta, 'city', '') as string ||
                       getMetaValue(admission.meta, 'location', '') as string;
      
      const citySlug = getMetaValue(admission.meta, 'citySlug', '') as string ||
                       getMetaValue(admission.meta, 'city_slug', '') as string ||
                       (typeof cityName === 'string' ? cityName.toLowerCase().replace(/\s+/g, '-') : '');
      
      if (cityName && typeof cityName === 'string' && cityName.trim()) {
        const slug = typeof citySlug === 'string' && citySlug ? citySlug : cityName.toLowerCase().replace(/\s+/g, '-');
        if (!cityMap.has(slug)) {
          cityMap.set(slug, { name: cityName, slug: slug, count: 0 });
        }
        cityMap.get(slug)!.count++;
      }
    }
    
    const cities = Array.from(cityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    
    console.log(`📊 Processed ${cities.length} unique cities`);
    
    return cities.length > 0 ? cities.map((city, index) => ({
      id: index + 1,
      name: city.name,
      slug: city.slug,
      universityCount: city.count,
    })) : FALLBACK_CITIES;
    
  } catch (error) {
    console.error('❌ Error fetching cities:', error);
    return FALLBACK_CITIES;
  }
}

// ==================== BOARDS DATA (from result and date_sheet posts) ====================
async function getBoardsData(): Promise<BoardWithStats[]> {
  try {
    const [results, dateSheets] = await Promise.all([
      postService.getPostsByType('result', 200),
      postService.getPostsByType('date_sheet', 200),
    ]);
    
    console.log(`📊 Found ${results.length} result posts and ${dateSheets.length} date sheet posts`);
    
    const boardMap = new Map<string, { name: string; slug: string; resultCount: number; dateSheetCount: number }>();
    
    for (const result of results) {
      const boardName = getMetaValue(result.meta, 'boardName', '') as string ||
                        getMetaValue(result.meta, 'board', '') as string ||
                        getMetaValue(result.meta, 'exam_board', '') as string;
      
      const boardSlug = getMetaValue(result.meta, 'boardSlug', '') as string ||
                        getMetaValue(result.meta, 'board_slug', '') as string ||
                        (typeof boardName === 'string' ? boardName.toLowerCase().replace(/\s+/g, '-') : '');
      
      if (boardName && typeof boardName === 'string' && boardName.trim()) {
        const slug = typeof boardSlug === 'string' && boardSlug ? boardSlug : boardName.toLowerCase().replace(/\s+/g, '-');
        if (!boardMap.has(slug)) {
          boardMap.set(slug, { name: boardName, slug: slug, resultCount: 0, dateSheetCount: 0 });
        }
        boardMap.get(slug)!.resultCount++;
      }
    }
    
    for (const ds of dateSheets) {
      const boardName = getMetaValue(ds.meta, 'boardName', '') as string ||
                        getMetaValue(ds.meta, 'board', '') as string ||
                        getMetaValue(ds.meta, 'exam_board', '') as string;
      
      const boardSlug = getMetaValue(ds.meta, 'boardSlug', '') as string ||
                        getMetaValue(ds.meta, 'board_slug', '') as string ||
                        (typeof boardName === 'string' ? boardName.toLowerCase().replace(/\s+/g, '-') : '');
      
      if (boardName && typeof boardName === 'string' && boardName.trim()) {
        const slug = typeof boardSlug === 'string' && boardSlug ? boardSlug : boardName.toLowerCase().replace(/\s+/g, '-');
        if (!boardMap.has(slug)) {
          boardMap.set(slug, { name: boardName, slug: slug, resultCount: 0, dateSheetCount: 0 });
        }
        boardMap.get(slug)!.dateSheetCount++;
      }
    }
    
    const boards = Array.from(boardMap.values())
      .sort((a, b) => (b.resultCount + b.dateSheetCount) - (a.resultCount + a.dateSheetCount))
      .slice(0, 6);
    
    console.log(`📊 Processed ${boards.length} unique boards`);
    
    return boards.length > 0 ? boards.map((board, index) => ({
      id: index + 1,
      name: board.name,
      slug: board.slug,
      resultCount: board.resultCount,
      dateSheetCount: board.dateSheetCount,
    })) : FALLBACK_BOARDS;
    
  } catch (error) {
    console.error('❌ Error fetching boards:', error);
    return FALLBACK_BOARDS;
  }
}

// ==================== PROGRAMS DATA (from admission posts) ====================
async function getProgramsData(): Promise<ProgramWithCount[]> {
  try {
    const admissions = await postService.getPostsByType('admission', 200);
    
    const programMap = new Map<string, { name: string; slug: string; categoryName: string | null; count: number }>();
    
    for (const admission of admissions) {
      const programs = getMetaValue(admission.meta, 'programs', []) as Array<{ name: string; slug: string; degreeName?: string }>;
      
      if (programs && programs.length > 0) {
        for (const prog of programs) {
          if (prog.name && typeof prog.name === 'string' && prog.name.trim()) {
            const slug = prog.slug || prog.name.toLowerCase().replace(/\s+/g, '-');
            if (!programMap.has(slug)) {
              programMap.set(slug, {
                name: prog.name,
                slug: slug,
                categoryName: prog.degreeName || null,
                count: 0,
              });
            }
            programMap.get(slug)!.count++;
          }
        }
      } else {
        // Fallback: try to get program from direct fields
        const programName = getMetaValue(admission.meta, 'programName', '') as string ||
                           getMetaValue(admission.meta, 'program', '') as string;
        if (programName && typeof programName === 'string' && programName.trim()) {
          const slug = getMetaValue(admission.meta, 'programSlug', '') as string || 
                      programName.toLowerCase().replace(/\s+/g, '-');
          if (!programMap.has(slug)) {
            programMap.set(slug, {
              name: programName,
              slug: slug,
              categoryName: getMetaValue(admission.meta, 'degreeName', null) as string | null,
              count: 0,
            });
          }
          programMap.get(slug)!.count++;
        }
      }
    }
    
    const programs = Array.from(programMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    
    console.log(`📊 Processed ${programs.length} unique programs`);
    
    return programs.length > 0 ? programs.map((program, index) => ({
      id: index + 1,
      name: program.name,
      slug: program.slug,
      categoryName: program.categoryName,
      universityCount: program.count,
    })) : FALLBACK_PROGRAMS;
    
  } catch (error) {
    console.error('❌ Error fetching programs:', error);
    return FALLBACK_PROGRAMS;
  }
}

// ==================== UNIVERSITIES DATA (from admission posts) ====================
async function getUniversitiesData(): Promise<UniversityWithCounts[]> {
  try {
    const admissions = await postService.getPostsByType('admission', 200);
    
    const uniMap = new Map<string, { name: string; slug: string; programCount: number; admissionCount: number }>();
    
    for (const admission of admissions) {
      const instituteName = getMetaValue(admission.meta, 'instituteName', '') as string ||
                           getMetaValue(admission.meta, 'universityName', '') as string ||
                           getMetaValue(admission.meta, 'collegeName', '') as string ||
                           getMetaValue(admission.meta, 'institute', '') as string;
      
      const instituteSlug = getMetaValue(admission.meta, 'instituteSlug', '') as string ||
                           getMetaValue(admission.meta, 'universitySlug', '') as string ||
                           (typeof instituteName === 'string' ? instituteName.toLowerCase().replace(/\s+/g, '-') : '');
      
      const programs = getMetaValue(admission.meta, 'programs', []) as Array<{ name: string }>;
      
      if (instituteName && typeof instituteName === 'string' && instituteName.trim()) {
        const slug = typeof instituteSlug === 'string' && instituteSlug ? instituteSlug : instituteName.toLowerCase().replace(/\s+/g, '-');
        if (!uniMap.has(slug)) {
          uniMap.set(slug, {
            name: instituteName,
            slug: slug,
            programCount: 0,
            admissionCount: 0,
          });
        }
        uniMap.get(slug)!.admissionCount++;
        uniMap.get(slug)!.programCount += (programs && programs.length) || 1;
      }
    }
    
    const universities = Array.from(uniMap.values())
      .sort((a, b) => b.programCount - a.programCount)
      .slice(0, 6);
    
    console.log(`📊 Processed ${universities.length} unique universities`);
    
    return universities.length > 0 ? universities.map((uni, index) => ({
      id: index + 1,
      name: uni.name,
      slug: uni.slug,
      programCount: uni.programCount,
      admissionCount: uni.admissionCount,
    })) : FALLBACK_UNIVERSITIES;
    
  } catch (error) {
    console.error('❌ Error fetching universities:', error);
    return FALLBACK_UNIVERSITIES;
  }
}

// ==================== CACHED VERSIONS ====================
const getCachedCities = unstable_cache(
  getCitiesData,
  ['sidebar-cities'],
  { revalidate: 3600, tags: ['sidebar-cities'] }
);

const getCachedBoards = unstable_cache(
  getBoardsData,
  ['sidebar-boards'],
  { revalidate: 3600, tags: ['sidebar-boards'] }
);

const getCachedPrograms = unstable_cache(
  getProgramsData,
  ['sidebar-programs'],
  { revalidate: 3600, tags: ['sidebar-programs'] }
);

const getCachedUniversities = unstable_cache(
  getUniversitiesData,
  ['sidebar-universities'],
  { revalidate: 3600, tags: ['sidebar-universities'] }
);

// ==================== ENHANCED WIDGET COMPONENTS ====================

async function CitiesWidget() {
  const cities = await getCachedCities();
  if (!cities.length) return null;
  
  return (
    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl border border-blue-100 p-5 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-blue-100">
        <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          🏙️ Popular Cities
        </h3>
        <span className="text-xs bg-blue-500 text-white px-2.5 py-1 rounded-full shadow-sm">
          Top {cities.length}
        </span>
      </div>
      <div className="space-y-2">
        {cities.map((city, idx) => (
          <Link 
            key={city.id} 
            href={`/cities/${city.slug}`} 
            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-blue-50 group transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-400 w-5">{idx + 1}</span>
              <span className="text-gray-700 group-hover:text-blue-600 font-medium">{city.name}</span>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              {city.universityCount} Universities
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-blue-100 text-center">
        <Link href="/cities" className="text-sm text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 group">
          View All Cities 
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </div>
  );
}

async function BoardsWidget() {
  const boards = await getCachedBoards();
  if (!boards.length) return null;
  
  return (
    <div className="bg-gradient-to-br from-white to-green-50/30 rounded-xl border border-green-100 p-5 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-green-100">
        <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
          📋 Education Boards
        </h3>
        <span className="text-xs bg-green-500 text-white px-2.5 py-1 rounded-full shadow-sm">
          Active
        </span>
      </div>
      <div className="space-y-3">
        {boards.map((board, idx) => (
          <Link 
            key={board.id} 
            href={`/boards/${board.slug}`} 
            className="block p-2.5 rounded-lg hover:bg-green-50 group transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-green-400 w-5">{idx + 1}</span>
              <div className="font-semibold text-gray-800 group-hover:text-green-600">{board.name}</div>
            </div>
            <div className="flex items-center gap-3 text-xs mt-2 ml-7">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">📊 {board.resultCount} Results</span>
              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">📅 {board.dateSheetCount} Date Sheets</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-green-100 text-center">
        <Link href="/boards" className="text-sm text-green-600 hover:text-green-700 font-semibold inline-flex items-center gap-1 group">
          View All Boards 
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </div>
  );
}

async function ProgramsWidget() {
  const programs = await getCachedPrograms();
  if (!programs.length) return null;
  
  return (
    <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-xl border border-purple-100 p-5 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-purple-100">
        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
          🎓 Top Programs
        </h3>
        <span className="text-xs bg-purple-500 text-white px-2.5 py-1 rounded-full shadow-sm">
          Most Offered
        </span>
      </div>
      <div className="space-y-2">
        {programs.map((program, idx) => (
          <Link 
            key={program.id} 
            href={`/programs/${program.slug}`} 
            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-purple-50 group transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-400 w-5">{idx + 1}</span>
                <span className="font-medium text-gray-800 group-hover:text-purple-600">{program.name}</span>
              </div>
              {program.categoryName && (
                <div className="text-xs text-gray-500 ml-7">{program.categoryName}</div>
              )}
            </div>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
              {program.universityCount} Universities
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-purple-100 text-center">
        <Link href="/programs" className="text-sm text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-1 group">
          View All Programs 
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </div>
  );
}

async function UniversitiesWidget() {
  const universities = await getCachedUniversities();
  if (!universities.length) return null;
  
  return (
    <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-xl border border-amber-100 p-5 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-amber-100">
        <h3 className="text-lg font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
          🏛️ Featured Universities
        </h3>
        <span className="text-xs bg-amber-500 text-white px-2.5 py-1 rounded-full shadow-sm">
          Top Picks
        </span>
      </div>
      <div className="space-y-3">
        {universities.map((uni, idx) => (
          <Link 
            key={uni.id} 
            href={`/universities/${uni.slug}`} 
            className="block p-2.5 rounded-lg hover:bg-amber-50 group transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 w-5">{idx + 1}</span>
              <div className="font-semibold text-gray-800 group-hover:text-amber-600">{uni.name}</div>
            </div>
            <div className="flex items-center gap-3 text-xs mt-2 ml-7">
              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">📚 {uni.programCount} Programs</span>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🎯 {uni.admissionCount} Admissions</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-amber-100 text-center">
        <Link href="/universities" className="text-sm text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1 group">
          View All Universities 
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default async function SidebarWidgets() {
  // Simply render all widgets - each widget fetches its own data with caching
  return (
    <div className="space-y-6">
      <CitiesWidget />
      <BoardsWidget />
      <ProgramsWidget />
      <UniversitiesWidget />
      <NewsletterWidget />
    </div>
  );
}