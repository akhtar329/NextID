// app/api/public/date-sheets/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { dateSheets, boards, institutes } from "@/app/lib/schema";
import { desc, eq } from "drizzle-orm";

// ✅ NO params - This is for listing all date sheets
export async function GET() {
  try {
    const allDateSheets = await db
      .select({
        id: dateSheets.id,
        title: dateSheets.title,
        slug: dateSheets.slug,
        examType: dateSheets.examType,
        year: dateSheets.year,
        viewCount: dateSheets.viewCount,
        isPopular: dateSheets.isPopular,
        createdAt: dateSheets.createdAt,
        board: {
          name: boards.name,
        },
        institute: {
          name: institutes.name,
        },
      })
      .from(dateSheets)
      .leftJoin(boards, eq(dateSheets.boardId, boards.id))
      .leftJoin(institutes, eq(dateSheets.instituteId, institutes.id))
      .where(eq(dateSheets.status, true))
      .orderBy(desc(dateSheets.isPopular), desc(dateSheets.year), desc(dateSheets.createdAt));

    return NextResponse.json({
      success: true,
      data: allDateSheets,
      total: allDateSheets.length,
    });
  } catch (error) {
    console.error("Error fetching date sheets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch date sheets" },
      { status: 500 }
    );
  }
}