import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { categories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
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

    const response = NextResponse.json({
      success: true,
      data: allCategories
    });

    response.headers.set('Cache-Control', `public, s-maxage=86400, stale-while-revalidate=43200`);

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories"
      },
      { status: 500 }
    );
  }
}
