// /repositories/cities/cities-detail.repository.ts
import { db } from '@/db/db';
import { cities, institutes, admissions, results, news, seoMetadata } from '@/db/schema';
import { eq, and, count, inArray, desc } from 'drizzle-orm'; // ✅ Removed 'sql'
import { 
  CityDetail, 
  Institute,
  Admission,
  Result,
  NewsItem,
  CityStats,
  SeoMetadata
} from '@/types/cities.types';

export class CitiesDetailRepository {
  
  /**
   * Get complete city details by slug for single city page
   */
  async getCityBySlug(slug: string): Promise<CityDetail | null> {
    try {
      const [city] = await db
        .select({
          id: cities.id,
          name: cities.name,
          slug: cities.slug,
          province: cities.province,
          description: cities.description,
          educationOverview: cities.educationOverview,
          imageUrl: cities.imageUrl,
          thumbnailUrl: cities.thumbnailUrl,
          latitude: cities.latitude,
          longitude: cities.longitude,
          population: cities.population,
          area: cities.area,
          isPopular: cities.isPopular,
          status: cities.status,
          createdAt: cities.createdAt,
        })
        .from(cities)
        .where(and(eq(cities.slug, slug), eq(cities.status, true)))
        .limit(1);
      
      return city || null;
    } catch (error) {
      console.error('Error in getCityBySlug:', error);
      return null;
    }
  }

  /**
   * Get SEO metadata for city
   */
  async getSeoMetadata(entityType: string, entityId: number): Promise<SeoMetadata | null> {
    try {
      const [seo] = await db
        .select({
          id: seoMetadata.id,
          entityType: seoMetadata.entityType,
          entityId: seoMetadata.entityId,
          metaTitle: seoMetadata.metaTitle,
          metaDescription: seoMetadata.metaDescription,
          metaKeywords: seoMetadata.metaKeywords,
          // ✅ Add keywords to match the interface
          keywords: seoMetadata.metaKeywords, // Map metaKeywords to keywords
          canonicalUrl: seoMetadata.canonicalUrl,
          robots: seoMetadata.robots,
          schemaMarkup: seoMetadata.schemaMarkup,
          ogTitle: seoMetadata.ogTitle,
          ogDescription: seoMetadata.ogDescription,
          ogImage: seoMetadata.ogImage,
          ogType: seoMetadata.ogType,
          twitterCard: seoMetadata.twitterCard,
          twitterTitle: seoMetadata.twitterTitle,
          twitterDescription: seoMetadata.twitterDescription,
          twitterImage: seoMetadata.twitterImage,
          variation: seoMetadata.variation,
          createdAt: seoMetadata.createdAt,
          updatedAt: seoMetadata.updatedAt,
        })
        .from(seoMetadata)
        .where(
          and(
            eq(seoMetadata.entityType, entityType),
            eq(seoMetadata.entityId, entityId)
          )
        )
        .limit(1);
      
      return seo || null;
    } catch (error) {
      console.error('Error in getSeoMetadata:', error);
      return null;
    }
  }

  /**
   * Get statistics for a city
   */
  async getCityStats(cityId: number): Promise<CityStats> {
    try {
      const [institutesCount] = await db
        .select({ count: count() })
        .from(institutes)
        .where(
          and(
            eq(institutes.cityId, cityId),
            eq(institutes.status, true)
          )
        );

      const [admissionsCount] = await db
        .select({ count: count() })
        .from(admissions)
        .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
        .where(
          and(
            eq(institutes.cityId, cityId),
            eq(admissions.status, 'Open')
          )
        );

      const [resultsCount] = await db
        .select({ count: count() })
        .from(results)
        .innerJoin(institutes, eq(results.instituteId, institutes.id))
        .where(eq(institutes.cityId, cityId));

      const [newsCount] = await db
        .select({ count: count() })
        .from(news)
        .where(eq(news.cityId, cityId));

      return {
        institutes: Number(institutesCount?.count) || 0,
        admissions: Number(admissionsCount?.count) || 0,
        results: Number(resultsCount?.count) || 0,
        news: Number(newsCount?.count) || 0,
      };
    } catch (error) {
      console.error('Error in getCityStats:', error);
      return { institutes: 0, admissions: 0, results: 0, news: 0 };
    }
  }

  /**
   * Get institutes in a city with their program counts
   */
  async getInstitutesByCity(cityId: number, limit: number = 6): Promise<Institute[]> {
    try {
      const institutesList = await db
        .select({
          id: institutes.id,
          name: institutes.name,
          slug: institutes.slug,
          type: institutes.type,
          logo: institutes.logo,
          isFeatured: institutes.isFeatured,
        })
        .from(institutes)
        .where(
          and(
            eq(institutes.cityId, cityId),
            eq(institutes.status, true)
          )
        )
        .orderBy(desc(institutes.isFeatured), institutes.name)
        .limit(limit);

      if (institutesList.length === 0) return [];

      const instituteIds = institutesList.map(i => i.id);
      
      const [admissionsCounts, resultsCounts] = await Promise.all([
        this.getAdmissionsCounts(instituteIds),
        this.getResultsCounts(instituteIds)
      ]);

      return institutesList.map(inst => ({
        ...inst,
        programsCount: 0, // Will be implemented when programOfferings table is ready
        admissionsCount: admissionsCounts.get(inst.id) || 0,
        resultsCount: resultsCounts.get(inst.id) || 0,
      }));
    } catch (error) {
      console.error('Error in getInstitutesByCity:', error);
      return [];
    }
  }

  /**
   * Get open admissions in a city
   */
  async getAdmissionsByCity(cityId: number, limit: number = 5): Promise<Admission[]> {
    try {
      const admissionsList = await db
        .select({
          id: admissions.id,
          slug: admissions.slug,
          instituteName: institutes.name,
          instituteSlug: institutes.slug,
          instituteLogo: institutes.logo,
          year: admissions.year,
          session: admissions.session,
          status: admissions.status,
          expectedCloseDate: admissions.expectedCloseDate,
        })
        .from(admissions)
        .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
        .where(
          and(
            eq(institutes.cityId, cityId),
            eq(admissions.status, 'Open')
          )
        )
        .orderBy(admissions.expectedCloseDate)
        .limit(limit);
      
      return admissionsList;
    } catch (error) {
      console.error('Error in getAdmissionsByCity:', error);
      return [];
    }
  }

  /**
   * Get results in a city
   */
  async getResultsByCity(cityId: number, limit: number = 5): Promise<Result[]> {
    try {
      const resultsList = await db
        .select({
          id: results.id,
          title: results.title,
          slug: results.slug,
          instituteName: institutes.name,
          instituteSlug: institutes.slug,
          year: results.year,
          resultDate: results.resultDate,
          isPopular: results.isPopular,
        })
        .from(results)
        .innerJoin(institutes, eq(results.instituteId, institutes.id))
        .where(
          and(
            eq(institutes.cityId, cityId),
            eq(results.status, true)
          )
        )
        .orderBy(desc(results.resultDate), desc(results.year))
        .limit(limit);
      
      return resultsList;
    } catch (error) {
      console.error('Error in getResultsByCity:', error);
      return [];
    }
  }

  /**
   * Get news in a city
   */
  async getNewsByCity(cityId: number, limit: number = 5): Promise<NewsItem[]> {
    try {
      const newsList = await db
        .select({
          id: news.id,
          title: news.title,
          slug: news.slug,
          excerpt: news.excerpt,
          imageUrl: news.imageUrl,
          publishedAt: news.publishedAt,
          isBreaking: news.isBreaking,
        })
        .from(news)
        .where(
          and(
            eq(news.cityId, cityId),
            eq(news.status, true)
          )
        )
        .orderBy(desc(news.publishedAt))
        .limit(limit);
      
      return newsList;
    } catch (error) {
      console.error('Error in getNewsByCity:', error);
      return [];
    }
  }

  /**
   * Get available years for admissions in a city
   */
  async getAvailableYears(cityId: number): Promise<number[]> {
    try {
      const years = await db
        .select({ year: admissions.year })
        .from(admissions)
        .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
        .where(eq(institutes.cityId, cityId))
        .groupBy(admissions.year)
        .orderBy(desc(admissions.year));
      
      return years.map(y => y.year);
    } catch (error) {
      console.error('Error in getAvailableYears:', error);
      return [];
    }
  }

  // Private helper methods
  private async getAdmissionsCounts(instituteIds: number[]): Promise<Map<number, number>> {
    if (instituteIds.length === 0) return new Map();
    
    const counts = await db
      .select({
        instituteId: admissions.instituteId,
        count: count(),
      })
      .from(admissions)
      .where(
        and(
          inArray(admissions.instituteId, instituteIds),
          eq(admissions.status, 'Open')
        )
      )
      .groupBy(admissions.instituteId);
    
    const result = new Map<number, number>();
    counts.forEach(c => {
      if (c.instituteId !== null) {
        result.set(c.instituteId, Number(c.count));
      }
    });
    return result;
  }

  private async getResultsCounts(instituteIds: number[]): Promise<Map<number, number>> {
    if (instituteIds.length === 0) return new Map();
    
    const counts = await db
      .select({
        instituteId: results.instituteId,
        count: count(),
      })
      .from(results)
      .where(inArray(results.instituteId, instituteIds))
      .groupBy(results.instituteId);
    
    const result = new Map<number, number>();
    counts.forEach(c => {
      if (c.instituteId !== null) {
        result.set(c.instituteId, Number(c.count));
      }
    });
    return result;
  }
}