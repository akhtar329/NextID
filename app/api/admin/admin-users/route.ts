// app/api/admin/admin-users/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { adminUsers, adminRoles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Helper to get role ID from role name (matching your database)
async function getRoleIdFromName(roleName: string): Promise<number> {
  // Map frontend role names to database role names
  const roleMapping: Record<string, string> = {
    'super_admin': 'Super Admin',     // Map to Super Admin (id=9)
    'admin': 'Super Admin',           // Map to Super Admin (id=9)
    'editor': 'Editor',               // Map to Editor (id=2)
    'author': 'Content Manager',      // Map to Content Manager (id=10)
    'contributor': 'SEO Manager',     // Map to SEO Manager (id=11)
    'viewer': 'Analytics Viewer'      // Map to Analytics Viewer (id=12)
  };
  
  const dbRoleName = roleMapping[roleName] || roleName;
  
  const role = await db
    .select()
    .from(adminRoles)
    .where(eq(adminRoles.name, dbRoleName));
  
  if (role.length > 0) {
    return role[0].id;
  }
  
  // Default to Analytics Viewer (id=12) if nothing found
  const defaultRole = await db
    .select()
    .from(adminRoles)
    .where(eq(adminRoles.name, 'Analytics Viewer'));
  
  if (defaultRole.length > 0) {
    return defaultRole[0].id;
  }
  
  throw new Error(`No matching role found for: ${roleName}`);
}

// ==================== GET - List all users ====================
export async function GET() {
  try {
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
      })
      .from(adminUsers)
      .leftJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
      .orderBy(desc(adminUsers.createdAt));

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// ==================== POST - Create new user ====================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, body.email));

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Get roleId from role name
    const roleId = await getRoleIdFromName(body.role || 'viewer');

    // Generate password if not provided
    const plainPassword = body.password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create new user
    const [newUser] = await db
      .insert(adminUsers)
      .values({
        name: body.name,
        email: body.email,
        password: hashedPassword,
        roleId: roleId,
        status: body.status !== undefined ? body.status : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        roleId: adminUsers.roleId,
        status: adminUsers.status,
        createdAt: adminUsers.createdAt,
      });

    // Get role name for response
    const role = await db
      .select()
      .from(adminRoles)
      .where(eq(adminRoles.id, roleId));

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        roleId: newUser.roleId,
        roleName: role[0]?.name || "Analytics Viewer",
        status: newUser.status,
        createdAt: newUser.createdAt,
      },
      message: body.password ? "User created successfully" : `User created successfully. Password: ${plainPassword}`,
    });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}