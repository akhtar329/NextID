// app/api/admin/levels/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { levels } from "../../../lib/schema";

export async function GET(req: NextRequest) {
  try {
    const allLevels = await db.select().from(levels);
    return NextResponse.json({ success: true, levels: allLevels });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to fetch levels" }, { status: 500 });
  }
}
