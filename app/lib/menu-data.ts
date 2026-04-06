// app/lib/menu-data.ts

import { db } from "./db";
import { 
  categories, programs, institutes, cities, 
  results, dateSheets, programOfferings 
} from "./schema";
import { eq, and, desc, asc, inArray } from "drizzle-orm";

// Types
type ProgramData = {
  id: number;
  name: string;
  slug: string;
  isFeatured: boolean | null;
};

type InstituteData = {
  id: number;
  name: string;
  slug: string;
  isFeatured: boolean | null;
  cityName: string | null;
};

type CityData = {
  id: number;
  name: string;
  slug: string;
  province: string | null;
  isPopular: boolean | null;
};

export async function getMenuData(menuId: string, categorySlug?: string) {
  try {

    // 1. Get all categories
    const allCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        displayOrder: categories.displayOrder,
      })
      .from(categories)
      .where(eq(categories.status, true))
      .orderBy(asc(categories.displayOrder));

    // 2. Determine active category
    let activeCategorySlug = categorySlug || allCategories[0]?.slug || 'engineering';
    let activeCategory = allCategories.find(c => c.slug === activeCategorySlug);
    
    if (!activeCategory && allCategories.length > 0) {
      activeCategory = allCategories[0];
      activeCategorySlug = activeCategory.slug;
    }

    const activeCategoryId = activeCategory?.id;

    // 3. Initialize empty arrays
    let programsData: ProgramData[] = [];
    let institutesData: InstituteData[] = [];
    let citiesData: CityData[] = [];

    // 4. Fetch data for active category
    if (activeCategoryId) {
      // Get programs for this category directly (categoryId is in programs table)
      programsData = await db
        .select({
          id: programs.id,
          name: programs.name,
          slug: programs.slug,
          isFeatured: programs.isFeatured,
        })
        .from(programs)
        .where(and(
          eq(programs.status, true),
          eq(programs.categoryId, activeCategoryId)
        ))
        .limit(8);

      // Get institutes for this category (through programOfferings)
      if (programsData.length > 0) {
        const programIds = programsData.map(p => p.id);
        
        institutesData = await db
          .select({
            id: institutes.id,
            name: institutes.name,
            slug: institutes.slug,
            isFeatured: institutes.isFeatured,
            cityName: cities.name,
          })
          .from(institutes)
          .leftJoin(cities, eq(institutes.cityId, cities.id))
          .innerJoin(programOfferings, eq(institutes.id, programOfferings.instituteId))
          .where(and(
            eq(institutes.status, true),
            inArray(programOfferings.programId, programIds)
          ))
          .groupBy(institutes.id, cities.name)
          .limit(8);
      }

      // Get cities for this category (through programOfferings and institutes)
      if (programsData.length > 0) {
        const programIds = programsData.map(p => p.id);
        
        citiesData = await db
          .select({
            id: cities.id,
            name: cities.name,
            slug: cities.slug,
            province: cities.province,
            isPopular: cities.isPopular,
          })
          .from(cities)
          .innerJoin(institutes, eq(cities.id, institutes.cityId))
          .innerJoin(programOfferings, eq(institutes.id, programOfferings.instituteId))
          .where(and(
            eq(cities.status, true),
            inArray(programOfferings.programId, programIds)
          ))
          .groupBy(cities.id)
          .limit(8);
      }
    }

    // 5. Menu-specific data
    let menuSpecificData = {};
    if (menuId === 'results') {
      const resultsData = await db
        .select()
        .from(results)
        .where(eq(results.status, true))
        .orderBy(desc(results.year))
        .limit(8);
      
      const dateSheetsData = await db
        .select()
        .from(dateSheets)
        .where(eq(dateSheets.status, true))
        .orderBy(desc(dateSheets.examDate))
        .limit(8);
      
      menuSpecificData = { 
        results: resultsData, 
        dateSheets: dateSheetsData 
      };
    }

    const responseData = {
      categories: allCategories,
      programs: programsData,
      universities: institutesData,
      cities: citiesData,
      activeCategory: activeCategorySlug,
      ...menuSpecificData
    };
    
    return {
      success: true,
      data: responseData
    };

  } catch (error) {
    console.error("Error in getMenuData:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch menu data"
    };
  }
}