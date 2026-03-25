// app/components/GridFooter.tsx
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { cities } from '@/app/lib/schema';
import { eq } from 'drizzle-orm';

// Fetch popular cities from database
async function getPopularCities() {
  try {
    const popularCities = await db
      .select({
        name: cities.name,
        slug: cities.slug,
      })
      .from(cities)
      .where(eq(cities.status, true))
      .orderBy(cities.isPopular, cities.name)
      .limit(16);

    return popularCities;
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}

const footerData = {
  about: {
    title: 'NextID.pk',
    description: 'NextID.pk provides comprehensive information on schools, colleges, universities, admissions, results, and educational programs in Pakistan.',
  },
  quickLinks: [
    { name: 'Home', href: '/' },
    { name: 'Institutes', href: '/institutes' },
    { name: 'Admissions', href: '/admissions' },
    { name: 'Results', href: '/results' },
    { name: 'Universities', href: '/universities' },
    { name: 'Programs', href: '/programs' },
    { name: 'Boards', href: '/boards' },
    { name: 'Contact', href: '/contact' },
  ],
  resources: [
    { name: 'News', href: '/news' },
    { name: 'Blogs', href: '/blogs' },
    { name: 'FAQs', href: '/faqs' },
    { name: 'XML Sitemap', href: '/sitemap.xml' }, // ✅ Added XML Sitemap
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
  social: [
    { name: 'Facebook', href: 'https://facebook.com/nextidpk', icon: 'F' },
    { name: 'Twitter', href: 'https://twitter.com/nextidpk', icon: 'T' },
    { name: 'Instagram', href: 'https://instagram.com/nextidpk', icon: 'I' },
    { name: 'YouTube', href: 'https://youtube.com/nextidpk', icon: 'Y' },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/nextidpk', icon: 'L' },
  ],
};

export default async function GridFooter() {
  const currentYear = new Date().getFullYear();
  
  // Fetch cities from database
  const popularCities = await getPopularCities();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        {/* Main Grid: 4 + 8 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          
          {/* Column 1-4: About Section (4 columns on desktop) */}
          <div className="lg:col-span-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">
                    NextID<span className="text-blue-600">.pk</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Pakistan's Premier Educational Portal
                  </p>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed">
                {footerData.about.description}
              </p>
              
              {/* Social Links */}
              <div className="flex items-center space-x-3 pt-2">
                {footerData.social.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-colors text-sm"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          {/* Column 5-12: Links Section (8 columns on desktop) */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Quick Links */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 text-sm tracking-wider uppercase">
                  Quick Links
                </h3>
                <ul className="space-y-2">
                  {footerData.quickLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Resources - with XML Sitemap */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 text-sm tracking-wider uppercase">
                  Resources
                </h3>
                <ul className="space-y-2">
                  {footerData.resources.map((link) => (
                    <li key={link.name}>
                      {link.href === '/sitemap.xml' ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1"
                        >
                          {link.name}
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">XML</span>
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          {link.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Popular Cities - Database Se */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 text-sm tracking-wider uppercase">
                  Popular Cities
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {popularCities.slice(0, 12).map((city) => (
                    <Link
                      key={city.slug}
                      href={`/cities/${city.slug}`} // ✅ Fixed: cities (plural)
                      className="text-xs text-gray-600 hover:text-blue-600 p-1 hover:bg-gray-100 rounded transition-colors truncate"
                      title={city.name}
                    >
                      {city.name}
                    </Link>
                  ))}
                </div>
                
                {/* Contact Info */}
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <div className="space-y-2">
                    <a
                      href="mailto:info@nextid.pk"
                      className="text-sm text-gray-600 hover:text-blue-600 block"
                    >
                      info@nextid.pk
                    </a>
                    <a
                      href="tel:+923001234567"
                      className="text-sm text-gray-600 hover:text-blue-600 block"
                    >
                      +92 342 553 7329
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-gray-300 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm mb-4 md:mb-0">
              © {currentYear} NextID.pk. All rights reserved.
            </div>
            
            {/* Additional City Links */}
            {popularCities.length > 12 && (
              <div className="flex flex-wrap justify-center gap-3">
                <span className="text-xs text-gray-400">Also in:</span>
                {popularCities.slice(12).map((city) => (
                  <Link
                    key={city.slug}
                    href={`/cities/${city.slug}`} // ✅ Fixed: cities (plural)
                    className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}