
// app/api/admin/admin-roles/[id]/route.ts

import { NextResponse } from "next/server";
import { getDb } from "@/db/db";";
import { adminRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RoleUpdateData {
  name?: string;
  description?: string;
  status?: boolean;
  updatedAt?: Date;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getIdFromUrl(request: Request): number | null {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const idStr = segments[segments.length - 1];

    if (!idStr || !/^\d+$/.test(idStr)) {
      return null;
    }

    const id = Number(idStr);

    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

function isForeignKeyViolation(error: unknown): boolean {
  if (!isRecord(error)) {
    return false;
  }

  if (error.code === "23503") {
    return true;
  }

  return isRecord(error.cause) && error.cause.code === "23503";
}

// GET: Fetch a single role
export async function GET(request: Request) {
  try {
    const roleId = getIdFromUrl(request);

    if (roleId === null) {
      return NextResponse.json(
        { success: false, error: "Invalid role ID" },
        { status: 400 }
      );
    }

    const roles = await db
      .select({
        id: adminRoles.id,
        name: adminRoles.name,
        description: adminRoles.description,
        status: adminRoles.status,
      })
      .from(adminRoles)
      .where(eq(adminRoles.id, roleId))
      .limit(1);

    const role = roles[0];

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      role,
    });
  } catch (error) {
    console.error("GET role error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch role" },
      { status: 500 }
    );
  }
}

// PATCH: Update a role
export async function PATCH(request: Request) {
  try {
    const roleId = getIdFromUrl(request);

    if (roleId === null) {
      return NextResponse.json(
        { success: false, error: "Invalid role ID" },
        { status: 400 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    if (!isRecord(body)) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    const updateData: RoleUpdateData = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          { success: false, error: "Role name is required" },
          { status: 400 }
        );
      }

      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      if (typeof body.description !== "string") {
        return NextResponse.json(
          { success: false, error: "Description must be a string" },
          { status: 400 }
        );
      }

      updateData.description = body.description.trim();
    }

    if (body.status !== undefined) {
      if (typeof body.status !== "boolean") {
        return NextResponse.json(
          { success: false, error: "Status must be a boolean" },
          { status: 400 }
        );
      }

      updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: adminRoles.id })
      .from(adminRoles)
      .where(eq(adminRoles.id, roleId))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    updateData.updatedAt = new Date();

    const updated = await db
      .update(adminRoles)
      .set(updateData)
      .where(eq(adminRoles.id, roleId))
      .returning();

    if (!updated[0]) {
      return NextResponse.json(
        { success: false, error: "Role could not be updated" },
        { status: 500 }
      );
    }

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

// DELETE: Delete a role
export async function DELETE(request: Request) {
  try {
    const roleId = getIdFromUrl(request);

    if (roleId === null) {
      return NextResponse.json(
        { success: false, error: "Invalid role ID" },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: adminRoles.id })
      .from(adminRoles)
      .where(eq(adminRoles.id, roleId))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    await db.delete(adminRoles).where(eq(adminRoles.id, roleId));

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("DELETE role error:", error);

    if (isForeignKeyViolation(error)) {
      return NextResponse.json(
        {
          success: false,
          error: "This role is assigned to users and cannot be deleted.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete role" },
      { status: 500 }
    );
  }
}
