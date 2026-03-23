// app/(public)/results/[slug]/ResultClient.tsx
'use client';

import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';

// ==================== TYPES ====================
interface ProgramType {
  id: number;
  name: string | null;
  slug: string | null;
  degreeId: number | null;
  overview: string | null;
  eligibility: string | null;
  duration: string | null;
  careerScope: string | null;
  feeRange: string | null;
}

interface CityType {
  id: number;
  name: string | null;
  slug: string | null;
  province: string | null;
}

interface InstituteType {
  id: number;
  name: string | null;
  slug: string | null;
  type: string | null;
  cityId: number | null;
  description: string | null;
  website: string | null;
  city: CityType | null;
}

interface BoardType {
  id: number;
  name: string | null;
  slug: string | null;
  cityId: number | null;
  website: string | null;
  description: string | null;
  city: CityType | null;
}

interface ResultType {
  id: number;
  slug: string | null;
  title: string | null;
  programId: number | null;
  instituteId: number | null;
  boardId: number | null;
  universityId: number | null;
  year: number | null;
  resultDate: string | null;
  officialLink: string | null;
  isPopular: boolean | null;
  status: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  program: ProgramType | null;
  institute: InstituteType | null;
  board: BoardType | null;
}

interface ResultClientProps {
  data: {
    result: ResultType;
    relatedResults: any[];
    cityResults: any[];
    statusBadge: any;
    daysRemaining: number | null;
    institutionName: string;
    institutionSlug: string;
    institutionType: string;
    cityName: string;
    provinceName: string;
    officialWebsite: string;
    formattedResultDate: string;
    formattedShortResultDate: string;
    formattedCreatedAt: string;
    formattedUpdatedAt: string;
  };
}

// ==================== CLIENT COMPONENT ====================
export default function ResultClient({ data }: ResultClientProps) {
  const {
    result,
    relatedResults,
    cityResults,
    statusBadge,
    daysRemaining,
    institutionName,
    institutionSlug,
    institutionType,
    cityName,
    provinceName,
    officialWebsite,
    formattedResultDate,
    formattedShortResultDate,
    formattedCreatedAt,
    formattedUpdatedAt,
  } = data;

  const [activeSection, setActiveSection] = useState('overview');
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Get official result link
  const officialResultLink = result.officialLink;

  // Track active section on scroll
  useEffect(() => {
    const sections = ['overview', 'how-to-check', 'program-details', 'statistics', 'faq'];
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            setActiveSection(sectionId);
          }
        });
      },
      {
        rootMargin: '-30% 0px -70% 0px',
        threshold: 0.3
      }
    );

    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        sectionRefs.current[sectionId] = element;
        observer.observe(element);
      }
    });

    return () => {
      sections.forEach((sectionId) => {
        if (sectionRefs.current[sectionId]) {
          observer.unobserve(sectionRefs.current[sectionId]!);
        }
      });
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen bg-gray-50" suppressHydrationWarning>
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap">
            <Link href="/" className="text-gray-500 hover:text-green-500 transition">Home</Link>
            <span className="text-gray-400">›</span>
            <Link href="/results" className="text-gray-500 hover:text-green-500 transition">Results</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-800 font-medium line-clamp-1">
              {result.title || `${result.program?.name || 'Exam'} Result ${result.year}`}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-50 to-white rounded-2xl p-6 md:p-8 mb-6 border border-green-100">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📊</span>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {result.title || `${result.program?.name || 'Exam'} Result ${result.year}`}
                </h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-gray-600">
                {institutionName && institutionSlug && (
                  <>
                    <Link 
                      href={`/${institutionType}/${institutionSlug}`}
                      className="text-green-600 hover:underline font-medium"
                    >
                      {institutionName}
                    </Link>
                    {cityName && (
                      <>
                        <span className="text-gray-400">•</span>
                        <Link 
                          href={`/cities/${result.institute?.city?.slug || result.board?.city?.slug}`}
                          className="hover:text-green-600"
                        >
                          {cityName}{provinceName ? `, ${provinceName}` : ''}
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusBadge.bg} ${statusBadge.text}`}>
                  {statusBadge.icon} {statusBadge.label}
                </span>
                {result.isPopular && (
                  <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
                    ⭐ Popular Result
                  </span>
                )}
                {daysRemaining && daysRemaining > 0 && !result.status && (
                  <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium">
                    ⏰ Expected in {daysRemaining} days
                  </span>
                )}
              </div>
            </div>
            
            {/* ✅ OFFICIAL RESULT LINK BUTTON - PRIMARY CTA */}
            {officialResultLink ? (
              <a
                href={officialResultLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold text-center transition shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <span>📄</span>
                Check Result Online
                <span>→</span>
              </a>
            ) : (
              <div className="bg-gray-100 text-gray-500 px-6 py-3 rounded-xl font-semibold text-center cursor-not-allowed">
                ⏳ Result Link Coming Soon
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="text-2xl mb-2">📅</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Year</div>
            <div className="font-bold text-gray-800">{result.year || 'N/A'}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="text-2xl mb-2">⏰</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Result Date</div>
            <div className="font-bold text-gray-800">{formattedResultDate || 'TBA'}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="text-2xl mb-2">🎓</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Program</div>
            <div className="font-bold text-gray-800">{result.program?.name || 'General'}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="text-2xl mb-2">⏱️</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Duration</div>
            <div className="font-bold text-gray-800">{result.program?.duration || 'N/A'}</div>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN - MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section 1: Overview */}
            <section id="overview" className="scroll-mt-24">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📝</span> Result Overview
                </h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p>
                    <strong>{result.program?.name || 'The examination'}</strong> result for the year <strong>{result.year}</strong> 
                    has been announced by <strong>{institutionName}</strong> in {cityName}{provinceName ? `, ${provinceName}` : ''}.
                  </p>
                  <p>
                    {result.status 
                      ? `The result was published on ${formattedResultDate}. Students can now check their results online.`
                      : `The result is expected to be announced on ${formattedResultDate}. Students are advised to keep their roll numbers ready.`
                    }
                  </p>
                  {result.program?.overview && (
                    <p>{result.program.overview}</p>
                  )}
                  
                  {/* ✅ Official Result Link in Content */}
                  {officialResultLink && result.status && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-medium text-green-800 mb-2">✅ Result Available Online</p>
                      <a 
                        href={officialResultLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline font-medium break-all"
                      >
                        🔗 {officialResultLink.replace('https://', '').replace('http://', '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </section>
            
            {/* Section 2: How to Check Result */}
            <section id="how-to-check" className="scroll-mt-24">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📋</span> How to Check Result
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">1</div>
                    <div>
                      <span className="font-medium">Click on Official Result Link:</span>{' '}
                      {officialResultLink ? (
                        <a 
                          href={officialResultLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline"
                        >
                          Check Result Online
                        </a>
                      ) : (
                        <span className="text-gray-500">Link will be available soon</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">2</div>
                    <div><span className="font-medium">Visit Official Website:</span> Go to <a href={officialWebsite || '#'} className="text-green-600 hover:underline" target="_blank">{institutionName.toLowerCase()}.edu.pk</a></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">3</div>
                    <div><span className="font-medium">Navigate to Results Section:</span> Click on the "Results" or "Examinations" tab</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">4</div>
                    <div><span className="font-medium">Select Examination:</span> Choose {result.program?.name || 'your program'} and year {result.year}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">5</div>
                    <div><span className="font-medium">Enter Roll Number:</span> Input your roll number correctly</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">6</div>
                    <div><span className="font-medium">View and Download:</span> Check your result and download the marksheet</div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Section 3: Program Details */}
            {result.program && (
              <section id="program-details" className="scroll-mt-24">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>🎓</span> Program Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.program.duration && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-500">Duration</div>
                        <div className="font-semibold">{result.program.duration}</div>
                      </div>
                    )}
                    {result.program.feeRange && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-500">Fee Range</div>
                        <div className="font-semibold">{result.program.feeRange}</div>
                      </div>
                    )}
                    {result.program.eligibility && (
                      <div className="bg-gray-50 rounded-lg p-3 md:col-span-2">
                        <div className="text-sm text-gray-500">Eligibility Criteria</div>
                        <div className="text-sm">{result.program.eligibility}</div>
                      </div>
                    )}
                    {result.program.careerScope && (
                      <div className="bg-gray-50 rounded-lg p-3 md:col-span-2">
                        <div className="text-sm text-gray-500">Career Scope</div>
                        <div className="text-sm">{result.program.careerScope}</div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
            
            {/* Section 4: Statistics & Analysis */}
            <section id="statistics" className="scroll-mt-24">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📊</span> Statistics & Analysis
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">—</div>
                    <div className="text-sm text-gray-600">Pass Percentage</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">—</div>
                    <div className="text-sm text-gray-600">Total Students</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">—</div>
                    <div className="text-sm text-gray-600">Top Positions</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm text-center">
                  Complete statistics will be available after the result announcement.
                </p>
              </div>
            </section>
            
            {/* Section 5: FAQ */}
            <section id="faq" className="scroll-mt-24">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>❓</span> Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  <details className="group border-b pb-3">
                    <summary className="font-semibold text-gray-800 cursor-pointer list-none flex items-center justify-between">
                      <span>When was the {result.program?.name || 'exam'} result {result.year} announced?</span>
                      <span className="text-green-500 group-open:rotate-180 transition">▼</span>
                    </summary>
                    <p className="text-gray-600 mt-2 pl-4">The result was announced on {formattedResultDate}.</p>
                  </details>
                  <details className="group border-b pb-3">
                    <summary className="font-semibold text-gray-800 cursor-pointer list-none flex items-center justify-between">
                      <span>How can I check my result online?</span>
                      <span className="text-green-500 group-open:rotate-180 transition">▼</span>
                    </summary>
                    <p className="text-gray-600 mt-2 pl-4">
                      {officialResultLink ? (
                        <>Click on the <a href={officialResultLink} target="_blank" className="text-green-600 hover:underline">official result link</a> above or visit the official website of {institutionName}.</>
                      ) : (
                        <>Visit the official website of {institutionName}, go to the results section, enter your roll number, and submit.</>
                      )}
                    </p>
                  </details>
                  <details className="group border-b pb-3">
                    <summary className="font-semibold text-gray-800 cursor-pointer list-none flex items-center justify-between">
                      <span>What if I forget my roll number?</span>
                      <span className="text-green-500 group-open:rotate-180 transition">▼</span>
                    </summary>
                    <p className="text-gray-600 mt-2 pl-4">Contact your institution or the examination department. You may need to provide your name, father's name, and date of birth.</p>
                  </details>
                  <details className="group border-b pb-3">
                    <summary className="font-semibold text-gray-800 cursor-pointer list-none flex items-center justify-between">
                      <span>Can I get a physical copy of my marksheet?</span>
                      <span className="text-green-500 group-open:rotate-180 transition">▼</span>
                    </summary>
                    <p className="text-gray-600 mt-2 pl-4">Yes, original marksheets are issued by the institution. Contact your college or board office for distribution details.</p>
                  </details>
                  <details className="group">
                    <summary className="font-semibold text-gray-800 cursor-pointer list-none flex items-center justify-between">
                      <span>What is the passing percentage this year?</span>
                      <span className="text-green-500 group-open:rotate-180 transition">▼</span>
                    </summary>
                    <p className="text-gray-600 mt-2 pl-4">The pass percentage will be released along with the result announcement.</p>
                  </details>
                </div>
              </div>
            </section>
            
          </div>
          
          {/* RIGHT COLUMN - STICKY SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              
              {/* About Institution Card */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-200">
                  <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                  <h3 className="font-bold text-gray-900">About {institutionName.split(' ')[0] || 'Institution'}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-green-500">🏛️</span>
                    <span className="text-gray-700">{institutionName}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500">📍</span>
                    <span className="text-gray-700">{cityName}{provinceName ? `, ${provinceName}` : ''}</span>
                  </div>
                  {result.program?.duration && (
                    <div className="flex items-start gap-2">
                      <span className="text-green-500">⏱️</span>
                      <span className="text-gray-700">Duration: {result.program.duration}</span>
                    </div>
                  )}
                  {/* ✅ Official Website Link */}
                  {officialWebsite && (
                    <div className="flex items-start gap-2">
                      <span className="text-green-500">🌐</span>
                      <a 
                        href={officialWebsite} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {officialWebsite.replace('https://', '').replace('http://', '')}
                      </a>
                    </div>
                  )}
                  {result.institute?.description && (
                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                      {result.institute.description.substring(0, 120)}...
                    </p>
                  )}
                  {result.board?.description && (
                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                      {result.board.description.substring(0, 120)}...
                    </p>
                  )}
                </div>
                {officialWebsite && (
                  <a
                    href={officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block text-center text-sm text-green-600 hover:underline"
                  >
                    🌐 Visit Official Website
                  </a>
                )}
              </div>
              
              {/* Related Results */}
              {relatedResults.length > 0 && (
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-200">
                    <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                    <h3 className="font-bold text-gray-900">Related Results</h3>
                  </div>
                  <div className="space-y-2">
                    {relatedResults.slice(0, 4).map((r, idx) => (
                      <Link
                        key={idx}
                        href={`/results/${r.slug}`}
                        className="block p-2 bg-gray-50 rounded-lg hover:bg-green-50 transition"
                      >
                        <div className="font-medium text-gray-800 text-sm">{r.title || `Result ${r.year}`}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {r.instituteName || r.boardName} • {r.resultDate ? new Date(r.resultDate).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' }) : r.year}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Results in Same City */}
              {cityResults.length > 0 && (
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-200">
                    <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                    <h3 className="font-bold text-gray-900">Results in {cityName}</h3>
                  </div>
                  <div className="space-y-2">
                    {cityResults.slice(0, 3).map((r, idx) => (
                      <Link
                        key={idx}
                        href={`/results/${r.slug}`}
                        className="block p-2 bg-gray-50 rounded-lg hover:bg-green-50 transition"
                      >
                        <div className="font-medium text-gray-800 text-sm">{r.title || `Result ${r.year}`}</div>
                        <div className="text-xs text-gray-500 mt-1">{r.instituteName || r.boardName}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quick Navigation */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <span className="text-green-500">📍</span>
                  <h3 className="font-bold text-gray-900 text-sm">Quick Navigation</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'how-to-check', label: 'How to Check' },
                    { id: 'program-details', label: 'Program Details' },
                    { id: 'statistics', label: 'Statistics' },
                    { id: 'faq', label: 'FAQ' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`px-3 py-1.5 text-xs rounded-full transition ${
                        activeSection === item.id
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Progress Indicator */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Reading Progress</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(() => {
                      const sections = ['overview', 'how-to-check', 'program-details', 'statistics', 'faq'];
                      const index = sections.findIndex(s => s === activeSection);
                      return ((index + 1) / sections.length) * 100;
                    })()}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 text-center mt-2">
                  Section {(() => {
                    const sections = ['overview', 'how-to-check', 'program-details', 'statistics', 'faq'];
                    return sections.findIndex(s => s === activeSection) + 1;
                  })()} of 5
                </div>
              </div>
              
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Last updated: {formattedUpdatedAt}</p>
          <p className="mt-1">© {new Date().getFullYear()} NextID.pk - Pakistan's Premier Educational Portal</p>
        </div>
      </div>
      
      {/* Article Schema */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": `${result.program?.name || 'Exam'} Result ${result.year} - ${institutionName}`,
            "description": `Check ${result.program?.name || 'exam'} result ${result.year} for ${institutionName}`,
            "author": { "@type": "Organization", "name": "NextID.pk" },
            "publisher": { "@type": "Organization", "name": "NextID.pk", "logo": { "@type": "ImageObject", "url": "https://www.nextid.pk/logo.png" } },
            "datePublished": result.createdAt,
            "dateModified": result.updatedAt,
            "mainEntityOfPage": { "@type": "WebPage", "@id": `https://www.nextid.pk/results/${result.slug}` }
          })
        }}
      />
    </main>
  );
}