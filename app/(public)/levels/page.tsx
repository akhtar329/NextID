// app/(public)/levels/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { levels, degrees, programs } from '@/app/lib/schema';
import { eq, and, count, inArray } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Education Levels | Matric, Intermediate, Bachelor, Master | NextID.pk',
  description: 'Browse educational levels including Matric, Intermediate, Bachelor, Master, and PhD programs in Pakistan.',
  alternates: {
    canonical: 'https://nextid.pk/levels',
  },
};

interface LevelWithStats {
  id: number;
  name: string;
  slug: string;
  fullForm: string | null;
  displayOrder: number | null;
  status: boolean | null;
  createdAt: Date | null;
  degreesCount: number;
  programsCount: number;
}

async function getLevelsWithStats(): Promise<LevelWithStats[]> {
  try {
    // Get all levels
    const allLevels = await db
      .select({
        id: levels.id,
        name: levels.name,
        slug: levels.slug,
        fullForm: levels.fullForm,
        displayOrder: levels.displayOrder,
        status: levels.status,
        createdAt: levels.createdAt,
      })
      .from(levels)
      .where(eq(levels.status, true))
      .orderBy(levels.displayOrder, levels.name);

    // Calculate stats for each level
    const levelsWithStats = await Promise.all(
      allLevels.map(async (level) => {
        // Get degrees in this level
        const degreesList = await db
          .select({ id: degrees.id })
          .from(degrees)
          .where(and(eq(degrees.levelId, level.id), eq(degrees.status, true)));

        const degreeIds = degreesList.map(d => d.id);

        // Get degrees count
        const degreesCount = degreesList.length;

        // Get programs count through degrees
        let programsCount = 0;
        if (degreeIds.length > 0) {
          const programsResult = await db
            .select({ count: count() })
            .from(programs)
            .where(and(inArray(programs.degreeId, degreeIds), eq(programs.status, true)));
          programsCount = programsResult[0]?.count || 0;
        }

        return {
          ...level,
          degreesCount,
          programsCount,
        };
      })
    );

    // Sort by display order
    return levelsWithStats.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return (a.displayOrder || 999) - (b.displayOrder || 999);
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error fetching levels:', error);
    return [];
  }
}

// Icons for levels
const levelIcons: Record<string, string> = {
  'Matric': '📘',
  'Intermediate': '📗',
  'Bachelor': '📕',
  'Master': '📙',
  'PhD': '🎓',
  'Diploma': '📜',
  'Certificate': '📄',
  'Post Graduate': '📚',
};

// Colors for levels
const levelColors: Record<string, string> = {
  'Matric': 'from-green-500 to-emerald-600',
  'Intermediate': 'from-blue-500 to-cyan-600',
  'Bachelor': 'from-purple-500 to-indigo-600',
  'Master': 'from-orange-500 to-red-600',
  'PhD': 'from-pink-500 to-rose-600',
  'Diploma': 'from-yellow-500 to-amber-600',
  'Certificate': 'from-teal-500 to-green-600',
  'Post Graduate': 'from-indigo-500 to-purple-600',
};

export default async function LevelsPage() {
  const levels = await getLevelsWithStats();

  // Calculate overall stats
  const totalLevels = levels.length;
  const totalDegrees = levels.reduce((sum, level) => sum + level.degreesCount, 0);
  const totalPrograms = levels.reduce((sum, level) => sum + level.programsCount, 0);
  const avgProgramsPerLevel = totalLevels > 0 ? Math.round(totalPrograms / totalLevels) : 0;

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-900 to-emerald-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-green-200 mb-4">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span className="text-green-300">›</span>
              <span className="text-white font-medium">Levels</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Education</span>{' '}
              <span className="text-yellow-400">Levels</span>
            </h1>
            
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Browse programs and degrees by educational level from Matric to PhD
            </p>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 mt-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{totalLevels}</div>
                <div className="text-sm text-gray-600">Total Levels</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎓</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{totalDegrees}</div>
                <div className="text-sm text-gray-600">Total Degrees</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{totalPrograms}</div>
                <div className="text-sm text-gray-600">Total Programs</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        
        {levels.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No levels found</h3>
            <p className="text-gray-500">No educational levels available yet.</p>
          </div>
        ) : (
          <>
            {/* Levels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {levels.map((level) => {
                const icon = levelIcons[level.name] || '📘';
                const gradientColor = levelColors[level.name] || 'from-gray-600 to-slate-600';
                
                return (
                  <Link
                    key={`level-${level.id}`}
                    href={`/levels/${level.slug}`}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-green-400"
                  >
                    {/* Level Header */}
                    <div className={`bg-gradient-to-r ${gradientColor} p-4 text-white`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{icon}</span>
                          <div>
                            <h2 className="text-xl font-bold">{level.name}</h2>
                            {level.fullForm && (
                              <p className="text-sm text-white/80">{level.fullForm}</p>
                            )}
                          </div>
                        </div>
                        <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                          #{level.displayOrder || 0}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-purple-700">{level.degreesCount}</div>
                          <div className="text-xs text-gray-600">Degrees</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-blue-700">{level.programsCount}</div>
                          <div className="text-xs text-gray-600">Programs</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Program Availability</span>
                          <span>{Math.min(100, Math.round((level.programsCount / (avgProgramsPerLevel || 1)) * 100))}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.round((level.programsCount / (avgProgramsPerLevel || 1)) * 100))}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {level.createdAt ? `Since ${new Date(level.createdAt).getFullYear()}` : ''}
                        </span>
                        <div className="flex items-center text-green-600 text-sm font-medium">
                          <span>Explore Level</span>
                          <svg className="w-4 h-4 ml-2 group-hover:ml-3 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Bottom Sections */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Level Information */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-green-600 rounded-full"></span>
                  📖 About Education Levels
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Matriculation (SSC)</h3>
                    <p className="text-sm text-gray-600">Secondary School Certificate, typically grades 9-10. Foundation level for higher education.</p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Intermediate (HSSC)</h3>
                    <p className="text-sm text-gray-600">Higher Secondary School Certificate, grades 11-12. Specialization in Science, Arts, or Commerce.</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-800 mb-2">Bachelor's Degree</h3>
                    <p className="text-sm text-gray-600">Undergraduate programs typically lasting 2-4 years. Includes BA, BSc, BBA, BEng, etc.</p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h3 className="font-semibold text-orange-800 mb-2">Master's Degree</h3>
                    <p className="text-sm text-gray-600">Postgraduate programs lasting 1-2 years. Includes MA, MSc, MBA, MEng, etc.</p>
                  </div>
                  
                  <div className="p-4 bg-pink-50 rounded-lg">
                    <h3 className="font-semibold text-pink-800 mb-2">PhD / Doctorate</h3>
                    <p className="text-sm text-gray-600">Doctoral programs focusing on research and original contribution to knowledge.</p>
                  </div>
                </div>
              </div>

              {/* Level Statistics */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                  📊 Level Statistics
                </h2>
                
                <div className="space-y-6">
                  {/* Degree Distribution */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Degree Distribution</h3>
                    <div className="space-y-2">
                      {levels.sort((a, b) => b.degreesCount - a.degreesCount).map((level) => (
                        <div key={`stat-${level.id}`} className="flex items-center gap-2">
                          <span className="text-xs w-20 truncate">{level.name}</span>
                          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                              style={{ width: `${(level.degreesCount / Math.max(...levels.map(l => l.degreesCount)) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600">{level.degreesCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Program Distribution */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Program Distribution</h3>
                    <div className="space-y-2">
                      {levels.sort((a, b) => b.programsCount - a.programsCount).map((level) => (
                        <div key={`prog-stat-${level.id}`} className="flex items-center gap-2">
                          <span className="text-xs w-20 truncate">{level.name}</span>
                          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                              style={{ width: `${(level.programsCount / Math.max(...levels.map(l => l.programsCount)) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600">{level.programsCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{totalLevels}</div>
                      <div className="text-xs text-gray-500">Total Levels</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{avgProgramsPerLevel}</div>
                      <div className="text-xs text-gray-500">Avg Programs/Level</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-yellow-600 rounded-full"></span>
                🔗 Quick Links by Level
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {levels.map((level) => (
                  <Link
                    key={`quick-${level.id}`}
                    href={`/levels/${level.slug}`}
                    className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors group"
                  >
                    <span className="text-2xl">{levelIcons[level.name] || '📘'}</span>
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-green-600">
                        {level.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {level.degreesCount} degrees
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}