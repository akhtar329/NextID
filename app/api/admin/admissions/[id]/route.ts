// app/api/admin/admissions/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { admissions, admissionPrograms, programs, institutes, cities, degrees } from "@/app/lib/schema";
import { eq, and, inArray } from "drizzle-orm";

// GET - Fetch single admission with all programs
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

    // Fetch admission with institute details
    const admissionResult = await db
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
        updatedAt: admissions.updatedAt,
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
      .where(eq(admissions.id, admissionId))
      .limit(1);

    if (admissionResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }

    // Fetch all programs for this admission
    const programList = await db
      .select({
        id: programs.id,
        name: programs.name,
        slug: programs.slug,
      })
      .from(admissionPrograms)
      .innerJoin(programs, eq(admissionPrograms.programId, programs.id))
      .where(eq(admissionPrograms.admissionId, admissionId));

    // Get degree names
    const programListWithDegrees = await Promise.all(
      programList.map(async (p) => {
        const degreeInfo = await db
          .select({ name: degrees.name })
          .from(degrees)
          .innerJoin(programs, eq(programs.degreeId, degrees.id))
          .where(eq(programs.id, p.id))
          .limit(1);
        
        return {
          ...p,
          degreeName: degreeInfo[0]?.name || null,
        };
      })
    );

    // Combine data
    const transformedAdmission = {
      ...admissionResult[0],
      programs: programListWithDegrees,
    };

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

// PATCH - Update only admission status (for inline editing)
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

    // Validate status
    const { status } = body;
    const validStatuses = ["Expected", "Open", "Closed"];
    
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Valid status is required (Expected, Open, or Closed)" 
        },
        { status: 400 }
      );
    }

    // Check if admission exists
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

    // Update only the status
    const updated = await db
      .update(admissions)
      .set({
        status: status,
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
      admission: updated[0],
      message: `Status updated to ${status}`,
    });

  } catch (error: any) {
    console.error("❌ Error updating admission status:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update admission status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT - Update admission with multiple programs
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
    if (!body.instituteId || !body.year || !body.status || !body.name || !body.slug) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Institute ID, Year, Status, Name, and Slug are required" 
        },
        { status: 400 }
      );
    }

    // Validate programIds (array)
    const programIds = Array.isArray(body.programIds) ? body.programIds : [];
    if (programIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one program is required" },
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

    // Check if slug is being changed and already exists (exclude current)
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

    // Start transaction for update
    const result = await db.transaction(async (tx) => {
      // 1. Update admission
      const updated = await tx
        .update(admissions)
        .set({
          name: body.name,
          slug: body.slug,
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

      // 2. Delete old program links
      await tx
        .delete(admissionPrograms)
        .where(eq(admissionPrograms.admissionId, admissionId));

      // 3. Insert new program links
      const newLinks = await Promise.all(
        programIds.map(async (programId: number) => {
          const [link] = await tx
            .insert(admissionPrograms)
            .values({
              admissionId: admissionId,
              programId: Number(programId),
              createdAt: new Date(),
            })
            .returning();
          return link;
        })
      );

      return { updated: updated[0], programCount: newLinks.length };
    });

    return NextResponse.json({
      success: true,
      admission: result.updated,
      programCount: result.programCount,
      message: `Admission updated successfully with ${result.programCount} program(s)`,
    });

  } catch (error: any) {
    console.error("❌ Error updating admission:", error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      if (error.message?.includes('admissions_slug_unique')) {
        return NextResponse.json(
          { success: false, error: "Duplicate slug. Please choose a different slug." },
          { status: 400 }
        );
      }
      if (error.message?.includes('admission_programs_admission_id_program_id_unique')) {
        return NextResponse.json(
          { success: false, error: "Duplicate program. Cannot link same program twice." },
          { status: 400 }
        );
      }
    }

    // Handle foreign key violation
    if (error.code === '23503') {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid reference", 
          details: "One or more program IDs or institute ID do not exist." 
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

    // Delete (junction table records will be deleted automatically due to CASCADE)
    await db
      .delete(admissions)
      .where(eq(admissions.id, admissionId));
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