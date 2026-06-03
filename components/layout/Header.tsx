// components/layout/Header.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header() {
  const pathname = usePathname(); // ✅ Ab yeh safe hai kyunke component client-side load hoga
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Admissions", href: "/admissions" },
    { name: "Results", href: "/results" },
    { name: "Date Sheets", href: "/date-sheets" },
    { name: "Jobs", href: "/jobs" },
    { name: "Scholarships", href: "/scholarships" },
    { name: "News", href: "/news" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-white/90 backdrop-blur-md shadow-md py-3" : "bg-transparent py-5"
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <span className={`font-bold text-xl ${scrolled ? "text-gray-800" : "text-white"}`}>NextID</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} className={`text-sm font-medium transition ${
              scrolled ? (isActive(item.href) ? "text-blue-600" : "text-gray-600 hover:text-blue-600") : (isActive(item.href) ? "text-blue-300" : "text-white/80 hover:text-white")
            }`}>
              {item.name}
            </Link>
          ))}
        </nav>

        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg transition">
          <span className={scrolled ? "text-gray-800" : "text-white"}>☰</span>
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t py-4 px-4">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href} onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}