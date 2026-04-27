// app/api/public/institutes/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { institutes, cities, programOfferings, programs } from "@/app/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    // 1️⃣ Single query mein institutes + programs le lo
    const result = await db
      .select({
        id: institutes.id,
        name: institutes.name,
        slug: institutes.slug,
        type: institutes.type,
        cityName: cities.name,
        description: institutes.description,
        website: institutes.website,
        isFeatured: institutes.isFeatured,
        programs: sql`COALESCE(
          json_agg(
            json_build_object('name', ${programs.name}, 'slug', ${programs.slug})
          ) FILTER (WHERE ${programs.id} IS NOT NULL),
          '[]'::json
        )`.as('programs')
      })
      .from(institutes)
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .leftJoin(programOfferings, eq(institutes.id, programOfferings.instituteId))
      .leftJoin(programs, eq(programOfferings.programId, programs.id))
      .where(eq(institutes.status, true))
      .groupBy(institutes.id, cities.name);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch institutes" }, { status: 500 });
  }
}
