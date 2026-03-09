// app/api/admin/results/bulk/route.ts (or wherever this code is)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { results, programs, boards, institutes } from "@/app/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📦 Results bulk upload received:", body);

    const { results: bulkResults } = body;

    // Validation
    if (!bulkResults || !Array.isArray(bulkResults)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid data format. Expected array of results." 
        },
        { status: 400 }
      );
    }

    if (bulkResults.length === 0) {
      return NextResponse.json(
        { success: false, error: "No results provided" },
        { status: 400 }
      );
    }

    console.log(`📊 Processing ${bulkResults.length} results for bulk upload`);

    // Validate each result
    const errors: string[] = [];
    const validResults = [];

    for (let i = 0; i < bulkResults.length; i++) {
      const result = bulkResults[i];
      
      console.log(`🔍 Validating result ${i + 1}:`, result);

      // Required fields
      if (!result.title) {
        errors.push(`Row ${i + 1}: Title is required`);
        continue;
      }

      if (!result.slug) {
        errors.push(`Row ${i + 1}: Slug is required`);
        continue;
      }

      if (!result.year) {
        errors.push(`Row ${i + 1}: Year is required`);
        continue;
      }

      // Validate at least one of programId, boardId, or universityId exists
      if (!result.programId && !result.boardId && !result.universityId) {
        errors.push(`Row ${i + 1}: At least one of programId, boardId, or universityId is required`);
        continue;
      }

      // Verify program exists if provided
      if (result.programId) {
        const programExists = await db
          .select({ id: programs.id })
          .from(programs)
          .where(eq(programs.id, Number(result.programId)));

        if (programExists.length === 0) {
          errors.push(`Row ${i + 1}: Program ID ${result.programId} does not exist`);
          continue;
        }
      }

      // Verify board exists if provided
      if (result.boardId) {
        const boardExists = await db
          .select({ id: boards.id })
          .from(boards)
          .where(eq(boards.id, Number(result.boardId)));

        if (boardExists.length === 0) {
          errors.push(`Row ${i + 1}: Board ID ${result.boardId} does not exist`);
          continue;
        }
      }

      // Verify university exists if provided
      if (result.universityId) {
        const universityExists = await db
          .select({ id: institutes.id })
          .from(institutes)
          .where(eq(institutes.id, Number(result.universityId)));

        if (universityExists.length === 0) {
          errors.push(`Row ${i + 1}: University ID ${result.universityId} does not exist`);
          continue;
        }
      }

      validResults.push({
        title: result.title,
        slug: result.slug,
        programId: result.programId ? Number(result.programId) : null,
        boardId: result.boardId ? Number(result.boardId) : null,
        universityId: result.universityId ? Number(result.universityId) : null,
        instituteId: result.instituteId ? Number(result.instituteId) : null,
        year: Number(result.year),
        resultDate: result.resultDate ? new Date(result.resultDate) : null,
        officialLink: result.officialLink || null,
        isPopular: result.isPopular === true || result.isPopular === 'true',
        status: result.status !== false,
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

    console.log(`✅ Valid results: ${validResults.length}`);

    // Insert results one by one
    const inserted = [];
    const failed = [];

    for (const result of validResults) {
      try {
        const insertedResult = await db.insert(results)
          .values({
            title: result.title,
            slug: result.slug,
            programId: result.programId,
            boardId: result.boardId,
            universityId: result.universityId,
            instituteId: result.instituteId,
            year: result.year,
            resultDate: result.resultDate,
            officialLink: result.officialLink,
            isPopular: result.isPopular,
            status: result.status,
          })
          .returning();
        
        inserted.push(insertedResult[0]);
        console.log(`✅ Inserted: ${result.title} (Year: ${result.year})`);
      } catch (err) {
        console.error(`❌ Failed to insert:`, err);
        failed.push(result);
      }
    }

    console.log(`✅ Successfully inserted ${inserted.length} results`);

    const response: any = {
      success: true,
      count: inserted.length,
      results: inserted,
      message: `Successfully created ${inserted.length} results`
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
            error: "Duplicate entry found. Some results already exist." 
          },
          { status: 409 }
        );
      }
      
      // Foreign key violation
      if ('code' in err && err.code === '23503') {
        return NextResponse.json(
          { 
            success: false, 
            error: "Invalid program ID, board ID, or university ID. Please check that all IDs exist." 
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