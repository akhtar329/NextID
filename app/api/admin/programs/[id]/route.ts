// app/api/admin/programs/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programs, degrees, levels, seoMetadata } from "@/app/lib/schema";
import { eq, and } from "drizzle-orm";

// Helper to parse program ID safely
const parseProgramId = (id: string) => {
  const programId = parseInt(id, 10);
  return isNaN(programId) ? null : programId;
};

// GET - Fetch single program
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const programId = parseProgramId(id);

    if (!programId) {
      return NextResponse.json({ success: false, error: "Invalid program ID" }, { status: 400 });
    }

    const program = await db
      .select({
        id: programs.id,
        name: programs.name,
        slug: programs.slug,
        degreeId: programs.degreeId,
        degreeName: degrees.name,
        levelName: levels.name,
        overview: programs.overview,
        eligibility: programs.eligibility,
        duration: programs.duration,
        careerScope: programs.careerScope,
        feeRange: programs.feeRange,
        // ❌ REMOVED: seoTitle, seoDescription
        status: programs.status,
        createdAt: programs.createdAt,
        updatedAt: programs.updatedAt,
      })
      .from(programs)
      .leftJoin(degrees, eq(programs.degreeId, degrees.id))
      .leftJoin(levels, eq(degrees.levelId, levels.id))
      .where(eq(programs.id, programId))
      .limit(1);

    if (!program || program.length === 0) {
      return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });
    }

    // Fetch SEO metadata for this program
    const seo = await db
      .select()
      .from(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityType, 'program'),
          eq(seoMetadata.entityId, programId)
        )
      )
      .limit(1);

    return NextResponse.json({ 
      success: true, 
      program: {
        ...program[0],
        seo: seo[0] || null,
      }
    });
  } catch (error) {
    console.error("GET program error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch program" }, { status: 500 });
  }
}

// PATCH - Partial update
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const programId = parseProgramId(id);

    if (!programId) {
      return NextResponse.json({ success: false, error: "Invalid program ID" }, { status: 400 });
    }

    const body = await request.json();

    const existing = await db.select().from(programs).where(eq(programs.id, programId)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });
    }

    // Update program fields (without SEO columns)
    const updateData: Record<string, any> = { updatedAt: new Date() };
    const fields = ["name", "slug", "degreeId", "duration", "status", "overview", "eligibility", "careerScope", "feeRange"];
    
    fields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === "degreeId") {
          updateData[field] = Number(body[field]);
        } else if (field === "status") {
          updateData[field] = Boolean(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    });

    const updated = await db
      .update(programs)
      .set(updateData)
      .where(eq(programs.id, programId))
      .returning();

    // Handle SEO metadata update if provided
    let updatedSeo = null;
    if (body.seo && Object.keys(body.seo).length > 0) {
      const existingSeo = await db
        .select()
        .from(seoMetadata)
        .where(
          and(
            eq(seoMetadata.entityType, 'program'),
            eq(seoMetadata.entityId, programId)
          )
        )
        .limit(1);

      const seoData = {
        entityType: 'program',
        entityId: programId,
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
        const seoResult = await db
          .update(seoMetadata)
          .set(seoData)
          .where(
            and(
              eq(seoMetadata.entityType, 'program'),
              eq(seoMetadata.entityId, programId)
            )
          )
          .returning();
        updatedSeo = seoResult[0];
      } else if (body.seo.metaTitle || body.seo.metaDescription) {
        // Create new SEO only if there's actual data
        const seoResult = await db
          .insert(seoMetadata)
          .values({
            ...seoData,
            createdAt: new Date(),
          })
          .returning();
        updatedSeo = seoResult[0];
      }
    }

    return NextResponse.json({ 
      success: true, 
      program: {
        ...updated[0],
        seo: updatedSeo,
      },
      message: "Program updated successfully" 
    });
  } catch (error) {
    console.error("PATCH program error:", error);
    return NextResponse.json({ success: false, error: "Failed to update program" }, { status: 500 });
  }
}

// PUT - Full update
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const programId = parseProgramId(id);

    if (!programId) {
      return NextResponse.json({ success: false, error: "Invalid program ID" }, { status: 400 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.slug || !body.degreeId) {
      return NextResponse.json(
        { success: false, error: "Name, slug, and degreeId are required" },
        { status: 400 }
      );
    }

    const existing = await db.select().from(programs).where(eq(programs.id, programId)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });
    }

    // Check slug uniqueness (excluding current program)
    const slugExists = await db
      .select()
      .from(programs)
      .where(eq(programs.slug, body.slug))
      .limit(1);
    
    if (slugExists.length > 0 && slugExists[0].id !== programId) {
      return NextResponse.json(
        { success: false, error: "Program with this slug already exists" },
        { status: 409 }
      );
    }

    // Full update
    const updated = await db
      .update(programs)
      .set({
        name: body.name,
        slug: body.slug,
        degreeId: Number(body.degreeId),
        overview: body.overview || null,
        eligibility: body.eligibility || null,
        duration: body.duration || null,
        careerScope: body.careerScope || null,
        feeRange: body.feeRange || null,
        status: body.status ?? true,
        updatedAt: new Date(),
      })
      .where(eq(programs.id, programId))
      .returning();

    // Handle SEO metadata
    let updatedSeo = null;
    const existingSeo = await db
      .select()
      .from(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityType, 'program'),
          eq(seoMetadata.entityId, programId)
        )
      )
      .limit(1);

    const seoData = {
      entityType: 'program',
      entityId: programId,
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
      const seoResult = await db
        .update(seoMetadata)
        .set(seoData)
        .where(
          and(
            eq(seoMetadata.entityType, 'program'),
            eq(seoMetadata.entityId, programId)
          )
        )
        .returning();
      updatedSeo = seoResult[0];
    } else if (body.seo && (body.seo.metaTitle || body.seo.metaDescription)) {
      const seoResult = await db
        .insert(seoMetadata)
        .values({
          ...seoData,
          createdAt: new Date(),
        })
        .returning();
      updatedSeo = seoResult[0];
    }

    return NextResponse.json({ 
      success: true, 
      program: {
        ...updated[0],
        seo: updatedSeo,
      },
      message: "Program updated successfully" 
    });
  } catch (error) {
    console.error("PUT program error:", error);
    return NextResponse.json({ success: false, error: "Failed to update program" }, { status: 500 });
  }
}

// DELETE - Delete program (also delete associated SEO metadata)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const programId = parseProgramId(id);

    if (!programId) {
      return NextResponse.json({ success: false, error: "Invalid program ID" }, { status: 400 });
    }

    const existing = await db.select().from(programs).where(eq(programs.id, programId));
    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });
    }

    // Delete SEO metadata first
    await db
      .delete(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityType, 'program'),
          eq(seoMetadata.entityId, programId)
        )
      );

    // Delete program
    await db.delete(programs).where(eq(programs.id, programId));

    return NextResponse.json({ 
      success: true, 
      message: "Program and its SEO metadata deleted successfully" 
    });
  } catch (error) {
    console.error("DELETE program error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete program" }, { status: 500 });
  }
}