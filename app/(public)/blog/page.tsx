// app/(public)/blog/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import {
  BookOpen,
  Calendar,
  TrendingUp,
  Search,
  ChevronRight,
  User,
  Clock,
  Eye,
  Heart,
  ChevronLeft,
} from 'lucide-react';

import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';
import { postService } from '@/services/post/post.service';
import type { ExtendedPost } from '@/services/post/post.service';
import { generateJsonLd } from '@/lib/seo';

// ================= TYPES =================
interface BlogItem {
  id: number;
  slug: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  category: string;
  tags: string[] | null;
  authorName: string | null;
  isFeatured: boolean;
  isPopular: boolean;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date | null;
}

interface Filters {
  category?: string;
  tag?: string;
  q?: string;
  page?: number;
}

interface PaginatedResponse {
  blogs: BlogItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface Stats {
  total: number;
  featured: number;
  popular: number;
  categories: { name: string; count: number }[];
}

// ================= CONSTANTS =================
const ITEMS_PER_PAGE = 12;
const CURRENT_YEAR = '2026';
const REFERENCE_DATE = new Date('2024-01-01T00:00:00.000Z');

const BLOG_CATEGORIES = [
  { slug: '', name: 'All Posts', icon: '📚' },
  { slug: 'study-tips', name: 'Study Tips', icon: '💡' },
  { slug: 'career-guidance', name: 'Career Guidance', icon: '🎯' },
  { slug: 'exam-preparation', name: 'Exam Preparation', icon: '📝' },
  { slug: 'scholarship-guide', name: 'Scholarship Guide', icon: '💰' },
  { slug: 'university-life', name: 'University Life', icon: '🎓' },
  { slug: 'success-stories', name: 'Success Stories', icon: '⭐' },
  { slug: 'educational-news', name: 'Educational News', icon: '📰' },
];

// ================= HELPERS =================
function getMeta<T>(meta: Record<string, unknown> | null, key: string, fallback: T): T {
  if (!meta) return fallback;
  const value = meta[key] as T;
  return value ?? fallback;
}

// ✅ FIXED: Static date with reference
function formatDateStatic(date: Date | null): string {
  if (!date) return 'Recent';

  const diffMs = REFERENCE_DATE.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getReadTime(content: string | null): number {
  if (!content) return 1;
  return Math.ceil(content.split(/\s+/).length / 200);
}

function normalizeCategory(cat: string): string {
  return cat.toLowerCase().replace(/\s+/g, '-');
}

// ================= METADATA =================
export async function generateMetadata(): Promise<Metadata> {
  const allBlogs = await getAllBlogs();
  const totalBlogs = allBlogs.length;

  return {
    title: `Educational Blog ${CURRENT_YEAR} | Study Tips & Career Guidance | NextID.pk`,
    description: `Read ${totalBlogs}+ educational articles on study tips, exam preparation, career guidance, scholarship guides, and success stories.`,
    keywords: `education blog ${CURRENT_YEAR}, study tips, exam preparation, career guidance, scholarship guide, university life`,
    robots: 'index, follow',
    alternates: {
      canonical: 'https://www.nextid.pk/blog',
      languages: {
        'en-US': 'https://www.nextid.pk/blog',
      },
    },
    publisher: 'NextID.pk',
    authors: [{ name: 'NextID.pk' }],
    openGraph: {
      title: `Educational Blog ${CURRENT_YEAR}`,
      description: 'Study tips, exam prep, career guidance',
      url: 'https://www.nextid.pk/blog',
      siteName: 'NextID.pk',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      locale: 'en_PK',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Educational Blog ${CURRENT_YEAR}`,
      description: 'Study tips and career guidance',
      images: ['/og-image.png'],
    },
  };
}

// ================= DATA FETCHING =================
async function getAllBlogs(): Promise<ExtendedPost[]> {
  try {
    const blogs = await postService.getList('blog', 1000);
    return blogs || [];
  } catch (error) {
    console.error('Error fetching all blogs:', error);
    return [];
  }
}

async function getPaginatedBlogs(filters: Filters): Promise<PaginatedResponse> {
  const currentPage = filters.page || 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  
  try {
    const allBlogs = await getAllBlogs();
    
    let blogsList: BlogItem[] = allBlogs.map((post: ExtendedPost) => {
      const meta = post.meta || {};
      
      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
        category: getMeta(meta, 'category', 'General'),
        tags: getMeta(meta, 'tags', null),
        authorName: getMeta(meta, 'authorName', null),
        isFeatured: getMeta(meta, 'isFeatured', false),
        isPopular: getMeta(meta, 'isPopular', false),
        viewCount: getMeta(meta, 'viewCount', 0),
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
      };
    });
    
    // Sort by published date (newest first)
    blogsList.sort((a, b) =>
      new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
    );
    
    // Filter by category with proper slug mapping
    if (filters.category) {
      blogsList = blogsList.filter((b) => {
        const normalized = normalizeCategory(b.category);
        return normalized === filters.category;
      });
    }
    
    // Filter by search query
    if (filters.q) {
      const q = filters.q.toLowerCase();
      blogsList = blogsList.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.excerpt?.toLowerCase().includes(q) ||
          b.authorName?.toLowerCase().includes(q)
      );
    }
    
    const totalCount = blogsList.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const paginatedBlogs = blogsList.slice(offset, offset + ITEMS_PER_PAGE);
    
    return {
      blogs: paginatedBlogs,
      totalCount,
      totalPages,
      currentPage,
    };
  } catch (error) {
    console.error('Error fetching paginated blogs:', error);
    return {
      blogs: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }
}

// ================= STATS =================
async function getStats(): Promise<Stats> {
  try {
    const allBlogs = await getAllBlogs();
    
    const categories = new Map<string, number>();
    let featured = 0;
    let popular = 0;
    
    allBlogs.forEach((post) => {
      const meta = post.meta || {};
      
      const isFeatured = getMeta(meta, 'isFeatured', false);
      const isPopular = getMeta(meta, 'isPopular', false);
      const category = getMeta(meta, 'category', 'General');
      
      if (isFeatured) featured++;
      if (isPopular) popular++;
      
      categories.set(category, (categories.get(category) || 0) + 1);
    });
    
    return {
      total: allBlogs.length,
      featured,
      popular,
      categories: Array.from(categories.entries()).map(([name, count]) => ({
        name,
        count,
      })),
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      total: 0,
      featured: 0,
      popular: 0,
      categories: [],
    };
  }
}

// ================= PAGINATION COMPONENT =================
function Pagination({ currentPage, totalPages, buildUrl }: { 
  currentPage: number; 
  totalPages: number; 
  buildUrl: (key: string, value: string) => string;
}) {
  if (totalPages <= 1) return null;
  
  const pages = [];
  const maxVisible = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  // ✅ FIXED: Use const for startPage and endPage
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return (
    <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
      {currentPage > 1 && (
        <Link
          href={buildUrl('page', (currentPage - 1).toString())}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4 inline mr-1" />
          Previous
        </Link>
      )}
      
      {startPage > 1 && (
        <>
          <Link href={buildUrl('page', '1')} className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
            1
          </Link>
          {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
        </>
      )}
      
      {pages.map(page => (
        <Link
          key={page}
          href={buildUrl('page', page.toString())}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
            page === currentPage
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {page}
        </Link>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
          <Link href={buildUrl('page', totalPages.toString())} className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
            {totalPages}
          </Link>
        </>
      )}
      
      {currentPage < totalPages && (
        <Link
          href={buildUrl('page', (currentPage + 1).toString())}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          Next
          <ChevronRight className="w-4 h-4 inline ml-1" />
        </Link>
      )}
    </div>
  );
}

// ================= BLOG CARD COMPONENT =================
function BlogCard({ blog }: { blog: BlogItem }) {
  const readTime = getReadTime(blog.content);
  
  return (
    <Link href={`/blog/${blog.slug}`} className="block group">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 h-full">
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
          {blog.featuredImage ? (
            <Image
              src={blog.featuredImage}
              alt={blog.title}
              fill
              className="object-cover group-hover:scale-105 transition duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-indigo-400 mx-auto" />
                <span className="text-xs text-gray-400 mt-1 block">{blog.category}</span>
              </div>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
              {blog.category}
            </span>
          </div>
        </div>
        
        <div className="p-5">
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDateStatic(blog.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {readTime} min read
            </span>
          </div>
          
          <h3 className="font-bold text-gray-800 group-hover:text-indigo-600 transition line-clamp-2 text-lg mb-2">
            {blog.title}
          </h3>
          
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {blog.excerpt || `Read about ${blog.title} and get valuable insights.`}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {blog.authorName || 'NextID Team'}
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {blog.viewCount.toLocaleString()}
              </span>
              {blog.isPopular && (
                <span className="flex items-center gap-1 text-amber-500">
                  <Heart className="w-3 h-3 fill-amber-500" />
                  Popular
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ================= LOADING COMPONENT =================
function BlogLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:w-72 shrink-0">
        <div className="bg-white rounded-xl p-5 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="bg-white rounded-xl p-4 mb-4 animate-pulse"><div className="h-6 bg-gray-200 rounded w-48"></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================= FILTER SIDEBAR =================
function FilterSidebar({ filters, buildUrl }: { filters: Filters; stats: Stats; buildUrl: (key: string, value: string) => string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-100">
      <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
        <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
        Categories
      </h2>
      
      <div className="space-y-1">
        {BLOG_CATEGORIES.map(cat => (
          <Link
            key={cat.slug}
            href={buildUrl('category', cat.slug)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              filters.category === cat.slug
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-gray-50 text-gray-600'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </Link>
        ))}
      </div>
      
      {(filters.category || filters.q) && (
        <Link
          href="/blog"
          className="block text-center text-sm text-indigo-600 hover:text-indigo-700 mt-4 pt-3 border-t border-gray-100"
        >
          Clear all filters
        </Link>
      )}
    </div>
  );
}

// ================= MAIN CONTENT =================
async function BlogContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParamsPromise;
  
  const currentPage = typeof params.page === 'string' ? parseInt(params.page) : 1;
  
  const filters: Filters = {
    category: typeof params.category === 'string' ? params.category : '',
    q: typeof params.q === 'string' ? params.q : '',
    tag: typeof params.tag === 'string' ? params.tag : '',
    page: currentPage,
  };

  const [paginatedData, stats] = await Promise.all([
    getPaginatedBlogs(filters),
    getStats(),
  ]);

  const { blogs, totalCount, totalPages, currentPage: page } = paginatedData;

  // Hero from all blogs (not filtered)
  const allBlogs = await getAllBlogs();
  const allBlogsList: BlogItem[] = allBlogs.map((post: ExtendedPost) => {
    const meta = post.meta || {};
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      category: getMeta(meta, 'category', 'General'),
      tags: getMeta(meta, 'tags', null),
      authorName: getMeta(meta, 'authorName', null),
      isFeatured: getMeta(meta, 'isFeatured', false),
      isPopular: getMeta(meta, 'isPopular', false),
      viewCount: getMeta(meta, 'viewCount', 0),
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
    };
  });
  
  const hero = allBlogsList.find((b) => b.isFeatured) || allBlogsList[0];
  
  // Featured from all blogs
  const featured = allBlogsList.filter((b) => b.isFeatured).slice(0, 3);
  
  // Popular from all blogs (not filtered)
  const popular = [...allBlogsList]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  const buildUrl = (key: string, value: string) => {
    const urlParams = new URLSearchParams();
    
    if (filters.category && key !== 'category')
      urlParams.set('category', filters.category);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (page !== 1 && key !== 'page') urlParams.set('page', page.toString());
    if (value) urlParams.set(key, value);
    
    return urlParams.toString() ? `/blog?${urlParams.toString()}` : '/blog';
  };

  const jsonLd = generateJsonLd({
    type: 'WebPage',
    title: `Blog ${CURRENT_YEAR}`,
    description: 'Educational articles',
    url: 'https://www.nextid.pk/blog',
  });

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: totalCount,
    itemListElement: blogs.slice(0, 10).map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://www.nextid.pk/blog/${b.slug}`,
      name: b.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR - Categories */}
        <aside className="lg:w-72 flex-shrink-0">
          <FilterSidebar filters={filters} stats={stats} buildUrl={buildUrl} />
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1">
          
          {/* Stats Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Showing {blogs.length} of {totalCount} Articles
              </h2>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {stats.featured} Featured</span>
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {stats.popular} Popular</span>
                <span>Page {page} of {totalPages}</span>
              </div>
            </div>
          </div>
          
          {/* Hero Section */}
          {hero && (
            <div className="mb-8">
              <Link href={`/blog/${hero.slug}`} className="group">
                <div className="relative overflow-hidden rounded-xl shadow-lg bg-white">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="relative h-64 lg:h-80 overflow-hidden bg-gradient-to-br from-indigo-700 to-purple-700">
                      {hero.featuredImage ? (
                        <Image
                          src={hero.featuredImage}
                          alt={hero.title}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-700"
                          priority
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center text-white/50">
                            <BookOpen className="w-16 h-16 mx-auto mb-2" />
                            <span className="text-sm">{hero.category}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6 lg:p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">
                          {hero.category}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateStatic(hero.publishedAt)}
                        </span>
                      </div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 group-hover:text-indigo-600 transition mb-3 line-clamp-3">
                        {hero.title}
                      </h2>
                      <p className="text-gray-600 line-clamp-2 mb-4">
                        {hero.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {hero.authorName || 'NextID Team'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getReadTime(hero.content)} min read
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
          
          {/* Featured Posts Grid */}
          {featured.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-800">Featured Articles</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {featured.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            </div>
          )}
          
          {/* All Posts Grid */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-800">Latest Articles</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {blogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          </div>
          
          {/* Pagination */}
          <Pagination currentPage={page} totalPages={totalPages} buildUrl={buildUrl} />
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <form action="/blog" method="get" className="relative">
                <input
                  type="text"
                  name="q"
                  defaultValue={filters.q || ''}
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
            </div>
            
            {/* Most Popular */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-gray-800">Most Popular</h3>
              </div>
              <div className="space-y-3">
                {popular.map((blog, idx) => (
                  <Link key={blog.id} href={`/blog/${blog.slug}`} className="flex gap-3 group items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-gray-700 group-hover:text-indigo-600 transition line-clamp-2 flex-1 font-medium">
                      {blog.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Sidebar Widgets */}
            <Suspense fallback={<div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-64"></div>}>
              <SidebarWidgets />
            </Suspense>
          </div>
        </aside>
      </div>
    </>
  );
}

// ================= PAGE =================
export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-3xl text-center mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Educational Blog {CURRENT_YEAR}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Education <span className="text-yellow-300">Blog</span>
            </h1>
            <p className="text-lg text-indigo-100">
              Expert insights, study tips, and career guidance for Pakistani students
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Suspense fallback={<BlogLoading />}>
          <BlogContent searchParamsPromise={searchParams || Promise.resolve({})} />
        </Suspense>
      </div>
    </main>
  );
}