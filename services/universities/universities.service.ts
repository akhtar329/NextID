// /services/universities/universities.service.ts (UPDATED)
import { UniversitiesRepository } from '@/repositories/universities/universities.repo'; // ✅ .repo.ts not .repository.ts
import { UniversitiesCache } from '@/cache/universities/universities.cache';
import { University, UniversityFilters, UniversityStats } from '@/types/universities.types';

export class UniversitiesService {
  private repo: UniversitiesRepository;
  private cache: UniversitiesCache;

  constructor() {
    this.repo = new UniversitiesRepository();
    this.cache = new UniversitiesCache();
  }

  async getUniversities(filters: UniversityFilters): Promise<University[]> {
    return this.cache.getUniversities(filters, async () => {
      const universities = await this.repo.getUniversities(filters);
      
      const UNIVERSITY_RANKINGS: Record<string, number> = {
        'nust': 1, 'lums': 2, 'fast': 3, 'pu': 4, 'comsats': 5,
        'ku': 6, 'uet': 7, 'iba': 8, 'giki': 9, 'air': 10,
      };
      
      const universitiesWithRanking = universities.map(uni => ({
        ...uni,
        ranking: UNIVERSITY_RANKINGS[uni.slug.toLowerCase()] || 999,
      }));
      
      return universitiesWithRanking.sort((a, b) => (a.ranking || 999) - (b.ranking || 999));
    });
  }

  async getUniversityStats(): Promise<UniversityStats> {
    return this.cache.getUniversityStats(async () => {
      return await this.repo.getUniversityStats();
    });
  }

  async getUniversityBySlug(slug: string): Promise<University | null> {
    return this.cache.getUniversityBySlug(slug, async () => {
      return await this.repo.getUniversityBySlug(slug);
    });
  }
}