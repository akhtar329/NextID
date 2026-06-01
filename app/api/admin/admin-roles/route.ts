
//app/api/admin/admin-roles/route.ts

import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { adminRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET: fetch all roles
export async function GET() {
  const roles = await db.select().from(adminRoles);
  return NextResponse.json({ success: true, roles });
}

// POST: create role
export async function POST(req: Request) {
  const { name, description, status } = await req.json();

  if (!name) {
    return NextResponse.json(
      { success: false, error: "Role name is required" },
      { status: 400 }
    );
  }

  // Check duplicate
  const existing = await db.select().from(adminRoles).where(eq(adminRoles.name, name));
  if (existing.length) {
    return NextResponse.json({ success: false, error: "Role already exists" }, { status: 400 });
  }

  await db.insert(adminRoles).values({
    name,
    description: description || "",
    status: status ?? true,
  });

  return NextResponse.json({ success: true, message: "Role created successfully" });
}
