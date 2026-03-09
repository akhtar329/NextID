// app/api/public/boards/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { boards, cities } from "@/app/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const allBoards = await db
      .select({
        id: boards.id,
        name: boards.name,
        slug: boards.slug,
        cityName: cities.name,
        website: boards.website,
      })
      .from(boards)
      .leftJoin(cities, eq(boards.cityId, cities.id))
      .where(eq(boards.status, true))
      .orderBy(asc(boards.name));

    return NextResponse.json({
      success: true,
      data: allBoards
    });
  } catch (error) {
    console.error("Error fetching boards:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch boards" },
      { status: 500 }
    );
  }
}