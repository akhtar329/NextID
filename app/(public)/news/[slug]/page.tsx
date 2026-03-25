// app/(public)/news/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { news, programs, institutes, boards, cities } from '@/app/lib/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import NewsDetailClient from './NewsDetailClient';

// ==================== TYPES ====================
export interface NewsDetail {
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
  views: number | null;
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

export interface RelatedNews {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  isBreaking: boolean | null;
}

// ==================== FORMAT SHORT DATE ====================
function formatShortDate(date: Date | null) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ==================== GET NEWS BY SLUG ====================
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
        views: news.views,
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
  } catch (error) {
    console.error('Error fetching news:', error);
    return null;
  }
}

// ==================== GET RELATED NEWS ====================
async function getRelatedNews(newsItem: NewsDetail, limit = 4): Promise<RelatedNews[]> {
  try {
    const conditions = [];
    
    if (newsItem.programId) {
      conditions.push(eq(news.programId, newsItem.programId));
    } else if (newsItem.instituteId) {
      conditions.push(eq(news.instituteId, newsItem.instituteId));
    } else if (newsItem.boardId) {
      conditions.push(eq(news.boardId, newsItem.boardId));
    } else if (newsItem.cityId) {
      conditions.push(eq(news.cityId, newsItem.cityId));
    }
    
    if (conditions.length === 0) {
      conditions.push(sql`1=1`);
    }
    
    return await db
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
          ...conditions,
          eq(news.status, true),
          sql`${news.id} != ${newsItem.id}`
        )
      )
      .orderBy(desc(news.publishedAt))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching related news:', error);
    return [];
  }
}

// ==================== GET STATS ====================
async function getStats() {
  try {
    const [totalNews] = await db
      .select({ count: sql<number>`count(*)` })
      .from(news)
      .where(eq(news.status, true));

    return {
      totalNews: Number(totalNews?.count) || 0,
    };
  } catch (error) {
    return { totalNews: 0 };
  }
}

// ==================== UPDATE VIEW COUNT ====================
async function incrementViewCount(id: number) {
  try {
    await db
      .update(news)
      .set({ views: sql`${news.views} + 1` })
      .where(eq(news.id, id));
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}

// ==================== GENERATE METADATA ====================
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const newsItem = await getNewsBySlug(slug);

  if (!newsItem) {
    return {
      title: 'News Not Found | NextID.pk',
      description: 'The requested news article could not be found.',
    };
  }

  const relatedEntities = [];
  if (newsItem.programName) relatedEntities.push(newsItem.programName);
  if (newsItem.instituteName) relatedEntities.push(newsItem.instituteName);
  if (newsItem.boardName) relatedEntities.push(newsItem.boardName);
  if (newsItem.cityName) relatedEntities.push(newsItem.cityName);
  
  const title = newsItem.isBreaking 
    ? `🚨 BREAKING: ${newsItem.title} | NextID.pk`
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

// ==================== MAIN PAGE ====================
export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const newsItem = await getNewsBySlug(slug);
  
  if (!newsItem) {
    notFound();
  }

  // Increment view count (fire and forget)
  incrementViewCount(newsItem.id).catch(console.error);

  const [relatedNews, stats] = await Promise.all([
    getRelatedNews(newsItem).catch(() => []),
    getStats().catch(() => ({ totalNews: 0 })),
  ]);

  return (
    <NewsDetailClient 
      newsItem={newsItem} 
      relatedNews={relatedNews} 
      stats={stats} 
    />
  );
}