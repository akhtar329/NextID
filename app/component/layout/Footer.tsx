// app/components/GridFooter.tsx

import Link from "next/link";
import Image from "next/image";
import { db } from "@/app/lib/db";
import { cities } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

// STATIC cache (IMPORTANT FIX)
let cachedCities: { name: string; slug: string }[] = [];

async function getCities() {
  if (cachedCities.length > 0) return cachedCities;

  try {
    const allCities = await db
      .select({
        name: cities.name,
        slug: cities.slug,
      })
      .from(cities)
      .where(eq(cities.status, true));

    // Pick only first 5 (NO RANDOM EVERY REQUEST)
    cachedCities = allCities.slice(0, 5);

    return cachedCities;
  } catch (error) {
    console.error("Error fetching cities:", error);
    return [];
  }
}

const quickLinks = [
  { name: "Home City", href: "/city" },
  { name: "Degrees", href: "/degrees" },
  { name: "Programs", href: "/programs" },
  { name: "Levels", href: "/levels" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Contact Us", href: "/contact" },
  { name: "FAQs", href: "/faqs" },
];

const resources = [
  { name: "News", href: "/news" },
  { name: "Blogs", href: "/blogs" },
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

export default async function GridFooter() {
  const currentYear = new Date().getFullYear();
  const cities = await getCities();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* Logo */}
          <div className="md:col-span-4">
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/images/logo.png"
                alt="NextID.pk Logo"
                width={48}
                height={48}
                className="rounded-lg object-contain"
              />

              <div>
                <div className="text-xl font-bold text-gray-900">
                  NextID<span className="text-blue-600">.pk</span>
                </div>
                <p className="text-xs text-gray-500">
                  Pakistan's Educational Portal
                </p>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              Education updates, admissions, results and programs.
            </p>

            {/* Social */}
            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: s.bgColor }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((l) => (
                <li key={l.name}>
                  <Link href={l.href} className="text-sm text-gray-600 hover:text-blue-600">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="md:col-span-2">
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {resources.map((l) => (
                <li key={l.name}>
                  <Link href={l.href} className="text-sm text-gray-600 hover:text-blue-600">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cities */}
          <div className="md:col-span-3">
            <h3 className="font-semibold mb-4">Popular Cities</h3>
            <div className="grid grid-cols-2 gap-2">
              {cities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/cities/${c.slug}`}
                  className="text-sm text-gray-600 hover:text-blue-600"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-8 pt-6 text-center text-sm text-gray-500">
          © {currentYear} NextID.pk
        </div>
      </div>
    </footer>
  );
}