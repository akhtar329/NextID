// app/api/admin/results/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { results } from "@/app/lib/schema";
import { eq, and, inArray } from "drizzle-orm";

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

      if (!result.year) {
        errors.push(`Row ${i + 1}: Year is required`);
        continue;
      }

      // Validate that at least one of boardId or universityId is provided
      if (!result.boardId && !result.universityId) {
        errors.push(`Row ${i + 1}: Either boardId or universityId must be provided`);
        continue;
      }

      // If boardId is provided, verify board exists
      if (result.boardId) {
        const { boards } = await import("@/app/lib/schema");
        const boardExists = await db
          .select({ id: boards.id })
          .from(boards)
          .where(eq(boards.id, Number(result.boardId)));

        if (boardExists.length === 0) {
          errors.push(`Row ${i + 1}: Board ID ${result.boardId} does not exist`);
          continue;
        }
      }

      // If universityId is provided, verify university exists
      if (result.universityId) {
        const { institutes } = await import("@/app/lib/schema");
        const uniExists = await db
          .select({ id: institutes.id })
          .from(institutes)
          .where(eq(institutes.id, Number(result.universityId)));

        if (uniExists.length === 0) {
          errors.push(`Row ${i + 1}: University ID ${result.universityId} does not exist`);
          continue;
        }
      }

      // Check for duplicate (same title and year)
      const duplicate = await db
        .select()
        .from(results)
        .where(
          and(
            eq(results.title, result.title.trim()),
            eq(results.year, Number(result.year))
          )
        );

      if (duplicate.length > 0) {
        errors.push(`Row ${i + 1}: Result with title "${result.title}" and year ${result.year} already exists`);
        continue;
      }

      // Format date properly
      let resultDate = null;
      if (result.resultDate) {
        // Handle different date formats
        if (result.resultDate.includes('/')) {
          // Format: MM/DD/YYYY
          const [month, day, year] = result.resultDate.split('/');
          resultDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else {
          // Assume it's already in YYYY-MM-DD format
          resultDate = result.resultDate;
        }
      }

      validResults.push({
        title: result.title.trim(),
        boardId: result.boardId ? Number(result.boardId) : null,
        universityId: result.universityId ? Number(result.universityId) : null,
        year: Number(result.year),
        resultDate: resultDate,
        officialLink: result.officialLink || result.link || null,
        isPopular: result.isPopular === true || result.isPopular === 'true' ? true : false,
        status: result.status === false || result.status === 'false' ? false : true,
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

    // Insert results one by one for better error handling
    const inserted = [];
    const failed = [];

    for (const result of validResults) {
      try {
        const insertedResult = await db.insert(results)
          .values({
            title: result.title,
            boardId: result.boardId,
            universityId: result.universityId,
            year: result.year,
            resultDate: result.resultDate, // Now in proper format
            officialLink: result.officialLink,
            isPopular: result.isPopular,
            status: result.status,
          })
          .returning();
        
        inserted.push(insertedResult[0]);
        console.log(`✅ Inserted: ${result.title} (${result.year})`);
      } catch (err) {
        console.error(`❌ Failed to insert ${result.title}:`, err);
        failed.push(result.title);
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
      response.failed = failed;
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
            error: "Invalid board ID or university ID. Please check that all IDs exist." 
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