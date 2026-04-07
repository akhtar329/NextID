// app/api/public/date-sheets/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { dateSheets, boards, institutes, cities } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    console.log("Fetching date sheet for slug:", slug);
    
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
        createdAt: dateSheets.createdAt,
        board: {
          id: boards.id,
          name: boards.name,
          slug: boards.slug,
        },
        institute: {
          id: institutes.id,
          name: institutes.name,
          slug: institutes.slug,
          logo: institutes.logo,
          type: institutes.type,
          cityId: institutes.cityId,
        },
      })
      .from(dateSheets)
      .leftJoin(boards, eq(dateSheets.boardId, boards.id))
      .leftJoin(institutes, eq(dateSheets.instituteId, institutes.id))
      .where(eq(dateSheets.slug, slug))
      .limit(1);

    if (!dateSheet) {
      console.log("Date sheet not found for slug:", slug);
      return NextResponse.json(
        { error: "Date sheet not found" },
        { status: 404 }
      );
    }

    // Get city info if institute exists
    let city = null;
    if (dateSheet.institute?.cityId) {
      const [cityData] = await db
        .select({
          id: cities.id,
          name: cities.name,
          slug: cities.slug,
          province: cities.province,
        })
        .from(cities)
        .where(eq(cities.id, dateSheet.institute.cityId))
        .limit(1);
      city = cityData;
    }

    // Increment view count
    await db
      .update(dateSheets)
      .set({ viewCount: (dateSheet.viewCount || 0) + 1 })
      .where(eq(dateSheets.id, dateSheet.id));

    return NextResponse.json({
      ...dateSheet,
      city,
      viewCount: (dateSheet.viewCount || 0) + 1
    });

  } catch (error) {
    console.error("Error fetching date sheet:", error);
    return NextResponse.json(
      { error: "Failed to fetch date sheet", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}