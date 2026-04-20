// app/component/sections/Home/AdmissionSection.tsx
// ✅ Server Component - Responsive Design (Mobile Optimized)

import Link from 'next/link';
import { db } from '@/app/lib/db';
import { admissions, institutes, cities, programOfferings, programs, degrees } from '@/app/lib/schema';
import { eq, desc, and, sql } from 'drizzle-orm'; // ✅ Removed unused 'isNull'

// Types matching your actual schema
interface Program {
  id: number;
  name: string;
  slug: string;
  degreeName?: string;
}

interface Admission {
  id: number;
  name: string;
  slug: string;
  year: number;
  session: string | null;
  status: string;
  expectedCloseDate: Date | null;
  expectedOpenDate: Date | null;
  instituteId: number | null;
  instituteName: string | null;
  instituteSlug: string | null;
  instituteCity: string | null;
  programs: Program[];
}

// Server-side data fetching with proper relations
async function getAdmissions(): Promise<Admission[]> {
  try {
    // Fetch admissions with institute and city info
    const admissionsData = await db
      .select({
        id: admissions.id,
        name: admissions.name,
        slug: admissions.slug,
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        expectedCloseDate: admissions.expectedCloseDate,
        expectedOpenDate: admissions.expectedOpenDate,
        instituteId: admissions.instituteId,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        instituteCity: cities.name,
      })
      .from(admissions)
      .leftJoin(institutes, eq(admissions.instituteId, institutes.id))
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .where(
        and(
          eq(admissions.status, 'Open'),
          sql`${admissions.expectedCloseDate} > NOW() OR ${admissions.expectedCloseDate} IS NULL`
        )
      )
      .orderBy(desc(admissions.year))
      .limit(50);

    // Fetch programs for each admission through admissionOfferings and programOfferings
    const admissionsWithPrograms = await Promise.all(
      admissionsData.map(async (admission) => {
        // Get program offerings for this admission
        const offerings = await db
          .select({
            programId: programs.id,
            programName: programs.name,
            programSlug: programs.slug,
            degreeName: degrees.name,
          })
          .from(programOfferings)
          .innerJoin(
            sql`admission_offerings`,
            sql`admission_offerings.offering_id = ${programOfferings.id}`
          )
          .innerJoin(programs, eq(programOfferings.programId, programs.id))
          .leftJoin(degrees, eq(programOfferings.degreeId, degrees.id))
          .where(sql`admission_offerings.admission_id = ${admission.id}`)
          .limit(5);

        const programsList = offerings.map((o) => ({
          id: o.programId,
          name: o.programName,
          slug: o.programSlug,
          degreeName: o.degreeName || undefined,
        }));

        return {
          ...admission,
          expectedCloseDate: admission.expectedCloseDate,
          expectedOpenDate: admission.expectedOpenDate,
          programs: programsList,
        };
      })
    );

    return admissionsWithPrograms;
  } catch (error) {
    console.error('Error fetching admissions:', error);
    return [];
  }
}

// Helper functions (pure functions - no side effects)
function getDaysLeft(date: Date | null): number | null {
  if (!date) return null;
  try {
    const deadline = new Date(date);
    const now = new Date();
    deadline.setHours(23, 59, 59, 999);
    now.setHours(23, 59, 59, 999);
    
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : null;
  } catch {
    return null;
  }
}

function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  try {
    return date.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
}

function getProgramDisplay(programs: Program[]): string {
  if (!programs || programs.length === 0) return 'Multiple Programs';
  if (programs.length === 1) {
    const program = programs[0];
    return program.degreeName ? `${program.degreeName} in ${program.name}` : program.name;
  }
  if (programs.length === 2) {
    const p1 = programs[0].degreeName ? programs[0].degreeName : programs[0].name;
    const p2 = programs[1].degreeName ? programs[1].degreeName : programs[1].name;
    return `${p1} & ${p2}`;
  }
  const first = programs[0].degreeName ? programs[0].degreeName : programs[0].name;
  return `${first} + ${programs.length - 1} more`;
}

// Admission Card Component (Pure Server Component)
function AdmissionCard({ admission, index }: { admission: Admission; index: number }) {
  const daysLeft = getDaysLeft(admission.expectedCloseDate);
  const isUrgent = daysLeft !== null && daysLeft <= 3;
  const isWarning = daysLeft !== null && daysLeft <= 7 && daysLeft > 3;
  
  return (
    <Link
      href={`/admissions/${admission.slug}`}
      className={`group block rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isUrgent ? 'border-red-200 bg-gradient-to-r from-red-50/50 to-white hover:from-red-100' :
        isWarning ? 'border-orange-200 bg-gradient-to-r from-orange-50/30 to-white hover:from-orange-100' :
        'border-gray-100 bg-white hover:bg-gray-50'
      }`}
    >
      <div className="p-4 md:p-6"> {/* ✅ Smaller padding on mobile */}
        {/* Header with Badge */}
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              {/* Rank Badge - Smaller on mobile */}
              <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold ${
                isUrgent ? 'bg-red-500 text-white' :
                isWarning ? 'bg-orange-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {index + 1}
              </div>
              <h3 className="text-base md:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {admission.instituteName || admission.name}
              </h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-1 md:gap-2 text-xs md:text-sm">
              <span className="text-gray-600">{admission.session || 'Fall'} {admission.year}</span>
              <span className="text-gray-300 hidden md:inline">•</span>
              <span className="text-gray-500 text-xs md:text-sm">{admission.instituteCity || 'Pakistan'}</span>
            </div>
          </div>
          
          {/* Days Left Badge - Smaller on mobile */}
          {daysLeft ? (
            <div className={`flex flex-col items-center px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl text-center ${
              isUrgent ? 'bg-red-100 animate-pulse' :
              isWarning ? 'bg-orange-100' :
              'bg-green-100'
            }`}>
              <div className={`text-base md:text-2xl font-bold ${
                isUrgent ? 'text-red-600' :
                isWarning ? 'text-orange-600' :
                'text-green-600'
              }`}>
                {daysLeft}
              </div>
              <div className="text-[10px] md:text-xs text-gray-600">days left</div>
            </div>
          ) : (
            <div className="px-2 md:px-4 py-1 md:py-2 bg-gray-100 rounded-lg md:rounded-xl text-center">
              <div className="text-[10px] md:text-xs text-gray-600">Date TBA</div>
            </div>
          )}
        </div>
        
        {/* Programs Section - Hidden on mobile if too many */}
        <div className="mb-3 md:mb-4">
          <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600 mb-1 md:mb-2">
            <span className="font-semibold">🎓 Programs:</span>
            <span className="line-clamp-1">{getProgramDisplay(admission.programs || [])}</span>
          </div>
          
          {admission.programs && admission.programs.length > 2 && (
            <div className="hidden md:flex flex-wrap gap-1 mt-2">
              {admission.programs.slice(0, 3).map((program) => (
                <span key={program.id} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                  {program.degreeName ? program.degreeName : program.name}
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
        
        {/* Footer with CTA - Simplified on mobile */}
        <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-100">
          {admission.expectedCloseDate && (
            <div className="text-[10px] md:text-xs text-gray-500 hidden sm:block">
              📅 {formatDate(admission.expectedCloseDate)}
            </div>
          )}
          <div className={`flex items-center gap-1 md:gap-2 text-blue-600 font-medium text-sm md:text-base group-hover:gap-2 md:group-hover:gap-3 transition-all ${!admission.expectedCloseDate ? 'ml-auto' : ''}`}>
            <span className="text-xs md:text-sm">Apply Now</span>
            <span className="text-sm md:text-lg group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ✅ Main Server Component
export default async function LatestAdmissionsSection() {
  const admissions = await getAdmissions();

  if (!admissions.length) {
    return null;
  }

  // Filter valid open admissions
  const validOpenAdmissions = admissions.filter(ad => {
    if (ad.status !== 'Open') return false;
    if (!ad.expectedCloseDate) return true;
    const daysLeft = getDaysLeft(ad.expectedCloseDate);
    return daysLeft !== null;
  });

  // Calculate stats
  const closingThisWeek = validOpenAdmissions.filter(ad => {
    if (!ad.expectedCloseDate) return false;
    const daysLeft = getDaysLeft(ad.expectedCloseDate);
    return daysLeft !== null && daysLeft <= 7;
  });

  const urgentToday = validOpenAdmissions.filter(ad => {
    if (!ad.expectedCloseDate) return false;
    const daysLeft = getDaysLeft(ad.expectedCloseDate);
    return daysLeft !== null && daysLeft <= 3;
  });

  const normalCount = validOpenAdmissions.filter(ad => {
    if (!ad.expectedCloseDate) return false;
    const daysLeft = getDaysLeft(ad.expectedCloseDate);
    return daysLeft !== null && daysLeft > 7;
  }).length;

  const totalAdmissions = validOpenAdmissions.length;
  
  // Get closing soon admissions (next 30 days)
  const closingSoon = validOpenAdmissions
    .filter(ad => {
      if (!ad.expectedCloseDate) return false;
      const daysLeft = getDaysLeft(ad.expectedCloseDate);
      return daysLeft !== null && daysLeft <= 30;
    })
    .slice(0, 10);

  if (closingSoon.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-12 bg-gradient-to-br from-blue-50 via-white to-indigo-50/30">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Hero Section with Stats - Responsive */}
        <div className="text-center mb-6 md:mb-10">
          <div className="inline-block mb-3 md:mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-1 rounded-full">
              🎓 Limited Seats Available
            </span>
          </div>
          
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Admissions 2026 in Pakistan
          </h2>
          
          {/* ✅ Responsive Stats Cards - Different on Mobile vs Desktop */}
          
          {/* Mobile View: Single line stats bar */}
          <div className="block md:hidden bg-white rounded-xl shadow-sm p-3 mb-4">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{totalAdmissions}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">{urgentToday.length}</div>
                <div className="text-xs text-gray-500">Urgent</div>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">{closingThisWeek.length - urgentToday.length}</div>
                <div className="text-xs text-gray-500">This Week</div>
              </div>
            </div>
          </div>
          
          {/* Desktop View: Full stats cards */}
          <div className="hidden md:flex flex-wrap items-center justify-center gap-4 mb-4">
            <div className="bg-red-100 rounded-full px-4 py-2">
              <span className="text-red-600 font-bold text-2xl">⏰ {closingThisWeek.length}</span>
              <span className="text-red-600 ml-1">Admissions Closing This Week</span>
            </div>
            {urgentToday.length > 0 && (
              <div className="bg-orange-100 rounded-full px-4 py-2 animate-pulse">
                <span className="text-orange-600 font-bold">{urgentToday.length} Urgent</span>
                <span className="text-orange-600 ml-1">(≤3 days left)</span>
              </div>
            )}
          </div>
          
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
            Apply now for {totalAdmissions}+ open admissions across top universities in Pakistan
          </p>
        </div>

        {/* Stats Cards Row - Responsive Grid */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* All Admissions Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-center text-white shadow-lg">
            <div className="text-3xl font-bold">{totalAdmissions}</div>
            <div className="text-sm opacity-90">Total Admissions</div>
            <div className="text-xs opacity-75 mt-1">Open Now</div>
          </div>
          
          {/* Urgent Card */}
          <div className={`rounded-xl p-4 text-center shadow-lg ${
            urgentToday.length > 0 
              ? 'bg-gradient-to-br from-red-500 to-red-600 text-white animate-pulse' 
              : 'bg-gray-100 text-gray-400'
          }`}>
            <div className="text-3xl font-bold">{urgentToday.length}</div>
            <div className="text-sm opacity-90">🚨 Urgent</div>
            <div className="text-xs opacity-75 mt-1">Closing in ≤3 days</div>
          </div>
          
          {/* Warning Card */}
          <div className={`rounded-xl p-4 text-center shadow-lg ${
            (closingThisWeek.length - urgentToday.length) > 0
              ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
              : 'bg-gray-100 text-gray-400'
          }`}>
            <div className="text-3xl font-bold">{closingThisWeek.length - urgentToday.length}</div>
            <div className="text-sm opacity-90">⚠️ Warning</div>
            <div className="text-xs opacity-75 mt-1">4-7 days left</div>
          </div>
          
          {/* Normal Card */}
          <div className={`rounded-xl p-4 text-center shadow-lg ${
            normalCount > 0
              ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
              : 'bg-gray-100 text-gray-400'
          }`}>
            <div className="text-3xl font-bold">{normalCount}</div>
            <div className="text-sm opacity-90">✅ Normal</div>
            <div className="text-xs opacity-75 mt-1">8+ days available</div>
          </div>
        </div>

        {/* Admissions Cards Grid */}
        <div className="space-y-3 md:space-y-4">
          {closingSoon.slice(0, 5).map((admission, index) => (
            <AdmissionCard key={admission.id} admission={admission} index={index} />
          ))}
        </div>

        {/* View All Link - Responsive */}
        {closingSoon.length > 5 && (
          <div className="text-center mt-8 md:mt-10">
            <Link
              href="/admissions"
              className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm md:text-base rounded-xl hover:shadow-lg transition-all group"
            >
              <span>Browse All {totalAdmissions}+ University Admissions</span>
              <span className="text-base md:text-lg group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <p className="text-[10px] md:text-xs text-gray-500 mt-2 md:mt-3">
              Including public and private sector universities across Pakistan
            </p>
          </div>
        )}
      </div>
    </section>
  );
}