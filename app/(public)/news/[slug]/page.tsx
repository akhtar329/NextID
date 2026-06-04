// app/(public)/news/[slug]/page.tsx

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { postService } from '@/services/post/post.service';
import { 
  Calendar, 
  User, 
  Clock, 
  Eye, 
  ChevronLeft,
  Newspaper,
  Twitter,
  Facebook,
  Linkedin,
  Mail
} from 'lucide-react';
import SidebarWidgets from '@/components/sections/Home/SidebarWidgets';

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
  return value !== undefined && value !== null ? value : defaultValue;
}

// ============ DATA FETCHING ============
async function getNewsBySlug(slug: string): Promise<NewsDetail | null> {
  try {
    const post = await postService.getPost(slug);
    
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
    };
  } catch (error) {
    console.error('Error fetching news detail:', error);
    return null;
  }
}

async function getRelatedNews(currentId: number): Promise<RelatedNews[]> {
  try {
    const allNews = await postService.getPostsByType('news', 50);
    
    return allNews
      .filter(post => post.id !== currentId)
      .slice(0, 4)
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
  const newsItem = await getNewsBySlug(slug);

  if (!newsItem) {
    return {
      title: 'News Not Found | NextID.pk',
      description: 'The requested news article could not be found.',
    };
  }

  return {
    title: newsItem.isBreaking ? `BREAKING: ${newsItem.title} | NextID.pk` : `${newsItem.title} | NextID.pk`,
    description: newsItem.excerpt || `Read latest education news. Updated on ${formatShortDate(newsItem.publishedAt)}.`,
    openGraph: {
      title: newsItem.title,
      description: newsItem.excerpt || '',
      type: 'article',
      images: newsItem.featuredImage ? [newsItem.featuredImage] : [],
    },
    alternates: {
      canonical: `https://www.nextid.pk/news/${newsItem.slug}`,
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

// ============ NEWS CONTENT COMPONENT ============
async function NewsContent({ slugPromise }: { slugPromise: Promise<string> }) {
  const slug = await slugPromise;
  const newsItem = await getNewsBySlug(slug);
  
  if (!newsItem) {
    notFound();
  }
  
  const readTime = getReadTime(newsItem.content);
  const relatedNews = await getRelatedNews(newsItem.id);

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className={`${newsItem.isBreaking ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-gray-800 to-gray-900'} text-white`}>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            
            {/* Back Button */}
            <Link 
              href="/news" 
              className="inline-flex items-center gap-1 text-white/70 hover:text-white transition mb-6 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
              Back to News
            </Link>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {newsItem.isBreaking && (
                <span className="inline-flex items-center gap-1 bg-red-500 px-3 py-1 rounded-full text-xs font-medium">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  BREAKING
                </span>
              )}
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                {newsItem.category}
              </span>
            </div>
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {newsItem.title}
            </h1>
            
            {/* Meta Info */}
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
          
          {/* Main Article */}
          <article className="lg:w-2/3">
            
            {/* Featured Image */}
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

            {/* Excerpt */}
            {newsItem.excerpt && (
              <div className="bg-red-50 border-l-4 border-red-600 p-5 mb-8 rounded-r-lg">
                <p className="text-gray-800 font-medium leading-relaxed italic">
                  {newsItem.excerpt}
                </p>
              </div>
            )}

            {/* Content */}
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

            {/* Tags */}
            <div className="border-t border-gray-200 mt-8 pt-6">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-500 font-medium">Tags:</span>
                <div className="flex flex-wrap gap-2">
                  <Link href="/news" className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition">
                    Education
                  </Link>
                  <Link href="/news" className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition">
                    Pakistan
                  </Link>
                  {newsItem.category !== 'General' && (
                    <Link href={`/news?category=${newsItem.category}`} className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition">
                      {newsItem.category}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Share Section */}
            <div className="bg-gray-50 rounded-xl p-5 mt-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {newsItem.authorName ? newsItem.authorName.charAt(0).toUpperCase() : 'N'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{newsItem.authorName || 'NextID Team'}</p>
                    <p className="text-xs text-gray-500">Author</p>
                  </div>
                </div>
                <ShareButtons title={newsItem.title} slug={newsItem.slug} />
              </div>
            </div>
          </article>

          {/* Right Sidebar */}
          <aside className="lg:w-1/3">
            <div className="sticky top-24 space-y-6">
              
              {/* Sidebar Widgets */}
              <SidebarWidgets />
              
              {/* Related News */}
              {relatedNews.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <Newspaper className="w-4 h-4 text-red-600" />
                    <h3 className="font-bold text-gray-800">Related News</h3>
                  </div>
                  <div className="space-y-4">
                    {relatedNews.map((item) => (
                      <Link key={item.id} href={`/news/${item.slug}`} className="flex gap-3 group">
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
                            <Newspaper className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          {item.isBreaking && (
                            <span className="inline-block text-xs text-red-600 font-semibold">BREAKING</span>
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
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

// ============ MAIN PAGE ============
export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slugPromise = params.then(p => p.slug);
  
  return (
    <Suspense fallback={<NewsLoading />}>
      <NewsContent slugPromise={slugPromise} />
    </Suspense>
  );
}