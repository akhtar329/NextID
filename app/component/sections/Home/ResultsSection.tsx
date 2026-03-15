// app/component/sections/Home/ResultsSection.tsx
"use client"; 

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// Types for API data
interface Result {
  id: number;
  slug: string;
  title: string;
  year: number;
  resultDate: string | null;
  programName: string | null;
  boardName: string | null;
  boardSlug: string | null;
  universityName: string | null;
  universitySlug: string | null;
  isPopular: boolean | null;
}

export default function LatestResultsSection() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedInstitution, setSelectedInstitution] = useState('All');
  const [hasData, setHasData] = useState(false);

  // Fetch results from API
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        console.log('📡 Fetching results...');
        
        const response = await fetch('/api/public/results?limit=50&sort=latest');
        const data = await response.json();
        
        console.log('📦 API Response:', data);
        
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          console.log('✅ Results found:', data.data.length);
          setResults(data.data);
          setHasData(true);
        } else {
          console.log('⚠️ No results found');
          setResults([]);
          setHasData(false);
        }
      } catch (error) {
        console.error('🔥 Fetch error:', error);
        setResults([]);
        setHasData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  // Get current date for calculations
  const currentDate = new Date();

  // Calculate stats
  const resultsStats = useMemo(() => {
    const total = results.length;
    const thisMonth = results.filter(r => {
      if (!r.resultDate) return false;
      const date = new Date(r.resultDate);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    
    const popular = results.filter(r => r.isPopular).length;
    
    const byType = {
      boards: results.filter(r => r.boardName).length,
      universities: results.filter(r => r.universityName).length
    };

    return { total, thisMonth, popular, byType };
  }, [results]);

  // Get unique values for filters
  const uniqueTypes = useMemo(() => {
    const types: string[] = [];
    results.forEach(r => {
      if (r.boardName) types.push('Board');
      else if (r.universityName) types.push('University');
    });
    return ['All', ...new Set(types)];
  }, [results]);

  const uniqueYears = useMemo(() => {
    const years = results.map(r => r.year.toString());
    return ['All', ...new Set(years)].sort((a, b) => {
      if (a === 'All') return -1;
      if (b === 'All') return 1;
      return parseInt(b) - parseInt(a);
    });
  }, [results]);

  const uniqueInstitutions = useMemo(() => {
    const inst = results
      .map(r => r.boardName || r.universityName)
      .filter((name): name is string => name !== null && name !== undefined);
    return ['All', ...new Set(inst)];
  }, [results]);

  // Filter results
  const filteredResults = useMemo(() => {
    return results.filter(result => {
      const searchLower = searchQuery.toLowerCase();
      const resultName = result.boardName || result.universityName || '';
      const programName = result.programName || result.title || '';
      const resultType = result.boardName ? 'Board' : 'University';
      
      const matchesSearch = searchQuery === '' || 
        resultName.toLowerCase().includes(searchLower) ||
        programName.toLowerCase().includes(searchLower) ||
        result.year.toString().includes(searchLower);
      
      const matchesType = selectedType === 'All' || resultType === selectedType;
      const matchesYear = selectedYear === 'All' || result.year.toString() === selectedYear;
      const matchesInstitution = selectedInstitution === 'All' || resultName === selectedInstitution;
      
      return matchesSearch && matchesType && matchesYear && matchesInstitution;
    });
  }, [results, searchQuery, selectedType, selectedYear, selectedInstitution]);

  // Get latest results (last 30 days)
  const latestResults = useMemo(() => {
    return results.filter(r => {
      if (!r.resultDate) return false;
      const date = new Date(r.resultDate);
      const diffDays = Math.ceil((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }).slice(0, 5);
  }, [results, currentDate]);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBA';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Get time ago
  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
      return formatDate(dateString);
    } catch {
      return '';
    }
  };

  // Get institution name and slug
  const getInstitutionInfo = (result: Result) => {
    return {
      name: result.boardName || result.universityName || 'Unknown',
      slug: result.boardSlug || result.universitySlug || '',
      type: result.boardName ? 'Board' : 'University'
    };
  };

  // ✅ AGAR DATA NAHI HAI AUR LOADING BHI NAHI TO KUCH NAHI DIKHAO
  if (!hasData && !loading) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Exam Results in Pakistan 2026
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Loading latest results...
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
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Hidden H1 for SEO */}
        <h2 className="sr-only">
          Pakistan Exam Results 2026 - Board and University Results
        </h2>
        
        {/* Section Heading */}
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            📊 Latest Exam Results in Pakistan
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Check {resultsStats.thisMonth} new results announced this month. 
            {resultsStats.popular > 0 && ` ${resultsStats.popular} popular results available.`}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{resultsStats.total}</div>
            <div className="text-sm text-gray-600">Total Results</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm">
            <div className="text-3xl font-bold text-green-600">{resultsStats.byType.boards}</div>
            <div className="text-sm text-gray-600">Board Results</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm">
            <div className="text-3xl font-bold text-purple-600">{resultsStats.byType.universities}</div>
            <div className="text-sm text-gray-600">University Results</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm">
            <div className="text-3xl font-bold text-orange-600">{resultsStats.thisMonth}</div>
            <div className="text-sm text-gray-600">This Month</div>
          </div>
        </div>

        {/* Latest Results Preview - Sirf tab show jab latest results hon */}
        {latestResults.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
              🔥 Latest Results ({latestResults.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {latestResults.map((result) => {
                const { name, type } = getInstitutionInfo(result);
                return (
                  <Link
                    key={result.id}
                    href={`/results/${result.slug}`}
                    className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all group hover:border-blue-400"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                          type === 'Board' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {type}
                        </span>
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600">
                          {name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {result.programName || result.title || 'Results Announced'}
                        </p>
                      </div>
                      {result.isPopular && (
                        <span className="text-yellow-500 text-xl">⭐</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Year: {result.year}</span>
                      <span className="text-green-600 font-medium">
                        {getTimeAgo(result.resultDate)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Search and Filters - Sirf tab show jab results hon */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Filter Results
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Search Input */}
              <div className="lg:col-span-2">
                <label htmlFor="search-results" className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <input
                    id="search-results"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by institution or program..."
                    className="w-full px-4 py-3 pl-10 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </span>
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label htmlFor="result-type" className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  id="result-type"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {uniqueYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Institution Filter */}
            <div className="mt-4">
              <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-2">
                Institution
              </label>
              <select
                id="institution"
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {uniqueInstitutions.map(inst => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(searchQuery || selectedType !== 'All' || selectedYear !== 'All' || selectedInstitution !== 'All') && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('All');
                    setSelectedYear('All');
                    setSelectedInstitution('All');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Count - Sirf tab show jab results hon */}
        {results.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredResults.length} of {results.length} results
          </div>
        )}

        {/* Table - Desktop View */}
        {filteredResults.length > 0 ? (
          <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    Institution
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    Program / Title
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    Year
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    Result Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredResults.map((result) => {
                  const { name, slug, type } = getInstitutionInfo(result);
                  
                  return (
                    <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          type === 'Board' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/${type === 'Board' ? 'boards' : 'universities'}/${slug}`}>
                          <div className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline">
                            {name}
                          </div>
                        </Link>
                        {result.isPopular && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full mt-1">
                            ⭐ Popular
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {result.programName || result.title || 'General'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                          {result.year}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {formatDate(result.resultDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/results/${result.slug}`}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Result
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Status Bar */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600">Board Results</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-gray-600">University Results</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span className="text-gray-600">Popular</span>
                  </span>
                </div>
                <span className="text-gray-500">
                  {resultsStats.thisMonth} results this month
                </span>
              </div>
            </div>
          </div>
        ) : (
          // No results after filtering
          results.length > 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Results Found</h3>
              <p className="text-gray-500 mb-6">
                No results match your search criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('All');
                  setSelectedYear('All');
                  setSelectedInstitution('All');
                }}
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Clear Filters
              </button>
            </div>
          ) : null // Agar total results hi zero hain to kuch na dikhao
        )}

        {/* View All Link - Sirf tab show jab results hon */}
        {results.length > 0 && (
          <div className="text-center mt-10">
            <Link
              href="/results"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md"
            >
              Browse All {results.length} Results in Pakistan
              <span className="ml-2">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}