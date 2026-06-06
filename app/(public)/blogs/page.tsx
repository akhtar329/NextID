// app/(public)/blog/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import React from 'react';
import { postService } from '@/services/post/post.service';
import { unstable_cache } from 'next/cache';
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
} from 'lucide-react';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';
import { generateJsonLd } from '@/lib/seo';

// ============ TYPES ============
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
}

interface Stats {
  total: number;
  featured: number;
  popular: number;
  categories: { name: string; count: number }[];
}

// ============ CONSTANTS ============
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

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

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
    month: 'short',
    year: 'numeric'
  });
}

function getReadTime(content: string | null): number {
  if (!content) return 1;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / 200);
}

// ============ METADATA ============
export async function generateMetadata(): Promise<Metadata> {
  const allBlogs = await postService.getPostsByType('blog', 200);
  const totalBlogs = allBlogs.length;
  const currentYear = new Date().getFullYear();
  
  return {
    title: `Educational Blog ${currentYear} | Study Tips & Career Guidance | NextID.pk`,
    description: `Read ${totalBlogs}+ educational articles on study tips, exam preparation, career guidance, scholarship guides, and success stories for Pakistani students.`,
    keywords: `education blog ${currentYear}, study tips, exam preparation, career guidance, scholarship guide, student success stories, Pakistan education`,
    alternates: {
      canonical: 'https://www.nextid.pk/blog',
    },
    openGraph: {
      title: `Educational Blog ${currentYear} - Study Tips & Career Guidance | NextID.pk`,
      description: `Read expert articles on study tips, exam preparation, career guidance, and scholarship opportunities for Pakistani students.`,
      url: 'https://www.nextid.pk/blog',
      siteName: 'NextID.pk',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Educational Blog',
        },
      ],
      locale: 'en_PK',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Educational Blog ${currentYear} - Study Tips & Career Guidance`,
      description: `Read expert educational articles for Pakistani students.`,
      images: ['/og-image.png'],
      site: '@nextidpk',
      creator: '@nextidpk',
    },
  };
}

// ============ DATA FETCHING ============
async function getBlogs(filters: Filters): Promise<BlogItem[]> {
  try {
    const allBlogs = await postService.getPostsByType('blog', 200);
    
    let blogsList: BlogItem[] = allBlogs.map(post => {
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
        authorName: getMetaValue(meta, 'authorName', null),
        isFeatured: getMetaValue(meta, 'isFeatured', false),
        isPopular: getMetaValue(meta, 'isPopular', false),
        viewCount: getMetaValue(meta, 'viewCount', 0),
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
      };
    });
    
    blogsList.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });
    
    if (filters.category && filters.category !== '') {
      blogsList = blogsList.filter(blog => 
        blog.category.toLowerCase().replace(/ /g, '-') === filters.category?.toLowerCase()
      );
    }
    
    if (filters.q) {
      const query = filters.q.toLowerCase();
      blogsList = blogsList.filter(blog =>
        blog.title.toLowerCase().includes(query) ||
        (blog.excerpt && blog.excerpt.toLowerCase().includes(query)) ||
        (blog.authorName && blog.authorName.toLowerCase().includes(query))
      );
    }
    
    return blogsList;
  } catch (err) {
    console.error('Error fetching blogs:', err);
    return [];
  }
}

async function getStats(): Promise<Stats> {
  return unstable_cache(
    async () => {
      try {
        const allBlogs = await postService.getPostsByType('blog', 500);
        
        const total = allBlogs.length;
        const featured = allBlogs.filter(b => {
          const meta = b.meta || {};
          return getMetaValue(meta, 'isFeatured', false);
        }).length;
        const popular = allBlogs.filter(b => {
          const meta = b.meta || {};
          return getMetaValue(meta, 'isPopular', false);
        }).length;
        
        const categoryCount = new Map<string, number>();
        allBlogs.forEach(b => {
          const meta = b.meta || {};
          const cat = getMetaValue(meta, 'category', 'General');
          categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
        });
        
        const categories = Array.from(categoryCount.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
        
        return { total, featured, popular, categories };
      } catch (error) {
        console.error('Error fetching stats:', error);
        return { total: 0, featured: 0, popular: 0, categories: [] };
      }
    },
    ['blog-stats'],
    { revalidate: 86400, tags: ['blog-stats'] }
  )();
}

// ============ LOADING COMPONENT ============
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
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-5 mb-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="flex gap-2"><div className="h-6 bg-gray-200 rounded w-20"></div><div className="h-6 bg-gray-200 rounded w-20"></div></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ BLOG CONTENT COMPONENT ============
async function BlogContent({ searchParamsPromise }: { searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParamsPromise;
  
  const filters: Filters = {
    category: typeof params.category === 'string' ? params.category : '',
    tag: typeof params.tag === 'string' ? params.tag : '',
    q: typeof params.q === 'string' ? params.q : '',
  };

  const [blogs, stats] = await Promise.all([
    getBlogs(filters),
    getStats(),
  ]);

  const heroBlog = blogs.find(b => b.isFeatured) || blogs[0];
  const featuredBlogs = blogs.filter(b => b.isFeatured).slice(0, 3);
  const regularBlogs = blogs.filter(b => !b.isFeatured).slice(0, 9);
  const popularBlogs = [...blogs].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);

  const buildUrl = (key: string, value: string): string => {
    const urlParams = new URLSearchParams();
    if (filters.category && key !== 'category') urlParams.set('category', filters.category);
    if (filters.tag && key !== 'tag') urlParams.set('tag', filters.tag);
    if (filters.q && key !== 'q') urlParams.set('q', filters.q);
    if (value) urlParams.set(key, value);
    return urlParams.toString() ? `/blog?${urlParams.toString()}` : '/blog';
  };

  const currentYear = new Date().getFullYear();
  
  // ✅ Generate JSON-LD Structured Data for SEO
  const jsonLd = generateJsonLd({
    type: 'WebPage',
    title: `Educational Blog ${currentYear} - Study Tips & Career Guidance`,
    description: `Read ${blogs.length} educational articles for Pakistani students`,
    url: 'https://www.nextid.pk/blog',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' },
    ],
  });
  
  // ✅ ItemList Schema for blog listing
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Educational Blog Posts ${currentYear}`,
    "description": `List of ${blogs.length} educational articles for Pakistani students`,
    "numberOfItems": blogs.length,
    "url": "https://www.nextid.pk/blog",
    "itemListElement": blogs.slice(0, 10).map((blog, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.nextid.pk/blog/${blog.slug}`,
      "name": blog.title
    }))
  };

  return (
    <>
      {/* ✅ JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR - Filters */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24 border border-gray-100">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              Filter Posts
            </h2>
            
            {/* Search */}
            <div className="mb-6">
              <form action="/blog" method="GET" className="relative">
                <input 
                  type="text" 
                  name="q" 
                  defaultValue={filters.q} 
                  placeholder="Search blog posts..." 
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Categories</h3>
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
            </div>

            {/* Categories from Stats */}
            {stats.categories.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Popular Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.categories.slice(0, 10).map(cat => (
                    <Link
                      key={cat.name}
                      href={buildUrl('category', cat.name.toLowerCase().replace(/ /g, '-'))}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-indigo-100 hover:text-indigo-600 transition"
                    >
                      {cat.name} ({cat.count})
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {(filters.category || filters.tag || filters.q) && (
              <Link 
                href="/blog" 
                className="block text-center text-sm text-indigo-600 hover:text-indigo-700 mt-4 pt-3 border-t border-gray-100"
              >
                Clear all filters
              </Link>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1">
          
          {/* Stats Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                {blogs.length} Articles Found
              </h2>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {stats.featured} Featured</span>
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {stats.popular} Popular</span>
                <span className="flex items-center gap-1">👁️ {blogs.reduce((sum, b) => sum + b.viewCount, 0).toLocaleString()} views</span>
              </div>
            </div>
            {filters.category && (
              <p className="text-sm text-gray-500 mt-2">Category: {BLOG_CATEGORIES.find(c => c.slug === filters.category)?.name}</p>
            )}
          </div>

          {/* Featured Hero Blog */}
          {heroBlog && (
            <div className="mb-8">
              <Link href={`/blog/${heroBlog.slug}`} className="group">
                <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="relative h-64 overflow-hidden">
                      {heroBlog.featuredImage ? (
                        <Image
                          src={heroBlog.featuredImage}
                          alt={heroBlog.title}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-indigo-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">
                          {heroBlog.category}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getReadTime(heroBlog.content)} min read
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-800 group-hover:text-indigo-600 transition mb-3 line-clamp-2">
                        {heroBlog.title}
                      </h2>
                      <p className="text-gray-600 line-clamp-2 mb-4">
                        {heroBlog.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {heroBlog.authorName || 'NextID Team'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(heroBlog.publishedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {heroBlog.viewCount.toLocaleString()} views
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Featured Blogs Grid */}
          {featuredBlogs.length > 1 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                Featured Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {featuredBlogs.slice(1, 4).map((blog) => (
                  <Link key={blog.id} href={`/blog/${blog.slug}`} className="group">
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 h-full">
                      <div className="relative h-40 overflow-hidden bg-gray-100">
                        {blog.featuredImage ? (
                          <Image
                            src={blog.featuredImage}
                            alt={blog.title}
                            fill
                            className="object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-indigo-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {blog.category}
                        </span>
                        <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition mt-2 line-clamp-2">
                          {blog.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getReadTime(blog.content)} min read
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {blog.viewCount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Regular Blogs List */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Latest Articles
            </h2>
            <div className="space-y-4">
              {regularBlogs.length > 0 ? (
                regularBlogs.map((blog) => (
                  <article key={blog.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden group">
                    <Link href={`/blog/${blog.slug}`}>
                      <div className="p-5">
                        <div className="flex gap-4">
                          {/* Thumbnail */}
                          <div className="flex-shrink-0 w-24 h-24 overflow-hidden rounded-lg bg-gray-100">
                            {blog.featuredImage ? (
                              <Image
                                src={blog.featuredImage}
                                alt={blog.title}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-indigo-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                {blog.category}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {getReadTime(blog.content)} min read
                              </span>
                              {blog.isPopular && (
                                <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Heart className="w-3 h-3" /> Popular
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition line-clamp-2">
                              {blog.title}
                            </h3>
                            <p className="text-gray-500 text-sm mt-1 line-clamp-1">
                              {blog.excerpt}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {blog.authorName || 'NextID Team'}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(blog.publishedAt)}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {blog.viewCount.toLocaleString()} views
                              </span>
                            </div>
                          </div>
                          
                          <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>
                      </div>
                    </Link>
                  </article>
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Articles Found</h3>
                  <p className="text-gray-500">Try adjusting your filters to see more results</p>
                  <Link href="/blog" className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                    View All Articles
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* RIGHT SIDEBAR - Widgets */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            
            {/* Most Popular Posts */}
            {popularBlogs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <Heart className="w-4 h-4 text-red-500" />
                  <h3 className="font-bold text-gray-800">Most Popular</h3>
                </div>
                <div className="space-y-3">
                  {popularBlogs.map((blog, idx) => (
                    <Link key={idx} href={`/blog/${blog.slug}`} className="flex gap-3 group items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-md flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-gray-700 group-hover:text-indigo-600 transition line-clamp-2 flex-1">
                        {blog.title}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Sidebar Widgets */}
            <SidebarWidgets />
          </div>
        </aside>
        
      </div>
    </>
  );
}

// ============ MAIN PAGE ============
export default async function BlogPage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const currentYear = new Date().getFullYear();
  
  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-3xl text-center mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Educational Blog {currentYear}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Education <span className="text-yellow-300">Blog</span>
            </h1>
            <p className="text-lg text-indigo-100">
              Study tips, exam preparation, career guidance, and success stories for Pakistani students
            </p>
            
            {/* Hero Search */}
            <div className="max-w-2xl mx-auto mt-8">
              <form action="/blog" method="GET" className="relative">
                <input 
                  type="text" 
                  name="q" 
                  placeholder="Search articles by title, topic, or author..." 
                  className="w-full pl-12 pr-32 py-4 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-yellow-400/50 shadow-lg" 
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button 
                  type="submit" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition"
                >
                  Search
                </button>
              </form>
            </div>
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