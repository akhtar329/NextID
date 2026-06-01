// /cache/cities/cities.cache.ts
import { unstable_cache } from 'next/cache';
import { CityWithStats } from '@/types/cities.types';

export class CitiesCache {
  private readonly REVALIDATE = 86400; // 24 hours in seconds
  private readonly TAGS = ['cities'];

  async getOrSet(fetcher: () => Promise<CityWithStats[]>): Promise<CityWithStats[]> {
    // unstable_cache returns a function that we need to call
    const cachedFn = unstable_cache(
      fetcher,
      ['cities-with-stats'],
      {
        revalidate: this.REVALIDATE,
        tags: this.TAGS,
      }
    );
    
    // Execute the cached function
    return cachedFn();
  }
}