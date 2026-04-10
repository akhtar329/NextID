// app/components/GridFooter.tsx
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/app/lib/db';
import { cities } from '@/app/lib/schema';
import { eq } from 'drizzle-orm';

// Fetch random popular cities (4-5 random)
async function getRandomCities() {
  try {
    const allCities = await db
      .select({
        name: cities.name,
        slug: cities.slug,
      })
      .from(cities)
      .where(eq(cities.status, true));

    // Shuffle and get first 5 random cities
    const shuffled = [...allCities];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, 5);
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}

// Quick Links
const quickLinks = [
  { name: 'Home City', href: '/city' },
  { name: 'Degrees', href: '/degrees' },
  { name: 'Programs', href: '/programs' },
  { name: 'Levels', href: '/levels' },
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'FAQs', href: '/faqs' },
];

// Resources
const resources = [
  { name: 'News', href: '/news' },
  { name: 'Blogs', href: '/blogs' },
  { name: 'XML Sitemap', href: '/sitemap.xml' },
  { name: 'Terms of Service', href: '/terms' },
];

// Social links with colors (static, no JS)
const socialLinks = [
  { name: 'Facebook', href: 'https://facebook.com/nextidpk', icon: 'F', bgColor: '#1877F2' },
  { name: 'Twitter', href: 'https://twitter.com/nextidpk', icon: 'T', bgColor: '#1DA1F2' },
  { name: 'Instagram', href: 'https://instagram.com/nextidpk', icon: 'I', bgColor: '#E4405F' },
  { name: 'YouTube', href: 'https://youtube.com/nextidpk', icon: 'Y', bgColor: '#FF0000' },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/nextidpk', icon: 'L', bgColor: '#0077B5' },
];

export default async function GridFooter() {
  const currentYear = new Date().getFullYear();
  const randomCities = await getRandomCities();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Logo & About */}
          <div className="md:col-span-4">
            <div className="flex items-center space-x-3 mb-4">
              {/* Logo Image */}
              <div className="w-12 h-12 relative flex-shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="NextID.pk Logo"
                  width={48}
                  height={48}
                  className="rounded-lg object-contain"
                  priority
                />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">
                  NextID<span className="text-blue-600">.pk</span>
                </div>
                <p className="text-xs text-gray-500">Pakistan's Premier Educational Portal</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              NextID.pk provides comprehensive information on schools, colleges, universities, 
              admissions, results, and educational programs in Pakistan.
            </p>
            
            {/* Social Links - Static, No JS */}
            <div className="flex items-center space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all duration-200 hover:scale-110 hover:brightness-110"
                  style={{ backgroundColor: social.bgColor }}
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="md:col-span-3">
            <h3 className="font-semibold text-gray-800 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Resources */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-4">Resources</h3>
            <ul className="space-y-2">
              {resources.map((link) => (
                <li key={link.name}>
                  {link.href === '/sitemap.xml' ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                      {link.name}
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">XML</span>
                    </a>
                  ) : (
                    <Link href={link.href} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Popular Cities (Random 4-5) */}
          <div className="md:col-span-3">
            <h3 className="font-semibold text-gray-800 mb-4">📍 Popular Cities</h3>
            <div className="grid grid-cols-2 gap-2">
              {randomCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/cities/${city.slug}`}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {city.name}
                </Link>
              ))}
            </div>
            
            {/* Contact */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a href="mailto:info@nextid.pk" className="text-sm text-gray-600 hover:text-blue-600 transition-colors block">
                📧 info@nextid.pk
              </a>
              <a href="tel:+923425537329" className="text-sm text-gray-600 hover:text-blue-600 transition-colors block mt-2">
                📞 +92 342 553 7329
              </a>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-gray-500 text-sm">
          © {currentYear} NextID.pk. All rights reserved.
        </div>
      </div>
    </footer>
  );
}