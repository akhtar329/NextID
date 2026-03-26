// app/api/admin/boards/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { boards, cities } from "@/app/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {

  try {
    // Boards table se saare boards fetch karo with all fields
    const allBoards = await db
      .select({
        id: boards.id,
        name: boards.name,
        slug: boards.slug,
        cityId: boards.cityId,
        website: boards.website,
        description: boards.description,
        establishedYear: boards.establishedYear,
        contactEmail: boards.contactEmail,
        contactPhone: boards.contactPhone,
        address: boards.address,
        metaTitle: boards.metaTitle,
        metaDescription: boards.metaDescription,
        metaKeywords: boards.metaKeywords,
        status: boards.status,
        createdAt: boards.createdAt,
        cityName: cities.name,
      })
      .from(boards)
      .leftJoin(cities, eq(boards.cityId, cities.id))
      .orderBy(desc(boards.createdAt));

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