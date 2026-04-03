import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { news } from '@/app/lib/schema';
import { eq, desc, and, like, or, sql } from 'drizzle-orm';
import type { NewsItem, TrendingItem, Category } from '@/app/types/types';

// ==================== FORMAT FUNCTIONS ====================
function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatViews(views: number | null): string {
  if (!views) return '0';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
}

function getReadTime(content: string | null): string {
  if (!content) return '1 min read';
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

// ==================== METADATA ====================
export const metadata: Metadata = {
  title: 'Education News Pakistan 2026 | Latest Updates | NextID.pk',
  description: 'Stay updated with latest education news in Pakistan: admissions, results, scholarships, board announcements & university updates.',
  alternates: { canonical: 'https://www.nextid.pk/news' },
  openGraph: {
    title: 'Education News Pakistan - Latest Updates',
    description: 'Get real-time education news, results, and admission alerts',
    images: ['/og-news.jpg'],
  }
};

// ==================== DATA FETCHING ====================
async function getNews(filters: { q?: string; page?: number; category?: string }) {
  try {
    const conditions: any[] = [eq(news.status, true)];
    
    const page = filters.page || 1;
    const limit = 12;
    const offset = (page - 1) * limit;

    if (filters.q) {
      const term = `%${filters.q}%`;
      conditions.push(or(
        like(news.title, term),
        like(news.excerpt, term),
        like(news.content, term)
      ));
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      const categoryKeywords: Record<string, string[]> = {
        'admissions': ['admission', 'apply', 'enroll', 'registration', 'open'],
        'results': ['result', 'announced', 'gazette', 'position', 'marks'],
        'scholarships': ['scholarship', 'financial aid', 'grant', 'fund', 'stipend'],
        'boards': ['board', 'bise', 'fbise', 'examination', 'matric', 'inter'],
        'universities': ['university', 'college', 'campus', 'faculty', 'department'],
        'jobs': ['job', 'career', 'vacancy', 'recruitment', 'employment'],
      };
      
      const keywords = categoryKeywords[filters.category] || [];
      if (keywords.length > 0) {
        const keywordConditions = keywords.flatMap(keyword => [
          like(news.title, `%${keyword}%`),
          like(news.excerpt, `%${keyword}%`),
        ]);
        conditions.push(or(...keywordConditions));
      }
    }

    const data = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        excerpt: news.excerpt,
        content: news.content,
        imageUrl: news.imageUrl,
        source: news.source,
        author: news.author,
        isBreaking: news.isBreaking,
        views: news.views,
        publishedAt: news.publishedAt,
      })
      .from(news)
      .where(and(...conditions))
      .orderBy(desc(news.isBreaking), desc(news.publishedAt))
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

async function getCategoryCounts(): Promise<Category[]> {
  return [
    { name: 'All News', slug: 'all', count: 0, icon: '' },
    { name: 'Admissions', slug: 'admissions', count: 156, icon: '' },
    { name: 'Results', slug: 'results', count: 243, icon: '' },
    { name: 'Scholarships', slug: 'scholarships', count: 89, icon: '' },
    { name: 'Board News', slug: 'boards', count: 167, icon: '' },
    { name: 'Universities', slug: 'universities', count: 198, icon: '' },
    { name: 'Jobs', slug: 'jobs', count: 76, icon: '' },
  ];
}

// ==================== COMPONENTS ====================

// 1. HERO SECTION with Breaking News Banner (Dunya News Style)
function HeroSection({ breakingNews }: { breakingNews: NewsItem[] }) {
  const topBreaking = breakingNews[0];
  const otherBreaking = breakingNews.slice(1, 4);
  
  if (!topBreaking) return null;
  
  return (
    <div className="mb-8">
      {/* Main Breaking News Banner */}
      <div className="relative bg-gradient-to-r from-red-700 to-red-600 rounded-xl overflow-hidden mb-4 shadow-lg">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-white text-red-600 text-xs font-bold rounded-md animate-pulse">
              BREAKING NEWS
            </span>
            <span className="text-white/80 text-sm">{formatDate(topBreaking.publishedAt)}</span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
            {topBreaking.title}
          </h2>
          <p className="text-white/90 mb-4 line-clamp-2 text-sm md:text-base">
            {topBreaking.excerpt}
          </p>
          <Link 
            href={`/news/${topBreaking.slug}`}
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-lg font-medium transition-all"
          >
            Read Full Story <span className="text-lg">→</span>
          </Link>
        </div>
      </div>
      
      {/* Small Breaking News Grid - 3 columns */}
      {otherBreaking.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {otherBreaking.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.slug}`}
              className="group block bg-red-50 rounded-lg p-4 border-l-4 border-red-600 hover:shadow-md transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-600 text-xs font-bold">BREAKING</span>
                <span className="text-xs text-gray-500">{formatDate(item.publishedAt)}</span>
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition line-clamp-2 text-sm">
                {item.title}
              </h3>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// 2. CATEGORY NAVBAR (Dunya News Style)
function CategoryNav({ categories, activeCategory }: { categories: Category[]; activeCategory: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/news${cat.slug !== 'all' ? `?category=${cat.slug}` : ''}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeCategory === cat.slug
                ? 'bg-red-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {cat.name}
            {cat.count > 0 && (
              <span className={`ml-1 text-xs ${
                activeCategory === cat.slug ? 'text-white/80' : 'text-gray-400'
              }`}>
                ({cat.count})
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

// 3. NEWS CARD (Dunya News Style)
function NewsCard({ item, isFeatured = false }: { item: NewsItem; isFeatured?: boolean }) {
  const hasImage = !!item.imageUrl;
  
  if (isFeatured) {
    // Featured/Large card for first item
    return (
      <Link 
        href={`/news/${item.slug}`}
        className="group block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-200"
      >
        <div className="relative h-64 w-full overflow-hidden">
          {hasImage ? (
            <img
              src={item.imageUrl!}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <span className="text-4xl text-white/50">News</span>
            </div>
          )}
          {item.isBreaking && (
            <div className="absolute top-4 left-4">
              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                BREAKING
              </span>
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            <span>{formatDate(item.publishedAt)}</span>
            <span>•</span>
            <span>{getReadTime(item.content)}</span>
            {item.source && (
              <>
                <span>•</span>
                <span>{item.source}</span>
              </>
            )}
          </div>
          <h3 className="font-bold text-xl text-gray-900 group-hover:text-red-600 transition line-clamp-2 mb-2">
            {item.title}
          </h3>
          <p className="text-gray-600 line-clamp-2 text-sm">
            {item.excerpt}
          </p>
          <div className="mt-4 flex items-center text-red-600 text-sm font-medium">
            Read Full Article <span className="ml-1 group-hover:ml-2 transition-all">→</span>
          </div>
        </div>
      </Link>
    );
  }
  
  // Regular card
  return (
    <Link 
      href={`/news/${item.slug}`}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-200 h-full"
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
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <span className="text-3xl text-white/50">News</span>
          </div>
        )}
        {item.isBreaking && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">
              BREAKING
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 flex-wrap">
          <span>{formatDate(item.publishedAt)}</span>
          <span>•</span>
          <span>{getReadTime(item.content)}</span>
        </div>
        
        <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition line-clamp-2 mb-2">
          {item.title}
        </h3>
        
        {item.excerpt && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {item.excerpt}
          </p>
        )}
        
        <div className="flex items-center text-red-600 text-xs font-medium">
          Read more <span className="ml-1 group-hover:ml-2 transition-all">→</span>
        </div>
      </div>
    </Link>
  );
}

// 4. TRENDING SIDEBAR (Dunya News Style)
function TrendingSidebar({ trending }: { trending: TrendingItem[] }) {
  if (trending.length === 0) return null;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
      <div className="bg-gradient-to-r from-red-600 to-red-500 px-5 py-3">
        <h3 className="font-bold text-white">Trending Now</h3>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {trending.map((item, index) => (
            <Link
              key={item.id}
              href={`/news/${item.slug}`}
              className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition group"
            >
              <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${
                index === 0 ? 'bg-red-100 text-red-700' :
                index === 1 ? 'bg-gray-100 text-gray-700' :
                index === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-blue-50 text-blue-600'
              }`}>
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-red-600 line-clamp-2">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(item.publishedAt)} • {formatViews(item.views || 0)} views
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// 5. CATEGORY SIDEBAR
function CategorySidebar({ categories, activeCategory }: { categories: Category[]; activeCategory: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-5 py-3">
        <h3 className="font-bold text-white">News Categories</h3>
      </div>
      <div className="p-4">
        <div className="space-y-1">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/news${cat.slug !== 'all' ? `?category=${cat.slug}` : ''}`}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                activeCategory === cat.slug
                  ? 'bg-red-50 text-red-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{cat.name}</span>
              {cat.count > 0 && (
                <span className={`text-xs ${
                  activeCategory === cat.slug ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {cat.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// 6. QUICK RESOURCES
function QuickResources() {
  const resources = [
    { name: 'Admissions 2026', href: '/admissions' },
    { name: 'Exam Results 2026', href: '/results' },
    { name: 'Education Boards', href: '/boards' },
    { name: 'Universities', href: '/universities' },
  ];
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
      <h3 className="font-bold text-gray-900 mb-3">Quick Resources</h3>
      <div className="space-y-2">
        {resources.map((link, i) => (
          <Link
            key={i}
            href={link.href}
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition group"
          >
            <span className="text-gray-700 group-hover:text-red-600">{link.name}</span>
            <span className="text-gray-400 group-hover:text-red-600">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ==================== PAGINATION ====================
function Pagination({ currentPage, totalPages, buildUrl }: { 
  currentPage: number; 
  totalPages: number; 
  buildUrl: (key: string, value: string) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex justify-center mt-8">
      <nav className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
        <Link
          href={currentPage > 1 ? buildUrl('page', (currentPage - 1).toString()) : '#'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            currentPage > 1
              ? 'text-gray-700 hover:bg-gray-100'
              : 'text-gray-400 cursor-not-allowed pointer-events-none'
          }`}
        >
          Previous
        </Link>
        
        {startPage > 1 && (
          <>
            <Link href={buildUrl('page', '1')} className="w-10 h-10 flex items-center justify-center rounded-lg text-sm hover:bg-gray-100">
              1
            </Link>
            {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <Link
            key={page}
            href={buildUrl('page', page.toString())}
            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition ${
              page === currentPage
                ? 'bg-red-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {page}
          </Link>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
            <Link href={buildUrl('page', totalPages.toString())} className="w-10 h-10 flex items-center justify-center rounded-lg text-sm hover:bg-gray-100">
              {totalPages}
            </Link>
          </>
        )}
        
        <Link
          href={currentPage < totalPages ? buildUrl('page', (currentPage + 1).toString()) : '#'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            currentPage < totalPages
              ? 'text-gray-700 hover:bg-gray-100'
              : 'text-gray-400 cursor-not-allowed pointer-events-none'
          }`}
        >
          Next
        </Link>
      </nav>
    </div>
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
    category: typeof params.category === 'string' ? params.category : 'all',
  };

  const [newsData, trending, categories] = await Promise.all([
    getNews(filters),
    getTrending(),
    getCategoryCounts(),
  ]);

  const { news: allNews, total, page, pages } = newsData;

  const breakingNews = allNews.filter(n => n.isBreaking === true);
  const normalNews = allNews.filter(n => !n.isBreaking);
  
  // First news as featured (large card)
  const featuredNews = normalNews[0];
  const restNews = normalNews.slice(1);

  const buildUrl = (key: string, value: string) => {
    const urlParams = new URLSearchParams();
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (filters.category && filters.category !== 'all' && key !== 'category') urlParams.set('category', filters.category);
    if (value) urlParams.set(key, value);
    const str = urlParams.toString();
    return str ? `/news?${str}` : '/news';
  };

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Schema Markup */}
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

      {/* Container */}
      <div className="container mx-auto px-4 py-6">
        
        {/* Hero Section with Breaking News */}
        <HeroSection breakingNews={breakingNews} />

        {/* Category Navigation Bar */}
        <CategoryNav categories={categories} activeCategory={filters.category} />

        {/* Search Bar */}
        <div className="mb-6">
          <form action="/news" method="GET" className="max-w-2xl">
            <div className="relative">
              <input
                type="text"
                name="q"
                defaultValue={filters.q}
                placeholder="Search news articles..."
                className="w-full pl-4 pr-24 py-3 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 border border-gray-200 bg-white"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition text-sm"
              >
                Search
              </button>
            </div>
            {filters.q && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-gray-600">Search results for:</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                  {filters.q}
                </span>
                <span className="text-gray-500">({total} articles found)</span>
                <Link href="/news" className="text-gray-400 hover:text-gray-600 text-xs">
                  Clear
                </Link>
              </div>
            )}
          </form>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content - 8 columns */}
          <div className="lg:col-span-8">
            
            {/* Featured News (Large Card) */}
            {featuredNews && (
              <div className="mb-8">
                <NewsCard item={featuredNews} isFeatured={true} />
              </div>
            )}

            {/* Latest News Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Latest News</h2>
                <span className="text-sm text-gray-500">Page {page} of {pages}</span>
              </div>
              
              {restNews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {restNews.map(item => (
                    <NewsCard key={item.id} item={item} />
                  ))}
                </div>
              ) : allNews.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No articles found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter</p>
                  <Link href="/news" className="inline-block mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    View all news
                  </Link>
                </div>
              ) : null}
            </div>

            {/* Pagination */}
            <Pagination currentPage={page} totalPages={pages} buildUrl={buildUrl} />
          </div>

          {/* Sidebar - 4 columns */}
          <aside className="lg:col-span-4">
            <div className="space-y-6">
              {/* Trending Now */}
              <TrendingSidebar trending={trending} />

              {/* Categories */}
              <CategorySidebar categories={categories} activeCategory={filters.category} />

              {/* Quick Resources */}
              <QuickResources />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}