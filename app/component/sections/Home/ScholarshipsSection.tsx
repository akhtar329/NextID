// app/component/sections/Home/ScholarshipsSection.tsx
"use client"; 

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

// Mock data for latest scholarships (3-5 items)
const initialScholarships = [
  {
    id: 1,
    title: 'PEEF Merit Scholarship',
    slug: 'peef-merit-scholarship',
    studyLevel: 'Matric',
    type: 'Fully Funded',
    location: 'Pakistan',
    deadline: '2024-03-20',
    provider: 'Punjab Educational Endowment Fund',
    description: 'Merit-based scholarship for top-performing students'
  },
  {
    id: 2,
    title: 'HEC Need-Based Scholarship',
    slug: 'hec-need-based-scholarship',
    studyLevel: 'BS',
    type: 'Fully Funded',
    location: 'Pakistan',
    deadline: '2024-04-15',
    provider: 'Higher Education Commission',
    description: 'Financial aid for deserving undergraduate students'
  },
  {
    id: 3,
    title: 'British Council GREAT Scholarship',
    slug: 'british-council-great-scholarship',
    studyLevel: 'MS',
    type: 'Partial',
    location: 'Abroad',
    deadline: '2024-05-10',
    provider: 'British Council',
    description: 'Scholarship for postgraduate studies in UK universities'
  },
  {
    id: 4,
    title: 'Intermediate Talent Scholarship',
    slug: 'intermediate-talent-scholarship',
    studyLevel: 'Inter',
    type: 'Partial',
    location: 'Pakistan',
    deadline: '2024-03-30',
    provider: 'Government of Punjab',
    description: 'Scholarship for talented intermediate students'
  },
  {
    id: 5,
    title: 'Fulbright PhD Scholarship',
    slug: 'fulbright-phd-scholarship',
    studyLevel: 'PhD',
    type: 'Fully Funded',
    location: 'Abroad',
    deadline: '2024-06-01',
    provider: 'USEFP',
    description: 'Fully funded PhD programs in USA universities'
  }
];

// Filter options
const studyLevels = ['All', 'Matric', 'Inter', 'BS', 'MS', 'PhD'];
const scholarshipTypes = ['All', 'Fully Funded', 'Partial'];
const locations = ['All', 'Pakistan', 'Abroad'];

export default function ScholarshipsSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [scholarships, setScholarships] = useState(initialScholarships);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(true); // Mock data hai isliye true

  // ✅ AGAR DATA NAHI HAI TO KUCH NAHI DIKHAO
  if (!hasData && !loading) {
    return null;
  }

  // Get current date for deadline comparison
  const currentDate = new Date();

  // Filter scholarships based on search and filters
  const filteredScholarships = useMemo(() => {
    return scholarships.filter(scholarship => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        scholarship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scholarship.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scholarship.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Study level filter
      const matchesLevel = selectedLevel === 'All' || 
        scholarship.studyLevel === selectedLevel;
      
      // Type filter
      const matchesType = selectedType === 'All' || 
        scholarship.type === selectedType;
      
      // Location filter
      const matchesLocation = selectedLocation === 'All' || 
        scholarship.location === selectedLocation;
      
      return matchesSearch && matchesLevel && matchesType && matchesLocation;
    });
  }, [searchQuery, selectedLevel, selectedType, selectedLocation, scholarships]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Check if scholarship is still open
  const isScholarshipOpen = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    return deadlineDate > currentDate;
  };

  // Get color for scholarship type
  const getTypeColor = (type: string) => {
    return type === 'Fully Funded' 
      ? { bg: 'bg-green-100', text: 'text-green-800' }
      : { bg: 'bg-blue-100', text: 'text-blue-800' };
  };

  // Get color for location
  const getLocationColor = (location: string) => {
    return location === 'Pakistan'
      ? { bg: 'bg-emerald-100', text: 'text-emerald-800' }
      : { bg: 'bg-purple-100', text: 'text-purple-800' };
  };

  // Get color for study level
  const getLevelColor = (level: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      'Matric': { bg: 'bg-amber-100', text: 'text-amber-800' },
      'Inter': { bg: 'bg-orange-100', text: 'text-orange-800' },
      'BS': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      'MS': { bg: 'bg-teal-100', text: 'text-teal-800' },
      'PhD': { bg: 'bg-rose-100', text: 'text-rose-800' },
    };
    return colors[level] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Section Heading */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Latest Scholarships in Pakistan
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover current scholarship opportunities for students at all educational levels
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            
            {/* Search Input */}
            <div className="md:col-span-2">
              <label htmlFor="search-scholarships" className="block text-sm font-medium text-gray-700 mb-2">
                Search Scholarships by Title or Provider
              </label>
              <div className="relative">
                <input
                  id="search-scholarships"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search scholarships by title, provider, or location..."
                  className="w-full px-4 py-3 pl-10 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Search scholarships"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Study Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Study Level
              </label>
              <div className="flex flex-wrap gap-2">
                {studyLevels.map(level => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      selectedLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                    aria-label={`Filter by ${level}`}
                    type="button"
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Scholarship Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scholarship Type
              </label>
              <div className="flex flex-wrap gap-2">
                {scholarshipTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      selectedType === type
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                    aria-label={`Filter by ${type}`}
                    type="button"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="flex flex-wrap gap-2">
                {locations.map(location => (
                  <button
                    key={location}
                    onClick={() => setSelectedLocation(location)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      selectedLocation === location
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                    aria-label={`Filter by ${location}`}
                    type="button"
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLevel('All');
                setSelectedType('All');
                setSelectedLocation('All');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        </div>

        {/* Table - Desktop View */}
        <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  Scholarship Title
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  Study Level
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  Deadline
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredScholarships.map((scholarship) => {
                const typeColor = getTypeColor(scholarship.type);
                const levelColor = getLevelColor(scholarship.studyLevel);
                const locationColor = getLocationColor(scholarship.location);
                const isOpen = isScholarshipOpen(scholarship.deadline);
                
                return (
                  <tr 
                    key={scholarship.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {scholarship.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {scholarship.provider}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium ${locationColor.bg} ${locationColor.text}`}>
                          {scholarship.location}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${levelColor.bg} ${levelColor.text}`}>
                        {scholarship.studyLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeColor.bg} ${typeColor.text}`}>
                        {scholarship.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {formatDate(scholarship.deadline)}
                      </div>
                      <div className={`text-xs font-medium ${
                        isOpen ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isOpen ? 'Open' : 'Closed'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/scholarships/${scholarship.slug}`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label={`View ${scholarship.title} details`}
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* No Results */}
          {filteredScholarships.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">
                No scholarships found matching your criteria
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLevel('All');
                  setSelectedType('All');
                  setSelectedLocation('All');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Reset filters to see all scholarships
              </button>
            </div>
          )}
        </div>

        {/* Mobile View - Card Layout */}
        <div className="lg:hidden space-y-4">
          {filteredScholarships.map((scholarship) => {
            const typeColor = getTypeColor(scholarship.type);
            const levelColor = getLevelColor(scholarship.studyLevel);
            const locationColor = getLocationColor(scholarship.location);
            const isOpen = isScholarshipOpen(scholarship.deadline);
            
            return (
              <div 
                key={scholarship.id} 
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
              >
                <div className="space-y-4">
                  
                  {/* Scholarship Header */}
                  <div>
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      {scholarship.title}
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      {scholarship.provider}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${levelColor.bg} ${levelColor.text}`}>
                      {scholarship.studyLevel}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeColor.bg} ${typeColor.text}`}>
                      {scholarship.type}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${locationColor.bg} ${locationColor.text}`}>
                      {scholarship.location}
                    </span>
                  </div>

                  {/* Deadline & Status */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Deadline</div>
                      <div className="font-medium text-gray-900">
                        {formatDate(scholarship.deadline)}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isOpen ? 'Open' : 'Closed'}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    <Link
                      href={`/scholarships/${scholarship.slug}`}
                      className="block w-full text-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      aria-label={`View ${scholarship.title}`}
                    >
                      View Scholarship Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* No Results Mobile */}
          {filteredScholarships.length === 0 && (
            <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
              <div className="text-gray-500 text-lg mb-3">
                No scholarships found
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLevel('All');
                  setSelectedType('All');
                  setSelectedLocation('All');
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* View All Scholarships CTA */}
        <div className="text-center mt-10">
          <Link
            href="/scholarships"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md hover:shadow-lg"
            aria-label="View all scholarships"
          >
            View All Scholarships
            <span className="ml-2">→</span>
          </Link>
          <p className="text-gray-600 text-sm mt-3">
            Explore 500+ scholarship opportunities for students in Pakistan and abroad
          </p>
        </div>

      </div>
    </section>
  );
}