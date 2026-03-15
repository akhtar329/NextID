// app/component/sections/Home/HeroSection.tsx
"use client"; 

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Head from 'next/head';

// Types for API data
interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  isBreaking: boolean;
  publishedAt: string;
}

interface ResultItem {
  id: number;
  title: string;
  slug?: string;
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
  slug?: string;
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
  type: 'news' | 'admission' | 'result';
}

// Extended type for mixed items
type MixedItem = 
  | (NewsItem & { type: 'news' })
  | (ResultItem & { type: 'result' })
  | (AdmissionItem & { type: 'admission' });

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
  const [hasData, setHasData] = useState(false);

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
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  // Filter news from last 2 weeks for carousel
  const getRecentNews = (news: NewsItem[]) => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    return news.filter(item => {
      const itemDate = new Date(item.publishedAt);
      return itemDate >= twoWeeksAgo;
    });
  };

  // Create random carousel items (max 4)
  const createRandomCarousel = (news: NewsItem[], results: ResultItem[], admissions: AdmissionItem[]) => {
    // Sirf recent news (2 weeks) consider karo
    const recentNews = getRecentNews(news);
    
    const allItems: { item: any; type: 'news' | 'admission' | 'result' }[] = [
      ...recentNews.map(item => ({ item, type: 'news' as const })),
      ...results.map(item => ({ item, type: 'result' as const })),
      ...admissions.map(item => ({ item, type: 'admission' as const }))
    ];

    if (allItems.length === 0) return [];

    // Randomly shuffle
    const shuffled = allItems.sort(() => 0.5 - Math.random());
    
    // Take first 4 for carousel
    const selected = shuffled.slice(0, 4);
    
    return selected.map((item) => {
      const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)];
      const icon = icons[Math.floor(Math.random() * icons.length)];
      
      if (item.type === 'news') {
        const newsItem = item.item as NewsItem;
        return {
          id: `news-${newsItem.id}`,
          title: newsItem.title,
          subtitle: newsItem.excerpt 
            ? newsItem.excerpt.substring(0, 60) + '...' 
            : newsItem.title.substring(0, 60) + '...',
          description: getTimeAgo(newsItem.publishedAt),
          bgColor,
          cta: 'Read More',
          icon,
          link: `/news/${newsItem.slug}`,
          type: 'news' as const
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
          link: admissionItem.slug 
            ? `/admissions/${admissionItem.slug}` 
            : `/admissions/${admissionItem.programName?.toLowerCase().replace(/ /g, '-')}`,
          type: 'admission' as const
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
          link: resultItem.slug 
            ? `/results/${resultItem.slug}` 
            : `/results/${resultItem.boardName?.toLowerCase().replace(/ /g, '-') || resultItem.universityName?.toLowerCase().replace(/ /g, '-')}`,
          type: 'result' as const
        };
      }
    });
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
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

        const hasAnyData = news.length > 0 || results.length > 0 || admissions.length > 0;
        setHasData(hasAnyData);

        // Create carousel with recent news only
        const randomItems = createRandomCarousel(news, results, admissions);
        setCarouselItems(randomItems);

      } catch (error) {
        console.error('Error fetching data:', error);
        setHasData(false);
        setCarouselItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Get breaking news (sab se recent breaking news)
  const breakingNews = newsData
    .filter(news => news.isBreaking)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0];
  
  // Get featured items for ticker (latest 4 items from news, results, admissions)
  const getTickerItems = () => {
    const allItems: { title: string; slug: string; type: string }[] = [
      ...newsData.slice(0, 2).map(n => ({ title: n.title, slug: n.slug, type: 'news' })),
      ...latestResults.slice(0, 1).map(r => ({ 
        title: r.title, 
        slug: r.slug || r.title.toLowerCase().replace(/ /g, '-'), 
        type: 'result' 
      })),
      ...openAdmissions.slice(0, 1).map(a => ({ 
        title: a.programName, 
        slug: a.slug || a.programName.toLowerCase().replace(/ /g, '-'), 
        type: 'admission' 
      }))
    ];
    return allItems.slice(0, 4);
  };

  const tickerItems = getTickerItems();

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

  // Helper function to get date for sorting
  const getItemDate = (item: MixedItem): Date => {
    if (item.type === 'news') return new Date(item.publishedAt);
    if (item.type === 'result') return item.resultDate ? new Date(item.resultDate) : new Date();
    return item.expectedCloseDate ? new Date(item.expectedCloseDate) : new Date();
  };

  if (!hasData && !loading) {
    return null;
  }

  return (
    <section className="relative py-2 md:py-2 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      
      {/* Hidden H1 for SEO */}
      <h1 className="sr-only">
        NextID.pk - Pakistan's Largest Education Portal for Admissions 2026, Results, Date Sheets and Educational News
      </h1>
      
      {/* 🔴 BREAKING NEWS BAR - Sirf breaking news */}
      {breakingNews && (
        <div className="relative bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-4">
          <div className="container mx-auto flex items-center justify-center gap-3">
            <span className="animate-pulse">🔴</span>
            <span className="font-semibold text-sm md:text-base">
              BREAKING: {breakingNews.title}
            </span>
            <Link 
              href={`/news/${breakingNews.slug}`}
              className="text-white/90 hover:text-white underline ml-2 text-sm"
            >
              Read More →
            </Link>
          </div>
        </div>
      )}

      {/* ⚡ FEATURES TICKER - Latest updates from all sections */}
      {tickerItems.length > 0 && (
        <div className="bg-slate-900 text-white py-2 px-4 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {tickerItems.map((item, index) => (
              <Link 
                key={index}
                href={`/${item.type === 'news' ? 'news' : item.type === 'result' ? 'results' : 'admissions'}/${item.slug}`}
                className="mx-6 hover:underline cursor-pointer flex items-center gap-2"
              >
                {item.type === 'news' && '📰'}
                {item.type === 'result' && '📊'}
                {item.type === 'admission' && '🎓'}
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="container relative z-10 mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Search & Carousel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search Bar */}
            <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-200">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">🔍</span>
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
                  {cities.length > 0 ? (
                    cities.map((city) => (
                      <option key={city.id} value={city.name}>{city.name}</option>
                    ))
                  ) : (
                    <option value="All Cities">All Cities</option>
                  )}
                </select>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Search
                </button>
              </form>
            </div>

            {/* 🎠 CAROUSEL - Random items from recent news (max 4) */}
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
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 line-clamp-2">
                        {slide.title}
                      </h2>
                      <h3 className="text-xl md:text-2xl mb-4 opacity-90 line-clamp-1">
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
                        index === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
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
                  <p className="mt-2">
                    {loading ? 'Loading latest updates...' : 'Discover educational opportunities'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ✅ RIGHT COLUMN - SIRF NEWS */}
          {(newsData.length > 0 || loading) && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-2xl">📢</span>
                  LATEST UPDATES
                </h2>
              </div>

              {/* News Cards - Sirf News Items */}
              <div className="space-y-3">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    {(() => {
                      // Sirf news items lo, date ke hisaab se sort karo
                      const sortedNews = [...newsData].sort((a, b) => 
                        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
                      );

                      if (sortedNews.length === 0) {
                        return (
                          <div className="text-center py-8 bg-white/50 rounded-xl">
                            <p className="text-gray-500 text-sm">No news available</p>
                          </div>
                        );
                      }

                      // Show top 4 most recent news items
                      return sortedNews.slice(0, 4).map((newsItem) => (
                        <NewsCard
                          key={`news-${newsItem.id}`}
                          title={newsItem.title}
                          description={newsItem.excerpt || newsItem.title}
                          time={getTimeAgo(newsItem.publishedAt)}
                          icon="📰"
                          type="news"
                          link={`/news/${newsItem.slug}`}
                        />
                      ));
                    })()}
                  </>
                )}
              </div>
            </div>
          )}
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
        
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
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

  const displayTime = !time || time === 'NaN day ago' || time.includes('NaN') ? 'Recent' : time;

  if (!title || title === 'Latest News') {
    return null;
  }

  return (
    <Link href={link}>
      <div className={`bg-white/95 backdrop-blur-sm p-4 rounded-xl border-l-4 ${getBorderColor()} border border-slate-200 hover:shadow-lg transition-shadow duration-300 cursor-pointer group`}>
        <div className="flex items-start gap-3">
          <div className="text-xl mt-1">{icon}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {title}
              </h3>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded whitespace-nowrap ml-2">
                {displayTime}
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