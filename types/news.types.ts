// ============ CACHE RELATED TYPES ============
export type CacheTTL = 1800 | 21600 | 43200; // seconds
// 1800 = 30 min, 21600 = 6 hours, 43200 = 12 hours

export interface CacheOptions {
  ttl: CacheTTL;
  tags?: string[];
  staleWhileRevalidate?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  tags: string[];
}

// ============ NEWS RELATED TYPES ============
export interface NewsAuthor {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface News {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: NewsAuthor;
  category: NewsCategory;
  tags: string[];
  tag?: string;  // Single tag filter
  status: 'published' | 'draft' | 'archived';
  viewCount: number;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isFeatured: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

// ============ LIST/COLLECTION TYPES ============
export interface NewsListFilters {
  category?: string;
  tag?: string;
  author?: string;
  fromDate?: Date;
  toDate?: Date;
  status?: 'published' | 'draft' | 'archived';
  isFeatured?: boolean;
  page: number;
  limit: number;
}

export interface NewsListResponse {
  data: News[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  filters: NewsListFilters;
  cacheInfo?: {
    servedFrom: 'cache' | 'database';
    cachedAt?: Date;
    expiresAt?: Date;
  };
}

// ============ SINGLE NEWS TYPES ============
export interface NewsResponse {
  data: News;
  relatedNews?: News[];
  cacheInfo?: {
    servedFrom: 'cache' | 'database';
    cachedAt?: Date;
    expiresAt?: Date;
  };
}

// ============ SERVICE RESPONSE TYPES ============
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cacheStatus: 'hit' | 'miss' | 'stale';
  executionTime: number; // milliseconds
}

// ============ REPOSITORY TYPES ============
export interface NewsRepositoryInterface {
  findAll(filters: NewsListFilters): Promise<News[]>;
  findOne(idOrSlug: string): Promise<News | null>;
  findRelated(newsId: string, limit: number): Promise<News[]>;
  getTotalCount(filters: NewsListFilters): Promise<number>;
  updateViewCount(newsId: string): Promise<void>;
}

// ============ CACHE KEY TYPES ============
export type CacheKeyPattern = 
  | `news:list:${string}`
  | `news:detail:${string}`
  | `news:related:${string}`;

export interface CacheKeyGenerator {
  getListKey(filters: NewsListFilters): string;
  getDetailKey(idOrSlug: string): string;
  getRelatedKey(newsId: string, limit: number): string;
}

// ============ TTL CONFIGURATION ============
export const NEWS_CACHE_TTL = {
  HOME_PAGE: 1800 as CacheTTL,        // 30 minutes
  NEWS_LIST: 21600 as CacheTTL,       // 6 hours
  NEWS_DETAIL: 43200 as CacheTTL,     // 12 hours
  RELATED_NEWS: 43200 as CacheTTL,    // 12 hours
} as const;

// ============ CACHE TAGS ============
export const CACHE_TAGS = {
  NEWS_LIST: 'news:list',
  NEWS_DETAIL: 'news:detail',
  NEWS_RELATED: 'news:related',
  HOME_PAGE: 'home',
  ALL_NEWS: 'news:all',
} as const;

// ============ ERROR TYPES ============
export class NewsNotFoundError extends Error {
  constructor(idOrSlug: string) {
    super(`News with id/slug "${idOrSlug}" not found`);
    this.name = 'NewsNotFoundError';
  }
}

export class CacheError extends Error {
  constructor(message: string) {
    super(`Cache error: ${message}`);
    this.name = 'CacheError';
  }
}