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

  // Fetch results from API
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        console.log('📡 Fetching results...');
        
        const response = await fetch('/api/public/results?limit=20&sort=latest');
        const data = await response.json();
        
        console.log('📦 API Response:', data);
        
        if (data.success && Array.isArray(data.data)) {
          console.log('✅ Results found:', data.data.length);
          setResults(data.data);
        } else {
          console.log('⚠️ No results found');
          setResults([]);
        }
      } catch (error) {
        console.error('🔥 Fetch error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

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
      
      const matchesInstitution = selectedInstitution === 'All' || 
        resultName === selectedInstitution;
      
      return matchesSearch && matchesType && matchesYear && matchesInstitution;
    });
  }, [results, searchQuery, selectedType, selectedYear, selectedInstitution]);

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

  // Get institution name and slug
  const getInstitutionInfo = (result: Result) => {
    return {
      name: result.boardName || result.universityName || 'Unknown',
      slug: result.boardSlug || result.universitySlug || '',
      type: result.boardName ? 'Board' : 'University'
    };
  };

  // Loading state
  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Latest Exam Results in Pakistan
            </h2>
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
        
        {/* Section Heading */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Latest Exam Results in Pakistan
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Check recently published results from educational boards and universities across Pakistan
          </p>
        </div>

        {/* Search and Filters */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
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
                    <option key={type} value={type}>
                      {type}
                    </option>
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
                    <option key={year} value={year}>
                      {year}
                    </option>
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
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
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

        {/* Results Count */}
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
                        <div className="text-sm font-medium text-gray-900">
                          {name}
                        </div>
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
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Results Found</h3>
            <p className="text-gray-500 mb-6">
              {results.length === 0 
                ? 'No results available at the moment.'
                : 'No results match your search criteria.'}
            </p>
            {results.length > 0 && (
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
            )}
          </div>
        )}

        {/* View All Link */}
        {results.length > 0 && (
          <div className="text-center mt-10">
            <Link
              href="/results"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md"
            >
              View All Results
              <span className="ml-2">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}