import { 
  NewsListFilters, 
  News, 
  NewsListResponse,
  NewsResponse,
  CacheEntry,
  CacheOptions,
  NEWS_CACHE_TTL,
  CACHE_TAGS,
  CacheKeyGenerator
} from '@/types/news.types';

// ============ CACHE KEY GENERATOR ============
export class NewsCacheKeyGenerator implements CacheKeyGenerator {
  // List key: news:list:page=1_limit=10_category=tech
  getListKey(filters: NewsListFilters): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((acc, key) => {
        const value = filters[key as keyof NewsListFilters];
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string | number | boolean | Date>);
    
    return `news:list:${JSON.stringify(sortedFilters)}`;
  }

  // Detail key: news:detail:slug-123 OR news:detail:id-456
  getDetailKey(idOrSlug: string): string {
    // Detect if it's a slug or ID
    const isSlug = !idOrSlug.match(/^[0-9a-fA-F-]{36}$/); // UUID check
    const prefix = isSlug ? 'slug' : 'id';
    return `news:detail:${prefix}:${idOrSlug}`;
  }

  // Related key: news:related:newsId_123:limit_5
  getRelatedKey(newsId: string, limit: number): string {
    return `news:related:${newsId}:limit_${limit}`;
  }
}

// ============ CACHE STORAGE (File-based for Neon saving) ============
import fs from 'fs/promises';
import path from 'path';

export class NewsFileCache {
  private cacheDir: string;
  private keyGenerator: NewsCacheKeyGenerator;

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'cache', 'news');
    this.keyGenerator = new NewsCacheKeyGenerator();
    this.initCacheDir();
  }

  // Initialize cache directory
  private async initCacheDir(): Promise<void> {
    try {
      await fs.access(this.cacheDir);
    } catch {
      await fs.mkdir(this.cacheDir, { recursive: true });
    }
  }

  // Get cache file path
  private getCacheFilePath(key: string): string {
    // Create safe filename
    const safeKey = Buffer.from(key).toString('base64').replace(/[/:=]/g, '_');
    return path.join(this.cacheDir, `${safeKey}.json`);
  }

  // Get data from cache
  async get<T>(key: string): Promise<T | null> {
    try {
      const filePath = this.getCacheFilePath(key);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(fileContent);
      
      // Check if cache is expired
      if (Date.now() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }
      
      console.log(`✅ Cache HIT: ${key}`);
      return entry.data;
    } catch {
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    }
  }

  // Set data to cache
  async set<T>(
    key: string, 
    data: T, 
    options: CacheOptions
  ): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (options.ttl * 1000),
        tags: options.tags || []
      };
      
      const filePath = this.getCacheFilePath(key);
      await fs.writeFile(filePath, JSON.stringify(entry, null, 2), 'utf-8');
      console.log(`💾 Cache SET: ${key} (TTL: ${options.ttl}s)`);
    } catch (error) {
      console.error(`Failed to set cache: ${key}`, error);
    }
  }

  // Delete single cache entry
  async delete(key: string): Promise<void> {
    try {
      const filePath = this.getCacheFilePath(key);
      await fs.unlink(filePath);
      console.log(`🗑️ Cache DELETE: ${key}`);
    } catch {
      // File doesn't exist, ignore
    }
  }

  // Delete all cache entries with specific tag
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const entry: CacheEntry<unknown> = JSON.parse(fileContent);
        
        if (entry.tags.includes(tag)) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
      
      console.log(`🗑️ Cache INVALIDATED by tag: ${tag} (${deletedCount} entries)`);
    } catch (error) {
      console.error(`Failed to invalidate by tag: ${tag}`, error);
    }
  }

  // Delete multiple tags at once
  async invalidateTags(tags: string[]): Promise<void> {
    await Promise.all(tags.map(tag => this.invalidateByTag(tag)));
  }

  // Clear all news cache
  async clearAllNewsCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(files.map(file => fs.unlink(path.join(this.cacheDir, file))));
      console.log(`🗑️ All news cache cleared (${files.length} entries)`);
    } catch (error) {
      console.error('Failed to clear news cache', error);
    }
  }

  // Get cache stats
  async getStats(): Promise<{
    totalEntries: number;
    keys: string[];
    tags: Record<string, number>;
  }> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const tags: Record<string, number> = {};
      
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const entry: CacheEntry<unknown> = JSON.parse(fileContent);
        
        entry.tags.forEach(tag => {
          tags[tag] = (tags[tag] || 0) + 1;
        });
      }
      
      return {
        totalEntries: files.length,
        keys: files,
        tags
      };
    } catch {
      return { totalEntries: 0, keys: [], tags: {} };
    }
  }
}

// ============ CACHE SERVICE (Main Decision Maker) ============
export class NewsCacheService {
  private fileCache: NewsFileCache;
  private keyGenerator: NewsCacheKeyGenerator;

  constructor() {
    this.fileCache = new NewsFileCache();
    this.keyGenerator = new NewsCacheKeyGenerator();
  }

  // Get news list with cache strategy
  async getNewsList(
    filters: NewsListFilters,
    fetchFromDB: () => Promise<NewsListResponse>
  ): Promise<NewsListResponse & { fromCache: boolean }> {
    const cacheKey = this.keyGenerator.getListKey(filters);
    
    // Try to get from cache
    const cachedData = await this.fileCache.get<NewsListResponse>(cacheKey);
    
    if (cachedData) {
      return {
        ...cachedData,
        fromCache: true
      };
    }
    
    // Fetch from database
    console.log(`📡 Fetching news list from DATABASE`);
    const freshData = await fetchFromDB();
    
    // Store in cache (6 hours for news list)
    await this.fileCache.set(cacheKey, freshData, {
      ttl: NEWS_CACHE_TTL.NEWS_LIST,
      tags: [CACHE_TAGS.NEWS_LIST, CACHE_TAGS.ALL_NEWS]
    });
    
    return {
      ...freshData,
      fromCache: false
    };
  }

  // Get single news with cache strategy
  async getNewsDetail(
    slugOrId: string,
    fetchFromDB: () => Promise<NewsResponse>
  ): Promise<NewsResponse & { fromCache: boolean }> {
    const cacheKey = this.keyGenerator.getDetailKey(slugOrId);
    
    // Try to get from cache
    const cachedData = await this.fileCache.get<NewsResponse>(cacheKey);
    
    if (cachedData) {
      return {
        ...cachedData,
        fromCache: true
      };
    }
    
    // Fetch from database
    console.log(`📡 Fetching news detail from DATABASE: ${slugOrId}`);
    const freshData = await fetchFromDB();
    
    // Store in cache (12 hours for news detail)
    await this.fileCache.set(cacheKey, freshData, {
      ttl: NEWS_CACHE_TTL.NEWS_DETAIL,
      tags: [CACHE_TAGS.NEWS_DETAIL, `news:detail:${freshData.data.id}`]
    });
    
    return {
      ...freshData,
      fromCache: false
    };
  }

  // Get related news with cache strategy
  async getRelatedNews(
    newsId: string,
    limit: number,
    fetchFromDB: () => Promise<News[]>
  ): Promise<News[] & { fromCache: boolean }> {
    const cacheKey = this.keyGenerator.getRelatedKey(newsId, limit);
    
    // Try to get from cache
    const cachedData = await this.fileCache.get<News[]>(cacheKey);
    
    if (cachedData) {
      return Object.assign(cachedData, { fromCache: true });
    }
    
    // Fetch from database
    console.log(`📡 Fetching related news from DATABASE: ${newsId}`);
    const freshData = await fetchFromDB();
    
    // Store in cache (12 hours for related news)
    await this.fileCache.set(cacheKey, freshData, {
      ttl: NEWS_CACHE_TTL.RELATED_NEWS,
      tags: [CACHE_TAGS.NEWS_RELATED, `news:related:${newsId}`]
    });
    
    return Object.assign(freshData, { fromCache: false });
  }

  // Invalidate cache on admin update
  async invalidateNewsCache(newsId?: string, categoryId?: string): Promise<void> {
    const tagsToInvalidate: string[] = [
      CACHE_TAGS.NEWS_LIST,
      CACHE_TAGS.HOME_PAGE,
      CACHE_TAGS.ALL_NEWS
    ];
    
    if (newsId) {
      tagsToInvalidate.push(`news:detail:${newsId}`);
      tagsToInvalidate.push(`news:related:${newsId}`);
    }
    
    if (categoryId) {
      tagsToInvalidate.push(`news:list:category:${categoryId}`);
    }
    
    await this.fileCache.invalidateTags(tagsToInvalidate);
    console.log(`🔄 News cache invalidated for: ${tagsToInvalidate.join(', ')}`);
  }

  // Warm up popular cache (for cron job)
  async warmupCache(popularSlugs: string[]): Promise<void> {
    console.log(`🔥 Warming up cache for ${popularSlugs.length} popular news items`);
    // This will be implemented in service layer
    // Service will be called to pre-fetch these items
  }
}

// Export singleton instance
export const newsCacheService = new NewsCacheService();