// app/(public)/news/[slug]/page.tsx
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { news, programs, institutes, boards, cities } from '@/app/lib/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export const revalidate = 3600;
export const dynamic = 'force-static';
export const fetchCache = 'force-cache';
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const allNews = await db
      .select({ slug: news.slug })
      .from(news)
      .where(eq(news.status, true))
      .limit(100);
    
    return allNews.map((item) => ({
      slug: item.slug,
    }));
  } catch {
    return [];
  }
}

interface NewsDetail {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  imageUrl: string | null;
  source: string | null;
  author: string | null;
  isFeatured: boolean | null;
  isBreaking: boolean | null;
  viewCount: number | null;
  publishedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  
  programId: number | null;
  programName: string | null;
  programSlug: string | null;
  
  instituteId: number | null;
  instituteName: string | null;
  instituteSlug: string | null;
  instituteType: string | null;
  
  boardId: number | null;
  boardName: string | null;
  boardSlug: string | null;
  
  cityId: number | null;
  cityName: string | null;
  citySlug: string | null;
  cityProvince: string | null;
}

interface RelatedNews {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  isBreaking: boolean | null;
}

interface PopularNewsItem {
  id: number;
  title: string;
  slug: string;
  viewCount: number | null;
  publishedAt: Date | null;
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

function formatViews(views: number | null): string {
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

async function getNewsBySlug(slug: string): Promise<NewsDetail | null> {
  try {
    const [newsItem] = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        content: news.content,
        excerpt: news.excerpt,
        imageUrl: news.imageUrl,
        source: news.source,
        author: news.author,
        isFeatured: news.isFeatured,
        isBreaking: news.isBreaking,
        viewCount: news.viewCount,
        publishedAt: news.publishedAt,
        expiresAt: news.expiresAt,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
        
        programId: news.programId,
        programName: programs.name,
        programSlug: programs.slug,
        
        instituteId: news.instituteId,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        instituteType: institutes.type,
        
        boardId: news.boardId,
        boardName: boards.name,
        boardSlug: boards.slug,
        
        cityId: news.cityId,
        cityName: cities.name,
        citySlug: cities.slug,
        cityProvince: cities.province,
      })
      .from(news)
      .leftJoin(programs, eq(news.programId, programs.id))
      .leftJoin(institutes, eq(news.instituteId, institutes.id))
      .leftJoin(boards, eq(news.boardId, boards.id))
      .leftJoin(cities, eq(news.cityId, cities.id))
      .where(eq(news.slug, slug))
      .limit(1);

    return newsItem || null;
  } catch {
    return null;
  }
}

async function getRelatedAndPopularNews(newsItem: NewsDetail): Promise<{ relatedNews: RelatedNews[]; popularNews: PopularNewsItem[] }> {
  try {
    let relatedCondition = sql`1=1`;
    
    if (newsItem.programId) {
      relatedCondition = eq(news.programId, newsItem.programId);
    } else if (newsItem.instituteId) {
      relatedCondition = eq(news.instituteId, newsItem.instituteId);
    } else if (newsItem.boardId) {
      relatedCondition = eq(news.boardId, newsItem.boardId);
    } else if (newsItem.cityId) {
      relatedCondition = eq(news.cityId, newsItem.cityId);
    }
    
    const [relatedNews, popularNews] = await Promise.all([
      db
        .select({
          id: news.id,
          title: news.title,
          slug: news.slug,
          excerpt: news.excerpt,
          imageUrl: news.imageUrl,
          publishedAt: news.publishedAt,
          isBreaking: news.isBreaking,
        })
        .from(news)
        .where(
          and(
            relatedCondition,
            eq(news.status, true),
            sql`${news.id} != ${newsItem.id}`
          )
        )
        .orderBy(desc(news.publishedAt))
        .limit(6),
      
      db
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
        .limit(5)
    ]);
    
    return { relatedNews, popularNews };
  } catch {
    return { relatedNews: [], popularNews: [] };
  }
}

async function incrementViewCount(id: number): Promise<void> {
  try {
    await db
      .update(news)
      .set({ viewCount: sql`${news.viewCount} + 1` })
      .where(eq(news.id, id));
  } catch {
    // Silent fail - view count increment is non-critical
  }
}

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
      publishedTime: newsItem.publishedAt?.toISOString(),
      modifiedTime: newsItem.updatedAt?.toISOString(),
      images: newsItem.imageUrl ? [newsItem.imageUrl] : ['/images/news-og.jpg'],
    },
    alternates: {
      canonical: `https://www.nextid.pk/news/${newsItem.slug}`,
    },
  };
}

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
                {item.imageUrl ? (
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image 
                      src={item.imageUrl} 
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
                  {item.imageUrl ? (
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image 
                        src={item.imageUrl} 
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
  
  incrementViewCount(newsItem.id);
  
  const { relatedNews, popularNews } = await getRelatedAndPopularNews(newsItem);
  
  return { newsItem, relatedNews, popularNews };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { newsItem, relatedNews, popularNews } = await getPageData(slug);
  
  if (!newsItem) {
    notFound();
  }

  const readTime = getReadTime(newsItem.content);
  const relatedLink = newsItem.programSlug ? `/programs/${newsItem.programSlug}` :
                      newsItem.instituteSlug ? `/universities/${newsItem.instituteSlug}` :
                      newsItem.boardSlug ? `/boards/${newsItem.boardSlug}` :
                      newsItem.citySlug ? `/cities/${newsItem.citySlug}` : null;
  const relatedName = newsItem.programName || newsItem.instituteName || newsItem.boardName || newsItem.cityName;

  return (
    <main className="min-h-screen bg-gray-50">
      
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
                <span className="font-medium text-white">{newsItem.author || 'NextID Team'}</span>
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

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
          
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
          
          <article className="flex-1">
            
            {newsItem.imageUrl && (
              <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg aspect-video">
                <Image 
                  src={newsItem.imageUrl} 
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

            {relatedLink && relatedName && (
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="text-gray-700 text-sm">
                  Related: 
                  <Link href={relatedLink} className="ml-1 text-red-600 hover:underline font-medium">
                    {relatedName}
                  </Link>
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
              dangerouslySetInnerHTML={{ __html: newsItem.content }}
            />

            <div className="border-t border-gray-200 mt-8 pt-6">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-500">Tags:</span>
                <Link href="/news" className="text-sm text-red-600 hover:underline">Education News</Link>
                <span className="text-gray-300">|</span>
                <Link href="/news" className="text-sm text-red-600 hover:underline">Pakistan</Link>
                {newsItem.instituteName && (
                  <>
                    <span className="text-gray-300">|</span>
                    <Link href={`/universities/${newsItem.instituteSlug}`} className="text-sm text-red-600 hover:underline">
                      {newsItem.instituteName}
                    </Link>
                  </>
                )}
              </div>
            </div>

            <AuthorCard 
              author={newsItem.author} 
              publishedAt={newsItem.publishedAt} 
              readTime={readTime} 
            />

            <ShareButtons title={newsItem.title} slug={newsItem.slug} />
          </article>

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
        
        <div className="max-w-6xl mx-auto mt-10">
          <RelatedNewsMagazine relatedNews={relatedNews} />
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": newsItem.title,
            "description": newsItem.excerpt,
            "image": newsItem.imageUrl,
            "datePublished": newsItem.publishedAt?.toISOString(),
            "dateModified": newsItem.updatedAt?.toISOString(),
            "author": {
              "@type": "Person",
              "name": newsItem.author || "NextID Team"
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
            "keywords": "education news, Pakistan, admissions, results"
          })
        }}
      />
    </main>
  );
}