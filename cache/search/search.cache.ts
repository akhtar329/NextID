import { SearchParams, SearchResponse } from '@/types/search.types';

const cacheStore = new Map<string, { data: SearchResponse; expiry: number }>();

export class SearchCache {
  private ttl = 300; // 5 seconds (ya aap 300 seconds bhi rakh sakte ho)

  private generateKey(params: SearchParams): string {
    return `search:${params.query}:${params.page}:${params.type}`;
  }

  get(params: SearchParams): SearchResponse | null {
    const key = this.generateKey(params);
    const cached = cacheStore.get(key);
    
    if (!cached) return null;
    if (Date.now() > cached.expiry) {
      cacheStore.delete(key);
      return null;
    }
    
    return cached.data;
  }

  set(params: SearchParams, data: SearchResponse): void {
    const key = this.generateKey(params);
    cacheStore.set(key, {
      data,
      expiry: Date.now() + (this.ttl * 1000)
    });
  }

  clear(query?: string): void {
    if (query) {
      // Clear only specific query cache
      for (const key of cacheStore.keys()) {
        if (key.includes(`search:${query}`)) {
          cacheStore.delete(key);
        }
      }
    } else {
      cacheStore.clear();
    }
  }
}