// app/api/admin/cities/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { cities, seoMetadata } from "@/app/lib/schema";
import { eq, and } from "drizzle-orm";

// GET - Fetch single city
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  
  try {
    const { id } = await params;
    const cityId = parseInt(id);

    if (isNaN(cityId)) {
      return NextResponse.json(
        { success: false, error: "Invalid city ID" },
        { status: 400 }
      );
    }

    const city = await db
      .select()
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);

    if (city.length === 0) {
      return NextResponse.json(
        { success: false, error: "City not found" },
        { status: 404 }
      );
    }

    // Fetch SEO metadata for this city
    const seo = await db
      .select()
      .from(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityType, 'city'),
          eq(seoMetadata.entityId, cityId)
        )
      )
      .limit(1);

    return NextResponse.json({
      success: true,
      city: {
        ...city[0],
        seo: seo[0] || null,
      },
    });

  } catch (error) {
    console.error("❌ Error fetching city:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch city",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// PATCH - Partial update
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  
  try {
    const { id } = await params;
    const cityId = parseInt(id);

    if (isNaN(cityId)) {
      return NextResponse.json(
        { success: false, error: "Invalid city ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if exists
    const existing = await db
      .select()
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "City not found" },
        { status: 404 }
      );
    }

    // Update city fields (no meta columns)
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.province !== undefined) updateData.province = body.province;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;
    if (body.population !== undefined) updateData.population = body.population;
    if (body.area !== undefined) updateData.area = body.area;
    if (body.displayOrder !== undefined) updateData.displayOrder = body.displayOrder;
    if (body.isPopular !== undefined) updateData.isPopular = Boolean(body.isPopular);
    if (body.status !== undefined) updateData.status = Boolean(body.status);
    
    if (body.slug !== undefined) {
      // Check if slug exists on another city
      const slugExists = await db
        .select()
        .from(cities)
        .where(eq(cities.slug, body.slug))
        .limit(1);

      if (slugExists.length > 0 && slugExists[0].id !== cityId) {
        return NextResponse.json(
          { success: false, error: "Slug already exists on another city" },
          { status: 400 }
        );
      }
      updateData.slug = body.slug;
    }

    // Update city
    const updated = await db
      .update(cities)
      .set(updateData)
      .where(eq(cities.id, cityId))
      .returning();

    // Handle SEO metadata update if provided
    let updatedSeo = null;
    if (body.seo && Object.keys(body.seo).length > 0) {
      const existingSeo = await db
        .select()
        .from(seoMetadata)
        .where(
          and(
            eq(seoMetadata.entityType, 'city'),
            eq(seoMetadata.entityId, cityId)
          )
        )
        .limit(1);

      const seoData = {
        entityType: 'city',
        entityId: cityId,
        metaTitle: body.seo.metaTitle || null,
        metaDescription: body.seo.metaDescription || null,
        canonicalUrl: body.seo.canonicalUrl || null,
        robots: body.seo.robots || 'index, follow',
        ogTitle: body.seo.ogTitle || null,
        ogDescription: body.seo.ogDescription || null,
        ogImage: body.seo.ogImage || null,
        updatedAt: new Date(),
      };

      if (existingSeo.length > 0) {
        // Update existing SEO
        [updatedSeo] = await db
          .update(seoMetadata)
          .set(seoData)
          .where(
            and(
              eq(seoMetadata.entityType, 'city'),
              eq(seoMetadata.entityId, cityId)
            )
          )
          .returning();
      } else if (body.seo.metaTitle || body.seo.metaDescription) {
        // Create new SEO only if there's actual data
        [updatedSeo] = await db
          .insert(seoMetadata)
          .values(seoData)
          .returning();
      }
    }

    return NextResponse.json({
      success: true,
      city: {
        ...updated[0],
        seo: updatedSeo || null,
      },
      message: "City updated successfully",
    });

  } catch (error) {
    console.error("❌ Error updating city:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update city",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT - Full update
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  
  try {
    const { id } = await params;
    const cityId = parseInt(id);

    if (isNaN(cityId)) {
      return NextResponse.json(
        { success: false, error: "Invalid city ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await db
      .select()
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "City not found" },
        { status: 404 }
      );
    }

    // Check slug uniqueness
    const slugExists = await db
      .select()
      .from(cities)
      .where(eq(cities.slug, body.slug))
      .limit(1);

    if (slugExists.length > 0 && slugExists[0].id !== cityId) {
      return NextResponse.json(
        { success: false, error: "Slug already exists on another city" },
        { status: 400 }
      );
    }

    // Full update with all fields (no meta columns)
    const updated = await db
      .update(cities)
      .set({
        name: body.name,
        slug: body.slug,
        province: body.province || null,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        thumbnailUrl: body.thumbnailUrl || null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        population: body.population || null,
        area: body.area || null,
        displayOrder: body.displayOrder ?? 0,
        isPopular: body.isPopular || false,
        status: body.status ?? true,
      })
      .where(eq(cities.id, cityId))
      .returning();

    // Handle SEO metadata
    let updatedSeo = null;
    
    // First, check if SEO exists
    const existingSeo = await db
      .select()
      .from(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityType, 'city'),
          eq(seoMetadata.entityId, cityId)
        )
      )
      .limit(1);

    const seoData = {
      entityType: 'city',
      entityId: cityId,
      metaTitle: body.seo?.metaTitle || null,
      metaDescription: body.seo?.metaDescription || null,
      canonicalUrl: body.seo?.canonicalUrl || null,
      robots: body.seo?.robots || 'index, follow',
      ogTitle: body.seo?.ogTitle || null,
      ogDescription: body.seo?.ogDescription || null,
      ogImage: body.seo?.ogImage || null,
      updatedAt: new Date(),
    };

    if (existingSeo.length > 0) {
      // Update existing SEO
      [updatedSeo] = await db
        .update(seoMetadata)
        .set(seoData)
        .where(
          and(
            eq(seoMetadata.entityType, 'city'),
            eq(seoMetadata.entityId, cityId)
          )
        )
        .returning();
    } else if (body.seo && (body.seo.metaTitle || body.seo.metaDescription)) {
      // Create new SEO only if there's actual data
      [updatedSeo] = await db
        .insert(seoMetadata)
        .values(seoData)
        .returning();
    }

    return NextResponse.json({
      success: true,
      city: {
        ...updated[0],
        seo: updatedSeo || null,
      },
      message: "City updated successfully",
    });

  } catch (error) {
    console.error("❌ Error updating city:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update city",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete city (also delete associated SEO metadata)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  
  try {
    const { id } = await params;
    const cityId = parseInt(id);

    if (isNaN(cityId)) {
      return NextResponse.json(
        { success: false, error: "Invalid city ID" },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await db
      .select()
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "City not found" },
        { status: 404 }
      );
    }

    // Delete SEO metadata first (due to foreign key constraint if any)
    await db
      .delete(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityType, 'city'),
          eq(seoMetadata.entityId, cityId)
        )
      );

    // Delete city
    await db
      .delete(cities)
      .where(eq(cities.id, cityId));

    return NextResponse.json({
      success: true,
      message: "City and its SEO metadata deleted successfully",
    });

  } catch (error) {
    console.error("❌ Error deleting city:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete city",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}