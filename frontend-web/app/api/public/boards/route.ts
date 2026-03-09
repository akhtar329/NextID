// app/api/public/boards/route.ts
import { NextResponse } from 'next/server';
import { db } from "@/app/lib/db";
import { boards, cities } from "@/app/lib/schema";
import { eq, asc, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit')) || 20;
  const city = searchParams.get('city');
  
  let conditions = [];
  
  // Agar city filter ho to
  if (city && city !== 'All Cities') {
    conditions.push(eq(cities.name, city));
  }
  
  const boardsList = await db
    .select({
      id: boards.id,
      name: boards.name,
      slug: boards.slug,
      cityName: cities.name,
      website: boards.website,
      description: boards.description,
    })
    .from(boards)
    .leftJoin(cities, eq(boards.cityId, cities.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(boards.name))
    .limit(limit);
  
  return NextResponse.json({
    success: true,
    data: boardsList
  });
}