import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { news, admissions, results, boards, institutes, cities, programs } from '@/app/lib/schema';
import { eq, desc, and, like, or, sql, asc } from 'drizzle-orm';
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

// ==================== DYNAMIC CATEGORY COUNTS FROM NEWS TABLE ====================
async function getDynamicCategories() {
  try {
    // Total news count
    const totalNews = await db
      .select({ count: sql<number>`count(*)` })
      .from(news)
      .where(eq(news.status, true))
      .then(r => Number(r[0]?.count) || 0);

    // Category wise counts based on keywords in news table
    const categoryKeywords: Record<string, string[]> = {
      admissions: ['admission', 'apply', 'enroll', 'registration', 'open admissions'],
      results: ['result', 'announced', 'gazette', 'position', 'marks', 'grade'],
      scholarships: ['scholarship', 'financial aid', 'grant', 'fund', 'stipend'],
      boards: ['board', 'bise', 'fbise', 'examination', 'matric', 'inter', 'board exam'],
      universities: ['university', 'college', 'campus', 'faculty', 'department', 'hec'],
      jobs: ['job', 'career', 'vacancy', 'recruitment', 'employment', 'apply online'],
    };

    const categoriesWithCounts = [];

    // Add All News category
    categoriesWithCounts.push({
      name: 'All News',
      slug: 'all',
      count: totalNews,
    });

    // Get counts for each category
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
      
      // Only add category if it has at least one news item
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
    console.error('Error getting dynamic categories:', error);
    return [{ name: 'All News', slug: 'all', count: 0 }];
  }
}

// ==================== DATA FETCHING WITH CATEGORY FILTER ====================
async function getNews(filters: { page?: number; category?: string }) {
  try {
    const conditions: any[] = [eq(news.status, true)];
    
    const page = filters.page || 1;
    const limit = 12;
    const offset = (page - 1) * limit;

    // Apply category filter if selected
    if (filters.category && filters.category !== 'all') {
      const categoryKeywords: Record<string, string[]> = {
        admissions: ['admission', 'apply', 'enroll', 'registration', 'open admissions'],
        results: ['result', 'announced', 'gazette', 'position', 'marks', 'grade'],
        scholarships: ['scholarship', 'financial aid', 'grant', 'fund', 'stipend'],
        boards: ['board', 'bise', 'fbise', 'examination', 'matric', 'inter', 'board exam'],
        universities: ['university', 'college', 'campus', 'faculty', 'department', 'hec'],
        jobs: ['job', 'career', 'vacancy', 'recruitment', 'employment', 'apply online'],
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
        views: news.views,
        publishedAt: news.publishedAt,
      })
      .from(news)
      .where(and(
        eq(news.status, true), 
        eq(news.isBreaking, true)
      ))
      .orderBy(desc(news.publishedAt))
      .limit(4);
    
    return data as NewsItem[];
  } catch (error) {
    console.error('Error fetching breaking news:', error);
    return [];
  }
}

// Future news - published date future mein hai
async function getFutureNews() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
      .where(and(
        eq(news.status, true),
        eq(news.isBreaking, false),
        sql`${news.publishedAt} > ${today.toISOString()}`
      ))
      .orderBy(asc(news.publishedAt))
      .limit(3);
    
    return data as NewsItem[];
  } catch (error) {
    console.error('Error fetching future news:', error);
    return [];
  }
}

// Simple news - published date past mein hai aur breaking nahi hai
async function getSimpleNews() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
      .where(and(
        eq(news.status, true),
        eq(news.isBreaking, false),
        sql`${news.publishedAt} <= ${today.toISOString()}`
      ))
      .orderBy(desc(news.publishedAt))
      .limit(6);
    
    return data as NewsItem[];
  } catch (error) {
    console.error('Error fetching simple news:', error);
    return [];
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

// ==================== CATEGORY DATA FROM RELEVANT TABLES ====================

// City news - from cities table
async function getCityNews() {
  try {
    const data = await db
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
    
    return data;
  } catch (error) {
    console.error('Error fetching city news:', error);
    return [];
  }
}

// Admissions - from admissions table
async function getAdmissionsNews() {
  try {
    const data = await db
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
    
    return data;
  } catch (error) {
    console.error('Error fetching admissions news:', error);
    return [];
  }
}

// Results - from results table
async function getResultsNews() {
  try {
    const data = await db
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
    
    return data;
  } catch (error) {
    console.error('Error fetching results news:', error);
    return [];
  }
}

// Universities - from institutes table
async function getUniversitiesNews() {
  try {
    const data = await db
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
    
    return data;
  } catch (error) {
    console.error('Error fetching universities news:', error);
    return [];
  }
}

// Boards - from boards table
async function getBoardsNews() {
  try {
    const data = await db
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
    
    return data;
  } catch (error) {
    console.error('Error fetching boards news:', error);
    return [];
  }
}

// Programs - from programs table
async function getProgramsNews() {
  try {
    const data = await db
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
    
    return data;
  } catch (error) {
    console.error('Error fetching programs news:', error);
    return [];
  }
}

// ==================== COMPONENTS ====================

// 1. HeroSection - Breaking News Banner + 3 Future News
function HeroSection({ breakingNews, futureNews }: { breakingNews: NewsItem[]; futureNews: NewsItem[] }) {
  const topBreaking = breakingNews[0];
  const topFutureNews = futureNews.slice(0, 3);
  
  return (
    <div className="mb-10">
      {/* Breaking News Banner */}
      {topBreaking && (
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
                BREAKING NEWS
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
      )}

      {/* Future News - 3 cards (only if future news exist) */}
      {topFutureNews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topFutureNews.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.slug}`}
              className="group block bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition hover:border-red-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-600 text-xs font-bold">FUTURE</span>
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

// 2. Simple News Card
function SimpleNewsCard({ item }: { item: NewsItem }) {
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

// 3. CategorySection
function CategorySection({ 
  cityNews, 
  admissionsNews, 
  resultsNews, 
  universitiesNews, 
  boardsNews, 
  programsNews 
}: { 
  cityNews: any[];
  admissionsNews: any[];
  resultsNews: any[];
  universitiesNews: any[];
  boardsNews: any[];
  programsNews: any[];
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
                <img 
                  src={topItem.imageUrl} 
                  alt={topItem.title} 
                  className="w-full h-40 object-cover rounded-lg mb-2 group-hover:opacity-90 transition"
                />
              )}
              <h4 className="font-semibold text-gray-900 group-hover:text-red-600 transition line-clamp-2">
                {topItem.title}
              </h4>
            </Link>
          )}
          <div className="space-y-2">
            {restItems.map((item) => (
              <Link 
                key={item.id} 
                href={`/${basePath}/${item.slug}`} 
                className="block text-gray-600 hover:text-red-600 text-sm line-clamp-1 transition py-1 border-b border-gray-100 last:border-0"
              >
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
        {renderCategoryColumn('City', cityNews, 'cities', true)}
        {renderCategoryColumn('Admissions', admissionsNews, 'admissions', true)}
        {renderCategoryColumn('Results', resultsNews, 'results', false)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderCategoryColumn('Universities', universitiesNews, 'universities', true)}
        {renderCategoryColumn('Boards', boardsNews, 'boards', false)}
        {renderCategoryColumn('Programs', programsNews, 'programs', false)}
      </div>
    </div>
  );
}

// 4. Pagination
function Pagination({ currentPage, totalPages, buildUrl }: { currentPage: number; totalPages: number; buildUrl: (page: number) => string }) {
  if (totalPages <= 1) return null;
  
  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) pages.push(i);

  return (
    <div className="flex justify-center mt-10">
      <nav className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
        <Link
          href={currentPage > 1 ? buildUrl(currentPage - 1) : '#'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            currentPage > 1 ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed pointer-events-none'
          }`}
        >
          Previous
        </Link>
        
        {startPage > 1 && (
          <>
            <Link href={buildUrl(1)} className="w-10 h-10 flex items-center justify-center rounded-lg text-sm hover:bg-gray-100">
              1
            </Link>
            {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <Link
            key={page}
            href={buildUrl(page)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition ${
              page === currentPage ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {page}
          </Link>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
            <Link href={buildUrl(totalPages)} className="w-10 h-10 flex items-center justify-center rounded-lg text-sm hover:bg-gray-100">
              {totalPages}
            </Link>
          </>
        )}
        
        <Link
          href={currentPage < totalPages ? buildUrl(currentPage + 1) : '#'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            currentPage < totalPages ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed pointer-events-none'
          }`}
        >
          Next
        </Link>
      </nav>
    </div>
  );
}

// 5. TrendingSidebar
function TrendingSidebar({ trending }: { trending: TrendingItem[] }) {
  if (!trending.length) return null;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
      <div className="bg-gradient-to-r from-red-600 to-red-500 px-5 py-3">
        <h3 className="font-bold text-white text-lg">Trending Now</h3>
      </div>
      <div className="p-4 space-y-3">
        {trending.map((item, idx) => (
          <Link 
            key={item.id} 
            href={`/news/${item.slug}`} 
            className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition group"
          >
            <span className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
              idx === 0 ? 'bg-red-100 text-red-700' : 
              idx === 1 ? 'bg-gray-100 text-gray-700' : 
              idx === 2 ? 'bg-orange-100 text-orange-700' : 
              'bg-blue-50 text-blue-600'
            }`}>
              {idx + 1}
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
  );
}

// 6. CategorySidebar - DYNAMIC
function CategorySidebar({ categories, activeCategory }: { categories: any[]; activeCategory: string }) {
  if (!categories.length) return null;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-5 py-3">
        <h3 className="font-bold text-white text-lg">News Categories</h3>
      </div>
      <div className="p-4 space-y-1">
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
            <span className={`${activeCategory === cat.slug ? 'text-red-500' : 'text-gray-400'} text-xs font-medium`}>
              {cat.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ==================== PAGE COMPONENT ====================
export default async function NewsPage({ searchParams }: { searchParams?: { [key: string]: string } }) {
  const page = Number(searchParams?.page) || 1;
  const category = searchParams?.category || 'all';

  // Fetch all data in parallel
  const [
    breakingNews,
    futureNews,
    simpleNews,
    trending,
    dynamicCategories,
    cityNews,
    admissionsNews,
    resultsNews,
    universitiesNews,
    boardsNews,
    programsNews
  ] = await Promise.all([
    getBreakingNews(),
    getFutureNews(),
    getSimpleNews(),
    getTrending(),
    getDynamicCategories(),
    getCityNews(),
    getAdmissionsNews(),
    getResultsNews(),
    getUniversitiesNews(),
    getBoardsNews(),
    getProgramsNews(),
  ]);

  const buildUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    params.set('page', pageNum.toString());
    if (category !== 'all') params.set('category', category);
    return `/news?${params.toString()}`;
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
      {/* Hero Section - Breaking News Banner + Future News */}
      <HeroSection breakingNews={breakingNews} futureNews={futureNews} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Simple News Cards - Only past/present news (no breaking, no future) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {simpleNews.map((item) => (
              <SimpleNewsCard key={item.id} item={item} />
            ))}
          </div>

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

        <div className="lg:col-span-1 space-y-6">
          <TrendingSidebar trending={trending} />
          <CategorySidebar categories={dynamicCategories} activeCategory={category} />
        </div>
      </div>
    </div>
  );
}