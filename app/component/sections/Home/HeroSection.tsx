// app/component/sections/Home/HeroSection.tsx - Fixed Type Error

"use client"; 

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Types for API data
interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  isBreaking: boolean;
  publishedAt: string;
}

interface ResultItem {
  id: number;
  title: string;
  year: number;
  boardName?: string;
  universityName?: string;
  resultDate?: string;
}

interface AdmissionItem {
  id: number;
  programName: string;
  instituteName: string;
  status: string;
  expectedCloseDate?: string;
}

interface CityItem {
  id: number;
  name: string;
  slug: string;
}

// Carousel item type
interface CarouselItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  bgColor: string;
  cta: string;
  icon: string;
  link: string;
  type: 'news' | 'admission' | 'result';  // ✅ Specific union type
}

interface Props {
  category?: string;
  currentPath?: string;
}

export default function HeroSection({ category = 'home', currentPath = '/' }: Props) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // API data states
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [latestResults, setLatestResults] = useState<ResultItem[]>([]);
  const [openAdmissions, setOpenAdmissions] = useState<AdmissionItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Background colors array
  const bgColors = [
    'from-blue-600 to-indigo-700',
    'from-purple-600 to-pink-700',
    'from-green-600 to-emerald-700',
    'from-orange-600 to-red-600',
    'from-indigo-600 to-purple-700',
    'from-teal-600 to-green-700',
    'from-amber-600 to-orange-700',
    'from-rose-600 to-pink-700'
  ];

  // Icons array
  const icons = ['🎓', '📊', '📰', '🏛️', '📚', '🏫', '📋', '🏙️'];

  // Format time ago for news
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Create random carousel items - ✅ Fixed type issue
  const createRandomCarousel = (news: NewsItem[], results: ResultItem[], admissions: AdmissionItem[]) => {
    // Create array of all items with their types
    const allItems: { item: any; type: 'news' | 'admission' | 'result' }[] = [
      ...news.map(item => ({ item, type: 'news' as const })),
      ...results.map(item => ({ item, type: 'result' as const })),
      ...admissions.map(item => ({ item, type: 'admission' as const }))
    ];

    // Agar koi data nahi to empty array
    if (allItems.length === 0) return [];

    // Randomly shuffle
    const shuffled = allItems.sort(() => 0.5 - Math.random());
    
    // Take first 4 for carousel
    const selected = shuffled.slice(0, 4);
    
    // Convert to carousel items - ✅ Type is now correct
    const newCarouselItems: CarouselItem[] = selected.map((item) => {
      const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)];
      const icon = icons[Math.floor(Math.random() * icons.length)];
      
      if (item.type === 'news') {
        const newsItem = item.item as NewsItem;
        return {
          id: `news-${newsItem.id}`,
          title: newsItem.title,
          subtitle: newsItem.excerpt?.substring(0, 60) + '...' || 'Latest News',
          description: getTimeAgo(newsItem.publishedAt),
          bgColor,
          cta: 'Read More',
          icon,
          link: `/news/${newsItem.slug}`,
          type: 'news'  // ✅ Correct type
        };
      } else if (item.type === 'admission') {
        const admissionItem = item.item as AdmissionItem;
        return {
          id: `admission-${admissionItem.id}`,
          title: `${admissionItem.programName} Admissions`,
          subtitle: admissionItem.instituteName,
          description: admissionItem.expectedCloseDate 
            ? `Deadline: ${new Date(admissionItem.expectedCloseDate).toLocaleDateString()}`
            : 'Applications Open',
          bgColor,
          cta: 'Apply Now',
          icon,
          link: `/admissions/programs/${admissionItem.programName?.toLowerCase().replace(/ /g, '-')}`,
          type: 'admission'  // ✅ Correct type
        };
      } else {
        const resultItem = item.item as ResultItem;
        return {
          id: `result-${resultItem.id}`,
          title: resultItem.title,
          subtitle: resultItem.boardName || resultItem.universityName || 'Results Announced',
          description: `Year: ${resultItem.year}`,
          bgColor,
          cta: 'View Results',
          icon,
          link: `/results/${resultItem.boardName?.toLowerCase().replace(/ /g, '-') || resultItem.universityName?.toLowerCase().replace(/ /g, '-')}`,
          type: 'result'  // ✅ Correct type
        };
      }
    });

    return newCarouselItems;
  };

  // Fetch data - sirf ek baar random generate hoga
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [newsRes, resultsRes, admissionsRes, citiesRes] = await Promise.all([
          fetch('/api/public/news?limit=20'),
          fetch('/api/public/results?limit=20&sort=latest'),
          fetch('/api/public/admissions?limit=20&status=open'),
          fetch('/api/public/cities?limit=10')
        ]);

        const [newsData, resultsData, admissionsData, citiesData] = await Promise.all([
          newsRes.json(),
          resultsRes.json(),
          admissionsRes.json(),
          citiesRes.json()
        ]);

        let news = newsData.success ? newsData.data : [];
        let results = resultsData.success ? resultsData.data : [];
        let admissions = admissionsData.success ? admissionsData.data : [];

        setNewsData(news);
        setLatestResults(results);
        setOpenAdmissions(admissions);
        if (citiesData.success) setCities(citiesData.data);

        // ✅ SIRF EK BAAR random carousel banao - initial load par
        const randomItems = createRandomCarousel(news, results, admissions);
        setCarouselItems(randomItems);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh every 5 minutes (data update hoga lekin carousel wahi rahega)
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // ✅ Empty dependency array - sirf ek baar

  // Get breaking news
  const breakingNews = newsData.find(news => news.isBreaking);
  
  // Get ticker news
  const tickerNews = newsData.slice(0, 4);

  // Auto rotate carousel
  useEffect(() => {
    if (carouselItems.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const searchParams = new URLSearchParams({
        q: searchQuery,
        city: selectedCity !== 'All Cities' ? selectedCity : '',
        category: category !== 'home' ? category : ''
      });
      window.location.href = `/search?${searchParams}`;
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  return (
    <section className="relative py-2 md:py-2 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      
      {/* Emergency Notification Bar - Breaking News */}
      <div className="relative bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-4">
        <div className="container mx-auto flex items-center justify-center gap-3">
          <span className="animate-pulse">⚠️</span>
          <span className="font-semibold text-sm md:text-base">
            {breakingNews ? breakingNews.title : 'URGENT: BISE Lahore Results Tomorrow at 10:00 AM - Stay Tuned'}
          </span>
        </div>
      </div>

      {/* Live Ticker - Latest News */}
      <div className="bg-slate-900 text-white py-2 px-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {tickerNews.length > 0 ? (
            tickerNews.map((news) => (
              <Link 
                key={news.id} 
                href={`/news/${news.slug}`}
                className="mx-6 hover:underline cursor-pointer"
              >
                📢 {news.title}
              </Link>
            ))
          ) : (
            <>
              <span className="mx-6">📢 BISE Karachi Results Out</span>
              <span className="mx-6">📢 FBISE Date Sheet Released</span>
              <span className="mx-6">📢 HEC Scholarship Deadline Extended</span>
              <span className="mx-6">📢 Punjab Boards Announce New Policy</span>
            </>
          )}
        </div>
      </div>

      <div className="container relative z-10 mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Search & Carousel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search Bar */}
            <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-200">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for programs, universities, results..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-white"
                >
                  <option value="All Cities">All Cities</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.name}>{city.name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Random Carousel - Fixed on initial load */}
            {carouselItems.length > 0 ? (
              <div className="relative h-[400px] md:h-[450px] rounded-2xl overflow-hidden shadow-2xl group">
                {carouselItems.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                      index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgColor}`}></div>
                    <div className="absolute inset-0 bg-black/20"></div>
                    
                    {/* Floating shapes */}
                    <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute bottom-10 left-10 w-48 h-48 bg-white/5 rounded-full blur-xl"></div>
                    
                    {/* Content */}
                    <div className="relative h-full flex flex-col justify-center p-8 md:p-12 text-white">
                      <div className="text-5xl md:text-6xl mb-4 transform transition-transform duration-500">
                        {slide.icon}
                      </div>
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
                        {slide.title}
                      </h2>
                      <h3 className="text-xl md:text-2xl mb-4 opacity-90">
                        {slide.subtitle}
                      </h3>
                      <p className="text-lg mb-8 opacity-80">
                        {slide.description}
                      </p>
                      <Link 
                        href={slide.link}
                        className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105 active:scale-95 max-w-max"
                      >
                        {slide.cta}
                        <span className="text-lg">→</span>
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Navigation */}
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/30"
                >
                  ←
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/30"
                >
                  →
                </button>

                {/* Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {carouselItems.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentSlide 
                          ? 'bg-white w-8' 
                          : 'bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>

                {/* Counter */}
                <div className="absolute bottom-6 right-6 bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                  {currentSlide + 1} / {carouselItems.length}
                </div>
              </div>
            ) : (
              <div className="h-[400px] md:h-[450px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-5xl mb-4">🎓</div>
                  <h2 className="text-2xl font-bold">Welcome to NextID.pk</h2>
                  <p className="mt-2">Loading latest updates...</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - News & Updates */}
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">📢</span>
                LATEST UPDATES
              </h2>
            </div>

            {/* News Cards */}
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* Show mix of latest items - sirf initial load par random */}
                  {[...latestResults.slice(0, 2), ...openAdmissions.slice(0, 2), ...newsData.slice(0, 2)]
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 4)
                    .map((item) => {
                      // Type guard for AdmissionItem
                      if ('programName' in item) {
                        const admissionItem = item as AdmissionItem;
                        return (
                          <NewsCard
                            key={`admission-${admissionItem.id}`}
                            title={admissionItem.programName}
                            description={`${admissionItem.instituteName} • ${admissionItem.status}`}
                            time={admissionItem.expectedCloseDate ? new Date(admissionItem.expectedCloseDate).toLocaleDateString() : 'Open'}
                            icon="🎓"
                            type="admission"
                            link={`/admissions/programs/${admissionItem.programName?.toLowerCase().replace(/ /g, '-')}`}
                          />
                        );
                      } 
                      // Type guard for ResultItem
                      else if ('boardName' in item || 'universityName' in item) {
                        const resultItem = item as ResultItem;
                        return (
                          <NewsCard
                            key={`result-${resultItem.id}`}
                            title={resultItem.title}
                            description={resultItem.boardName || resultItem.universityName || 'Results'}
                            time={resultItem.year.toString()}
                            icon="📊"
                            type="result"
                            link={`/results/${resultItem.boardName?.toLowerCase().replace(/ /g, '-') || resultItem.universityName?.toLowerCase().replace(/ /g, '-')}`}
                          />
                        );
                      } 
                      // Type guard for NewsItem
                      else {
                        const newsItem = item as NewsItem;
                        return (
                          <NewsCard
                            key={`news-${newsItem.id}`}
                            title={newsItem.title}
                            description={newsItem.excerpt || 'Latest News'}
                            time={getTimeAgo(newsItem.publishedAt)}
                            icon="📰"
                            type="news"
                            link={`/news/${newsItem.slug}`}
                          />
                        );
                      }
                    })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </section>
  );
}

// News Card Component
interface NewsCardProps {
  title: string;
  description: string;
  time: string;
  icon: string;
  type: string;
  link: string;
}

function NewsCard({ title, description, time, icon, type, link }: NewsCardProps) {
  const getBorderColor = () => {
    switch(type) {
      case 'urgent': return 'border-red-500 bg-red-50/50';
      case 'admission': return 'border-green-500 bg-green-50/50';
      case 'result': return 'border-blue-500 bg-blue-50/50';
      case 'news': return 'border-purple-500 bg-purple-50/50';
      default: return 'border-blue-500 bg-blue-50/50';
    }
  };

  return (
    <Link href={link}>
      <div className={`bg-white/95 backdrop-blur-sm p-4 rounded-xl border-l-4 ${getBorderColor()} border border-slate-200 hover:shadow-lg transition-shadow duration-300 cursor-pointer group`}>
        <div className="flex items-start gap-3">
          <div className="text-xl mt-1">{icon}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {title}
              </h3>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {time}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-2 line-clamp-2">
              {description}
            </p>
            <span className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1 group-hover:gap-2 transition-all">
              View Details
              <span className="transition-all duration-300">→</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}