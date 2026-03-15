// app/component/sections/CTASection.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CTASection = () => {
  const [hasActiveContent, setHasActiveContent] = useState(true); // Default true for static
  const [loading, setLoading] = useState(false);

  // Agar aap chahte hain ke CTA tabhi show ho jab kuch active ho
  useEffect(() => {
    const checkActiveContent = async () => {
      try {
        setLoading(true);
        
        // Check if there are any active admissions
        const admissionsRes = await fetch('/api/public/admissions?limit=1&status=open');
        const admissionsData = await admissionsRes.json();
        
        // Check if there are any recent results
        const resultsRes = await fetch('/api/public/results?limit=1');
        const resultsData = await resultsRes.json();
        
        // Check if there are any programs
        const programsRes = await fetch('/api/public/programs?limit=1');
        const programsData = await programsRes.json();
        
        // Agar kuch bhi data hai to CTA show karo
        const hasAdmissions = admissionsData.success && admissionsData.data?.length > 0;
        const hasResults = resultsData.success && resultsData.data?.length > 0;
        const hasPrograms = programsData.success && programsData.data?.length > 0;
        
        setHasActiveContent(hasAdmissions || hasResults || hasPrograms);
        
      } catch (error) {
        console.error('Error checking content:', error);
        // Error ki surat mein bhi CTA show karo
        setHasActiveContent(true);
      } finally {
        setLoading(false);
      }
    };

    // Agar conditional banana ho to ye uncomment karo
    // checkActiveContent();
    
  }, []);

  // Agar loading ho to skeleton show karo
  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="h-12 w-96 bg-white/20 rounded-lg animate-pulse mx-auto mb-6"></div>
            <div className="h-6 w-2/3 bg-white/20 rounded-lg animate-pulse mx-auto mb-10"></div>
            <div className="flex justify-center gap-6 mb-12">
              <div className="h-14 w-48 bg-white/20 rounded-lg animate-pulse"></div>
              <div className="h-14 w-48 bg-white/20 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Agar content nahi hai to hide karo
  if (!hasActiveContent) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Find the Best Educational Opportunities?
          </h2>
          
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
            Join thousands of students and parents who trust NextID for their educational journey. 
            Get access to comprehensive information about schools, colleges, admissions, and results.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            {/* Primary CTA */}
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg text-blue-600 bg-white hover:bg-gray-50 transition-all transform hover:-translate-y-1 hover:shadow-xl"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create Free Account
            </Link>
            
            {/* Secondary CTA */}
            <Link
              href="/education-centers"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg text-white bg-transparent border-2 border-white hover:bg-white/10 transition-all"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Explore Institutions
            </Link>
          </div>
          
          {/* Features/Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-white text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-2">Accurate Information</h3>
              <p className="text-blue-100">Verified details of 1000+ educational institutions</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-white text-3xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-2">Instant Updates</h3>
              <p className="text-blue-100">Real-time admission dates and result announcements</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-white text-3xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-white mb-2">Free Forever</h3>
              <p className="text-blue-100">No hidden charges, completely free for students</p>
            </div>
          </div>
          
          {/* Testimonial/Quote */}
          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">👨‍🎓</span>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-white font-semibold">Ali Raza</h4>
                <p className="text-blue-200 text-sm">Student - Aga Khan University</p>
              </div>
            </div>
            <blockquote className="text-xl italic text-white">
              "NextID helped me find the perfect college for my medical studies. The admission 
              information was accurate and saved me weeks of research!"
            </blockquote>
          </div>
          
          {/* Additional CTA */}
          <div className="mt-12 pt-8 border-t border-white/30">
            <p className="text-blue-200 mb-6">
              Have questions? Get in touch with our educational counselors
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 text-white bg-transparent border border-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Now: 021-XXXXXXX
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center justify-center px-6 py-3 text-white bg-transparent border border-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Visit FAQ Section
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;