// app/components/sections/Home/NewsSection.tsx

import Link from 'next/link';
import { postService } from '@/services/post/post.service';
import type { Post } from '@/repositories/post/post.repository';
import { cacheLife } from 'next/cache';

// ==================== TYPES ====================
interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  isBreaking: boolean;
  isFeatured: boolean;
  publishedAt: Date | null;
  imageUrl?: string | null;
}

// ==================== HELPERS ====================
function formatDate(dateValue: Date | string | null): string {
  if (!dateValue) return "";
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function getExcerpt(content: string | null, maxLength: number = 100): string {
  if (!content) return "";
  const plainText = content.replace(/<[^>]*>/g, "");
  return plainText.length > maxLength ? plainText.substring(0, maxLength) + "..." : plainText;
}

// ==================== MAIN COMPONENT WITH CACHE ====================
export default async function ProfessionalNewsSection() {
  'use cache';
  cacheLife('minutes'); // Cache for 15 minutes

  // ✅ ONLY fetch news posts (not admissions or results)
  const newsPosts = await postService.getPostsByType('news', 50);

  // Transform to NewsItem
  const newsItems: NewsItem[] = newsPosts.map((post: Post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    isBreaking: post.isBreaking || false,
    isFeatured: post.isFeatured || false,
    publishedAt: post.publishedAt,
    imageUrl: post.featuredImage,
  }));

  // Sort by published date (newest first)
  const sortedNews = newsItems
    .filter(p => p.publishedAt)
    .sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

  if (sortedNews.length === 0) {
    return (
      <div className="bg-gray-100 rounded-2xl p-12 text-center">
        <p className="text-gray-400">No news available at the moment</p>
      </div>
    );
  }

  // Get main featured news (first item)
  const mainNews = sortedNews[0];
  
  // Get next 2 news for right side
  const rightNews = sortedNews.slice(1, 3);
  
  // Get bottom 2 news
  const bottomNews = sortedNews.slice(3, 5);

  return (
    <section className="w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-blue-500 rounded-full"></div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              Latest<span className="text-blue-600"> News</span>
            </h2>
            <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">
              Updated
            </span>
          </div>
          <Link 
            href="/news" 
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group"
          >
            View All 
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* Main Grid: 1 Large Card + 2 Small Cards on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* LEFT: Main Large Card */}
          <Link href={`/news/${mainNews.slug}`} className="lg:col-span-2 block group">
            <div className="relative overflow-hidden rounded-2xl h-[380px] md:h-[420px] shadow-xl hover:shadow-2xl transition-all duration-500">
              {mainNews.imageUrl ? (
                <img
                  src={mainNews.imageUrl}
                  alt={mainNews.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700" />
              )}
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {mainNews.isBreaking && (
                    <span className="bg-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                      🔴 BREAKING
                    </span>
                  )}
                  <span className="text-xs bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
                    {formatDate(mainNews.publishedAt)}
                  </span>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold mb-3 line-clamp-2 group-hover:text-yellow-300 transition-colors">
                  {mainNews.title}
                </h3>
                
                <p className="text-sm text-gray-200 line-clamp-2 mb-4">
                  {getExcerpt(mainNews.excerpt || mainNews.content, 120)}
                </p>
                
                <div className="flex items-center gap-2 text-sm">
                  <span>📖</span>
                  <span>Read Full Story</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </Link>

          {/* RIGHT: 2 Small Cards Stacked */}
          <div className="space-y-4">
            {rightNews.map((news) => (
              <Link key={news.id} href={`/news/${news.slug}`} className="block group">
                <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex h-[180px]">
                  {/* Image Section */}
                  <div className="relative w-2/5">
                    {news.imageUrl ? (
                      <img
                        src={news.imageUrl}
                        alt={news.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-4xl">📰</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content Section */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {news.isBreaking && (
                          <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                            Breaking
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors text-sm md:text-base">
                        {news.title}
                      </h4>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {formatDate(news.publishedAt)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* BOTTOM: 2 Horizontal Cards */}
        {bottomNews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {bottomNews.map((news) => (
              <Link key={news.id} href={`/news/${news.slug}`} className="block group">
                <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex h-[140px]">
                  {/* Image Section */}
                  <div className="relative w-1/3">
                    {news.imageUrl ? (
                      <img
                        src={news.imageUrl}
                        alt={news.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-3xl">📰</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content Section */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {news.isBreaking && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                          🔴 Breaking
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {news.title}
                    </h4>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-1">
                      {getExcerpt(news.excerpt || news.content, 80)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}