import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { admissions, admissionOfferings, programOfferings, programs, institutes, cities, seoMetadata } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// ==================== TYPES ====================
// FIXED: Remove unused interface or keep it for future use
// interface AdmissionUpdateData { ... } - Removed since not used

// ==================== HELPER FUNCTIONS ====================
const validateStatus = (status: string): status is 'Expected' | 'Open' | 'Closed' => {
  return ['Expected', 'Open', 'Closed'].includes(status);
};

// FIXED: Changed 'any' to 'unknown' with proper type checking
const validateOfferingIds = (offeringIds: unknown): offeringIds is number[] => {
  return Array.isArray(offeringIds) && offeringIds.length > 0 && offeringIds.every(id => typeof id === 'number');
};

const parseDate = (date: string | null): Date | null => {
  return date ? new Date(date) : null;
};

// ==================== GET - Fetch single admission ====================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admissionId = parseInt(id);

    if (isNaN(admissionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid admission ID" },
        { status: 400 }
      );
    }

    // Fetch admission with institute and city details
    const admission = await db
      .select({
        id: admissions.id,
        name: admissions.name,
        slug: admissions.slug,
        year: admissions.year,
        session: admissions.session,
        status: admissions.status,
        expectedOpenDate: admissions.expectedOpenDate,
        expectedCloseDate: admissions.expectedCloseDate,
        meritInfo: admissions.meritInfo,
        note: admissions.note,
        officialLink: admissions.officialLink,
        featuredImage: admissions.featuredImage,
        galleryImages: admissions.galleryImages,
        createdAt: admissions.createdAt,
        updatedAt: admissions.updatedAt,
        instituteId: admissions.instituteId,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        instituteType: institutes.type,
        instituteLogo: institutes.logo,
        cityId: cities.id,
        cityName: cities.name,
        citySlug: cities.slug,
        cityProvince: cities.province,
      })
      .from(admissions)
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .innerJoin(cities, eq(institutes.cityId, cities.id))
      .where(eq(admissions.id, admissionId))
      .limit(1);

    if (admission.length === 0) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }

    // Fetch offerings for this admission through admissionOfferings
    const offeringList = await db
      .select({
        id: programOfferings.id,
        programId: programs.id,
        programName: programs.name,
        programSlug: programs.slug,
        typicalDuration: programs.typicalDuration,
        typicalFeeRange: programs.typicalFeeRange,
      })
      .from(admissionOfferings)
      .innerJoin(programOfferings, eq(admissionOfferings.offeringId, programOfferings.id))
      .innerJoin(programs, eq(programOfferings.programId, programs.id))
      .where(eq(admissionOfferings.admissionId, admissionId));

    // Fetch SEO metadata
    const seo = await db
      .select()
      .from(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityType, 'admission'),
          eq(seoMetadata.entityId, admissionId)
        )
      )
      .limit(1);

    // Parse gallery images - handle both JSON string and array
    let galleryImagesArray: string[] = [];
    if (admission[0].galleryImages) {
      try {
        if (typeof admission[0].galleryImages === 'string') {
          galleryImagesArray = JSON.parse(admission[0].galleryImages);
        } else if (Array.isArray(admission[0].galleryImages)) {
          galleryImagesArray = admission[0].galleryImages;
        }
      } catch (e) {
        console.error('Error parsing gallery images:', e);
      }
    }

    // Format institute object
    const instituteObj = {
      id: admission[0].instituteId,
      name: admission[0].instituteName,
      slug: admission[0].instituteSlug,
      type: admission[0].instituteType,
      logo: admission[0].instituteLogo,
      city: {
        id: admission[0].cityId,
        name: admission[0].cityName,
        slug: admission[0].citySlug,
        province: admission[0].cityProvince,
      },
    };

    const response = {
      success: true,
      admission: {
        id: admission[0].id,
        name: admission[0].name,
        slug: admission[0].slug,
        year: admission[0].year,
        session: admission[0].session,
        status: admission[0].status,
        expectedOpenDate: admission[0].expectedOpenDate,
        expectedCloseDate: admission[0].expectedCloseDate,
        meritInfo: admission[0].meritInfo,
        note: admission[0].note,
        officialLink: admission[0].officialLink,
        featuredImage: admission[0].featuredImage,
        galleryImages: galleryImagesArray,
        createdAt: admission[0].createdAt,
        updatedAt: admission[0].updatedAt,
        instituteId: admission[0].instituteId,
        institute: instituteObj,
        offerings: offeringList,
        offeringCount: offeringList.length,
        seo: seo[0] || null,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Error fetching admission:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admission" },
      { status: 500 }
    );
  }
}

// ==================== PUT - Full update ====================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admissionId = parseInt(id);

    if (isNaN(admissionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid admission ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.slug || !body.instituteId || !body.year || !body.status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, slug, instituteId, year, status" },
        { status: 400 }
      );
    }

    // Validate status
    if (!validateStatus(body.status)) {
      return NextResponse.json(
        { success: false, error: "Status must be: Expected, Open, or Closed" },
        { status: 400 }
      );
    }

    // Validate offering IDs
    if (!validateOfferingIds(body.offeringIds)) {
      return NextResponse.json(
        { success: false, error: "At least one valid offering ID is required" },
        { status: 400 }
      );
    }

    // Check if admission exists
    const existing = await db
      .select({ id: admissions.id, slug: admissions.slug })
      .from(admissions)
      .where(eq(admissions.id, admissionId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }

    // Check slug uniqueness if changed
    if (body.slug !== existing[0].slug) {
      const slugExists = await db
        .select()
        .from(admissions)
        .where(eq(admissions.slug, body.slug))
        .limit(1);

      if (slugExists.length > 0) {
        return NextResponse.json(
          { success: false, error: "Slug already exists. Please choose a different slug." },
          { status: 400 }
        );
      }
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // 1. Update admission
      const [updatedAdmission] = await tx
        .update(admissions)
        .set({
          name: body.name.trim(),
          slug: body.slug.trim(),
          instituteId: Number(body.instituteId),
          year: Number(body.year),
          session: body.session || null,
          status: body.status,
          expectedOpenDate: parseDate(body.expectedOpenDate),
          expectedCloseDate: parseDate(body.expectedCloseDate),
          meritInfo: body.meritInfo || null,
          note: body.note || null,
          officialLink: body.officialLink || null,
          featuredImage: body.featuredImage || null,
          galleryImages: body.galleryImages && body.galleryImages.length > 0 ? body.galleryImages : null,
          updatedAt: new Date(),
        })
        .where(eq(admissions.id, admissionId))
        .returning();

      // 2. Update offering links (delete old, insert new)
      await tx
        .delete(admissionOfferings)
        .where(eq(admissionOfferings.admissionId, admissionId));

      const offeringLinks = await Promise.all(
        body.offeringIds.map(async (offeringId: number) => {
          const [link] = await tx
            .insert(admissionOfferings)
            .values({
              admissionId,
              offeringId,
              status: true,
              createdAt: new Date(),
            })
            .returning();
          return link;
        })
      );

      // 3. Update SEO metadata
      let seoRecord = null;
      const hasSeoData = body.metaTitle || body.metaDescription || body.metaKeywords || body.canonicalUrl;

      if (hasSeoData) {
        const existingSeo = await tx
          .select()
          .from(seoMetadata)
          .where(
            and(
              eq(seoMetadata.entityType, 'admission'),
              eq(seoMetadata.entityId, admissionId)
            )
          )
          .limit(1);

        const seoData = {
          metaTitle: body.metaTitle || null,
          metaDescription: body.metaDescription || null,
          metaKeywords: body.metaKeywords || null,
          canonicalUrl: body.canonicalUrl || null,
          robots: body.robots || 'index, follow',
          ogTitle: body.ogTitle || body.metaTitle || null,
          ogDescription: body.ogDescription || body.metaDescription || null,
          ogImage: body.ogImage || body.featuredImage || null,
          updatedAt: new Date(),
        };

        if (existingSeo.length > 0) {
          const [updated] = await tx
            .update(seoMetadata)
            .set(seoData)
            .where(eq(seoMetadata.id, existingSeo[0].id))
            .returning();
          seoRecord = updated;
        } else {
          const [created] = await tx
            .insert(seoMetadata)
            .values({
              entityType: 'admission',
              entityId: admissionId,
              ...seoData,
              createdAt: new Date(),
            })
            .returning();
          seoRecord = created;
        }
      }

      return {
        admission: updatedAdmission,
        offeringCount: offeringLinks.length,
        seo: seoRecord,
      };
    });

    return NextResponse.json({
      success: true,
      admission: result.admission,
      offeringCount: result.offeringCount,
      seo: result.seo ? 'updated' : 'skipped',
      message: `Admission updated successfully with ${result.offeringCount} offering(s)`,
    });

  } catch (error: unknown) {  // FIXED: Changed from 'any' to 'unknown'
    console.error("❌ Error updating admission:", error);
    
    const err = error as { code?: string; message?: string };
    
    // Handle unique constraint violations
    if (err.code === '23505') {
      if (err.message?.includes('admissions_slug_unique')) {
        return NextResponse.json(
          { success: false, error: "Slug already exists. Please choose a different slug." },
          { status: 400 }
        );
      }
      if (err.message?.includes('seo_metadata_entity_type_entity_id_unique')) {
        return NextResponse.json(
          { success: false, error: "SEO metadata already exists for this admission." },
          { status: 400 }
        );
      }
    }

    // Handle foreign key violations
    if (err.code === '23503') {
      return NextResponse.json(
        { success: false, error: "Invalid institute ID or offering ID. Please check your data." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update admission", details: err.message },
      { status: 500 }
    );
  }
}

// ==================== PATCH - Partial update (status only) ====================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admissionId = parseInt(id);

    if (isNaN(admissionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid admission ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !validateStatus(status)) {
      return NextResponse.json(
        { success: false, error: "Valid status is required: Expected, Open, or Closed" },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: admissions.id })
      .from(admissions)
      .where(eq(admissions.id, admissionId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(admissions)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(admissions.id, admissionId))
      .returning({
        id: admissions.id,
        name: admissions.name,
        status: admissions.status,
        updatedAt: admissions.updatedAt,
      });

    return NextResponse.json({
      success: true,
      admission: updated,
      message: `Status updated to ${status}`,
    });

  } catch (error) {
    console.error("❌ Error updating admission status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update admission status" },
      { status: 500 }
    );
  }
}

// ==================== DELETE - Delete admission ====================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admissionId = parseInt(id);

    if (isNaN(admissionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid admission ID" },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: admissions.id })
      .from(admissions)
      .where(eq(admissions.id, admissionId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }

    // Delete in transaction
    await db.transaction(async (tx) => {
      // Delete SEO metadata
      await tx
        .delete(seoMetadata)
        .where(
          and(
            eq(seoMetadata.entityType, 'admission'),
            eq(seoMetadata.entityId, admissionId)
          )
        );

      // Delete offering links (admissionOfferings)
      await tx
        .delete(admissionOfferings)
        .where(eq(admissionOfferings.admissionId, admissionId));

      // Delete admission
      await tx
        .delete(admissions)
        .where(eq(admissions.id, admissionId));
    });

    return NextResponse.json({
      success: true,
      message: "Admission deleted successfully",
    });

  } catch (error) {
    console.error("❌ Error deleting admission:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete admission" },
      { status: 500 }
    );
  }
}