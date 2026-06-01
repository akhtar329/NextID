// app/(public)/news/[slug]/page.tsx

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { postService } from '@/services/post/post.service';

export const revalidate = 86400;

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

interface PopularNewsItem {
  id: number;
  title: string;
  slug: string;
  viewCount: number;
  publishedAt: Date | null;
}

// ============ HELPER FUNCTIONS ============
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

function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined ? value : defaultValue;
}

// ============ DATA FETCHING ============
async function getNewsBySlug(slug: string): Promise<NewsDetail | null> {
  try {
    const post = await postService.getPost(slug);
    
    if (!post || post.type !== 'news') {
      return null;
    }
    
    const meta = post.meta;
    
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      source: getMetaValue(meta, 'source', null),
      authorName: getMetaValue(meta, 'authorName', null),
      isFeatured: post.isFeatured || false,
      isBreaking: post.isBreaking || false,
      viewCount: post.viewCount || 0,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      category: getMetaValue(meta, 'category', 'General'),
      tags: getMetaValue(meta, 'tags', null),
    };
  } catch (error) {
    console.error('Error fetching news detail:', error);
    return null;
  }
}

async function getRelatedAndPopularNews(currentNews: NewsDetail): Promise<{ relatedNews: RelatedNews[]; popularNews: PopularNewsItem[] }> {
  try {
    // Get all news posts
    const allNews = await postService.getPostsByType('news', 100);
    
    // Transform to NewsItem format
    const newsList = allNews.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      publishedAt: post.publishedAt,
      isBreaking: post.isBreaking || false,
      viewCount: post.viewCount || 0,
    }));
    
    // Filter related by category (excluding current)
    const relatedNews = newsList
      .filter(n => n.id !== currentNews.id)
      .slice(0, 6)
      .map(n => ({
        id: n.id,
        title: n.title,
        slug: n.slug,
        excerpt: n.excerpt,
        featuredImage: n.featuredImage,
        publishedAt: n.publishedAt,
        isBreaking: n.isBreaking,
      }));
    
    // Get popular news (by view count)
    const popularNews = [...newsList]
      .filter(n => n.id !== currentNews.id)
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)
      .map(n => ({
        id: n.id,
        title: n.title,
        slug: n.slug,
        viewCount: n.viewCount,
        publishedAt: n.publishedAt,
      }));
    
    return { relatedNews, popularNews };
  } catch (error) {
    console.error('Error fetching related news:', error);
    return { relatedNews: [], popularNews: [] };
  }
}

async function incrementViewCount(id: number): Promise<void> {
  try {
    // Fire and forget - don't await
    postService.trackView(String(id));
  } catch {
    // Silent fail
  }
}

// ============ METADATA ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const newsItem = await getNewsBySlug(slug);

  if (!newsItem) {
    return {
      title: 'News Not Found | NextID.pk',
      description: 'The requested news article could not be found.',
    };
  }

  const title = newsItem.isBreaking 
    ? `BREAKING: ${newsItem.title} | NextID.pk`
    : `${newsItem.title} | Education News Pakistan | NextID.pk`;
    
  const description = newsItem.excerpt || `Read latest education news. Updated on ${formatShortDate(newsItem.publishedAt)}.`;

  return {
    title,
    description,
    openGraph: {
      title: newsItem.title,
      description: newsItem.excerpt || description,
      type: 'article',
      images: newsItem.featuredImage ? [newsItem.featuredImage] : ['/images/news-og.jpg'],
    },
    alternates: {
      canonical: `https://www.nextid.pk/news/${newsItem.slug}`,
    },
  };
}

// ============ COMPONENTS ============
function Breadcrumbs({ title }: { title: string }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
      <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
      <span className="text-gray-400">/</span>
      <Link href="/news" className="hover:text-red-600 transition-colors">News</Link>
      <span className="text-gray-400">/</span>
      <span className="text-gray-800 font-medium line-clamp-1">{title}</span>
    </nav>
  );
}

function AuthorCard({ author, publishedAt, readTime }: { author: string | null; publishedAt: Date | null; readTime: number }) {
  return (
    <div className="flex items-center justify-between py-4 border-y border-gray-200 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {author ? author.charAt(0).toUpperCase() : 'N'}
        </div>
        <div>
          <p className="font-medium text-gray-900">{author || 'NextID Team'}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{formatDate(publishedAt)}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>{readTime} min read</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `https://www.nextid.pk/news/${slug}`;
  
  const shareLinks = [
    { name: 'Twitter', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, bg: 'bg-black hover:bg-gray-800' },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, bg: 'bg-blue-700 hover:bg-blue-800' },
    { name: 'LinkedIn', href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, bg: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, bg: 'bg-green-600 hover:bg-green-700' },
  ];
  
  return (
    <div className="bg-gray-50 rounded-xl p-5 mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">Share this article</h3>
      <div className="flex flex-wrap gap-2">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2 ${link.bg} text-white text-sm rounded-lg transition-all hover:shadow-md`}
          >
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
}

function RelatedNewsMagazine({ relatedNews }: { relatedNews: RelatedNews[] }) {
  if (relatedNews.length === 0) return null;
  
  const midIndex = Math.ceil(relatedNews.length / 2);
  const leftColumn = relatedNews.slice(0, midIndex);
  const rightColumn = relatedNews.slice(midIndex);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-red-500 px-5 py-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-lg">Related News</h3>
          <p className="text-white/70 text-xs">More from NextID</p>
        </div>
        <Link href="/news" className="text-white/80 hover:text-white text-sm flex items-center gap-1">
          View All
          <span className="text-lg">→</span>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        <div className="p-4 space-y-4">
          {leftColumn.map((item) => (
            <Link key={item.id} href={`/news/${item.slug}`} className="group block">
              <div className="flex gap-3">
                {item.featuredImage ? (
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image 
                      src={item.featuredImage} 
                      alt={item.title} 
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl text-gray-400">N</span>
                  </div>
                )}
                <div className="flex-1">
                  {item.isBreaking && (
                    <span className="inline-block px-1.5 py-0.5 bg-red-600 text-white text-xs font-bold rounded mb-1">
                      BREAKING
                    </span>
                  )}
                  <h4 className="font-semibold text-gray-800 group-hover:text-red-600 transition line-clamp-2 text-sm">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <span className="text-gray-400">📅</span>
                    {formatShortDate(item.publishedAt)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {rightColumn.length > 0 && (
          <div className="p-4 space-y-4">
            {rightColumn.map((item) => (
              <Link key={item.id} href={`/news/${item.slug}`} className="group block">
                <div className="flex gap-3">
                  {item.featuredImage ? (
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image 
                        src={item.featuredImage} 
                        alt={item.title} 
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl text-gray-400">N</span>
                    </div>
                  )}
                  <div className="flex-1">
                    {item.isBreaking && (
                      <span className="inline-block px-1.5 py-0.5 bg-red-600 text-white text-xs font-bold rounded mb-1">
                        BREAKING
                      </span>
                    )}
                    <h4 className="font-semibold text-gray-800 group-hover:text-red-600 transition line-clamp-2 text-sm">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <span className="text-gray-400">📅</span>
                      {formatShortDate(item.publishedAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PopularNews({ popularNews }: { popularNews: PopularNewsItem[] }) {
  if (popularNews.length === 0) return null;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-red-500 px-5 py-3">
        <h3 className="font-bold text-white">Most Popular</h3>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {popularNews.map((item, index) => (
            <Link
              key={item.id}
              href={`/news/${item.slug}`}
              className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition group"
            >
              <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </span>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-red-600 line-clamp-2">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {formatShortDate(item.publishedAt)} • {formatViews(item.viewCount)} views
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewsletterSignup() {
  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-5 text-white">
      <h3 className="font-bold text-lg mb-2">Subscribe to Newsletter</h3>
      <p className="text-gray-300 text-sm mb-4">Get the latest education news delivered to your inbox</p>
      <form action="/api/newsletter" method="POST" className="flex gap-2">
        <input
          type="email"
          name="email"
          placeholder="Your email address"
          className="flex-1 px-3 py-2 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
        >
          Subscribe
        </button>
      </form>
      <p className="text-gray-400 text-xs mt-2">No spam, unsubscribe anytime.</p>
    </div>
  );
}

async function getPageData(slug: string) {
  const newsItem = await getNewsBySlug(slug);
  
  if (!newsItem) {
    return { newsItem: null, relatedNews: [], popularNews: [] };
  }
  
  // Increment view count (fire and forget)
  incrementViewCount(newsItem.id);
  
  const { relatedNews, popularNews } = await getRelatedAndPopularNews(newsItem);
  
  return { newsItem, relatedNews, popularNews };
}

// ============ MAIN PAGE COMPONENT ============
export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { newsItem, relatedNews, popularNews } = await getPageData(slug);
  
  if (!newsItem) {
    notFound();
  }

  const readTime = getReadTime(newsItem.content);

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className={`${newsItem.isBreaking ? 'bg-gradient-to-r from-red-700 via-red-600 to-red-500' : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900'} text-white relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 py-12 relative">
          <div className="max-w-4xl mx-auto">
            <Breadcrumbs title={newsItem.title} />
            
            {newsItem.isBreaking && (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider">Breaking News</span>
              </div>
            )}
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {newsItem.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <span>By</span>
                <span className="font-medium text-white">{newsItem.authorName || 'NextID Team'}</span>
              </div>
              <div className="w-1 h-1 bg-white/30 rounded-full"></div>
              <div className="flex items-center gap-2">
                <span>{formatDate(newsItem.publishedAt)}</span>
              </div>
              <div className="w-1 h-1 bg-white/30 rounded-full"></div>
              <div className="flex items-center gap-2">
                <span>{readTime} min read</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
          
          {/* Side Social Icons */}
          <aside className="lg:w-16 flex-shrink-0">
            <div className="sticky top-24 flex lg:flex-col gap-2 justify-center">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(newsItem.title)}&url=${encodeURIComponent(`https://www.nextid.pk/news/${newsItem.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
                title="Share on Twitter"
              >
                𝕏
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://www.nextid.pk/news/${newsItem.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-700 hover:bg-blue-800 text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
                title="Share on Facebook"
              >
                f
              </a>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`https://www.nextid.pk/news/${newsItem.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
                title="Share on LinkedIn"
              >
                in
              </a>
            </div>
          </aside>
          
          {/* Article Content */}
          <article className="flex-1">
            
            {newsItem.featuredImage && (
              <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg aspect-video">
                <Image 
                  src={newsItem.featuredImage} 
                  alt={newsItem.title}
                  fill
                  className="object-cover"
                  priority
                />
                {newsItem.source && (
                  <p className="text-xs text-gray-500 mt-2 text-center absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded">
                    Source: {newsItem.source}
                  </p>
                )}
              </div>
            )}

            {newsItem.excerpt && (
              <div className="bg-red-50 border-l-4 border-red-600 p-5 mb-8 rounded-r-lg">
                <p className="text-gray-800 font-medium leading-relaxed">
                  {newsItem.excerpt}
                </p>
              </div>
            )}

            <div 
              className="prose prose-lg max-w-none 
                prose-headings:text-gray-900 prose-headings:font-bold 
                prose-p:text-gray-700 prose-p:leading-relaxed 
                prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-li:text-gray-700
                prose-img:rounded-lg prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: newsItem.content || '' }}
            />

            <div className="border-t border-gray-200 mt-8 pt-6">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-500">Tags:</span>
                <Link href="/news" className="text-sm text-red-600 hover:underline">Education News</Link>
                <span className="text-gray-300">|</span>
                <Link href="/news" className="text-sm text-red-600 hover:underline">Pakistan</Link>
                {newsItem.category && (
                  <>
                    <span className="text-gray-300">|</span>
                    <Link href={`/news?category=${newsItem.category}`} className="text-sm text-red-600 hover:underline">
                      {newsItem.category}
                    </Link>
                  </>
                )}
              </div>
            </div>

            <AuthorCard 
              author={newsItem.authorName} 
              publishedAt={newsItem.publishedAt} 
              readTime={readTime} 
            />

            <ShareButtons title={newsItem.title} slug={newsItem.slug} />
          </article>

          {/* Right Sidebar */}
          <aside className="lg:w-80">
            <div className="space-y-6 sticky top-24">
              
              <PopularNews popularNews={popularNews} />

              <NewsletterSignup />

              <Link 
                href="/news"
                className="block bg-white border border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition group"
              >
                <span className="text-gray-700 group-hover:text-red-600">← Back to all news</span>
              </Link>
            </div>
          </aside>
        </div>
        
        {/* Related News Section */}
        <div className="max-w-6xl mx-auto mt-10">
          <RelatedNewsMagazine relatedNews={relatedNews} />
        </div>
      </div>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": newsItem.title,
            "description": newsItem.excerpt,
            "image": newsItem.featuredImage,
            "author": {
              "@type": "Person",
              "name": newsItem.authorName || "NextID Team"
            },
            "publisher": {
              "@type": "Organization",
              "name": "NextID.pk",
              "logo": {
                "@type": "ImageObject",
                "url": "https://www.nextid.pk/logo.png"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://www.nextid.pk/news/${newsItem.slug}`
            },
            "articleSection": "Education",
            "keywords": newsItem.tags?.join(', ') || "education news, Pakistan"
          })
        }}
      />
    </main>
  );
}