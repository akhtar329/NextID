// app/api/admin/boards/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { boards, seoMetadata } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET single board with SEO metadata
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const boardId = parseInt(id);

    if (isNaN(boardId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    // Fetch board with all fields
    const board = await db
      .select()
      .from(boards)
      .where(eq(boards.id, boardId));

    if (!board.length) {
      return NextResponse.json(
        { success: false, error: "Board not found" },
        { status: 404 }
      );
    }

    // Fetch SEO metadata
    const seo = await db
      .select()
      .from(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityType, 'board'),
          eq(seoMetadata.entityId, boardId)
        )
      )
      .limit(1);

    return NextResponse.json({ 
      success: true, 
      board: {
        ...board[0],
        seo: seo[0] || null,
      }
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch board" },
      { status: 500 }
    );
  }
}

// PATCH update board (partial update)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const boardId = parseInt(id);

    if (isNaN(boardId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Check if board exists
    const existing = await db
      .select()
      .from(boards)
      .where(eq(boards.id, boardId));

    if (!existing.length) {
      return NextResponse.json(
        { success: false, error: "Board not found" },
        { status: 404 }
      );
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Prepare update data for board (only core fields)
      const updateData: any = {};

      if (body.status !== undefined) {
        updateData.status = Boolean(body.status);
      }

      if (body.name) {
        updateData.name = body.name.trim();
      }

      if (body.slug) {
        updateData.slug = body.slug.trim();
      }

      if (body.cityId) {
        updateData.cityId = Number(body.cityId);
      }

      if (body.website !== undefined) {
        updateData.website = body.website || null;
      }

      if (body.description !== undefined) {
        updateData.description = body.description || null;
      }

      if (body.establishedYear !== undefined) {
        updateData.establishedYear = body.establishedYear ? parseInt(body.establishedYear) : null;
      }

      if (body.contactEmail !== undefined) {
        updateData.contactEmail = body.contactEmail || null;
      }

      if (body.contactPhone !== undefined) {
        updateData.contactPhone = body.contactPhone || null;
      }

      if (body.address !== undefined) {
        updateData.address = body.address || null;
      }

      // Update board (without updatedAt if it doesn't exist)
      const [updatedBoard] = await tx
        .update(boards)
        .set(updateData)
        .where(eq(boards.id, boardId))
        .returning();

      // Update SEO metadata if provided
      let updatedSeo = null;
      const hasSeoData = body.metaTitle !== undefined || 
                         body.metaDescription !== undefined || 
                         body.canonicalUrl !== undefined;

      if (hasSeoData) {
        const existingSeo = await tx
          .select()
          .from(seoMetadata)
          .where(
            and(
              eq(seoMetadata.entityType, 'board'),
              eq(seoMetadata.entityId, boardId)
            )
          )
          .limit(1);

        const seoData = {
          metaTitle: body.metaTitle !== undefined ? body.metaTitle : null,
          metaDescription: body.metaDescription !== undefined ? body.metaDescription : null,
          canonicalUrl: body.canonicalUrl !== undefined ? body.canonicalUrl : null,
          robots: body.robots !== undefined ? body.robots : 'index, follow',
          ogTitle: body.ogTitle !== undefined ? body.ogTitle : body.metaTitle,
          ogDescription: body.ogDescription !== undefined ? body.ogDescription : body.metaDescription,
          ogImage: body.ogImage !== undefined ? body.ogImage : null,
          updatedAt: new Date(),
        };

        if (existingSeo.length > 0) {
          const [seo] = await tx
            .update(seoMetadata)
            .set(seoData)
            .where(eq(seoMetadata.id, existingSeo[0].id))
            .returning();
          updatedSeo = seo;
        } else if (body.metaTitle || body.metaDescription || body.canonicalUrl) {
          const [seo] = await tx
            .insert(seoMetadata)
            .values({
              entityType: 'board',
              entityId: boardId,
              ...seoData,
              createdAt: new Date(),
            })
            .returning();
          updatedSeo = seo;
        }
      }

      return { board: updatedBoard, seo: updatedSeo };
    });

    return NextResponse.json({ 
      success: true, 
      board: result.board,
      seo: result.seo,
      message: result.seo ? "Board and SEO updated successfully" : "Board updated successfully"
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update board" },
      { status: 500 }
    );
  }
}

// PUT update board (full update)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const boardId = parseInt(id);

    if (isNaN(boardId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.slug || !body.cityId) {
      return NextResponse.json(
        { success: false, error: "Name, slug and city are required" },
        { status: 400 }
      );
    }

    // Check if board exists
    const existing = await db
      .select()
      .from(boards)
      .where(eq(boards.id, boardId));

    if (!existing.length) {
      return NextResponse.json(
        { success: false, error: "Board not found" },
        { status: 404 }
      );
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Full update board (without updatedAt)
      const [updatedBoard] = await tx
        .update(boards)
        .set({
          name: body.name.trim(),
          slug: body.slug.trim(),
          cityId: Number(body.cityId),
          website: body.website || null,
          description: body.description || null,
          establishedYear: body.establishedYear ? parseInt(body.establishedYear) : null,
          contactEmail: body.contactEmail || null,
          contactPhone: body.contactPhone || null,
          address: body.address || null,
          status: body.status !== undefined ? Boolean(body.status) : true,
        })
        .where(eq(boards.id, boardId))
        .returning();

      // Update SEO metadata
      let updatedSeo = null;
      const hasSeoData = body.metaTitle || body.metaDescription || body.canonicalUrl;

      if (hasSeoData) {
        const existingSeo = await tx
          .select()
          .from(seoMetadata)
          .where(
            and(
              eq(seoMetadata.entityType, 'board'),
              eq(seoMetadata.entityId, boardId)
            )
          )
          .limit(1);

        const seoData = {
          metaTitle: body.metaTitle || null,
          metaDescription: body.metaDescription || null,
          canonicalUrl: body.canonicalUrl || null,
          robots: body.robots || 'index, follow',
          ogTitle: body.ogTitle || body.metaTitle || null,
          ogDescription: body.ogDescription || body.metaDescription || null,
          ogImage: body.ogImage || null,
          updatedAt: new Date(),
        };

        if (existingSeo.length > 0) {
          const [seo] = await tx
            .update(seoMetadata)
            .set(seoData)
            .where(eq(seoMetadata.id, existingSeo[0].id))
            .returning();
          updatedSeo = seo;
        } else {
          const [seo] = await tx
            .insert(seoMetadata)
            .values({
              entityType: 'board',
              entityId: boardId,
              ...seoData,
              createdAt: new Date(),
            })
            .returning();
          updatedSeo = seo;
        }
      }

      return { board: updatedBoard, seo: updatedSeo };
    });

    return NextResponse.json({ 
      success: true, 
      board: result.board,
      seo: result.seo,
      message: "Board updated successfully"
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update board" },
      { status: 500 }
    );
  }
}

// DELETE board (also delete SEO metadata)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const boardId = parseInt(id);

    if (isNaN(boardId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    // Check if board exists
    const existing = await db
      .select({ id: boards.id })
      .from(boards)
      .where(eq(boards.id, boardId))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json(
        { success: false, error: "Board not found" },
        { status: 404 }
      );
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Delete SEO metadata
      await tx
        .delete(seoMetadata)
        .where(
          and(
            eq(seoMetadata.entityType, 'board'),
            eq(seoMetadata.entityId, boardId)
          )
        );

      // Delete board
      await tx
        .delete(boards)
        .where(eq(boards.id, boardId));
    });

    return NextResponse.json({ 
      success: true, 
      message: "Board deleted successfully" 
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete board" },
      { status: 500 }
    );
  }
}