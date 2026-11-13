
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/db";
import { adminUsers, adminRoles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

interface CreateUserBody {
  name: string;
  email: string;
  role?: string;
  status?: boolean;
}

const ROLE_MAPPING: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Super Admin",
  editor: "Editor",
  author: "Content Manager",
  contributor: "SEO Manager",
  viewer: "Analytics Viewer",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateTemporaryPassword(): string {
  const randomValues = new Uint8Array(18);
  crypto.getRandomValues(randomValues);

  return Array.from(randomValues)
    .map((value) => value.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

// Resolve role ID using the actual database role name.
async function getRoleIdFromName(
  db: ReturnType<typeof getDb>,
  roleName: string
): Promise<number> {
  const dbRoleName = ROLE_MAPPING[roleName] ?? roleName;

  const role = await db
    .select({
      id: adminRoles.id,
    })
    .from(adminRoles)
    .where(eq(adminRoles.name, dbRoleName))
    .limit(1);

  if (role[0]) {
    return role[0].id;
  }

  // Fallback to Analytics Viewer.
  const defaultRole = await db
    .select({
      id: adminRoles.id,
    })
    .from(adminRoles)
    .where(eq(adminRoles.name, "Analytics Viewer"))
    .limit(1);

  if (defaultRole[0]) {
    return defaultRole[0].id;
  }

  throw new Error(
    `No matching role found for: ${roleName}. Default role Analytics Viewer is also missing.`
  );
}

// GET: List all admin users
export async function GET() {
  try {
    const db = getDb();

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
    console.error("GET admin users error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
      },
      { status: 500 }
    );
  }
}

// POST: Create a new admin user
export async function POST(req: NextRequest) {
  try {
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body",
        },
        { status: 400 }
      );
    }

    if (!isRecord(body)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
        },
        { status: 400 }
      );
    }

    if (
      typeof body.name !== "string" ||
      !body.name.trim() ||
      typeof body.email !== "string" ||
      !body.email.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and email are required",
        },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    const email = body.email.trim().toLowerCase();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid email address",
        },
        { status: 400 }
      );
    }

    if (
      body.role !== undefined &&
      (typeof body.role !== "string" || !body.role.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid role",
        },
        { status: 400 }
      );
    }

    if (
      body.password !== undefined &&
      typeof body.password !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid password",
        },
        { status: 400 }
      );
    }

    if (
      typeof body.password === "string" &&
      body.password.length > 0 &&
      (body.password.length < 8 || body.password.length > 128)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be between 8 and 128 characters",
        },
        { status: 400 }
      );
    }

    if (
      body.status !== undefined &&
      typeof body.status !== "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Status must be a boolean",
        },
        { status: 400 }
      );
    }

    const userData: CreateUserBody = {
      name,
      email,
      role:
        typeof body.role === "string"
          ? body.role.trim()
          : "viewer",
      status: body.status === undefined ? true : body.status,
    };

    const db = getDb();

    // Check for duplicate email.
    const existingUser = await db
      .select({
        id: adminUsers.id,
      })
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "User with this email already exists",
        },
        { status: 409 }
      );
    }

    // Resolve the actual database role ID.
    const roleId = await getRoleIdFromName(
      db,
      userData.role ?? "viewer"
    );

    // Generate a password if one was not provided.
    const plainPassword =
      typeof body.password === "string" && body.password.length > 0
        ? body.password
        : generateTemporaryPassword();

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create the user.
    const [newUser] = await db
      .insert(adminUsers)
      .values({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        roleId,
        status: userData.status ?? true,
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

    if (!newUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User could not be created",
        },
        { status: 500 }
      );
    }

    // Fetch role name for the response.
    const role = await db
      .select({
        name: adminRoles.name,
      })
      .from(adminRoles)
      .where(eq(adminRoles.id, roleId))
      .limit(1);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          roleId: newUser.roleId,
          roleName: role[0]?.name ?? userData.role,
          status: newUser.status,
          createdAt: newUser.createdAt,
        },
        message: "User created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST admin user error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create user",
      },
      { status: 500 }
    );
  }
}
