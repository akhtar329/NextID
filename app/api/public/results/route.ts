// app/api/public/results/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { results, boards, institutes } from "@/app/lib/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'board' or 'university'
    const year = searchParams.get("year");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;
    const slug = searchParams.get("slug"); // add slug support

    // Build conditions array
    const conditions: any[] = [eq(results.status, true)];

    if (type === "board") {
      conditions.push(sql`${results.boardId} IS NOT NULL`);
    } else if (type === "university") {
      conditions.push(sql`${results.universityId} IS NOT NULL`);
    }

    if (year) {
      conditions.push(eq(results.year, parseInt(year)));
    }

    if (slug) {
      conditions.push(eq(results.slug, slug)); // slug filter
    }

    const allResults = await db
      .select({
        id: results.id,
        title: results.title,
        slug: results.slug, // include slug
        programId: results.programId,
        instituteId: results.instituteId,
        boardId: results.boardId,
        universityId: results.universityId,
        year: results.year,
        resultDate: results.resultDate,
        officialLink: results.officialLink,
        isPopular: results.isPopular,
        status: results.status,
        createdAt: results.createdAt,
        updatedAt: results.updatedAt,
        boardName: boards.name,
        boardSlug: boards.slug,
        universityName: institutes.name,
        universitySlug: institutes.slug,
      })
      .from(results)
      .leftJoin(boards, eq(results.boardId, boards.id))
      .leftJoin(institutes, eq(results.universityId, institutes.id))
      .where(and(...conditions))
      .orderBy(desc(results.year), desc(results.resultDate))
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: allResults,
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}