// /cache/cities/cities-detail.cache.ts
import { unstable_cache } from 'next/cache';
import { 
  CityDetail, 
  Institute, 
  Admission, 
  Result, 
  NewsItem, 
  CityStats,
  SeoMetadata 
} from '@/types/cities.types';

export class CitiesDetailCache {
  private readonly REVALIDATE = 86400; // 24 hours
  private readonly TAGS = ['cities-detail'];

  async getCityBySlug(
    slug: string, 
    fetcher: () => Promise<CityDetail | null>
  ): Promise<CityDetail | null> {
    const cachedFn = unstable_cache(
      fetcher,
      [`city-detail-${slug}`],
      {
        revalidate: this.REVALIDATE,
        tags: [...this.TAGS, `city-${slug}`],
      }
    );
    return cachedFn();
  }

  async getSeoMetadata(
    entityType: string,
    entityId: number,
    fetcher: () => Promise<SeoMetadata | null>
  ): Promise<SeoMetadata | null> {
    const cachedFn = unstable_cache(
      fetcher,
      [`city-seo-${entityType}-${entityId}`],
      {
        revalidate: this.REVALIDATE,
        tags: [...this.TAGS, `seo-${entityId}`],
      }
    );
    return cachedFn();
  }

  async getCityStats(
    cityId: number,
    fetcher: () => Promise<CityStats>
  ): Promise<CityStats> {
    const cachedFn = unstable_cache(
      fetcher,
      [`city-stats-${cityId}`],
      {
        revalidate: this.REVALIDATE,
        tags: [...this.TAGS, `stats-${cityId}`],
      }
    );
    return cachedFn();
  }

  async getInstitutesByCity(
    cityId: number,
    limit: number,
    fetcher: () => Promise<Institute[]>
  ): Promise<Institute[]> {
    const cachedFn = unstable_cache(
      fetcher,
      [`city-institutes-${cityId}-${limit}`],
      {
        revalidate: this.REVALIDATE,
        tags: [...this.TAGS, `institutes-${cityId}`],
      }
    );
    return cachedFn();
  }

  async getAdmissionsByCity(
    cityId: number,
    limit: number,
    fetcher: () => Promise<Admission[]>
  ): Promise<Admission[]> {
    const cachedFn = unstable_cache(
      fetcher,
      [`city-admissions-${cityId}-${limit}`],
      {
        revalidate: this.REVALIDATE,
        tags: [...this.TAGS, `admissions-${cityId}`],
      }
    );
    return cachedFn();
  }

  async getResultsByCity(
    cityId: number,
    limit: number,
    fetcher: () => Promise<Result[]>
  ): Promise<Result[]> {
    const cachedFn = unstable_cache(
      fetcher,
      [`city-results-${cityId}-${limit}`],
      {
        revalidate: this.REVALIDATE,
        tags: [...this.TAGS, `results-${cityId}`],
      }
    );
    return cachedFn();
  }

  async getNewsByCity(
    cityId: number,
    limit: number,
    fetcher: () => Promise<NewsItem[]>
  ): Promise<NewsItem[]> {
    const cachedFn = unstable_cache(
      fetcher,
      [`city-news-${cityId}-${limit}`],
      {
        revalidate: this.REVALIDATE,
        tags: [...this.TAGS, `news-${cityId}`],
      }
    );
    return cachedFn();
  }

  async getAvailableYears(
    cityId: number,
    fetcher: () => Promise<number[]>
  ): Promise<number[]> {
    const cachedFn = unstable_cache(
      fetcher,
      [`city-years-${cityId}`],
      {
        revalidate: this.REVALIDATE,
        tags: [...this.TAGS, `years-${cityId}`],
      }
    );
    return cachedFn();
  }
}