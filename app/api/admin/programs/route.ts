// app/api/admin/programs/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programs, categories } from "@/app/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const allPrograms = await db
      .select({
        id: programs.id,
        name: programs.name,
        slug: programs.slug,
        categoryId: programs.categoryId,
        categoryName: categories.name,
        shortDescription: programs.shortDescription,
        typicalDuration: programs.typicalDuration,
        typicalFeeRange: programs.typicalFeeRange,
        isFeatured: programs.isFeatured,
        isPopular: programs.isPopular,
        status: programs.status,
        createdAt: programs.createdAt,
      })
      .from(programs)
      .leftJoin(categories, eq(programs.categoryId, categories.id))
      .orderBy(desc(programs.createdAt));

    return NextResponse.json({
      success: true,
      programs: allPrograms,
    });
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}