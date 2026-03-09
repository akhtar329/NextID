// app/api/admin/boards/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { boards, cities } from "@/app/lib/schema"; // ✅ Boards table import
import { eq, desc } from "drizzle-orm";

export async function GET() {
  console.log("🚀 GET /api/admin/boards called");

  try {
    // Boards table se saare boards fetch karo
    const allBoards = await db
      .select({
        id: boards.id,
        name: boards.name,
        slug: boards.slug,
        cityId: boards.cityId,
        website: boards.website,
        description: boards.description,
        status: boards.status,
        createdAt: boards.createdAt,
        cityName: cities.name,
      })
      .from(boards)
      .leftJoin(cities, eq(boards.cityId, cities.id))
      .orderBy(desc(boards.createdAt));

    console.log(`✅ Found ${allBoards.length} boards from boards table`);

    return NextResponse.json({
      success: true,
      boards: allBoards,
    });

  } catch (error) {
    console.error("❌ Error fetching boards:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch boards" 
      },
      { status: 500 }
    );
  }
}