// app/api/admin/levels/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { levels } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { name, slug, displayOrder, status } = await req.json();
    const result = await db.insert(levels).values({
      name,
      slug,
      displayOrder,
      status,
    });
    return NextResponse.json({ success: true, level: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// Optional GET handler for debugging in browser
export async function GET() {
  return NextResponse.json({ message: "Send POST request to create level" });
}
