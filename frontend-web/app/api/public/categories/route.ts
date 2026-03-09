
// app/api/public/categories/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { categories } from "@/app/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.status, true))
      .orderBy(asc(categories.displayOrder)); // ✅ use asc() function

    return NextResponse.json(allCategories);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
