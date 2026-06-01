import { 
  News, 
  NewsListFilters, 
  NewsListResponse,
  NewsResponse,
  NewsNotFoundError
} from '@/types/news.types';

// Drizzle imports
import { db } from '@/db/db';
import { news } from '@/db/schema';
import { eq, sql, and, desc, gte, lte } from 'drizzle-orm';

// Type for database row
type DbNewsRow = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  imageUrl: string | null;
  tags: string[] | null;
  status: boolean | null;
  publishedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  isFeatured: boolean | null;
  category: string | null;
  author: string | null;
};

// Type for conditions
type Condition = ReturnType<typeof eq> | ReturnType<typeof gte> | ReturnType<typeof lte> | ReturnType<typeof and>;

export class NewsRepository {
  
  // ============ GET ALL NEWS WITH FILTERS ============
  async findAll(filters: NewsListFilters): Promise<News[]> {
    try {
      const { page, limit, category, author, fromDate, toDate } = filters;
      const offset = (page - 1) * limit;
      
      // Build conditions
      const conditions: Condition[] = [];
      
      // Only show published news
      conditions.push(eq(news.status, true));
      
      if (category) {
        conditions.push(eq(news.category, category));
      }
      
      if (author) {
        conditions.push(eq(news.author, author));
      }
      
      if (fromDate) {
        conditions.push(gte(news.publishedAt, fromDate));
      }
      
      if (toDate) {
        conditions.push(lte(news.publishedAt, toDate));
      }
      
      // Execute query
      const result = await db
        .select({
          id: news.id,
          title: news.title,
          slug: news.slug,
          excerpt: news.excerpt,
          content: news.content,
          featuredImage: news.imageUrl,
          tags: news.tags,
          status: news.status,
          publishedAt: news.publishedAt,
          createdAt: news.createdAt,
          updatedAt: news.updatedAt,
          isFeatured: news.isFeatured,
          category: news.category,
          author: news.author,
        })
        .from(news)
        .where(and(...conditions))
        .orderBy(desc(news.publishedAt))
        .limit(limit)
        .offset(offset);
      
      const rows = result as unknown as DbNewsRow[];
      
      // Transform to News type
      const newsList: News[] = rows.map((row) => ({
        id: String(row.id),
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt || '',
        content: row.content,
        featuredImage: row.imageUrl || '',
        tags: row.tags || [],
        status: row.status ? 'published' : 'draft',
        viewCount: 0,
        publishedAt: row.publishedAt || new Date(),
        createdAt: row.createdAt || new Date(),
        updatedAt: row.updatedAt || new Date(),
        isFeatured: row.isFeatured ?? false,
        metaTitle: undefined,
        metaDescription: undefined,
        author: {
          id: row.author || '',
          name: row.author || 'Unknown',
          avatar: undefined,
          email: undefined
        },
        category: {
          id: row.category || '',
          name: row.category || 'Uncategorized',
          slug: (row.category || '').toLowerCase().replace(/ /g, '-'),
          description: undefined
        }
      }));
      
      return newsList;
      
    } catch (error) {
      console.error('Error in findAll repository:', error);
      throw new Error(`Failed to fetch news list: ${error}`);
    }
  }
  
  // ============ GET TOTAL COUNT FOR PAGINATION ============
  async getTotalCount(filters: NewsListFilters): Promise<number> {
    try {
      const { category, author, fromDate, toDate } = filters;
      
      const conditions: Condition[] = [];
      conditions.push(eq(news.status, true));
      
      if (category) {
        conditions.push(eq(news.category, category));
      }
      
      if (author) {
        conditions.push(eq(news.author, author));
      }
      
      if (fromDate) {
        conditions.push(gte(news.publishedAt, fromDate));
      }
      
      if (toDate) {
        conditions.push(lte(news.publishedAt, toDate));
      }
      
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(news)
        .where(and(...conditions));
      
      return Number(result[0]?.count) || 0;
      
    } catch (error) {
      console.error('Error in getTotalCount repository:', error);
      throw new Error(`Failed to get total count: ${error}`);
    }
  }
  
  // ============ GET SINGLE NEWS BY ID OR SLUG ============
  async findOne(idOrSlug: string): Promise<News | null> {
    try {
      // Detect if input is number (ID) or string (slug)
      const isId = /^\d+$/.test(idOrSlug);
      const whereCondition = isId ? eq(news.id, parseInt(idOrSlug)) : eq(news.slug, idOrSlug);
      
      const result = await db
        .select({
          id: news.id,
          title: news.title,
          slug: news.slug,
          excerpt: news.excerpt,
          content: news.content,
          featuredImage: news.imageUrl,
          tags: news.tags,
          status: news.status,
          publishedAt: news.publishedAt,
          createdAt: news.createdAt,
          updatedAt: news.updatedAt,
          isFeatured: news.isFeatured,
          category: news.category,
          author: news.author,
        })
        .from(news)
        .where(and(whereCondition, eq(news.status, true)))
        .limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      const row = result[0] as unknown as DbNewsRow;
      
      const newsItem: News = {
        id: String(row.id),
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt || '',
        content: row.content,
        featuredImage: row.imageUrl || '',
        tags: row.tags || [],
        status: row.status ? 'published' : 'draft',
        viewCount: 0,
        publishedAt: row.publishedAt || new Date(),
        createdAt: row.createdAt || new Date(),
        updatedAt: row.updatedAt || new Date(),
        isFeatured: row.isFeatured ?? false,
        metaTitle: undefined,
        metaDescription: undefined,
        author: {
          id: row.author || '',
          name: row.author || 'Unknown',
          avatar: undefined,
          email: undefined
        },
        category: {
          id: row.category || '',
          name: row.category || 'Uncategorized',
          slug: (row.category || '').toLowerCase().replace(/ /g, '-'),
          description: undefined
        }
      };
      
      return newsItem;
      
    } catch (error) {
      console.error('Error in findOne repository:', error);
      throw new Error(`Failed to fetch news: ${error}`);
    }
  }
  
  // ============ GET RELATED NEWS ============
  async findRelated(newsId: string, limitNumber: number = 5): Promise<News[]> {
    try {
      // First get the current news category
      const currentNews = await this.findOne(newsId);
      if (!currentNews) return [];
      
      const result = await db
        .select({
          id: news.id,
          title: news.title,
          slug: news.slug,
          excerpt: news.excerpt,
          featuredImage: news.imageUrl,
          publishedAt: news.publishedAt,
          author: news.author,
          category: news.category,
        })
        .from(news)
        .where(and(
          eq(news.status, true),
          eq(news.category, currentNews.category.name),
          sql`${news.id} != ${parseInt(newsId)}`
        ))
        .orderBy(desc(news.publishedAt))
        .limit(limitNumber);
      
      const rows = result as unknown as Array<{
        id: number;
        title: string;
        slug: string;
        excerpt: string | null;
        featuredImage: string | null;
        publishedAt: Date | null;
        author: string | null;
        category: string | null;
      }>;
      
      const relatedNews: News[] = rows.map((row) => ({
        id: String(row.id),
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt || '',
        content: '',
        featuredImage: row.featuredImage || '',
        tags: [],
        status: 'published',
        viewCount: 0,
        publishedAt: row.publishedAt || new Date(),
        createdAt: row.publishedAt || new Date(),
        updatedAt: row.publishedAt || new Date(),
        isFeatured: false,
        metaTitle: undefined,
        metaDescription: undefined,
        author: {
          id: row.author || '',
          name: row.author || 'Unknown',
          avatar: undefined,
        },
        category: {
          id: row.category || '',
          name: row.category || 'Uncategorized',
          slug: (row.category || '').toLowerCase().replace(/ /g, '-'),
        }
      }));
      
      return relatedNews;
      
    } catch (error) {
      console.error('Error in findRelated repository:', error);
      return [];
    }
  }
  
  // ============ GET NEWS WITH COMPLETE RESPONSE ============
  async getNewsWithResponse(slugOrId: string): Promise<NewsResponse> {
    const newsItem = await this.findOne(slugOrId);
    
    if (!newsItem) {
      throw new NewsNotFoundError(slugOrId);
    }
    
    const relatedNews = await this.findRelated(newsItem.id, 5);
    
    return {
      data: newsItem,
      relatedNews: relatedNews
    };
  }
  
  // ============ GET LIST WITH COMPLETE RESPONSE ============
  async getListWithResponse(filters: NewsListFilters): Promise<NewsListResponse> {
    const [data, totalItems] = await Promise.all([
      this.findAll(filters),
      this.getTotalCount(filters)
    ]);
    
    const totalPages = Math.ceil(totalItems / filters.limit);
    
    return {
      data,
      pagination: {
        currentPage: filters.page,
        totalPages,
        totalItems,
        itemsPerPage: filters.limit
      },
      filters
    };
  }
}

export const newsRepository = new NewsRepository();