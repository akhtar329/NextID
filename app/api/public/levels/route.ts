// app/api/public/levels/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { levels } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const allLevels = await db
      .select({
        id: levels.id,
        name: levels.name,
        slug: levels.slug,
        fullForm: levels.fullForm,
        displayOrder: levels.displayOrder,
        status: levels.status,
      })
      .from(levels)
      .where(eq(levels.status, true))
      .orderBy(asc(levels.displayOrder), asc(levels.name));

    const response = NextResponse.json({
      success: true,
      data: allLevels,
      total: allLevels.length,
    });

    response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch levels" },
      { status: 500 }
    );
  }
}
