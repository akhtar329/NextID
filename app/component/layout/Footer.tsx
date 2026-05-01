// app/components/GridFooter.tsx
import Link from "next/link";
import Image from "next/image";
import { db } from "@/app/lib/db";
import { cities } from "@/app/lib/schema";
import { eq } from "drizzle-orm";
import { unstable_cache } from 'next/cache';

// ==================== FETCH CITIES (No Cache Layer) ====================
const getCities = unstable_cache(
  async (): Promise<{ name: string; slug: string }[]> => {
    try {
      const allCities = await db
        .select({
          name: cities.name,
          slug: cities.slug,
        })
        .from(cities)
        .where(eq(cities.status, true));

      return allCities.slice(0, 5);
    } catch {
      return [];
    }
  },
  ['footer-cities'],
  {
    revalidate: 86400, // 24 hours
  }
);

// ==================== STATIC DATA (No DB needed) ====================
const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Admissions", href: "/admissions" },
  { name: "Results", href: "/results" },
  { name: "Universities", href: "/universities" },
  { name: "Programs", href: "/programs" },
  { name: "About Us", href: "/about" },
  { name: "Contact Us", href: "/contact" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "FAQs", href: "/faqs" },
];

const resources = [
  { name: "News", href: "/news" },
  { name: "Blogs", href: "/blogs" },
  { name: "Scholarships", href: "/scholarships" },
  { name: "Career Guide", href: "/career-guide" },
  { name: "XML Sitemap", href: "/sitemap.xml" },
  { name: "Terms of Service", href: "/terms" },
];

const socialLinks = [
  { name: "Facebook", href: "https://facebook.com/nextidpk", icon: "F", bgColor: "#1877F2" },
  { name: "Twitter", href: "https://twitter.com/nextidpk", icon: "T", bgColor: "#1DA1F2" },
  { name: "Instagram", href: "https://instagram.com/nextidpk", icon: "I", bgColor: "#E4405F" },
  { name: "YouTube", href: "https://youtube.com/nextidpk", icon: "Y", bgColor: "#FF0000" },
  { name: "LinkedIn", href: "https://linkedin.com/company/nextidpk", icon: "L", bgColor: "#0077B5" },
];

// ==================== FOOTER COMPONENT ====================
export default async function GridFooter() {
  const currentYear = new Date().getFullYear();
  const citiesList = await getCities();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* Logo & About */}
          <div className="md:col-span-4">
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/images/logo.png"
                alt="NextID.pk Logo"
                width={48}
                height={48}
                className="rounded-lg object-contain"
                priority={false}
              />

              <div>
                <div className="text-xl font-bold text-gray-900">
                  NextID<span className="text-blue-600">.pk</span>
                </div>
                <p className="text-xs text-gray-500">
                  Pakistan Education Portal 
                </p>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              Your trusted source for education updates, admissions, results, 
              and career guidance in Pakistan.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-transform hover:scale-105"
                  style={{ backgroundColor: s.bgColor }}
                  aria-label={s.name}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h3 className="font-semibold mb-4 text-gray-900">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((l) => (
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

          {/* Resources */}
          <div className="md:col-span-2">
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

          {/* Popular Cities */}
          <div className="md:col-span-3">
            <h3 className="font-semibold mb-4 text-gray-900">Popular Cities</h3>
            {citiesList.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {citiesList.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/cities/${c.slug}`}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Loading cities...</p>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-500">
          <p>© {currentYear} NextID.pk. All rights reserved.</p>
          <p className="text-xs mt-1">
            Empowering education in Pakistan since 2024
          </p>
        </div>
      </div>
    </footer>
  );
}