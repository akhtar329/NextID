// app/api/admin/admin-users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { adminUsers, adminRoles } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// ==================== GET - Get single user ====================
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const user = await db
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
      .where(eq(adminUsers.id, userId));

    if (!user.length) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: user[0],
    });
  } catch (error) {
    console.error("GET /api/admin/admin-users/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// ==================== PATCH - Update user (including status toggle) ====================
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = parseInt(id);
    const body = await req.json();

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, userId));

    if (!existingUser.length) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent deactivating the last admin user
    if (body.status === false && existingUser[0].roleId === 1) {
      const adminUsersList = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.roleId, 1));

      if (adminUsersList.length === 1) {
        return NextResponse.json(
          { success: false, error: "Cannot deactivate the last admin user" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.status !== undefined) updateData.status = body.status;

    // Handle role update (from role name or roleId)
    if (body.role) {
      const role = await db
        .select()
        .from(adminRoles)
        .where(eq(adminRoles.name, body.role));
      if (role.length > 0) {
        updateData.roleId = role[0].id;
      }
    } else if (body.roleId !== undefined) {
      updateData.roleId = body.roleId;
    }

    // Hash password if provided
    if (body.password && body.password.trim() !== "") {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    await db
      .update(adminUsers)
      .set(updateData)
      .where(eq(adminUsers.id, userId));

    // Get updated user
    const updatedUser = await db
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
      .where(eq(adminUsers.id, userId));

    return NextResponse.json({
      success: true,
      user: updatedUser[0],
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("PATCH /api/admin/admin-users/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// ==================== DELETE - Delete user ====================
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, userId));

    if (!existingUser.length) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent deleting the last admin user
    if (existingUser[0].roleId === 1) {
      const adminUsersList = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.roleId, 1));

      if (adminUsersList.length === 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the last admin user" },
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
    console.error("DELETE /api/admin/admin-users/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}