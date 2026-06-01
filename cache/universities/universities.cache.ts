// /cache/universities/universities.cache.ts
import { unstable_cache } from 'next/cache';
import { University, UniversityFilters, UniversityStats } from '@/types/universities.types';

export class UniversitiesCache {
  private readonly REVALIDATE = 86400;

  async getUniversities(
    filters: UniversityFilters,
    fetcher: () => Promise<University[]>
  ): Promise<University[]> {
    const cacheKey = `universities-list-${JSON.stringify(filters)}`;
    
    return unstable_cache(
      fetcher,
      [cacheKey],
      {
        revalidate: this.REVALIDATE,
        tags: ['universities'],
      }
    )();
  }

  async getUniversityStats(
    fetcher: () => Promise<UniversityStats>
  ): Promise<UniversityStats> {
    return unstable_cache(
      fetcher,
      ['universities-stats'],
      {
        revalidate: this.REVALIDATE,
        tags: ['universities-stats'],
      }
    )();
  }

  async getUniversityBySlug(
    slug: string,
    fetcher: () => Promise<University | null>
  ): Promise<University | null> {
    return unstable_cache(
      fetcher,
      [`university-${slug}`],
      {
        revalidate: this.REVALIDATE,
        tags: [`university-${slug}`],
      }
    )();
  }
}