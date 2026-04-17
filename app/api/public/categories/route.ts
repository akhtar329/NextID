import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { categories } from "@/app/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    // ================== MAIN QUERY ==================
    const allCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        status: categories.status,
        displayOrder: categories.displayOrder
      })
      .from(categories)
      .where(eq(categories.status, true))
      .orderBy(asc(categories.displayOrder));

    return NextResponse.json({
      success: true,
      data: allCategories
    });
  } catch (error) {
    console.error("Categories API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories"
      },
      { status: 500 }
    );
  }
}