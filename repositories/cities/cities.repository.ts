// /repositories/cities/cities.repository.ts
import { db } from '@/db/db';
import { cities, institutes, admissions, news } from '@/db/schema';
import { eq, and, count, inArray } from 'drizzle-orm';
import { City } from '@/types/cities.types';

export class CitiesRepository {
  async getAllCities(): Promise<City[]> {
    return await db
      .select({
        id: cities.id,
        name: cities.name,
        slug: cities.slug,
        province: cities.province,
        isPopular: cities.isPopular,
        status: cities.status,
        createdAt: cities.createdAt,
      })
      .from(cities)
      .where(eq(cities.status, true))
      .orderBy(cities.name);
  }

  async getInstitutesCountByCities(cityIds: number[]): Promise<Map<number, number>> {
    if (cityIds.length === 0) return new Map();
    
    const counts = await db
      .select({
        cityId: institutes.cityId,
        count: count(),
      })
      .from(institutes)
      .where(
        and(
          eq(institutes.status, true),
          inArray(institutes.cityId, cityIds)
        )
      )
      .groupBy(institutes.cityId);
    
    const result = new Map<number, number>();
    counts.forEach(c => {
      if (c.cityId !== null) {
        result.set(c.cityId, Number(c.count));
      }
    });
    return result;
  }

  async getAdmissionsCountByCities(cityIds: number[]): Promise<Map<number, number>> {
    if (cityIds.length === 0) return new Map();
    
    const counts = await db
      .select({
        cityId: institutes.cityId,
        count: count(),
      })
      .from(admissions)
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .where(
        and(
          eq(admissions.status, 'Open'),
          inArray(institutes.cityId, cityIds)
        )
      )
      .groupBy(institutes.cityId);
    
    const result = new Map<number, number>();
    counts.forEach(c => {
      if (c.cityId !== null) {
        result.set(c.cityId, Number(c.count));
      }
    });
    return result;
  }

  async getNewsCountByCities(cityIds: number[]): Promise<Map<number, number>> {
    if (cityIds.length === 0) return new Map();
    
    const counts = await db
      .select({
        cityId: news.cityId,
        count: count(),
      })
      .from(news)
      .where(
        and(
          eq(news.status, true),
          inArray(news.cityId, cityIds)
        )
      )
      .groupBy(news.cityId);
    
    const result = new Map<number, number>();
    counts.forEach(c => {
      if (c.cityId !== null) {
        result.set(c.cityId, Number(c.count));
      }
    });
    return result;
  }

  async getCityBySlug(slug: string): Promise<City | undefined> {
    const result = await db
      .select({
        id: cities.id,
        name: cities.name,
        slug: cities.slug,
        province: cities.province,
        isPopular: cities.isPopular,
        status: cities.status,
        createdAt: cities.createdAt,
      })
      .from(cities)
      .where(and(eq(cities.slug, slug), eq(cities.status, true)))
      .limit(1);
    
    return result[0];
  }

  async getPopularCities(): Promise<City[]> {
    return await db
      .select({
        id: cities.id,
        name: cities.name,
        slug: cities.slug,
        province: cities.province,
        isPopular: cities.isPopular,
        status: cities.status,
        createdAt: cities.createdAt,
      })
      .from(cities)
      .where(and(eq(cities.status, true), eq(cities.isPopular, true)))
      .orderBy(cities.name);
  }
}