import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { boards, cities } from "@/app/lib/schema";
import { eq, asc, and } from "drizzle-orm";

import { getCachedRedirect, setCachedRedirect } from "@/app/lib/cache";

// ================= CACHE KEY =================
const buildCacheKey = (city: string | null, limit: number) => {
  return `boards:${city || "all"}:${limit}`;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // ================= SAFE LIMIT =================
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
    const city = searchParams.get("city");

    const cacheKey = buildCacheKey(city, limit);

    // ================= CHECK CACHE =================
    const cached = getCachedRedirect(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        source: "cache"
      });
    }

    // ================= CONDITIONS =================
    const conditions = [];

    if (city && city !== "All Cities") {
      conditions.push(eq(cities.name, city));
    }

    // ================= DB QUERY =================
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

    const responseData = boardsList;

    // ================= SET CACHE =================
    setCachedRedirect(cacheKey, responseData);

    return NextResponse.json({
      success: true,
      data: responseData,
      source: "db"
    });
  } catch (error) {
    console.error("Boards API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch boards"
      },
      { status: 500 }
    );
  }
}