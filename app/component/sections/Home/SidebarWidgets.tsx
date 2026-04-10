// app/component/sections/Home/SidebarWidgets.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

// Types
interface City {
  id: number;
  name: string;
  slug: string;
  universityCount: number;
}

interface Board {
  id: number;
  name: string;
  slug: string;
  resultCount: number;
  dateSheetCount: number;
}

interface Program {
  id: number;
  name: string;
  slug: string;
  categoryName: string | null;
  universityCount: number;
}

interface FeaturedUniversity {
  id: number;
  name: string;
  slug: string;
  programCount: number;
  admissionCount: number;
}

export default function SidebarWidgets() {
  const [cities, setCities] = useState<City[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [universities, setUniversities] = useState<FeaturedUniversity[]>([]);
  
  // Loading states
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [email, setEmail] = useState('');

  // Track which widgets have data
  const [hasCities, setHasCities] = useState(false);
  const [hasBoards, setHasBoards] = useState(false);
  const [hasPrograms, setHasPrograms] = useState(false);
  const [hasUniversities, setHasUniversities] = useState(false);

  // Helper function to safely extract data from API response
  const extractData = (response: any) => {
    if (response.success) {
      return response.data || response.programs || response.cities || response.boards || response.institutes || [];
    }
    if (Array.isArray(response)) {
      return response;
    }
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  };

  // Fetch all data
  useEffect(() => {
    // Cities with university counts
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const res = await fetch('/api/public/cities?limit=5&withUniversityCount=true');
        const data = await res.json();
        const citiesData = extractData(data);
        setCities(citiesData.slice(0, 5));
        setHasCities(citiesData.length > 0);
      } catch (error) {
        console.error('Error fetching cities:', error);
        setCities([]);
        setHasCities(false);
      } finally {
        setLoadingCities(false);
      }
    };

    // Boards with result counts
    const fetchBoards = async () => {
      try {
        setLoadingBoards(true);
        const res = await fetch('/api/public/boards?limit=5&withStats=true');
        const data = await res.json();
        const boardsData = extractData(data);
        setBoards(boardsData.slice(0, 5));
        setHasBoards(boardsData.length > 0);
      } catch (error) {
        console.error('Error fetching boards:', error);
        setBoards([]);
        setHasBoards(false);
      } finally {
        setLoadingBoards(false);
      }
    };

    // Programs with university counts
    const fetchPrograms = async () => {
      try {
        setLoadingPrograms(true);
        const res = await fetch('/api/public/programs?limit=5&withUniversityCount=true');
        const data = await res.json();
        const programsData = extractData(data);
        setPrograms(programsData.slice(0, 5));
        setHasPrograms(programsData.length > 0);
      } catch (error) {
        console.error('Error fetching programs:', error);
        setPrograms([]);
        setHasPrograms(false);
      } finally {
        setLoadingPrograms(false);
      }
    };

    // Universities with program counts
    const fetchUniversities = async () => {
      try {
        setLoadingUniversities(true);
        const res = await fetch('/api/public/institutes?limit=5&featured=true&withCounts=true');
        const data = await res.json();
        const universitiesData = extractData(data);
        setUniversities(universitiesData.slice(0, 5));
        setHasUniversities(universitiesData.length > 0);
      } catch (error) {
        console.error('Error fetching universities:', error);
        setUniversities([]);
        setHasUniversities(false);
      } finally {
        setLoadingUniversities(false);
      }
    };

    fetchCities();
    fetchBoards();
    fetchPrograms();
    fetchUniversities();
  }, []);

  // ✅ Check if any widget has data
  const hasAnyData = hasCities || hasBoards || hasPrograms || hasUniversities;

  // Agar koi data nahi hai to kuch nahi dikhao
  if (!hasAnyData && 
      !loadingCities && !loadingBoards && !loadingPrograms && !loadingUniversities) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* 1. Cities Widget */}
      {(hasCities || loadingCities) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h3 className="text-xl font-bold text-gray-900">Popular Cities</h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Top 5</span>
          </div>
          
          {loadingCities ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="animate-pulse flex justify-between p-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : cities.length > 0 ? (
            <div className="space-y-2">
              {cities.map((city) => (
                <Link
                  key={city.id}
                  href={`/cities/${city.slug}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 group transition-colors"
                >
                  <span className="font-medium text-gray-800 group-hover:text-blue-600">
                    {city.name}
                  </span>
                  <span className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                    {city.universityCount} {city.universityCount === 1 ? 'University' : 'Universities'}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
          
          {hasCities && cities.length > 0 && (
            <div className="mt-4 pt-3 border-t text-center">
              <Link href="/cities" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View All Cities →
              </Link>
            </div>
          )}
        </div>
      )}
      
      {/* 2. Boards Widget */}
      {(hasBoards || loadingBoards) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h3 className="text-xl font-bold text-gray-900">Education Boards</h3>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
          </div>
          
          {loadingBoards ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="animate-pulse p-3">
                  <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              ))}
            </div>
          ) : boards.length > 0 ? (
            <div className="space-y-2">
              {boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.slug}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 group transition-colors"
                >
                  <div className="font-medium text-gray-800 group-hover:text-blue-600">
                    {board.name}
                  </div>
                  <div className="flex items-center gap-3 text-xs mt-2">
                    <span className="bg-blue-50 px-2 py-1 rounded-full text-blue-700">
                      📊 {board.resultCount} {board.resultCount === 1 ? 'Result' : 'Results'}
                    </span>
                    <span className="bg-orange-50 px-2 py-1 rounded-full text-orange-700">
                      📅 {board.dateSheetCount} {board.dateSheetCount === 1 ? 'Date Sheet' : 'Date Sheets'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
          
          {hasBoards && boards.length > 0 && (
            <div className="mt-4 pt-3 border-t text-center">
              <Link href="/boards" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View All Boards →
              </Link>
            </div>
          )}
        </div>
      )}
      
      {/* 3. Programs Widget */}
      {(hasPrograms || loadingPrograms) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h3 className="text-xl font-bold text-gray-900">Top Programs</h3>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Most Offered</span>
          </div>
          
          {loadingPrograms ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="animate-pulse p-3">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : programs.length > 0 ? (
            <div className="space-y-2">
              {programs.map((program) => (
                <Link
                  key={program.id}
                  href={`/programs/${program.slug}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 group transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-800 group-hover:text-blue-600">
                      {program.name}
                    </div>
                    {program.categoryName && (
                      <div className="text-xs text-gray-500 mt-1">
                        {program.categoryName}
                      </div>
                    )}
                  </div>
                  <span className="text-sm bg-blue-100 px-3 py-1 rounded-full text-blue-700">
                    🏛️ {program.universityCount} {program.universityCount === 1 ? 'Uni' : 'Unis'}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
          
          {hasPrograms && programs.length > 0 && (
            <div className="mt-4 pt-3 border-t text-center">
              <Link href="/programs" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View All Programs →
              </Link>
            </div>
          )}
        </div>
      )}
      
      {/* 4. Universities Widget */}
      {(hasUniversities || loadingUniversities) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h3 className="text-xl font-bold text-gray-900">Featured Universities</h3>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Top Picks</span>
          </div>
          
          {loadingUniversities ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="animate-pulse p-3">
                  <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              ))}
            </div>
          ) : universities.length > 0 ? (
            <div className="space-y-2">
              {universities.map((uni) => (
                <Link
                  key={uni.id}
                  href={`/universities/${uni.slug}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 group transition-colors"
                >
                  <div className="font-medium text-gray-800 group-hover:text-blue-600">
                    {uni.name}
                  </div>
                  <div className="flex items-center gap-3 text-xs mt-2">
                    <span className="bg-purple-50 px-2 py-1 rounded-full text-purple-700">
                      📚 {uni.programCount} {uni.programCount === 1 ? 'Program' : 'Programs'}
                    </span>
                    <span className="bg-green-50 px-2 py-1 rounded-full text-green-700">
                      🎯 {uni.admissionCount} {uni.admissionCount === 1 ? 'Admission' : 'Admissions'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
          
          {hasUniversities && universities.length > 0 && (
            <div className="mt-4 pt-3 border-t text-center">
              <Link href="/universities" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View All Universities →
              </Link>
            </div>
          )}
        </div>
      )}
      
      {/* 5. Newsletter - Always show */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-3">Stay Updated</h3>
        <p className="text-blue-100 text-sm mb-4">
          Get admission alerts, results, and educational news
        </p>
        <form onSubmit={(e) => { e.preventDefault(); toast.success('Subscribed!'); setEmail(''); }} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            required
          />
          <button 
            type="submit"
            className="w-full bg-white text-blue-600 font-semibold py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Subscribe Now
          </button>
        </form>
        <p className="text-xs text-blue-200 mt-3 text-center">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}