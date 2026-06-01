// app/api/admin/seo-metadata/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { seoMetadata } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET - Fetch SEO metadata
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityType, entityType),
          eq(seoMetadata.entityId, parseInt(entityId))
        )
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Error fetching SEO metadata:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch SEO metadata" },
      { status: 500 }
    );
  }
}

// POST - Create or update SEO metadata
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId, ...seoData } = body;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    // Check if already exists
    const existing = await db
      .select()
      .from(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityType, entityType),
          eq(seoMetadata.entityId, entityId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db
        .update(seoMetadata)
        .set({
          ...seoData,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(seoMetadata.entityType, entityType),
            eq(seoMetadata.entityId, entityId)
          )
        );
    } else {
      // Insert new
      await db.insert(seoMetadata).values({
        entityType,
        entityId,
        ...seoData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving SEO metadata:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save SEO metadata" },
      { status: 500 }
    );
  }
}
