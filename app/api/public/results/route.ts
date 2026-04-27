// app/api/public/results/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { results, boards, institutes } from "@/app/lib/schema";
import { eq, desc, and, sql, SQL } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const year = searchParams.get("year");
    const limit = searchParams.get("limit") ? Math.min(parseInt(searchParams.get("limit")!), 100) : 20;
    const slug = searchParams.get("slug");

    const conditions: SQL[] = [eq(results.status, true)];

    if (type === "board") {
      conditions.push(sql`${results.boardId} IS NOT NULL`);
    } else if (type === "university") {
      conditions.push(sql`${results.instituteId} IS NOT NULL`);
    }

    if (year) {
      conditions.push(eq(results.year, parseInt(year)));
    }

    if (slug) {
      conditions.push(eq(results.slug, slug));
    }

    const allResults = await db
      .select({
        id: results.id,
        title: results.title,
        slug: results.slug,
        instituteId: results.instituteId,
        boardId: results.boardId,
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
      .leftJoin(institutes, eq(results.instituteId, institutes.id))
      .where(and(...conditions))
      .orderBy(desc(results.year), desc(results.resultDate))
      .limit(limit);

    const response = NextResponse.json({
      success: true,
      data: allResults,
      total: allResults.length,
    });

    response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}