// app/api/admin/institutes/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { institutes, cities } from "@/app/lib/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  console.log("🚀 GET /api/admin/institutes called");
  
  try {
    // Fetch institutes with city names
    const allInstitutes = await db
      .select({
        id: institutes.id,
        name: institutes.name,
        slug: institutes.slug,
        type: institutes.type,
        cityId: institutes.cityId,
        cityName: cities.name,
        description: institutes.description,
        website: institutes.website,
        status: institutes.status,
        createdAt: institutes.createdAt,
      })
      .from(institutes)
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .orderBy(desc(institutes.createdAt));

    console.log(`✅ Found ${allInstitutes.length} institutes`);

    return NextResponse.json({
      success: true,
      institutes: allInstitutes,
    });

  } catch (error) {
    console.error("❌ Error fetching institutes:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch institutes",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}