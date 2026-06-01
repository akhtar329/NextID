// app/components/GridFooter.tsx

import Link from "next/link";
import Image from "next/image";

// ==================== STATIC DATA (No DB calls) ====================
const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Admissions", href: "/admissions" },
  { name: "Results", href: "/results" },
  { name: "Date Sheets", href: "/date-sheets" },
  { name: "Scholarships", href: "/scholarships" },
  { name: "Jobs", href: "/jobs" },
  { name: "News", href: "/news" },
];

const resources = [
  { name: "Blog", href: "/blog" },
  { name: "About Us", href: "/about" },
  { name: "Contact Us", href: "/contact" },
  { name: "Sitemap", href: "/sitemap.xml" },
  { name: "Privacy Policy", href: "/privacy" },
];

const socialLinks = [
  {
    name: "Facebook",
    href: "https://facebook.com/nextidpk",
    icon: "F",
    bgColor: "#1877F2",
  },
  {
    name: "Twitter",
    href: "https://twitter.com/nextidpk",
    icon: "T",
    bgColor: "#1DA1F2",
  },
  {
    name: "Instagram",
    href: "https://instagram.com/nextidpk",
    icon: "I",
    bgColor: "#E4405F",
  },
  {
    name: "YouTube",
    href: "https://youtube.com/nextidpk",
    icon: "Y",
    bgColor: "#FF0000",
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/nextidpk",
    icon: "L",
    bgColor: "#0077B5",
  },
];

// ==================== FOOTER COMPONENT ====================
export default async function GridFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Logo & About */}
          <div className="md:col-span-5">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                N
              </div>

              <div>
                <div className="text-xl font-bold text-gray-900">
                  NextID<span className="text-blue-600">.pk</span>
                </div>
                <p className="text-xs text-gray-500">
                  Pakistan Education Portal
                </p>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Your trusted source for education updates, admissions, results,
              scholarships, and career guidance in Pakistan.
            </p>

            {/* Social Links */}
            <div className="flex gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all hover:scale-110 hover:shadow-md"
                  style={{ backgroundColor: s.bgColor }}
                  aria-label={s.name}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-4">
            <h3 className="font-semibold mb-4 text-gray-900">Quick Links</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {quickLinks.map((l) => (
                <Link
                  key={l.name}
                  href={l.href}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {l.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="md:col-span-3">
            <h3 className="font-semibold mb-4 text-gray-900">Resources</h3>
            <ul className="space-y-2">
              {resources.map((l) => (
                <li key={l.name}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 mt-6 pt-6 text-center text-sm text-gray-500">
          <p>© {currentYear} NextID.pk. All rights reserved.</p>
          <p className="text-xs mt-1">
            Empowering education in Pakistan since 2024
          </p>
        </div>
      </div>
    </footer>
  );
}
