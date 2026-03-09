// app/component/sections/Home/UniversitiesSection.tsx
"use client"; 

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// Types for API data
interface University {
  id: number;
  name: string;
  slug: string;
  type: string;
  city: string;
  description: string | null;
  website: string | null;
  isFeatured: boolean | null;
  createdAt: string | null;
  // Optional fields agar API mein hain
  established?: string;
  programs?: string;
}

export default function UniversitiesSection() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Fetch universities from API
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setLoading(true);
        console.log('📡 Fetching universities...');
        
        // API call - using public/institutes endpoint
        const response = await fetch('/api/public/institutes?limit=20');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 API Response:', data);
        
        // Handle API response format
        if (Array.isArray(data)) {
          console.log('✅ Universities found (array):', data.length);
          setUniversities(data);
        } else if (data.success && Array.isArray(data.data)) {
          console.log('✅ Universities found (data.data):', data.data.length);
          setUniversities(data.data);
        } else {
          console.log('⚠️ No universities found');
          setUniversities([]);
        }
      } catch (error) {
        console.error('🔥 Fetch error:', error);
        setUniversities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, []);

  // Get unique cities for filter
  const uniqueCities = useMemo(() => {
    const cities = universities
      .map(u => u.city)
      .filter((city): city is string => city !== null && city !== undefined);
    return ['All', ...new Set(cities)];
  }, [universities]);

  // University types for filter
  const universityTypes = useMemo(() => {
    const types = universities
      .map(u => u.type)
      .filter((type): type is string => type !== null && type !== undefined);
    return ['All', ...new Set(types)];
  }, [universities]);

  // Filter universities based on search and filters
  const filteredUniversities = useMemo(() => {
    return universities.filter(university => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        university.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // City filter
      const matchesCity = selectedCity === 'All' || 
        university.city === selectedCity;
      
      // Type filter
      const matchesType = selectedType === 'All' || 
        university.type === selectedType;
      
      return matchesSearch && matchesCity && matchesType;
    });
  }, [universities, searchQuery, selectedCity, selectedType]);

  // Get color for university type
  const getTypeColor = (type: string) => {
    return type?.toLowerCase() === 'public' 
      ? { bg: 'bg-green-100', text: 'text-green-800' }
      : type?.toLowerCase() === 'private'
        ? { bg: 'bg-purple-100', text: 'text-purple-800' }
        : { bg: 'bg-blue-100', text: 'text-blue-800' };
  };

  // Loading state
  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Top Universities in Pakistan
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Loading universities...
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
            Top Universities in Pakistan
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore leading educational institutions offering quality higher education across Pakistan
          </p>
        </div>

        {/* Search and Filters - Only show if universities exist */}
        {universities.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Search Input */}
              <div className="md:col-span-1">
                <label htmlFor="search-universities" className="block text-sm font-medium text-gray-700 mb-2">
                  Search University
                </label>
                <div className="relative">
                  <input
                    id="search-universities"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full px-4 py-3 pl-10 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </span>
                </div>
              </div>

              {/* City Filter */}
              {uniqueCities.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* University Type Filter */}
              {universityTypes.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {universityTypes.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Clear Filters */}
            {(searchQuery || selectedCity !== 'All' || selectedType !== 'All') && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCity('All');
                    setSelectedType('All');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Table - Desktop View */}
        {filteredUniversities.length > 0 ? (
          <>
            <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                      University Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                      City
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUniversities.slice(0, 5).map((university) => {
                    const typeColor = getTypeColor(university.type);
                    
                    return (
                      <tr 
                        key={university.id} 
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="text-2xl">
                              🏛️
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {university.name}
                              </div>
                              {university.isFeatured && (
                                <span className="inline-flex items-center px-2 py-0.5 mt-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                  ⭐ Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {university.city || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeColor.bg} ${typeColor.text}`}>
                            {university.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/universities/${university.slug}`}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Table Footer */}
              {filteredUniversities.length > 5 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Showing 5 of {filteredUniversities.length} universities
                  </p>
                  <Link
                    href="/universities"
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    View All
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile View - Cards */}
            <div className="lg:hidden space-y-4">
              {filteredUniversities.slice(0, 5).map((university) => {
                const typeColor = getTypeColor(university.type);
                
                return (
                  <div 
                    key={university.id} 
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                  >
                    <div className="space-y-4">
                      
                      {/* University Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">
                            🏛️
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900">
                              {university.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {university.city || 'Pakistan'}
                            </div>
                          </div>
                        </div>
                        {university.isFeatured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            ⭐
                          </span>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeColor.bg} ${typeColor.text}`}>
                          {university.type}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>

                      {/* Description */}
                      {university.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {university.description}
                        </p>
                      )}

                      {/* Action Button */}
                      <Link
                        href={`/universities/${university.slug}`}
                        className="block w-full text-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}

              {/* Mobile View All Link */}
              {filteredUniversities.length > 5 && (
                <div className="text-center pt-4">
                  <Link
                    href="/universities"
                    className="inline-flex items-center text-blue-600 font-medium"
                  >
                    View All {filteredUniversities.length} Universities
                    <span className="ml-1">→</span>
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : (
          /* No Results */
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">🏛️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Universities Found</h3>
            <p className="text-gray-500 mb-6">
              {universities.length === 0 
                ? 'No universities available at the moment.'
                : 'No universities match your search criteria.'}
            </p>
            {universities.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('All');
                  setSelectedType('All');
                }}
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* View All CTA */}
        {universities.length > 0 && filteredUniversities.length === 0 && (
          <div className="text-center mt-8">
            <Link
              href="/universities"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md"
            >
              Browse All Universities
              <span className="ml-2">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}