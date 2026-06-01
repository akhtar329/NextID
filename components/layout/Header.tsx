// app/components/layout/Header.tsx

'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ==================== NAVIGATION ITEMS ====================
const navItems = [
  { title: "Home", href: "/", icon: "🏠", activeIcon: "🏠" },
  { title: "Admissions", href: "/admissions", icon: "📝", activeIcon: "📝" },
  { title: "Results", href: "/results", icon: "📊", activeIcon: "📊" },
  { title: "Date Sheets", href: "/date-sheets", icon: "📅", activeIcon: "📅" },
  { title: "Scholarships", href: "/scholarships", icon: "💰", activeIcon: "💰" },
  { title: "Jobs", href: "/jobs", icon: "💼", activeIcon: "💼" },
  { title: "News", href: "/news", icon: "📰", activeIcon: "📰" },
];

// ==================== MAIN HEADER COMPONENT ====================
export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu when route changes - use a different approach
  const prevPathname = React.useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setIsMenuOpen(false);
    }
  }, [pathname]);

  // Check if link is active
  const isActive = (href: string) => {
    if (href === "/") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="hidden md:block bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
              <span>🎓 Admissions 2026 Open at Top Universities</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admissions" className="hover:text-yellow-300 transition text-xs">
                Apply Now →
              </Link>
              <Link href="/scholarships" className="hover:text-yellow-300 transition text-xs">
                Scholarships →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-white shadow-sm"
      } border-b border-gray-100`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center space-x-3 group"
              aria-label="NextID.pk Home - Pakistan Education Portal"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                N
              </div>

              <div className="hidden sm:block">
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-700 transition-colors">
                  NextID<span className="text-gray-900">.pk</span>
                </div>
                <div className="text-xs text-gray-500">
                  Pakistan Education Portal
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1" aria-label="Main navigation">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                    aria-label={item.title}
                  >
                    <span className="mr-1.5" role="img" aria-hidden="true">
                      {active ? item.activeIcon : item.icon}
                    </span>
                    {item.title}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/contact"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
              >
                Contact
              </Link>
              <Link
                href="/admin"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-sm"
              >
                Admin Panel
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? (
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                    N
                  </div>
                  <span className="font-bold text-gray-900">NextID.pk</span>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                        active
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-xl" role="img" aria-hidden="true">{item.icon}</span>
                      <span className="font-medium">{item.title}</span>
                      {active && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      )}
                    </Link>
                  );
                })}
                
                {/* Divider */}
                <div className="border-t border-gray-100 my-3"></div>
                
                {/* Extra Links */}
                <Link
                  href="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  <span className="text-xl">📞</span>
                  <span>Contact Us</span>
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 transition"
                >
                  <span className="text-xl">👨‍💻</span>
                  <span>Admin Panel</span>
                </Link>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  © 2025 NextID.pk<br />
                  Pakistan Education Portal
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}