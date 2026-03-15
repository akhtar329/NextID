// app/(public)/news/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { news } from '@/app/lib/schema';
import { eq, desc, and, like, or, sql } from 'drizzle-orm';
import { BreakingNewsCarousel } from './BreakingNewsCarousel';
import type { NewsItem, TrendingItem, Category } from '@/app/types/types';
import { formatDate, formatViews } from '@/app/types/types';
import React from 'react';

// ==================== METADATA ====================
export const metadata: Metadata = {
  title: 'Education News Pakistan 2026 | Latest Updates | NextID.pk',
  description: 'Stay updated with latest education news in Pakistan: admissions, results, scholarships, board announcements & university updates.',
  alternates: {
    canonical: 'https://www.nextid.pk/news',
  },
  openGraph: {
    title: 'Education News Pakistan - Latest Updates',
    description: 'Get real-time education news, results, and admission alerts',
    images: ['/og-news.jpg'],
  }
};

// ==================== DATA FETCHING ====================
async function getNews(filters: { q?: string; page?: number }) {
  try {
    const conditions: any[] = [eq(news.status, true)];
    
    const page = filters.page || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    if (filters.q) {
      const term = `%${filters.q}%`;
      conditions.push(or(
        like(news.title, term),
        like(news.excerpt, term),
        like(news.content, term)
      ));
    }

    const data = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        excerpt: news.excerpt,
        imageUrl: news.imageUrl,
        source: news.source,
        author: news.author,
        isBreaking: news.isBreaking,
        views: news.views,
        publishedAt: news.publishedAt,
      })
      .from(news)
      .where(and(...conditions))
      .orderBy(desc(news.publishedAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(news)
      .where(and(...conditions))
      .then(r => Number(r[0]?.count) || 0);

    return { news: data as NewsItem[], total, page, pages: Math.ceil(total / limit) };
  } catch (error) {
    console.error('Error fetching news:', error);
    return { news: [], total: 0, page: 1, pages: 0 };
  }
}

// ==================== GET TRENDING ====================
async function getTrending() {
  try {
    const data = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        views: news.views,
        publishedAt: news.publishedAt,
      })
      .from(news)
      .where(eq(news.status, true))
      .orderBy(desc(news.views))
      .limit(5);

    return data as TrendingItem[];
  } catch (error) {
    return [];
  }
}

// ==================== GET CATEGORY COUNTS ====================
async function getCategoryCounts(): Promise<Category[]> {
  try {
    const categories = [
      { name: 'Admissions', slug: 'admissions', count: 156, icon: '🎓' },
      { name: 'Results', slug: 'results', count: 243, icon: '📊' },
      { name: 'Scholarships', slug: 'scholarships', count: 89, icon: '💰' },
      { name: 'Board News', slug: 'boards', count: 167, icon: '📋' },
      { name: 'Universities', slug: 'universities', count: 198, icon: '🏛️' },
      { name: 'Jobs', slug: 'jobs', count: 76, icon: '💼' },
    ];
    
    return categories;
  } catch (error) {
    return [];
  }
}

// ==================== NEWS CARD COMPONENT ====================
function NewsCard({ item }: { item: NewsItem }) {
  const hasImage = !!item.imageUrl;
  
  return (
    <Link 
      href={`/news/${item.slug}`}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 h-full"
    >
      <div className={`relative overflow-hidden ${hasImage ? 'h-48' : 'h-32'} w-full`}>
        {hasImage ? (
          <img
            src={item.imageUrl!}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <span className="text-4xl text-white/80">📰</span>
          </div>
        )}
        
        {item.isBreaking && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              BREAKING
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="text-gray-400">📅</span>
            {formatDate(item.publishedAt)}
          </span>
          {item.source && (
            <>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="flex items-center gap-1">
                <span className="text-gray-400">📰</span>
                <span className="truncate max-w-[100px]">{item.source}</span>
              </span>
            </>
          )}
        </div>
        
        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 text-base">
          {item.title}
        </h3>
        
        {item.excerpt && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {item.excerpt}
          </p>
        )}
        
        <div className="flex items-center text-blue-600 text-xs font-medium mt-auto">
          <span>Read full article</span>
          <span className="ml-1 group-hover:ml-2 transition-all">→</span>
        </div>
      </div>
    </Link>
  );
}

// ==================== TRENDING ITEM COMPONENT ====================
function TrendingItem({ item, index }: { item: TrendingItem; index: number }) {
  return (
    <Link
      href={`/news/${item.slug}`}
      className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition group"
    >
      <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
        index === 0 ? 'bg-yellow-100 text-yellow-700' :
        index === 1 ? 'bg-gray-100 text-gray-700' :
        index === 2 ? 'bg-orange-100 text-orange-700' :
        'bg-blue-50 text-blue-600'
      }`}>
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
          {item.title}
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          {formatDate(item.publishedAt)} • {formatViews(item.views || 0)} views
        </p>
      </div>
    </Link>
  );
}

// ==================== MAIN PAGE ====================
export default async function NewsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams || {};
  
  const filters = {
    q: typeof params.q === 'string' ? params.q : '',
    page: typeof params.page === 'string' ? parseInt(params.page) : 1,
  };

  const [newsData, trending, categories] = await Promise.all([
    getNews(filters),
    getTrending(),
    getCategoryCounts(),
  ]);

  const { news, total, page, pages } = newsData;

  const breakingNews = news.filter(n => n.isBreaking === true);
  const normalNews = news.filter(n => !n.isBreaking);

  const buildUrl = (key: string, value: string) => {
    const urlParams = new URLSearchParams();
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (value) urlParams.set(key, value);
    const str = urlParams.toString();
    return str ? `/news?${str}` : '/news';
  };

  return (
    <main className="min-h-screen bg-gray-50">
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsMediaOrganization",
            "name": "NextID.pk",
            "url": "https://www.nextid.pk/news",
            "description": "Pakistan's leading education news platform"
          })
        }}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-blue-200 mb-4">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span className="text-blue-300">›</span>
              <span className="text-white font-medium">News</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Education News</span>{' '}
              <span className="text-yellow-400">Pakistan</span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Real-time updates on admissions, results, scholarships, and educational policies
            </p>
            
            <div className="max-w-2xl mx-auto">
              <form action="/news" method="GET" className="relative">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                    🔍
                  </span>
                  <input
                    type="text"
                    name="q"
                    defaultValue={filters.q}
                    placeholder="Search for news, results, admissions..."
                    className="w-full pl-12 pr-32 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400/50 shadow-lg bg-white"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition shadow-md"
                  >
                    Search
                  </button>
                </div>
              </form>
              
              <div className="flex items-center justify-center gap-2 mt-4 text-sm">
                <span className="text-blue-200">Popular:</span>
                {['Matric Results', 'University Admissions', 'Scholarships'].map((term, i) => (
                  <Link
                    key={i}
                    href={`/news?q=${encodeURIComponent(term)}`}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Filters */}
      {filters.q && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Search results for:</span>
              <span className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-full font-medium">
                "{filters.q}"
              </span>
              <span className="text-sm text-gray-500">
                Found {total} articles
              </span>
            </div>
            <Link 
              href="/news" 
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <span>Clear</span>
              <span>×</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content - 8 columns */}
          <div className="lg:col-span-8 space-y-8">

            {/* BREAKING NEWS CAROUSEL */}
            {breakingNews.length > 0 && (
              <BreakingNewsCarousel 
                breakingNews={breakingNews} 
              />
            )}

            {/* ALL NEWS GRID */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                  Latest News
                </h2>
                <p className="text-sm text-gray-500">
                  Page {page} of {pages}
                </p>
              </div>
              
              {normalNews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {normalNews.map(item => (
                    <NewsCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl">
                  <p className="text-gray-500">No news articles found</p>
                </div>
              )}
            </div>

            {/* No Results */}
            {news.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <div className="text-8xl mb-4 animate-bounce">📰</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search or filter</p>
                <Link
                  href="/news"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  View all news
                </Link>
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && normalNews.length > 0 && (
              <div className="flex justify-center mt-12">
                <nav className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm">
                  <Link
                    href={buildUrl('page', (page - 1).toString())}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      page <= 1 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    ← Previous
                  </Link>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                      let pageNum: number;
                      if (pages <= 7) {
                        pageNum = i + 1;
                      } else if (page <= 4) {
                        pageNum = i + 1;
                      } else if (page >= pages - 3) {
                        pageNum = pages - 6 + i;
                      } else {
                        pageNum = page - 3 + i;
                      }
                      
                      return (
                        <Link
                          key={pageNum}
                          href={buildUrl('page', pageNum.toString())}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition ${
                            page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      );
                    })}
                  </div>
                  
                  <Link
                    href={buildUrl('page', (page + 1).toString())}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      page >= pages 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Next →
                  </Link>
                </nav>
              </div>
            )}
          </div>

          {/* Sidebar - 4 columns */}
          <aside className="lg:col-span-4">
            <div className="space-y-6 sticky top-24">
              
              {/* Categories Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <span>📚</span>
                    News Categories
                  </h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((cat, i) => (
                      <Link
                        key={i}
                        href={`/news/category/${cat.slug}`}
                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition group"
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900 group-hover:text-blue-600">
                            {cat.name}
                          </div>
                          <div className="text-xs text-gray-500">{cat.count} articles</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trending Now */}
              {trending.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 px-5 py-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <span>🔥</span>
                      Trending Now
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-1">
                      {trending.map((item, index) => (
                        <TrendingItem key={item.id} item={item} index={index} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Resources */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>⚡</span>
                  Quick Resources
                </h3>
                <div className="space-y-2">
                  {[
                    { name: 'Admissions 2026', href: '/admissions', icon: '📝' },
                    { name: 'Result 2026', href: '/results', icon: '📊' },
                    { name: 'Merit Lists', href: '/merit', icon: '📋' },
                    { name: 'Past Papers', href: '/past-papers', icon: '📚' },
                  ].map((link, i) => (
                    <Link
                      key={i}
                      href={link.href}
                      className="flex items-center gap-3 p-2 hover:bg-blue-50 rounded-lg transition group"
                    >
                      <span className="text-xl">{link.icon}</span>
                      <span className="text-gray-700 group-hover:text-blue-600">{link.name}</span>
                      <span className="ml-auto text-gray-400 group-hover:text-blue-600">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}