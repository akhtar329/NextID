// app/(public)/news/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { 
  Newspaper, 
  TrendingUp, 
  Clock, 
  Search,
  Flame,
  Calendar,
  User,
  MessageCircle,
  X
} from 'lucide-react';
import { postService } from '@/services/post/post.service';

// ============ TYPES ============
interface NewsItem {
  id: number;
  slug: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  category: string;
  tags: string[] | null;
  isFeatured: boolean;
  isBreaking: boolean;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date | null;
  authorName: string | null;
}

// ============ HELPER FUNCTIONS ============
function formatDate(date: Date | null): string {
  if (!date) return 'Recent';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

// ============ CATEGORY OPTIONS ============
const CATEGORY_OPTIONS = [
  { value: "", label: "All News" },
  { value: "Admissions", label: "🎓 Admissions" },
  { value: "Results", label: "📊 Results" },
  { value: "Scholarships", label: "💰 Scholarships" },
  { value: "Exams", label: "📝 Exams" },
  { value: "Events", label: "🎉 Events" },
  { value: "Announcements", label: "📢 Announcements" },
  { value: "Jobs", label: "💼 Jobs" },
  { value: "General", label: "📰 General News" },
];

// ============ METADATA ============
export const metadata = {
  title: 'News | Latest Education Updates Pakistan',
  description: 'Breaking news, latest updates on admissions, results, scholarships and educational events from across Pakistan.',
};

// ============ DATA FETCHING ============
async function getNewsData(page: number = 1, limit: number = 20, searchQuery?: string, category?: string): Promise<{ news: NewsItem[]; pagination: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number } }> {
  try {
    const allNews = await postService.getPostsByType('news', 200);
    
    let newsList: NewsItem[] = allNews.map(post => {
      const meta = post.meta || {};
      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
        category: getMetaValue(meta, 'category', 'General'),
        tags: getMetaValue(meta, 'tags', null),
        isFeatured: getMetaValue(meta, 'isFeatured', false),
        isBreaking: getMetaValue(meta, 'isBreaking', false),
        viewCount: getMetaValue(meta, 'viewCount', 0),
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        authorName: getMetaValue(meta, 'authorName', null),
      };
    });
    
    // Sort by published date (newest first)
    newsList.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });
    
    // Filter by category
    if (category && category !== '') {
      newsList = newsList.filter(news => 
        news.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      newsList = newsList.filter(news => 
        news.title.toLowerCase().includes(query) ||
        (news.excerpt && news.excerpt.toLowerCase().includes(query))
      );
    }
    
    const totalItems = newsList.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const paginatedNews = newsList.slice(startIndex, startIndex + limit);
    
    return {
      news: paginatedNews,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit
      }
    };
  } catch (error) {
    console.error('Error fetching news:', error);
    return {
      news: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 20
      }
    };
  }
}

// ============ LOADING COMPONENT ============
function NewsLoading() {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
    </div>
  );
}

// ============ NEWS CONTENT COMPONENT ============
async function NewsContent({ searchParamsPromise }: { searchParamsPromise: Promise<{ page?: string; search?: string; category?: string }> }) {
  const params = await searchParamsPromise;
  const page = params.page ? parseInt(params.page) : 1;
  const searchQuery = params.search || undefined;
  const selectedCategory = params.category || "";
  
  const { news: newsList, pagination } = await getNewsData(page, 20, searchQuery, selectedCategory);
  
  if (newsList.length === 0 && page === 1 && !searchQuery && !selectedCategory) {
    notFound();
  }
  
  // Split news for different sections
  const heroNews = newsList[0];
  const topStories = newsList.slice(1, 4);
  const featuredNews = newsList.slice(4, 8);
  const latestNews = newsList.slice(8, 16);
  const popularNews = [...newsList].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
  
  return (
    <div className="bg-white min-h-screen">

      {/* ============ BREAKING NEWS TICKER ============ */}
      {newsList.filter(n => n.isBreaking).length > 0 && (
        <div className="bg-red-600 text-white py-3 border-b-4 border-yellow-400">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-black/20 px-4 py-1.5 rounded-full">
                <Flame className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-sm uppercase tracking-wider">Breaking News</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="whitespace-nowrap animate-marquee inline-block">
                  {newsList.filter(n => n.isBreaking).slice(0, 5).map((news, idx) => (
                    <Link key={idx} href={`/news/${news.slug}`} className="mx-5 hover:underline text-white/90 hover:text-white">
                      {news.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* ============ CATEGORY FILTER BAR ============ */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
            {CATEGORY_OPTIONS.map((cat) => (
              <Link
                key={cat.value}
                href={`/news${cat.value ? `?category=${encodeURIComponent(cat.value)}` : ''}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === cat.value
                    ? `bg-red-600 text-white shadow-md shadow-red-200`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </Link>
            ))}
            
            {/* Clear filter button */}
            {selectedCategory && (
              <Link
                href="/news"
                className="px-3 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </Link>
            )}
          </div>
          
          {/* Active filter indicator */}
          {selectedCategory && (
            <div className="mt-3 text-sm text-gray-600">
              Showing news for: <span className="font-semibold text-red-600">{selectedCategory}</span>
            </div>
          )}
          {searchQuery && (
            <div className="mt-3 text-sm text-gray-600">
              Search results for:{' '}
              <span className="font-semibold text-red-600">&quot;{searchQuery}&quot;</span>
            </div>
          )}
        </div>
        
        {/* ============ HERO SECTION - MAIN STORY ============ */}
        {heroNews && (
          <div className="mb-10">
            <div className="relative group overflow-hidden rounded-xl shadow-lg">
              {heroNews.featuredImage ? (
                <>
                  <Image
                    src={heroNews.featuredImage}
                    alt={heroNews.title}
                    width={1200}
                    height={600}
                    className="w-full h-[450px] lg:h-[500px] object-cover group-hover:scale-105 transition duration-700"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </>
              ) : (
                <div className="w-full h-[450px] lg:h-[500px] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <Newspaper className="w-20 h-20 text-gray-600" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-red-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    {heroNews.category}
                  </span>
                  <span className="text-sm text-gray-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(heroNews.publishedAt)}
                  </span>
                </div>
                <Link href={`/news/${heroNews.slug}`}>
                  <h1 className="text-2xl lg:text-5xl font-bold mb-3 hover:underline line-clamp-2">
                    {heroNews.title}
                  </h1>
                </Link>
                <p className="text-gray-200 text-base lg:text-lg max-w-2xl line-clamp-2">
                  {heroNews.excerpt}
                </p>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{heroNews.authorName || 'NextID Team'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>0 Comments</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No results message */}
        {newsList.length === 0 && (
          <div className="text-center py-16">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No news found</h3>
            <p className="text-gray-500">Try changing your filter or search criteria.</p>
            <Link href="/news" className="mt-4 inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              View All News
            </Link>
          </div>
        )}

        {newsList.length > 0 && (
          <>
            {/* ============ TOP STORIES GRID ============ */}
            {topStories.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {topStories.slice(0, 3).map((news, idx) => (
                  <Link key={idx} href={`/news/${news.slug}`} className="group">
                    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                        {news.featuredImage ? (
                          <Image
                            src={news.featuredImage}
                            alt={news.title}
                            fill
                            className="object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                            <Newspaper className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                            {news.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(news.publishedAt)}</span>
                        </div>
                        <h3 className="font-bold text-gray-800 group-hover:text-red-600 transition line-clamp-2 text-lg">
                          {news.title}
                        </h3>
                        <p className="text-gray-500 text-sm mt-2 line-clamp-2">{news.excerpt}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* ============ MAIN CONTENT + SIDEBAR LAYOUT ============ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* ============ LEFT COLUMN - FEATURED & LATEST NEWS ============ */}
              <div className="lg:col-span-2">
                
                {/* Featured Section */}
                {featuredNews.length > 0 && (
                  <div className="mb-10">
                    <div className="flex items-center justify-between border-l-4 border-red-600 pl-3 mb-5">
                      <h2 className="text-2xl font-bold text-gray-800">Featured News</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {featuredNews.map((news) => (
                        <Link key={news.id} href={`/news/${news.slug}`} className="group">
                          <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                            <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                              {news.featuredImage ? (
                                <Image
                                  src={news.featuredImage}
                                  alt={news.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition duration-500"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                                  <Newspaper className="w-10 h-10 text-gray-400" />
                                </div>
                              )}
                              <div className="absolute top-3 left-3">
                                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                                  {news.category}
                                </span>
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-bold text-gray-800 group-hover:text-red-600 transition line-clamp-2 text-lg">
                                {news.title}
                              </h3>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <span>{formatDate(news.publishedAt)}</span>
                                <span>•</span>
                                <span>By {news.authorName || 'NextID Team'}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Latest News Section */}
                <div>
                  <div className="flex items-center justify-between border-l-4 border-red-600 pl-3 mb-5">
                    <h2 className="text-2xl font-bold text-gray-800">Latest News</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {latestNews.map((news) => (
                      <article key={news.id} className="group flex gap-5 pb-4 border-b border-gray-100 hover:bg-gray-50 p-3 rounded-lg transition">
                        <div className="flex-shrink-0">
                          <div className="relative w-28 h-24 md:w-36 md:h-28 overflow-hidden rounded-lg bg-gray-100">
                            {news.featuredImage ? (
                              <Image
                                src={news.featuredImage}
                                alt={news.title}
                                fill
                                className="object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Newspaper className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                              {news.category}
                            </span>
                          </div>
                          <Link href={`/news/${news.slug}`}>
                            <h3 className="font-semibold text-gray-800 group-hover:text-red-600 transition line-clamp-2 text-base md:text-lg">
                              {news.title}
                            </h3>
                          </Link>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2 hidden md:block">{news.excerpt}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span>{formatDate(news.publishedAt)}</span>
                            <span>•</span>
                            <span>{news.authorName || 'NextID Team'}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
                
                {/* Pagination */}
                {pagination.totalPages > 1 && !searchQuery && !selectedCategory && (
                  <div className="flex justify-center items-center gap-2 mt-8 pt-4">
                    {pagination.currentPage > 1 && (
                      <Link
                        href={`/news?page=${pagination.currentPage - 1}`}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                      >
                        ← Previous
                      </Link>
                    )}
                    <span className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium">
                      {pagination.currentPage}
                    </span>
                    {pagination.currentPage < pagination.totalPages && (
                      <Link
                        href={`/news?page=${pagination.currentPage + 1}`}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                      >
                        Next →
                      </Link>
                    )}
                  </div>
                )}
              </div>
              
              {/* ============ RIGHT SIDEBAR ============ */}
              <aside className="space-y-6">
                
                {/* Search Bar */}
                <div>
                  <form action="/news" method="get">
                    {selectedCategory && (
                      <input type="hidden" name="category" value={selectedCategory} />
                    )}
                    <div className="relative">
                      <input
                        type="text"
                        name="search"
                        defaultValue={searchQuery || ''}
                        placeholder="Search news..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </form>
                </div>
                
                {/* Categories Widget */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-800 border-b pb-2 mb-3 text-lg">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_OPTIONS.filter(c => c.value).map((cat) => (
                      <Link
                        key={cat.value}
                        href={`/news?category=${encodeURIComponent(cat.value)}`}
                        className={`px-3 py-1.5 text-sm rounded-full transition ${
                          selectedCategory === cat.value
                            ? 'bg-red-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                </div>
                
                {/* Most Popular */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <div className="flex items-center gap-2 border-b-2 border-red-600 pb-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold text-gray-800 text-lg">Most Popular</h3>
                  </div>
                  <div className="space-y-4">
                    {popularNews.map((news, idx) => (
                      <Link key={idx} href={`/news/${news.slug}`} className="flex gap-3 group items-start">
                        <div className="flex-shrink-0 w-7 h-7 bg-red-100 text-red-600 rounded-md flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </div>
                        <p className="text-gray-700 group-hover:text-red-600 transition line-clamp-2 text-sm flex-1 font-medium">
                          {news.title}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
                
                {/* Newsletter */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-5 text-white">
                  <h3 className="font-bold text-xl mb-2">Newsletter</h3>
                  <p className="text-sm text-red-100 mb-4">Get the latest news delivered to your inbox daily</p>
                  <div className="flex flex-col gap-3">
                    <input
                      type="email"
                      placeholder="Your email address"
                      className="px-4 py-2 rounded-lg text-gray-800 text-sm focus:outline-none"
                    />
                    <button className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition">
                      Subscribe Now
                    </button>
                  </div>
                </div>
                
                {/* Advertisement */}
                <div className="bg-gray-100 rounded-xl p-5 text-center border border-dashed border-gray-300">
                  <p className="text-gray-400 text-xs mb-2">Advertisement</p>
                  <div className="h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Ad Space</span>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
        
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; category?: string }> }) {
  return (
    <Suspense fallback={<NewsLoading />}>
      <NewsContent searchParamsPromise={searchParams} />
    </Suspense>
  );
}