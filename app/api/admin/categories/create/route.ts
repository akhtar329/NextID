import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { categories } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name, slug, displayOrder, status } = body;

    // Validation
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existingName = await db.select().from(categories).where(eq(categories.name, name));
    if (existingName.length > 0) {
      return NextResponse.json(
        { success: false, error: `Category "${name}" already exists` },
        { status: 409 }
      );
    }

    // Check for duplicate slug
    const existingSlug = await db.select().from(categories).where(eq(categories.slug, slug));
    if (existingSlug.length > 0) {
      return NextResponse.json(
        { success: false, error: `Slug "${slug}" already exists` },
        { status: 409 }
      );
    }

    // Insert category
    const inserted = await db.insert(categories).values({
      name,
      slug,
      displayOrder: displayOrder || 0,
      status: status !== undefined ? Boolean(status) : true,
    }).returning();

    return NextResponse.json({ 
      success: true, 
      category: inserted[0],
      message: "Category created successfully" 
    });

  } catch (err) {
    console.error("Error creating category:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 }
    );
  }
}