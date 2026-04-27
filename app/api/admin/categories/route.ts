import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { categories } from "@/app/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    
    const allCategories = await db.select().from(categories).orderBy(desc(categories.displayOrder));
    
    return NextResponse.json({ 
      success: true, 
      categories: allCategories 
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
