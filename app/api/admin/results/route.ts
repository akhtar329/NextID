// app/api/admin/results/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { results, institutes, boards } from "@/app/lib/schema";
import { desc, eq, and } from "drizzle-orm";

export async function GET(request: Request) {

  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const statusParam = searchParams.get("status");

    // Filters
    const conditions: any[] = [];

    if (yearParam) {
      const yearNum = parseInt(yearParam);
      if (!isNaN(yearNum)) conditions.push(eq(results.year, yearNum));
    }

    if (statusParam !== null) {
      const statusBool = statusParam === "true";
      conditions.push(eq(results.status, statusBool));
    }

    // ✅ UPDATED: Removed programId and programs join
    const filteredResults = await db
      .select({
        id: results.id,
        title: results.title,
        slug: results.slug,
        year: results.year,
        status: results.status,
        instituteId: results.instituteId,
        instituteName: institutes.name,
        boardId: results.boardId,
        boardName: boards.name,
        createdAt: results.createdAt,
      })
      .from(results)
      .leftJoin(institutes, eq(results.instituteId, institutes.id))
      .leftJoin(boards, eq(results.boardId, boards.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(results.year), desc(results.createdAt));

    return NextResponse.json({
      success: true,
      results: filteredResults,
      count: filteredResults.length,
    });
  } catch (error) {
    console.error("❌ Error fetching results:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
