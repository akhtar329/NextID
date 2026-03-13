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
        
        // Handle both response formats
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

  // Calculate stats
  const programStats = useMemo(() => {
    const total = programs.length;
    const featured = programs.filter(p => p.isFeatured).length;
    const byLevel = programs.reduce((acc: Record<string, number>, p) => {
      if (p.levelName) {
        acc[p.levelName] = (acc[p.levelName] || 0) + 1;
      }
      return acc;
    }, {});
    
    const byCategory = programs.reduce((acc: Record<string, number>, p) => {
      if (p.categoryName) {
        acc[p.categoryName] = (acc[p.categoryName] || 0) + 1;
      }
      return acc;
    }, {});

    return { total, featured, byLevel, byCategory };
  }, [programs]);

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

  // Featured programs for carousel
  const featuredPrograms = useMemo(() => {
    return programs
      .filter(p => p.isFeatured)
      .slice(0, 3);
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
      'Bachelor': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      'Master': { bg: 'bg-teal-100', text: 'text-teal-800' },
      'PhD': { bg: 'bg-amber-100', text: 'text-amber-800' },
      'Diploma': { bg: 'bg-violet-100', text: 'text-violet-800' },
      'Certificate': { bg: 'bg-sky-100', text: 'text-sky-800' },
      'BS': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
      'MS': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    };
    return colors[level || ''] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  // Loading state
  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Degree Programs in Pakistan 2026
            </h1>
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
        
        {/* Hidden H1 for SEO */}
        <h2 className="sr-only">
          Pakistan Degree Programs 2026 - BS, MS, PhD, Diploma Courses
        </h2>
        
        {/* Section Heading */}
        <div className="text-center mb-6">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Degree Programs in Pakistan 2026
          </h2>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            📚 {programStats.total} Academic Programs Available
          </h2>
          
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            Explore {programStats.featured} featured programs across {
              Object.keys(programStats.byCategory).length
            } categories including BS, MS, PhD, and diploma courses.
          </p>
        </div>

        {/* Stats Cards - Like Admissions Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
            <div className="text-3xl font-bold text-blue-600">{programStats.total}</div>
            <div className="text-sm text-gray-600">Total Programs</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
            <div className="text-3xl font-bold text-green-600">{programStats.featured}</div>
            <div className="text-sm text-gray-600">Featured Programs</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
            <div className="text-3xl font-bold text-purple-600">
              {Object.keys(programStats.byLevel).length}
            </div>
            <div className="text-sm text-gray-600">Levels</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
            <div className="text-3xl font-bold text-orange-600">
              {Object.keys(programStats.byCategory).length}
            </div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
        </div>

        {/* Featured Programs Section */}
        {featuredPrograms.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
              ⭐ Featured Programs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredPrograms.map((program) => (
                <Link
                  key={program.id}
                  href={`/programs/${program.slug}`}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-5 border border-yellow-200 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600">
                      {program.name}
                    </h4>
                    <span className="text-yellow-500">⭐</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {program.levelName && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {program.levelName}
                      </span>
                    )}
                    {program.categoryName && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        {program.categoryName}
                      </span>
                    )}
                  </div>
                  {program.duration && (
                    <p className="text-sm text-gray-600">Duration: {program.duration}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        {programs.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Find Your Program
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Search Input */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Programs
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="BS Computer Science, MBA..."
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
                    Education Level
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {uniqueLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
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
                      <option key={cat} value={cat}>{cat}</option>
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
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        {programs.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredPrograms.slice(0, 5).length} of {filteredPrograms.length} programs
          </div>
        )}

        {/* Programs Table - 5 rows only */}
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
                    <th scope="col" className="px-6 py-4">Fee Range</th>
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
                          <Link href={`/programs/${program.slug}`} className="hover:text-blue-600 hover:underline">
                            {program.name}
                          </Link>
                          {program.degreeName && (
                            <span className="block text-xs text-gray-500 mt-1">
                              {program.degreeName}
                            </span>
                          )}
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
                        <td className="px-6 py-4 text-gray-600">
                          {program.duration || '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {program.feeRange || 'Contact uni'}
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
            
            {/* Table Footer with Stats */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-xs text-gray-600">Bachelor's</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-xs text-gray-600">Master's</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span className="text-xs text-gray-600">PhD</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span className="text-xs text-gray-600">Featured</span>
                  </span>
                </div>
                
                {filteredPrograms.length > 5 && (
                  <Link
                    href="/programs"
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    View All {filteredPrograms.length} Programs
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
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

        {/* View All Link */}
        {programs.length > 0 && (
          <div className="text-center mt-10">
            <Link
              href="/programs"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md"
            >
              Browse All {programs.length} Degree Programs
              <span className="ml-2">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}