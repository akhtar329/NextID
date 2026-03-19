import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/app/lib/db";
import { 
  adminUsers, 
  adminRoles, 
  permissions, 
  userPermissions 
} from "@/app/lib/schema";
import { eq, and } from "drizzle-orm";

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    
    // Fetch user details
    const user = await db
      .select({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        roleId: adminUsers.roleId,
        status: adminUsers.status,
        lastLogin: adminUsers.lastLogin,
        createdAt: adminUsers.createdAt,
        updatedAt: adminUsers.updatedAt,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get role name
    const roleResult = await db
      .select({ name: adminRoles.name })
      .from(adminRoles)
      .where(eq(adminRoles.id, user[0].roleId))
      .limit(1);

    // Get user permissions
    const userPerms = await db
      .select({
        permissionId: userPermissions.permissionId,
        permissionName: permissions.name,
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(eq(userPermissions.userId, userId));

    const profile = {
      id: user[0].id.toString(),
      name: user[0].name,
      email: user[0].email,
      role: roleResult[0]?.name || "User",
      lastLogin: user[0].lastLogin?.toISOString() || new Date().toISOString(),
      joinDate: user[0].createdAt?.toISOString() || new Date().toISOString(),
      permissions: userPerms.map(p => p.permissionName),
    };

    return NextResponse.json({
      success: true,
      profile,
    });

  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Check if email already exists for another user
    const existingUser = await db
      .select()
      .from(adminUsers)
      .where(
        and(
          eq(adminUsers.email, email),
          eq(adminUsers.id, userId) // Exclude current user
        )
      )
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].id !== userId) {
      return NextResponse.json(
        { success: false, error: "Email already in use" },
        { status: 400 }
      );
    }

    const updatedUser = await db
      .update(adminUsers)
      .set({
        name,
        email,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, userId))
      .returning({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        roleId: adminUsers.roleId,
        updatedAt: adminUsers.updatedAt,
      });

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: updatedUser[0],
      message: "Profile updated successfully",
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}