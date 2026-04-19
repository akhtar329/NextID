// app/component/layout/Header.tsx

import React from "react";
import Link from "next/link";
import Image from "next/image";

const navItems = [
  { title: "Home", href: "/", icon: "🏠" },
  { title: "Admissions", href: "/admissions", icon: "📝" },
  { title: "Results", href: "/results", icon: "📊" },
  { title: "Programs", href: "/programs", icon: "📚" },
  { title: "Universities", href: "/universities", icon: "🎓" },
  { title: "Boards", href: "/boards", icon: "📋" },
  { title: "Date Sheets", href: "/date-sheets", icon: "📅" },
  { title: "News", href: "/news", icon: "📰" },
];

// Simple CSS-only mobile menu (NO React state)
export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 relative">
              <Image
                src="/images/logo.png"
                alt="NextID.pk Logo"
                width={40}
                height={40}
                className="rounded-xl object-contain"
                priority
              />
            </div>

            <div className="hidden sm:block">
              <div className="text-xl font-bold text-blue-600">
                NextID.pk
              </div>
              <div className="text-xs text-gray-500">
                EDUCATION PORTAL
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="px-3 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
              >
                <span className="mr-1">{item.icon}</span>
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Mobile menu (CSS only - NO JS STATE) */}
          <div className="lg:hidden">
            <label htmlFor="menu-toggle" className="cursor-pointer">
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>

            <input type="checkbox" id="menu-toggle" className="hidden peer" />

            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40 hidden peer-checked:block" />

            {/* Menu */}
            <div className="fixed top-0 right-0 w-72 h-full bg-white shadow-xl transform translate-x-full peer-checked:translate-x-0 transition-transform duration-300">
              <div className="p-4 border-b font-bold">Menu</div>

              <div className="p-4 space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="block p-2 rounded hover:bg-gray-100"
                  >
                    {item.icon} {item.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}