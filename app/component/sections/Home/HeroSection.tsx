// app/component/sections/Home/HeroSection.tsx
"use client"; 

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  isBreaking: boolean;
  isFeatured: boolean;
  publishedAt: string;
  imageUrl?: string | null;
  viewCount?: number;
}

interface Props {
  category?: string;
  currentPath?: string;
}

export default function HeroSection({ category = 'home', currentPath = '/' }: Props) {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  // Helper: Get short preview from content
  const getContentPreview = (content: string | null, maxLength: number = 80) => {
    if (!content) return null;
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      const now = new Date();
      if (isNaN(date.getTime())) return 'Recently';
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
    } catch {
      return 'Recently';
    }
  };

  const formatViews = (views?: number) => {
    if (!views) return '0 views';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const newsRes = await fetch('/api/public/news?limit=30');
        const newsData = await newsRes.json();
        let news = newsData.success ? newsData.data : [];
        setNewsData(news);
        setHasData(news.length > 0);
      } catch (error) {
        console.error('Error fetching data:', error);
        setHasData(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Main Breaking News (Top Banner)
  const breakingMain = newsData
    .filter(news => news.isBreaking === true)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0];

  // Other Breaking News (3 cards)
  const breakingOthers = newsData
    .filter(news => news.isBreaking === true && news.id !== breakingMain?.id)
    .slice(0, 3);

  // Featured News
  const featuredNews = [...newsData]
    .filter(news => news.isFeatured === true && !news.isBreaking)
    .slice(0, 4);

  if (!hasData && !loading) return null;

  return (
    <section className="bg-white">
      <h1 className="sr-only">
        Latest Admissions 2026 in Pakistan | Universities, Results & Date Sheets updates – NextID.pk
      </h1>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ============================================ */}
          {/* LEFT COLUMN - MAIN BREAKING NEWS BANNER */}
          {/* WITH RED SHADE ON 25% LEFT SIDE */}
          {/* ============================================ */}
          <div className="lg:col-span-2">
            {breakingMain ? (
              <Link href={`/news/${breakingMain.slug}`} className="block group">
                <article className="relative overflow-hidden rounded-xl h-[350px] md:h-[450px] shadow-md">
                  
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    {breakingMain.imageUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={breakingMain.imageUrl}
                          alt={breakingMain.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          priority
                          sizes="(max-width: 768px) 100vw, 66vw"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-600 via-red-700 to-red-800"></div>
                    )}
                  </div>

                  {/* ✅ RED GRADIENT SHADE - 25% from left side */}
                  {/* Solid red on left edge, fading to transparent at 25% width */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-800/95 via-red-700/60 to-transparent"></div>
                  
                  {/* Content Container - Limited to 25-30% width (within red shade) */}
                  <div className="relative h-full flex flex-col justify-center z-10 w-[70%] sm:w-[60%] md:w-[50%] lg:w-[30%] px-5 md:px-6">
                    
                    {/* Breaking Badge */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-red-600 px-3 py-1.5 rounded-full">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        <span className="font-bold text-xs uppercase tracking-wider">Breaking</span>
                      </div>
                      <span className="text-xs text-white/80 bg-black/30 px-2 py-1 rounded-full">
                        {getTimeAgo(breakingMain.publishedAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 line-clamp-3 leading-tight text-white">
                      {breakingMain.title}
                    </h2>

                    {/* Short Details from Content */}
                    {(breakingMain.content || breakingMain.excerpt) && (
                      <p className="text-xs md:text-sm text-white/90 line-clamp-2 max-w-lg mb-4">
                        {getContentPreview(breakingMain.content || breakingMain.excerpt, 90)}
                      </p>
                    )}

                    {/* Views + Post Date */}
                    <div className="flex items-center gap-4 text-white/70 text-xs">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {formatViews(breakingMain.viewCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {getTimeAgo(breakingMain.publishedAt)}
                      </span>
                    </div>

                    {/* Read More Link */}
                    <div className="mt-5">
                      <span className="inline-flex items-center gap-1 text-white font-medium text-sm border-b border-white/50 pb-0.5 group-hover:gap-2 transition-all">
                        Read full story
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ) : (
              <div className="bg-gray-100 rounded-xl h-[300px] md:h-[450px] flex items-center justify-center">
                <p className="text-gray-500">No breaking news available</p>
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* RIGHT COLUMN - FEATURED NEWS */}
          {/* ============================================ */}
          <aside className="lg:col-span-1">
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3 bg-gray-50">
                <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
                  Featured News
                </h2>
              </div>
              
              <div className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="p-3 animate-pulse flex gap-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-full"></div>
                      </div>
                    </div>
                  ))
                ) : featuredNews.length > 0 ? (
                  featuredNews.map((news) => (
                    <Link 
                      key={news.id}
                      href={`/news/${news.slug}`}
                      className="block p-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                          {news.imageUrl ? (
                            <Image
                              src={news.imageUrl}
                              alt={news.title}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                              <span className="text-xl">📰</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 group-hover:text-orange-600 transition-colors mb-1">
                            {news.title}
                          </h3>
                          {(news.content || news.excerpt) && (
                            <p className="text-xs text-gray-500 line-clamp-2 mb-1">
                              {getContentPreview(news.content || news.excerpt, 70)}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-gray-400 text-[10px]">
                            <span className="flex items-center gap-1">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {getTimeAgo(news.publishedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {formatViews(news.viewCount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    <p>No featured news available</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* ============================================ */}
        {/* OTHER BREAKING NEWS - 3 Cards */}
        {/* ============================================ */}
        {breakingOthers.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-red-500 rounded-full"></div>
              <h2 className="text-base md:text-lg font-bold text-gray-800">More Breaking News</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {breakingOthers.map((news) => (
                <Link
                  key={news.id}
                  href={`/news/${news.slug}`}
                  className="group block bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100"
                >
                  <div className="flex gap-3 p-3">
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                      {news.imageUrl ? (
                        <Image
                          src={news.imageUrl}
                          alt={news.title}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                          <span className="text-2xl">📰</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">NEW</span>
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 group-hover:text-red-600 transition-colors mb-1">
                        {news.title}
                      </h3>
                      {(news.content || news.excerpt) && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {getContentPreview(news.content || news.excerpt, 60)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-gray-400 text-[10px]">
                        <span className="flex items-center gap-1">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {getTimeAgo(news.publishedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {formatViews(news.viewCount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
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