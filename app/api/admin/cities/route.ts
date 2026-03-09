// app/api/admin/cities/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { cities } from "@/app/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  console.log("🚀 GET /api/admin/cities called");
  
  try {
    const allCities = await db
      .select()
      .from(cities)
      .orderBy(desc(cities.createdAt));

    console.log(`✅ Found ${allCities.length} cities`);

    return NextResponse.json({
      success: true,
      cities: allCities,
    });
  } catch (error) {
    console.error("❌ Error fetching cities:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch cities",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}