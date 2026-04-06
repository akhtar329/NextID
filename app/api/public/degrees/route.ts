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

    return NextResponse.json(allDegrees);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch degrees" }, { status: 500 });
  }
}