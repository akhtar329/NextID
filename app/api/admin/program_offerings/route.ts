// app/api/admin/program-offerings/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programOfferings } from "@/app/lib/schema";
import { eq, and } from "drizzle-orm";

// GET - Get all relations (for testing)
export async function GET() {
  try {
    const all = await db
      .select({
        id: programOfferings.id,
        programId: programOfferings.programId,
        instituteId: programOfferings.instituteId,
        degreeId: programOfferings.degreeId,
        status: programOfferings.status,
        createdAt: programOfferings.createdAt,
        updatedAt: programOfferings.updatedAt,
      })
      .from(programOfferings);
    
    return NextResponse.json({ 
      success: true, 
      data: all,
      count: all.length 
    });
  } catch (error) {
    console.error("❌ Error in GET:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST - Bulk assign
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const instituteId = body.instituteId;
    const programIds = body.programIds || [];
    const degreeId = body.degreeId || 31; // Default degree ID (Bachelor of Commerce)
    
    if (!instituteId) {
      return NextResponse.json(
        { success: false, error: "Institute ID is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(programIds)) {
      console.log("❌ Program IDs must be an array");
      return NextResponse.json(
        { success: false, error: "Program IDs must be an array" },
        { status: 400 }
      );
    }

    try {
      // Delete all existing assignments for this institute
      await db
        .delete(programOfferings)
        .where(eq(programOfferings.instituteId, instituteId));

      // Insert new assignments
      if (programIds.length > 0) {
        const values = programIds.map((programId: number) => ({
          programId: programId,
          instituteId: instituteId,
          degreeId: degreeId,
          status: true,
        }));

        await db.insert(programOfferings).values(values);
      }

      return NextResponse.json({
        success: true,
        message: "Programs assigned successfully",
        count: programIds.length
      });
      
    } catch (dbError) {
      console.error("❌ Database error:", dbError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Database error - table might not exist",
          details: dbError instanceof Error ? dbError.message : "Unknown error"
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("❌ Error in POST:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to assign programs",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}