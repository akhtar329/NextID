// lib/logger.ts - Updated

import fs from "fs";
import path from "path";
import { put, list, del } from "@vercel/blob";

// ============================================================
// 1. TYPES
// ============================================================

export interface LogEntry {
  id: string;
  timestamp: string;
  type: "CACHE_HIT" | "CACHE_MISS" | "DATABASE_QUERY" | "CACHE_SAVE" | "CACHE_EXPIRE";
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
// 2. FORCE BLOB SAVE - ✅ FIX
// ============================================================

// ✅ ALWAYS use blob if token exists (regardless of VERCEL env)
const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
// A token can remain after a store is suspended. Blob logging must be opt-in.
const useBlob = hasBlobToken && process.env.ENABLE_BLOB_LOGS === "true";
const isQueryLoggingEnabled = process.env.ENABLE_QUERY_LOGGING === "true";

const LOG_KEY = "logs/performance.json";
const LOG_FILE = path.join(process.cwd(), "logs", "performance.log");

// ============================================================
// 3. ENSURE DIRECTORY EXISTS (Local only)
// ============================================================

function ensureLogDir() {
  if (!useBlob) {
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
    // ✅ ALWAYS try blob first if token exists
    if (useBlob) {
      console.log('[LOGGER] 📖 Reading logs from blob...');
      
      const { blobs } = await list({ 
        prefix: "logs/",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      
      console.log(`[LOGGER] 📁 Found ${blobs.length} blobs in logs/`);
      blobs.forEach(b => console.log(`[LOGGER]   - ${b.pathname}`));
      
      const blob = blobs.find(b => b.pathname === LOG_KEY);
      if (!blob) {
        console.log('[LOGGER] ⚠️ No log file found in blob');
        // ✅ Try local fallback
        return getLogsLocal();
      }
      
      const response = await fetch(blob.url);
      if (!response.ok) {
        console.error(`[LOGGER] ❌ Failed to read logs: ${response.status}`);
        return getLogsLocal();
      }
      
      const data = await response.json();
      console.log(`[LOGGER] ✅ Read ${data.length} logs from blob`);
      return Array.isArray(data) ? data : [];
    }

    // ✅ Local fallback
    return getLogsLocal();
  } catch (error) {
    console.error("[LOGGER] Error reading logs:", error);
    return getLogsLocal();
  }
}

// ✅ Local logs reader
function getLogsLocal(): LogEntry[] {
  try {
    console.log('[LOGGER] 📖 Reading logs from local file...');
    ensureLogDir();
    if (!fs.existsSync(LOG_FILE)) {
      console.log('[LOGGER] ⚠️ No local log file found');
      return [];
    }
    const data = fs.readFileSync(LOG_FILE, "utf-8");
    const lines = data.split("\n").filter((line) => line.trim());
    console.log(`[LOGGER] ✅ Read ${lines.length} logs from local file`);
    return lines.map((line) => JSON.parse(line));
  } catch (error) {
    console.error("[LOGGER] Local read error:", error);
    return [];
  }
}

// ============================================================
// 5. WRITE LOG - ✅ FIXED
// ============================================================

export async function writeLog(entry: LogEntry): Promise<void> {
  // Logging must not add a network request to every public page render or
  // affect the response when an observability store is unavailable.
  if (!isQueryLoggingEnabled) return;

  try {
    // ✅ Add ID if not present
    if (!entry.id) {
      entry.id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // ✅ Add timestamp if not present
    if (!entry.timestamp) {
      entry.timestamp = new Date().toISOString();
    }

    console.log(`[LOGGER] 📝 Writing log: ${entry.type} - ${entry.operation}`);
    console.log(`[LOGGER] useBlob: ${useBlob}`);
    console.log(`[LOGGER] hasBlobToken: ${hasBlobToken}`);

    // ✅ ALWAYS save to blob if token exists
    if (useBlob) {
      try {
        console.log('[LOGGER] 💾 Saving to Vercel Blob...');
        
        const existing = await getLogs();
        const updated = [entry, ...existing];
        const limited = updated.slice(0, 1000);
        
        console.log(`[LOGGER] 📦 Saving ${limited.length} logs to blob...`);
        
        const result = await put(LOG_KEY, JSON.stringify(limited, null, 2), {
          access: "public",
          contentType: "application/json",
          allowOverwrite: true,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        
        console.log(`[LOGGER] ✅ Log saved to blob: ${result.url}`);
        console.log(`[LOGGER] ✅ Blob path: ${result.pathname}`);
        return;
      } catch (blobError) {
        console.error('[LOGGER] ❌ Blob save failed:', blobError);
        // ✅ Fallback to local
        console.log('[LOGGER] 📝 Falling back to local...');
      }
    }

    // ✅ Local fallback
    console.log('[LOGGER] 💾 Saving to local file...');
    ensureLogDir();
    const logLine = JSON.stringify(entry) + "\n";
    fs.appendFileSync(LOG_FILE, logLine, "utf-8");
    console.log(`[LOGGER] ✅ Log saved locally: ${entry.id}`);
    
  } catch (error) {
    console.error("[LOGGER] ❌ Error writing log:", error);
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
      return false;
    }

    if (useBlob) {
      await put(LOG_KEY, JSON.stringify(filtered, null, 2), {
        access: "public",
        contentType: "application/json",
        allowOverwrite: true,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return true;
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

export async function clearLogs(): Promise<void> {
  try {
    if (useBlob) {
      await del(LOG_KEY, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      console.log('[LOGGER] ✅ All logs cleared from blob');
      return;
    }

    ensureLogDir();
    fs.writeFileSync(LOG_FILE, "", "utf-8");
    console.log('[LOGGER] ✅ All logs cleared locally');
  } catch (error) {
    console.error("[LOGGER] Error clearing logs:", error);
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

  let filtered = logs;
  if (type && type !== "ALL") {
    filtered = filtered.filter((log) => log.type === type);
  }

  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.operation.toLowerCase().includes(query) ||
        log.type.toLowerCase().includes(query) ||
        (log.bot?.name && log.bot.name.toLowerCase().includes(query))
    );
  }

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
  const cacheExpires = logs.filter((l) => l.type === "CACHE_EXPIRE").length;

  const hitRatio = total > 0 ? Math.round((cacheHits / total) * 100) : 0;

  const durations = logs.map((l) => l.duration || 0);
  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  const operationCount: Record<string, number> = {};
  logs.forEach((log) => {
    operationCount[log.operation] = (operationCount[log.operation] || 0) + 1;
  });

  const topOperations = Object.entries(operationCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const botRequests = logs.filter((l) => l.bot?.isBot).length;
  const humanRequests = total - botRequests;

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
    cacheExpires,
    hitRatio,
    avgDuration,
    topOperations,
    botRequests,
    humanRequests,
    topBots,
  };
}
