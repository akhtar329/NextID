// app/api/public/universities/route.ts
import { NextResponse } from 'next/server';
import { db } from "@/db/db";
import { institutes, cities } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
    const city = searchParams.get('city');
    
    const conditions = [eq(institutes.type, 'university'), eq(institutes.status, true)];
    
    if (city && city !== 'All Cities') {
      conditions.push(eq(cities.name, city));
    }
    
    const universities = await db
      .select({
        id: institutes.id,
        name: institutes.name,
        slug: institutes.slug,
        cityName: cities.name,
        description: institutes.description,
        website: institutes.website,
        isFeatured: institutes.isFeatured,
      })
      .from(institutes)
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .where(and(...conditions))
      .orderBy(asc(institutes.name))
      .limit(limit);
    
    const response = NextResponse.json({
      success: true,
      data: universities,
      total: universities.length,
    });
    
    response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
    
    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch universities" },
      { status: 500 }
    );
  }
}
