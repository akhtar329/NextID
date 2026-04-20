// app/component/sections/Home/SidebarWidgets.tsx
// ✅ Server Component - No "use client" imports

import Link from 'next/link';
import { db } from '@/app/lib/db';
import { 
  cities, 
  boards, 
  programs, 
  institutes, 
  categories,
  results,
  dateSheets,
  programOfferings,
  admissions
} from '@/app/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import NewsletterWidget from './NewsletterWidget'; // ✅ Import client component

// Types
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

// Server-side data fetching functions
async function getCitiesWithUniversityCount(): Promise<CityWithCount[]> {
  try {
    const citiesData = await db
      .select({
        id: cities.id,
        name: cities.name,
        slug: cities.slug,
        universityCount: sql<number>`count(${institutes.id})`,
      })
      .from(cities)
      .leftJoin(institutes, eq(cities.id, institutes.cityId))
      .where(eq(cities.status, true))
      .groupBy(cities.id, cities.name, cities.slug)
      .orderBy(desc(sql`count(${institutes.id})`))
      .limit(5);

    return citiesData.map(city => ({
      ...city,
      universityCount: Number(city.universityCount) || 0,
    }));
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}

async function getBoardsWithStats(): Promise<BoardWithStats[]> {
  try {
    const boardsData = await db
      .select({
        id: boards.id,
        name: boards.name,
        slug: boards.slug,
        resultCount: sql<number>`count(distinct ${results.id})`,
        dateSheetCount: sql<number>`count(distinct ${dateSheets.id})`,
      })
      .from(boards)
      .leftJoin(results, eq(boards.id, results.boardId))
      .leftJoin(dateSheets, eq(boards.id, dateSheets.boardId))
      .where(eq(boards.status, true))
      .groupBy(boards.id, boards.name, boards.slug)
      .orderBy(desc(sql`count(distinct ${results.id})`))
      .limit(5);

    return boardsData.map(board => ({
      ...board,
      resultCount: Number(board.resultCount) || 0,
      dateSheetCount: Number(board.dateSheetCount) || 0,
    }));
  } catch (error) {
    console.error('Error fetching boards:', error);
    return [];
  }
}

async function getTopPrograms(): Promise<ProgramWithCount[]> {
  try {
    const programsData = await db
      .select({
        id: programs.id,
        name: programs.name,
        slug: programs.slug,
        categoryName: categories.name,
        universityCount: sql<number>`count(distinct ${institutes.id})`,
      })
      .from(programs)
      .leftJoin(programOfferings, eq(programs.id, programOfferings.programId))
      .leftJoin(institutes, eq(programOfferings.instituteId, institutes.id))
      .leftJoin(categories, eq(programs.categoryId, categories.id))
      .where(eq(programs.status, true))
      .groupBy(programs.id, programs.name, programs.slug, categories.name)
      .orderBy(desc(sql`count(distinct ${institutes.id})`))
      .limit(5);

    return programsData.map(program => ({
      ...program,
      universityCount: Number(program.universityCount) || 0,
    }));
  } catch (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
}

async function getFeaturedUniversities(): Promise<UniversityWithCounts[]> {
  try {
    const universitiesData = await db
      .select({
        id: institutes.id,
        name: institutes.name,
        slug: institutes.slug,
        programCount: sql<number>`count(distinct ${programOfferings.id})`,
        admissionCount: sql<number>`count(distinct ${admissions.id})`,
      })
      .from(institutes)
      .leftJoin(programOfferings, eq(institutes.id, programOfferings.instituteId))
      .leftJoin(admissions, eq(institutes.id, admissions.instituteId))
      .where(eq(institutes.status, true))
      .groupBy(institutes.id, institutes.name, institutes.slug)
      .orderBy(desc(sql`count(distinct ${programOfferings.id})`))
      .limit(5);

    return universitiesData.map(uni => ({
      ...uni,
      programCount: Number(uni.programCount) || 0,
      admissionCount: Number(uni.admissionCount) || 0,
    }));
  } catch (error) {
    console.error('Error fetching universities:', error);
    return [];
  }
}

// Cities Widget Component
async function CitiesWidget() {
  const citiesData = await getCitiesWithUniversityCount();
  
  if (!citiesData.length) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="text-lg font-bold text-gray-900">🏙️ Popular Cities</h3>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Top {citiesData.length}</span>
      </div>
      
      <div className="space-y-2">
        {citiesData.map((city) => (
          <Link
            key={city.id}
            href={`/cities/${city.slug}`}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group transition-colors"
          >
            <span className="text-gray-700 group-hover:text-blue-600 font-medium">
              {city.name}
            </span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
              {city.universityCount} Universities
            </span>
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

// Boards Widget Component
async function BoardsWidget() {
  const boardsData = await getBoardsWithStats();
  
  if (!boardsData.length) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="text-lg font-bold text-gray-900">📋 Education Boards</h3>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
      </div>
      
      <div className="space-y-3">
        {boardsData.map((board) => (
          <Link
            key={board.id}
            href={`/boards/${board.slug}`}
            className="block p-2 rounded-lg hover:bg-gray-50 group transition-colors"
          >
            <div className="font-medium text-gray-800 group-hover:text-blue-600">
              {board.name}
            </div>
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

// Programs Widget Component
async function ProgramsWidget() {
  const programsData = await getTopPrograms();
  
  if (!programsData.length) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="text-lg font-bold text-gray-900">🎓 Top Programs</h3>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Most Offered</span>
      </div>
      
      <div className="space-y-2">
        {programsData.map((program) => (
          <Link
            key={program.id}
            href={`/programs/${program.slug}`}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group transition-colors"
          >
            <div>
              <div className="font-medium text-gray-800 group-hover:text-blue-600">
                {program.name}
              </div>
              {program.categoryName && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {program.categoryName}
                </div>
              )}
            </div>
            <span className="text-xs bg-blue-100 px-2 py-1 rounded-full text-blue-700">
              {program.universityCount} Universities
            </span>
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

// Universities Widget Component
async function UniversitiesWidget() {
  const universitiesData = await getFeaturedUniversities();
  
  if (!universitiesData.length) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="text-lg font-bold text-gray-900">🏛️ Featured Universities</h3>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Top Picks</span>
      </div>
      
      <div className="space-y-3">
        {universitiesData.map((uni) => (
          <Link
            key={uni.id}
            href={`/universities/${uni.slug}`}
            className="block p-2 rounded-lg hover:bg-gray-50 group transition-colors"
          >
            <div className="font-medium text-gray-800 group-hover:text-blue-600">
              {uni.name}
            </div>
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

// Main Component
export default async function SidebarWidgets() {
  // Fetch all data in parallel
  const [citiesData, boardsData, programsData, universitiesData] = await Promise.all([
    getCitiesWithUniversityCount(),
    getBoardsWithStats(),
    getTopPrograms(),
    getFeaturedUniversities(),
  ]);
  
  const hasAnyData = citiesData.length > 0 || boardsData.length > 0 || programsData.length > 0 || universitiesData.length > 0;
  
  if (!hasAnyData) return null;
  
  return (
    <div className="space-y-6">
      {citiesData.length > 0 && <CitiesWidget />}
      {boardsData.length > 0 && <BoardsWidget />}
      {programsData.length > 0 && <ProgramsWidget />}
      {universitiesData.length > 0 && <UniversitiesWidget />}
      <NewsletterWidget />
    </div>
  );
}