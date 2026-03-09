// app/api/admin/admissions/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { admissions, programs, institutes } from "@/app/lib/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📦 Admissions bulk upload received:", body);

    const { admissions: bulkAdmissions } = body;

    // Validation
    if (!bulkAdmissions || !Array.isArray(bulkAdmissions)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid data format. Expected array of admissions." 
        },
        { status: 400 }
      );
    }

    if (bulkAdmissions.length === 0) {
      return NextResponse.json(
        { success: false, error: "No admissions provided" },
        { status: 400 }
      );
    }

    console.log(`📊 Processing ${bulkAdmissions.length} admissions for bulk upload`);

    // Validate each admission
    const errors: string[] = [];
    const validAdmissions = [];

    for (let i = 0; i < bulkAdmissions.length; i++) {
      const admission = bulkAdmissions[i];
      
      console.log(`🔍 Validating admission ${i + 1}:`, admission);

      // Required fields
      if (!admission.programId) {
        errors.push(`Row ${i + 1}: Program ID is required`);
        continue;
      }

      if (!admission.instituteId) {
        errors.push(`Row ${i + 1}: Institute ID is required`);
        continue;
      }

      if (!admission.year) {
        errors.push(`Row ${i + 1}: Year is required`);
        continue;
      }

      if (!admission.status) {
        errors.push(`Row ${i + 1}: Status is required`);
        continue;
      }

      // Validate status
      const validStatuses = ["Expected", "Open", "Closed"];
      if (!validStatuses.includes(admission.status)) {
        errors.push(`Row ${i + 1}: Status must be one of: Expected, Open, Closed`);
        continue;
      }

      // Verify program exists
      const programExists = await db
        .select({ id: programs.id })
        .from(programs)
        .where(eq(programs.id, Number(admission.programId)));

      if (programExists.length === 0) {
        errors.push(`Row ${i + 1}: Program ID ${admission.programId} does not exist`);
        continue;
      }

      // Verify institute exists
      const instituteExists = await db
        .select({ id: institutes.id })
        .from(institutes)
        .where(eq(institutes.id, Number(admission.instituteId)));

      if (instituteExists.length === 0) {
        errors.push(`Row ${i + 1}: Institute ID ${admission.instituteId} does not exist`);
        continue;
      }

      // Check for duplicate (same program, institute, year)
      const duplicate = await db
        .select()
        .from(admissions)
        .where(
          and(
            eq(admissions.programId, Number(admission.programId)),
            eq(admissions.instituteId, Number(admission.instituteId)),
            eq(admissions.year, Number(admission.year))
          )
        );

      if (duplicate.length > 0) {
        errors.push(`Row ${i + 1}: Admission for program ${admission.programId}, institute ${admission.instituteId}, year ${admission.year} already exists`);
        continue;
      }

      validAdmissions.push({
        programId: Number(admission.programId),
        instituteId: Number(admission.instituteId),
        year: Number(admission.year),
        session: admission.session || null,
        status: admission.status,
        expectedOpenDate: admission.expectedOpenDate || admission.expectedopendate || null,
        expectedCloseDate: admission.expectedCloseDate || admission.expectedclosedate || null,
        meritInfo: admission.meritInfo || admission.meritinfo || admission.merit || null,
        note: admission.note || null,
        officialLink: admission.officialLink || admission.officiallink || admission.link || null,
      });
    }

    if (errors.length > 0) {
      console.error("❌ Validation errors:", errors);
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation failed", 
          details: errors 
        },
        { status: 400 }
      );
    }

    console.log(`✅ Valid admissions: ${validAdmissions.length}`);

    // Insert admissions one by one for better error handling
    const inserted = [];
    const failed = [];

    for (const admission of validAdmissions) {
      try {
        const result = await db.insert(admissions)
          .values({
            programId: admission.programId,
            instituteId: admission.instituteId,
            year: admission.year,
            session: admission.session,
            status: admission.status,
            expectedOpenDate: admission.expectedOpenDate,
            expectedCloseDate: admission.expectedCloseDate,
            meritInfo: admission.meritInfo,
            note: admission.note,
            officialLink: admission.officialLink,
          })
          .returning();
        
        inserted.push(result[0]);
        console.log(`✅ Inserted: Program ${admission.programId}, Institute ${admission.instituteId}, Year ${admission.year}`);
      } catch (err) {
        console.error(`❌ Failed to insert:`, err);
        failed.push(admission);
      }
    }

    console.log(`✅ Successfully inserted ${inserted.length} admissions`);

    const response: any = {
      success: true,
      count: inserted.length,
      admissions: inserted,
      message: `Successfully created ${inserted.length} admissions`
    };

    if (failed.length > 0) {
      response.failed = failed.length;
      response.message += `, ${failed.length} failed`;
    }

    return NextResponse.json(response);

  } catch (err) {
    console.error("🔥 Bulk upload error:", err);
    
    if (err instanceof Error) {
      // PostgreSQL unique violation
      if ('code' in err && err.code === '23505') {
        return NextResponse.json(
          { 
            success: false, 
            error: "Duplicate entry found. Some admissions already exist." 
          },
          { status: 409 }
        );
      }
      
      // Foreign key violation
      if ('code' in err && err.code === '23503') {
        return NextResponse.json(
          { 
            success: false, 
            error: "Invalid program ID or institute ID. Please check that all IDs exist." 
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: err instanceof Error ? err.message : "Failed to process bulk upload" 
      },
      { status: 500 }
    );
  }
}