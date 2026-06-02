// app/components/sections/Home/HeroSection.tsx

import Image from "next/image";
import Link from "next/link";
import { postService } from '@/services/post/post.service';
import type { Post } from '@/repositories/post/post.repository';
import { cacheLife } from 'next/cache';

// Types
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

// Format date for display
function getTimeAgo(dateValue: Date | string | null, currentDate: Date): string {
  if (!dateValue) return "Recently";

  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  
  if (isNaN(date.getTime())) return "Recently";

  const diffMs = currentDate.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
  });
}

function getContentPreview(content: string | null, maxLength: number = 80): string | null {
  if (!content) return null;
  const plainText = content.replace(/<[^>]*>/g, "");
  return plainText.length <= maxLength
    ? plainText
    : plainText.substring(0, maxLength) + "...";
}

// Component for Breaking News Card (Small)
function BreakingNewsCard({ news, currentDate }: { news: NewsItem; currentDate: Date }) {
  return (
    <Link href={`/news/${news.slug}`} className="block group">
      <div className="p-4 border rounded-lg hover:shadow-lg transition-all duration-300 hover:border-red-300 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-transparent">
        <div className="flex items-start gap-3">
          {news.imageUrl ? (
            <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
              <Image
                src={news.imageUrl}
                alt={news.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="w-16 h-16 flex-shrink-0 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                Breaking
              </span>
              <span className="text-xs text-gray-400">{getTimeAgo(news.publishedAt, currentDate)}</span>
            </div>
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-red-600 transition-colors">
              {news.title}
            </h3>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span>↗️</span> Read more
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Component for Featured News Item (Sidebar)
function FeaturedNewsItem({ news, index, currentDate }: { news: NewsItem; index: number; currentDate: Date }) {
  return (
    <Link
      href={`/news/${news.slug}`}
      className="block p-3 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-transparent transition-all duration-300 group border-l-2 border-transparent hover:border-orange-500"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
          {index + 1}
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-orange-600 transition-colors">
            {news.title}
          </h3>
          
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span>🕒</span> {getTimeAgo(news.publishedAt, currentDate)}
            </span>
          </div>
          
          <div className="hidden group-hover:block mt-2 text-xs text-gray-600 line-clamp-1">
            {getContentPreview(news.excerpt || news.content, 60)}
          </div>
        </div>
        
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1">
          <span className="text-orange-500">→</span>
        </div>
      </div>
    </Link>
  );
}

// ✅ MAIN COMPONENT WITH CACHE
export default async function HeroSection() {
  'use cache'
  cacheLife('minutes') // Cache for 15 minutes
  
  const newsData = await postService.getPostsByType('news', 20);
  
  // Transform posts to news format (without viewCount)
  const transformedNews: NewsItem[] = newsData.map((post: Post) => ({
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
  const sortedNews = transformedNews.sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  // Get current date inside cached component (allowed!)
  const currentDate = new Date();

  if (!sortedNews.length) {
    return (
      <section className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-400 mb-2">No DATA available at the moment</p>
          <p className="text-sm text-gray-300">Check back later for updates</p>
        </div>
      </section>
    );
  }

  // Breaking main (latest breaking news)
  const breakingMain = sortedNews
    .filter((n) => n.isBreaking)
    .sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    })[0];

  // Other breaking news (excluding the main one)
  const breakingOthers = sortedNews
    .filter((n) => n.isBreaking && n.id !== breakingMain?.id)
    .slice(0, 3);

  // Featured news
  const featuredNews = sortedNews
    .filter((n) => n.isFeatured && !n.isBreaking)
    .slice(0, 4);

  return (
    <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <h1 className="sr-only">
        Latest Admissions 2026 in Pakistan | Universities, Results & Date Sheets updates – NextID.pk
      </h1>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT - MAIN HERO */}
          <div className="lg:col-span-2">
            {breakingMain ? (
              <Link href={`/news/${breakingMain.slug}`} className="block group">
                <article className="relative overflow-hidden rounded-2xl h-[350px] md:h-[450px] shadow-2xl hover:shadow-3xl transition-shadow duration-500">

                  {breakingMain.imageUrl ? (
                    <Image
                      src={breakingMain.imageUrl}
                      alt={breakingMain.title}
                      fill
                      priority
                      fetchPriority="high"
                      sizes="(max-width: 768px) 100vw, 66vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-900" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 to-transparent" />

                  <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-10 text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        🔴 BREAKING
                      </span>
                      <span className="text-xs bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
                        {getTimeAgo(breakingMain.publishedAt, currentDate)}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold line-clamp-2 mb-3 group-hover:text-yellow-300 transition-colors">
                      {breakingMain.title}
                    </h2>

                    <p className="text-sm opacity-90 line-clamp-2 mb-4">
                      {getContentPreview(
                        breakingMain.content || breakingMain.excerpt,
                        120
                      )}
                    </p>

                    <div className="flex items-center gap-4 text-xs opacity-80">
                      <span className="flex items-center gap-1">
                        <span>↗️</span> Click to read full story
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ) : (
              <div className="bg-gray-100 rounded-2xl h-[350px] md:h-[450px] flex items-center justify-center">
                <p className="text-gray-400">No breaking news available</p>
              </div>
            )}
          </div>

          {/* RIGHT - FEATURED NEWS */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl border shadow-lg overflow-hidden sticky top-24">
              <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">Featured News</h3>
                    <p className="text-xs text-orange-100 mt-1">Most popular stories</p>
                  </div>
                  <div className="text-2xl">⭐</div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {featuredNews.length > 0 ? (
                  featuredNews.map((news, idx) => (
                    <FeaturedNewsItem key={news.id} news={news} index={idx} currentDate={currentDate} />
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-400 text-sm">
                    No featured news available
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-gray-50 text-center border-t">
                <Link 
                  href="/news" 
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium inline-flex items-center gap-1 group"
                >
                  View All News 
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* BREAKING NEWS STRIP */}
        {breakingOthers.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-red-600 rounded-full"></div>
              <h3 className="font-bold text-gray-800">More Breaking News</h3>
              <span className="text-xs text-gray-400">🔥 Latest updates</span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {breakingOthers.map((news) => (
                <BreakingNewsCard key={news.id} news={news} currentDate={currentDate} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}