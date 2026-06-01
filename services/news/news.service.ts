import { 
  News, 
  NewsListFilters, 
  NewsListResponse,
  NewsResponse,
  ServiceResponse
} from '@/types/news.types';

import { newsRepository } from '@/repositories/news/news.repository';
import { newsCacheService } from '@/cache/news/news.cache';

// Type for cache result with fromCache property
type CacheResultWithStatus<T> = T & { fromCache: boolean };

export class NewsService {
  
  // ============ GET NEWS LIST WITH CACHE ============
  async getNewsList(filters: NewsListFilters): Promise<ServiceResponse<NewsListResponse>> {
    const startTime = Date.now();
    
    try {
      // Set default pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      
      const cleanFilters: NewsListFilters = {
        ...filters,
        page,
        limit
      };
      
      // Use cache service to get data (cache or database)
      const result = await newsCacheService.getNewsList(
        cleanFilters,
        async () => {
          // This callback runs only when cache miss happens
          return await newsRepository.getListWithResponse(cleanFilters);
        }
      );
      
      return {
        success: true,
        data: result,
        cacheStatus: result.fromCache ? 'hit' : 'miss',
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Error in getNewsList service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch news list',
        cacheStatus: 'miss',
        executionTime: Date.now() - startTime
      };
    }
  }
  
  // ============ GET SINGLE NEWS BY SLUG WITH CACHE ============
  async getNewsBySlug(slug: string): Promise<ServiceResponse<NewsResponse>> {
    const startTime = Date.now();
    
    try {
      // Use cache service to get data
      const result = await newsCacheService.getNewsDetail(
        slug,
        async () => {
          // This callback runs only when cache miss happens
          return await newsRepository.getNewsWithResponse(slug);
        }
      );
      
      return {
        success: true,
        data: result,
        cacheStatus: result.fromCache ? 'hit' : 'miss',
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Error in getNewsBySlug service:', error);
      
      if (error instanceof Error && error.name === 'NewsNotFoundError') {
        return {
          success: false,
          error: 'News not found',
          cacheStatus: 'miss',
          executionTime: Date.now() - startTime
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch news',
        cacheStatus: 'miss',
        executionTime: Date.now() - startTime
      };
    }
  }
  
  // ============ GET NEWS BY ID WITH CACHE ============
  async getNewsById(id: string): Promise<ServiceResponse<NewsResponse>> {
    const startTime = Date.now();
    
    try {
      const result = await newsCacheService.getNewsDetail(
        id,
        async () => {
          return await newsRepository.getNewsWithResponse(id);
        }
      );
      
      return {
        success: true,
        data: result,
        cacheStatus: result.fromCache ? 'hit' : 'miss',
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Error in getNewsById service:', error);
      
      if (error instanceof Error && error.name === 'NewsNotFoundError') {
        return {
          success: false,
          error: 'News not found',
          cacheStatus: 'miss',
          executionTime: Date.now() - startTime
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch news',
        cacheStatus: 'miss',
        executionTime: Date.now() - startTime
      };
    }
  }
  
  // ============ GET RELATED NEWS ============
  async getRelatedNews(newsId: string, limit: number = 5): Promise<ServiceResponse<News[]>> {
    const startTime = Date.now();
    
    try {
      const result = await newsCacheService.getRelatedNews(
        newsId,
        limit,
        async () => {
          return await newsRepository.findRelated(newsId, limit);
        }
      );
      
      // Check if result has fromCache property
      const cacheResult = result as unknown as CacheResultWithStatus<News[]>;
      
      return {
        success: true,
        data: result,
        cacheStatus: cacheResult.fromCache ? 'hit' : 'miss',
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Error in getRelatedNews service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch related news',
        cacheStatus: 'miss',
        executionTime: Date.now() - startTime
      };
    }
  }
  
  // ============ INVALIDATE CACHE ON ADMIN UPDATE ============
  async invalidateNewsCache(newsId?: string, categoryId?: string): Promise<void> {
    await newsCacheService.invalidateNewsCache(newsId, categoryId);
    console.log(`🔄 Cache invalidated for news${newsId ? `: ${newsId}` : ''}`);
  }
  
  // ============ GET FRESH DATA WITHOUT CACHE (FOR ADMIN PREVIEW) ============
  async getFreshNewsList(filters: NewsListFilters): Promise<ServiceResponse<NewsListResponse>> {
    const startTime = Date.now();
    
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      
      const cleanFilters: NewsListFilters = {
        ...filters,
        page,
        limit
      };
      
      // Skip cache, get directly from database
      const data = await newsRepository.getListWithResponse(cleanFilters);
      
      return {
        success: true,
        data,
        cacheStatus: 'miss',
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Error in getFreshNewsList service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch news list',
        cacheStatus: 'miss',
        executionTime: Date.now() - startTime
      };
    }
  }
  
  // ============ GET FRESH SINGLE NEWS WITHOUT CACHE (FOR ADMIN PREVIEW) ============
  async getFreshNewsBySlug(slug: string): Promise<ServiceResponse<NewsResponse>> {
    const startTime = Date.now();
    
    try {
      // Skip cache, get directly from database
      const data = await newsRepository.getNewsWithResponse(slug);
      
      return {
        success: true,
        data,
        cacheStatus: 'miss',
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Error in getFreshNewsBySlug service:', error);
      
      if (error instanceof Error && error.name === 'NewsNotFoundError') {
        return {
          success: false,
          error: 'News not found',
          cacheStatus: 'miss',
          executionTime: Date.now() - startTime
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch news',
        cacheStatus: 'miss',
        executionTime: Date.now() - startTime
      };
    }
  }
  
  // ============ WARM UP CACHE (FOR CRON JOB) ============
  async warmupCache(popularSlugs: string[]): Promise<void> {
    console.log(`🔥 Starting cache warmup for ${popularSlugs.length} news items...`);
    
    for (const slug of popularSlugs) {
      try {
        await this.getNewsBySlug(slug);
        console.log(`✅ Cache warmed up for: ${slug}`);
      } catch (error) {
        console.error(`❌ Failed to warmup cache for: ${slug}`, error);
      }
    }
    
    console.log(`🔥 Cache warmup completed!`);
  }
  
  // ============ GET CACHE STATS (FOR MONITORING) ============
  async getCacheStats() {
    const { NewsFileCache } = await import('@/cache/news/news.cache');
    const cache = new NewsFileCache();
    return await cache.getStats();
  }
}

// Export singleton instance
export const newsService = new NewsService();