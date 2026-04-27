// app/(public)/news/page.tsx
import { Metadata } from 'next';
export const revalidate = 86400;\nimport Image from 'next/image';
export const revalidate = 86400;\nimport Link from 'next/link';
export const revalidate = 86400;\nimport { db } from '@/app/lib/db';
export const revalidate = 86400;\nimport { news, admissions, results, boards, institutes, cities, programs } from '@/app/lib/schema';
export const revalidate = 86400;\nimport { eq, desc, sql } from 'drizzle-orm';
export const revalidate = 86400;\nimport type { NewsItem, TrendingItem } from '@/app/types/types';

 
export const revalidate = 86400;\nexport const fetchCache = 'force-cache';
export const preferredRegion = 'auto';
// remove dynamicparams= true

interface CategoryNewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  type: string;
}

interface CategorySectionProps {
  cityNews: CategoryNewsItem[];
  admissionsNews: CategoryNewsItem[];
  resultsNews: CategoryNewsItem[];
  universitiesNews: CategoryNewsItem[];
  boardsNews: CategoryNewsItem[];
  programsNews: CategoryNewsItem[];
}

interface FeaturedNewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  viewCount: number | null;
}

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

interface AllNewsResult {
  breakingNews: NewsItem[];
  featuredNews: FeaturedNewsItem[];
  regularNews: NewsItem[];
  allNews: NewsItem[];
}

async function getAllNewsOptimized(): Promise<AllNewsResult> {
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
        viewCount: news.viewCount,
        publishedAt: news.publishedAt,
      })
      .from(news)
      .where(eq(news.status, true))
      .orderBy(desc(news.publishedAt))
      .limit(20);
    
    const breakingNews = data.filter(n => n.isBreaking).slice(0, 4);
    const featuredNews = data.filter(n => n.isFeatured).slice(0, 5);
    const regularNews = data.filter(n => !n.isBreaking && !n.isFeatured).slice(0, 6);
    
    return { breakingNews, featuredNews, regularNews, allNews: data };
  } catch {
    return { breakingNews: [], featuredNews: [], regularNews: [], allNews: [] };
  }
}

async function getTrendingOptimized(): Promise<TrendingItem[]> {
  try {
    return await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        viewCount: news.viewCount,
        publishedAt: news.publishedAt,
      })
      .from(news)
      .where(eq(news.status, true))
      .orderBy(desc(news.viewCount))
      .limit(5);
  } catch {
    return [];
  }
}

async function getAllCategoryNewsOptimized() {
  try {
    const [cityNews, admissionsNews, resultsNews, universitiesNews, boardsNews, programsNews] = await Promise.all([
      db
        .select({
          id: cities.id,
          title: cities.name,
          slug: cities.slug,
          excerpt: cities.description,
          imageUrl: cities.imageUrl,
          publishedAt: cities.createdAt,
          type: sql<string>`'city'`.as('type'),
        })
        .from(cities)
        .where(eq(cities.status, true))
        .orderBy(desc(cities.createdAt))
        .limit(5),
      
      db
        .select({
          id: admissions.id,
          title: admissions.name,
          slug: admissions.slug,
          excerpt: admissions.note,
          imageUrl: admissions.featuredImage,
          publishedAt: admissions.createdAt,
          type: sql<string>`'admission'`.as('type'),
        })
        .from(admissions)
        .where(eq(admissions.status, 'Open'))
        .orderBy(desc(admissions.createdAt))
        .limit(5),
      
      db
        .select({
          id: results.id,
          title: results.title,
          slug: results.slug,
          excerpt: sql<string>`NULL`.as('excerpt'),
          imageUrl: sql<string>`NULL`.as('imageUrl'),
          publishedAt: results.createdAt,
          type: sql<string>`'result'`.as('type'),
        })
        .from(results)
        .where(eq(results.status, true))
        .orderBy(desc(results.createdAt))
        .limit(5),
      
      db
        .select({
          id: institutes.id,
          title: institutes.name,
          slug: institutes.slug,
          excerpt: institutes.description,
          imageUrl: institutes.featuredImage,
          publishedAt: institutes.createdAt,
          type: sql<string>`'university'`.as('type'),
        })
        .from(institutes)
        .where(eq(institutes.status, true))
        .orderBy(desc(institutes.createdAt))
        .limit(5),
      
      db
        .select({
          id: boards.id,
          title: boards.name,
          slug: boards.slug,
          excerpt: boards.description,
          imageUrl: sql<string>`NULL`.as('imageUrl'),
          publishedAt: boards.createdAt,
          type: sql<string>`'board'`.as('type'),
        })
        .from(boards)
        .where(eq(boards.status, true))
        .orderBy(desc(boards.createdAt))
        .limit(5),
      
      db
        .select({
          id: programs.id,
          title: programs.name,
          slug: programs.slug,
          excerpt: programs.shortDescription,
          imageUrl: sql<string>`NULL`.as('imageUrl'),
          publishedAt: programs.createdAt,
          type: sql<string>`'program'`.as('type'),
        })
        .from(programs)
        .where(eq(programs.status, true))
        .orderBy(desc(programs.createdAt))
        .limit(5),
    ]);

    return { cityNews, admissionsNews, resultsNews, universitiesNews, boardsNews, programsNews };
  } catch {
    return { cityNews: [], admissionsNews: [], resultsNews: [], universitiesNews: [], boardsNews: [], programsNews: [] };
  }
}

interface CategoryWithCount {
  name: string;
  slug: string;
  count: number;
}

async function getDynamicCategoriesOptimized(): Promise<CategoryWithCount[]> {
  try {
    const totalNews = await db
      .select({ count: sql<number>`count(*)` })
      .from(news)
      .where(eq(news.status, true))
      .then(r => Number(r[0]?.count) || 0);

    return [
      { name: 'All News', slug: 'all', count: totalNews },
      { name: 'Admissions', slug: 'admissions', count: 0 },
      { name: 'Results', slug: 'results', count: 0 },
      { name: 'Scholarships', slug: 'scholarships', count: 0 },
      { name: 'Board News', slug: 'boards', count: 0 },
      { name: 'Universities', slug: 'universities', count: 0 },
      { name: 'Jobs', slug: 'jobs', count: 0 },
    ];
  } catch {
    return [{ name: 'All News', slug: 'all', count: 0 }];
  }
}

function HeroSection({ allBreakingNews }: { allBreakingNews: NewsItem[] }) {
  const bannerNews = allBreakingNews[0];
  const cardNews = allBreakingNews.slice(1, 4);
  
  if (!bannerNews && cardNews.length === 0) return null;
  
  return (
    <div className="mb-10">
      {bannerNews && (
        <div className="relative rounded-xl overflow-hidden mb-5 shadow-lg h-[400px] md:h-[450px] group">
          {bannerNews.imageUrl && (
            <Image 
              src={bannerNews.imageUrl} 
              alt={bannerNews.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-md animate-pulse">
                🔴 BREAKING NEWS
              </span>
              <span className="text-white/80 text-sm">{formatDate(bannerNews.publishedAt)}</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight line-clamp-3">
              {bannerNews.title}
            </h2>
            <p className="text-white/90 mb-4 line-clamp-2 text-sm md:text-base max-w-2xl">
              {bannerNews.excerpt}
            </p>
            <Link 
              href={`/news/${bannerNews.slug}`}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium transition-all"
            >
              Read Full Story <span className="text-lg">→</span>
            </Link>
          </div>
        </div>
      )}

      {cardNews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cardNews.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.slug}`}
              className="group block bg-red-50 rounded-lg p-4 border-l-4 border-red-600 hover:shadow-md transition hover:bg-red-100"
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

function FeaturedNewsCard({ item }: { item: FeaturedNewsItem }) {
  return (
    <Link 
      href={`/news/${item.slug}`}
      className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition group border-b border-gray-100 last:border-0"
    >
      {item.imageUrl && (
        <div className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition duration-300"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 group-hover:text-red-600 line-clamp-2">
          {item.title}
        </h4>
        <p className="text-xs text-gray-400 mt-1">{formatDate(item.publishedAt)}</p>
      </div>
    </Link>
  );
}

function RegularNewsCard({ item }: { item: NewsItem }) {
  return (
    <Link 
      href={`/news/${item.slug}`}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-200 h-full"
    >
      {item.imageUrl && (
        <div className="relative h-52 w-full overflow-hidden bg-gray-100">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
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

function CategorySection({ 
  cityNews, admissionsNews, resultsNews, universitiesNews, boardsNews, programsNews 
}: CategorySectionProps) {
  const renderCategoryColumn = (catName: string, items: CategoryNewsItem[], basePath: string, hasImage: boolean = true) => {
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
                <div className="relative w-full h-40 rounded-lg mb-2 overflow-hidden">
                  <Image 
                    src={topItem.imageUrl} 
                    alt={topItem.title} 
                    fill
                    className="object-cover group-hover:opacity-90 transition" 
                  />
                </div>
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

function TrendingSidebar({ trending }: { trending: TrendingItem[] }) {
  if (!trending.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
      <div className="bg-gradient-to-r from-red-600 to-red-500 px-5 py-3">
        <h3 className="font-bold text-white text-lg">📈 Trending Now</h3>
      </div>
      <div className="p-4 space-y-3">
        {trending.map((item, idx) => (
          <Link key={item.id} href={`/news/${item.slug}`} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition group">
            <span className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
              idx === 0 ? 'bg-red-100 text-red-700' : 
              idx === 1 ? 'bg-gray-100 text-gray-700' : 
              idx === 2 ? 'bg-orange-100 text-orange-700' : 
              'bg-blue-50 text-blue-600'
            }`}>
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 group-hover:text-red-600 line-clamp-2">{item.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{formatDate(item.publishedAt)} • {formatViews(item.viewCount || 0)} views</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FeaturedSidebar({ featuredNews }: { featuredNews: FeaturedNewsItem[] }) {
  if (!featuredNews.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 px-5 py-3">
        <h3 className="font-bold text-white text-lg">⭐ Featured Stories</h3>
      </div>
      <div className="p-3 space-y-1">
        {featuredNews.map((item) => (
          <FeaturedNewsCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function CategorySidebar({ categories, activeCategory }: { categories: CategoryWithCount[]; activeCategory: string }) {
  if (!categories.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-5 py-3">
        <h3 className="font-bold text-white text-lg">📂 News Categories</h3>
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

async function getPageData(category: string) {
  const [
    { breakingNews, featuredNews, regularNews },
    trending,
    { cityNews, admissionsNews, resultsNews, universitiesNews, boardsNews, programsNews },
    dynamicCategories
  ] = await Promise.all([
    getAllNewsOptimized(),
    getTrendingOptimized(),
    getAllCategoryNewsOptimized(),
    getDynamicCategoriesOptimized(),
  ]);

  return {
    breakingNews,
    featuredNews,
    regularNews,
    trending,
    cityNews,
    admissionsNews,
    resultsNews,
    universitiesNews,
    boardsNews,
    programsNews,
    dynamicCategories,
    category,
  };
}

export default async function NewsPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ [key: string]: string }>
}) {
  let pageData;
  
  try {
    const params = await searchParams || {};
    const category = params.category || 'all';
    pageData = await getPageData(category);
  } catch {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to load news</h2>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
      <HeroSection allBreakingNews={pageData.breakingNews} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {pageData.regularNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pageData.regularNews.map((item) => (
                <RegularNewsCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No news available</p>
            </div>
          )}

          <CategorySection 
            cityNews={pageData.cityNews}
            admissionsNews={pageData.admissionsNews}
            resultsNews={pageData.resultsNews}
            universitiesNews={pageData.universitiesNews}
            boardsNews={pageData.boardsNews}
            programsNews={pageData.programsNews}
          />
        </div>

        <div className="lg:col-span-1">
          <div className="space-y-6">
            <TrendingSidebar trending={pageData.trending} />
            <FeaturedSidebar featuredNews={pageData.featuredNews} />
            <CategorySidebar categories={pageData.dynamicCategories} activeCategory={pageData.category} />
          </div>
        </div>
      </div>
    </div>
  );
}

