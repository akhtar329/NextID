// app/(public)/admissions/[slug]/AdmissionClient.tsx
'use client';

import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';

// ==================== TYPES ====================
interface ProgramWithDetails {
  id: number;
  name: string;
  slug: string;
  degreeName: string | null;
  overview: string | null;
  eligibility: string | null;
  duration: string | null;
  careerScope: string | null;
  feeRange: string | null;
}

interface InstituteType {
  id: number;
  name: string;
  slug: string;
  type: string | null;
  description: string | null;
  website: string | null;
  city: { id: number; name: string; slug: string; province: string | null; } | null;
}

interface AdmissionWithPrograms {
  id: number;
  name: string;
  slug: string;
  year: number;
  session: string | null;
  status: 'Expected' | 'Open' | 'Closed';
  expectedOpenDate: string | null;
  expectedCloseDate: string | null;
  meritInfo: string | null;
  note: string | null;
  officialLink: string | null;
  institute: InstituteType | null;
  programs: ProgramWithDetails[];
  programCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

interface RelatedAdmission {
  id: number;
  name: string;
  slug: string;
  year: number;
  session: string | null;
  status: string;
  instituteName: string;
  instituteSlug: string;
}

interface CityAdmission {
  id: number;
  name: string;
  slug: string;
  year: number;
  session: string | null;
  status: string;
  instituteName: string;
  instituteSlug: string;
}

interface AdmissionClientProps {
  data: {
    admission: AdmissionWithPrograms;
    relatedAdmissions: RelatedAdmission[];
    cityAdmissions: CityAdmission[];
    statusBadge: any;
    daysRemaining: number | null;
    undergradPrograms: ProgramWithDetails[];
    gradPrograms: ProgramWithDetails[];
    diplomaPrograms: ProgramWithDetails[];
    formattedPostedDate: string;
    formattedLastDate: string;
    formattedDeadline: string;
    formattedOpenDate: string;
    formattedLastUpdated: string;
  };
}

// ==================== CLIENT COMPONENT ====================
export default function AdmissionClient({ data }: AdmissionClientProps) {
  const {
    admission,
    relatedAdmissions,
    cityAdmissions,
    statusBadge,
    daysRemaining,
    undergradPrograms,
    gradPrograms,
    diplomaPrograms,
    formattedPostedDate,
    formattedLastDate,
    formattedDeadline,
    formattedOpenDate,
    formattedLastUpdated,
  } = data;

  // State for active section tracking
  const [activeSection, setActiveSection] = useState('about');
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Combine ALL programs
  const allPrograms = [...undergradPrograms, ...gradPrograms, ...diplomaPrograms];
  const programsToShow = allPrograms.length > 0 ? allPrograms : admission.programs || [];

  // Prepare city universities data
  const cityUniversities = cityAdmissions.reduce((acc: any[], adm: any) => {
    const existingIndex = acc.findIndex(u => u.slug === adm.instituteSlug);
    if (existingIndex === -1) {
      acc.push({
        name: adm.instituteName,
        slug: adm.instituteSlug,
        type: admission.institute?.type || 'University',
        admissionCount: 1,
        key: `uni-${adm.instituteSlug}`
      });
    } else {
      acc[existingIndex].admissionCount += 1;
    }
    return acc;
  }, []);

  // Prepare related admissions
  const relatedAdmissionsList = relatedAdmissions.map((adm, index) => ({
    id: adm.id,
    name: adm.name,
    slug: adm.slug,
    year: adm.year,
    session: adm.session,
    status: adm.status,
    key: `related-${adm.id}-${index}`
  }));

  // Define sections for navigation
  const sections = [
    { id: 'about', label: 'Overview', show: true },
    { id: 'programs', label: 'Programs', show: programsToShow.length > 0 },
    { id: 'eligibility', label: 'Eligibility', show: true },
    { id: 'merit', label: 'Merit', show: !!admission.meritInfo },
    { id: 'how-to-apply', label: 'How to Apply', show: true },
    { id: 'documents', label: 'Documents', show: true },
    { id: 'faq', label: 'FAQ', show: true },
    { id: 'deadline', label: 'Deadline', show: true },
  ].filter(section => section.show);

  // Track active section on scroll
  useEffect(() => {
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

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        sectionRefs.current[section.id] = element;
        observer.observe(element);
      }
    });

    return () => {
      sections.forEach((section) => {
        if (sectionRefs.current[section.id]) {
          observer.unobserve(sectionRefs.current[section.id]!);
        }
      });
    };
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const currentIndex = sections.findIndex(s => s.id === activeSection);
  const progressPercentage = ((currentIndex + 1) / sections.length) * 100;

  return (
    <main className="min-h-screen bg-gray-50" suppressHydrationWarning>
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap">
            <Link href="/" className="text-gray-500 hover:text-orange-500 transition">Home</Link>
            <span className="text-gray-400">›</span>
            <Link href="/admissions" className="text-gray-500 hover:text-orange-500 transition">Admissions</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-800 font-medium line-clamp-1">
              {admission.institute?.name} Admissions {admission.year}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-50 to-white rounded-2xl p-6 md:p-8 mb-6 border border-orange-100">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏛️</span>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {admission.name}
                </h1>
              </div>
              
              <div className="text-xl md:text-2xl font-semibold text-orange-600 mb-3">
                {admission.institute?.name}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusBadge.bg} ${statusBadge.text}`}>
                  {statusBadge.icon} {statusBadge.label}
                </span>
                {admission.session && (
                  <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
                    📅 Session: {admission.session} {admission.year}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-gray-600 text-sm">
                <span>📍 {admission.institute?.city?.name}, {admission.institute?.city?.province || 'Pakistan'}</span>
                {admission.institute?.type && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span>🏢 {admission.institute.type}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {admission.officialLink && admission.status === 'Open' && (
                <a
                  href={admission.officialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold text-center transition shadow-md hover:shadow-lg"
                >
                  📝 Apply Now
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="text-2xl mb-2">📅</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Posted Date</div>
            <div className="font-bold text-gray-800">{formattedPostedDate}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="text-2xl mb-2">🎓</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Programs</div>
            <div className="font-bold text-gray-800">{admission.programCount} Programs</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="text-2xl mb-2">🏛️</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Institute Type</div>
            <div className="font-bold text-gray-800">{admission.institute?.type || 'University'}</div>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN - MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section 1: About Admission */}
            <section id="about" className="scroll-mt-24">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📝</span> About This Admission
                </h2>
                
                {admission.note ? (
                  <div 
                    className="text-gray-700 leading-relaxed prose prose-orange max-w-none"
                    dangerouslySetInnerHTML={{ __html: admission.note }}
                  />
                ) : (
                  <div className="text-gray-700 leading-relaxed space-y-3">
                    <p>
                      <strong>{admission.institute?.name}</strong>, located in {admission.institute?.city?.name}, 
                      has announced admissions for the {admission.session || 'Fall'} {admission.year} session.
                      {admission.programCount > 0 && ` The university is offering admission in ${admission.programCount} different programs.`}
                    </p>
                    <p>
                      {admission.status === 'Open' 
                        ? `Applications are currently being accepted.`
                        : admission.status === 'Expected'
                          ? `Applications will open on ${formattedOpenDate}. Stay tuned for updates.`
                          : `Applications for this session are now closed.`
                      }
                    </p>
                  </div>
                )}
              </div>
            </section>
            
            {/* Section 2: Offered Programs */}
            {programsToShow.length > 0 && (
              <section id="programs" className="scroll-mt-24">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>🎓</span> Offered Programs ({programsToShow.length})
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {programsToShow.map((program, index) => (
                      <div key={`program-${program.id}-${index}`} className="border rounded-lg p-4 hover:shadow-md transition hover:border-orange-200">
                        <Link href={`/programs/${program.slug}`} className="text-lg font-semibold text-orange-600 hover:underline">
                          {program.name}
                        </Link>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                          {program.duration && (
                            <span className="flex items-center gap-1">
                              <span>⏱️</span> {program.duration}
                            </span>
                          )}
                          {program.feeRange && (
                            <span className="flex items-center gap-1">
                              <span>💰</span> {program.feeRange}
                            </span>
                          )}
                          {program.degreeName && (
                            <span className="flex items-center gap-1">
                              <span>🎓</span> {program.degreeName}
                            </span>
                          )}
                        </div>
                        {program.eligibility && (
                          <p className="text-sm text-gray-600 mt-2 border-t pt-2">
                            <span className="font-medium">✅ Eligibility:</span> {program.eligibility.substring(0, 100)}
                            {program.eligibility.length > 100 && '...'}
                          </p>
                        )}
                        <div className="flex gap-3 mt-3">
                          <Link href={`/programs/${program.slug}`} className="text-sm text-orange-600 hover:underline">
                            View Details →
                          </Link>
                          {admission.officialLink && admission.status === 'Open' && (
                            <a href={admission.officialLink} target="_blank" className="text-sm text-green-600 hover:underline">
                              Apply Now →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
            
            {/* Section 3: Eligibility Criteria */}
            <section id="eligibility" className="scroll-mt-24">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>✅</span> Eligibility Criteria
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  {admission.meritInfo ? (
                    <div className="text-gray-700 leading-relaxed">
                      {admission.meritInfo}
                    </div>
                  ) : (
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Intermediate (FA / FSc / ICS or equivalent) from a recognized board for undergraduate programs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Bachelor's degree (16 years) for graduate programs with minimum 2.5 CGPA or 50% marks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Entry test as per university policy (where applicable)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Admission based on merit and university admission policy</span>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </section>
            
            {/* Section 4: Merit Information */}
            {admission.meritInfo && (
              <section id="merit" className="scroll-mt-24">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📊</span> Merit Information
                  </h2>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {admission.meritInfo}
                  </div>
                </div>
              </section>
            )}
            
            {/* Section 5: How to Apply */}
            <section id="how-to-apply" className="scroll-mt-24">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📋</span> How to Apply
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">1</div>
                    <div><span className="font-medium">Visit Official Website:</span> Go to <a href={admission.institute?.website || '#'} className="text-orange-600 hover:underline" target="_blank" rel="noopener noreferrer">{admission.institute?.website || 'university website'}</a></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">2</div>
                    <div><span className="font-medium">Register Online:</span> Create an account on the admissions portal</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">3</div>
                    <div><span className="font-medium">Fill Application Form:</span> Complete the application with accurate information</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">4</div>
                    <div><span className="font-medium">Upload Documents:</span> Upload scanned copies of required documents</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">5</div>
                    <div><span className="font-medium">Pay Application Fee:</span> Submit fee via bank challan or online payment</div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Section 6: Required Documents */}
            <section id="documents" className="scroll-mt-24">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📄</span> Required Documents
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Educational certificates and transcripts',
                    'CNIC or B-Form',
                    'Passport-sized photographs (4 copies)',
                    'Entry test score card (if applicable)',
                    'Domicile certificate',
                    'Character certificate',
                    'Last degree certificate (for graduate programs)',
                    'Experience certificate (if required)'
                  ].map((doc, i) => (
                    <div key={`doc-${i}`} className="flex items-center gap-2">
                      <span className="text-green-500">☑️</span>
                      <span className="text-gray-700 text-sm">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            
            {/* Section 7: FAQ */}
            <section id="faq" className="scroll-mt-24">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>❓</span> Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  <details key="faq-1" className="group border-b pb-3">
                    <summary className="font-semibold text-gray-800 cursor-pointer list-none flex items-center justify-between">
                      <span>What is the last date to apply?</span>
                      <span className="text-orange-500 group-open:rotate-180 transition">▼</span>
                    </summary>
                    <p className="text-gray-600 mt-2 pl-4">The last date to submit your application is {formattedDeadline}.</p>
                  </details>
                  <details key="faq-2" className="group border-b pb-3">
                    <summary className="font-semibold text-gray-800 cursor-pointer list-none flex items-center justify-between">
                      <span>Is there any entry test?</span>
                      <span className="text-orange-500 group-open:rotate-180 transition">▼</span>
                    </summary>
                    <p className="text-gray-600 mt-2 pl-4">Entry test requirements vary by program. Please check the official advertisement or contact the admission office for details.</p>
                  </details>
                  <details key="faq-3" className="group border-b pb-3">
                    <summary className="font-semibold text-gray-800 cursor-pointer list-none flex items-center justify-between">
                      <span>Can I apply for multiple programs?</span>
                      <span className="text-orange-500 group-open:rotate-180 transition">▼</span>
                    </summary>
                    <p className="text-gray-600 mt-2 pl-4">Yes, you can apply for multiple programs. However, a separate application may be required for each program.</p>
                  </details>
                  <details key="faq-4" className="group border-b pb-3">
                    <summary className="font-semibold text-gray-800 cursor-pointer list-none flex items-center justify-between">
                      <span>Is hostel facility available?</span>
                      <span className="text-orange-500 group-open:rotate-180 transition">▼</span>
                    </summary>
                    <p className="text-gray-600 mt-2 pl-4">Please contact the university directly for hostel availability and accommodation details.</p>
                  </details>
                  <details key="faq-5" className="group">
                    <summary className="font-semibold text-gray-800 cursor-pointer list-none flex items-center justify-between">
                      <span>What is the application fee?</span>
                      <span className="text-orange-500 group-open:rotate-180 transition">▼</span>
                    </summary>
                    <p className="text-gray-600 mt-2 pl-4">Application fee details are mentioned in the official advertisement. Please check the university website for exact amount.</p>
                  </details>
                </div>
              </div>
            </section>
            
            {/* Section 8: Deadline - AT THE BOTTOM (Prominent) */}
            <section id="deadline" className="scroll-mt-24">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg border border-orange-400">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <span className="text-3xl">⏰</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Application Deadline</h2>
                    <p className="text-orange-100 text-sm">Don't miss the opportunity to apply</p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 my-4 text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">
                    {formattedLastDate !== 'TBA' ? formattedLastDate : 'TBA'}
                  </div>
                  {daysRemaining && daysRemaining > 0 && admission.status === 'Open' && (
                    <div className="inline-block bg-white/20 rounded-full px-4 py-2">
                      <span className="text-lg font-semibold">
                        ⚡ {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining to apply
                      </span>
                    </div>
                  )}
                  {admission.status === 'Closed' && (
                    <div className="inline-block bg-white/20 rounded-full px-4 py-2">
                      <span className="text-lg font-semibold">❌ Applications are now closed</span>
                    </div>
                  )}
                  {admission.status === 'Expected' && (
                    <div className="inline-block bg-white/20 rounded-full px-4 py-2">
                      <span className="text-lg font-semibold">📅 Opening on {formattedOpenDate}</span>
                    </div>
                  )}
                </div>
                
                {admission.officialLink && admission.status === 'Open' && (
                  <div className="text-center">
                    <a
                      href={admission.officialLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-white text-orange-600 hover:bg-orange-50 px-8 py-3 rounded-xl font-bold text-lg transition shadow-lg hover:shadow-xl"
                    >
                      📝 Apply Now → Apply Before Deadline
                    </a>
                  </div>
                )}
                
                <p className="text-xs text-orange-100 text-center mt-4">
                  * Late applications may not be accepted
                </p>
              </div>
            </section>
            
          </div>
          
          {/* RIGHT COLUMN - STICKY SIDEBAR (No Deadline Here) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              
              {/* About University Card */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-orange-200">
                  <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                  <h3 className="font-bold text-gray-900">About {admission.institute?.name?.split(' ')[0] || 'University'}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500">🏛️</span>
                    <span className="text-gray-700">Type: {admission.institute?.type || 'University'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500">🎓</span>
                    <span className="text-gray-700">Programs: {programsToShow.length}+</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500">📍</span>
                    <span className="text-gray-700">{admission.institute?.city?.name}, {admission.institute?.city?.province || 'Pakistan'}</span>
                  </div>
                  {admission.institute?.website && (
                    <div className="flex items-start gap-2">
                      <span className="text-orange-500">🌐</span>
                      <a href={admission.institute.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                        {admission.institute.website.replace('https://', '').replace('http://', '')}
                      </a>
                    </div>
                  )}
                  {admission.institute?.description && (
                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                      {admission.institute.description.substring(0, 120)}...
                    </p>
                  )}
                </div>
              </div>
              
              {/* All Programs List (Sidebar) */}
              {programsToShow.length > 0 && (
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-orange-200">
                    <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                    <h3 className="font-bold text-gray-900">All Programs ({programsToShow.length})</h3>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {programsToShow.map((program, idx) => (
                      <Link 
                        key={`sidebar-program-${program.id}-${idx}`}
                        href={`/programs/${program.slug}`}
                        className="block p-2 bg-gray-50 rounded-lg hover:bg-orange-50 transition group"
                      >
                        <div className="font-medium text-gray-800 text-sm group-hover:text-orange-600">
                          {program.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {program.duration || 'Program'}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Other Universities in Same City */}
              {cityUniversities.length > 0 && (
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-orange-200">
                    <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                    <h3 className="font-bold text-gray-900">
                      Universities in {admission.institute?.city?.name}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {cityUniversities.slice(0, 4).map((uni, idx) => (
                      <Link
                        key={`uni-${uni.slug}-${idx}`}
                        href={`/universities/${uni.slug}`}
                        className="block p-2 bg-gray-50 rounded-lg hover:bg-orange-50 transition"
                      >
                        <div className="font-medium text-gray-800 text-sm">{uni.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {uni.type} • {uni.admissionCount} active admission{uni.admissionCount !== 1 ? 's' : ''}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* More Admissions from this University */}
              {relatedAdmissionsList.length > 0 && (
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-orange-200">
                    <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                    <h3 className="font-bold text-gray-900">
                      More from {admission.institute?.name?.split(' ')[0]}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {relatedAdmissionsList.slice(0, 3).map((adm, idx) => (
                      <Link
                        key={adm.key || `related-${adm.id}-${idx}`}
                        href={`/admissions/${adm.slug}`}
                        className="block p-2 bg-gray-50 rounded-lg hover:bg-orange-50 transition"
                      >
                        <div className="font-medium text-gray-800 text-sm">{adm.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {adm.session || 'Fall'} {adm.year}
                          {adm.status === 'Open' && <span className="ml-2 text-green-600">● Open</span>}
                          {adm.status === 'Expected' && <span className="ml-2 text-yellow-600">● Expected</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quick Navigation */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <span className="text-orange-500">📍</span>
                  <h3 className="font-bold text-gray-900 text-sm">Quick Navigation</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sections.map((section, idx) => (
                    <button
                      key={`nav-${section.id}-${idx}`}
                      onClick={() => scrollToSection(section.id)}
                      className={`px-3 py-1.5 text-xs rounded-full transition ${
                        activeSection === section.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-orange-100'
                      }`}
                    >
                      {section.label}
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
                    className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 text-center mt-2">
                  Section {currentIndex + 1} of {sections.length}
                </div>
              </div>
              
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}