
import { NextResponse } from "next/server";
import {
  getLogsWithFilter,
  getLogStats,
  deleteLog,
  clearLogs,
  writeLog,
  type LogEntry,
} from "@/lib/logger";

const LOG_TYPES = [
  "CACHE_HIT",
  "CACHE_MISS",
  "DATABASE_QUERY",
  "CACHE_SAVE",
  "CACHE_EXPIRE",
] as const satisfies readonly LogEntry["type"][];

const LOG_SOURCES = [
  "cache",
  "database",
] as const satisfies readonly NonNullable<LogEntry["source"]>[];

type LogType = (typeof LOG_TYPES)[number];
type LogSource = (typeof LOG_SOURCES)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isLogType(value: unknown): value is LogType {
  return (
    typeof value === "string" &&
    LOG_TYPES.some((item) => item === value)
  );
}

function isLogSource(value: unknown): value is LogSource {
  return (
    typeof value === "string" &&
    LOG_SOURCES.some((item) => item === value)
  );
}

function getOptionalString(value: unknown): string | null {
  if (value === undefined) {
    return "";
  }

  if (typeof value !== "string" || value.length > 2048) {
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

    if (searchParams.get("analysis") === "true") {
      const stats = await getLogStats();

      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

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
    console.error("GET admin logs error:", error);

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

    if (id === "all") {
      await clearLogs();

      return NextResponse.json({
        success: true,
        message: "All logs cleared successfully",
      });
    }

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
    console.error("DELETE admin logs error:", error);

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

    if (
      typeof body.operation !== "string" ||
      !body.operation.trim() ||
      body.operation.length > 512
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid operation is required",
        },
        { status: 400 }
      );
    }

    const typeValue = body.type;
    const sourceValue = body.source;

    const type: LogType =
      typeValue === undefined
        ? "CACHE_HIT"
        : isLogType(typeValue)
          ? typeValue
          : "INVALID" as LogType;

    const source: LogSource =
      sourceValue === undefined
        ? "cache"
        : isLogSource(sourceValue)
          ? sourceValue
          : "INVALID" as LogSource;

    if (
      (typeValue !== undefined && !isLogType(typeValue)) ||
      (sourceValue !== undefined && !isLogSource(sourceValue))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid log type or source",
        },
        { status: 400 }
      );
    }

    const userAgent = getOptionalString(body.userAgent);
    const path = getOptionalString(body.path);
    const ip = getOptionalString(body.ip);

    if (
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

    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      type,
      operation: body.operation.trim(),
      source,
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
    console.error("POST admin logs error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to add log",
      },
      { status: 500 }
    );
  }
}
