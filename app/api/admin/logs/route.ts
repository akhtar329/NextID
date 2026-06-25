// app/api/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getLogsWithFilter,
  getLogStats,
  deleteLog,
  clearLogs,
  type LogEntry,
} from "@/lib/logger";

// ============================================================
// GET: Fetch logs with optional filters
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // ✅ Check if analysis is requested
    if (searchParams.get("analysis") === "true") {
      const stats = getLogStats();
      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    // ✅ Get filter parameters
    const limit = parseInt(searchParams.get("limit") || "100");
    const type = searchParams.get("type") || undefined;
    const search = searchParams.get("search") || undefined;

    // ✅ Fetch logs with filters
    const logs = getLogsWithFilter(limit, type, search);

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch logs",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE: Delete single or all logs
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    // ✅ Delete all logs
    if (id === "all") {
      clearLogs();
      return NextResponse.json({
        success: true,
        message: "All logs cleared successfully",
      });
    }

    // ✅ Delete single log
    if (id) {
      const deleted = deleteLog(id);
      if (deleted) {
        return NextResponse.json({
          success: true,
          message: `Log ${id} deleted successfully`,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `Log with id ${id} not found`,
          },
          { status: 404 }
        );
      }
    }

    // ✅ No id provided
    return NextResponse.json(
      {
        success: false,
        error: "Please provide an id or 'all' to delete",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting log:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete log",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST: Add a new log (for testing)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ✅ Validate required fields
    if (!body.operation) {
      return NextResponse.json(
        {
          success: false,
          error: "operation is required",
        },
        { status: 400 }
      );
    }

    // ✅ Create log entry
    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      type: body.type || "CACHE_HIT",
      operation: body.operation,
      source: body.source || "cache",
      duration: body.duration || 0,
      bot: body.bot || { isBot: false, name: "Human" },
      userAgent: body.userAgent || "",
      path: body.path || "",
      ip: body.ip || "",
      dataSize: body.dataSize || 0,
    };

    // ✅ Save to file
    const { writeLog } = await import("@/lib/logger");
    writeLog(logEntry);

    return NextResponse.json({
      success: true,
      message: "Log added successfully",
      data: logEntry,
    });
  } catch (error) {
    console.error("Error adding log:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add log",
      },
      { status: 500 }
    );
  }
}