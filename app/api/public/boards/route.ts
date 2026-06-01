import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { boards, cities } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
    const city = searchParams.get("city");

    const conditions = [];

    if (city && city !== "All Cities") {
      conditions.push(eq(cities.name, city));
    }

    const boardsList = await db
      .select({
        id: boards.id,
        name: boards.name,
        slug: boards.slug,
        cityName: cities.name,
        website: boards.website,
        description: boards.description
      })
      .from(boards)
      .leftJoin(cities, eq(boards.cityId, cities.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(boards.name))
      .limit(limit);

    const response = NextResponse.json({
      success: true,
      data: boardsList,
    });

    response.headers.set('Cache-Control', `public, s-maxage=86400, stale-while-revalidate=43200`);

    return response;

  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch boards"
      },
      { status: 500 }
    );
  }
}
