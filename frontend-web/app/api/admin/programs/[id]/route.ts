// app/api/admin/programs/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { programs, degrees, levels } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

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
        seoTitle: programs.seoTitle,
        seoDescription: programs.seoDescription,
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

    return NextResponse.json({ success: true, program: program[0] });
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
    if (existing.length === 0) return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });

    const updateData: Record<string, any> = { updatedAt: new Date() };
    const fields = ["name","slug","degreeId","duration","status","overview","eligibility","careerScope","feeRange","seoTitle","seoDescription"];
    fields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = field === "degreeId" ? Number(body[field]) : body[field];
        if(field === "status") updateData[field] = Boolean(body[field]);
      }
    });

    const updated = await db.update(programs).set(updateData).where(eq(programs.id, programId)).returning();

    return NextResponse.json({ success: true, program: updated[0], message: "Program updated successfully" });
  } catch (error) {
    console.error("PATCH program error:", error);
    return NextResponse.json({ success: false, error: "Failed to update program" }, { status: 500 });
  }
}

// DELETE - Delete program
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const programId = parseProgramId(id);

    if (!programId) return NextResponse.json({ success: false, error: "Invalid program ID" }, { status: 400 });

    const existing = await db.select().from(programs).where(eq(programs.id, programId));
    if (existing.length === 0) return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });

    await db.delete(programs).where(eq(programs.id, programId));

    return NextResponse.json({ success: true, message: "Program deleted successfully" });
  } catch (error) {
    console.error("DELETE program error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete program" }, { status: 500 });
  }
}
