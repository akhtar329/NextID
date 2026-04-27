// app/api/public/date-sheets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { dateSheets, boards, institutes, cities } from "@/app/lib/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    // If slug exists, return single date sheet
    if (slug) {
      // First, check if date sheet exists without joins
      const [dateSheetExists] = await db
        .select({ id: dateSheets.id })
        .from(dateSheets)
        .where(eq(dateSheets.slug, slug))
        .limit(1);

      if (!dateSheetExists) {
        return NextResponse.json(
          { success: false, error: "Date sheet not found" },
          { status: 404 }
        );
      }

      // Now fetch with all details
      const [dateSheet] = await db
        .select({
          id: dateSheets.id,
          title: dateSheets.title,
          slug: dateSheets.slug,
          examType: dateSheets.examType,
          examDate: dateSheets.examDate,
          year: dateSheets.year,
          boardId: dateSheets.boardId,
          instituteId: dateSheets.instituteId,
          viewCount: dateSheets.viewCount,
          isPopular: dateSheets.isPopular,
          officialLink: dateSheets.officialLink,
          downloadLink: dateSheets.downloadLink,
          pdfFile: dateSheets.pdfFile,
          featuredImage: dateSheets.featuredImage,
          description: dateSheets.description,
          createdAt: dateSheets.createdAt,
          boardName: boards.name,
          boardSlug: boards.slug,
          instituteName: institutes.name,
          instituteSlug: institutes.slug,
          instituteLogo: institutes.logo,
          instituteType: institutes.type,
          instituteCityId: institutes.cityId,
        })
        .from(dateSheets)
        .leftJoin(boards, eq(dateSheets.boardId, boards.id))
        .leftJoin(institutes, eq(dateSheets.instituteId, institutes.id))
        .where(eq(dateSheets.slug, slug))
        .limit(1);

      let city = null;
      if (dateSheet.instituteCityId) {
        const [cityData] = await db
          .select({
            name: cities.name,
            slug: cities.slug,
            province: cities.province,
          })
          .from(cities)
          .where(eq(cities.id, dateSheet.instituteCityId))
          .limit(1);
        city = cityData;
      }

      // Update view count in background (don't await)
      db
        .update(dateSheets)
        .set({ viewCount: (dateSheet.viewCount || 0) + 1 })
        .where(eq(dateSheets.id, dateSheet.id))
        .catch(() => {});

      const response = NextResponse.json({
        success: true,
        data: {
          id: dateSheet.id,
          title: dateSheet.title,
          slug: dateSheet.slug,
          examType: dateSheet.examType,
          examDate: dateSheet.examDate,
          year: dateSheet.year,
          boardId: dateSheet.boardId,
          instituteId: dateSheet.instituteId,
          viewCount: (dateSheet.viewCount || 0) + 1,
          isPopular: dateSheet.isPopular,
          officialLink: dateSheet.officialLink,
          downloadLink: dateSheet.downloadLink,
          pdfFile: dateSheet.pdfFile,
          featuredImage: dateSheet.featuredImage,
          description: dateSheet.description,
          createdAt: dateSheet.createdAt,
          board: dateSheet.boardName ? { name: dateSheet.boardName, slug: dateSheet.boardSlug } : null,
          institute: dateSheet.instituteName ? {
            name: dateSheet.instituteName,
            slug: dateSheet.instituteSlug,
            logo: dateSheet.instituteLogo,
            type: dateSheet.instituteType,
            cityId: dateSheet.instituteCityId
          } : null,
          city,
          seo: null
        }
      });

      response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
      return response;
    }

    // Otherwise return list of all date sheets
    const allDateSheets = await db
      .select({
        id: dateSheets.id,
        title: dateSheets.title,
        slug: dateSheets.slug,
        examType: dateSheets.examType,
        year: dateSheets.year,
        viewCount: dateSheets.viewCount,
        isPopular: dateSheets.isPopular,
        createdAt: dateSheets.createdAt,
        boardName: boards.name,
        instituteName: institutes.name,
      })
      .from(dateSheets)
      .leftJoin(boards, eq(dateSheets.boardId, boards.id))
      .leftJoin(institutes, eq(dateSheets.instituteId, institutes.id))
      .where(eq(dateSheets.status, true))
      .orderBy(desc(dateSheets.isPopular), desc(dateSheets.year), desc(dateSheets.createdAt));

    const formattedList = allDateSheets.map(sheet => ({
      ...sheet,
      board: sheet.boardName ? { name: sheet.boardName } : null,
      institute: sheet.instituteName ? { name: sheet.instituteName } : null,
    }));

    const response = NextResponse.json({
      success: true,
      data: formattedList,
      total: formattedList.length,
    });

    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');
    return response;

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch date sheets" },
      { status: 500 }
    );
  }
}
