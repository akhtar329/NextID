// app/component/sections/Home/AdmissionSection.tsx
"use client"; 

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface Program {
  id: number;
  name: string;
  slug: string;
}

interface Admission {
  id: number;
  name: string;
  slug: string;
  year: number;
  session: string | null;
  status: string;
  expectedCloseDate: string | null;
  expectedOpenDate?: string | null;
  instituteId: number;
  instituteName: string;
  instituteSlug: string;
  programs: Program[];
}

export default function LatestAdmissionsSection() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('All');

  // ==================== HELPER FUNCTIONS ====================
  
  // ✅ Fixed getDaysLeft function - counts until end of day
  const getDaysLeft = (dateString: string | null): number | null => {
    if (!dateString) return null;
    try {
      const deadline = new Date(dateString);
      const now = new Date();
      
      // Set deadline to end of day (23:59:59)
      deadline.setHours(23, 59, 59, 999);
      
      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays >= 0 ? diffDays : null;
    } catch (error) {
      console.error('🔥 Date parsing error:', error);
      return null;
    }
  };

  // Format date function
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

  // Get program display text
  const getProgramDisplay = (programs: Program[]): string => {
    if (!programs || programs.length === 0) return 'Program';
    if (programs.length === 1) return programs[0].name;
    if (programs.length === 2) return `${programs[0].name} & ${programs[1].name}`;
    return `${programs[0].name} +${programs.length - 1} more`;
  };

  // ==================== DATA FETCHING ====================
  
  // Fetch admissions from API
  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        setLoading(true);
        console.log('📡 Fetching admissions...');
        
        const response = await fetch('/api/public/admissions?limit=50');
        const data = await response.json();
        
        console.log('📦 API Response:', data);
        
        if (data.success && Array.isArray(data.data)) {
          console.log('✅ Admissions found:', data.data.length);
          setAdmissions(data.data);
        } else {
          console.log('⚠️ No admissions found');
          setAdmissions([]);
        }
      } catch (error) {
        console.error('🔥 Fetch error:', error);
        setAdmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmissions();
  }, []);

  // ==================== MEMOIZED VALUES ====================
  
  // Get current date for comparison
  const currentDate = new Date();

  // Get open admissions
  const openAdmissions = useMemo(() => {
    return admissions.filter(ad => ad.status === 'Open');
  }, [admissions]);

  // Calculate closing soon stats
  const closingSoonStats = useMemo(() => {
    const allOpen = openAdmissions;
    
    const closingThisWeek = allOpen.filter(ad => {
      if (!ad.expectedCloseDate) return false;
      const daysLeft = getDaysLeft(ad.expectedCloseDate);
      return daysLeft !== null && daysLeft <= 7;
    });

    const closingThisMonth = allOpen.filter(ad => {
      if (!ad.expectedCloseDate) return false;
      const daysLeft = getDaysLeft(ad.expectedCloseDate);
      return daysLeft !== null && daysLeft <= 30;
    });

    const urgentToday = allOpen.filter(ad => {
      if (!ad.expectedCloseDate) return false;
      const daysLeft = getDaysLeft(ad.expectedCloseDate);
      return daysLeft !== null && daysLeft <= 3;
    });

    return {
      thisWeek: closingThisWeek.length,
      thisMonth: closingThisMonth.length,
      urgent: urgentToday.length,
      total: allOpen.length
    };
  }, [openAdmissions]);

  // Sort admissions - closing soon first
  const sortedAdmissions = useMemo(() => {
    return [...openAdmissions].sort((a, b) => {
      if (!a.expectedCloseDate) return 1;
      if (!b.expectedCloseDate) return -1;
      return new Date(a.expectedCloseDate).getTime() - new Date(b.expectedCloseDate).getTime();
    });
  }, [openAdmissions]);

  // Get closing soon admissions (all within 30 days)
  const closingSoonAdmissions = useMemo(() => {
    const soon = sortedAdmissions.filter(ad => {
      if (!ad.expectedCloseDate) return false;
      const daysLeft = getDaysLeft(ad.expectedCloseDate);
      return daysLeft !== null && daysLeft <= 30;
    }).slice(0, 5);
    
    // If no closing soon, show any open admissions
    if (soon.length === 0 && sortedAdmissions.length > 0) {
      return sortedAdmissions.slice(0, 5);
    }
    
    return soon;
  }, [sortedAdmissions]);

  // Get unique universities
  const uniqueUniversities = useMemo(() => {
    const unis = closingSoonAdmissions
      .map(item => item.instituteName)
      .filter((name): name is string => name !== null && name !== undefined);
    return ['All', ...new Set(unis)];
  }, [closingSoonAdmissions]);

  // Filter admissions based on search
  const filteredAdmissions = useMemo(() => {
    return closingSoonAdmissions.filter(admission => {
      const searchLower = searchQuery.toLowerCase();
      
      const matchesInstitute = admission.instituteName?.toLowerCase().includes(searchLower);
      const matchesProgram = admission.programs?.some(program => 
        program.name.toLowerCase().includes(searchLower)
      );
      const matchesSearch = searchQuery === '' || matchesInstitute || matchesProgram;
      const matchesUniversity = selectedUniversity === 'All' || 
        admission.instituteName === selectedUniversity;
      
      return matchesSearch && matchesUniversity;
    });
  }, [closingSoonAdmissions, searchQuery, selectedUniversity]);

  // ==================== LOADING STATE ====================
  
  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Latest Admissions in Pakistan 2026
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Loading latest admissions...
            </p>
          </div>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    );
  }

  // ==================== RENDER ====================
  
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* SEO Optimized Headings */}
        <div className="text-center mb-6">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Admissions 2026 in Pakistan
          </h2>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            ⏰ {closingSoonStats.thisWeek} Admissions Closing This Week
          </h2>
          
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            Find latest university admissions 2026 in Pakistan. {closingSoonStats.urgent > 0 && (
              <span className="text-red-600 font-semibold">{closingSoonStats.urgent} urgent admissions</span>
            )} closing in next 3 days. Apply now for {openAdmissions.length} open admissions across Pakistan.
          </p>
        </div>

        {/* Stats Cards - Dynamic Counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
            <div className="text-3xl font-bold text-blue-600">{openAdmissions.length}</div>
            <div className="text-sm text-gray-600">Open Admissions</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
            <div className="text-3xl font-bold text-orange-600">{closingSoonStats.thisWeek}</div>
            <div className="text-sm text-gray-600">Closing This Week</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100">
            <div className="text-3xl font-bold text-yellow-600">{closingSoonStats.thisMonth}</div>
            <div className="text-sm text-gray-600">Closing This Month</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
            <div className="text-3xl font-bold text-red-600">{closingSoonStats.urgent}</div>
            <div className="text-sm text-gray-600">Urgent (≤3 days)</div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Top Admissions Closing Soon
        </h3>

        {/* Search and Filters */}
        {closingSoonAdmissions.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Search Input */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <input
                    id="search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by university or program..."
                    className="w-full px-4 py-3 pl-10 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </span>
                </div>
              </div>

              {/* University Filter */}
              <div>
                <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-2">
                  University
                </label>
                <select
                  id="university"
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {uniqueUniversities.map((university) => (
                    <option key={university} value={university}>
                      {university}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        {filteredAdmissions.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    University
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    Program(s)
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    Session
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    Last Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    Days Left
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAdmissions.map((admission, index) => {
                  const daysLeft = getDaysLeft(admission.expectedCloseDate);
                  const isUrgent = daysLeft !== null && daysLeft <= 3;
                  const isWarning = daysLeft !== null && daysLeft <= 7 && daysLeft > 3;
                  
                  return (
                    <tr 
                      key={admission.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        index === 0 ? 'bg-orange-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <Link 
                          href={`/universities/${admission.instituteSlug}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline"
                        >
                          {admission.instituteName}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {getProgramDisplay(admission.programs || [])}
                        </div>
                        {admission.programs && admission.programs.length > 1 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {admission.programs.length} programs available
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {admission.session || 'Fall'} {admission.year}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(admission.expectedCloseDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {daysLeft ? (
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isUrgent ? 'bg-red-100 text-red-700 animate-pulse' :
                              isWarning ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                            </span>
                            {isUrgent && (
                              <span className="text-xs text-red-600 font-medium">⚠️ Last day!</span>
                            )}
                            {daysLeft === 1 && !isUrgent && (
                              <span className="text-xs text-orange-600 font-medium">Closes tonight</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">TBA</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admissions/${admission.slug}`}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Status Bar */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-gray-600">Urgent (≤3 days)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    <span className="text-gray-600">Warning (4-7 days)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600">Normal (8+ days)</span>
                  </span>
                </div>
                <span className="text-gray-700 font-medium">
                  {closingSoonStats.thisWeek} admissions closing this week • Apply before midnight
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Admissions Closing Soon</h3>
            <p className="text-gray-500 mb-6">
              Check back later for upcoming admission deadlines.
            </p>
            <Link
              href="/admissions"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View All {openAdmissions.length} Open Admissions
            </Link>
          </div>
        )}

        {/* View All Link */}
        {sortedAdmissions.length > 5 && (
          <div className="text-center mt-8">
            <Link
              href="/admissions"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-lg"
            >
              Browse all {openAdmissions.length} university admissions 2026 in Pakistan
              <span>→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}