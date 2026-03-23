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
      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 ? diffDays : null;
    } catch (error) {
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
    if (!programs || programs.length === 0) return 'Program';
    if (programs.length === 1) return programs[0].name;
    if (programs.length === 2) return `${programs[0].name} & ${programs[1].name}`;
    return `${programs[0].name} +${programs.length - 1} more`;
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
      } catch (error) {
        console.error('Fetch error:', error);
        setAdmissions([]);
        setHasData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmissions();
  }, []);

  // ==================== MEMOIZED VALUES ====================
  
  const openAdmissions = useMemo(() => {
    return admissions.filter(ad => ad.status === 'Open');
  }, [admissions]);

  const sortedAdmissionsByUrgency = useMemo(() => {
    return [...openAdmissions].sort((a, b) => {
      const daysLeftA = getDaysLeft(a.expectedCloseDate);
      const daysLeftB = getDaysLeft(b.expectedCloseDate);
      
      if (daysLeftA !== null && daysLeftB !== null) {
        return daysLeftA - daysLeftB;
      }
      if (daysLeftA !== null && daysLeftB === null) return -1;
      if (daysLeftA === null && daysLeftB !== null) return 1;
      return 0;
    });
  }, [openAdmissions]);

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
    const allOpen = openAdmissions;
    
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

    return {
      thisWeek: closingThisWeek.length,
      urgent: urgentToday.length,
      normal: normal.length,
      total: allOpen.length
    };
  }, [openAdmissions]);

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
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Latest Admissions in Pakistan 2026
            </h2>
            <p className="text-gray-600">Loading latest admissions...</p>
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
        
        {/* Headings */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Admissions 2026 in Pakistan
          </h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            ⏰ {closingSoonStats.thisWeek} Admissions Closing This Week
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            {closingSoonStats.urgent > 0 && (
              <span className="text-red-600 font-semibold">{closingSoonStats.urgent} urgent admissions</span>
            )} closing in next 3 days. Apply now for {openAdmissions.length} open admissions across Pakistan.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setUrgencyFilter('all')}
            className={`bg-blue-50 rounded-xl p-4 text-center border transition-all ${
              urgencyFilter === 'all' ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-100' : 'border-blue-100'
            }`}
          >
            <div className="text-3xl font-bold text-blue-600">{openAdmissions.length}</div>
            <div className="text-sm text-gray-600">All Admissions</div>
          </button>
          <button
            onClick={() => setUrgencyFilter('urgent')}
            className={`bg-red-50 rounded-xl p-4 text-center border transition-all ${
              urgencyFilter === 'urgent' ? 'border-red-500 ring-2 ring-red-200 bg-red-100' : 'border-red-100'
            }`}
          >
            <div className="text-3xl font-bold text-red-600">{closingSoonStats.urgent}</div>
            <div className="text-sm text-gray-600">Urgent (≤3 days)</div>
          </button>
          <button
            onClick={() => setUrgencyFilter('warning')}
            className={`bg-orange-50 rounded-xl p-4 text-center border transition-all ${
              urgencyFilter === 'warning' ? 'border-orange-500 ring-2 ring-orange-200 bg-orange-100' : 'border-orange-100'
            }`}
          >
            <div className="text-3xl font-bold text-orange-600">{closingSoonStats.thisWeek - closingSoonStats.urgent}</div>
            <div className="text-sm text-gray-600">Warning (4-7 days)</div>
          </button>
          <button
            onClick={() => setUrgencyFilter('normal')}
            className={`bg-green-50 rounded-xl p-4 text-center border transition-all ${
              urgencyFilter === 'normal' ? 'border-green-500 ring-2 ring-green-200 bg-green-100' : 'border-green-100'
            }`}
          >
            <div className="text-3xl font-bold text-green-600">{closingSoonStats.normal}</div>
            <div className="text-sm text-gray-600">Normal (8+ days)</div>
          </button>
        </div>

        {/* Search and Filter */}
        {filteredByUrgency.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Search by university or program..."
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {uniqueUniversities.map((uni) => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Cards Grid - New Layout */}
        {filteredAdmissions.length > 0 ? (
          <div className="space-y-4">
            {filteredAdmissions.map((admission) => {
              const daysLeft = getDaysLeft(admission.expectedCloseDate);
              const isUrgent = daysLeft !== null && daysLeft <= 3;
              const isWarning = daysLeft !== null && daysLeft <= 7 && daysLeft > 3;
              
              return (
                <Link
                  key={admission.id}
                  href={`/admissions/${admission.slug}`}
                  className={`block rounded-xl border transition-all hover:shadow-md ${
                    isUrgent ? 'border-red-200 bg-red-50/30 hover:bg-red-50' :
                    isWarning ? 'border-orange-200 bg-orange-50/20 hover:bg-orange-50' :
                    'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* Card Header - Title + Days Left */}
                  <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition">
                      {admission.instituteName} Admissions {admission.year}
                    </h3>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      isUrgent ? 'bg-red-100 text-red-700 animate-pulse' :
                      isWarning ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      <span>⏰</span>
                      <span>{daysLeft ? `${daysLeft} days left` : 'Deadline TBA'}</span>
                    </div>
                  </div>
                  
                  {/* Card Body - Programs & Details */}
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span>🎓</span>
                        <span className="font-medium">{getProgramDisplay(admission.programs || [])}</span>
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1">
                        <span>🏛️</span>
                        <span>{admission.instituteName}</span>
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1">
                        <span>📅</span>
                        <span>{admission.session || 'Fall'} {admission.year}</span>
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1">
                        <span>⏰</span>
                        <span>Last Date: {formatDate(admission.expectedCloseDate)}</span>
                      </span>
                    </div>
                    
                    {admission.programs && admission.programs.length > 1 && (
                      <div className="mt-2 text-xs text-gray-500">
                        📚 {admission.programs.length} programs available
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {urgencyFilter === 'urgent' && 'No Urgent Admissions Right Now'}
              {urgencyFilter === 'warning' && 'No Admissions in Warning Period'}
              {urgencyFilter === 'normal' && 'No Admissions in Normal Period'}
              {urgencyFilter === 'all' && 'No Admissions Closing Soon'}
            </h3>
            {urgencyFilter !== 'all' && (
              <button
                onClick={() => setUrgencyFilter('all')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View All Admissions
              </button>
            )}
          </div>
        )}

        {/* View All Link */}
        {sortedAdmissionsByUrgency.length > 5 && urgencyFilter === 'all' && (
          <div className="text-center mt-8">
            <Link
              href="/admissions"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              Browse all {openAdmissions.length} university admissions 2026 in Pakistan →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}