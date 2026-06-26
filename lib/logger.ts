// lib/logger.ts
import fs from "fs";
import path from "path";
import { put, list, del } from "@vercel/blob";

// ============================================================
// 1. TYPES
// ============================================================

export interface LogEntry {
  id: string;
  timestamp: string;
  type: "CACHE_HIT" | "CACHE_MISS" | "DATABASE_QUERY" | "CACHE_SAVE";
  operation: string;
  source?: "cache" | "database";
  duration?: number;
  bot?: {
    isBot: boolean;
    name: string;
  };
  userAgent?: string;
  path?: string;
  ip?: string;
  dataSize?: number;
  data?: Record<string, unknown>;
}

// ============================================================
// 2. FILE PATH (Vercel / Local)
// ============================================================

const isVercel = process.env.VERCEL === "1";
const LOG_KEY = "logs/performance.json";

// Local file path (fallback)
const LOG_FILE = path.join(process.cwd(), "logs", "performance.log");

// ============================================================
// 3. ENSURE DIRECTORY EXISTS (Local only)
// ============================================================

function ensureLogDir() {
  if (!isVercel) {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// ============================================================
// 4. READ LOGS (Vercel Blob + Local)
// ============================================================

export async function getLogs(): Promise<LogEntry[]> {
  try {
    // ✅ Vercel: Read from Blob
    if (isVercel) {
      const { blobs } = await list({ prefix: "logs/" });
      const blob = blobs.find(b => b.pathname === LOG_KEY);
      if (!blob) return [];
      const response = await fetch(blob.url);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }

    // ✅ Local: Read from file
    ensureLogDir();
    if (!fs.existsSync(LOG_FILE)) return [];

    const data = fs.readFileSync(LOG_FILE, "utf-8");
    const lines = data.split("\n").filter((line) => line.trim());

    return lines.map((line) => JSON.parse(line));
  } catch (error) {
    console.error("Error reading logs:", error);
    return [];
  }
}

// ============================================================
// 5. WRITE LOG (Vercel Blob + Local)
// ============================================================

export async function writeLog(entry: LogEntry): Promise<void> {
  try {
    // ✅ Add ID if not present
    if (!entry.id) {
      entry.id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // ✅ Add timestamp if not present
    if (!entry.timestamp) {
      entry.timestamp = new Date().toISOString();
    }

    // ✅ Vercel: Save to Blob
    if (isVercel) {
      const existing = await getLogs();
      const updated = [entry, ...existing];
      await put(LOG_KEY, JSON.stringify(updated, null, 2), {
        access: "public",
        contentType: "application/json",
      });
      return;
    }

    // ✅ Local: Append to file
    ensureLogDir();
    const logLine = JSON.stringify(entry) + "\n";
    fs.appendFileSync(LOG_FILE, logLine, "utf-8");
  } catch (error) {
    console.error("Error writing log:", error);
  }
}

// ============================================================
// 6. DELETE SINGLE LOG
// ============================================================

export async function deleteLog(id: string): Promise<boolean> {
  try {
    const logs = await getLogs();
    const filtered = logs.filter((log) => log.id !== id);

    if (filtered.length === logs.length) {
      return false; // Log not found
    }

    // ✅ Vercel: Save to Blob
    if (isVercel) {
      await put(LOG_KEY, JSON.stringify(filtered, null, 2), {
        access: "public",
        contentType: "application/json",
      });
      return true;
    }

    // ✅ Local: Save to file
    const content = filtered.map((log) => JSON.stringify(log)).join("\n");
    fs.writeFileSync(LOG_FILE, content, "utf-8");
    return true;
  } catch (error) {
    console.error("Error deleting log:", error);
    return false;
  }
}

// ============================================================
// 7. CLEAR ALL LOGS
// ============================================================

export async function clearLogs(): Promise<void> {
  try {
    // ✅ Vercel: Delete Blob
    if (isVercel) {
      await del(LOG_KEY);
      return;
    }

    // ✅ Local: Clear file
    ensureLogDir();
    fs.writeFileSync(LOG_FILE, "", "utf-8");
  } catch (error) {
    console.error("Error clearing logs:", error);
  }
}

// ============================================================
// 8. GET LOGS WITH LIMIT & FILTER
// ============================================================

export async function getLogsWithFilter(
  limit = 100,
  type?: string,
  search?: string
): Promise<LogEntry[]> {
  const logs = await getLogs();

  // ✅ Filter by type
  let filtered = logs;
  if (type && type !== "ALL") {
    filtered = filtered.filter((log) => log.type === type);
  }

  // ✅ Filter by search (operation name)
  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.operation.toLowerCase().includes(query) ||
        log.type.toLowerCase().includes(query) ||
        (log.bot?.name && log.bot.name.toLowerCase().includes(query))
    );
  }

  // ✅ Return latest first with limit
  return filtered.slice(-limit).reverse();
}

// ============================================================
// 9. GET STATS / ANALYSIS
// ============================================================

export async function getLogStats() {
  const logs = await getLogs();

  const total = logs.length;
  const cacheHits = logs.filter((l) => l.type === "CACHE_HIT").length;
  const cacheMisses = logs.filter((l) => l.type === "CACHE_MISS").length;
  const dbQueries = logs.filter((l) => l.type === "DATABASE_QUERY").length;

  // ✅ Cache hit ratio
  const hitRatio = total > 0 ? Math.round((cacheHits / total) * 100) : 0;

  // ✅ Average duration
  const durations = logs.map((l) => l.duration || 0);
  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  // ✅ Top operations
  const operationCount: Record<string, number> = {};
  logs.forEach((log) => {
    operationCount[log.operation] = (operationCount[log.operation] || 0) + 1;
  });

  const topOperations = Object.entries(operationCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ✅ Bot vs Human
  const botRequests = logs.filter((l) => l.bot?.isBot).length;
  const humanRequests = total - botRequests;

  // ✅ Top bots
  const botCount: Record<string, number> = {};
  logs.forEach((log) => {
    if (log.bot?.isBot && log.bot.name) {
      botCount[log.bot.name] = (botCount[log.bot.name] || 0) + 1;
    }
  });

  const topBots = Object.entries(botCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total,
    cacheHits,
    cacheMisses,
    dbQueries,
    hitRatio,
    avgDuration,
    topOperations,
    botRequests,
    humanRequests,
    topBots,
  };
}