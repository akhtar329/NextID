// app/api/admin/programs/create/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programs } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  console.log("🚀 POST /api/admin/programs/create - START");

  try {
    // Parse request body
    const body = await request.json().catch(e => {
      console.error("❌ Invalid JSON:", e);
      return NextResponse.json(
        { success: false, error: "Invalid JSON format" },
        { status: 400 }
      );
    });

    // Agar error response mil gaya to return karo
    if (body instanceof NextResponse) return body;

    const { 
      name, 
      slug, 
      degreeId, 
      overview, 
      eligibility, 
      duration, 
      careerScope, 
      feeRange, 
      seoTitle, 
      seoDescription,
      isFeatured,
      status 
    } = body;

    // Validate required fields
    if (!name || !slug || !degreeId) {
      console.log("❌ Missing required fields:", { name, slug, degreeId });
      return NextResponse.json(
        { 
          success: false, 
          error: "Name, slug, and degreeId are required" 
        }, 
        { status: 400 }
      );
    }

    // Check for existing slug
    const existing = await db
      .select()
      .from(programs)
      .where(eq(programs.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      console.log("❌ Slug already exists:", slug);
      return NextResponse.json(
        { 
          success: false, 
          error: "Slug already exists. Please use a different slug." 
        }, 
        { status: 400 }
      );
    }

    // Insert new program with all fields
    const newProgram = await db.insert(programs).values({
      name,
      slug,
      degreeId: Number(degreeId),
      overview: overview || null,
      eligibility: eligibility || null,
      duration: duration || null,
      careerScope: careerScope || null,
      feeRange: feeRange || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      isFeatured: isFeatured || false,
      status: status !== undefined ? status : true,
      // created_at and updated_at automatically set by database default
    }).returning();

    console.log("✅ Program created successfully:", newProgram[0]);
    return NextResponse.json({ 
      success: true, 
      program: newProgram[0],
      message: "Program created successfully" 
    });

  } catch (error) {
    console.error("❌ POST error:", error);
    
    // Handle specific database errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { 
          success: false, 
          error: "A program with this slug already exists" 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
    
  } finally {
    console.log("🏁 POST /api/admin/programs/create - END");
  }
}