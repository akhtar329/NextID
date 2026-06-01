// /services/cities/cities-detail.service.ts
import { CitiesDetailRepository } from '@/repositories/cities/cities-detail.repository';
import { CitiesDetailCache } from '@/cache/cities/cities-detail.cache';
import { 
  CityDetail, 
  Institute, 
  Admission, 
  Result, 
  NewsItem, 
  CityStats,
  SeoMetadata 
} from '@/types/cities.types';

export class CitiesDetailService {
  private repo: CitiesDetailRepository;
  private cache: CitiesDetailCache;

  constructor() {
    this.repo = new CitiesDetailRepository();
    this.cache = new CitiesDetailCache();
  }

  async getCityBySlug(slug: string): Promise<CityDetail | null> {
    return this.cache.getCityBySlug(slug, async () => {
      return await this.repo.getCityBySlug(slug);
    });
  }

  // ✅ Fixed: Changed 'any' to 'SeoMetadata | null'
  async getSeoMetadata(entityType: string, entityId: number): Promise<SeoMetadata | null> {
    return this.cache.getSeoMetadata(entityType, entityId, async () => {
      return await this.repo.getSeoMetadata(entityType, entityId);
    });
  }

  async getCityStats(cityId: number): Promise<CityStats> {
    return this.cache.getCityStats(cityId, async () => {
      return await this.repo.getCityStats(cityId);
    });
  }

  async getInstitutesByCity(cityId: number, limit: number = 6): Promise<Institute[]> {
    return this.cache.getInstitutesByCity(cityId, limit, async () => {
      return await this.repo.getInstitutesByCity(cityId, limit);
    });
  }

  async getAdmissionsByCity(cityId: number, limit: number = 5): Promise<Admission[]> {
    return this.cache.getAdmissionsByCity(cityId, limit, async () => {
      return await this.repo.getAdmissionsByCity(cityId, limit);
    });
  }

  async getResultsByCity(cityId: number, limit: number = 5): Promise<Result[]> {
    return this.cache.getResultsByCity(cityId, limit, async () => {
      return await this.repo.getResultsByCity(cityId, limit);
    });
  }

  async getNewsByCity(cityId: number, limit: number = 5): Promise<NewsItem[]> {
    return this.cache.getNewsByCity(cityId, limit, async () => {
      return await this.repo.getNewsByCity(cityId, limit);
    });
  }

  async getAvailableYears(cityId: number): Promise<number[]> {
    return this.cache.getAvailableYears(cityId, async () => {
      return await this.repo.getAvailableYears(cityId);
    });
  }

  // Get all city data in parallel for single city page
  async getAllCityData(slug: string, limit: number = 6) {
    const city = await this.getCityBySlug(slug);
    
    if (!city) return null;
    
    // ✅ Fixed: Added proper type for seo
    const [seo, stats, institutes, admissions, results, news, years] = await Promise.all([
      this.getSeoMetadata('city', city.id),
      this.getCityStats(city.id),
      this.getInstitutesByCity(city.id, limit),
      this.getAdmissionsByCity(city.id, 5),
      this.getResultsByCity(city.id, 5),
      this.getNewsByCity(city.id, 5),
      this.getAvailableYears(city.id),
    ]);
    
    return {
      city,
      seo, // Now seo has type SeoMetadata | null instead of any
      stats,
      institutes,
      admissions,
      results,
      news,
      years,
    };
  }
}