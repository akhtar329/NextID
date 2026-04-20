// app/component/sections/Home/HeroSection.tsx

import Image from "next/image";
import Link from "next/link";
import { db } from '@/app/lib/db';
import { news } from '@/app/lib/schema';
import { desc } from 'drizzle-orm'; // Removed unused 'eq'

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  isBreaking: boolean;
  isFeatured: boolean;
  publishedAt: Date | null; // Changed from string to Date | null to match database
  imageUrl?: string | null;
  viewCount?: number;
}

// Direct database query instead of API call
async function getNews(): Promise<NewsItem[]> {
  try {
    const newsData = await db
      .select()
      .from(news)
      .orderBy(desc(news.publishedAt))
      .limit(10);
    
    // No type conversion needed now that types match
    return newsData as NewsItem[];
  } catch (error) {
    console.error("Error fetching news from database:", error);
    return [];
  }
}

// Updated utility function to handle Date object
function getTimeAgo(dateValue: Date | string | null): string {
  if (!dateValue) return "Recently";

  // Convert to Date if it's a string
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  
  const now = new Date();

  if (isNaN(date.getTime())) return "Recently";

  const diffMs = now.getTime() - date.getTime();
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

function formatViews(views?: number): string {
  if (!views) return "0 views";
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
  return `${views} views`;
}

export default async function HeroSection() {
  const newsData = await getNews();

  if (!newsData.length) {
    return (
      <section className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-400 mb-2">No news available at the moment</p>
          <p className="text-sm text-gray-300">Check back later for updates</p>
        </div>
      </section>
    );
  }

  // Breaking main
  const breakingMain = newsData
    .filter((n) => n.isBreaking)
    .sort(
      (a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      }
    )[0];

  // Others
  const breakingOthers = newsData
    .filter((n) => n.isBreaking && n.id !== breakingMain?.id)
    .slice(0, 3);

  // Featured
  const featuredNews = newsData
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
                <article className="relative overflow-hidden rounded-2xl h-[350px] md:h-[450px] shadow-2xl">

                  {/* Image */}
                  {breakingMain.imageUrl ? (
                    <Image
                      src={breakingMain.imageUrl}
                      alt={breakingMain.title}
                      fill
                      priority
                      fetchPriority="high"
                      sizes="(max-width: 768px) 100vw, 66vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-900" />
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-900/80 to-transparent" />

                  {/* Content */}
                  <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-10 text-white">

                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-red-600 px-3 py-1 rounded-full text-xs font-bold">
                        Breaking
                      </span>
                      <span className="text-xs bg-black/30 px-2 py-1 rounded">
                        {getTimeAgo(breakingMain.publishedAt)}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold line-clamp-2 mb-3">
                      {breakingMain.title}
                    </h2>

                    <p className="text-sm opacity-90 line-clamp-2 mb-4">
                      {getContentPreview(
                        breakingMain.content || breakingMain.excerpt,
                        120
                      )}
                    </p>

                    <div className="text-xs opacity-80">
                      {formatViews(breakingMain.viewCount)}
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

          {/* RIGHT - FEATURED */}
          <aside className="lg:col-span-1 bg-white rounded-2xl border shadow">
            <div className="p-4 border-b font-bold bg-orange-500 text-white">
              Featured News
            </div>

            <div className="divide-y">
              {featuredNews.length > 0 ? (
                featuredNews.map((news) => (
                  <Link
                    key={news.id}
                    href={`/news/${news.slug}`}
                    className="block p-3 hover:bg-gray-50"
                  >
                    <h3 className="text-sm font-semibold line-clamp-2">
                      {news.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {getTimeAgo(news.publishedAt)}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No featured news
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* BREAKING OTHERS */}
        {breakingOthers.length > 0 && (
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {breakingOthers.map((news) => (
              <Link
                key={news.id}
                href={`/news/${news.slug}`}
                className="p-4 border rounded-lg hover:shadow"
              >
                <h3 className="font-semibold text-sm line-clamp-2">
                  {news.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {getTimeAgo(news.publishedAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}