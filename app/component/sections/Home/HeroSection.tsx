// app/component/sections/Home/HeroSection.tsx

import Image from "next/image";
import Link from "next/link";

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

// Server-side data fetching (FIXED LCP ISSUE)
async function getNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(`/api/public/news?limit=10`, {
      next: { revalidate: 60 },
    });

    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

// Utility functions (kept lightweight)
function getContentPreview(content: string | null, maxLength: number = 80) {
  if (!content) return null;
  const plainText = content.replace(/<[^>]*>/g, "");
  return plainText.length <= maxLength
    ? plainText
    : plainText.substring(0, maxLength) + "...";
}

function getTimeAgo(dateString: string) {
  if (!dateString) return "Recently";

  const date = new Date(dateString);
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

function formatViews(views?: number) {
  if (!views) return "0 views";
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
  return `${views} views`;
}

export default async function HeroSection({
  category = "home",
  currentPath = "/",
}: Props) {
  const newsData = await getNews();

if (!newsData.length) {
  return (
    <section className="h-[400px] flex items-center justify-center bg-gray-50">
      <p className="text-gray-400">Loading latest news...</p>
    </section>
  );
}

  // Breaking main
  const breakingMain = newsData
    .filter((n) => n.isBreaking)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime()
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
            ) : null}
          </div>

          {/* RIGHT - FEATURED */}
          <aside className="lg:col-span-1 bg-white rounded-2xl border shadow">
            <div className="p-4 border-b font-bold bg-orange-500 text-white">
              Featured News
            </div>

            <div className="divide-y">
              {featuredNews.map((news) => (
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
              ))}
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