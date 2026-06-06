// app/(public)/blog/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import React from 'react';
import { postService } from '@/services/post/post.service';
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
  Tag
} from 'lucide-react';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';
import { generateJsonLd } from '@/lib/seo';

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
  // SEO Fields from posts table
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

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

function getSeoField<T>(obj: Record<string, unknown>, key: string): T | null {
  const value = obj[key];
  return value !== undefined && value !== null ? (value as T) : null;
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

// ============ DATA FETCHING ============
async function getBlogBySlug(slug: string): Promise<BlogDetail | null> {
  try {
    const post = await postService.getPost(slug);
    
    if (!post || post.type !== 'blog') {
      return null;
    }
    
    const meta = post.meta || {};
    const seoPost = post as unknown as Record<string, unknown>;
    
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
      // ✅ SEO Fields from posts table
      metaTitle: getSeoField<string>(seoPost, 'metaTitle'),
      metaDescription: getSeoField<string>(seoPost, 'metaDescription'),
      metaKeywords: getSeoField<string>(seoPost, 'metaKeywords'),
      canonicalUrl: getSeoField<string>(seoPost, 'canonicalUrl'),
      robots: getSeoField<string>(seoPost, 'robots'),
      ogTitle: getSeoField<string>(seoPost, 'ogTitle'),
      ogDescription: getSeoField<string>(seoPost, 'ogDescription'),
      ogImage: getSeoField<string>(seoPost, 'ogImage') || getSeoField<string>(seoPost, 'featuredImage'),
      twitterTitle: getSeoField<string>(seoPost, 'twitterTitle'),
      twitterDescription: getSeoField<string>(seoPost, 'twitterDescription'),
    };
  } catch (error) {
    console.error('Error fetching blog detail:', error);
    return null;
  }
}

async function getRelatedBlogs(currentId: number, category: string): Promise<RelatedBlog[]> {
  try {
    const allBlogs = await postService.getPostsByType('blog', 20);
    
    return allBlogs
      .filter(post => {
        const postCategory = getMetaValue(post.meta || {}, 'category', 'General');
        return post.id !== currentId && postCategory === category;
      })
      .slice(0, 4)
      .map(post => {
        const meta = post.meta || {};
        return {
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          featuredImage: post.featuredImage,
          publishedAt: post.publishedAt,
          category: getMetaValue(meta, 'category', 'General'),
        };
      });
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    return [];
  }
}

// ============ METADATA ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return {
      title: 'Article Not Found | NextID.pk',
      description: 'The requested article could not be found.',
      robots: { index: false },
    };
  }

  // ✅ Use SEO data from database
  const seoTitle = blog.metaTitle || `${blog.title} | Educational Blog | NextID.pk`;
  const seoDescription = blog.metaDescription || blog.excerpt || `Read ${blog.title}. ${blog.category} article for Pakistani students.`;
  const seoKeywords = blog.metaKeywords || `${blog.title}, ${blog.category}, education blog, study tips, Pakistan education`;
  const canonicalUrl = blog.canonicalUrl || `https://www.nextid.pk/blog/${blog.slug}`;
  const robots = blog.robots || 'index, follow';
  
  const robotsObj = {
    index: robots.includes('index'),
    follow: robots.includes('follow'),
  };
  
  const ogTitle = blog.ogTitle || seoTitle;
  const ogDescription = blog.ogDescription || seoDescription;
  const ogImage = blog.ogImage || blog.featuredImage || '/og-image.png';
  
  const twitterTitle = blog.twitterTitle || ogTitle;
  const twitterDescription = blog.twitterDescription || ogDescription;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    metadataBase: new URL('https://www.nextid.pk'),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: robotsObj,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      siteName: 'NextID.pk',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
      locale: 'en_PK',
      type: 'article',
      publishedTime: blog.publishedAt?.toISOString(),
      modifiedTime: blog.updatedAt?.toISOString(),
      authors: blog.authorName ? [blog.authorName] : undefined,
      tags: blog.tags || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: twitterTitle,
      description: twitterDescription,
      images: [ogImage],
      site: '@nextidpk',
      creator: '@nextidpk',
    },
  };
}

// ============ SHARE BUTTONS COMPONENT ============
function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `https://www.nextid.pk/blog/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  
  return (
    <div className="flex gap-2">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-8 h-8 bg-black hover:bg-gray-800 text-white rounded-lg flex items-center justify-center transition"
      >
        <Twitter className="w-4 h-4" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-8 h-8 bg-blue-700 hover:bg-blue-800 text-white rounded-lg flex items-center justify-center transition"
      >
        <Facebook className="w-4 h-4" />
      </a>
      <a
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition"
      >
        <Linkedin className="w-4 h-4" />
      </a>
      <a
        href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
        className="w-8 h-8 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center transition"
      >
        <Mail className="w-4 h-4" />
      </a>
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

// ============ BLOG CONTENT COMPONENT ============
function BlogContent({ blogPromise }: { blogPromise: Promise<BlogDetail | null> }) {
  const blog = React.use(blogPromise);
  const [relatedBlogs, setRelatedBlogs] = React.useState<RelatedBlog[]>([]);
  
  React.useEffect(() => {
    if (!blog) return;
    getRelatedBlogs(blog.id, blog.category).then(setRelatedBlogs);
  }, [blog]);

  if (!blog) return null;
  
  const readTime = getReadTime(blog.content);

  // ✅ Generate JSON-LD Structured Data for SEO
  const jsonLd = generateJsonLd({
    type: 'Article',
    title: blog.title,
    description: blog.excerpt || `Read ${blog.title} - ${blog.category} article`,
    url: `https://www.nextid.pk/blog/${blog.slug}`,
    image: blog.featuredImage || undefined,
    datePublished: blog.publishedAt?.toISOString(),
    dateModified: blog.updatedAt?.toISOString(),
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' },
      { name: blog.title, url: `/blog/${blog.slug}` },
    ],
  });

  return (
    <>
      {/* ✅ JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <main className="min-h-screen bg-gray-50">
        
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              
              {/* Back Button */}
              <Link 
                href="/blog" 
                className="inline-flex items-center gap-1 text-indigo-200 hover:text-white transition mb-6 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
                Back to Blog
              </Link>
              
              {/* Category Badge */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  <BookOpen className="w-3 h-3" />
                  {blog.category}
                </span>
                {blog.isFeatured && (
                  <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs px-3 py-1 rounded-full">
                    ⭐ Featured
                  </span>
                )}
                {blog.isPopular && (
                  <span className="inline-flex items-center gap-1 bg-yellow-500 text-white text-xs px-3 py-1 rounded-full">
                    <Heart className="w-3 h-3" /> Popular
                  </span>
                )}
              </div>
              
              {/* Title - H1 for SEO */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {blog.title}
              </h1>
              
              {/* Meta Info */}
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
            
            {/* Main Article */}
            <article className="lg:w-2/3">
              
              {/* Featured Image */}
              {blog.featuredImage && (
                <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg aspect-video">
                  <Image
                    src={blog.featuredImage}
                    alt={blog.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}

              {/* Excerpt */}
              {blog.excerpt && (
                <div className="bg-indigo-50 border-l-4 border-indigo-600 p-5 mb-8 rounded-r-lg">
                  <p className="text-gray-800 font-medium leading-relaxed italic">
                    {blog.excerpt}
                  </p>
                </div>
              )}

              {/* Content */}
              <div 
                className="prose prose-lg max-w-none 
                  prose-headings:text-gray-900 prose-headings:font-bold 
                  prose-p:text-gray-700 prose-p:leading-relaxed 
                  prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-li:text-gray-700
                  prose-img:rounded-lg prose-img:shadow-md"
                dangerouslySetInnerHTML={{ __html: blog.content || '' }}
              />

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="border-t border-gray-200 mt-8 pt-6">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 font-medium">Tags:</span>
                    <div className="flex flex-wrap gap-2">
                      {blog.tags.map((tag, idx) => (
                        <Link 
                          key={idx}
                          href={`/blog?tag=${encodeURIComponent(tag)}`} 
                          className="text-sm text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Share Section */}
              <div className="bg-gray-50 rounded-xl p-5 mt-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {blog.authorName ? blog.authorName.charAt(0).toUpperCase() : 'N'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{blog.authorName || 'NextID Team'}</p>
                      <p className="text-xs text-gray-500">Author</p>
                    </div>
                  </div>
                  <ShareButtons title={blog.title} slug={blog.slug} />
                </div>
              </div>
            </article>

            {/* Right Sidebar */}
            <aside className="lg:w-1/3">
              <div className="sticky top-24 space-y-6">
                
                {/* Sidebar Widgets */}
                <SidebarWidgets />
                
                {/* Related Articles */}
                {relatedBlogs.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-bold text-gray-800">Related Articles</h3>
                    </div>
                    <div className="space-y-4">
                      {relatedBlogs.map((item) => (
                        <Link key={item.id} href={`/blog/${item.slug}`} className="flex gap-3 group">
                          {item.featuredImage ? (
                            <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg">
                              <Image 
                                src={item.featuredImage} 
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-105 transition duration-300"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
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