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
  instituteCity?: string;
  instituteProvince?: string;
  programs: Program[];
}

type UrgencyFilter = 'all' | 'urgent' | 'warning' | 'normal';

export default function LatestAdmissionsSection() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all');
  const [hasData, setHasData] = useState(false);

  // ==================== HELPER FUNCTIONS ====================
  
  const getDaysLeft = (dateString: string | null): number | null => {
    if (!dateString) return null;
    try {
      const deadline = new Date(dateString);
      const now = new Date();
      deadline.setHours(23, 59, 59, 999);
      now.setHours(23, 59, 59, 999);
      
      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays > 0 ? diffDays : null;
    } catch {
      return null;
    }
  };

  const getUrgencyLevel = (daysLeft: number | null): UrgencyFilter => {
    if (daysLeft === null) return 'all';
    if (daysLeft <= 3) return 'urgent';
    if (daysLeft <= 7) return 'warning';
    return 'normal';
  };

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

  const getProgramDisplay = (programs: Program[]): string => {
    if (!programs || programs.length === 0) return 'Multiple Programs';
    if (programs.length === 1) return programs[0].name;
    if (programs.length === 2) return `${programs[0].name} & ${programs[1].name}`;
    return `${programs[0].name} + ${programs.length - 1} more`;
  };

  // ==================== DATA FETCHING ====================
  
  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/public/admissions?limit=50');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setAdmissions(data.data);
          setHasData(true);
        } else {
          setAdmissions([]);
          setHasData(false);
        }
      } catch {
        setAdmissions([]);
        setHasData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmissions();
  }, []);

  // ==================== MEMOIZED VALUES ====================
  
  const validOpenAdmissions = useMemo(() => {
    return admissions.filter(ad => {
      if (ad.status !== 'Open') return false;
      if (!ad.expectedCloseDate) return true;
      const daysLeft = getDaysLeft(ad.expectedCloseDate);
      return daysLeft !== null;
    });
  }, [admissions]);

  const sortedAdmissionsByUrgency = useMemo(() => {
    return [...validOpenAdmissions].sort((a, b) => {
      const daysLeftA = getDaysLeft(a.expectedCloseDate);
      const daysLeftB = getDaysLeft(b.expectedCloseDate);
      
      if (daysLeftA !== null && daysLeftB !== null) {
        return daysLeftA - daysLeftB;
      }
      if (daysLeftA !== null && daysLeftB === null) return -1;
      if (daysLeftA === null && daysLeftB !== null) return 1;
      return 0;
    });
  }, [validOpenAdmissions]);

  const closingSoonAdmissions = useMemo(() => {
    const soon = sortedAdmissionsByUrgency.filter(ad => {
      if (!ad.expectedCloseDate) return false;
      const daysLeft = getDaysLeft(ad.expectedCloseDate);
      return daysLeft !== null && daysLeft <= 30;
    });
    
    if (soon.length === 0 && sortedAdmissionsByUrgency.length > 0) {
      return sortedAdmissionsByUrgency.slice(0, 5);
    }
    return soon.slice(0, 5);
  }, [sortedAdmissionsByUrgency]);

  const closingSoonStats = useMemo(() => {
    const allOpen = validOpenAdmissions;
    
    const closingThisWeek = allOpen.filter(ad => {
      if (!ad.expectedCloseDate) return false;
      const daysLeft = getDaysLeft(ad.expectedCloseDate);
      return daysLeft !== null && daysLeft <= 7;
    });

    const urgentToday = allOpen.filter(ad => {
      if (!ad.expectedCloseDate) return false;
      const daysLeft = getDaysLeft(ad.expectedCloseDate);
      return daysLeft !== null && daysLeft <= 3;
    });

    const normal = allOpen.filter(ad => {
      if (!ad.expectedCloseDate) return false;
      const daysLeft = getDaysLeft(ad.expectedCloseDate);
      return daysLeft !== null && daysLeft > 7;
    });

    const withoutDate = allOpen.filter(ad => !ad.expectedCloseDate);

    return {
      thisWeek: closingThisWeek.length,
      urgent: urgentToday.length,
      normal: normal.length,
      withoutDate: withoutDate.length,
      total: allOpen.length
    };
  }, [validOpenAdmissions]);

  // ==================== FILTERS ====================
  
  const filteredByUrgency = useMemo(() => {
    if (urgencyFilter === 'all') return closingSoonAdmissions;
    return closingSoonAdmissions.filter(ad => {
      const daysLeft = getDaysLeft(ad.expectedCloseDate);
      const level = getUrgencyLevel(daysLeft);
      return level === urgencyFilter;
    });
  }, [closingSoonAdmissions, urgencyFilter]);

  const uniqueUniversities = useMemo(() => {
    const unis = filteredByUrgency
      .map(item => item.instituteName)
      .filter((name): name is string => name !== null && name !== undefined);
    return ['All', ...new Set(unis)];
  }, [filteredByUrgency]);

  const filteredAdmissions = useMemo(() => {
    return filteredByUrgency.filter(admission => {
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
  }, [filteredByUrgency, searchQuery, selectedUniversity]);

  if (!hasData && !loading) return null;

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
            <p className="text-gray-600 mt-4">Loading latest admissions...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-br from-blue-50 via-white to-indigo-50/30">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Hero Section with Stats */}
        <div className="text-center mb-10">
          {/* Animated Badge */}
          <div className="inline-block mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
              🎓 Limited Seats Available
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Admissions 2026 in Pakistan
          </h2>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
            <div className="bg-red-100 rounded-full px-4 py-2">
              <span className="text-red-600 font-bold text-2xl">⏰ {closingSoonStats.thisWeek}</span>
              <span className="text-red-600 ml-1">Admissions Closing This Week</span>
            </div>
            {closingSoonStats.urgent > 0 && (
              <div className="bg-orange-100 rounded-full px-4 py-2 animate-pulse">
                <span className="text-orange-600 font-bold">{closingSoonStats.urgent} Urgent</span>
                <span className="text-orange-600 ml-1">(≤3 days left)</span>
              </div>
            )}
          </div>
          
          <p className="text-gray-600 max-w-2xl mx-auto">
            Apply now for {validOpenAdmissions.length}+ open admissions across top universities in Pakistan
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <button
            onClick={() => setUrgencyFilter('all')}
            className={`group relative overflow-hidden rounded-2xl p-5 text-center transition-all duration-300 ${
              urgencyFilter === 'all' 
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg scale-105' 
                : 'bg-white hover:bg-blue-50 border-2 border-blue-100 hover:border-blue-300'
            }`}
          >
            <div className="relative z-10">
              <div className="text-4xl font-bold mb-2">{validOpenAdmissions.length}</div>
              <div className="text-sm font-medium">All Admissions</div>
              <div className="text-xs mt-1 opacity-75">Open Now</div>
            </div>
            {urgencyFilter === 'all' && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20"></div>
            )}
          </button>
          
          <button
            onClick={() => setUrgencyFilter('urgent')}
            className={`group relative overflow-hidden rounded-2xl p-5 text-center transition-all duration-300 ${
              urgencyFilter === 'urgent' 
                ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg scale-105 animate-pulse' 
                : 'bg-white hover:bg-red-50 border-2 border-red-100 hover:border-red-300'
            }`}
          >
            <div className="relative z-10">
              <div className="text-4xl font-bold mb-2">{closingSoonStats.urgent}</div>
              <div className="text-sm font-medium">🚨 Urgent</div>
              <div className="text-xs mt-1 opacity-75">Closing in ≤3 days</div>
            </div>
          </button>
          
          <button
            onClick={() => setUrgencyFilter('warning')}
            className={`group relative overflow-hidden rounded-2xl p-5 text-center transition-all duration-300 ${
              urgencyFilter === 'warning' 
                ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-lg scale-105' 
                : 'bg-white hover:bg-orange-50 border-2 border-orange-100 hover:border-orange-300'
            }`}
          >
            <div className="relative z-10">
              <div className="text-4xl font-bold mb-2">{closingSoonStats.thisWeek - closingSoonStats.urgent}</div>
              <div className="text-sm font-medium">⚠️ Warning</div>
              <div className="text-xs mt-1 opacity-75">4-7 days left</div>
            </div>
          </button>
          
          <button
            onClick={() => setUrgencyFilter('normal')}
            className={`group relative overflow-hidden rounded-2xl p-5 text-center transition-all duration-300 ${
              urgencyFilter === 'normal' 
                ? 'bg-gradient-to-br from-green-600 to-green-700 text-white shadow-lg scale-105' 
                : 'bg-white hover:bg-green-50 border-2 border-green-100 hover:border-green-300'
            }`}
          >
            <div className="relative z-10">
              <div className="text-4xl font-bold mb-2">{closingSoonStats.normal}</div>
              <div className="text-sm font-medium">✅ Normal</div>
              <div className="text-xs mt-1 opacity-75">8+ days available</div>
            </div>
          </button>
        </div>

        {/* Enhanced Search and Filter */}
        {filteredByUrgency.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Search by university or program..."
                  className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
              <div className="relative">
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  {uniqueUniversities.map((uni) => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▼</span>
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(searchQuery || selectedUniversity !== 'All') && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-xs text-gray-500">Active filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">×</button>
                  </span>
                )}
                {selectedUniversity !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    University: {selectedUniversity}
                    <button onClick={() => setSelectedUniversity('All')} className="hover:text-blue-900">×</button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Cards Grid */}
        {filteredAdmissions.length > 0 ? (
          <div className="space-y-4">
            {filteredAdmissions.map((admission, index) => {
              const daysLeft = getDaysLeft(admission.expectedCloseDate);
              const isUrgent = daysLeft !== null && daysLeft <= 3;
              const isWarning = daysLeft !== null && daysLeft <= 7 && daysLeft > 3;
              
              return (
                <Link
                  key={admission.id}
                  href={`/admissions/${admission.slug}`}
                  className={`group block rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    isUrgent ? 'border-red-200 bg-gradient-to-r from-red-50/50 to-white hover:from-red-100' :
                    isWarning ? 'border-orange-200 bg-gradient-to-r from-orange-50/30 to-white hover:from-orange-100' :
                    'border-gray-100 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="p-6">
                    {/* Header with Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {/* Rank Badge */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isUrgent ? 'bg-red-500 text-white' :
                            isWarning ? 'bg-orange-500 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {admission.instituteName}
                          </h3>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="text-gray-600">{admission.session || 'Fall'} {admission.year}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-600">{admission.instituteCity || 'Pakistan'}</span>
                        </div>
                      </div>
                      
                      {/* Days Left Badge */}
                      {daysLeft ? (
                        <div className={`flex flex-col items-center px-4 py-2 rounded-xl text-center ${
                          isUrgent ? 'bg-red-100 animate-pulse' :
                          isWarning ? 'bg-orange-100' :
                          'bg-green-100'
                        }`}>
                          <div className={`text-2xl font-bold ${
                            isUrgent ? 'text-red-600' :
                            isWarning ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {daysLeft}
                          </div>
                          <div className="text-xs text-gray-600">days left</div>
                        </div>
                      ) : (
                        <div className="px-4 py-2 bg-gray-100 rounded-xl text-center">
                          <div className="text-sm text-gray-600">Date TBA</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Programs */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span className="font-semibold">🎓 Programs:</span>
                        <span>{getProgramDisplay(admission.programs || [])}</span>
                      </div>
                      
                      {admission.programs && admission.programs.length > 2 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {admission.programs.slice(0, 3).map((program) => (
                            <span key={program.id} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                              {program.name}
                            </span>
                          ))}
                          {admission.programs.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                              +{admission.programs.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Footer with CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      {admission.expectedCloseDate && (
                        <div className="text-xs text-gray-500">
                          📅 Last Date: {formatDate(admission.expectedCloseDate)}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-blue-600 font-medium group-hover:gap-3 transition-all">
                        <span>Apply Now</span>
                        <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-100">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {urgencyFilter === 'urgent' && 'No Urgent Admissions Right Now'}
              {urgencyFilter === 'warning' && 'No Admissions in Warning Period'}
              {urgencyFilter === 'normal' && 'No Admissions in Normal Period'}
              {urgencyFilter === 'all' && 'No Upcoming Admissions Available'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {urgencyFilter !== 'all' 
                ? 'All deadlines have been extended or passed. Check all open admissions below.'
                : 'New admission announcements will appear here. Subscribe for updates!'}
            </p>
            {urgencyFilter !== 'all' && (
              <button
                onClick={() => setUrgencyFilter('all')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
              >
                View All Admissions
              </button>
            )}
          </div>
        )}

        {/* Enhanced View All Link */}
        {sortedAdmissionsByUrgency.length > 5 && urgencyFilter === 'all' && (
          <div className="text-center mt-10">
            <Link
              href="/admissions"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all group"
            >
              <span>Browse All {validOpenAdmissions.length}+ University Admissions</span>
              <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <p className="text-xs text-gray-500 mt-3">
              Including public and private sector universities across Pakistan
            </p>
          </div>
        )}
      </div>
    </section>
  );
}