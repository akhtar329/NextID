
// app/api/admin/maintenance/settings/route.ts

import { NextResponse } from "next/server";

interface MaintenanceConfig {
  isEnabled: boolean;
  title: string;
  message: string;
  estimatedTime: string;
  allowIps: string[];
}

interface MaintenanceSettingsUpdate {
  title?: string;
  message?: string;
  estimatedTime?: string;
}

const DEFAULT_CONFIG: MaintenanceConfig = {
  isEnabled: process.env.MAINTENANCE_MODE === "true",
  title: process.env.MAINTENANCE_TITLE || "Site Under Maintenance",
  message:
    process.env.MAINTENANCE_MESSAGE ||
    "We are currently performing scheduled maintenance. Please check back soon.",
  estimatedTime: process.env.MAINTENANCE_ESTIMATED_TIME || "2 hours",
  allowIps:
    process.env.MAINTENANCE_ALLOW_IPS
      ?.split(",")
      .map((ip) => ip.trim())
      .filter(Boolean) || [],
};

let maintenanceConfig: MaintenanceConfig = {
  ...DEFAULT_CONFIG,
  allowIps: [...DEFAULT_CONFIG.allowIps],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function validateText(
  value: unknown,
  field: string,
  maxLength: number
): string | null {
  if (typeof value !== "string") {
    return `${field} must be a string`;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return `${field} cannot be empty`;
  }

  if (trimmed.length > maxLength) {
    return `${field} cannot exceed ${maxLength} characters`;
  }

  return null;
}

function validateUpdate(
  body: unknown
):
  | { success: true; data: MaintenanceSettingsUpdate }
  | { success: false; error: string } {
  if (!isRecord(body)) {
    return {
      success: false,
      error: "Invalid request body",
    };
  }

  const allowedFields = ["title", "message", "estimatedTime"];

  const unknownFields = Object.keys(body).filter(
    (key) => !allowedFields.includes(key)
  );

  if (unknownFields.length > 0) {
    return {
      success: false,
      error: `Unsupported fields: ${unknownFields.join(", ")}`,
    };
  }

  const update: MaintenanceSettingsUpdate = {};

  if (body.title !== undefined) {
    const error = validateText(body.title, "Title", 150);

    if (error) {
      return { success: false, error };
    }

    update.title = (body.title as string).trim();
  }

  if (body.message !== undefined) {
    const error = validateText(body.message, "Message", 2000);

    if (error) {
      return { success: false, error };
    }

    update.message = (body.message as string).trim();
  }

  if (body.estimatedTime !== undefined) {
    const error = validateText(
      body.estimatedTime,
      "Estimated time",
      100
    );

    if (error) {
      return { success: false, error };
    }

    update.estimatedTime = (body.estimatedTime as string).trim();
  }

  if (Object.keys(update).length === 0) {
    return {
      success: false,
      error: "At least one setting must be provided",
    };
  }

  return {
    success: true,
    data: update,
  };
}

// GET: Retrieve maintenance settings
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        ...maintenanceConfig,
        allowIps: [...maintenanceConfig.allowIps],
      },
    });
  } catch (error) {
    console.error("GET maintenance settings error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve maintenance settings",
      },
      { status: 500 }
    );
  }
}

// PUT: Update maintenance settings
export async function PUT(request: Request) {
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

    const validation = validateUpdate(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    maintenanceConfig = {
      ...maintenanceConfig,
      ...validation.data,
    };

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
      data: {
        ...maintenanceConfig,
        allowIps: [...maintenanceConfig.allowIps],
      },
    });
  } catch (error) {
    console.error("PUT maintenance settings error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save settings",
      },
      { status: 500 }
    );
  }
}
