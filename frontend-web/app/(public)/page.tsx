// app/(public)/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import HeroSection from '@/app/component/sections/Home/HeroSection';
import AdmissionSection from '@/app/component/sections/Home/AdmissionSection';
import ResultsSection from '@/app/component/sections/Home/ResultsSection';
import CoursesSection from '@/app/component/sections/Home/CoursesSection';
import UniversitiesSection from '@/app/component/sections/Home/UniversitiesSection';
//import ScholarshipsSection from '@/app/component/sections/Home/ScholarshipsSection';

// Types for API data
interface City {
  id: number;
  name: string;
  slug: string;
  universityCount: number;  // Kitni universities is city mein
}

interface Board {
  id: number;
  name: string;
  slug: string;
  resultCount: number;      // Kitne results is board ke
  dateSheetCount: number;   // Kitni date sheets is board ki
}

interface Program {
  id: number;
  name: string;
  slug: string;
  categoryName: string | null;
  universityCount: number;  // Kitni universities ye program offer karti hain
}

interface FeaturedUniversity {
  id: number;
  name: string;
  slug: string;
  programCount: number;     // Kitne programs is university mein
  admissionCount: number;   // Kitni admissions is university mein
}

export default function HomePage() {
  const [email, setEmail] = useState('');
  
  // State for sidebar data
  const [cities, setCities] = useState<City[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [universities, setUniversities] = useState<FeaturedUniversity[]>([]);
  
  // Loading states
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingUniversities, setLoadingUniversities] = useState(true);

  // Fetch all data
  useEffect(() => {
    // Cities with university counts
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const res = await fetch('/api/public/cities?limit=5&withUniversityCount=true');
        const data = await res.json();
        setCities(data.success ? data.data : (Array.isArray(data) ? data : []));
      } catch (error) {
        console.error('Error:', error);
        setCities([]);
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
        setBoards(data.success ? data.data : (Array.isArray(data) ? data : []));
      } catch (error) {
        console.error('Error:', error);
        setBoards([]);
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
        setPrograms(data.success ? data.data : (Array.isArray(data) ? data : []));
      } catch (error) {
        console.error('Error:', error);
        setPrograms([]);
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
        setUniversities(data.success ? data.data : (Array.isArray(data) ? data : []));
      } catch (error) {
        console.error('Error:', error);
        setUniversities([]);
      } finally {
        setLoadingUniversities(false);
      }
    };

    fetchCities();
    fetchBoards();
    fetchPrograms();
    fetchUniversities();
  }, []);

  return (
    <div className="min-h-screen">
      <HeroSection />
      
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content */}
          <main className="lg:w-8/12">
            <section className="mb-12"><AdmissionSection /></section>
            <section className="mb-12"><ResultsSection /></section>
            <section className="mb-12"><CoursesSection /></section>
            <section className="mb-12"><UniversitiesSection /></section>
         {/* Hide  <section className="mb-12"><ScholarshipsSection /></section>*/}  
          </main>
          
          {/* Sidebar */}
          <aside className="lg:w-4/12 space-y-8 lg:sticky lg:top-6">
            
            {/* 1. Cities Widget - University Counts */}
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
              ) : (
                <div className="space-y-2">
                  {cities.map((city) => (
                    <Link
                      key={city.id}
                      href={`/city/${city.slug}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 group"
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
              )}
              
              <div className="mt-4 pt-3 border-t text-center">
                <Link href="/cities" className="text-sm text-blue-600 hover:text-blue-800">
                  View All Cities →
                </Link>
              </div>
            </div>
            
            {/* 2. Boards Widget - Result Counts */}
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
              ) : (
                <div className="space-y-2">
                  {boards.map((board) => (
                    <Link
                      key={board.id}
                      href={`/boards/${board.slug}`}
                      className="block p-3 rounded-lg hover:bg-gray-50 group"
                    >
                      <div className="font-medium text-gray-800 group-hover:text-blue-600">
                        {board.name}
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-2">
                        <span className="bg-blue-50 px-2 py-1 rounded-full text-blue-700">
                          📊 {board.resultCount} Results
                        </span>
                        <span className="bg-orange-50 px-2 py-1 rounded-full text-orange-700">
                          📅 {board.dateSheetCount} Date Sheets
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              
              <div className="mt-4 pt-3 border-t text-center">
                <Link href="/boards" className="text-sm text-blue-600 hover:text-blue-800">
                  View All Boards →
                </Link>
              </div>
            </div>
            
            {/* 3. Programs Widget - University Counts */}
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
              ) : (
                <div className="space-y-2">
                  {programs.map((program) => (
                    <Link
                      key={program.id}
                      href={`/programs/${program.slug}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 group"
                    >
                      <div>
                        <div className="font-medium text-gray-800 group-hover:text-blue-600">
                          {program.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {program.categoryName || 'Program'}
                        </div>
                      </div>
                      <span className="text-sm bg-blue-100 px-3 py-1 rounded-full text-blue-700">
                        🏛️ {program.universityCount} {program.universityCount === 1 ? 'Uni' : 'Unis'}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              
              <div className="mt-4 pt-3 border-t text-center">
                <Link href="/programs" className="text-sm text-blue-600 hover:text-blue-800">
                  View All Programs →
                </Link>
              </div>
            </div>
            
            {/* 4. Universities Widget - Program Counts */}
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
              ) : (
                <div className="space-y-2">
                  {universities.map((uni) => (
                    <Link
                      key={uni.id}
                      href={`/universities/${uni.slug}`}
                      className="block p-3 rounded-lg hover:bg-gray-50 group"
                    >
                      <div className="font-medium text-gray-800 group-hover:text-blue-600">
                        {uni.name}
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-2">
                        <span className="bg-purple-50 px-2 py-1 rounded-full text-purple-700">
                          📚 {uni.programCount} Programs
                        </span>
                        <span className="bg-green-50 px-2 py-1 rounded-full text-green-700">
                          🎯 {uni.admissionCount} Admissions
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              
              <div className="mt-4 pt-3 border-t text-center">
                <Link href="/universities" className="text-sm text-blue-600 hover:text-blue-800">
                  View All Universities →
                </Link>
              </div>
            </div>
            
            {/* 5. Newsletter */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-3">Stay Updated</h3>
              <p className="text-blue-100 text-sm mb-4">
                Get admission alerts, results, and educational news
              </p>
              <form onSubmit={(e) => { e.preventDefault(); setEmail(''); }} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200"
                  required
                />
                <button className="w-full bg-white text-blue-600 font-semibold py-3 rounded-lg hover:bg-gray-100">
                  Subscribe Now
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}