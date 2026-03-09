// app/component/sections/Home/CoursesSection.tsx
"use client"; 

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// Types for API data
interface Program {
  id: number;
  name: string;
  slug: string;
  degreeName: string | null;
  levelName: string | null;
  categoryName: string | null;
  duration: string | null;
  feeRange: string | null;
  isFeatured: boolean | null;
  overview?: string | null;
  eligibility?: string | null;
  careerScope?: string | null;
}

export default function CoursesSection() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch programs from API
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        console.log('📡 Fetching programs...');
        
        const response = await fetch('/api/public/programs?limit=50');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 API Response:', data);
        
        // ✅ Handle both response formats
        if (Array.isArray(data)) {
          console.log('✅ Programs found (array):', data.length);
          setPrograms(data);
        } else if (data.success && Array.isArray(data.data)) {
          console.log('✅ Programs found (data.data):', data.data.length);
          setPrograms(data.data);
        } else {
          console.log('⚠️ No programs found');
          setPrograms([]);
        }
      } catch (error) {
        console.error('🔥 Fetch error:', error);
        setPrograms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  // Get unique values for filters
  const uniqueLevels = useMemo(() => {
    const levels = programs
      .map(p => p.levelName)
      .filter((level): level is string => level !== null && level !== undefined);
    return ['All', ...new Set(levels)];
  }, [programs]);

  const uniqueCategories = useMemo(() => {
    const categories = programs
      .map(p => p.categoryName)
      .filter((cat): cat is string => cat !== null && cat !== undefined);
    return ['All', ...new Set(categories)];
  }, [programs]);

  // Filter programs
  const filteredPrograms = useMemo(() => {
    return programs.filter(program => {
      const searchLower = searchQuery.toLowerCase();
      
      const matchesSearch = searchQuery === '' || 
        program.name.toLowerCase().includes(searchLower) ||
        (program.degreeName?.toLowerCase() || '').includes(searchLower) ||
        (program.categoryName?.toLowerCase() || '').includes(searchLower);
      
      const matchesLevel = selectedLevel === 'All' || 
        program.levelName === selectedLevel;
      
      const matchesCategory = selectedCategory === 'All' || 
        program.categoryName === selectedCategory;
      
      return matchesSearch && matchesLevel && matchesCategory;
    });
  }, [programs, searchQuery, selectedLevel, selectedCategory]);

  // Get color for badges
  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, { bg: string; text: string }> = {
      'IT': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'Engineering': { bg: 'bg-orange-100', text: 'text-orange-800' },
      'Medical': { bg: 'bg-red-100', text: 'text-red-800' },
      'Business': { bg: 'bg-green-100', text: 'text-green-800' },
      'Arts': { bg: 'bg-purple-100', text: 'text-purple-800' },
      'Science': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
      'Law': { bg: 'bg-amber-100', text: 'text-amber-800' },
      'Education': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    };
    return colors[category || ''] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const getLevelColor = (level: string | null) => {
    const colors: Record<string, { bg: string; text: string }> = {
      'BS': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      'MS': { bg: 'bg-teal-100', text: 'text-teal-800' },
      'PhD': { bg: 'bg-amber-100', text: 'text-amber-800' },
      'Diploma': { bg: 'bg-violet-100', text: 'text-violet-800' },
      'Bachelor': { bg: 'bg-sky-100', text: 'text-sky-800' },
      'Master': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    };
    return colors[level || ''] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  // Loading state
  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Popular Courses & Degree Programs
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Loading courses and programs...
            </p>
          </div>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Section Heading */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Popular Courses & Degree Programs
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore top educational programs from leading universities
          </p>
        </div>

        {/* Search and Filters */}
        {programs.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Search Input */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search programs..."
                    className="w-full px-4 py-3 pl-10 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </span>
                </div>
              </div>

              {/* Level Filter */}
              {uniqueLevels.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {uniqueLevels.map(level => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category Filter */}
              {uniqueCategories.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Clear Filters */}
            {(searchQuery || selectedLevel !== 'All' || selectedCategory !== 'All') && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLevel('All');
                    setSelectedCategory('All');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Programs Table - Simplified with 5 rows only */}
        {filteredPrograms.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-4">Program Name</th>
                    <th scope="col" className="px-6 py-4">Level</th>
                    <th scope="col" className="px-6 py-4">Category</th>
                    <th scope="col" className="px-6 py-4">Duration</th>
                    <th scope="col" className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrograms.slice(0, 5).map((program, index) => {
                    const categoryColor = getCategoryColor(program.categoryName);
                    const levelColor = getLevelColor(program.levelName);
                    
                    return (
                      <tr 
                        key={program.id} 
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200 hover:bg-gray-100 transition-colors`}
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <div>
                            {program.name}
                            {program.degreeName && (
                              <span className="block text-xs text-gray-500 mt-1">
                                {program.degreeName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {program.levelName && (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${levelColor.bg} ${levelColor.text}`}>
                              {program.levelName}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {program.categoryName && (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${categoryColor.bg} ${categoryColor.text}`}>
                              {program.categoryName}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {program.duration || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/programs/${program.slug}`}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer with "More Courses" Link */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing 5 of {filteredPrograms.length} programs
              </p>
              
              {filteredPrograms.length > 5 && (
                <Link
                  href="/programs"
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  View All Courses
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Programs Found</h3>
            <p className="text-gray-500 mb-6">
              {programs.length === 0 
                ? 'No programs available at the moment.'
                : 'No programs match your search criteria.'}
            </p>
            {programs.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLevel('All');
                  setSelectedCategory('All');
                }}
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Optional: Alternative "More Courses" button if table is empty */}
        {programs.length === 0 && (
          <div className="text-center mt-8">
            <Link
              href="/programs"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md"
            >
              Browse All Programs
              <span className="ml-2">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}