// app/api/admin/boards/route.ts

import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { boards, cities, seoMetadata } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const cityId = searchParams.get('cityId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    const search = searchParams.get('search');

    // Build conditions array
    const conditions = [];

    if (status) {
      const statusValue = status === 'true' ? true : false;
      conditions.push(eq(boards.status, statusValue));
    }

    if (cityId) {
      conditions.push(eq(boards.cityId, parseInt(cityId)));
    }

    if (search) {
      conditions.push(
        sql`${boards.name} ILIKE ${`%${search}%`}`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch boards with SEO metadata
    const allBoards = await db
      .select({
        id: boards.id,
        name: boards.name,
        slug: boards.slug,
        cityId: boards.cityId,
        website: boards.website,
        description: boards.description,
        establishedYear: boards.establishedYear,
        contactEmail: boards.contactEmail,
        contactPhone: boards.contactPhone,
        address: boards.address,
        status: boards.status,
        createdAt: boards.createdAt,
        cityName: cities.name,
        // SEO fields from seo_metadata table (without metaKeywords)
        metaTitle: seoMetadata.metaTitle,
        metaDescription: seoMetadata.metaDescription,
        // Check if SEO exists
        hasSeo: sql<boolean>`CASE WHEN ${seoMetadata.id} IS NOT NULL THEN true ELSE false END`,
      })
      .from(boards)
      .leftJoin(cities, eq(boards.cityId, cities.id))
      .leftJoin(seoMetadata, 
        and(
          eq(seoMetadata.entityType, 'board'),
          eq(seoMetadata.entityId, boards.id)
        )
      )
      .where(whereClause)
      .orderBy(desc(boards.createdAt))
      .limit(limit);

    // Count total boards (for pagination)
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(boards)
      .where(whereClause);

    return NextResponse.json({
      success: true,
      boards: allBoards,
      count: allBoards.length,
      total: Number(totalCount[0]?.count) || 0,
    });

  } catch (error) {
    console.error("❌ Error fetching boards:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch boards",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST - Create new board
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug exists
    const existingSlug = await db
      .select()
      .from(boards)
      .where(eq(boards.slug, body.slug))
      .limit(1);

    if (existingSlug.length > 0) {
      return NextResponse.json(
        { success: false, error: "Board with this slug already exists" },
        { status: 409 }
      );
    }

    // Check if name exists
    const existingName = await db
      .select()
      .from(boards)
      .where(eq(boards.name, body.name))
      .limit(1);

    if (existingName.length > 0) {
      return NextResponse.json(
        { success: false, error: "Board with this name already exists" },
        { status: 409 }
      );
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create board
      const [newBoard] = await tx
        .insert(boards)
        .values({
          name: body.name.trim(),
          slug: body.slug.trim(),
          cityId: body.cityId || null,
          website: body.website || null,
          description: body.description || null,
          establishedYear: body.establishedYear ? parseInt(body.establishedYear) : null,
          contactEmail: body.contactEmail || null,
          contactPhone: body.contactPhone || null,
          address: body.address || null,
          status: body.status ?? true,
          createdAt: new Date(),
        })
        .returning();

      // 2. Insert SEO metadata if provided (without metaKeywords)
      let seoRecord = null;
      const hasSeoData = body.metaTitle || body.metaDescription || body.canonicalUrl;
      
      if (hasSeoData) {
        const [newSeo] = await tx
          .insert(seoMetadata)
          .values({
            entityType: 'board',
            entityId: newBoard.id,
            metaTitle: body.metaTitle || null,
            metaDescription: body.metaDescription || null,
            // metaKeywords removed
            canonicalUrl: body.canonicalUrl || null,
            robots: body.robots || 'index, follow',
            ogTitle: body.ogTitle || body.metaTitle || null,
            ogDescription: body.ogDescription || body.metaDescription || null,
            ogImage: body.ogImage || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        seoRecord = newSeo;
      }

      return { newBoard, seoRecord };
    });

    return NextResponse.json({
      success: true,
      board: result.newBoard,
      seo: result.seoRecord ? 'created' : 'skipped',
      message: "Board created successfully",
    });

  } catch (error: any) {
    console.error("❌ Error creating board:", error);

    if (error.code === '23505') {
      if (error.message?.includes('slug')) {
        return NextResponse.json(
          { success: false, error: "Board with this slug already exists" },
          { status: 409 }
        );
      } else if (error.message?.includes('name')) {
        return NextResponse.json(
          { success: false, error: "Board with this name already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create board",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
