// app/api/admin/program-institutes/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programInstitutes } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

// GET - Get all relations (for testing)
export async function GET() {
  console.log("🚀 GET /api/admin/program-institutes called");
  
  try {
    const all = await db.select().from(programInstitutes);
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
  console.log("🚀 POST /api/admin/program-institutes called");
  
  try {
    const body = await request.json();
    console.log("📦 Request body:", body);

    // Check both possible field names
    const instituteId = body.instituteId;
    const programIds = body.programIds || [];
    
    if (!instituteId) {
      console.log("❌ Missing institute ID");
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

    console.log(`🔍 Processing institute ID: ${instituteId}, programs: ${programIds.length}`);

    try {
      // Delete all existing assignments for this institute
      await db
        .delete(programInstitutes)
        .where(eq(programInstitutes.instituteId, instituteId));

      console.log("✅ Deleted existing assignments");

      // Insert new assignments
      if (programIds.length > 0) {
        const values = programIds.map((programId: number) => ({
          instituteId: instituteId,
          programId: programId,
          status: true,
        }));

        await db.insert(programInstitutes).values(values);
        console.log(`✅ Inserted ${programIds.length} new assignments`);
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