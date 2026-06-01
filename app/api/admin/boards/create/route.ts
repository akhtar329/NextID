// app/api/admin/boards/create/route.ts

import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { boards, seoMetadata } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  
  try {
    const body = await request.json();

    // Validate
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

    // Fix sequence if needed
    try {
      const result = await db.execute<{ max: number | null }>(sql`SELECT MAX(id) as max FROM boards`);
      const maxId = result.rows[0]?.max ?? 0;
      await db.execute(sql`SELECT setval('boards_id_seq', ${maxId + 1}, false)`);
    } catch (seqErr) {
      console.warn("⚠️ Could not reset sequence:", seqErr);
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create board (without SEO fields)
      const [newBoard] = await tx
        .insert(boards)
        .values({
          name: body.name,
          slug: body.slug,
          cityId: body.cityId || null,
          website: body.website || null,
          description: body.description || null,
          establishedYear: body.establishedYear || null,
          contactEmail: body.contactEmail || null,
          contactPhone: body.contactPhone || null,
          address: body.address || null,
          status: body.status ?? true,
          createdAt: new Date(),
        })
        .returning();

      // 2. Insert SEO metadata (if provided)
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
      if (error.detail?.includes('slug')) {
        return NextResponse.json(
          { success: false, error: "Board with this slug already exists" },
          { status: 409 }
        );
      } else if (error.detail?.includes('name')) {
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
