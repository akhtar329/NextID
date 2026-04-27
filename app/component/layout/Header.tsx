// app/component/layout/Header.tsx
// ✅ FIXED: No onClick, Pure CSS

import React from "react";
import Link from "next/link";
import Image from "next/image";

// ==================== STATIC NAVIGATION (No DB calls) ====================
const navItems = [
  { title: "Home", href: "/", icon: "🏠", ariaLabel: "Go to home page" },
  { title: "Admissions", href: "/admissions", icon: "📝", ariaLabel: "View latest admissions" },
  { title: "Results", href: "/results", icon: "📊", ariaLabel: "Check exam results" },
  { title: "Programs", href: "/programs", icon: "📚", ariaLabel: "Browse education programs" },
  { title: "Universities", href: "/universities", icon: "🎓", ariaLabel: "Explore universities" },
  { title: "Boards", href: "/boards", icon: "📋", ariaLabel: "Education boards" },
  { title: "Date Sheets", href: "/date-sheets", icon: "📅", ariaLabel: "Exam date sheets" },
  { title: "News", href: "/news", icon: "📰", ariaLabel: "Education news" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-3 group"
            aria-label="NextID.pk Home - Pakistan Education Portal"
          >
            <div className="w-10 h-10 relative">
              <Image
                src="/images/logo.png"
                alt="NextID.pk Logo"
                width={40}
                height={40}
                className="rounded-xl object-contain"
                priority={true}
              />
            </div>

            <div className="hidden sm:block">
              <div className="text-xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                NextID<span className="text-gray-900">.pk</span>
              </div>
              <div className="text-xs text-gray-500">
                Pakistan Education Portal
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="px-3 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                aria-label={item.ariaLabel}
              >
                <span className="mr-1" role="img" aria-hidden="true">{item.icon}</span>
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu - Pure CSS (No onClick) */}
          <div className="lg:hidden">
            <label 
              htmlFor="menu-toggle" 
              className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16" 
                />
              </svg>
            </label>

            <input type="checkbox" id="menu-toggle" className="hidden peer" />

            {/* Overlay - Closes menu when clicked */}
            <label 
              htmlFor="menu-toggle"
              className="fixed inset-0 bg-black/40 opacity-0 invisible peer-checked:opacity-100 peer-checked:visible transition-all duration-300 z-40 cursor-pointer"
              aria-label="Close menu"
            />

            {/* Slide-out Menu */}
            <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-xl transform translate-x-full peer-checked:translate-x-0 transition-transform duration-300 z-50">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <span className="font-bold text-gray-900">Menu</span>
                <label 
                  htmlFor="menu-toggle" 
                  className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </label>
              </div>

              <nav className="p-4 space-y-2" aria-label="Mobile navigation">
                {navItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xl" role="img" aria-hidden="true">{item.icon}</span>
                    <span className="text-gray-700">{item.title}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}