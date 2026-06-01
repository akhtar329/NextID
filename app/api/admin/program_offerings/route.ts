import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { programOfferings, programs, degrees, institutes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

// ============================================================
// GET - Fetch program offerings
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instituteId = searchParams.get("instituteId");
    const programId = searchParams.get("programId");
    const degreeId = searchParams.get("degreeId");

    const conditions = [];

    if (instituteId) conditions.push(eq(programOfferings.instituteId, parseInt(instituteId)));
    if (programId) conditions.push(eq(programOfferings.programId, parseInt(programId)));
    if (degreeId) conditions.push(eq(programOfferings.degreeId, parseInt(degreeId)));

    // ✅ FIXED: Create whereClause first, then apply it
    let whereClause = undefined;
    if (conditions.length > 0) {
      whereClause = and(...conditions);
    }

    const offerings = await db
      .select({
        id: programOfferings.id,
        programId: programOfferings.programId,
        degreeId: programOfferings.degreeId,
        instituteId: programOfferings.instituteId,
        customName: programOfferings.customName,
        duration: programOfferings.duration,
        feeRange: programOfferings.feeRange,
        specificEligibility: programOfferings.specificEligibility,
        additionalInfo: programOfferings.additionalInfo,
        specializations: programOfferings.specializations,
        status: programOfferings.status,
        createdAt: programOfferings.createdAt,
        updatedAt: programOfferings.updatedAt,
        program: {
          id: programs.id,
          name: programs.name,
          slug: programs.slug,
        },
        degree: {
          id: degrees.id,
          name: degrees.name,
          slug: degrees.slug,
        },
        institute: {
          id: institutes.id,
          name: institutes.name,
          slug: institutes.slug,
        },
      })
      .from(programOfferings)
      .innerJoin(programs, eq(programOfferings.programId, programs.id))
      .innerJoin(degrees, eq(programOfferings.degreeId, degrees.id))
      .innerJoin(institutes, eq(programOfferings.instituteId, institutes.id))
      .where(whereClause)
      .orderBy(desc(programOfferings.createdAt));

    return NextResponse.json({
      success: true,
      offerings,
      total: offerings.length,
    });

  } catch (error) {
    console.error("❌ Error fetching program offerings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch program offerings" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create program offering
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.programId || !body.degreeId || !body.instituteId) {
      return NextResponse.json(
        { error: "Missing required fields: programId, degreeId, instituteId" },
        { status: 400 }
      );
    }

    const [newOffering] = await db
      .insert(programOfferings)
      .values({
        programId: body.programId,
        degreeId: body.degreeId,
        instituteId: body.instituteId,
        customName: body.customName || null,
        duration: body.duration || null,
        feeRange: body.feeRange || null,
        specificEligibility: body.specificEligibility || null,
        additionalInfo: body.additionalInfo || null,
        specializations: body.specializations || null,
        status: body.status !== undefined ? body.status : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      offering: newOffering,
    });

  } catch (error) {
    console.error("❌ Error creating program offering:", error);
    return NextResponse.json(
      { error: "Failed to create program offering" },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT - Update program offering
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Missing offering id" }, { status: 400 });
    }

    const [updatedOffering] = await db
      .update(programOfferings)
      .set({
        customName: body.customName,
        duration: body.duration,
        feeRange: body.feeRange,
        specificEligibility: body.specificEligibility,
        additionalInfo: body.additionalInfo,
        specializations: body.specializations,
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(programOfferings.id, body.id))
      .returning();

    if (!updatedOffering) {
      return NextResponse.json({ error: "Program offering not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      offering: updatedOffering,
    });

  } catch (error) {
    console.error("❌ Error updating program offering:", error);
    return NextResponse.json(
      { error: "Failed to update program offering" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Delete program offering
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing offering id" }, { status: 400 });
    }

    const offeringId = parseInt(id);

    const [deletedOffering] = await db
      .delete(programOfferings)
      .where(eq(programOfferings.id, offeringId))
      .returning();

    if (!deletedOffering) {
      return NextResponse.json({ error: "Program offering not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Program offering deleted successfully",
    });

  } catch (error) {
    console.error("❌ Error deleting program offering:", error);
    return NextResponse.json(
      { error: "Failed to delete program offering" },
      { status: 500 }
    );
  }
}