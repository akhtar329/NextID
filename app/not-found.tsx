"use client";
import Link from "next/link";
import { Home, Search, Phone, ArrowLeft, School, Award } from "lucide-react";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [busPosition, setBusPosition] = useState(5);
  const [show404, setShow404] = useState(false);
  const [busConfused, setBusConfused] = useState(false);
  const [showHelpingSigns, setShowHelpingSigns] = useState(false);
  const [bannerFlutter, setBannerFlutter] = useState(0);
  
  useEffect(() => {
    const timeline = async () => {
      setBusPosition(5);
      await new Promise(r => setTimeout(r, 500));
      
      let pos = 5;
      const moveBus = setInterval(() => {
        pos += 0.5;
        setBusPosition(pos);
        
        if (pos >= 40) {
          clearInterval(moveBus);
          setBusConfused(true);
          
          setTimeout(() => {
            setShow404(true);
            
            const flutterInterval = setInterval(() => {
              setBannerFlutter(prev => (prev + 1) % 4);
            }, 200);
            
            setTimeout(() => {
              setShowHelpingSigns(true);
              clearInterval(flutterInterval);
            }, 2000);
          }, 800);
        }
      }, 50);
    };
    
    timeline();
  }, []);

  const getBannerTransform = () => {
    const flutters = [
      'rotate(1deg) translateY(0px)',
      'rotate(-2deg) translateY(-4px)',
      'rotate(3deg) translateY(-2px)',
      'rotate(-3deg) translateY(3px)',
    ];
    return flutters[bannerFlutter] || 'rotate(0deg)';
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Main Container - Fixed Height, No Scroll */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          
          {/* Animation Scene - Fixed Size */}
          <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-600 bg-gradient-to-b from-sky-100 to-white">
            
            {/* Sky */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-200 to-white">
              <div className="absolute top-8 right-16 w-20 h-20 bg-yellow-300 rounded-full blur-md opacity-60"></div>
              
              {/* Clouds */}
              <div className="absolute top-4 left-8">
                <div className="w-20 h-8 bg-white/80 rounded-full blur-sm"></div>
                <div className="absolute -top-3 left-3 w-14 h-8 bg-white/80 rounded-full blur-sm"></div>
              </div>
              <div className="absolute top-12 right-20">
                <div className="w-24 h-10 bg-white/70 rounded-full blur-sm"></div>
                <div className="absolute -top-4 left-4 w-16 h-8 bg-white/70 rounded-full blur-sm"></div>
              </div>
            </div>
            
            {/* Building with NEXTID.PK */}
            <div className="absolute bottom-12 left-8 z-10">
              <div className="relative">
                <div className="w-48 h-32 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg border-2 border-gray-500 shadow-2xl">
                  <div className="grid grid-cols-4 gap-2 p-3">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-6 h-6 bg-yellow-200 rounded-sm border border-gray-600"></div>
                    ))}
                  </div>
                  
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-blue-900 text-white text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg border border-yellow-400">
                    NEXTID.PK
                  </div>
                  
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-amber-800 rounded-t-lg border-2 border-amber-900">
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-4 bg-yellow-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Building */}
            <div className="absolute bottom-12 right-12 z-10">
              <div className="w-40 h-28 bg-gradient-to-b from-gray-400 to-gray-500 rounded-t-lg border-2 border-gray-600 shadow-2xl">
                <div className="grid grid-cols-3 gap-1 p-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-5 h-5 bg-blue-300 rounded-sm border border-gray-700"></div>
                  ))}
                </div>
                <div className="absolute top-2 right-2 text-white text-xs bg-purple-800 px-2 py-0.5 rounded">
                  SCIENCE
                </div>
              </div>
            </div>
            
            {/* Road */}
            <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-gray-700 to-gray-600" 
                 style={{ transform: 'perspective(600px) rotateX(2deg)' }}>
              
              <div className="absolute top-1/2 w-full h-2 bg-yellow-400"></div>
              <div className="absolute top-1/2 w-full flex justify-around" style={{ transform: 'translateY(-50%)' }}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-16 h-2.5 bg-white" style={{ opacity: 1 - i * 0.05 }}></div>
                ))}
              </div>
            </div>
            
            {/* Wrong Way Sign */}
            {busConfused && (
              <div className="absolute top-16 right-36 z-20">
                <div className="bg-red-600 text-white px-4 py-2 rounded-lg transform rotate-6 font-bold text-lg shadow-2xl border-2 border-white animate-pulse">
                  ⚠️ WRONG WAY ⚠️
                </div>
              </div>
            )}
            
            {/* Directional Signs */}
            {showHelpingSigns && (
              <>
                <div className="absolute top-12 left-16 z-20 animate-bounce">
                  <div className="bg-green-600 text-white p-2 px-3 rounded-lg shadow-xl border-2 border-white transform -rotate-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">←</span>
                      <span className="font-bold">HOME</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-20 right-20 z-20 animate-pulse">
                  <div className="bg-blue-600 text-white p-2 px-3 rounded-lg shadow-xl border-2 border-white transform rotate-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">ADMISSIONS</span>
                      <span className="text-lg font-bold">→</span>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* THE BUS */}
            <div 
              className="absolute bottom-3 transition-all duration-200 ease-out z-30"
              style={{ left: `${busPosition}%` }}
            >
              {/* Bus Shadow */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-48 h-4 bg-black/30 rounded-full blur-md"></div>
              
              {/* Bus Body */}
              <div className={`relative ${busConfused ? 'animate-shake' : ''}`}>
                
                {/* 404 Banner */}
                {show404 && (
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-40">
                    <div 
                      className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg shadow-2xl border-2 border-yellow-400"
                      style={{ transform: getBannerTransform() }}
                    >
                      <span className="font-bold text-base tracking-widest drop-shadow-lg">
                        404 - PAGE NOT FOUND
                      </span>
                    </div>
                    <div className="flex justify-center gap-2 mt-1">
                      <div className="w-1 h-8 bg-red-600 rounded-full"></div>
                      <div className="w-1 h-10 bg-red-600 rounded-full"></div>
                      <div className="w-1 h-8 bg-red-600 rounded-full"></div>
                    </div>
                  </div>
                )}
                
                {/* Main Bus */}
                <div className="relative">
                  <div className="w-56 h-24 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl relative shadow-2xl border-4 border-yellow-600">
                    
                    {/* Windows */}
                    <div className="absolute top-3 left-5 right-5 flex justify-between">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-6 h-5 bg-blue-300 rounded border border-blue-800"></div>
                      ))}
                    </div>
                    
                    {/* Door */}
                    <div className="absolute left-6 top-6 w-6 h-12 bg-gray-700 rounded-l border-2 border-gray-900"></div>
                    
                    {/* Headlights */}
                    <div className="absolute right-0 top-5 w-3 h-3 bg-yellow-300 rounded-full"></div>
                    <div className="absolute right-0 bottom-5 w-3 h-3 bg-yellow-300 rounded-full"></div>
                    
                    {/* Wheels */}
                    <div className="absolute -bottom-3 left-7">
                      <div className="w-8 h-8 bg-black rounded-full border-2 border-gray-500"></div>
                    </div>
                    <div className="absolute -bottom-3 right-10">
                      <div className="w-8 h-8 bg-black rounded-full border-2 border-gray-500"></div>
                    </div>
                    
                    {/* School Bus Sign */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-700 text-white text-xs px-3 py-0.5 rounded-full whitespace-nowrap">
                      SCHOOL BUS
                    </div>
                    
                    {/* Route Number */}
                    <div className="absolute top-6 right-12 bg-blue-900 text-white text-xs px-2 py-0.5 rounded">
                      ROUTE 404
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Links Section - Fixed Below Animation */}
          <div className="mt-6 bg-white rounded-xl shadow-lg p-5 border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <Link 
                href="/"
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg text-center transition-all hover:scale-105 shadow-md"
              >
                <Home className="h-5 w-5 mx-auto mb-1" />
                <span className="font-semibold text-sm">Home</span>
              </Link>
              
              <Link 
                href="/admissions"
                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg text-center transition-all hover:scale-105 shadow-md"
              >
                <School className="h-5 w-5 mx-auto mb-1" />
                <span className="font-semibold text-sm">Admissions</span>
              </Link>
              
              <Link 
                href="/results"
                className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg text-center transition-all hover:scale-105 shadow-md"
              >
                <Award className="h-5 w-5 mx-auto mb-1" />
                <span className="font-semibold text-sm">Results</span>
              </Link>
              
              <Link 
                href="/contact"
                className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-lg text-center transition-all hover:scale-105 shadow-md"
              >
                <Phone className="h-5 w-5 mx-auto mb-1" />
                <span className="font-semibold text-sm">Contact</span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="max-w-md mx-auto mt-4">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
                />
                <button className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Back Button */}
            <div className="text-center mt-3">
              <button 
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors group text-sm"
              >
                <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
                <span>Go back</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}