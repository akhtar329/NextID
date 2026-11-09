// app/(public)/news/[slug]/page.tsx

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
  Clock,
  Eye,
  ChevronLeft,
  TrendingUp,
  Zap,
  Share2,
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

// ============ CONSTANTS ============
const SITE_URL = 'https://www.nextid.pk';
const SITE_NAME = 'NextID.pk';

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

function formatDateStatic(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatShortDateStatic(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-PK', {
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
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      headings.push({ id, text, level });
    }
  }

  return headings.slice(0, 6);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

// ✅ Sanitize content — H1 → H2, add IDs, remove empty paragraphs
function sanitizeContent(html: string | null): string {
  if (!html) return '';

  let sanitized = html;

  // Convert H1 to H2 (hero already has the only H1)
  sanitized = sanitized
    .replace(/<h1[^>]*>/gi, '<h2>')
    .replace(/<\/h1>/gi, '</h2>');

  // Add IDs to H2 and H3 for anchor links
  sanitized = sanitized.replace(
    /<h([2-3])>(.*?)<\/h\1>/gi,
    (match, level, content) => {
      const text = content.replace(/<[^>]*>/g, '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return `<h${level} id="${id}">${content}</h${level}>`;
    }
  );

  // Remove empty paragraphs
  sanitized = sanitized.replace(/<p>\s*<\/p>/g, '');

  return sanitized;
}

// ============ INLINE SOCIAL ICONS (100% reliable — no library issues) ============
function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedInIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function MailIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

// ============ SHARE BUTTONS COMPONENT ============
function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `${SITE_URL}/news/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      label: 'Share on X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: <XIcon />,
      bg: 'bg-black hover:bg-gray-800',
    },
    {
      label: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <FacebookIcon />,
      bg: 'bg-[#1877F2] hover:bg-[#0c63d4]',
    },
    {
      label: 'Share on LinkedIn',
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      icon: <LinkedInIcon />,
      bg: 'bg-[#0A66C2] hover:bg-[#08508f]',
    },
    {
      label: 'Share on WhatsApp',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: <WhatsAppIcon />,
      bg: 'bg-[#25D366] hover:bg-[#1da851]',
    },
    {
      label: 'Share via Email',
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      icon: <MailIcon />,
      bg: 'bg-gray-600 hover:bg-gray-700',
    },
  ];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Share this article">
      {shareLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={`w-9 h-9 ${link.bg} text-white rounded-lg flex items-center justify-center transition-colors duration-200 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500`}
          aria-label={link.label}
          title={link.label}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}

// ============ TABLE OF CONTENTS (✅ FIXED — no H2, semantic nav) ============
function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length === 0) return null;

  return (
    <nav
      className="bg-gray-50 rounded-xl p-5 mb-8 border border-gray-200"
      aria-label="Table of contents"
      data-nosnippet
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-red-600" aria-hidden="true" />
        {/* ✅ FIXED: h2 → p (UI label, not article heading) */}
        <p className="font-bold text-gray-800 text-sm uppercase tracking-wide m-0">
          In This News
        </p>
      </div>
      <ul className="space-y-2 m-0 p-0 list-none">
        {headings.map((heading, idx) => (
          <li key={idx} className={heading.level === 2 ? 'ml-0' : 'ml-4'}>
            <a
              href={`#${heading.id}`}
              className="text-sm text-gray-600 hover:text-red-600 transition flex items-center gap-2 no-underline"
            >
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" aria-hidden="true"></span>
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ============ GENERATE STATIC PARAMS ============
export async function generateStaticParams() {
  try {
    const posts = await postService.getList('news', 10);
    if (posts && posts.length > 0) {
      return posts.map((post) => ({ slug: post.slug }));
    }
    return [{ slug: 'placeholder' }];
  } catch (error) {
    console.error('Error generating static params for news:', error);
    return [{ slug: 'placeholder' }];
  }
}

// ============ DATA FETCHING ============
async function getNewsBySlug(slug: string): Promise<NewsDetail | null> {
  try {
    const post = await postService.getDetail(slug);
    if (!post || post.type !== 'news') return null;

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
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
      createdAt: post.createdAt ? new Date(post.createdAt) : null,
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
      updatedAt: post.updatedAt ? new Date(post.updatedAt) : null,
    };
  } catch (error) {
    console.error('Error fetching news detail:', error);
    return null;
  }
}

async function getAllNews(): Promise<ExtendedPost[]> {
  try {
    const news = await postService.getList('news', 10);
    return news || [];
  } catch (error) {
    console.error('Error fetching all news:', error);
    return [];
  }
}

async function getRelatedNews(currentId: number): Promise<RelatedNews[]> {
  try {
    const allNews = await getAllNews();
    if (!allNews || !Array.isArray(allNews)) return [];

    return allNews
      .filter((post) => post && post.id && post.id !== currentId)
      .slice(0, 3)
      .map((post) => {
        const meta = post.meta || {};
        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          featuredImage: post.featuredImage,
          publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
          isBreaking: getMetaValue(meta, 'isBreaking', false),
        };
      });
  } catch (error) {
    console.error('Error fetching related news:', error);
    return [];
  }
}

// ============ METADATA ============
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

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

  const seoTitle =
    newsItem.metaTitle ||
    `${breakingPrefix}${newsItem.title} | ${newsItem.category} News | ${SITE_NAME}`;

  const seoDescription =
    newsItem.metaDescription ||
    `${newsItem.excerpt || `Latest ${newsItem.category} news: ${newsItem.title}`} Published on ${formatShortDateStatic(newsItem.publishedAt)}. Read time: ${readTime} min.`;

  const canonicalUrl = newsItem.canonicalUrl || `${SITE_URL}/news/${newsItem.slug}`;
  const ogImage = newsItem.ogImage || newsItem.featuredImage || '/og-image.png';
  const robots = newsItem.robots || 'index, follow';

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: newsItem.metaKeywords || undefined,
    robots,
    alternates: {
      canonical: canonicalUrl,
      languages: { 'en-US': canonicalUrl },
    },
    publisher: SITE_NAME,
    authors: [{ name: newsItem.authorName || 'NextID Team' }],
    openGraph: {
      title: newsItem.ogTitle || seoTitle,
      description: newsItem.ogDescription || seoDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: newsItem.title }],
      type: 'article',
      publishedTime: newsItem.publishedAt?.toISOString(),
      modifiedTime: newsItem.updatedAt?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: newsItem.twitterTitle || seoTitle,
      description: newsItem.twitterDescription || seoDescription,
      images: [ogImage],
    },
  };
}

// ============ SCHEMA: BREADCRUMB ============
function BreadcrumbSchema({ newsItem }: { newsItem: NewsDetail }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'News', item: `${SITE_URL}/news` },
      {
        '@type': 'ListItem',
        position: 3,
        name: newsItem.title.substring(0, 50),
        item: `${SITE_URL}/news/${newsItem.slug}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
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
  if (slug === 'placeholder') notFound();

  const newsItem = await getNewsBySlug(slug);
  if (!newsItem) notFound();

  const relatedNews = await getRelatedNews(newsItem.id);
  const readTime = getReadTime(newsItem.content);
  const headings = extractHeadings(newsItem.content);
  const sanitizedContent = sanitizeContent(newsItem.content);

  const metaDescriptionText =
    newsItem.excerpt ||
    `${newsItem.title}. ${newsItem.category} news update. Published on ${formatShortDateStatic(newsItem.publishedAt)}. Read time: ${readTime} min.`;

  const newsArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: newsItem.title,
    description: newsItem.excerpt || metaDescriptionText,
    url: `${SITE_URL}/news/${newsItem.slug}`,
    image: newsItem.featuredImage ? [newsItem.featuredImage] : [],
    datePublished: newsItem.publishedAt?.toISOString(),
    dateModified: newsItem.updatedAt?.toISOString(),
    author: { '@type': 'Person', name: newsItem.authorName || 'NextID Team' },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    articleSection: newsItem.category,
    keywords: newsItem.tags?.join(', '),
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/news/${newsItem.slug}` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }}
      />
      <BreadcrumbSchema newsItem={newsItem} />

      <main className="min-h-screen bg-gray-50">
        {/* ============ HERO SECTION ============ */}
        <header
          className={`${
            newsItem.isBreaking
              ? 'bg-gradient-to-r from-red-600 to-red-700'
              : 'bg-gradient-to-r from-gray-800 to-gray-900'
          } text-white`}
        >
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              {/* Breadcrumbs */}
              <nav aria-label="Breadcrumb" className="mb-2">
                <ol className="flex items-center gap-2 text-sm text-white/60 flex-wrap list-none m-0 p-0">
                  <li>
                    <Link href="/" className="hover:text-white transition no-underline">
                      Home
                    </Link>
                  </li>
                  <li aria-hidden="true">›</li>
                  <li>
                    <Link href="/news" className="hover:text-white transition no-underline">
                      News
                    </Link>
                  </li>
                  <li aria-hidden="true">›</li>
                  <li className="text-white font-medium truncate max-w-[200px]">
                    {newsItem.title.substring(0, 40)}...
                  </li>
                </ol>
              </nav>

              <Link
                href="/news"
                className="inline-flex items-center gap-1 text-white/70 hover:text-white transition mb-4 group no-underline"
              >
                <ChevronLeft
                  className="w-4 h-4 group-hover:-translate-x-1 transition"
                  aria-hidden="true"
                />
                Back to News
              </Link>

              <div className="flex flex-wrap gap-2 mb-4">
                {newsItem.isBreaking && (
                  <span className="inline-flex items-center gap-1 bg-red-500 px-3 py-1 rounded-full text-xs font-medium">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" aria-hidden="true"></span>
                    BREAKING NEWS
                  </span>
                )}
                {newsItem.isFeatured && (
                  <span className="inline-flex items-center gap-1 bg-amber-500 px-3 py-1 rounded-full text-xs font-medium">
                    <TrendingUp className="w-3 h-3" aria-hidden="true" />
                    Featured
                  </span>
                )}
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                  {newsItem.category}
                </span>
              </div>

              {/* ✅ ONLY H1 on the page */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {newsItem.isBreaking && '🔴 '}
                {newsItem.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" aria-hidden="true" />
                  {newsItem.authorName || 'NextID Team'}
                </span>
                <span className="w-1 h-1 bg-white/30 rounded-full" aria-hidden="true"></span>
                <time
                  dateTime={newsItem.publishedAt?.toISOString()}
                  className="flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  {formatDateStatic(newsItem.publishedAt)}
                </time>
                <span className="w-1 h-1 bg-white/30 rounded-full" aria-hidden="true"></span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  {readTime} min read
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" aria-hidden="true" />
                  {formatViews(newsItem.viewCount)} views
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ============ MAIN CONTENT ============ */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
            <article className="lg:w-2/3">
              {/* Featured Image */}
              <figure className="relative mb-8 rounded-xl overflow-hidden shadow-lg aspect-video bg-gradient-to-br from-gray-200 to-gray-300 m-0">
                {newsItem.featuredImage ? (
                  <Image
                    src={newsItem.featuredImage}
                    alt={newsItem.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full bg-white/80 shadow-lg flex items-center justify-center mx-auto mb-3">
                        <Zap className="w-10 h-10 text-red-500" aria-hidden="true" />
                      </div>
                      <p className="text-gray-600 font-medium">{newsItem.category}</p>
                      <p className="text-gray-400 text-sm">News Article</p>
                    </div>
                  </div>
                )}
                {newsItem.source && (
                  <figcaption className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    Source: {newsItem.source}
                  </figcaption>
                )}
              </figure>

              <TableOfContents headings={headings} />

              {newsItem.excerpt && (
                <aside
                  className="bg-red-50 border-l-4 border-red-600 p-5 mb-8 rounded-r-lg"
                  aria-label="Article summary"
                >
                  <p className="text-gray-800 font-medium leading-relaxed m-0">
                    📌 <span className="font-bold">TL;DR:</span> {newsItem.excerpt}
                  </p>
                </aside>
              )}

              {/* ✅ Article body — semantic section, single H2 hierarchy inside */}
              <section aria-label="Article body">
                <div
                  className="prose prose-lg max-w-none
                    prose-headings:text-gray-900 prose-headings:font-bold prose-headings:scroll-mt-24
                    prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                    prose-p:text-gray-700 prose-p:leading-relaxed
                    prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-gray-900 prose-strong:font-semibold
                    prose-li:text-gray-700
                    prose-img:rounded-lg prose-img:shadow-md
                    prose-blockquote:border-l-red-600 prose-blockquote:bg-gray-50 prose-blockquote:p-4 prose-blockquote:italic"
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              </section>

              {/* Tags */}
              {newsItem.tags && newsItem.tags.length > 0 && (
                <div className="border-t border-gray-200 mt-8 pt-6">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-gray-500 font-medium">Tags:</span>
                    <div className="flex flex-wrap gap-2">
                      {newsItem.tags.map((tag, idx) => (
                        <Link
                          key={idx}
                          href={`/news?tag=${encodeURIComponent(tag)}`}
                          className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition no-underline"
                          rel="tag"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Author + Share */}
              <div className="bg-gray-50 rounded-xl p-5 mt-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      aria-hidden="true"
                    >
                      {newsItem.authorName ? getInitials(newsItem.authorName) : 'NT'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 m-0">
                        {newsItem.authorName || 'NextID Team'}
                      </p>
                      <p className="text-xs text-gray-500 m-0">News Author</p>
                    </div>
                  </div>
                  <ShareButtons title={newsItem.title} slug={newsItem.slug} />
                </div>
              </div>

              {/* Author Bio */}
              <div className="bg-red-50 rounded-xl p-5 mt-6 border border-red-100">
                <p className="text-sm text-gray-700 m-0">
                  <span className="font-bold text-red-800">
                    About {newsItem.authorName || 'NextID Team'}:
                  </span>{' '}
                  {newsItem.authorName
                    ? `${newsItem.authorName} provides authentic education news and updates for Pakistani students.`
                    : 'NextID.pk delivers trusted education news, exam updates, and admission announcements for Pakistan.'}
                </p>
              </div>

              {/* Bottom Share */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-sm text-gray-500 font-medium flex items-center gap-2">
                    <Share2 className="w-4 h-4" aria-hidden="true" />
                    Share this news:
                  </span>
                  <ShareButtons title={newsItem.title} slug={newsItem.slug} />
                </div>
              </div>
            </article>

            {/* ============ SIDEBAR ============ */}
            <aside className="lg:w-1/3" aria-label="Sidebar">
              <div className="sticky top-24 space-y-6">
                {relatedNews.length > 0 && (
                  <nav
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
                    aria-label="Related news"
                    data-nosnippet
                  >
                    <div className="mb-4 pb-2 border-b border-gray-100">
                      {/* ✅ FIXED: h3 → p (UI label) */}
                      <p className="font-bold text-gray-800 m-0">Related News</p>
                    </div>
                    <div className="space-y-4">
                      {relatedNews.map((item) => (
                        <Link
                          key={item.id}
                          href={`/news/${item.slug}`}
                          className="flex gap-3 group no-underline"
                          rel="nofollow"
                        >
                          <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
                            {item.featuredImage ? (
                              <Image
                                src={item.featuredImage}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-105 transition duration-300"
                                sizes="64px"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl" aria-hidden="true">
                                  📰
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            {item.isBreaking && (
                              <span className="inline-block text-xs text-red-600 font-semibold">
                                NEW
                              </span>
                            )}
                            <p className="text-sm font-medium text-gray-800 group-hover:text-red-600 transition line-clamp-2 m-0">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 m-0">
                              {formatShortDateStatic(item.publishedAt)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </nav>
                )}

                {newsItem.source && (
                  <section
                    className="bg-gray-50 rounded-xl p-5 border border-gray-200"
                    aria-label="News source"
                    data-nosnippet
                  >
                    {/* ✅ FIXED: h3 → p */}
                    <p className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide m-0">
                      News Source
                    </p>
                    <p className="text-sm text-gray-600 m-0">
                      This news article is sourced from{' '}
                      <span className="font-medium">{newsItem.source}</span>. For more
                      details, visit the official source.
                    </p>
                  </section>
                )}

                <section
                  className="bg-blue-50 rounded-xl p-5 border border-blue-100"
                  aria-label="News summary"
                  data-nosnippet
                >
                  {/* ✅ FIXED: h3 → p */}
                  <p className="font-semibold text-blue-800 mb-3 flex items-center gap-2 m-0">
                    <Zap className="w-4 h-4" aria-hidden="true" />
                    News Summary
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="m-0">
                      <span className="font-medium">Category:</span> {newsItem.category}
                    </p>
                    <p className="m-0">
                      <span className="font-medium">Published:</span>{' '}
                      {formatShortDateStatic(newsItem.publishedAt)}
                    </p>
                    <p className="m-0">
                      <span className="font-medium">Read Time:</span> {readTime} minutes
                    </p>
                    {newsItem.source && (
                      <p className="m-0">
                        <span className="font-medium">Source:</span> {newsItem.source}
                      </p>
                    )}
                  </div>
                </section>

                <div data-nosnippet>
                  <Suspense
                    fallback={
                      <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-64"></div>
                    }
                  >
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
export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={<NewsLoading />}>
      <NewsContent slug={slug} />
    </Suspense>
  );
}