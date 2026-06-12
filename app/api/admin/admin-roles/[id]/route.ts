// app/api/admin/admin-roles/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { adminRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

// Utility to get ID from request URL
function getIdFromUrl(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idStr = segments[segments.length - 1];
  const id = parseInt(idStr, 10);
  return isNaN(id) ? null : id;
}

// GET - Fetch single role
export async function GET(request: Request) {
  try {
    const roleId = getIdFromUrl(request);
    if (!roleId) {
      return NextResponse.json(
        { success: false, error: "Invalid role ID" },
        { status: 400 }
      );
    }

   const role = await db
  .select({
    id: adminRoles.id,
    name: adminRoles.name,
    description: adminRoles.description,
    status: adminRoles.status,
  })
  .from(adminRoles)
  .where(eq(adminRoles.id, roleId))
  .limit(1);

    if (!role.length) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, role: role[0] });
  } catch (error) {
    console.error("GET role error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch role" },
      { status: 500 }
    );
  }
}

// PATCH - Update role
export async function PATCH(request: Request) {
  try {
    const roleId = getIdFromUrl(request);
    if (!roleId) {
      return NextResponse.json(
        { success: false, error: "Invalid role ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    if (!body) {
      return NextResponse.json(
        { success: false, error: "No data provided" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(adminRoles)
      .where(eq(adminRoles.id, roleId))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    const updateData: Partial<{
      name: string;
      description: string;
      status: boolean;
      updatedAt: Date;
    }> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = Boolean(body.status);

const updated = await db
  .update(adminRoles)
  .set(updateData)
  .where(eq(adminRoles.id, roleId))
  .returning();

    return NextResponse.json({
      success: true,
      role: updated[0],
      message: "Role updated successfully",
    });
  } catch (error) {
    console.error("PATCH role error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update role" },
      { status: 500 }
    );
  }
}

// DELETE - Delete role
export async function DELETE(request: Request) {
  try {
    const roleId = getIdFromUrl(request);
    if (!roleId) {
      return NextResponse.json(
        { success: false, error: "Invalid role ID" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(adminRoles)
      .where(eq(adminRoles.id, roleId));

    if (!existing.length) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    await db.delete(adminRoles).where(eq(adminRoles.id, roleId));

    return NextResponse.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    console.error("DELETE role error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete role" },
      { status: 500 }
    );
  }
}
