// app/components/Footer.tsx
"use client";

import Link from "next/link";
import { 
  FaFacebook, 
  FaTwitter, 
  FaInstagram, 
  FaYoutube, 
  FaLinkedin, 
  FaWhatsapp 
} from "react-icons/fa";
import { FiMail, FiMapPin } from "react-icons/fi";

// ==================== STATIC DATA ====================

const criticalPages = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Contact Us", href: "/contact" },
  { name: "Privacy Policy", href: "/privacy" },
];

const servicePages = [
  { name: "Admissions", href: "/admissions", nofollow: true },
  { name: "Results", href: "/results", nofollow: true },
  { name: "Date Sheets", href: "/date-sheets", nofollow: true },
  { name: "Scholarships", href: "/scholarships", nofollow: true },
  { name: "Jobs", href: "/jobs", nofollow: true },
  { name: "News", href: "/news", nofollow: true },
  { name: "Blog", href: "/blog", nofollow: true },
];

const resourcePages = [
  { name: "FAQ", href: "/faq", nofollow: true },
  { name: "Sitemap", href: "/sitemap.xml", nofollow: true },
];

// ✅ SOCIAL LINKS WITH REACT ICONS
const socialLinks = [
  {
    name: "Facebook",
    href: "https://facebook.com/nextidpk",
    icon: FaFacebook,  // ✅ This is a component
    bgColor: "#1877F2",
    ariaLabel: "Follow us on Facebook",
  },
  {
    name: "Twitter",
    href: "https://twitter.com/nextidpk",
    icon: FaTwitter,   // ✅ Component
    bgColor: "#1DA1F2",
    ariaLabel: "Follow us on Twitter",
  },
  {
    name: "Instagram",
    href: "https://instagram.com/nextidpk",
    icon: FaInstagram, // ✅ Component
    bgColor: "#E4405F",
    ariaLabel: "Follow us on Instagram",
  },
  {
    name: "YouTube",
    href: "https://youtube.com/nextidpk",
    icon: FaYoutube,   // ✅ Component
    bgColor: "#FF0000",
    ariaLabel: "Subscribe to our YouTube channel",
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/nextidpk",
    icon: FaLinkedin,  // ✅ Component
    bgColor: "#0077B5",
    ariaLabel: "Connect with us on LinkedIn",
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/+923425537329",
    icon: FaWhatsapp,  // ✅ Component
    bgColor: "#25D366",
    ariaLabel: "Chat with us on WhatsApp",
  },
];

const trustBadges = [
  { icon: "✓", label: "Verified", color: "text-green-600" },
  { icon: "🔄", label: "Daily Updates", color: "text-blue-600" },
  { icon: "🎓", label: "Free Resources", color: "text-purple-600" },
  { icon: "⭐", label: "4.8/5 Rating", color: "text-amber-600" },
];

// ==================== FOOTER COMPONENT ====================

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto" role="contentinfo">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "NextID.pk",
            "url": process.env.NEXT_PUBLIC_URL || "https://nextid.pk",
            "logo": `${process.env.NEXT_PUBLIC_URL || "https://nextid.pk"}/logo.png`,
            "description": "Pakistan's trusted education portal for admissions, results, scholarships, and career guidance.",
            "foundingDate": "2024",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "PK"
            },
            "sameAs": socialLinks.map(s => s.href),
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "Customer Service",
              "availableLanguage": ["English", "Urdu"]
            }
          })
        }}
      />

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* ==================== BRAND SECTION - 4 columns ==================== */}
          <div className="lg:col-span-4">
            <Link 
              href="/" 
              className="inline-flex items-center space-x-3 mb-4 group"
              aria-label="NextID.pk Home"
            >
              <div 
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md transition-transform group-hover:scale-105"
                suppressHydrationWarning
              >
                LA
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">
                  NextID<span className="text-blue-600">.pk</span>
                </span>
                <p className="text-xs text-gray-500 font-medium tracking-wide">
                  Pakistan&apos;s Education Portal
                </p>
              </div>
            </Link>

            <p className="text-gray-600 text-sm leading-relaxed mb-4 max-w-sm">
              Your trusted source for education updates, admissions, results,
              scholarships, and career guidance in Pakistan. Empowering students
              since 2024.
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <FiMail className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                <a 
                  href="mailto:info@nextid.pk" 
                  className="hover:text-blue-600 transition-colors"
                >
                  info@nextid.pk
                </a>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FiMapPin className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                <span>Pakistan</span>
              </div>
            </div>

            {/* ✅ SOCIAL MEDIA ICONS - FIXED */}
            <div className="flex gap-2 flex-wrap mb-4">
              {socialLinks.map((s) => {
                const Icon = s.icon; // Icon is a component
                return (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm transition-all hover:scale-110 hover:shadow-md"
                    style={{ backgroundColor: s.bgColor }}
                    aria-label={s.ariaLabel}
                  >
                    <Icon className="w-4 h-4" />  {/* ✅ Render as component */}
                  </a>
                );
              })}
            </div>
          </div>

          {/* ==================== NAVIGATION - 2 columns ==================== */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">
              Navigation
            </h3>
            <ul className="space-y-2.5">
              {criticalPages.map((l) => (
                <li key={l.name}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors hover:underline"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ==================== SERVICES - 3 columns ==================== */}
          <div className="lg:col-span-3">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">
              Services
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {servicePages.map((l) => (
                <Link
                  key={l.name}
                  href={l.href}
                  rel={l.nofollow ? "nofollow" : undefined}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors hover:underline"
                >
                  {l.name}
                </Link>
              ))}
            </div>
          </div>

          {/* ==================== RESOURCES - 3 columns ==================== */}
          <div className="lg:col-span-3">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">
              Resources
            </h3>
            <ul className="space-y-2.5">
              {resourcePages.map((l) => (
                <li key={l.name}>
                  <Link
                    href={l.href}
                    rel={l.nofollow ? "nofollow" : undefined}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors hover:underline"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/sitemap"
                  rel="nofollow"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors hover:underline"
                >
                  HTML Sitemap
                </Link>
              </li>
              <li>
                <Link
                  href="/robots.txt"
                  rel="nofollow"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors hover:underline"
                >
                  Robots.txt
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ==================== BOTTOM BAR ==================== */}
        <div className="border-t border-gray-200 mt-10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500 text-center md:text-left">
              <p>
                © 2024 <span className="font-medium text-gray-700">NextID.pk</span>. 
                All rights reserved.
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Empowering education in Pakistan since 2024
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
              <Link 
                href="/privacy" 
                rel="nofollow" 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-gray-300">|</span>
              <Link 
                href="/terms" 
                rel="nofollow" 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                Terms of Service
              </Link>
              <span className="text-gray-300">|</span>
              <Link 
                href="/disclaimer" 
                rel="nofollow" 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                Disclaimer
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-xs">
              {trustBadges.map((badge) => (
                <span key={badge.label} className={`flex items-center ${badge.color}`}>
                  <span className="mr-1 font-bold">{badge.icon}</span>
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}