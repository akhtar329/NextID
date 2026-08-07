// app/(public)/blog/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { postService } from '@/services/post/post.service';
import type { ExtendedPost } from '@/services/post/post.service';
import { 
  Calendar, 
  User, 
  Eye, 
  Clock,
  ChevronLeft,
  BookOpen,
  Heart,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Tag,
  List
} from 'lucide-react';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';
import { cacheTag, cacheLife } from 'next/cache';

// ============ TYPES ============
interface BlogWithComputed {
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
  updatedAt: Date | null;
  // Meta fields
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  // Computed values
  readTime: number;
  formattedDate: string;
  fullDate: string;
  headings: Heading[];
  sanitizedContent: string;
}

interface RelatedBlog {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: Date | null;
  category: string;
  formattedDate: string;
}

interface Heading {
  id: string;
  text: string;
  level: number;
}

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

// ✅ Safe date formatter
function formatDateStatic(date: Date | string | null): string {
  if (!date) return 'Recent';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'Recent';
  
  const now = new Date('2024-01-01T00:00:00.000Z');
  const diffMs = now.getTime() - dateObj.getTime();
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

function formatFullDateStatic(date: Date | string | null): string {
  if (!date) return 'TBA';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'TBA';
  
  return dateObj.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function getReadTime(content: string | null): number {
  if (!content) return 1;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / 200);
}

function extractHeadings(content: string | null): Heading[] {
  if (!content) return [];
  
  const headingRegex = /<h([2-3])[^>]*>(.*?)<\/h\1>/gi;
  const headings: Heading[] = [];
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    if (text) {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      headings.push({ id, text, level });
    }
  }
  
  return headings.slice(0, 8);
}

// ✅ Sanitize content - Add IDs to headings, convert H1 to H2
function sanitizeContent(html: string | null): string {
  if (!html) return '';
  
  let sanitized = html;
  
  // Convert H1 to H2 (since we already have H1 in hero)
  sanitized = sanitized
    .replace(/<h1[^>]*>/gi, '<h2>')
    .replace(/<\/h1>/gi, '</h2>');
  
  // Add IDs to H2 and H3
  sanitized = sanitized.replace(
    /<h([2-3])>(.*?)<\/h\1>/gi,
    (match, level, content) => {
      const text = content.replace(/<[^>]*>/g, '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<h${level} id="${id}">${content}</h${level}>`;
    }
  );
  
  // Remove empty paragraphs
  sanitized = sanitized.replace(/<p>\s*<\/p>/g, '');
  
  return sanitized;
}

// ✅ Safe toISOString helper
function toISOStringSafe(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return undefined;
  return dateObj.toISOString();
}

// ============ CACHED DATA FETCHING ============
async function getBlogBySlug(slug: string): Promise<BlogWithComputed | null> {
  "use cache";
  cacheTag(`blog-detail-${slug}`);
  cacheTag("posts-type-blog");
  cacheLife("hours");
  
  try {
    const post = await postService.getDetail(slug);
    
    if (!post || post.type !== 'blog') {
      return null;
    }
    
    const meta = post.meta || {};
    const content = post.content || '';
    const readTime = getReadTime(content);
    const headings = extractHeadings(content);
    const sanitizedContent = sanitizeContent(content);
    
    // ✅ Convert dates to Date objects
    const publishedAt = post.publishedAt ? new Date(post.publishedAt) : null;
    const createdAt = post.createdAt ? new Date(post.createdAt) : null;
    const updatedAt = post.updatedAt ? new Date(post.updatedAt) : null;
    
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
      publishedAt: publishedAt,
      createdAt: createdAt,
      updatedAt: updatedAt,
      // Meta fields
      metaTitle: getMetaValue(meta, 'metaTitle', null),
      metaDescription: getMetaValue(meta, 'metaDescription', null),
      metaKeywords: getMetaValue(meta, 'metaKeywords', null),
      canonicalUrl: getMetaValue(meta, 'canonicalUrl', null),
      robots: getMetaValue(meta, 'robots', null),
      ogTitle: getMetaValue(meta, 'ogTitle', null),
      ogDescription: getMetaValue(meta, 'ogDescription', null),
      ogImage: getMetaValue(meta, 'ogImage', null),
      twitterTitle: getMetaValue(meta, 'twitterTitle', null),
      twitterDescription: getMetaValue(meta, 'twitterDescription', null),
      // Computed values
      readTime,
      formattedDate: formatDateStatic(post.publishedAt),
      fullDate: formatFullDateStatic(post.publishedAt),
      headings,
      sanitizedContent,
    };
  } catch (error) {
    console.error('Error fetching blog detail:', error);
    return null;
  }
}

async function getAllBlogs(): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("blogs-all");
  cacheTag("posts-type-blog");
  cacheLife("hours");
  
  try {
    const blogs = await postService.getList('blog', 500);
    return blogs || [];
  } catch (error) {
    console.error('Error fetching all blogs:', error);
    return [];
  }
}

async function getRelatedBlogs(currentId: number, category: string): Promise<RelatedBlog[]> {
  "use cache";
  cacheTag(`blog-related-${currentId}`);
  cacheTag("blog-related");
  cacheTag("posts-type-blog");
  cacheLife("days");
  
  try {
    const allBlogs = await getAllBlogs();
    
    if (!allBlogs || !Array.isArray(allBlogs)) {
      return [];
    }
    
    // Filter by category and exclude current
    const filtered = allBlogs.filter(blog => 
      blog && blog.id && blog.id !== currentId
    );
    
    // Prefer same category
    const sameCategory = filtered.filter(blog => {
      const meta = blog.meta || {};
      return getMetaValue(meta, 'category', 'General') === category;
    });
    
    const otherCategory = filtered.filter(blog => {
      const meta = blog.meta || {};
      return getMetaValue(meta, 'category', 'General') !== category;
    });
    
    // Combine: same category first, then others
    const sorted = [...sameCategory, ...otherCategory];
    
    return sorted.slice(0, 3).map(blog => {
      const meta = blog.meta || {};
      return {
        id: blog.id,
        slug: blog.slug,
        title: blog.title || 'Untitled',
        excerpt: blog.excerpt,
        featuredImage: blog.featuredImage,
        publishedAt: blog.publishedAt,
        category: getMetaValue(meta, 'category', 'General'),
        formattedDate: formatFullDateStatic(blog.publishedAt),
      };
    });
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    return [];
  }
}

// ============ GENERATE STATIC PARAMS ============
export async function generateStaticParams() {
  try {
    const posts = await postService.getList('blog', 10);
    
    if (posts && posts.length > 0) {
      return posts.map((post) => ({
        slug: post.slug,
      }));
    }
    
    return [{ slug: 'placeholder' }];
    
  } catch (error) {
    console.error('Error generating static params for blogs:', error);
    return [{ slug: 'placeholder' }];
  }
}

// ============ METADATA ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  if (slug === 'placeholder') {
    return {
      title: 'Article Not Found | NextID.pk',
      description: 'The requested article could not be found.',
      robots: { index: false },
    };
  }
  
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return {
      title: 'Article Not Found | NextID.pk',
      description: 'The requested article could not be found.',
      robots: { index: false },
    };
  }

  const seoTitle = blog.metaTitle || `${blog.title} | ${blog.category} Guide | NextID.pk`;
  const seoDescription = blog.metaDescription || 
    blog.excerpt || 
    `${blog.title}. ${blog.category} article for Pakistani students. Read time: ${blog.readTime} min.`;
  
  const canonicalUrl = blog.canonicalUrl || `https://www.nextid.pk/blog/${blog.slug}`;
  const ogImage = blog.ogImage || blog.featuredImage || '/og-image.png';
  const robots = blog.robots || 'index, follow';

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: blog.metaKeywords || undefined,
    robots: robots,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-US': canonicalUrl,
      },
    },
    publisher: 'NextID.pk',
    authors: [{ name: blog.authorName || 'NextID Team' }],
    openGraph: {
      title: blog.ogTitle || seoTitle,
      description: blog.ogDescription || seoDescription,
      url: canonicalUrl,
      siteName: 'NextID.pk',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: toISOStringSafe(blog.publishedAt),
      modifiedTime: toISOStringSafe(blog.updatedAt),
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.twitterTitle || seoTitle,
      description: blog.twitterDescription || seoDescription,
      images: [ogImage],
    },
  };
}

// ============ SCHEMA: BREADCRUMB ============
function BreadcrumbSchema({ blog }: { blog: BlogWithComputed }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.nextid.pk/" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.nextid.pk/blog" },
      { "@type": "ListItem", "position": 3, "name": blog.title, "item": `https://www.nextid.pk/blog/${blog.slug}` }
    ]
  };
  
  return (
    <script 
      type="application/ld+json" 
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} 
    />
  );
}

// ============ SHARE BUTTONS ============
function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `https://www.nextid.pk/blog/${slug}`;
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

// ============ TABLE OF CONTENTS ============
function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length === 0) return null;
  
  return (
    <div className="bg-gray-50 rounded-xl p-5 mb-8 border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <List className="w-4 h-4 text-indigo-600" />
        <h2 className="font-bold text-gray-800 text-sm uppercase">Table of Contents</h2>
      </div>
      <ul className="space-y-2">
        {headings.map((heading, idx) => (
          <li key={idx} className={heading.level === 2 ? 'ml-0' : 'ml-4'}>
            <a href={`#${heading.id}`} className="text-sm text-gray-600 hover:text-indigo-600 flex items-center gap-2 transition">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============ LOADING COMPONENT ============
function BlogLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading article...</p>
      </div>
    </div>
  );
}

// ============ BLOG CONTENT COMPONENT (SERVER) ============
async function BlogContent({ blogPromise }: { blogPromise: Promise<BlogWithComputed | null> }) {
  const blog = await blogPromise;
  
  if (!blog) return null;
  
  const relatedBlogs = await getRelatedBlogs(blog.id, blog.category);
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "description": blog.excerpt || `${blog.title}. Read time: ${blog.readTime} minutes.`,
    "url": `https://www.nextid.pk/blog/${blog.slug}`,
    "datePublished": toISOStringSafe(blog.publishedAt),
    "dateModified": toISOStringSafe(blog.updatedAt),
    "author": {
      "@type": "Person",
      "name": blog.authorName || "NextID Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "NextID.pk"
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BreadcrumbSchema blog={blog} />
      
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              <Link href="/blog" className="inline-flex items-center gap-1 text-indigo-200 hover:text-white transition mb-6 group">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
                Back to Blog
              </Link>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Link href={`/blog?category=${encodeURIComponent(blog.category)}`}
                  className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm hover:bg-white/30 transition">
                  <BookOpen className="w-3 h-3" />
                  {blog.category}
                </Link>
                {blog.isFeatured && (
                  <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs px-3 py-1 rounded-full">⭐ Featured</span>
                )}
                {blog.isPopular && (
                  <span className="inline-flex items-center gap-1 bg-yellow-500 text-white text-xs px-3 py-1 rounded-full">
                    <Heart className="w-3 h-3" /> Popular
                  </span>
                )}
              </div>
              
              {/* ✅ ONLY H1 on the page */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{blog.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-indigo-200">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {blog.authorName || 'NextID Team'}
                </span>
                <span className="w-1 h-1 bg-indigo-300 rounded-full"></span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {blog.formattedDate}
                </span>
                <span className="w-1 h-1 bg-indigo-300 rounded-full"></span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {blog.readTime} min read
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {blog.viewCount.toLocaleString()} views
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
            
            <article className="lg:w-2/3">
              {/* Featured Image with Fallback */}
              <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg aspect-video bg-gradient-to-br from-indigo-100 to-purple-100">
                {blog.featuredImage ? (
                  <Image 
                    src={blog.featuredImage} 
                    alt={blog.title} 
                    fill 
                    className="object-cover" 
                    priority 
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full bg-white/80 shadow-lg flex items-center justify-center mx-auto mb-3">
                        <BookOpen className="w-10 h-10 text-indigo-600" />
                      </div>
                      <p className="text-gray-600 font-medium">{blog.category}</p>
                      <p className="text-gray-400 text-sm">Article</p>
                    </div>
                  </div>
                )}
              </div>

              <TableOfContents headings={blog.headings} />

              {blog.excerpt && (
                <div className="bg-indigo-50 border-l-4 border-indigo-600 p-5 mb-8 rounded-r-lg">
                  <p className="text-gray-800 font-medium">📌 <span className="font-bold">In this article:</span> {blog.excerpt}</p>
                </div>
              )}

              {/* Content with sanitized headings (H1 → H2) */}
              <div 
                className="prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-a:text-indigo-600
                  prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3
                  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-li:text-gray-700 prose-li:mb-1
                  prose-ul:my-3 prose-ol:my-3
                  prose-img:rounded-lg prose-img:shadow-md"
                dangerouslySetInnerHTML={{ 
                  __html: blog.sanitizedContent 
                }}
              />

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="border-t border-gray-200 mt-8 pt-6">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 font-medium">Tags:</span>
                    {blog.tags.map((tag, idx) => (
                      <Link key={idx} href={`/blog?tag=${encodeURIComponent(tag)}`}
                        className="text-sm text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition">
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Author & Share */}
              <div className="bg-gray-50 rounded-xl p-5 mt-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {blog.authorName ? getInitials(blog.authorName) : 'NT'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{blog.authorName || 'NextID Team'}</p>
                      <p className="text-xs text-gray-500">Education Author</p>
                    </div>
                  </div>
                  <ShareButtons title={blog.title} slug={blog.slug} />
                </div>
              </div>
              
              {/* Article Footer */}
              <div className="text-xs text-gray-400 mt-4 text-center">
                Last updated: {blog.fullDate}
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:w-1/3">
              <div className="sticky top-24 space-y-6">
                
                {/* Quick Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Article Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category</span>
                      <span className="font-medium text-gray-800">{blog.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Read Time</span>
                      <span className="font-medium text-gray-800">{blog.readTime} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Views</span>
                      <span className="font-medium text-gray-800">{blog.viewCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Published</span>
                      <span className="font-medium text-gray-800">{blog.fullDate}</span>
                    </div>
                  </div>
                </div>
                
                {/* Related Blogs */}
                {relatedBlogs.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5" data-nosnippet>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-bold text-gray-800">You May Also Like</h3>
                    </div>
                    <div className="space-y-4">
                      {relatedBlogs.map((item) => (
                        <Link key={item.id} href={`/blog/${item.slug}`} className="flex gap-3 group" rel="nofollow">
                          <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100">
                            {item.featuredImage ? (
                              <Image src={item.featuredImage} alt={item.title} fill className="object-cover group-hover:scale-105 transition" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-indigo-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="text-xs text-indigo-600">{item.category}</span>
                            <h4 className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition line-clamp-2">
                              {item.title}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">{item.formattedDate}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Sidebar Widgets */}
                <div data-nosnippet>
                  <Suspense fallback={<div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-64"></div>}>
                    <SidebarWidgets />
                  </Suspense>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

// ============ MAIN PAGE ============
export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  if (slug === 'placeholder') {
    notFound();
  }
  
  const blogPromise = getBlogBySlug(slug);
  
  return (
    <Suspense fallback={<BlogLoading />}>
      <BlogContent blogPromise={blogPromise} />
    </Suspense>
  );
}
