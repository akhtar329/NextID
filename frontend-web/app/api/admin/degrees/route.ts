// app/api/admin/degrees/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { degrees } from "@/app/lib/schema";

export async function GET() {
  try {
    const data = await db.select().from(degrees);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch degrees" },
      { status: 500 }
    );
  }
}
