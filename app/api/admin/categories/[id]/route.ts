// app/api/admin/categories/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

// Next.js 15+ mein params ab Promise hai - isko await karna hoga
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = Number(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: "Invalid category ID" },
        { status: 400 }
      );
    }

    const category = await db.select().from(categories).where(eq(categories.id, categoryId));
    
    if (category.length === 0) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      category: category[0] 
    });

  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = Number(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: "Invalid category ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    
    // Check if category exists
    const existing = await db.select().from(categories).where(eq(categories.id, categoryId));
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // If name is being updated, check for duplicates
    if (body.name && body.name !== existing[0].name) {
      const duplicateName = await db.select().from(categories).where(eq(categories.name, body.name));
      if (duplicateName.length > 0) {
        return NextResponse.json(
          { success: false, error: `Category "${body.name}" already exists` },
          { status: 409 }
        );
      }
    }

    // If slug is being updated, check for duplicates
    if (body.slug && body.slug !== existing[0].slug) {
      const duplicateSlug = await db.select().from(categories).where(eq(categories.slug, body.slug));
      if (duplicateSlug.length > 0) {
        return NextResponse.json(
          { success: false, error: `Slug "${body.slug}" already exists` },
          { status: 409 }
        );
      }
    }

    // Update category
    const updated = await db.update(categories)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.slug && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.displayOrder !== undefined && { displayOrder: body.displayOrder }),
        ...(body.status !== undefined && { status: Boolean(body.status) }),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, categoryId))
      .returning();

    return NextResponse.json({ 
      success: true, 
      category: updated[0],
      message: "Category updated successfully" 
    });

  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = Number(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: "Invalid category ID" },
        { status: 400 }
      );
    }

    // Check if category exists
    const existing = await db.select().from(categories).where(eq(categories.id, categoryId));
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // ✅ REMOVED: degrees.categoryId check (no longer exists in new schema)
    // Categories can be deleted freely now since programs have direct categoryId
    
    // Check if category is being used by any programs
    const { programs } = await import("@/db/schema");
    const usedByPrograms = await db.select().from(programs).where(eq(programs.categoryId, categoryId));
    
    if (usedByPrograms.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete category "${existing[0].name}" because it is being used by ${usedByPrograms.length} program(s). Please reassign these programs first.` 
        },
        { status: 409 }
      );
    }

    // Delete category
    await db.delete(categories).where(eq(categories.id, categoryId));

    return NextResponse.json({ 
      success: true, 
      message: "Category deleted successfully" 
    });

  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 }
    );
  }
}