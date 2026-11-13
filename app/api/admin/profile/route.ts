
import { NextRequest, NextResponse } from "next/server";
import jwt, {
  JsonWebTokenError,
  TokenExpiredError,
} from "jsonwebtoken";
import { getDb } from "@/db/db";
import { adminUsers, adminRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

// =====================
// TYPES
// =====================

interface AuthenticatedUser {
  id: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// =====================
// CONFIG
// =====================

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

// =====================
// PERMISSIONS
// =====================

function getPermissions(role: string): string[] {
  const map: Record<string, string[]> = {
    "Super Admin": [
      "full_access",
      "user_management",
      "settings_manage",
    ],
    Admin: [
      "content_management",
      "user_view",
    ],
    Editor: [
      "content_management",
    ],
    Viewer: [
      "analytics_view",
    ],
  };

  return map[role] ?? map.Viewer;
}

// =====================
// AUTHENTICATION
// =====================

function verifyAuthToken(token: string): AuthenticatedUser | null {
  try {
    const decoded: unknown = jwt.verify(token, getJWTSecret());

    if (
      !isRecord(decoded) ||
      typeof decoded.id !== "number" ||
      !Number.isSafeInteger(decoded.id) ||
      decoded.id <= 0
    ) {
      return null;
    }

    return {
      id: decoded.id,
    };
  } catch (error) {
    if (
      error instanceof JsonWebTokenError ||
      error instanceof TokenExpiredError
    ) {
      return null;
    }

    throw error;
  }
}

// =====================
// GET PROFILE
// =====================

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("authToken")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const authenticatedUser = verifyAuthToken(token);

    if (!authenticatedUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const db = getDb();

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
      .leftJoin(
        adminRoles,
        eq(adminUsers.roleId, adminRoles.id)
      )
      .where(eq(adminUsers.id, authenticatedUser.id))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const currentUser = user[0];

    if (currentUser.status === false) {
      return NextResponse.json(
        {
          success: false,
          error: "Account disabled",
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const role = currentUser.role || "Admin";

    return NextResponse.json(
      {
        success: true,
        profile: {
          id: currentUser.id.toString(),
          name: currentUser.name,
          email: currentUser.email,
          role,
          permissions: getPermissions(role),
          lastLogin: currentUser.lastLogin || null,
          joinDate: currentUser.createdAt || null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET admin profile error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
