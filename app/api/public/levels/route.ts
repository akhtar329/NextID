// app/api/public/levels/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { levels } from "@/app/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const allLevels = await db
      .select()
      .from(levels)
      .where(eq(levels.status, true))
      .orderBy(asc(levels.id)); // id ya displayOrder, jo preference ho

    return NextResponse.json(allLevels);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch levels" }, { status: 500 });
  }
}
