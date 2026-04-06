// app/api/public/date-sheets/route.ts

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { dateSheets, boards, institutes } from "@/app/lib/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'board' or 'university'
    const year = searchParams.get('year');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

    // Base query
    let baseQuery = db
      .select({
        id: dateSheets.id,
        title: dateSheets.title,
        slug: dateSheets.slug,
        examDate: dateSheets.examDate,
        examType: dateSheets.examType,
        officialLink: dateSheets.officialLink,
        downloadLink: dateSheets.downloadLink,
        pdfFile: dateSheets.pdfFile,
        isPopular: dateSheets.isPopular,
        boardName: boards.name,
        boardSlug: boards.slug,
        universityName: institutes.name,
        universitySlug: institutes.slug,
      })
      .from(dateSheets)
      .leftJoin(boards, eq(dateSheets.boardId, boards.id))
      .leftJoin(institutes, eq(dateSheets.instituteId, institutes.id));  // ✅ Fixed: universityId → instituteId

    // Conditions
    let conditions = [eq(dateSheets.status, true)];

    if (type === 'board') {
      conditions.push(sql`${dateSheets.boardId} IS NOT NULL`);
    } else if (type === 'university') {
      conditions.push(sql`${dateSheets.instituteId} IS NOT NULL`);  // ✅ Fixed: universityId → instituteId
    }

    if (year) {
      conditions.push(sql`EXTRACT(YEAR FROM ${dateSheets.examDate}) = ${year}`);
    }

    // Final query
    const allDateSheets = await baseQuery
      .where(and(...conditions))
      .orderBy(desc(dateSheets.examDate))
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: allDateSheets
    });
  } catch (error) {
    console.error("Error fetching date sheets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch date sheets" },
      { status: 500 }
    );
  }
}