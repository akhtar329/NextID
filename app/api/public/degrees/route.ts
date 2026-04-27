// app/api/public/degrees/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { degrees, levels } from "@/app/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const allDegrees = await db
      .select({
        id: degrees.id,
        name: degrees.name,
        fullForm: degrees.fullForm,
        levelName: levels.name,
      })
      .from(degrees)
      .leftJoin(levels, eq(degrees.levelId, levels.id))
      .where(eq(degrees.status, true))
      .orderBy(asc(degrees.displayOrder));

    const response = NextResponse.json({
      success: true,
      data: allDegrees,
      total: allDegrees.length,
    });

    response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch degrees" },
      { status: 500 }
    );
  }
}