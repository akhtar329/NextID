// /app/(public)/cities/page.tsx (Updated with Hero + List + Links)
import { CitiesService } from '@/services/cities/cities.service';
import { HeroSection } from '@/components/ui/HeroSection';
import Link from 'next/link';
import { MapPin, Building2, GraduationCap, Newspaper, ChevronRight } from 'lucide-react';

export const revalidate = 86400;

export default async function CitiesPage() {
  const citiesService = new CitiesService();
  const cities = await citiesService.getAllCitiesWithStats();
  
  // Calculate stats for hero
  const totalInstitutes = cities.reduce((sum, city) => sum + (city.institutesCount || 0), 0);
  const totalAdmissions = cities.reduce((sum, city) => sum + (city.admissionsCount || 0), 0);
  const totalNews = cities.reduce((sum, city) => sum + (city.newsCount || 0), 0);

  const heroStats = [
    { label: "Cities Covered", value: cities.length, icon: MapPin },
    { label: "Institutes", value: totalInstitutes, icon: Building2 },
    { label: "Active Admissions", value: totalAdmissions, icon: GraduationCap },
    { label: "News & Updates", value: totalNews, icon: Newspaper },
  ];

  const popularCities = cities.filter(city => city.isPopular);
  const otherCities = cities.filter(city => !city.isPopular);

  return (
    <main>
      {/* Hero Section */}
      <HeroSection
        title="Find Best Educational Opportunities"
        highlight="in Pakistan's Major Cities"
        subtitle="Explore universities, colleges, and institutes across major cities. Get admission updates, results, and educational news from your preferred location."
        badge="🎓 Education Guide 2026"
        stats={heroStats}
        primaryButton={{
          text: "Explore All Cities",
          link: "#all-cities",
          icon: MapPin
        }}
        bgColor="from-blue-900 via-purple-900 to-indigo-900"
        gradientFrom="from-blue-400"
        gradientTo="to-purple-400"
      />

      {/* SEO Content */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-600 leading-relaxed">
  Pakistan&apos;s education landscape offers diverse opportunities across its major metropolitan cities.
              From <Link href="/cities/karachi" className="text-blue-600 hover:underline">Karachi&apos;s prestigious universities</Link> to 
              <Link href="/cities/lahore" className="text-blue-600 hover:underline"> Lahore&apos;s historical institutions</Link>, 
              and from <Link href="/cities/islamabad" className="text-blue-600 hover:underline">Islamabad&apos;s modern campuses</Link> to 
              <Link href="/cities/peshawar" className="text-blue-600 hover:underline">Peshawar&apos;s academic centers</Link>.
            </p>
          </div>
        </div>
      </div>

      {/* All Cities Section */}
      <div id="all-cities" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">All Cities in Pakistan</h2>
        <p className="text-center text-gray-600 mb-12">Browse educational institutions by city</p>
        
        {/* Popular Cities Badge */}
        {popularCities.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 w-2 h-8 rounded-full"></span>
              Popular Cities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularCities.map((city) => (
                <Link href={`/cities/${city.slug}`} key={city.id}>
                  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-yellow-400">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">{city.name}</h3>
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        Popular
                      </span>
                    </div>
                    {city.province && (
                      <p className="text-gray-600 text-sm mb-4">{city.province}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        🏢 {city.institutesCount} Institutes
                      </span>
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                        📝 {city.admissionsCount} Admissions
                      </span>
                    </div>
                    <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                      View Details <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Other Cities */}
        {otherCities.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 w-2 h-8 rounded-full"></span>
              More Cities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherCities.map((city) => (
                <Link href={`/cities/${city.slug}`} key={city.id}>
                  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all hover:scale-105 cursor-pointer">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{city.name}</h3>
                    {city.province && (
                      <p className="text-gray-600 text-sm mb-4">{city.province}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="text-gray-600">🏢 {city.institutesCount} Institutes</span>
                      <span className="text-gray-600">📝 {city.admissionsCount} Admissions</span>
                    </div>
                    <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                      Explore City <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAQ Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": cities.map((city, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "name": city.name,
              "url": `https://nextid.pk/cities/${city.slug}`,
              "description": `Educational institutions, admissions, and news in ${city.name}`
            }))
          })
        }}
      />
    </main>
  );
}