import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { news, admissions, results, boards, institutes, cities, programs } from '@/app/lib/schema';
import { eq, desc, and, like, or, sql } from 'drizzle-orm';
import type { NewsItem, TrendingItem } from '@/app/types/types';

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

// 1. Breaking News (isBreaking = true) - For Hero Banner
async function getBreakingNews() {
  try {
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
        isFeatured: news.isFeatured,
        views: news.views,
        publishedAt: news.publishedAt,
      })
      .from(news)
      .where(and(eq(news.status, true), eq(news.isBreaking, true)))
      .orderBy(desc(news.publishedAt))
      .limit(4);
    return data as NewsItem[];
  } catch (error) {
    return [];
  }
}

// 2. Featured News (isFeatured = true) - For Sidebar
async function getFeaturedNews() {
  try {
    const data = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        excerpt: news.excerpt,
        imageUrl: news.imageUrl,
        publishedAt: news.publishedAt,
        views: news.views,
      })
      .from(news)
      .where(and(eq(news.status, true), eq(news.isFeatured, true)))
      .orderBy(desc(news.publishedAt))
      .limit(5);
    return data;
  } catch (error) {
    return [];
  }
}

// 3. Regular News (isBreaking = false AND isFeatured = false)
async function getRegularNews() {
  try {
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
        isFeatured: news.isFeatured,
        views: news.views,
        publishedAt: news.publishedAt,
      })
      .from(news)
      .where(and(
        eq(news.status, true),
        eq(news.isBreaking, false),
        eq(news.isFeatured, false)
      ))
      .orderBy(desc(news.publishedAt))
      .limit(6);
    return data as NewsItem[];
  } catch (error) {
    return [];
  }
}

// 4. Trending News
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

// 5. Dynamic Categories
async function getDynamicCategories() {
  try {
    const totalNews = await db
      .select({ count: sql<number>`count(*)` })
      .from(news)
      .where(eq(news.status, true))
      .then(r => Number(r[0]?.count) || 0);

    const categoryKeywords: Record<string, string[]> = {
      admissions: ['admission', 'apply', 'enroll', 'registration'],
      results: ['result', 'announced', 'gazette', 'marks'],
      scholarships: ['scholarship', 'financial aid', 'grant'],
      boards: ['board', 'bise', 'fbise', 'examination'],
      universities: ['university', 'college', 'campus', 'faculty'],
      jobs: ['job', 'career', 'vacancy', 'recruitment'],
    };

    const categoriesWithCounts = [{ name: 'All News', slug: 'all', count: totalNews }];

    for (const [slug, keywords] of Object.entries(categoryKeywords)) {
      const conditions = keywords.flatMap(keyword => [
        like(news.title, `%${keyword}%`),
        like(news.excerpt, `%${keyword}%`),
      ]);
      
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(news)
        .where(and(eq(news.status, true), or(...conditions)))
        .then(r => Number(r[0]?.count) || 0);
      
      if (result > 0) {
        categoriesWithCounts.push({
          name: slug === 'admissions' ? 'Admissions' :
                slug === 'results' ? 'Results' :
                slug === 'scholarships' ? 'Scholarships' :
                slug === 'boards' ? 'Board News' :
                slug === 'universities' ? 'Universities' : 'Jobs',
          slug: slug,
          count: result,
        });
      }
    }
    return categoriesWithCounts;
  } catch (error) {
    return [{ name: 'All News', slug: 'all', count: 0 }];
  }
}

// ==================== CATEGORY DATA FROM RELEVANT TABLES ====================

async function getCityNews() {
  try {
    return await db
      .select({
        id: cities.id,
        title: cities.name,
        slug: cities.slug,
        excerpt: cities.description,
        imageUrl: cities.imageUrl,
        publishedAt: cities.createdAt,
      })
      .from(cities)
      .where(eq(cities.status, true))
      .orderBy(desc(cities.createdAt))
      .limit(5);
  } catch (error) {
    return [];
  }
}

async function getAdmissionsNews() {
  try {
    return await db
      .select({
        id: admissions.id,
        title: admissions.name,
        slug: admissions.slug,
        excerpt: admissions.note,
        imageUrl: admissions.featuredImage,
        publishedAt: admissions.createdAt,
      })
      .from(admissions)
      .where(eq(admissions.status, 'open'))
      .orderBy(desc(admissions.createdAt))
      .limit(5);
  } catch (error) {
    return [];
  }
}

async function getResultsNews() {
  try {
    return await db
      .select({
        id: results.id,
        title: results.title,
        slug: results.slug,
        excerpt: sql<string>`NULL`.as('excerpt'),
        imageUrl: sql<string>`NULL`.as('imageUrl'),
        publishedAt: results.createdAt,
      })
      .from(results)
      .where(eq(results.status, true))
      .orderBy(desc(results.createdAt))
      .limit(5);
  } catch (error) {
    return [];
  }
}

async function getUniversitiesNews() {
  try {
    return await db
      .select({
        id: institutes.id,
        title: institutes.name,
        slug: institutes.slug,
        excerpt: institutes.description,
        imageUrl: institutes.featuredImage,
        publishedAt: institutes.createdAt,
      })
      .from(institutes)
      .where(eq(institutes.status, true))
      .orderBy(desc(institutes.createdAt))
      .limit(5);
  } catch (error) {
    return [];
  }
}

async function getBoardsNews() {
  try {
    return await db
      .select({
        id: boards.id,
        title: boards.name,
        slug: boards.slug,
        excerpt: boards.description,
        imageUrl: sql<string>`NULL`.as('imageUrl'),
        publishedAt: boards.createdAt,
      })
      .from(boards)
      .where(eq(boards.status, true))
      .orderBy(desc(boards.createdAt))
      .limit(5);
  } catch (error) {
    return [];
  }
}

async function getProgramsNews() {
  try {
    return await db
      .select({
        id: programs.id,
        title: programs.name,
        slug: programs.slug,
        excerpt: programs.overview,
        imageUrl: sql<string>`NULL`.as('imageUrl'),
        publishedAt: programs.createdAt,
      })
      .from(programs)
      .where(eq(programs.status, true))
      .orderBy(desc(programs.createdAt))
      .limit(5);
  } catch (error) {
    return [];
  }
}

// ==================== COMPONENTS ====================

// HeroSection: Breaking News Banner Only
function HeroSection({ breakingNews }: { breakingNews: NewsItem[] }) {
  const topBreaking = breakingNews[0];
  const otherBreaking = breakingNews.slice(1, 4);
  
  if (!topBreaking) return null;

  return (
    <div className="mb-10">
      {/* Breaking News Banner */}
      <div className="relative rounded-xl overflow-hidden mb-5 shadow-lg h-[400px] md:h-[450px]">
        {topBreaking.imageUrl && (
          <img 
            src={topBreaking.imageUrl} 
            alt={topBreaking.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-md animate-pulse">
              🔴 BREAKING NEWS
            </span>
            <span className="text-white/80 text-sm">{formatDate(topBreaking.publishedAt)}</span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
            {topBreaking.title}
          </h2>
          <p className="text-white/90 mb-4 line-clamp-2 text-sm md:text-base max-w-2xl">
            {topBreaking.excerpt}
          </p>
          <Link 
            href={`/news/${topBreaking.slug}`}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium transition-all"
          >
            Read Full Story <span className="text-lg">→</span>
          </Link>
        </div>
      </div>

      {/* Other Breaking News Cards (3 items) */}
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

// Featured News Card (For Sidebar)
function FeaturedNewsCard({ item }: { item: any }) {
  return (
    <Link 
      href={`/news/${item.slug}`}
      className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition group border-b border-gray-100 last:border-0"
    >
      {item.imageUrl && (
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
        </div>
        <h4 className="text-sm font-medium text-gray-900 group-hover:text-red-600 line-clamp-2">
          {item.title}
        </h4>
        <p className="text-xs text-gray-400 mt-1">{formatDate(item.publishedAt)}</p>
      </div>
    </Link>
  );
}

// Regular News Card
function RegularNewsCard({ item }: { item: NewsItem }) {
  return (
    <Link 
      href={`/news/${item.slug}`}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-200 h-full"
    >
      {item.imageUrl && (
        <div className="h-52 w-full overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 flex-wrap">
          <span>{formatDate(item.publishedAt)}</span>
          <span>•</span>
          <span>{getReadTime(item.content)}</span>
        </div>
        <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition line-clamp-2 mb-2 text-lg">
          {item.title}
        </h3>
        {item.excerpt && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {item.excerpt}
          </p>
        )}
        <div className="flex items-center text-red-600 text-sm font-medium">
          Read more <span className="ml-1 group-hover:ml-2 transition-all">→</span>
        </div>
      </div>
    </Link>
  );
}

// Category Section
function CategorySection({ 
  cityNews, admissionsNews, resultsNews, universitiesNews, boardsNews, programsNews 
}: { 
  cityNews: any[]; admissionsNews: any[]; resultsNews: any[]; 
  universitiesNews: any[]; boardsNews: any[]; programsNews: any[];
}) {
  const renderCategoryColumn = (catName: string, items: any[], basePath: string, hasImage: boolean = true) => {
    if (items.length === 0) return null;
    const topItem = items[0];
    const restItems = items.slice(1);
    return (
      <div key={catName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
        <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
          <h3 className="font-bold text-gray-800 text-xl">{catName}</h3>
          <div className="w-12 h-0.5 bg-red-500 mt-1"></div>
        </div>
        <div className="p-4">
          {topItem && (
            <Link href={`/${basePath}/${topItem.slug}`} className="block mb-4 group">
              {hasImage && topItem.imageUrl && (
                <img src={topItem.imageUrl} alt={topItem.title} className="w-full h-40 object-cover rounded-lg mb-2 group-hover:opacity-90 transition" />
              )}
              <h4 className="font-semibold text-gray-900 group-hover:text-red-600 transition line-clamp-2">{topItem.title}</h4>
            </Link>
          )}
          <div className="space-y-2">
            {restItems.map((item) => (
              <Link key={item.id} href={`/${basePath}/${item.slug}`} className="block text-gray-600 hover:text-red-600 text-sm line-clamp-1 transition py-1 border-b border-gray-100 last:border-0">
                • {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 mt-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderCategoryColumn('Universities', universitiesNews, 'universities', true)}
        {renderCategoryColumn('Boards', boardsNews, 'boards', false)}
        {renderCategoryColumn('Programs', programsNews, 'programs', false)}
      </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderCategoryColumn('City', cityNews, 'cities', true)}
        {renderCategoryColumn('Admissions', admissionsNews, 'admissions', true)}
        {renderCategoryColumn('Results', resultsNews, 'results', false)}
      </div>
    </div>
  );
}

// Trending Sidebar (Sticky)
function TrendingSidebar({ trending }: { trending: TrendingItem[] }) {
  if (!trending.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-red-500 px-5 py-3">
        <h3 className="font-bold text-white text-lg">Trending Now</h3>
      </div>
      <div className="p-4 space-y-3">
        {trending.map((item, idx) => (
          <Link key={item.id} href={`/news/${item.slug}`} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition group">
            <span className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
              idx === 0 ? 'bg-red-100 text-red-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'
            }`}>
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 group-hover:text-red-600 line-clamp-2">{item.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{formatDate(item.publishedAt)} • {formatViews(item.views || 0)} views</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Featured Sidebar (Sticky)
function FeaturedSidebar({ featuredNews }: { featuredNews: any[] }) {
  if (!featuredNews.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 px-5 py-3">
        <h3 className="font-bold text-white text-lg">Featured Stories</h3>
      </div>
      <div className="p-3 space-y-1">
        {featuredNews.map((item) => (
          <FeaturedNewsCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// Category Sidebar (Sticky)
function CategorySidebar({ categories, activeCategory }: { categories: any[]; activeCategory: string }) {
  if (!categories.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-5 py-3">
        <h3 className="font-bold text-white text-lg">📂 News Categories</h3>
      </div>
      <div className="p-4 space-y-1">
        {categories.map((cat) => (
          <Link key={cat.slug} href={`/news${cat.slug !== 'all' ? `?category=${cat.slug}` : ''}`} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
            activeCategory === cat.slug ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}>
            <span>{cat.name}</span>
            <span className={`${activeCategory === cat.slug ? 'text-red-500' : 'text-gray-400'} text-xs font-medium`}>{cat.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ==================== PAGE COMPONENT ====================
export default async function NewsPage({ searchParams }: { searchParams?: { [key: string]: string } }) {
  const category = searchParams?.category || 'all';

  const [breakingNews, regularNews, trending, featuredNews, dynamicCategories, cityNews, admissionsNews, resultsNews, universitiesNews, boardsNews, programsNews] = await Promise.all([
    getBreakingNews(),
    getRegularNews(),
    getTrending(),
    getFeaturedNews(),
    getDynamicCategories(),
    getCityNews(),
    getAdmissionsNews(),
    getResultsNews(),
    getUniversitiesNews(),
    getBoardsNews(),
    getProgramsNews(),
  ]);

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
      {/* HeroSection: Breaking News Banner + 3 Breaking Cards */}
      <HeroSection breakingNews={breakingNews} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Regular News Cards */}
          {regularNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {regularNews.map((item) => (
                <RegularNewsCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No news available</p>
            </div>
          )}

          {/* Category Section */}
          <CategorySection 
            cityNews={cityNews}
            admissionsNews={admissionsNews}
            resultsNews={resultsNews}
            universitiesNews={universitiesNews}
            boardsNews={boardsNews}
            programsNews={programsNews}
          />
        </div>

        {/* Sidebar - Sticky */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <TrendingSidebar trending={trending} />
            <FeaturedSidebar featuredNews={featuredNews} />
            <CategorySidebar categories={dynamicCategories} activeCategory={category} />
          </div>
        </div>
      </div>
    </div>
  );
}