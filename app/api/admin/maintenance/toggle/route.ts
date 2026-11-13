
// app/api/admin/maintenance/toggle/route.ts

import { NextResponse } from "next/server";

interface MaintenanceState {
  isEnabled: boolean;
}

let maintenanceState: MaintenanceState = {
  isEnabled: process.env.MAINTENANCE_MODE === "true",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// GET: Retrieve maintenance mode status
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      isEnabled: maintenanceState.isEnabled,
    });
  } catch (error) {
    console.error("GET maintenance status error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve maintenance status",
      },
      { status: 500 }
    );
  }
}

// POST: Enable or disable maintenance mode
export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body",
        },
        { status: 400 }
      );
    }

    if (!isRecord(body) || typeof body.enabled !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "The enabled field must be a boolean",
        },
        { status: 400 }
      );
    }

    maintenanceState = {
      isEnabled: body.enabled,
    };

    return NextResponse.json({
      success: true,
      message: body.enabled
        ? "Maintenance mode enabled"
        : "Maintenance mode disabled",
      isEnabled: maintenanceState.isEnabled,
    });
  } catch (error) {
    console.error("POST maintenance toggle error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to toggle maintenance mode",
      },
      { status: 500 }
    );
  }
}
