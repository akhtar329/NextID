// app/component/layout/Header.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Simple Navigation Items
const navItems = [
  { title: 'Home', href: '/', icon: '🏠' },
  { title: 'Admissions', href: '/admissions', icon: '📝' },
  { title: 'Results', href: '/results', icon: '📊' },
  { title: 'Programs', href: '/programs', icon: '📚' },
  { title: 'Universities', href: '/universities', icon: '🎓' },
  { title: 'Boards', href: '/boards', icon: '📋' },
  { title: 'Date Sheets', href: '/date-sheets', icon: '📅' },
  { title: 'News', href: '/news', icon: '📰' },
];

// Mobile Menu Component
const MobileMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 lg:hidden overflow-y-auto animate-slide-in">
        <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2" onClick={onClose}>
              {/* Mobile Menu Logo */}
              <div className="w-10 h-10 relative">
                <Image
                  src="/images/logo.png"
                  alt="NextID.pk Logo"
                  width={40}
                  height={40}
                  className="rounded-xl object-contain bg-white p-1"
                />
              </div>
              <div>
                <div className="font-bold text-white">NextID.pk</div>
                <div className="text-xs text-blue-100">Education Portal</div>
              </div>
            </Link>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <nav className="p-4">
          {navItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium text-gray-700">{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

// Main Header Component
export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header 
        className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm transition-all duration-300 ${
          isScrolled ? 'shadow-md' : 'border-b border-gray-100'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo with Image */}
            <Link href="/" className="flex items-center space-x-3 group flex-shrink-0">
              {/* Logo Image */}
              <div className="w-10 h-10 relative">
                <Image
                  src="/images/logo.png"
                  alt="NextID.pk Logo"
                  width={40}
                  height={40}
                  className="rounded-xl object-contain group-hover:scale-110 transition-transform duration-200"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  NextID<span className="text-blue-600">.pk</span>
                </div>
                <div className="text-xs text-gray-500 tracking-wide">EDUCATION PORTAL</div>
              </div>
            </Link>

            {/* Desktop Navigation - Simple Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all whitespace-nowrap"
                >
                  <span className="mr-1.5 text-base">{item.icon}</span>
                  {item.title}
                </Link>
              ))}
            </nav>

            {/* Right spacer */}
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
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}