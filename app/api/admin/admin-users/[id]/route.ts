
// app/api/admin/admin-users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { adminUsers, adminRoles } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";

interface UpdateUserData {
  name?: string;
  email?: string;
  status?: boolean;
  roleId?: number;
  password?: string;
  updatedAt: Date;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseUserId(id: string): number | null {
  if (!/^\d+$/.test(id)) {
    return null;
  }

  const parsed = Number(id);

  return Number.isSafeInteger(parsed) && parsed > 0
    ? parsed
    : null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getUserId(context: {
  params: Promise<{ id: string }>;
}): Promise<number | null> {
  const { id } = await context.params;
  return parseUserId(id);
}

async function getAdminCount() {
  return db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.roleId, 1));
}

// GET: Get single user
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(context);

    if (userId === null) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const users = await db
      .select({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        roleId: adminUsers.roleId,
        roleName: adminRoles.name,
        status: adminUsers.status,
        lastLogin: adminUsers.lastLogin,
        createdAt: adminUsers.createdAt,
        updatedAt: adminUsers.updatedAt,
      })
      .from(adminUsers)
      .leftJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
      .where(eq(adminUsers.id, userId))
      .limit(1);

    if (!users[0]) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: users[0],
    });
  } catch (error) {
    console.error("GET admin user error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH: Update user
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(context);

    if (userId === null) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    let body: unknown;

    try {
      body = await req.json();
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

    const existingUsers = await db
      .select({
        id: adminUsers.id,
        roleId: adminUsers.roleId,
        status: adminUsers.status,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);

    const existingUser = existingUsers[0];

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const updateData: UpdateUserData = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          { success: false, error: "Name is required" },
          { status: 400 }
        );
      }

      updateData.name = body.name.trim();
    }

    if (body.email !== undefined) {
      if (
        typeof body.email !== "string" ||
        !isValidEmail(body.email.trim())
      ) {
        return NextResponse.json(
          { success: false, error: "A valid email address is required" },
          { status: 400 }
        );
      }

      const normalizedEmail = body.email.trim().toLowerCase();

      const duplicateEmail = await db
        .select({ id: adminUsers.id })
        .from(adminUsers)
        .where(
          and(
            eq(adminUsers.email, normalizedEmail),
            ne(adminUsers.id, userId)
          )
        )
        .limit(1);

      if (duplicateEmail.length > 0) {
        return NextResponse.json(
          { success: false, error: "Email is already in use" },
          { status: 409 }
        );
      }

      updateData.email = normalizedEmail;
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

    // Resolve role by name or role ID.
    if (body.role !== undefined) {
      if (typeof body.role !== "string" || !body.role.trim()) {
        return NextResponse.json(
          { success: false, error: "Invalid role name" },
          { status: 400 }
        );
      }

      const roles = await db
        .select({ id: adminRoles.id })
        .from(adminRoles)
        .where(eq(adminRoles.name, body.role.trim()))
        .limit(1);

      if (!roles[0]) {
        return NextResponse.json(
          { success: false, error: "Role not found" },
          { status: 404 }
        );
      }

      updateData.roleId = roles[0].id;
    } else if (body.roleId !== undefined) {
      if (
        typeof body.roleId !== "number" ||
        !Number.isSafeInteger(body.roleId) ||
        body.roleId <= 0
      ) {
        return NextResponse.json(
          { success: false, error: "Invalid role ID" },
          { status: 400 }
        );
      }

      const roles = await db
        .select({ id: adminRoles.id })
        .from(adminRoles)
        .where(eq(adminRoles.id, body.roleId))
        .limit(1);

      if (!roles[0]) {
        return NextResponse.json(
          { success: false, error: "Role not found" },
          { status: 404 }
        );
      }

      updateData.roleId = roles[0].id;
    }

    if (body.password !== undefined) {
      if (typeof body.password !== "string") {
        return NextResponse.json(
          { success: false, error: "Invalid password" },
          { status: 400 }
        );
      }

      if (body.password.trim().length > 0) {
        if (body.password.length < 8) {
          return NextResponse.json(
            { success: false, error: "Password must be at least 8 characters" },
            { status: 400 }
          );
        }

        updateData.password = await bcrypt.hash(body.password, 10);
      }
    }

    // Prevent deactivating the last active Super Admin.
    const isAdminUser = existingUser.roleId === 1;
    const isBeingDeactivated =
      body.status === false && existingUser.status === true;

    if (isAdminUser && isBeingDeactivated) {
      const adminUsersList = await getAdminCount();

      if (adminUsersList.length <= 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot deactivate the last admin user",
          },
          { status: 400 }
        );
      }
    }

    // Prevent removing the last Super Admin role.
    if (
      isAdminUser &&
      updateData.roleId !== undefined &&
      updateData.roleId !== 1
    ) {
      const adminUsersList = await getAdminCount();

      if (adminUsersList.length <= 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot change the role of the last admin user",
          },
          { status: 400 }
        );
      }
    }

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    await db
      .update(adminUsers)
      .set(updateData)
      .where(eq(adminUsers.id, userId));

    const updatedUsers = await db
      .select({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        roleId: adminUsers.roleId,
        roleName: adminRoles.name,
        status: adminUsers.status,
        updatedAt: adminUsers.updatedAt,
      })
      .from(adminUsers)
      .leftJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
      .where(eq(adminUsers.id, userId))
      .limit(1);

    if (!updatedUsers[0]) {
      return NextResponse.json(
        { success: false, error: "Updated user could not be retrieved" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUsers[0],
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("PATCH admin user error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE: Delete user
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(context);

    if (userId === null) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const existingUsers = await db
      .select({
        id: adminUsers.id,
        roleId: adminUsers.roleId,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);

    const existingUser = existingUsers[0];

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (existingUser.roleId === 1) {
      const adminUsersList = await getAdminCount();

      if (adminUsersList.length <= 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot delete the last admin user",
          },
          { status: 400 }
        );
      }
    }

    await db
      .delete(adminUsers)
      .where(eq(adminUsers.id, userId));

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("DELETE admin user error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete user",
      },
      { status: 500 }
    );
  }
}
