// app/component/layout/Header.tsx

"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

// Types
interface MenuItem {
  id: string;
  title: string;
  href: string;
  type: 'link' | 'dropdown' | 'mega';
  icon: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  displayOrder?: number;
}

interface Program {
  id: number;
  name: string;
  slug: string;
  degreeName: string | null;
  isFeatured: boolean | null;
}

interface Institute {
  id: number;
  name: string;
  slug: string;
  cityName: string | null;
  isFeatured: boolean | null;
}

interface City {
  id: number;
  name: string;
  slug: string;
  province: string | null;
  isPopular: boolean | null;
}

interface Board {
  id: number;
  name: string;
  slug: string;
  cityName: string | null;
}

interface MenuData {
  categories: Category[];
  programs: Program[];
  universities: Institute[];
  cities: City[];
  boards?: Board[];
  activeCategory: string;
}

// ✅ Main Navigation Items - ONLY ADD DATE SHEETS, REST SAME
const mainNavItems: MenuItem[] = [
  { id: 'home', title: 'Home', href: '/', type: 'link', icon: '🏠' },
  { id: 'admissions', title: 'Admissions', href: '/admissions', type: 'mega', icon: '📝' },
  { id: 'results', title: 'Results', href: '/results', type: 'mega', icon: '📊' },
  { id: 'programs', title: 'Programs', href: '/programs', type: 'mega', icon: '📚' },
  { id: 'universities', title: 'Universities', href: '/universities', type: 'mega', icon: '🎓' },
  { id: 'boards', title: 'Boards', href: '/boards', type: 'mega', icon: '📋' },
  { id: 'date-sheets', title: 'Date Sheets', href: '/date-sheets', type: 'link', icon: '📅' }, // ✅ NEW
  { id: 'news', title: 'News', href: '/news', type: 'link', icon: '📰' },
  { id: 'cities', title: 'Cities', href: '/cities', type: 'link', icon: '🏙️' },
];

// Category to program keywords mapping
const categoryKeywords: Record<string, string[]> = {
  'engineering': ['Civil', 'Mechanical', 'Electrical', 'Software', 'Chemical', 'Computer', 'Engineering'],
  'medical': ['MBBS', 'BDS', 'Pharm', 'Nursing', 'Medical', 'Health', 'Medicine'],
  'business': ['BBA', 'MBA', 'Accounting', 'Economics', 'Finance', 'Business', 'Commerce'],
  'computer-it': ['Computer', 'IT', 'Information', 'Data', 'AI', 'Cyber', 'Science', 'Technology'],
  'law': ['LLB', 'Law', 'Legal'],
  'education': ['B.Ed', 'M.Ed', 'Education', 'Teaching'],
  'arts': ['BA', 'MA', 'Psychology', 'Sociology', 'Mass', 'Communication', 'Arts', 'English', 'History']
};

// Helper function to get programs by category
const getProgramsByCategory = (programs: Program[], categorySlug: string): Program[] => {
  const keywords = categoryKeywords[categorySlug] || [];
  
  return programs.filter(program => {
    return keywords.some(keyword => 
      program.name.toLowerCase().includes(keyword.toLowerCase())
    );
  });
};

// ✅ Mega Menu Component - NO CHANGES, SAME AS BEFORE
const MegaMenu = ({ 
  menuId,
  isOpen, 
  menuData,
  loading,
  onMouseEnter, 
  onMouseLeave,
  onCategoryChange
}: { 
  menuId: string;
  isOpen: boolean;
  menuData: MenuData | null;
  loading: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onCategoryChange?: (categorySlug: string) => void;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (menuData?.categories && 
        menuData.categories.length > 0 && 
        !activeCategory && 
        !hasInitialized.current) {
      
      const defaultCategory = menuData.categories[0].slug;
      setActiveCategory(defaultCategory);
      hasInitialized.current = true;
      
      if (onCategoryChange) {
        onCategoryChange(defaultCategory);
      }
    }
  }, [menuData, activeCategory, onCategoryChange]);

  const handleCategoryChange = (categorySlug: string) => {
    if (categorySlug !== activeCategory) {
      setActiveCategory(categorySlug);
      if (onCategoryChange) {
        onCategoryChange(categorySlug);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onMouseLeave();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onMouseLeave]);

  if (!isOpen) return null;
  if (!menuData) return null;

  const currentCategory = menuData.categories.find(c => c.slug === activeCategory);
  
  // BOARDS Mega Menu
  if (menuId === 'boards') {
    return (
      <div 
        ref={menuRef}
        className="absolute left-0 right-0 top-full z-50 bg-white shadow-2xl"
        style={{
          boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3)',
          borderBottomLeftRadius: '24px',
          borderBottomRightRadius: '24px',
          borderTop: '4px solid #3b82f6'
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
          <div className="container mx-auto px-6 py-6">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
            ) : (
              <div>
                <div className="mb-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                  <h2 className="text-2xl font-bold mb-2">Education Boards of Pakistan</h2>
                  <p className="text-orange-100">Results, date sheets, and announcements</p>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  {menuData.boards && menuData.boards.length > 0 ? (
                    menuData.boards.slice(0, 8).map((board) => (
                      <Link
                        key={board.id}
                        href={`/boards/${board.slug}`}
                        className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-lg transition-all hover:border-orange-300 group"
                      >
                        <div className="text-3xl mb-2">📋</div>
                        <h3 className="font-semibold text-gray-800 group-hover:text-orange-600">
                          {board.name}
                        </h3>
                        {board.cityName && (
                          <p className="text-sm text-gray-500">{board.cityName}</p>
                        )}
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-4 text-center py-12 text-gray-500">
                      No boards available
                    </div>
                  )}
                </div>
                
                <div className="mt-8 grid grid-cols-3 gap-4">
                  <Link
                    href="/boards?type=results"
                    className="bg-orange-50 p-4 rounded-xl text-center hover:bg-orange-100 transition-colors"
                  >
                    <div className="text-2xl mb-1">📊</div>
                    <div className="font-medium text-orange-700">Latest Results</div>
                  </Link>
                  <Link
                    href="/date-sheets"
                    className="bg-orange-50 p-4 rounded-xl text-center hover:bg-orange-100 transition-colors"
                  >
                    <div className="text-2xl mb-1">📅</div>
                    <div className="font-medium text-orange-700">Date Sheets</div>
                  </Link>
                  <Link
                    href="/boards?type=announcements"
                    className="bg-orange-50 p-4 rounded-xl text-center hover:bg-orange-100 transition-colors"
                  >
                    <div className="text-2xl mb-1">📢</div>
                    <div className="font-medium text-orange-700">Announcements</div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Regular Mega Menu
  const categoryPrograms = getProgramsByCategory(menuData.programs, activeCategory);
  const categoryUniversities = menuData.universities || [];
  const categoryCities = menuData.cities || [];

  return (
    <div 
      ref={menuRef}
      className="absolute left-0 right-0 top-full z-50 bg-white shadow-2xl"
      style={{
        boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3)',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        borderTop: '4px solid #3b82f6'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
        <div className="container mx-auto px-6 py-6">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          ) : (
            <div className="flex gap-6">
              {/* LEFT SIDE - Categories */}
              <div className="w-1/4 bg-gradient-to-b from-blue-50 to-white p-4 rounded-2xl shadow-inner">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1.5 h-7 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                  <h3 className="font-bold text-gray-800 text-lg">Explore Fields</h3>
                </div>
                <div className="space-y-2">
                  {menuData.categories.map((category, index) => {
                    const isActive = activeCategory === category.slug;
                    const gradients = [
                      'from-blue-500 to-blue-600',
                      'from-green-500 to-green-600',
                      'from-purple-500 to-purple-600',
                      'from-orange-500 to-orange-600',
                      'from-red-500 to-red-600',
                      'from-indigo-500 to-indigo-600',
                      'from-pink-500 to-pink-600'
                    ];
                    const gradient = gradients[index % gradients.length];
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryChange(category.slug)}
                        onMouseEnter={() => handleCategoryChange(category.slug)}
                        className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                          isActive
                            ? `bg-gradient-to-r ${gradient} text-white shadow-lg`
                            : 'bg-white hover:shadow-md border border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`font-semibold ${isActive ? 'text-white' : 'text-gray-800'}`}>
                              {category.name}
                            </div>
                          </div>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-blue-100'
                          }`}>
                            <svg 
                              className={`w-3.5 h-3.5 transition-transform ${
                                isActive ? 'rotate-90 text-white' : 'text-blue-600 group-hover:translate-x-0.5'
                              }`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT SIDE - Content */}
              <div className="w-3/4">
                {currentCategory && (
                  <div className="animate-fadeIn">
                    <div className="mb-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl p-4 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-8 -mb-8"></div>
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold mb-1">{currentCategory.name}</h2>
                          <p className="text-blue-100 text-sm">
                            Discover top programs, universities & opportunities
                          </p>
                        </div>
                        <div className="flex space-x-4">
                          <div className="text-center bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
                            <div className="text-xl font-bold">{categoryPrograms.length}</div>
                            <div className="text-xs text-blue-100">Programs</div>
                          </div>
                          <div className="text-center bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
                            <div className="text-xl font-bold">{categoryUniversities.length}</div>
                            <div className="text-xs text-blue-100">Universities</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {/* PROGRAMS COLUMN */}
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
                          <h3 className="font-bold text-white flex items-center">
                            <span className="mr-2 text-lg">📚</span>
                            <span>Programs ({categoryPrograms.length})</span>
                          </h3>
                        </div>
                        <div className="p-4 min-h-[250px]">
                          {categoryPrograms.length > 0 ? (
                            <ul className="space-y-2">
                              {categoryPrograms.slice(0, 8).map((program) => (
                                <li key={program.id}>
                                  <Link
                                    href={`/programs/${program.slug}`}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 transition-all group/item"
                                  >
                                    <span className="text-sm text-gray-700 group-hover/item:text-blue-700 font-medium">
                                      {program.name}
                                    </span>
                                    <span className="text-blue-600 opacity-0 group-hover/item:opacity-100 transition-opacity text-xs">
                                      View →
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
                              No programs available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* UNIVERSITIES COLUMN */}
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3">
                          <h3 className="font-bold text-white flex items-center">
                            <span className="mr-2 text-lg">🏛️</span>
                            <span>Universities ({categoryUniversities.length})</span>
                          </h3>
                        </div>
                        <div className="p-4 min-h-[250px]">
                          {categoryUniversities.length > 0 ? (
                            <ul className="space-y-2">
                              {categoryUniversities.slice(0, 8).map((uni) => (
                                <li key={uni.id}>
                                  <Link
                                    href={`/universities/${uni.slug}`}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-green-50 transition-all group/item"
                                  >
                                    <div>
                                      <span className="text-sm text-gray-700 group-hover/item:text-green-700 font-medium">
                                        {uni.name}
                                      </span>
                                      {uni.cityName && (
                                        <span className="text-xs text-gray-400 ml-1">({uni.cityName})</span>
                                      )}
                                    </div>
                                    <span className="text-green-600 opacity-0 group-hover/item:opacity-100 transition-opacity text-xs">
                                      View →
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
                              No universities available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CITIES COLUMN */}
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
                          <h3 className="font-bold text-white flex items-center">
                            <span className="mr-2 text-lg">📍</span>
                            <span>Cities ({categoryCities.length})</span>
                          </h3>
                        </div>
                        <div className="p-4 min-h-[250px]">
                          {categoryCities.length > 0 ? (
                            <ul className="space-y-2">
                              {categoryCities.slice(0, 8).map((city) => (
                                <li key={city.id}>
                                  <Link
                                    href={`/cities/${city.slug}`}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-purple-50 transition-all group/item"
                                  >
                                    <span className="text-sm text-gray-700 group-hover/item:text-purple-700 font-medium">
                                      {city.name}
                                    </span>
                                    {city.isPopular && (
                                      <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">
                                        Popular
                                      </span>
                                    )}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
                              No cities available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Mobile Menu Component - SAME AS BEFORE
const MobileMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      <div 
        ref={menuRef}
        className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 lg:hidden overflow-y-auto rounded-l-2xl"
        style={{ animation: 'slideInRight 0.3s ease-out' }}
      >
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2" onClick={onClose}>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-blue-600 font-bold text-lg">N</span>
              </div>
              <div>
                <div className="font-bold text-white">NextID.pk</div>
                <div className="text-xs text-blue-100">Education Portal</div>
              </div>
            </Link>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <nav className="p-4">
          {mainNavItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
              onClick={onClose}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="font-medium text-gray-700 group-hover:text-blue-600">{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

// ✅ Main Header Component - PROFESSIONAL VERSION
export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<Record<string, MenuData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<Record<string, string>>({});
  const [isScrolled, setIsScrolled] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const dataCache = useRef<Record<string, MenuData>>({});
  const fetchingRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchMenuData = async (menuId: string, categorySlug?: string) => {
    const cacheKey = categorySlug ? `${menuId}-${categorySlug}` : menuId;
    
    if (fetchingRef.current[cacheKey]) return;
    
    if (dataCache.current[cacheKey]) {
      if (menuData[menuId] !== dataCache.current[cacheKey]) {
        setMenuData(prev => ({ ...prev, [menuId]: dataCache.current[cacheKey] }));
      }
      return;
    }
    
    fetchingRef.current[cacheKey] = true;
    setLoading(prev => ({ ...prev, [menuId]: true }));
    
    try {
      const url = categorySlug 
        ? `/api/public/menu?menuId=${menuId}&category=${categorySlug}`
        : `/api/public/menu?menuId=${menuId}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        dataCache.current[cacheKey] = data.data;
        if (hoveredMenu === menuId) {
          setMenuData(prev => ({ ...prev, [menuId]: data.data }));
        }
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setLoading(prev => ({ ...prev, [menuId]: false }));
      fetchingRef.current[cacheKey] = false;
    }
  };

  const prefetchAllCategories = async (menuId: string) => {
    if (!menuData[menuId]) {
      await fetchMenuData(menuId);
    }
    
    if (menuData[menuId]?.categories) {
      menuData[menuId].categories.forEach((category, index) => {
        setTimeout(() => {
          const cacheKey = `${menuId}-${category.slug}`;
          if (!dataCache.current[cacheKey] && !fetchingRef.current[cacheKey]) {
            fetchMenuData(menuId, category.slug);
          }
        }, index * 300);
      });
    }
  };

  const handleCategoryChange = (menuId: string, categorySlug: string) => {
    setActiveCategory((prev: Record<string, string>) => ({ ...prev, [menuId]: categorySlug }));
    
    const cacheKey = `${menuId}-${categorySlug}`;
    if (dataCache.current[cacheKey]) {
      setMenuData(prev => ({ ...prev, [menuId]: dataCache.current[cacheKey] }));
    } else if (!fetchingRef.current[cacheKey]) {
      fetchMenuData(menuId, categorySlug);
    }
  };

  const handleMouseEnter = (menuId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHoveredMenu(menuId);
    
    if (!menuData[menuId] && !fetchingRef.current[menuId]) {
      fetchMenuData(menuId);
      setTimeout(() => prefetchAllCategories(menuId), 1000);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredMenu(null);
    }, 200);
  };

  return (
    <>
      <header 
        className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm transition-all duration-300 ${
          isScrolled ? 'shadow-lg' : 'border-b border-gray-100'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center space-x-3 group flex-shrink-0"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  NextID<span className="text-blue-600">.pk</span>
                </div>
                <div className="text-xs text-gray-500 tracking-wide">EDUCATION PORTAL</div>
              </div>
            </Link>

            {/* Desktop Navigation - CENTERED */}
            <nav className="hidden lg:flex items-center justify-center flex-1 space-x-1">
              {mainNavItems.map((item) => (
                <div 
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => item.type === 'mega' && handleMouseEnter(item.id)}
                  onMouseLeave={item.type === 'mega' ? handleMouseLeave : undefined}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                      hoveredMenu === item.id 
                        ? 'text-blue-700 bg-blue-50 shadow-sm' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-1.5 text-base">{item.icon}</span>
                    {item.title}
                    {item.type === 'mega' && (
                      <svg 
                        className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${
                          hoveredMenu === item.id ? 'rotate-180' : ''
                        }`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>
                </div>
              ))}
            </nav>

            {/* Right Side - Empty spacer for balance */}
            <div className="hidden lg:block w-10"></div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mega Menu Dropdowns */}
        {hoveredMenu && mainNavItems.find(item => item.id === hoveredMenu)?.type === 'mega' && (
          <MegaMenu
            menuId={hoveredMenu}
            isOpen={true}
            menuData={menuData[hoveredMenu] || null}
            loading={loading[hoveredMenu] || false}
            onMouseEnter={() => handleMouseEnter(hoveredMenu)}
            onMouseLeave={handleMouseLeave}
            onCategoryChange={(categorySlug) => handleCategoryChange(hoveredMenu, categorySlug)}
          />
        )}
      </header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </>
  );
}