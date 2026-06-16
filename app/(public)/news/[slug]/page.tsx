// app/(public)/news/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import React from 'react';
import { postService } from '@/services/post/post.service';
import type { ExtendedPost } from '@/services/post/post.service';
import { 
  Calendar, 
  User, 
  Clock, 
  Eye, 
  ChevronLeft,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  TrendingUp,
  Zap
} from 'lucide-react';
import { cacheTag, cacheLife } from 'next/cache';

// ============ TYPES ============
interface NewsDetail {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  source: string | null;
  authorName: string | null;
  isFeatured: boolean;
  isBreaking: boolean;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date | null;
  category: string;
  tags: string[] | null;
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
  updatedAt: Date | null;
}

interface RelatedNews {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: Date | null;
  isBreaking: boolean;
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
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatShortDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatViews(views: number): string {
  if (!views) return '0';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
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
  
  return headings.slice(0, 6);
}

// ============ SHARE BUTTONS COMPONENT ============
function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `https://www.nextid.pk/news/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  
  return (
    <div className="flex gap-2">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="w-8 h-8 bg-black hover:bg-gray-800 text-white rounded-lg flex items-center justify-center transition"
        aria-label="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="w-8 h-8 bg-blue-700 hover:bg-blue-800 text-white rounded-lg flex items-center justify-center transition"
        aria-label="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
      </a>
      <a
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
      </a>
      <a
        href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
        className="w-8 h-8 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center transition"
        aria-label="Share via Email"
      >
        <Mail className="w-4 h-4" />
      </a>
    </div>
  );
}

function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length === 0) return null;
  
  return (
    <div className="bg-gray-50 rounded-xl p-5 mb-8 border border-gray-200" data-nosnippet>
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-red-600" />
        <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
          In This News
        </h2>
      </div>
      <ul className="space-y-2">
        {headings.map((heading, idx) => (
          <li key={idx} className={heading.level === 2 ? 'ml-0' : 'ml-4'}>
            <a
              href={`#${heading.id}`}
              className="text-sm text-gray-600 hover:text-red-600 transition flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============ GENERATE STATIC PARAMS (FIXED) ============
export async function generateStaticParams() {
  try {
    const posts = await postService.getList('news', 100);
    
    if (posts && posts.length > 0) {
      return posts.map((post) => ({
        slug: post.slug,
      }));
    }
    
    // Return placeholder for build validation
    return [{ slug: 'placeholder' }];
    
  } catch (error) {
    console.error('Error generating static params for news:', error);
    return [{ slug: 'placeholder' }];
  }
}

// ============ CACHED DATA FETCHING ============
async function getNewsBySlug(slug: string): Promise<NewsDetail | null> {
  "use cache";
  cacheTag(`news-detail-${slug}`);
  cacheLife("hours");
  
  try {
    const post = await postService.getDetail(slug);
    
    if (!post || post.type !== 'news') {
      return null;
    }
    
    const meta = post.meta || {};
    
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      source: getMetaValue(meta, 'source', null),
      authorName: getMetaValue(meta, 'authorName', null),
      isFeatured: getMetaValue(meta, 'isFeatured', false),
      isBreaking: getMetaValue(meta, 'isBreaking', false),
      viewCount: getMetaValue(meta, 'viewCount', 0),
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      category: getMetaValue(meta, 'category', 'General'),
      tags: getMetaValue(meta, 'tags', null),
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
      updatedAt: post.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching news detail:', error);
    return null;
  }
}

async function getAllNews(): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("news-all");
  cacheLife("hours");
  
  try {
    const news = await postService.getList('news', 500);
    return news || [];
  } catch (error) {
    console.error('Error fetching all news:', error);
    return [];
  }
}

async function getRelatedNews(currentId: number): Promise<RelatedNews[]> {
  "use cache";
  cacheTag(`news-related-${currentId}`);
  cacheLife("hours");
  
  try {
    const allNews = await getAllNews();
    
    if (!allNews || !Array.isArray(allNews)) {
      return [];
    }
    
    return allNews
      .filter(post => post && post.id && post.id !== currentId)
      .slice(0, 3)
      .map(post => {
        const meta = post.meta || {};
        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          featuredImage: post.featuredImage,
          publishedAt: post.publishedAt,
          isBreaking: getMetaValue(meta, 'isBreaking', false),
        };
      });
  } catch (error) {
    console.error('Error fetching related news:', error);
    return [];
  }
}

// ============ METADATA ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  // Handle placeholder
  if (slug === 'placeholder') {
    return {
      title: 'News Not Found | NextID.pk',
      description: 'The requested news article could not be found.',
      robots: { index: false },
    };
  }
  
  const newsItem = await getNewsBySlug(slug);

  if (!newsItem) {
    return {
      title: 'News Not Found | NextID.pk',
      description: 'The requested news article could not be found.',
      robots: { index: false },
    };
  }

  const breakingPrefix = newsItem.isBreaking ? '🔴 BREAKING: ' : '';
  const readTime = getReadTime(newsItem.content);
  
  const seoTitle = newsItem.metaTitle || 
    `${breakingPrefix}${newsItem.title} | ${newsItem.category} News | NextID.pk`;
  
  const seoDescription = newsItem.metaDescription || 
    `${newsItem.excerpt || `Latest ${newsItem.category} news: ${newsItem.title}`} Published on ${formatShortDate(newsItem.publishedAt)}. Read time: ${readTime} min.`;
  
  const canonicalUrl = newsItem.canonicalUrl || `https://www.nextid.pk/news/${newsItem.slug}`;
  const ogImage = newsItem.ogImage || newsItem.featuredImage || '/og-image.png';

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
      publishedTime: newsItem.publishedAt?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [ogImage],
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

// ============ NEWS CONTENT COMPONENT ============
async function NewsContent({ slug }: { slug: string }) {
  // Handle placeholder
  if (slug === 'placeholder') {
    notFound();
  }
  
  const newsItem = await getNewsBySlug(slug);
  
  if (!newsItem) {
    notFound();
  }
  
  const relatedNews = await getRelatedNews(newsItem.id);
  const readTime = getReadTime(newsItem.content);
  const headings = extractHeadings(newsItem.content);
  
  const metaDescriptionText = newsItem.excerpt || 
    `${newsItem.title}. ${newsItem.category} news update. Published on ${formatShortDate(newsItem.publishedAt)}. Read time: ${readTime} min.`;

  const newsArticleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": newsItem.title,
    "description": newsItem.excerpt || metaDescriptionText,
    "url": `https://www.nextid.pk/news/${newsItem.slug}`,
    "image": newsItem.featuredImage ? [newsItem.featuredImage] : [],
    "datePublished": newsItem.publishedAt?.toISOString(),
    "dateModified": newsItem.updatedAt?.toISOString(),
    "author": {
      "@type": "Person",
      "name": newsItem.authorName || "NextID Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "NextID.pk"
    },
    "articleSection": newsItem.category
  };
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.nextid.pk/" },
      { "@type": "ListItem", "position": 2, "name": "News", "item": "https://www.nextid.pk/news" },
      { "@type": "ListItem", "position": 3, "name": newsItem.title.substring(0, 50), "item": `https://www.nextid.pk/news/${newsItem.slug}` }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      
      <main className="min-h-screen bg-gray-50">
        
        {/* Hero Section */}
        <div className={`${newsItem.isBreaking ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-gray-800 to-gray-900'} text-white`}>
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              
              <Link 
                href="/news" 
                className="inline-flex items-center gap-1 text-white/70 hover:text-white transition mb-6 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
                Back to News
              </Link>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {newsItem.isBreaking && (
                  <span className="inline-flex items-center gap-1 bg-red-500 px-3 py-1 rounded-full text-xs font-medium">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    BREAKING NEWS
                  </span>
                )}
                {newsItem.isFeatured && (
                  <span className="inline-flex items-center gap-1 bg-amber-500 px-3 py-1 rounded-full text-xs font-medium">
                    <TrendingUp className="w-3 h-3" />
                    Featured
                  </span>
                )}
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                  {newsItem.category}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {newsItem.isBreaking && '🔴 '}{newsItem.title}
              </h1>
              
              <div className="hidden" aria-hidden="true">
                {metaDescriptionText}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {newsItem.authorName || 'NextID Team'}
                </span>
                <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(newsItem.publishedAt)}
                </span>
                <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {readTime} min read
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {formatViews(newsItem.viewCount)} views
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
            
            <article className="lg:w-2/3">
              
              {newsItem.featuredImage && (
                <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg aspect-video">
                  <img
                    src={newsItem.featuredImage}
                    alt={newsItem.title}
                    className="w-full h-full object-cover"
                  />
                  {newsItem.source && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      Source: {newsItem.source}
                    </div>
                  )}
                </div>
              )}

              <TableOfContents headings={headings} />

              {newsItem.excerpt && (
                <div className="bg-red-50 border-l-4 border-red-600 p-5 mb-8 rounded-r-lg">
                  <p className="text-gray-800 font-medium leading-relaxed">
                    📌 <span className="font-bold">TL;DR:</span> {newsItem.excerpt}
                  </p>
                </div>
              )}

              <div 
                className="prose prose-lg max-w-none 
                  prose-headings:text-gray-900 prose-headings:font-bold prose-headings:scroll-mt-24
                  prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                  prose-p:text-gray-700 prose-p:leading-relaxed 
                  prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-li:text-gray-700
                  prose-img:rounded-lg prose-img:shadow-md
                  prose-blockquote:border-l-red-600 prose-blockquote:bg-gray-50 prose-blockquote:p-4 prose-blockquote:italic"
                dangerouslySetInnerHTML={{ 
                  __html: newsItem.content ? newsItem.content.replace(
                    /<h([2-3])>(.*?)<\/h\1>/gi,
                    (match, level, content) => {
                      const text = content.replace(/<[^>]*>/g, '');
                      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      return `<h${level} id="${id}">${content}</h${level}>`;
                    }
                  ) : '' 
                }}
              />

              {newsItem.tags && newsItem.tags.length > 0 && (
                <div className="border-t border-gray-200 mt-8 pt-6">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-gray-500 font-medium">Tags:</span>
                    <div className="flex flex-wrap gap-2">
                      {newsItem.tags.map((tag, idx) => (
                        <Link 
                          key={idx}
                          href={`/news?tag=${encodeURIComponent(tag)}`} 
                          className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition"
                          rel="tag"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-5 mt-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {newsItem.authorName ? newsItem.authorName.charAt(0).toUpperCase() : 'N'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{newsItem.authorName || 'NextID Team'}</p>
                      <p className="text-xs text-gray-500">News Author</p>
                    </div>
                  </div>
                  <ShareButtons title={newsItem.title} slug={newsItem.slug} />
                </div>
              </div>
              
              <div className="bg-red-50 rounded-xl p-5 mt-6 border border-red-100">
                <p className="text-sm text-gray-700">
                  <span className="font-bold text-red-800">About {newsItem.authorName || 'NextID Team'}:</span>{' '}
                  {newsItem.authorName 
                    ? `${newsItem.authorName} provides authentic education news and updates for Pakistani students.` 
                    : 'NextID.pk delivers trusted education news, exam updates, and admission announcements for Pakistan.'}
                </p>
              </div>
            </article>

            <aside className="lg:w-1/3">
              <div className="sticky top-24 space-y-6">
                
                {relatedNews.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5" data-nosnippet>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <h3 className="font-bold text-gray-800">Related News</h3>
                    </div>
                    <div className="space-y-4">
                      {relatedNews.map((item) => (
                        <Link 
                          key={item.id} 
                          href={`/news/${item.slug}`} 
                          className="flex gap-3 group"
                          rel="nofollow"
                        >
                          {item.featuredImage ? (
                            <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                              <img 
                                src={item.featuredImage} 
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-2xl">📰</span>
                            </div>
                          )}
                          <div className="flex-1">
                            {item.isBreaking && (
                              <span className="inline-block text-xs text-red-600 font-semibold">NEW</span>
                            )}
                            <h4 className="text-sm font-medium text-gray-800 group-hover:text-red-600 transition line-clamp-2">
                              {item.title}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">{formatShortDate(item.publishedAt)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {newsItem.source && (
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200" data-nosnippet>
                    <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide">
                      News Source
                    </h3>
                    <p className="text-sm text-gray-600">
                      This news article is sourced from <span className="font-medium">{newsItem.source}</span>.
                      For more details, visit the official source.
                    </p>
                  </div>
                )}
                
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100" data-nosnippet>
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    News Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Category:</span> {newsItem.category}</p>
                    <p><span className="font-medium">Published:</span> {formatShortDate(newsItem.publishedAt)}</p>
                    <p><span className="font-medium">Read Time:</span> {readTime} minutes</p>
                    {newsItem.source && <p><span className="font-medium">Source:</span> {newsItem.source}</p>}
                  </div>
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
export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  return (
    <Suspense fallback={<NewsLoading />}>
      <NewsContent slug={slug} />
    </Suspense>
  );
}