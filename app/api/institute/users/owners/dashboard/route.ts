
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/db";
import { instituteUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: number;
  email: string;
  name: string;
  role: string;
  accountType: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Verify institute authentication token
function verifyAuthToken(request: NextRequest): JwtPayload | null {
  try {
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
      return null;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured");
      return null;
    }

    const decoded: unknown = jwt.verify(token, secret);

    if (!isRecord(decoded)) {
      return null;
    }

    const id = decoded.id;
    const email = decoded.email;
    const name = decoded.name;
    const role = decoded.role;
    const accountType = decoded.accountType;

    if (
      typeof id !== "number" ||
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      typeof email !== "string" ||
      typeof name !== "string" ||
      role !== "institute" ||
      accountType !== "institute"
    ) {
      return null;
    }

    return {
      id,
      email,
      name,
      role,
      accountType,
    };
  } catch {
    return null;
  }
}

// GET /api/institute/users/owners/dashboard
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const decodedUser = verifyAuthToken(request);

    if (!decodedUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please sign in.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // 2. Database connection at request runtime
    const db = getDb();

    // 3. Fetch owner from database
    const owners = await db
      .select({
        id: instituteUsers.id,
        name: instituteUsers.name,
        email: instituteUsers.email,
        phone: instituteUsers.phone,
        status: instituteUsers.status,
        lastLogin: instituteUsers.lastLogin,
      })
      .from(instituteUsers)
      .where(eq(instituteUsers.id, decodedUser.id))
      .limit(1);

    if (owners.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const owner = owners[0];

    // 4. Institute data
    // Placeholder until the institutes table and owner relationship are implemented.
    const institute = null;

    // 5. Dashboard statistics
    // Placeholder until student, teacher, staff, attendance and fee tables are implemented.
    const stats = {
      totalStudents: 0,
      totalTeachers: 0,
      totalStaff: 0,
      totalClasses: 0,
      presentToday: 0,
      absentToday: 0,
      totalFees: 0,
      collectedFees: 0,
      pendingFees: 0,
      monthlyGrowth: 0,
    };

    // 6. Response
    return NextResponse.json(
      {
        success: true,
        user: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
        },
        institute,
        stats,
        recentActivities: [],
        upcomingEvents: [],
      },
      {
        headers: {
          "Cache-Control": "no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Institute owner dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load dashboard. Please try again.",
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
