// app/api/public/universities/route.ts
import { NextResponse } from 'next/server';
import { db } from "@/app/lib/db";
import { institutes, cities } from "@/app/lib/schema";
import { eq, asc, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit')) || 20;
  const city = searchParams.get('city');
  
  // Sirf universities chahiye
  const conditions = [eq(institutes.type, 'university')];
  
  // Agar city filter ho to
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
  
  return NextResponse.json({
    success: true,
    data: universities
  });
}