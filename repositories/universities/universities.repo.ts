// /repositories/universities/universities.repo.ts
import { db } from '@/db/db';
import { institutes, cities, programOfferings, admissions } from '@/db/schema';
import { eq, desc, like, and, or, count, inArray, sql, SQL } from 'drizzle-orm';
import { University, UniversityFilters, UniversityStats } from '@/types/universities.types';

export class UniversitiesRepository {
  
  async getUniversities(filters: UniversityFilters): Promise<University[]> {
    try {
      const conditions: SQL[] = [];

      if (filters.city) {
        conditions.push(eq(cities.slug, filters.city));
      }

      if (filters.type) {
        conditions.push(eq(institutes.type, filters.type));
      }

      if (filters.q) {
        const searchTerm = `%${filters.q}%`;
        conditions.push(
          or(
            like(institutes.name, searchTerm),
            like(cities.name, searchTerm)
          ) as SQL
        );
      }

      const institutesList = await db
        .select({
          id: institutes.id,
          name: institutes.name,
          slug: institutes.slug,
          type: institutes.type,
          city: cities.name,
          citySlug: cities.slug,
          website: institutes.website,
          description: institutes.description,
          isFeatured: institutes.isFeatured,
        })
        .from(institutes)
        .innerJoin(cities, eq(institutes.cityId, cities.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(institutes.isFeatured), institutes.name)
        .limit(100);

      if (institutesList.length === 0) return [];

      const instituteIds = institutesList.map(i => i.id);

      const [programsCounts, admissionsCounts] = await Promise.all([
        db
          .select({
            instituteId: programOfferings.instituteId,
            count: count(),
          })
          .from(programOfferings)
          .where(inArray(programOfferings.instituteId, instituteIds))
          .groupBy(programOfferings.instituteId),
        
        db
          .select({
            instituteId: admissions.instituteId,
            count: count(),
          })
          .from(admissions)
          .where(and(inArray(admissions.instituteId, instituteIds), eq(admissions.status, 'Open')))
          .groupBy(admissions.instituteId),
      ]);

      const programsMap = new Map(programsCounts.map(p => [p.instituteId, Number(p.count)]));
      const admissionsMap = new Map(admissionsCounts.map(a => [a.instituteId, Number(a.count)]));

      return institutesList.map((inst) => ({
        ...inst,
        programsCount: programsMap.get(inst.id) || 0,
        admissionsCount: admissionsMap.get(inst.id) || 0,
        established: null,
      }));
    } catch (error) {
      console.error('[Repository] Failed to fetch universities:', error);
      return [];
    }
  }

  async getUniversityStats(): Promise<UniversityStats> {
    try {
      const [totalInstitutes] = await db.select({ count: count() }).from(institutes);
      const [totalCities] = await db.select({ count: count() }).from(cities);
      
      const result = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${institutes.id})` })
        .from(institutes)
        .innerJoin(admissions, eq(institutes.id, admissions.instituteId))
        .where(eq(admissions.status, 'Open'));
      
      const institutesWithAdmissions = Number(result[0]?.count) || 0;

      return {
        totalInstitutes: Number(totalInstitutes?.count) || 0,
        totalCities: Number(totalCities?.count) || 0,
        institutesWithAdmissions,
      };
    } catch (error) {
      console.error('[Repository] Failed to fetch stats:', error);
      return { totalInstitutes: 0, totalCities: 0, institutesWithAdmissions: 0 };
    }
  }

  async getUniversityBySlug(slug: string): Promise<University | null> {
    try {
      const [university] = await db
        .select({
          id: institutes.id,
          name: institutes.name,
          slug: institutes.slug,
          type: institutes.type,
          city: cities.name,
          citySlug: cities.slug,
          website: institutes.website,
          description: institutes.description,
          isFeatured: institutes.isFeatured,
        })
        .from(institutes)
        .innerJoin(cities, eq(institutes.cityId, cities.id))
        .where(and(eq(institutes.slug, slug), eq(institutes.status, true)))
        .limit(1);
      
      return university
        ? {
            ...university,
            programsCount: 0,
            admissionsCount: 0,
            established: null,
          }
        : null;
    } catch (error) {
      console.error('[Repository] Failed to fetch university by slug:', error);
      return null;
    }
  }
}