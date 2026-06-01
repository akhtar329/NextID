// app/api/admin/admissions/route.ts - COMPLETE FILE (FIXED)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { admissions, admissionOfferings, seoMetadata, institutes, cities, programOfferings, programs } from "@/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { invalidateAdmissionsCache } from "@/cache/admissions/admissions.cache";

// ============================================================
// HELPER: Safe date conversion
// ============================================================
function safeDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  try {
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

// ============================================================
// GET - Fetch admissions list
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const status = searchParams.get("status");
    const programId = searchParams.get("programId");
    const instituteId = searchParams.get("instituteId");

    const conditions = [];

    if (year) conditions.push(eq(admissions.year, parseInt(year)));
    if (status) conditions.push(eq(admissions.status, status));
    if (instituteId) conditions.push(eq(admissions.instituteId, parseInt(instituteId)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const admissionsList = await db
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
        createdAt: admissions.createdAt,
        instituteId: admissions.instituteId,
        institute: {
          id: institutes.id,
          name: institutes.name,
          slug: institutes.slug,
          cityName: cities.name,
        },
      })
      .from(admissions)
      .innerJoin(institutes, eq(admissions.instituteId, institutes.id))
      .innerJoin(cities, eq(institutes.cityId, cities.id))
      .where(whereClause)
      .orderBy(desc(admissions.year), desc(admissions.createdAt));

    const admissionsWithPrograms = await Promise.all(
      admissionsList.map(async (ad) => {
        let programList: { id: number; name: string; slug: string }[] = [];
        
        try {
          const offeringLinks = await db
            .select({ offeringId: admissionOfferings.offeringId })
            .from(admissionOfferings)
            .where(eq(admissionOfferings.admissionId, ad.id));

          const offeringIds = offeringLinks.map(o => o.offeringId);
          
          if (offeringIds.length > 0) {
            programList = await db
              .select({
                id: programs.id,
                name: programs.name,
                slug: programs.slug,
              })
              .from(programOfferings)
              .innerJoin(programs, eq(programOfferings.programId, programs.id))
              .where(inArray(programOfferings.id, offeringIds));
          }
        } catch (err) {
          console.error(`Error fetching programs for admission ${ad.id}:`, err);
        }

        if (programId && programList.length > 0) {
          programList = programList.filter(p => p.id === parseInt(programId));
        }

        return { ...ad, programs: programList };
      })
    );

    let finalAdmissions = admissionsWithPrograms;
    if (programId) {
      finalAdmissions = admissionsWithPrograms.filter(ad => 
        ad.programs.some(p => p.id === parseInt(programId))
      );
    }

    return NextResponse.json({
      success: true,
      admissions: finalAdmissions,
      total: finalAdmissions.length,
    });

  } catch (error) {
    console.error("❌ Error fetching admissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admissions" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create new admission
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("📥 Received:", { 
      name: body.name, 
      offeringIds: body.offeringIds, 
      instituteId: body.instituteId,
      year: body.year 
    });
    
    // Validate required fields
    if (!body.name || !body.instituteId || !body.year) {
      return NextResponse.json(
        { error: "Missing required fields: name, instituteId, year" },
        { status: 400 }
      );
    }
    
    if (!body.offeringIds || body.offeringIds.length === 0) {
      return NextResponse.json(
        { error: "At least one program offering is required" },
        { status: 400 }
      );
    }
    
    // Generate slug if not provided
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Start transaction
    const result = await db.transaction(async (tx) => {
      // 1. Insert admission
      const [newAdmission] = await tx
        .insert(admissions)
        .values({
          name: body.name,
          slug: slug,
          year: body.year,
          session: body.session || null,
          status: body.status || "Expected",
          expectedOpenDate: safeDate(body.expectedOpenDate),
          expectedCloseDate: safeDate(body.expectedCloseDate),
          instituteId: body.instituteId,
          eligibility: body.eligibility || null,
          howToApply: body.howToApply || null,
          requiredDocuments: body.requiredDocuments || null,
          feeStructure: body.feeStructure || null,
          meritInfo: body.meritInfo || null,
          note: body.note || null,
          officialLink: body.officialLink || null,
          applicationLink: body.applicationLink || null,
          featuredImage: body.featuredImage || null,
          viewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      console.log("✅ Admission created:", newAdmission.id);
      
      // 2. Insert admission offerings
      const offeringIds = Array.isArray(body.offeringIds) ? body.offeringIds : [body.offeringIds];
      
      for (const offeringId of offeringIds) {
        await tx
          .insert(admissionOfferings)
          .values({
            admissionId: newAdmission.id,
            offeringId: offeringId,
            status: true,
            createdAt: new Date(),
          });
      }
      
      console.log(`✅ Added ${offeringIds.length} offering(s)`);
      
      // 3. Insert SEO metadata if provided
      if (body.metaTitle || body.metaDescription || body.canonicalUrl) {
        await tx
          .insert(seoMetadata)
          .values({
            entityType: 'admission',
            entityId: newAdmission.id,
            metaTitle: body.metaTitle || null,
            metaDescription: body.metaDescription || null,
            metaKeywords: body.metaKeywords || null,
            canonicalUrl: body.canonicalUrl || null,
            robots: body.robots || 'index, follow',
            ogTitle: body.ogTitle || body.metaTitle || null,
            ogDescription: body.ogDescription || body.metaDescription || null,
            ogImage: body.ogImage || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
      }
      
      return newAdmission;
    });
    
    // Clear cache
    await invalidateAdmissionsCache();
    console.log("✅ Cache cleared");
    
    return NextResponse.json({ 
      success: true, 
      admission: result,
      message: "Admission created successfully"
    });
    
  } catch (error) {
    console.error("❌ Error creating admission:", error);
    return NextResponse.json(
      { error: "Failed to create admission", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT - Update admission
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ error: "Missing admission id" }, { status: 400 });
    }
    
    const [updatedAdmission] = await db
      .update(admissions)
      .set({
        name: body.name,
        session: body.session,
        status: body.status,
        expectedOpenDate: safeDate(body.expectedOpenDate),
        expectedCloseDate: safeDate(body.expectedCloseDate),
        meritInfo: body.meritInfo,
        note: body.note,
        officialLink: body.officialLink,
        applicationLink: body.applicationLink,
        featuredImage: body.featuredImage,
        updatedAt: new Date(),
      })
      .where(eq(admissions.id, body.id))
      .returning();
    
    // ✅ FIXED: Use and() instead of multiple .where()
    if (body.metaTitle || body.metaDescription) {
      await db
        .update(seoMetadata)
        .set({
          metaTitle: body.metaTitle || null,
          metaDescription: body.metaDescription || null,
          canonicalUrl: body.canonicalUrl || null,
          robots: body.robots || 'index, follow',
          ogTitle: body.ogTitle || body.metaTitle || null,
          ogDescription: body.ogDescription || body.metaDescription || null,
          ogImage: body.ogImage || null,
          updatedAt: new Date(),
        })
        .where(and(
          eq(seoMetadata.entityId, body.id),
          eq(seoMetadata.entityType, 'admission')
        ));
    }
    
    await invalidateAdmissionsCache();
    
    return NextResponse.json({ success: true, admission: updatedAdmission });
    
  } catch (error) {
    console.error("❌ Error updating admission:", error);
    return NextResponse.json({ error: "Failed to update admission" }, { status: 500 });
  }
}

// ============================================================
// DELETE - Delete admission
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Missing admission id" }, { status: 400 });
    }
    
    const admissionId = parseInt(id);
    
    // Delete related records first
    await db.delete(admissionOfferings).where(eq(admissionOfferings.admissionId, admissionId));
    await db.delete(seoMetadata).where(eq(seoMetadata.entityId, admissionId));
    
    const [deletedAdmission] = await db
      .delete(admissions)
      .where(eq(admissions.id, admissionId))
      .returning();
    
    if (!deletedAdmission) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    }
    
    await invalidateAdmissionsCache();
    
    return NextResponse.json({ success: true, message: "Admission deleted successfully" });
    
  } catch (error) {
    console.error("❌ Error deleting admission:", error);
    return NextResponse.json({ error: "Failed to delete admission" }, { status: 500 });
  }
}

// ============================================================
// PATCH - Update status only
// ============================================================
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id || !body.status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }
    
    const [updatedAdmission] = await db
      .update(admissions)
      .set({
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(admissions.id, body.id))
      .returning();
    
    if (!updatedAdmission) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    }
    
    await invalidateAdmissionsCache();
    
    return NextResponse.json({ success: true, admission: updatedAdmission });
    
  } catch (error) {
    console.error("❌ Error updating status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}