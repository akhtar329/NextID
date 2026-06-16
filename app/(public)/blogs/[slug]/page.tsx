// app/(public)/blog/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import React from 'react';
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
interface BlogDetail {
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
}

interface RelatedBlog {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: Date | null;
  category: string;
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

function formatFullDate(date: Date | null): string {
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-PK', {
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

// ============ SHARE BUTTONS ============
function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `https://www.nextid.pk/blog/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  
  return (
    <div className="flex gap-2">
      <a href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer nofollow"
        className="w-8 h-8 bg-black hover:bg-gray-800 text-white rounded-lg flex items-center justify-center">
        <Twitter className="w-4 h-4" />
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer nofollow"
        className="w-8 h-8 bg-blue-700 hover:bg-blue-800 text-white rounded-lg flex items-center justify-center">
        <Facebook className="w-4 h-4" />
      </a>
      <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer nofollow"
        className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center">
        <Linkedin className="w-4 h-4" />
      </a>
      <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
        className="w-8 h-8 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center">
        <Mail className="w-4 h-4" />
      </a>
    </div>
  );
}

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
            <a href={`#${heading.id}`} className="text-sm text-gray-600 hover:text-indigo-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

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

// ============ CACHED DATA FETCHING ============
async function getBlogBySlug(slug: string): Promise<BlogDetail | null> {
  "use cache";
  cacheTag(`blog-detail-${slug}`);
  cacheLife("hours");
  
  try {
    const post = await postService.getDetail(slug);
    
    if (!post || post.type !== 'blog') {
      return null;
    }
    
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
      updatedAt: post.updatedAt,
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
    };
  } catch (error) {
    console.error('Error fetching blog detail:', error);
    return null;
  }
}

async function getAllBlogs(): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("blogs-all");
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
  cacheLife("hours");
  
  try {
    const allBlogs = await getAllBlogs();
    
    if (!allBlogs || !Array.isArray(allBlogs)) {
      return [];
    }
    
    return allBlogs
      .filter(blog => blog && blog.id && blog.id !== currentId)
      .slice(0, 3)
      .map(blog => {
        const meta = blog.meta || {};
        return {
          id: blog.id,
          slug: blog.slug,
          title: blog.title || 'Untitled',
          excerpt: blog.excerpt,
          featuredImage: blog.featuredImage,
          publishedAt: blog.publishedAt,
          category: getMetaValue(meta, 'category', 'General'),
        };
      });
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    return [];
  }
}

// ============ GENERATE STATIC PARAMS (FIXED) ============
export async function generateStaticParams() {
  try {
    const posts = await postService.getList('blog', 100);
    
    if (posts && posts.length > 0) {
      return posts.map((post) => ({
        slug: post.slug,
      }));
    }
    
    // ✅ Return placeholder for build validation
    return [{ slug: 'placeholder' }];
    
  } catch (error) {
    console.error('Error generating static params for blogs:', error);
    return [{ slug: 'placeholder' }];
  }
}

// ============ METADATA ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  // ✅ Handle placeholder
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

  const readTime = getReadTime(blog.content);
  const seoTitle = blog.metaTitle || `${blog.title} | ${blog.category} Guide | NextID.pk`;
  const seoDescription = blog.metaDescription || 
    blog.excerpt || 
    `${blog.title}. ${blog.category} article for Pakistani students. Read time: ${readTime} min.`;
  
  const canonicalUrl = blog.canonicalUrl || `https://www.nextid.pk/blog/${blog.slug}`;
  const ogImage = blog.ogImage || blog.featuredImage || '/og-image.png';

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      siteName: 'NextID.pk',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: blog.publishedAt?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [ogImage],
    },
  };
}

// ============ BLOG CONTENT COMPONENT ============
function BlogContent({ blogPromise }: { blogPromise: Promise<BlogDetail | null> }) {
  const blog = React.use(blogPromise);
  const [relatedBlogs, setRelatedBlogs] = React.useState<RelatedBlog[]>([]);
  const [loadingRelated, setLoadingRelated] = React.useState(true);
  
  React.useEffect(() => {
    if (!blog) return;
    getRelatedBlogs(blog.id, blog.category).then(blogs => {
      setRelatedBlogs(blogs);
      setLoadingRelated(false);
    });
  }, [blog]);

  if (!blog) return null;
  
  const readTime = getReadTime(blog.content);
  const headings = extractHeadings(blog.content);
  const metaDescriptionText = blog.excerpt || `Read ${blog.title}. Read time: ${readTime} minutes.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "description": blog.excerpt || metaDescriptionText,
    "url": `https://www.nextid.pk/blog/${blog.slug}`,
    "datePublished": blog.publishedAt?.toISOString(),
    "dateModified": blog.updatedAt?.toISOString(),
    "author": {
      "@type": "Person",
      "name": blog.authorName || "NextID Team"
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
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
                  className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
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
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{blog.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-indigo-200">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {blog.authorName || 'NextID Team'}
                </span>
                <span className="w-1 h-1 bg-indigo-300 rounded-full"></span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(blog.publishedAt)}
                </span>
                <span className="w-1 h-1 bg-indigo-300 rounded-full"></span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {readTime} min read
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
              {blog.featuredImage && (
                <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg aspect-video">
                  <Image src={blog.featuredImage} alt={blog.title} fill className="object-cover" priority />
                </div>
              )}

              <TableOfContents headings={headings} />

              {blog.excerpt && (
                <div className="bg-indigo-50 border-l-4 border-indigo-600 p-5 mb-8 rounded-r-lg">
                  <p className="text-gray-800 font-medium">📌 <span className="font-bold">In this article:</span> {blog.excerpt}</p>
                </div>
              )}

              <div 
                className="prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-a:text-indigo-600"
                dangerouslySetInnerHTML={{ 
                  __html: blog.content ? blog.content.replace(
                    /<h([2-3])>(.*?)<\/h\1>/gi,
                    (match, level, content) => {
                      const text = content.replace(/<[^>]*>/g, '');
                      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      return `<h${level} id="${id}">${content}</h${level}>`;
                    }
                  ) : '' 
                }}
              />

              {blog.tags && blog.tags.length > 0 && (
                <div className="border-t border-gray-200 mt-8 pt-6">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 font-medium">Tags:</span>
                    {blog.tags.map((tag, idx) => (
                      <Link key={idx} href={`/blog?tag=${encodeURIComponent(tag)}`}
                        className="text-sm text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-5 mt-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {blog.authorName ? blog.authorName.charAt(0).toUpperCase() : 'N'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{blog.authorName || 'NextID Team'}</p>
                      <p className="text-xs text-gray-500">Education Author</p>
                    </div>
                  </div>
                  <ShareButtons title={blog.title} slug={blog.slug} />
                </div>
              </div>
            </article>

            <aside className="lg:w-1/3">
              <div className="sticky top-24 space-y-6">
                <div data-nosnippet>
                  <Suspense fallback={<div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-64"></div>}>
                    <SidebarWidgets />
                  </Suspense>
                </div>
                
                {!loadingRelated && relatedBlogs.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5" data-nosnippet>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-bold text-gray-800">You May Also Like</h3>
                    </div>
                    <div className="space-y-4">
                      {relatedBlogs.map((item) => (
                        <Link key={item.id} href={`/blog/${item.slug}`} className="flex gap-3 group" rel="nofollow">
                          {item.featuredImage ? (
                            <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg">
                              <Image src={item.featuredImage} alt={item.title} fill className="object-cover group-hover:scale-105 transition" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <span className="text-xs text-indigo-600">{item.category}</span>
                            <h4 className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition line-clamp-2">
                              {item.title}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">{formatFullDate(item.publishedAt)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
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
  const slugPromise = params.then(p => p.slug);
  
  const blogPromise = slugPromise.then(async (slug) => {
    // ✅ Handle placeholder
    if (slug === 'placeholder') {
      notFound();
    }
    
    const blog = await getBlogBySlug(slug);
    if (!blog) notFound();
    return blog;
  });
  
  return (
    <Suspense fallback={<BlogLoading />}>
      <BlogContent blogPromise={blogPromise} />
    </Suspense>
  );
}