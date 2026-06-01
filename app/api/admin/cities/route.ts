// app/api/admin/cities/route.ts

import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { cities } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {

  
  try {
    const allCities = await db
      .select()
      .from(cities)
      .orderBy(desc(cities.createdAt));

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
