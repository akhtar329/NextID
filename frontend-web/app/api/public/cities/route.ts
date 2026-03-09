// app/api/public/cities/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { cities } from "@/app/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const allCities = await db
      .select({
        id: cities.id,
        name: cities.name,
        slug: cities.slug,
        province: cities.province,
        isPopular: cities.isPopular,
      })
      .from(cities)
      .where(eq(cities.status, true))
      .orderBy(asc(cities.name));

    return NextResponse.json({
      success: true,
      data: allCities
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}