// app/components/Footer.tsx

import Link from "next/link";


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

// ✅ SEO-FRIENDLY LINKS (Important for Google)
const seoLinks = [
  { name: "Admission 2026", href: "/admissions/2026" },
  { name: "Latest Results", href: "/results/latest" },
  { name: "BISE Boards", href: "/boards" },
  { name: "Universities in Pakistan", href: "/universities" },
  { name: "Study Abroad", href: "/study-abroad" },
  { name: "Career Counseling", href: "/career-counseling" },
];

// ✅ Popular Categories (for better internal linking)
const popularCategories = [
  { name: "Intermediate", href: "/category/intermediate" },
  { name: "Bachelor", href: "/category/bachelor" },
  { name: "Master", href: "/category/master" },
  { name: "PhD", href: "/category/phd" },
  { name: "Diploma", href: "/category/diploma" },
  { name: "Certificate", href: "/category/certificate" },
];

const socialLinks = [
  {
    name: "Facebook",
    href: "https://facebook.com/nextidpk",
    icon: "📘",
    bgColor: "#1877F2",
  },
  {
    name: "Twitter",
    href: "https://twitter.com/nextidpk",
    icon: "🐦",
    bgColor: "#1DA1F2",
  },
  {
    name: "Instagram",
    href: "https://instagram.com/nextidpk",
    icon: "📷",
    bgColor: "#E4405F",
  },
  {
    name: "YouTube",
    href: "https://youtube.com/nextidpk",
    icon: "▶️",
    bgColor: "#FF0000",
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/nextidpk",
    icon: "🔗",
    bgColor: "#0077B5",
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/1234567890",
    icon: "💬",
    bgColor: "#25D366",
  },
];

// ==================== FOOTER COMPONENT ====================

export default function Footer() {

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      {/* ✅ Schema.org markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WPFooter",
            "url": process.env.NEXT_PUBLIC_URL,
            "name": "NextID.pk - Pakistan Education Portal",
            "description": "Your trusted source for education updates, admissions, results, scholarships, and career guidance in Pakistan.",
            "publisher": {
              "@type": "Organization",
              "name": "NextID.pk",
              "logo": {
                "@type": "ImageObject",
                "url": `${process.env.NEXT_PUBLIC_URL}/logo.png`
              }
            }
          })
        }}
      />

      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Logo & About - 4 columns */}
          <div className="md:col-span-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                N
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">
                  NextID<span className="text-blue-600">.pk</span>
                </div>
                <p className="text-xs text-gray-500">
                  Pakistan&apos;s #1 Education Portal
                </p>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Your trusted source for education updates, admissions, results,
              scholarships, and career guidance in Pakistan. Helping students 
              achieve their dreams since 2024.
            </p>

            {/* Social Links */}
            <div className="flex gap-2 flex-wrap mb-4">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm transition-all hover:scale-110 hover:shadow-md"
                  style={{ backgroundColor: s.bgColor }}
                  aria-label={s.name}
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* ✅ Newsletter Signup for SEO (increases engagement) */}
            <div className="mt-4">
              <p className="text-xs text-gray-600 mb-2">Subscribe for updates:</p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Email for newsletter"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Quick Links - 2 columns */}
          <div className="md:col-span-2">
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

          {/* ✅ SEO Links (New - Important for Google) */}
          <div className="md:col-span-3">
            <h3 className="font-semibold mb-4 text-gray-900">Trending Now</h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {seoLinks.map((l) => (
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

          {/* Resources & Categories - 3 columns */}
          <div className="md:col-span-3">
            <h3 className="font-semibold mb-4 text-gray-900">Resources</h3>
            <ul className="space-y-2 mb-4">
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

            {/* ✅ Popular Categories (Improved internal linking) */}
            <h3 className="font-semibold mb-2 text-gray-900 text-sm">
              Popular Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularCategories.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-blue-100 hover:text-blue-600 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ✅ SEO-Friendly Bottom Bar with Keywords */}
        <div className="border-t border-gray-200 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center">
            <div className="text-sm text-gray-500">
              <p>© 2024 NextID.pk. All rights reserved.</p>
              <p className="text-xs mt-1">
                Empowering education in Pakistan since 2024
              </p>
            </div>
            
            {/* ✅ Important SEO Keywords in Footer */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-400">
              <span>#EducationPakistan</span>
              <span>#Admission2026</span>
              <span>#Result2026</span>
              <span>#Scholarships</span>
              <span>#StudyInPakistan</span>
            </div>
          </div>

          {/* ✅ Trust Badges for SEO (Improves credibility) */}
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-center">
            <div className="text-xs text-gray-400">
              <span className="font-bold text-green-600">✓</span> 100% Verified
            </div>
            <div className="text-xs text-gray-400">
              <span className="font-bold text-green-600">✓</span> Daily Updates
            </div>
            <div className="text-xs text-gray-400">
              <span className="font-bold text-green-600">✓</span> Free Resources
            </div>
            <div className="text-xs text-gray-400">
              <span className="font-bold text-green-600">✓</span> Expert Guidance
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}