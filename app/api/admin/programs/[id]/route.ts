// app/api/admin/programs/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programs, categories, seoMetadata } from "@/app/lib/schema";
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
        categoryId: programs.categoryId,
        categoryName: categories.name,
        shortDescription: programs.shortDescription,
        detailedOverview: programs.detailedOverview,
        whatYouLearn: programs.whatYouLearn,
        whyStudyThis: programs.whyStudyThis,
        careerOutlook: programs.careerOutlook,
        industryDemand: programs.industryDemand,
        typicalDuration: programs.typicalDuration,
        typicalFeeRange: programs.typicalFeeRange,
        commonEligibility: programs.commonEligibility,
        featuredImage: programs.featuredImage,
        icon: programs.icon,
        isFeatured: programs.isFeatured,
        isPopular: programs.isPopular,
        metaTitle: programs.metaTitle,
        metaDescription: programs.metaDescription,
        focusKeyword: programs.focusKeyword,
        introVideoUrl: programs.introVideoUrl,
        graduatesCount: programs.graduatesCount,
        placementRate: programs.placementRate,
        status: programs.status,
        createdAt: programs.createdAt,
        updatedAt: programs.updatedAt,
      })
      .from(programs)
      .leftJoin(categories, eq(programs.categoryId, categories.id))
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

    // Update program fields (new schema columns)
    const updateData: Record<string, any> = { updatedAt: new Date() };
    
    const fields = [
      "name", "slug", "categoryId", "status", "isFeatured", "isPopular",
      "shortDescription", "detailedOverview", "whatYouLearn", "whyStudyThis",
      "careerOutlook", "industryDemand", "typicalDuration", "typicalFeeRange",
      "commonEligibility", "featuredImage", "icon", "metaTitle", "metaDescription",
      "focusKeyword", "introVideoUrl", "graduatesCount", "placementRate"
    ];
    
    fields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === "categoryId" || field === "graduatesCount" || field === "placementRate") {
          updateData[field] = body[field] ? Number(body[field]) : null;
        } else if (field === "status" || field === "isFeatured" || field === "isPopular") {
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
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
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
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        shortDescription: body.shortDescription || null,
        detailedOverview: body.detailedOverview || null,
        whatYouLearn: body.whatYouLearn || null,
        whyStudyThis: body.whyStudyThis || null,
        careerOutlook: body.careerOutlook || null,
        industryDemand: body.industryDemand || null,
        typicalDuration: body.typicalDuration || null,
        typicalFeeRange: body.typicalFeeRange || null,
        commonEligibility: body.commonEligibility || null,
        featuredImage: body.featuredImage || null,
        icon: body.icon || null,
        isFeatured: body.isFeatured ?? false,
        isPopular: body.isPopular ?? false,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        focusKeyword: body.focusKeyword || null,
        introVideoUrl: body.introVideoUrl || null,
        graduatesCount: body.graduatesCount ? Number(body.graduatesCount) : null,
        placementRate: body.placementRate ? Number(body.placementRate) : null,
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
      metaTitle: body.seo?.metaTitle || body.metaTitle || null,
      metaDescription: body.seo?.metaDescription || body.metaDescription || null,
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

// DELETE - Delete program (also delete associated SEO metadata and offerings)
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

    // Delete program offerings (cascade should handle, but explicit for safety)
    const { programOfferings } = await import("@/app/lib/schema");
    await db.delete(programOfferings).where(eq(programOfferings.programId, programId));

    // Delete program
    await db.delete(programs).where(eq(programs.id, programId));

    return NextResponse.json({ 
      success: true, 
      message: "Program and its associated data deleted successfully" 
    });
  } catch (error) {
    console.error("DELETE program error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete program" }, { status: 500 });
  }
}