import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/db/db";
import { adminUsers, adminRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

// =====================
// TYPES
// =====================

interface JWTPayload {
  id: number;
}

// =====================
// CONFIG
// =====================

function getJWTSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return secret;
}

// =====================
// PERMISSIONS
// =====================

function getPermissions(role: string) {
  const map: Record<string, string[]> = {
    "Super Admin": ["full_access", "user_management", "settings_manage"],
    Admin: ["content_management", "user_view"],
    Editor: ["content_management"],
    Viewer: ["analytics_view"],
  };

  return map[role] || map["Viewer"];
}

// =====================
// GET PROFILE
// =====================

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("authToken")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // verify JWT
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, getJWTSecret()) as JWTPayload;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // JOIN query (optimized)
    const user = await db
      .select({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        status: adminUsers.status,
        createdAt: adminUsers.createdAt,
        lastLogin: adminUsers.lastLogin,
        role: adminRoles.name,
      })
      .from(adminUsers)
      .leftJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
      .where(eq(adminUsers.id, userId))
      .limit(1);

    if (!user.length) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const u = user[0];

    if (u.status === false) {
      return NextResponse.json(
        { success: false, error: "Account disabled" },
        { status: 403 }
      );
    }

    const role = u.role || "Admin";

    return NextResponse.json({
      success: true,
      profile: {
        id: u.id.toString(),
        name: u.name,
        email: u.email,
        role,
        permissions: getPermissions(role),
        lastLogin: u.lastLogin || null,
        joinDate: u.createdAt || null,
      },
    });
  } catch (err) {
    console.error("PROFILE ERROR:", err);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}