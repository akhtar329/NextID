
export interface LogEntry {
  id: string;
  timestamp: string;
  type:
    | "CACHE_HIT"
    | "CACHE_MISS"
    | "DATABASE_QUERY"
    | "CACHE_SAVE"
    | "CACHE_EXPIRE";
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

// Logging configuration
const isQueryLoggingEnabled =
  process.env.ENABLE_QUERY_LOGGING === "true";

// Temporary in-memory storage.
// Cloudflare Worker restart/isolate change hone par logs clear ho sakte hain.
const MAX_LOGS = 1000;
const logs: LogEntry[] = [];

// ============================================================
// GET LOGS
// ============================================================

export async function getLogs(): Promise<LogEntry[]> {
  try {
    return [...logs];
  } catch (error) {
    console.error("[LOGGER] Error reading logs:", error);
    return [];
  }
}

// ============================================================
// WRITE LOG
// ============================================================

export async function writeLog(entry: LogEntry): Promise<void> {
  if (!isQueryLoggingEnabled) return;

  try {
    const newEntry: LogEntry = {
      ...entry,
      id:
        entry.id ||
        `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
    };

    logs.unshift(newEntry);

    if (logs.length > MAX_LOGS) {
      logs.length = MAX_LOGS;
    }
  } catch (error) {
    console.error("[LOGGER] Error writing log:", error);
  }
}

// ============================================================
// DELETE SINGLE LOG
// ============================================================

export async function deleteLog(id: string): Promise<boolean> {
  try {
    const index = logs.findIndex((log) => log.id === id);

    if (index === -1) {
      return false;
    }

    logs.splice(index, 1);
    return true;
  } catch (error) {
    console.error("[LOGGER] Error deleting log:", error);
    return false;
  }
}

// ============================================================
// CLEAR ALL LOGS
// ============================================================

export async function clearLogs(): Promise<void> {
  try {
    logs.length = 0;
  } catch (error) {
    console.error("[LOGGER] Error clearing logs:", error);
  }
}

// ============================================================
// GET LOGS WITH LIMIT & FILTER
// ============================================================

export async function getLogsWithFilter(
  limit = 100,
  type?: string,
  search?: string
): Promise<LogEntry[]> {
  const allLogs = await getLogs();

  let filtered = allLogs;

  if (type && type !== "ALL") {
    filtered = filtered.filter((log) => log.type === type);
  }

  if (search) {
    const query = search.toLowerCase();

    filtered = filtered.filter(
      (log) =>
        log.operation.toLowerCase().includes(query) ||
        log.type.toLowerCase().includes(query) ||
        (log.bot?.name &&
          log.bot.name.toLowerCase().includes(query))
    );
  }

  return filtered.slice(0, Math.max(0, limit));
}

// ============================================================
// GET STATS / ANALYSIS
// ============================================================

export async function getLogStats() {
  const allLogs = await getLogs();

  const total = allLogs.length;
  const cacheHits = allLogs.filter(
    (log) => log.type === "CACHE_HIT"
  ).length;
  const cacheMisses = allLogs.filter(
    (log) => log.type === "CACHE_MISS"
  ).length;
  const dbQueries = allLogs.filter(
    (log) => log.type === "DATABASE_QUERY"
  ).length;
  const cacheExpires = allLogs.filter(
    (log) => log.type === "CACHE_EXPIRE"
  ).length;

  const hitRatio =
    total > 0 ? Math.round((cacheHits / total) * 100) : 0;

  const durations = allLogs.map((log) => log.duration || 0);

  const avgDuration =
    durations.length > 0
      ? Math.round(
          durations.reduce((a, b) => a + b, 0) / durations.length
        )
      : 0;

  const operationCount: Record<string, number> = {};

  allLogs.forEach((log) => {
    operationCount[log.operation] =
      (operationCount[log.operation] || 0) + 1;
  });

  const topOperations = Object.entries(operationCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const botRequests = allLogs.filter(
    (log) => log.bot?.isBot
  ).length;

  const humanRequests = total - botRequests;

  const botCount: Record<string, number> = {};

  allLogs.forEach((log) => {
    if (log.bot?.isBot && log.bot.name) {
      botCount[log.bot.name] =
        (botCount[log.bot.name] || 0) + 1;
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
    cacheExpires,
    hitRatio,
    avgDuration,
    topOperations,
    botRequests,
    humanRequests,
    topBots,
  };
}
