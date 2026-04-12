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
    <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <h1 className="sr-only">
        Latest Admissions 2026 in Pakistan | Universities, Results & Date Sheets updates – NextID.pk
      </h1>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ============================================ */}
          {/* LEFT COLUMN - MAIN BREAKING NEWS BANNER */}
          {/* WITH RED SHADE ON 25% LEFT SIDE */}
          {/* ============================================ */}
          <div className="lg:col-span-2">
            {breakingMain ? (
              <Link href={`/news/${breakingMain.slug}`} className="block group">
                <article className="relative overflow-hidden rounded-2xl h-[350px] md:h-[450px] shadow-2xl hover:shadow-3xl transition-all duration-500">
                  
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
                      <div className="w-full h-full bg-gradient-to-br from-red-600 via-red-700 to-red-900"></div>
                    )}
                  </div>

                  {/* ✅ RED GRADIENT SHADE - Enhanced with better gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-900/98 via-red-800/75 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Content Container */}
                  <div className="relative h-full flex flex-col justify-center z-10 w-[70%] sm:w-[60%] md:w-[50%] lg:w-[30%] px-6 md:px-8">
                    
                    {/* Breaking Badge - Enhanced */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <div className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="font-bold text-xs uppercase tracking-wider text-white">Breaking</span>
                      </div>
                      <span className="text-xs text-white/90 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full font-medium">
                        {getTimeAgo(breakingMain.publishedAt)}
                      </span>
                    </div>

                    {/* Title - Enhanced Typography */}
                    <h2 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-4 line-clamp-3 leading-tight text-white drop-shadow-lg">
                      {breakingMain.title}
                    </h2>

                    {/* Short Details - Enhanced */}
                    {(breakingMain.content || breakingMain.excerpt) && (
                      <p className="text-sm md:text-base text-white/95 line-clamp-2 max-w-lg mb-5 leading-relaxed drop-shadow-md">
                        {getContentPreview(breakingMain.content || breakingMain.excerpt, 90)}
                      </p>
                    )}

                    {/* Views + Post Date - Enhanced with Icons */}
                    <div className="flex items-center gap-4 text-white/80 text-xs mb-6">
                      <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {formatViews(breakingMain.viewCount)}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {getTimeAgo(breakingMain.publishedAt)}
                      </span>
                    </div>

                    {/* Read More Link - Enhanced */}
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-2 text-white font-semibold text-sm border-b-2 border-white/60 pb-1 group-hover:gap-3 group-hover:border-white transition-all">
                        Read full story
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ) : (
              <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl h-[300px] md:h-[450px] flex items-center justify-center shadow-lg">
                <p className="text-gray-400 font-medium">No breaking news available</p>
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* RIGHT COLUMN - FEATURED NEWS */}
          {/* ============================================ */}
          <aside className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl">
              <div className="border-b border-gray-200 px-5 py-4 bg-gradient-to-r from-orange-500 to-red-500">
                <h2 className="font-bold text-white text-base flex items-center gap-2">
                  
                  Featured News
                </h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="p-4 animate-pulse flex gap-3">
                      <div className="w-20 h-20 bg-gray-200 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))
                ) : featuredNews.length > 0 ? (
                  featuredNews.map((news) => (
                    <Link 
                      key={news.id}
                      href={`/news/${news.slug}`}
                      className="block p-4 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-300 group"
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shadow-md">
                          {news.imageUrl ? (
                            <Image
                              src={news.imageUrl}
                              alt={news.title}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                              <span className="text-2xl">📰</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-orange-600 transition-colors mb-1.5 leading-snug">
                            {news.title}
                          </h3>
                          {(news.content || news.excerpt) && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                              {getContentPreview(news.content || news.excerpt, 70)}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-gray-400 text-[10px]">
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {getTimeAgo(news.publishedAt)}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div className="p-10 text-center text-gray-400 text-sm">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
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
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-5 py-2.5 rounded-lg shadow-lg">
                
                <h2 className="text-base font-bold">Breaking News</h2>
              </div>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-red-600/30 to-transparent rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {breakingOthers.map((news) => (
                <Link
                  key={news.id}
                  href={`/news/${news.slug}`}
                  className="group block bg-white rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-red-300"
                >
                  <div className="flex gap-4 p-4">
                    <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shadow-md">
                      {news.imageUrl ? (
                        <Image
                          src={news.imageUrl}
                          alt={news.title}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center">
                          <span className="text-3xl">📰</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">NEW</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-red-600 transition-colors mb-2 leading-snug">
                        {news.title}
                      </h3>
                      {(news.content || news.excerpt) && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                          {getContentPreview(news.content || news.excerpt, 60)}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-gray-400 text-[10px]">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {getTimeAgo(news.publishedAt)}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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