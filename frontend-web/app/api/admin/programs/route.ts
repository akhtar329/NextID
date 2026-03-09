// app/api/admin/programs/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programs, degrees, levels } from "@/app/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const allPrograms = await db
      .select({
        id: programs.id,
        name: programs.name,
        slug: programs.slug,
        degreeName: degrees.name,
        levelName: levels.name,
        duration: programs.duration,
        feeRange: programs.feeRange,
        status: programs.status,
        createdAt: programs.createdAt,
      })
      .from(programs)
      .leftJoin(degrees, eq(programs.degreeId, degrees.id))
      .leftJoin(levels, eq(degrees.levelId, levels.id))
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