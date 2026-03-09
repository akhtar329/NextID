// app/api/admin/admissions/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { admissions, programs, institutes, cities } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

// GET - Fetch single admission
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🚀 GET /api/admin/admissions/[id] called");
  
  try {
    const { id } = await params;
    const admissionId = parseInt(id);

    if (isNaN(admissionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid admission ID" },
        { status: 400 }
      );
    }

    const admission = await db
      .select({
        id: admissions.id,
        // ✅ ADD name AND slug HERE
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
        updatedAt: admissions.updatedAt,
        programId: admissions.programId,
        instituteId: admissions.instituteId,
        programName: programs.name,
        programSlug: programs.slug,
        instituteName: institutes.name,
        instituteSlug: institutes.slug,
        instituteCity: cities.name,
      })
      .from(admissions)
      .leftJoin(programs, eq(admissions.programId, programs.id))
      .leftJoin(institutes, eq(admissions.instituteId, institutes.id))
      .leftJoin(cities, eq(institutes.cityId, cities.id))
      .where(eq(admissions.id, admissionId))
      .limit(1);

    if (admission.length === 0) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }

    // Transform data with ALL fields
    const transformedAdmission = {
      id: admission[0].id,
      // ✅ Include name and slug in response
      name: admission[0].name || "",
      slug: admission[0].slug || "",
      year: admission[0].year,
      session: admission[0].session,
      status: admission[0].status,
      expectedOpenDate: admission[0].expectedOpenDate,
      expectedCloseDate: admission[0].expectedCloseDate,
      meritInfo: admission[0].meritInfo,
      note: admission[0].note,
      officialLink: admission[0].officialLink,
      createdAt: admission[0].createdAt,
      updatedAt: admission[0].updatedAt,
      programId: admission[0].programId,
      instituteId: admission[0].instituteId,
      program: {
        id: admission[0].programId,
        name: admission[0].programName || "Unknown Program",
        slug: admission[0].programSlug || "",
      },
      institute: {
        id: admission[0].instituteId,
        name: admission[0].instituteName || "Unknown Institute",
        slug: admission[0].instituteSlug || "",
        cityName: admission[0].instituteCity || "Unknown City",
      },
    };

    console.log("✅ Admission found with name:", transformedAdmission.name);
    console.log("✅ Admission slug:", transformedAdmission.slug);

    return NextResponse.json({
      success: true,
      admission: transformedAdmission,
    });

  } catch (error) {
    console.error("❌ Error fetching admission:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch admission",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// PUT - Update admission
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🚀 PUT /api/admin/admissions/[id] called");
  
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
    console.log("📦 Update data:", body);

    // Validate required fields - ✅ ADD name AND slug
    if (!body.programId || !body.instituteId || !body.year || !body.status || !body.name || !body.slug) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Program ID, Institute ID, Year, Status, Name, and Slug are required" 
        },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["Expected", "Open", "Closed"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Status must be Expected, Open, or Closed" },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await db
      .select()
      .from(admissions)
      .where(eq(admissions.id, admissionId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }

    // ✅ Check if slug is being changed and already exists (exclude current)
    if (body.slug !== existing[0].slug) {
      const slugExists = await db
        .select()
        .from(admissions)
        .where(eq(admissions.slug, body.slug))
        .limit(1);

      if (slugExists.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Slug already exists. Please choose a different slug." 
          },
          { status: 400 }
        );
      }
    }

    // Update admission - ✅ ADD name AND slug
    const updated = await db
      .update(admissions)
      .set({
        name: body.name,
        slug: body.slug,
        programId: Number(body.programId),
        instituteId: Number(body.instituteId),
        year: Number(body.year),
        session: body.session || null,
        status: body.status,
        expectedOpenDate: body.expectedOpenDate ? new Date(body.expectedOpenDate) : null,
        expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
        meritInfo: body.meritInfo || null,
        note: body.note || null,
        officialLink: body.officialLink || null,
        updatedAt: new Date(),
      })
      .where(eq(admissions.id, admissionId))
      .returning();

    console.log("✅ Admission updated:", admissionId);

    return NextResponse.json({
      success: true,
      admission: updated[0],
      message: "Admission updated successfully",
    });

  } catch (error) {
    console.error("❌ Error updating admission:", error);
    
    // Handle unique constraint violation
    if ((error as any).code === '23505') {
      return NextResponse.json(
        { 
          success: false, 
          error: "Duplicate slug. Please choose a different slug." 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update admission",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete admission
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🚀 DELETE /api/admin/admissions/[id] called");
  
  try {
    const { id } = await params;
    const admissionId = parseInt(id);

    if (isNaN(admissionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid admission ID" },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await db
      .select()
      .from(admissions)
      .where(eq(admissions.id, admissionId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }

    // Delete
    await db
      .delete(admissions)
      .where(eq(admissions.id, admissionId));

    console.log("✅ Admission deleted:", admissionId);

    return NextResponse.json({
      success: true,
      message: "Admission deleted successfully",
    });

  } catch (error) {
    console.error("❌ Error deleting admission:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete admission",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}