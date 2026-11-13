
import { NextResponse } from "next/server";
import { getDb } from "@/db/db";
import { adminRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

interface CreateRoleBody {
  name: string;
  description: string;
  status: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// GET: Fetch all roles
export async function GET() {
  try {
    const db = getDb();

    const roles = await db
      .select({
        id: adminRoles.id,
        name: adminRoles.name,
        description: adminRoles.description,
        status: adminRoles.status,
      })
      .from(adminRoles);

    return NextResponse.json({
      success: true,
      roles,
    });
  } catch (error) {
    console.error("GET admin roles error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch roles",
      },
      { status: 500 }
    );
  }
}

// POST: Create role
export async function POST(req: Request) {
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

    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Role name is required",
        },
        { status: 400 }
      );
    }

    if (
      body.description !== undefined &&
      typeof body.description !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Description must be a string",
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

    const roleData: CreateRoleBody = {
      name: body.name.trim(),
      description:
        typeof body.description === "string"
          ? body.description.trim()
          : "",
      status: body.status === undefined ? true : body.status,
    };

    const db = getDb();

    // Check duplicate role name
    const existing = await db
      .select({ id: adminRoles.id })
      .from(adminRoles)
      .where(eq(adminRoles.name, roleData.name))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Role already exists",
        },
        { status: 409 }
      );
    }

    await db.insert(adminRoles).values({
      name: roleData.name,
      description: roleData.description,
      status: roleData.status,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Role created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST admin role error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create role",
      },
      { status: 500 }
    );
  }
}
