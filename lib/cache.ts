import { unstable_cache } from 'next/cache';
import { db } from '@/db/db';
import { news } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

// ✅ NEWS LIST (single query)
export const getNewsList = unstable_cache(
  async () => {
    const data = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        excerpt: news.excerpt,
        imageUrl: news.imageUrl,
        isBreaking: news.isBreaking,
        isFeatured: news.isFeatured,
        viewCount: news.viewCount,
        publishedAt: news.publishedAt,
      })
      .from(news)
      .where(eq(news.status, true))
      .orderBy(desc(news.publishedAt))
      .limit(25);

    return data;
  },
  ['news-list'],
  { revalidate: 86400 }
);

// ✅ SINGLE NEWS (cached, reusable in metadata + page)
export const getNewsBySlugCached = unstable_cache(
  async (slug: string) => {
    const [item] = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        content: news.content,
        excerpt: news.excerpt,
        imageUrl: news.imageUrl,
        author: news.author,
        viewCount: news.viewCount,
        publishedAt: news.publishedAt,
      })
      .from(news)
      .where(eq(news.slug, slug))
      .limit(1);

    return item || null;
  },
  ['news-slug'],
  { revalidate: 86400 }
);

// ✅ RELATED + TRENDING (simple, no overthinking)
export const getSidebarData = unstable_cache(
  async (currentId: number) => {
    const [related, trending] = await Promise.all([
      db
        .select({
          id: news.id,
          title: news.title,
          slug: news.slug,
          imageUrl: news.imageUrl,
          publishedAt: news.publishedAt,
        })
        .from(news)
        .where(sql`${news.id} != ${currentId}`)
        .orderBy(desc(news.publishedAt))
        .limit(5),

      db
        .select({
          id: news.id,
          title: news.title,
          slug: news.slug,
          viewCount: news.viewCount,
        })
        .from(news)
        .where(eq(news.status, true))
        .orderBy(desc(news.viewCount))
        .limit(5),
    ]);

    return { related, trending };
  },
  ['news-sidebar'],
  { revalidate: 86400 }
);