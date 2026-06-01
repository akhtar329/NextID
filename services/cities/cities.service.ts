// /services/cities/cities.service.ts
import { CitiesRepository } from '@/repositories/cities/cities.repository';
import { CitiesCache } from '@/cache/cities/cities.cache';
import { CityWithStats } from '@/types/cities.types';

export class CitiesService {
  private repo: CitiesRepository;
  private cache: CitiesCache;

  constructor() {
    this.repo = new CitiesRepository();
    this.cache = new CitiesCache();
  }

  async getAllCitiesWithStats(): Promise<CityWithStats[]> {
    return this.cache.getOrSet(async () => {
      console.log('🔄 Fetching fresh cities data from database...');
      
      const allCities = await this.repo.getAllCities();
      console.log(`📊 Found ${allCities.length} cities in database`);
      
      if (allCities.length === 0) {
        console.warn('⚠️ No cities found! Check your database.');
        return [];
      }
      
      const cityIds = allCities.map(c => c.id);
      
      const [institutesMap, admissionsMap, newsMap] = await Promise.all([
        this.repo.getInstitutesCountByCities(cityIds),
        this.repo.getAdmissionsCountByCities(cityIds),
        this.repo.getNewsCountByCities(cityIds),
      ]);
      
      const citiesWithStats: CityWithStats[] = allCities.map(city => {
        const institutesCount = institutesMap.get(city.id) || 0;
        const admissionsCount = admissionsMap.get(city.id) || 0;
        const newsCount = newsMap.get(city.id) || 0;
        const resultsCount = 0;
        const totalCount = institutesCount + admissionsCount + resultsCount + newsCount;
        
        return {
          ...city,
          institutesCount,
          admissionsCount,
          resultsCount,
          newsCount,
          totalCount,
        };
      });
      
      return citiesWithStats.sort((a, b) => {
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return b.totalCount - a.totalCount;
      });
    });
  }
}