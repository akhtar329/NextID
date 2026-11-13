
// app/api/logs/route.ts

import { NextResponse } from "next/server";
import {
  getLogsWithFilter,
  getLogStats,
  deleteLog,
  clearLogs,
  writeLog,
  type LogEntry,
} from "@/lib/logger";

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getOptionalString(
  value: unknown,
  fieldName: string
): string | null {
  if (value === undefined) {
    return "";
  }

  if (typeof value !== "string") {
    return null;
  }

  if (value.length > 2048) {
    return null;
  }

  return value;
}

function getOptionalNumber(
  value: unknown,
  defaultValue = 0
): number | null {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return null;
  }

  return value;
}

// GET: Fetch logs with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Fetch log statistics.
    if (searchParams.get("analysis") === "true") {
      const stats = await getLogStats();

      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    // Validate and limit the requested number of logs.
    const rawLimit = searchParams.get("limit") ?? "100";

    if (!/^\d+$/.test(rawLimit)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid limit parameter",
        },
        { status: 400 }
      );
    }

    const requestedLimit = Number(rawLimit);

    if (!Number.isSafeInteger(requestedLimit) || requestedLimit < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Limit must be a positive integer",
        },
        { status: 400 }
      );
    }

    const limit = Math.min(requestedLimit, 1000);
    const type = searchParams.get("type") || undefined;
    const search = searchParams.get("search") || undefined;

    const logs = await getLogsWithFilter(limit, type, search);

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("GET logs error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch logs",
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete one log or all logs
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide an id or 'all' to delete",
        },
        { status: 400 }
      );
    }

    // Delete all logs.
    if (id === "all") {
      await clearLogs();

      return NextResponse.json({
        success: true,
        message: "All logs cleared successfully",
      });
    }

    // Validate individual log ID.
    if (id.length > 256) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid log ID",
        },
        { status: 400 }
      );
    }

    const deleted = await deleteLog(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: `Log with id ${id} not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Log ${id} deleted successfully`,
    });
  } catch (error) {
    console.error("DELETE logs error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete logs",
      },
      { status: 500 }
    );
  }
}

// POST: Add a new log
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

    if (!isRecord(body)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
        },
        { status: 400 }
      );
    }

    // Validate required operation.
    if (
      typeof body.operation !== "string" ||
      !body.operation.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "operation is required",
        },
        { status: 400 }
      );
    }

    const type = getOptionalString(body.type, "type");
    const source = getOptionalString(body.source, "source");
    const userAgent = getOptionalString(body.userAgent, "userAgent");
    const path = getOptionalString(body.path, "path");
    const ip = getOptionalString(body.ip, "ip");

    if (
      type === null ||
      source === null ||
      userAgent === null ||
      path === null ||
      ip === null
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Log string fields must contain valid strings",
        },
        { status: 400 }
      );
    }

    const duration = getOptionalNumber(body.duration);
    const dataSize = getOptionalNumber(body.dataSize);

    if (duration === null || dataSize === null) {
      return NextResponse.json(
        {
          success: false,
          error: "Duration and dataSize must be valid non-negative numbers",
        },
        { status: 400 }
      );
    }

    // Validate bot information.
    let bot: LogEntry["bot"] = {
      isBot: false,
      name: "Human",
    };

    if (body.bot !== undefined) {
      if (
        !isRecord(body.bot) ||
        typeof body.bot.isBot !== "boolean" ||
        (body.bot.name !== undefined &&
          typeof body.bot.name !== "string")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid bot information",
          },
          { status: 400 }
        );
      }

      bot = {
        isBot: body.bot.isBot,
        name:
          typeof body.bot.name === "string"
            ? body.bot.name.slice(0, 256)
            : body.bot.isBot
              ? "Bot"
              : "Human",
      };
    }

    // Create log entry.
    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      type: type || "CACHE_HIT",
      operation: body.operation.trim(),
      source: source || "cache",
      duration,
      bot,
      userAgent: userAgent || "",
      path: path || "",
      ip: ip || "",
      dataSize,
    };

    await writeLog(logEntry);

    return NextResponse.json(
      {
        success: true,
        message: "Log added successfully",
        data: logEntry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST logs error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to add log",
      },
      { status: 500 }
    );
  }
}
