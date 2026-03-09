// app/(public)/news/[slug]/NewsDetailClient.tsx
"use client";

import Link from 'next/link';
import { NewsDetail, RelatedNews } from './page';

// ==================== FORMAT DATE FUNCTION ====================
function formatDate(date: Date | null) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(date: Date | null) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface NewsDetailClientProps {
  newsItem: NewsDetail;
  relatedNews: RelatedNews[];
  stats: { totalNews: number };
}

export default function NewsDetailClient({ newsItem, relatedNews, stats }: NewsDetailClientProps) {
  // Format content with paragraphs
  const contentParagraphs = newsItem.content.split('\n\n').filter(p => p.trim());

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`https://nextid.pk/news/${newsItem.slug}`);
    alert('Link copied to clipboard!');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="text-gray-400">›</span>
            <Link href="/news" className="text-gray-600 hover:text-blue-600">News</Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium line-clamp-1">{newsItem.title}</span>
          </div>
        </div>
      </div>

      {/* Article Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Breaking Badge */}
            {newsItem.isBreaking && (
              <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full mb-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                <span className="font-bold tracking-wider text-sm">BREAKING NEWS</span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {newsItem.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              {/* Date */}
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(newsItem.publishedAt)}
              </span>

              {/* Author */}
              {newsItem.author && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  By {newsItem.author}
                </span>
              )}

              {/* Source */}
              {newsItem.source && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Source: {newsItem.source}
                </span>
              )}

              {/* Views */}
              <span className="flex items-center gap-1 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {newsItem.views?.toLocaleString() || 0} views
              </span>
            </div>

            {/* Related Entities Chips */}
            <div className="flex flex-wrap gap-2">
              {newsItem.programName && (
                <Link
                  href={`/programs/${newsItem.programSlug}`}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition"
                >
                  📚 {newsItem.programName}
                </Link>
              )}
              {newsItem.instituteName && (
                <Link
                  href={`/universities/${newsItem.instituteSlug}`}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition"
                >
                  🏛️ {newsItem.instituteName}
                </Link>
              )}
              {newsItem.boardName && (
                <Link
                  href={`/boards/${newsItem.boardSlug}`}
                  className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition"
                >
                  📋 {newsItem.boardName}
                </Link>
              )}
              {newsItem.cityName && (
                <Link
                  href={`/cities/${newsItem.citySlug}`}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition"
                >
                  📍 {newsItem.cityName}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Article Content */}
          <div className="lg:col-span-2">
            <article className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              
              {/* Featured Image */}
              {newsItem.imageUrl && (
                <div className="mb-8 -mt-8 -mx-8 rounded-t-xl overflow-hidden">
                  <img
                    src={newsItem.imageUrl}
                    alt={newsItem.title}
                    className="w-full h-auto max-h-[500px] object-cover"
                  />
                </div>
              )}

              {/* Article Content */}
              <div className="prose prose-lg max-w-none">
                {contentParagraphs.map((paragraph, index) => (
                  <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Article Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Article ID: {newsItem.id}</span>
                  {newsItem.updatedAt && newsItem.updatedAt > newsItem.publishedAt! && (
                    <span>Last updated: {formatDate(newsItem.updatedAt)}</span>
                  )}
                </div>
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Related News */}
            {relatedNews.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                  Related News
                </h3>
                <div className="space-y-4">
                  {relatedNews.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="block group"
                    >
                      <div className="flex gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                            📰
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {item.isBreaking && (
                              <span className="px-1.5 py-0.5 bg-red-600 text-white text-xs rounded-full">
                                BREAKING
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatShortDate(item.publishedAt)}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 group-hover:text-blue-600 text-sm line-clamp-2">
                            {item.title}
                          </h4>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">Education News Pakistan</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Total News Articles</span>
                  <span className="font-bold text-xl">{stats.totalNews}+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Current Article Views</span>
                  <span className="font-bold text-xl">{newsItem.views?.toLocaleString() || 0}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <Link
                  href="/news"
                  className="block text-center py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                >
                  Browse All News →
                </Link>
              </div>
            </div>

            {/* Share This Article */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Share This Article</h3>
              <div className="flex gap-3">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=https://nextid.pk/news/${newsItem.slug}`}
                  target="_blank"
                  rel="noopener"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition text-center"
                >
                  Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=https://nextid.pk/news/${newsItem.slug}&text=${encodeURIComponent(newsItem.title)}`}
                  target="_blank"
                  rel="noopener"
                  className="flex-1 bg-black text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 transition text-center"
                >
                  Twitter
                </a>
              </div>
              <div className="mt-3">
                <button
                  onClick={copyToClipboard}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                >
                  📋 Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": newsItem.title,
            "description": newsItem.excerpt,
            "image": newsItem.imageUrl || "https://nextid.pk/images/news-og.jpg",
            "datePublished": newsItem.publishedAt?.toISOString(),
            "dateModified": newsItem.updatedAt?.toISOString(),
            "author": {
              "@type": "Person",
              "name": newsItem.author || "NextID.pk"
            },
            "publisher": {
              "@type": "Organization",
              "name": "NextID.pk",
              "logo": {
                "@type": "ImageObject",
                "url": "https://nextid.pk/logo.png"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://nextid.pk/news/${newsItem.slug}`
            },
            "keywords": [
              newsItem.programName,
              newsItem.instituteName,
              newsItem.boardName,
              newsItem.cityName,
              "Education News",
              "Pakistan"
            ].filter(Boolean).join(','),
            "articleSection": "Education",
            "inLanguage": "en-PK",
            "isAccessibleForFree": true,
          })
        }}
      />
    </main>
  );
}