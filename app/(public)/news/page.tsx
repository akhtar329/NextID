// app/(public)/news/page.tsx

import { notFound } from "next/navigation";
import type { Metadata } from 'next';
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { 
  Newspaper, 
  TrendingUp, 
  Clock, 
  Search,
  Flame,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  Twitter,
  Facebook,
  Linkedin,
  Mail
} from 'lucide-react';
import { postService } from '@/services/post/post.service';
import type { ExtendedPost } from '@/services/post/post.service';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';
import { generateJsonLd } from '@/lib/seo';
import { cacheTag, cacheLife } from 'next/cache';

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

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// ============ CONSTANTS ============
const ITEMS_PER_PAGE = 12;
const CURRENT_YEAR = '2026';
const REFERENCE_DATE = new Date('2024-01-01T00:00:00.000Z');

const CATEGORY_OPTIONS = [
  { value: "", label: "All News", icon: "📰" },
  { value: "Admissions", label: "Admissions", icon: "🎓" },
  { value: "Results", label: "Results", icon: "📊" },
  { value: "Scholarships", label: "Scholarships", icon: "💰" },
  { value: "Exams", label: "Exams", icon: "📝" },
  { value: "Events", label: "Events", icon: "🎉" },
  { value: "Announcements", label: "Announcements", icon: "📢" },
  { value: "Jobs", label: "Jobs", icon: "💼" },
  { value: "General", label: "General", icon: "📰" },
];

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

// ✅ FIXED: Safe date formatter with type checking
function formatDateStatic(date: Date | string | null): string {
  if (!date) return 'Recent';
  
  // ✅ Convert string to Date if needed
  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return 'Recent';
  }
  
  // ✅ Check if valid date
  if (isNaN(dateObj.getTime())) {
    return 'Recent';
  }
  
  const diffMs = REFERENCE_DATE.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return dateObj.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// ✅ FIXED: Safe date sort value with type checking
function getDateSortValue(date: Date | string | null): number {
  if (!date) return 0;
  
  // ✅ Convert string to Date if needed
  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return 0;
  }
  
  // ✅ Check if valid date
  if (isNaN(dateObj.getTime())) {
    return 0;
  }
  
  return dateObj.getTime();
}

// ✅ Helper to safely convert date to Date object
function safeParseDate(date: Date | string | null): Date | null {
  if (!date) return null;
  
  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return null;
  }
  
  if (isNaN(dateObj.getTime())) {
    return null;
  }
  
  return dateObj;
}

// ============ SHARE BUTTONS ============
function ShareButtons({ title, url }: { title: string; url: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  
  return (
    <div className="flex gap-2">
      <a href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer nofollow"
        className="w-8 h-8 bg-black hover:bg-gray-800 text-white rounded-lg flex items-center justify-center transition">
        <Twitter className="w-4 h-4" />
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer nofollow"
        className="w-8 h-8 bg-blue-700 hover:bg-blue-800 text-white rounded-lg flex items-center justify-center transition">
        <Facebook className="w-4 h-4" />
      </a>
      <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer nofollow"
        className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition">
        <Linkedin className="w-4 h-4" />
      </a>
      <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
        className="w-8 h-8 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center transition">
        <Mail className="w-4 h-4" />
      </a>
    </div>
  );
}

// ============ CACHED DATA FETCHING ============
async function getAllNews(): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("news-all");
  cacheTag("posts-type-news");
  cacheLife("hours");
  
  try {
    const news = await postService.getList('news', 10);
    return news || [];
  } catch (error) {
    console.error('Error fetching all news:', error);
    return [];
  }
}

async function getNewsData(page: number = 1, limit: number = ITEMS_PER_PAGE, searchQuery?: string, category?: string): Promise<{ news: NewsItem[]; pagination: PaginationInfo }> {
  "use cache";
  
  const cacheKey = `news-${page}-${category || 'all'}-${searchQuery || 'none'}`;
  cacheTag(cacheKey);
  cacheTag("posts-type-news");
  cacheLife("hours");
  
  try {
    let allNews = await getAllNews();
    
    let newsList: NewsItem[] = allNews.map((post: ExtendedPost) => {
      const meta = post.meta || {};
      
      // ✅ Safely convert dates
      const publishedAt = safeParseDate(post.publishedAt);
      const createdAt = safeParseDate(post.createdAt);
      
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
        publishedAt: publishedAt, // ✅ Now Date object or null
        createdAt: createdAt,     // ✅ Now Date object or null
        authorName: getMetaValue(meta, 'authorName', null),
      };
    });
    
    // ✅ Sort using safe date function
    newsList.sort((a, b) => {
      const dateA = getDateSortValue(a.publishedAt);
      const dateB = getDateSortValue(b.publishedAt);
      return dateB - dateA;
    });
    
    if (category && category !== '') {
      newsList = newsList.filter(news => 
        news.category.toLowerCase() === category.toLowerCase()
      );
    }
    
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
        itemsPerPage: ITEMS_PER_PAGE
      }
    };
  }
}

// ============ METADATA ============
export async function generateMetadata(): Promise<Metadata> {
  const allNews = await getAllNews();
  const totalNews = allNews.length;
  const currentYear = CURRENT_YEAR;
  
  return {
    title: `Latest Education News ${currentYear} | Pakistan Admissions, Results & Updates | NextID.pk`,
    description: `Get ${totalNews}+ latest education news, breaking updates on admissions, board results, scholarships, and educational events from across Pakistan. Stay informed with NextID.pk.`,
    keywords: `education news ${currentYear}, Pakistan education news, admission news, result news, scholarship news, breaking news Pakistan, educational updates`,
    robots: 'index, follow',
    alternates: {
      canonical: 'https://www.nextid.pk/news',
      languages: {
        'en-US': 'https://www.nextid.pk/news',
      },
    },
    publisher: 'NextID.pk',
    authors: [{ name: 'NextID.pk' }],
    openGraph: {
      title: `Latest Education News ${currentYear} - Pakistan Updates | NextID.pk`,
      description: `Breaking news, admissions, results, scholarships and educational events from across Pakistan.`,
      url: 'https://www.nextid.pk/news',
      siteName: 'NextID.pk',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Education News Pakistan' }],
      locale: 'en_PK',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Latest Education News ${currentYear} - Pakistan Updates`,
      description: `Get the latest education news, admissions, and results updates from across Pakistan.`,
      images: ['/og-image.png'],
      site: '@nextidpk',
      creator: '@nextidpk',
    },
  };
}

// ============ LOADING COMPONENT ============
function NewsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading news...</p>
      </div>
    </div>
  );
}

// ============ STATS CARDS ============
function StatsCards({ stats }: { stats: { total: number; featured: number; breaking: number } }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-red-600">{stats.total}</div>
        <div className="text-xs text-gray-500">Total News</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-amber-600">{stats.featured}</div>
        <div className="text-xs text-gray-500">Featured</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="text-2xl font-bold text-red-700">{stats.breaking}</div>
        <div className="text-xs text-gray-500">Breaking</div>
      </div>
    </div>
  );
}

// ============ NEWS CONTENT COMPONENT ============
async function NewsContent({ searchParamsPromise }: { searchParamsPromise: Promise<{ page?: string; search?: string; category?: string }> }) {
  const params = await searchParamsPromise;
  const page = params.page ? parseInt(params.page) : 1;
  const searchQuery = params.search || undefined;
  const selectedCategory = params.category || "";
  
  const { news: newsList, pagination } = await getNewsData(page, ITEMS_PER_PAGE, searchQuery, selectedCategory);
  
  if (newsList.length === 0 && page === 1 && !searchQuery && !selectedCategory) {
    notFound();
  }
  
  const stats = {
    total: pagination.totalItems,
    featured: newsList.filter(n => n.isFeatured).length,
    breaking: newsList.filter(n => n.isBreaking).length,
  };
  
  const heroNews = newsList[0];
  const topStories = newsList.slice(1, 4);
  const latestNews = newsList.slice(4, 12);
  const popularNews = [...newsList].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
  
  const currentYear = CURRENT_YEAR;
  const shareUrl = 'https://www.nextid.pk/news';
  const shareTitle = `Latest Education News ${currentYear} - Pakistan Updates`;
  
  const jsonLd = generateJsonLd({
    type: 'WebPage',
    title: `Latest Education News ${currentYear} - Pakistan Updates`,
    description: `Get ${pagination.totalItems} latest education news, breaking updates on admissions, board results, and scholarships`,
    url: 'https://www.nextid.pk/news',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'News', url: '/news' },
    ],
  });
  
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Latest Education News ${currentYear}`,
    "description": `List of ${pagination.totalItems} latest education news articles and updates`,
    "numberOfItems": pagination.totalItems,
    "url": "https://www.nextid.pk/news",
    "itemListElement": newsList.slice(0, 10).map((news, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.nextid.pk/news/${news.slug}`,
      "name": news.title
    }))
  };
  
  const buildUrl = (newPage: number) => {
    const urlParams = new URLSearchParams();
    if (selectedCategory) urlParams.set('category', selectedCategory);
    if (searchQuery) urlParams.set('search', searchQuery);
    if (newPage > 1) urlParams.set('page', newPage.toString());
    return urlParams.toString() ? `/news?${urlParams.toString()}` : '/news';
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      
      <main className="min-h-screen bg-gray-50">
        
        {newsList.filter(n => n.isBreaking).length > 0 && (
          <div className="bg-red-600 text-white py-2 overflow-hidden">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full flex-shrink-0">
                  <Flame className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="font-bold text-xs uppercase tracking-wider">Breaking</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="whitespace-nowrap animate-marquee inline-block">
                    {newsList.filter(n => n.isBreaking).slice(0, 5).map((news, idx) => (
                      <Link key={idx} href={`/news/${news.slug}`} className="mx-4 hover:underline text-sm">
                        {news.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                <Newspaper className="w-4 h-4" />
                <span className="text-sm font-medium">Latest News & Updates</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                News <span className="text-yellow-300">Updates</span>
              </h1>
              <p className="text-lg text-red-100">
                Breaking news, admissions, results, and educational events from across Pakistan
              </p>
            </div>
          </div>
        </div>

        <div 
          className="container mx-auto px-4 py-12 max-w-7xl"
          suppressHydrationWarning
        >
          
          <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
            <Link href="/" className="hover:text-red-600 transition">Home</Link>
            <span>›</span>
            <span className="text-gray-700 font-medium">News</span>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-500 mr-2">Filter:</span>
              {CATEGORY_OPTIONS.map((cat) => (
                <Link
                  key={cat.value}
                  href={`/news${cat.value ? `?category=${encodeURIComponent(cat.value)}` : ''}`}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                    selectedCategory === cat.value
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </Link>
              ))}
              
              {selectedCategory && (
                <Link
                  href="/news"
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear
                </Link>
              )}
            </div>
          </div>
          
          <StatsCards stats={stats} />
          
          <div className="bg-white rounded-xl shadow-sm p-3 mb-6 border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-gray-500 font-medium">Share this page:</span>
              <ShareButtons title={shareTitle} url={shareUrl} />
            </div>
          </div>
          
          {heroNews && (
            <div className="mb-10">
              <Link href={`/news/${heroNews.slug}`} className="group">
                <div className="relative overflow-hidden rounded-xl shadow-lg bg-white">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="relative h-64 lg:h-80 overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
                      {heroNews.featuredImage ? (
                        <Image
                          src={heroNews.featuredImage}
                          alt={heroNews.title}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-700"
                          priority
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="w-16 h-16 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 lg:p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                          {heroNews.category}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateStatic(heroNews.publishedAt)}
                        </span>
                      </div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 group-hover:text-red-600 transition mb-3 line-clamp-3">
                        {heroNews.title}
                      </h2>
                      <p className="text-gray-600 line-clamp-2 mb-4">
                        {heroNews.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {heroNews.authorName || 'NextID Team'}
                        </span>
                        <span className="flex items-center gap-1">
                          👁️ {heroNews.viewCount.toLocaleString()} views
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {newsList.length > 0 && (
            <div className="flex flex-col lg:flex-row gap-8">
              
              <main className="lg:w-2/3 space-y-8">
                
                {topStories.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
                      <h2 className="text-xl font-bold text-gray-800">Top Stories</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {topStories.map((news, idx) => (
                        <Link key={idx} href={`/news/${news.slug}`} className="group">
                          <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 h-full">
                            <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                              {news.featuredImage ? (
                                <Image
                                  src={news.featuredImage}
                                  alt={news.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Newspaper className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              <div className="absolute top-2 left-2">
                                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded">
                                  {news.category}
                                </span>
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                <Clock className="w-3 h-3" />
                                {formatDateStatic(news.publishedAt)}
                              </div>
                              <h3 className="font-semibold text-gray-800 group-hover:text-red-600 transition line-clamp-2">
                                {news.title}
                              </h3>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
                    <h2 className="text-xl font-bold text-gray-800">Latest News</h2>
                  </div>
                  
                  <div className="space-y-3">
                    {latestNews.map((news) => (
                      <Link key={news.id} href={`/news/${news.slug}`} className="block group">
                        <div className="bg-white rounded-lg border border-gray-100 hover:shadow-md transition-all p-4">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
                              {news.featuredImage ? (
                                <Image
                                  src={news.featuredImage}
                                  alt={news.title}
                                  width={96}
                                  height={96}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Newspaper className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                  {news.category}
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDateStatic(news.publishedAt)}
                                </span>
                              </div>
                              <h3 className="font-semibold text-gray-800 group-hover:text-red-600 transition line-clamp-2">
                                {news.title}
                              </h3>
                              <p className="text-gray-500 text-sm mt-1 line-clamp-1 hidden md:block">
                                {news.excerpt}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-4">
                    {pagination.currentPage > 1 && (
                      <Link
                        href={buildUrl(pagination.currentPage - 1)}
                        className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Link>
                    )}
                    
                    <div className="flex gap-1">
                      {(() => {
                        const pages = [];
                        const maxVisible = 5;
                        let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
                        let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
                        
                        if (endPage - startPage + 1 < maxVisible) {
                          startPage = Math.max(1, endPage - maxVisible + 1);
                        }
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(i);
                        }
                        
                        return pages.map((pageNum) => (
                          <Link
                            key={pageNum}
                            href={buildUrl(pageNum)}
                            className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                              pageNum === pagination.currentPage
                                ? 'bg-red-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </Link>
                        ));
                      })()}
                    </div>
                    
                    {pagination.currentPage < pagination.totalPages && (
                      <Link
                        href={buildUrl(pagination.currentPage + 1)}
                        className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                )}
              </main>
              
              <aside className="lg:w-1/3">
                <div className="sticky top-24 space-y-6">
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
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
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </form>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <TrendingUp className="w-4 h-4 text-red-600" />
                      <h3 className="font-bold text-gray-800">Most Popular</h3>
                    </div>
                    <div className="space-y-3">
                      {popularNews.map((news, idx) => (
                        <Link key={idx} href={`/news/${news.slug}`} className="flex gap-3 group items-start">
                          <div className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-md flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </div>
                          <p className="text-sm text-gray-700 group-hover:text-red-600 transition line-clamp-2 flex-1 font-medium">
                            {news.title}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                  
                  <Suspense fallback={<div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-64"></div>}>
                    <SidebarWidgets />
                  </Suspense>
                </div>
              </aside>
            </div>
          )}
          
          {newsList.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl">
              <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No news found</h3>
              <p className="text-gray-500">Try changing your filter or search criteria.</p>
              <Link href="/news" className="mt-4 inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                View All News
              </Link>
            </div>
          )}
          
        </div>
      </main>
    </>
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
