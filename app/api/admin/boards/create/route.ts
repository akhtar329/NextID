import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { institutes } from "@/app/lib/schema";
import { InferInsertModel, eq } from "drizzle-orm";

type InsertInstitute = InferInsertModel<typeof institutes>;

interface RequestBody {
  name: string;
  type: string;
  cityId: number;
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();

    if (!body.name || !body.type || !body.cityId) {
      return NextResponse.json(
        { success: false, error: "Name, type and city are required" },
        { status: 400 }
      );
    }

    const slug = body.name.toLowerCase().trim().replace(/\s+/g, "-");

    // ✅ Check duplicate slug
    const existing = await db
      .select()
      .from(institutes)
      .where(eq(institutes.slug, slug));

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "Board with this name already exists" },
        { status: 400 }
      );
    }

    const insertData: InsertInstitute = {
      name: body.name,
      slug,
      type: body.type,
      cityId: body.cityId,
      status: true,
      createdAt: new Date(),
    };

    const result = await db
      .insert(institutes)
      .values(insertData)
      .returning({
        id: institutes.id,
        name: institutes.name,
        slug: institutes.slug,
        status: institutes.status,
        createdAt: institutes.createdAt,
      });

    return NextResponse.json({
      success: true,
      board: result[0],
    });
  } catch (error: any) {
    console.error("Error creating board:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Database error",
      },
      { status: 500 }
    );
  }
}
