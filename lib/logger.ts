// lib/logger.ts
import fs from "fs";
import path from "path";

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
  data?: Record<string, unknown>; // ✅ Extra metadata (filters, counts, error details, etc.)
}

// ============================================================
// 2. FILE PATH
// ============================================================

const LOG_FILE = path.join(process.cwd(), "logs", "performance.log");

// ============================================================
// 3. ENSURE DIRECTORY EXISTS
// ============================================================

function ensureLogDir() {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ============================================================
// 4. READ LOGS
// ============================================================

export function getLogs(): LogEntry[] {
  try {
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
// 5. WRITE LOG (APPEND)
// ============================================================

export function writeLog(entry: LogEntry): void {
  try {
    ensureLogDir();

    // ✅ Add ID if not present
    if (!entry.id) {
      entry.id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // ✅ Add timestamp if not present
    if (!entry.timestamp) {
      entry.timestamp = new Date().toISOString();
    }

    const logLine = JSON.stringify(entry) + "\n";
    fs.appendFileSync(LOG_FILE, logLine, "utf-8");

    console.log(`📝 LOG: ${entry.type} - ${entry.operation}`);
  } catch (error) {
    console.error("Error writing log:", error);
  }
}

// ============================================================
// 6. DELETE SINGLE LOG
// ============================================================

export function deleteLog(id: string): boolean {
  try {
    const logs = getLogs();
    const filtered = logs.filter((log) => log.id !== id);

    if (filtered.length === logs.length) {
      return false; // Log not found
    }

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

export function clearLogs(): void {
  try {
    ensureLogDir();
    fs.writeFileSync(LOG_FILE, "", "utf-8");
    console.log("🧹 All logs cleared");
  } catch (error) {
    console.error("Error clearing logs:", error);
  }
}

// ============================================================
// 8. GET LOGS WITH LIMIT & FILTER
// ============================================================

export function getLogsWithFilter(
  limit = 100,
  type?: string,
  search?: string
): LogEntry[] {
  let logs = getLogs();

  // ✅ Filter by type
  if (type && type !== "ALL") {
    logs = logs.filter((log) => log.type === type);
  }

  // ✅ Filter by search (operation name)
  if (search) {
    const query = search.toLowerCase();
    logs = logs.filter(
      (log) =>
        log.operation.toLowerCase().includes(query) ||
        log.type.toLowerCase().includes(query) ||
        (log.bot?.name && log.bot.name.toLowerCase().includes(query))
    );
  }

  // ✅ Return latest first with limit
  return logs.slice(-limit).reverse();
}

// ============================================================
// 9. GET STATS / ANALYSIS
// ============================================================

export function getLogStats() {
  const logs = getLogs();

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