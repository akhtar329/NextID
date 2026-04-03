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

// ==================== COMPONENTS ====================

// 1. HeroSection – upar breaking news ka banner + chhoti breaking news items neeche (top 1 + 3 items)
function HeroSection({ breakingNews }: { breakingNews: NewsItem[] }) {
  const topBreaking = breakingNews[0];
  const otherBreaking = breakingNews.slice(1, 4);
  if (!topBreaking) return null;

  return (
    <div className="mb-8">
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

// 2 & 3. NewsCard – featured card (with image) and normal card (without image)
function NewsCard({ item, isFeatured = false }: { item: NewsItem; isFeatured?: boolean }) {
  const hasImage = !!item.imageUrl;
  return (
    <Link 
      href={`/news/${item.slug}`}
      className={`group block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-200 ${isFeatured ? '' : 'h-full'}`}
    >
      {hasImage && (
        <div className={`relative ${isFeatured ? 'h-64' : 'h-48'} w-full overflow-hidden`}>
          <img
            src={item.imageUrl!}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {item.isBreaking && (
            <div className="absolute top-4 left-4">
              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                BREAKING
              </span>
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 flex-wrap">
          <span>{formatDate(item.publishedAt)}</span>
          <span>•</span>
          <span>{getReadTime(item.content)}</span>
        </div>
        <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition line-clamp-2 mb-2">
          {item.title}
        </h3>
        {item.excerpt && <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.excerpt}</p>}
        <div className="flex items-center text-red-600 text-xs font-medium">
          Read more <span className="ml-1 group-hover:ml-2 transition-all">→</span>
        </div>
      </div>
    </Link>
  );
}

// 6. TrendingSidebar – sidebar mein trending news with ranking numbers (sticky)
function TrendingSidebar({ trending }: { trending: TrendingItem[] }) {
  if (!trending.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
      <div className="bg-gradient-to-r from-red-600 to-red-500 px-5 py-3">
        <h3 className="font-bold text-white">Trending Now</h3>
      </div>
      <div className="p-4 space-y-3">
        {trending.map((item, idx) => (
          <Link key={item.id} href={`/news/${item.slug}`} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition group">
            <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${
              idx===0?'bg-red-100 text-red-700': idx===1?'bg-gray-100 text-gray-700': idx===2?'bg-orange-100 text-orange-700':'bg-blue-50 text-blue-600'}`}>
              {idx+1}
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

// Quick Resources (additional sidebar component)
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
          <Link key={i} href={link.href} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition group">
            <span className="text-gray-700 group-hover:text-red-600">{link.name}</span>
            <span className="text-gray-400 group-hover:text-red-600">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// 4. Pagination
function Pagination({ currentPage, totalPages, buildUrl }: { currentPage: number; totalPages: number; buildUrl: (key: string, value: string)=>string }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible/2));
  let endPage = Math.min(totalPages, startPage + maxVisible -1);
  if (endPage-startPage+1<maxVisible) startPage = Math.max(1,endPage-maxVisible+1);
  for(let i=startPage;i<=endPage;i++) pages.push(i);

  return (
    <div className="flex justify-center mt-8">
      <nav className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
        <Link href={currentPage>1?buildUrl('page',(currentPage-1).toString()):'#'} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${currentPage>1?'text-gray-700 hover:bg-gray-100':'text-gray-400 cursor-not-allowed pointer-events-none'}`}>Previous</Link>
        {startPage>1 && <>
          <Link href={buildUrl('page','1')} className="w-10 h-10 flex items-center justify-center rounded-lg text-sm hover:bg-gray-100">1</Link>
          {startPage>2 && <span className="px-2 text-gray-400">...</span>}
        </>}
        {pages.map(page=><Link key={page} href={buildUrl('page',page.toString())} className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition ${page===currentPage?'bg-red-600 text-white':'text-gray-700 hover:bg-gray-100'}`}>{page}</Link>)}
        {endPage<totalPages && <>
          {endPage<totalPages-1 && <span className="px-2 text-gray-400">...</span>}
          <Link href={buildUrl('page',totalPages.toString())} className="w-10 h-10 flex items-center justify-center rounded-lg text-sm hover:bg-gray-100">{totalPages}</Link>
        </>}
        <Link href={currentPage<totalPages?buildUrl('page',(currentPage+1).toString()):'#'} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${currentPage<totalPages?'text-gray-700 hover:bg-gray-100':'text-gray-400 cursor-not-allowed pointer-events-none'}`}>Next</Link>
      </nav>
    </div>
  );
}

// 5. 3-Column Category Sections – City, Admissions, Results, Universities, Boards, Programs
function CategorySection({ allNews }: { allNews: NewsItem[] }) {
  // Helper function to get news by category keywords
  const getNewsByCategory = (keywords: string[]): NewsItem[] => {
    return allNews.filter(item => 
      keywords.some(keyword => 
        item.title.toLowerCase().includes(keyword.toLowerCase()) ||
        (item.excerpt && item.excerpt.toLowerCase().includes(keyword.toLowerCase()))
      )
    ).slice(0, 5);
  };

  const categoriesConfig = [
    { name: 'City', keywords: ['city', 'lahore', 'karachi', 'islamabad', 'rawalpindi', 'urban'] },
    { name: 'Admissions', keywords: ['admission', 'apply', 'enroll', 'registration', 'open'] },
    { name: 'Results', keywords: ['result', 'announced', 'gazette', 'position', 'marks'] },
    { name: 'Universities', keywords: ['university', 'college', 'campus', 'faculty', 'department', 'hec'] },
    { name: 'Boards', keywords: ['board', 'bise', 'fbise', 'examination', 'matric', 'inter'] },
    { name: 'Programs', keywords: ['program', 'course', 'degree', 'diploma', 'certificate', 'bs', 'ms', 'phd'] },
  ];

  const firstRow = categoriesConfig.slice(0, 3);
  const secondRow = categoriesConfig.slice(3, 6);

  const renderCategoryColumn = (cat: { name: string; keywords: string[] }) => {
    const items = getNewsByCategory(cat.keywords);
    if (items.length === 0) return null;

    const topItem = items[0];
    const restItems = items.slice(1);

    return (
      <div key={cat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
        <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-2">
          <h3 className="font-bold text-white text-lg">{cat.name}</h3>
        </div>
        <div className="p-4">
          {topItem && (
            <Link href={`/news/${topItem.slug}`} className="block mb-3 group">
              {topItem.imageUrl && (
                <img 
                  src={topItem.imageUrl} 
                  alt={topItem.title} 
                  className="w-full h-36 object-cover rounded-lg mb-2 group-hover:opacity-90 transition"
                />
              )}
              <h4 className="font-semibold text-gray-900 group-hover:text-red-600 transition line-clamp-2 text-sm">
                {topItem.title}
              </h4>
            </Link>
          )}
          <div className="space-y-2">
            {restItems.map((item) => (
              <Link 
                key={item.id} 
                href={`/news/${item.slug}`} 
                className="block text-gray-700 hover:text-red-600 text-sm line-clamp-1 transition"
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
    <div className="space-y-6 mt-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {firstRow.map(renderCategoryColumn)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {secondRow.map(renderCategoryColumn)}
      </div>
    </div>
  );
}

// ==================== PAGE COMPONENT ====================
export default async function NewsPage({ searchParams }: { searchParams?: { [key: string]: string } }) {
  const page = Number(searchParams?.page) || 1;
  const category = searchParams?.category || 'all';
  const q = searchParams?.q || '';

  const [{ news: allNews, total, pages }, trending] = await Promise.all([
    getNews({ page, category, q }),
    getTrending(),
  ]);

  const breakingNews = allNews.filter(n=>n.isBreaking);
  // Featured card is the first news item (with image)
  const featuredNews = allNews[0] ? [allNews[0]] : [];
  // Rest of the news for normal cards
  const restNews = allNews.slice(1);

  const buildUrl = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams as any);
    params.set(key,value);
    return `/news?${params.toString()}`;
  };

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
      {/* 1. Hero Section - Breaking News Banner + 3 small items */}
      <HeroSection breakingNews={breakingNews} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* 2. Featured News Card (with image, large) */}
          {featuredNews.map(item => (
            <NewsCard key={item.id} item={item} isFeatured />
          ))}

          {/* 3. Normal News Cards Grid (without image) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restNews.map(item => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>

          {/* 5. 3-Column Category Sections - City, Admissions, Results, Universities, Boards, Programs */}
          <CategorySection allNews={allNews} />

          {/* 4. Pagination */}
          <Pagination currentPage={page} totalPages={pages} buildUrl={buildUrl} />
        </div>

        {/* Sidebar - Sticky */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* 6. Trending Sidebar with ranking numbers */}
            <TrendingSidebar trending={trending} />
            {/* Quick Resources */}
            <QuickResources />
          </div>
        </div>
      </div>
    </div>
  );
}