// components/layout/Header.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Admissions", href: "/admissions" },
    { name: "Results", href: "/results" },
    { name: "Date Sheets", href: "/date-sheets" },
    { name: "Jobs", href: "/jobs" },
    { name: "Scholarships", href: "/scholarships" },
    { name: "News", href: "/news" },
    { name: "Blog", href: "/blog" }, // ✅ "/blog" not "/blogs"
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md py-3">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">ID</span>
          </div>
          <span className="font-bold text-xl text-gray-800">NextID</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`text-sm font-medium transition ${
                isActive(item.href) ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
              }`}
              suppressHydrationWarning // ✅ Fix hydration mismatch
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="md:hidden p-2 rounded-lg transition text-gray-800"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t py-4 px-4">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => setIsMenuOpen(false)} 
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  isActive(item.href) ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                }`}
                suppressHydrationWarning // ✅ Fix hydration mismatch
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}