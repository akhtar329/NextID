// app/lib/menu-data.ts

import { db } from "./db";
import { 
  categories, programs, degrees, institutes, cities, 
  results, dateSheets, programInstitutes, programCities 
} from "./schema";
import { eq, and, desc, asc, inArray } from "drizzle-orm";  // 👈 Fix: inArray import kiya

// Types
type ProgramData = {
  id: number;
  name: string;
  slug: string;
  isFeatured: boolean | null;
  degreeName: string | null;
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
    console.log("Fetching menu data for:", menuId, "category:", categorySlug);

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

    console.log(`Found ${allCategories.length} categories`);

    // 2. Determine active category
    let activeCategorySlug = categorySlug || allCategories[0]?.slug || 'engineering';
    let activeCategory = allCategories.find(c => c.slug === activeCategorySlug);
    
    if (!activeCategory && allCategories.length > 0) {
      activeCategory = allCategories[0];
      activeCategorySlug = activeCategory.slug;
    }

    const activeCategoryId = activeCategory?.id;
    console.log(`Active category: ${activeCategorySlug} (ID: ${activeCategoryId})`);

    // 3. Initialize empty arrays
    let programsData: ProgramData[] = [];
    let institutesData: InstituteData[] = [];
    let citiesData: CityData[] = [];

    // 4. Fetch data for active category
    if (activeCategoryId) {
      // Get degrees for this category
      const categoryDegrees = await db
        .select({ id: degrees.id })
        .from(degrees)
        .where(and(
          eq(degrees.status, true),
          eq(degrees.categoryId, activeCategoryId)
        ));

      const degreeIds = categoryDegrees.map(d => d.id);
      console.log(`Found ${degreeIds.length} degrees for category`);

      // Get programs for this category
      if (degreeIds.length > 0) {
        programsData = await db
          .select({
            id: programs.id,
            name: programs.name,
            slug: programs.slug,
            isFeatured: programs.isFeatured,
            degreeName: degrees.name,
          })
          .from(programs)
          .leftJoin(degrees, eq(programs.degreeId, degrees.id))
          .where(and(
            eq(programs.status, true),
            inArray(programs.degreeId, degreeIds)  // 👈 inArray use kiya
          ))
          .limit(8);
      }

      console.log(`Found ${programsData.length} programs for category ${activeCategorySlug}`);

      // Get institutes for this category
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
          .innerJoin(programInstitutes, eq(institutes.id, programInstitutes.instituteId))
          .where(and(
            eq(institutes.status, true),
            inArray(programInstitutes.programId, programIds)  // 👈 inArray use kiya
          ))
          .groupBy(institutes.id, cities.name)
          .limit(8);
      }

      console.log(`Found ${institutesData.length} institutes for category ${activeCategorySlug}`);

      // Get cities for this category
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
          .innerJoin(programCities, eq(cities.id, programCities.cityId))
          .where(and(
            eq(cities.status, true),
            inArray(programCities.programId, programIds)  // 👈 inArray use kiya
          ))
          .groupBy(cities.id)
          .limit(8);
      }

      console.log(`Found ${citiesData.length} cities for category ${activeCategorySlug}`);
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

    console.log("Menu data fetched successfully for category:", activeCategorySlug);
    
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