
// app/admin/logs/page.tsx
"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import {
  RefreshCw,
  Trash2,
  Search,
  Loader2,
  BarChart3,
  Bot,
  User,
  Zap,
  Database,
  Clock,
  Pause,
  Play,
  ArrowUpDown,
  Filter,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type LogType =
  | "CACHE_HIT"
  | "CACHE_MISS"
  | "DATABASE_QUERY"
  | "CACHE_SAVE";

type LogSource = "cache" | "database";

interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  operation: string;
  source?: LogSource;
  duration?: number;
  bot?: {
    isBot: boolean;
    name: string;
  };
  userAgent?: string;
  path?: string;
  ip?: string;
}

interface LogStats {
  total: number;
  cacheHits: number;
  cacheMisses: number;
  dbQueries: number;
  hitRatio: number;
  avgDuration: number;
  topOperations: { name: string; count: number }[];
  botRequests: number;
  humanRequests: number;
  topBots: { name: string; count: number }[];
}

interface SortConfig {
  key: keyof LogEntry | null;
  direction: "asc" | "desc";
}

interface ColumnFilter {
  key: keyof LogEntry | null;
  value: string;
}

const AUTO_REFRESH_INTERVAL = 5 * 60;

// ============================================================
// API VALIDATION HELPERS
// ============================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonObject(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    throw new Error("Invalid response from server");
  }

  const data: unknown = await response.json();

  if (!isRecord(data)) {
    throw new Error("Invalid server response");
  }

  return data;
}

function parseLogEntry(value: unknown): LogEntry | null {
  if (!isRecord(value)) return null;

  if (
    typeof value.id !== "string" ||
    typeof value.timestamp !== "string" ||
    typeof value.operation !== "string"
  ) {
    return null;
  }

  const validTypes: LogType[] = [
    "CACHE_HIT",
    "CACHE_MISS",
    "DATABASE_QUERY",
    "CACHE_SAVE",
  ];

  if (
    typeof value.type !== "string" ||
    !validTypes.includes(value.type as LogType)
  ) {
    return null;
  }

  let bot: LogEntry["bot"];

  if (isRecord(value.bot)) {
    bot = {
      isBot: value.bot.isBot === true,
      name: typeof value.bot.name === "string" ? value.bot.name : "Unknown",
    };
  }

  const source =
    value.source === "cache" || value.source === "database"
      ? value.source
      : undefined;

  return {
    id: value.id,
    timestamp: value.timestamp,
    type: value.type as LogType,
    operation: value.operation,
    source,
    duration:
      typeof value.duration === "number" && Number.isFinite(value.duration)
        ? value.duration
        : undefined,
    bot,
    userAgent:
      typeof value.userAgent === "string" ? value.userAgent : undefined,
    path: typeof value.path === "string" ? value.path : undefined,
    ip: typeof value.ip === "string" ? value.ip : undefined,
  };
}

function parseLogs(value: unknown): LogEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(parseLogEntry)
    .filter((log): log is LogEntry => log !== null);
}

function parseCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseNamedCounts(
  value: unknown
): { name: string; count: number }[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map((item) => ({
      name: typeof item.name === "string" ? item.name : "Unknown",
      count: parseCount(item.count),
    }));
}

function parseLogStats(value: unknown): LogStats | null {
  if (!isRecord(value)) return null;

  return {
    total: parseCount(value.total),
    cacheHits: parseCount(value.cacheHits),
    cacheMisses: parseCount(value.cacheMisses),
    dbQueries: parseCount(value.dbQueries),
    hitRatio: parseCount(value.hitRatio),
    avgDuration: parseCount(value.avgDuration),
    topOperations: parseNamedCounts(value.topOperations),
    botRequests: parseCount(value.botRequests),
    humanRequests: parseCount(value.humanRequests),
    topBots: parseNamedCounts(value.topBots),
  };
}

function getFilterValue(log: LogEntry, key: keyof LogEntry): string {
  if (key === "bot") {
    return log.bot?.isBot ? log.bot.name : "Human";
  }

  const value = log[key];

  if (value === undefined || value === null) return "";

  return String(value);
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ============================================================
// LOGS TABLE COMPONENT
// ============================================================

function LogsTable({
  logs,
  deleting,
  onDelete,
  sortConfig,
  onSort,
  onColumnFilter,
  activeFilter,
}: {
  logs: LogEntry[];
  deleting: boolean;
  onDelete: (id: string) => void;
  sortConfig: SortConfig;
  onSort: (key: keyof LogEntry) => void;
  onColumnFilter: (key: keyof LogEntry, value: string) => void;
  activeFilter: ColumnFilter;
}) {
  if (logs.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="font-medium">No logs found</p>
        <p className="text-sm mt-1">Try changing your filters</p>
      </div>
    );
  }

  const renderSortableHeader = (
    label: string,
    key: keyof LogEntry
  ) => {
    const isActive = sortConfig.key === key;

    return (
      <th
        className="p-3 text-left whitespace-nowrap cursor-pointer select-none hover:bg-gray-100 transition"
        onClick={() => onSort(key)}
      >
        <div className="flex items-center gap-1">
          {label}
          <ArrowUpDown
            className={`w-3 h-3 ${
              isActive ? "text-blue-600" : "text-gray-400"
            }`}
          />
          {isActive && (
            <span className="text-[10px] text-blue-600 font-medium">
              {sortConfig.direction === "desc" ? "↓" : "↑"}
            </span>
          )}
        </div>
      </th>
    );
  };

  const isFiltered = (key: keyof LogEntry, value: string) =>
    activeFilter.key === key && activeFilter.value === value;

  const renderFilterableCell = (
    key: keyof LogEntry,
    value: string | number | undefined,
    displayValue: string
  ) => {
    const stringValue =
      value === undefined || value === null ? "" : String(value);

    if (!stringValue) {
      return <span className="text-gray-400">—</span>;
    }

    const filtered = isFiltered(key, stringValue);

    return (
      <button
        type="button"
        title={`Filter by ${displayValue}`}
        onClick={() => onColumnFilter(key, stringValue)}
        className={`rounded px-1 py-0.5 text-left transition hover:underline ${
          filtered
            ? "bg-blue-100 text-blue-700 font-medium"
            : "hover:bg-gray-100"
        }`}
      >
        {displayValue}
        {filtered && <span className="ml-1 text-xs">✕</span>}
      </button>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 border-b bg-gray-50">
          <tr>
            {renderSortableHeader("Time", "timestamp")}
            {renderSortableHeader("Type", "type")}
            {renderSortableHeader("Operation", "operation")}
            {renderSortableHeader("Source", "source")}
            {renderSortableHeader("Duration", "duration")}
            {renderSortableHeader("Bot/Human", "bot")}
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => {
            const isBot = log.bot?.isBot === true;
            const botName = isBot ? log.bot?.name ?? "Bot" : "Human";

            const typeColor =
              log.type === "CACHE_HIT"
                ? "bg-green-100 text-green-700"
                : log.type === "CACHE_MISS"
                  ? "bg-yellow-100 text-yellow-700"
                  : log.type === "DATABASE_QUERY"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700";

            return (
              <tr
                key={log.id}
                className="border-b transition-colors hover:bg-gray-50"
              >
                <td className="p-3 whitespace-nowrap text-xs text-gray-500">
                  {renderFilterableCell(
                    "timestamp",
                    log.timestamp,
                    new Date(log.timestamp).toLocaleString()
                  )}
                </td>

                <td className="p-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${typeColor}`}
                  >
                    {renderFilterableCell(
                      "type",
                      log.type,
                      log.type.replace("_", " ")
                    )}
                  </span>
                </td>

                <td className="p-3 font-mono text-xs">
                  {renderFilterableCell(
                    "operation",
                    log.operation,
                    log.operation
                  )}
                </td>

                <td className="p-3">
                  {renderFilterableCell(
                    "source",
                    log.source,
                    log.source ?? "—"
                  )}
                </td>

                <td className="p-3 text-xs">
                  {renderFilterableCell(
                    "duration",
                    log.duration,
                    log.duration !== undefined
                      ? `${log.duration}ms`
                      : "—"
                  )}
                </td>

                <td className="p-3">
                  <span className="flex items-center gap-1 text-xs">
                    {isBot ? (
                      <Bot className="h-3 w-3 text-blue-600" />
                    ) : (
                      <User className="h-3 w-3 text-gray-600" />
                    )}

                    {renderFilterableCell("bot", botName, botName)}
                  </span>
                </td>

                <td className="p-3 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(log.id)}
                    disabled={deleting}
                    aria-label="Delete log"
                    title="Delete log"
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// STATS CARDS COMPONENT
// ============================================================

function StatsCards({ stats }: { stats: LogStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <StatCard
        label="Total"
        value={stats.total}
        icon={<BarChart3 className="h-4 w-4" />}
        color="blue"
      />

      <StatCard
        label="Cache Hits"
        value={stats.cacheHits}
        icon={<Zap className="h-4 w-4" />}
        color="green"
      />

      <StatCard
        label="Cache Misses"
        value={stats.cacheMisses}
        icon={<Database className="h-4 w-4" />}
        color="yellow"
      />

      <StatCard
        label="DB Queries"
        value={stats.dbQueries}
        icon={<Database className="h-4 w-4" />}
        color="purple"
      />

      <StatCard
        label="Hit Ratio"
        value={`${stats.hitRatio}%`}
        icon={<BarChart3 className="h-4 w-4" />}
        color="indigo"
      />

      <StatCard
        label="Avg Time"
        value={`${stats.avgDuration}ms`}
        icon={<Clock className="h-4 w-4" />}
        color="gray"
      />
    </div>
  );
}

// ============================================================
// STAT CARD COMPONENT
// ============================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: "blue" | "green" | "yellow" | "purple" | "indigo" | "gray";
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
    gray: "bg-gray-50 text-gray-600",
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>

      <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "timestamp",
    direction: "desc",
  });

  const [columnFilter, setColumnFilter] = useState<ColumnFilter>({
    key: null,
    value: "",
  });

  const [filterType, setFilterType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(100);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // FILTER & SORT LOGS
  // ============================================================

  const visibleLogs = useMemo(() => {
    let result = [...logs];

    if (columnFilter.key && columnFilter.value) {
      result = result.filter(
        (log) =>
          getFilterValue(log, columnFilter.key!) === columnFilter.value
      );
    }

    if (sortConfig.key) {
      const key = sortConfig.key;

      result.sort((a, b) => {
        let aValue: string | number = getFilterValue(a, key);
        let bValue: string | number = getFilterValue(b, key);

        if (key === "timestamp") {
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
        } else if (key === "duration") {
          aValue = a.duration ?? 0;
          bValue = b.duration ?? 0;
        } else {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }

        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }

        return 0;
      });
    }

    return result;
  }, [logs, columnFilter, sortConfig]);

  // ============================================================
  // FETCH LOGS
  // ============================================================

  const fetchLogs = useCallback(async () => {
    try {
      setIsTableLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (filterType !== "ALL") {
        params.set("type", filterType);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      params.set("limit", String(limit));

      const response = await fetch(
        `/api/admin/logs?${params.toString()}`
      );

      const data = await readJsonObject(response);

      if (!response.ok || data.success !== true) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to fetch logs"
        );
      }

      setLogs(parseLogs(data.data));
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch logs. Please check if the API is working."
      );
    } finally {
      setIsTableLoading(false);
      setLoading(false);
    }
  }, [filterType, search, limit]);

  // ============================================================
  // FETCH STATS
  // ============================================================

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/logs?analysis=true");
      const data = await readJsonObject(response);

      if (!response.ok || data.success !== true) {
        return;
      }

      const parsedStats = parseLogStats(data.data);

      if (parsedStats) {
        setStats(parsedStats);
      }
    } catch {
      // Stats failure should not block the logs table.
    }
  }, []);

  // ============================================================
  // SORT
  // ============================================================

  const handleSort = useCallback((key: keyof LogEntry) => {
    setSortConfig((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === "asc"
          ? "desc"
          : "asc",
    }));
  }, []);

  // ============================================================
  // COLUMN FILTER
  // ============================================================

  const handleColumnFilter = useCallback(
    (key: keyof LogEntry, value: string) => {
      setColumnFilter((previous) => {
        if (previous.key === key && previous.value === value) {
          return { key: null, value: "" };
        }

        return { key, value };
      });
    },
    []
  );

  const clearColumnFilter = useCallback(() => {
    setColumnFilter({ key: null, value: "" });
  }, []);

  // ============================================================
  // DELETE SINGLE LOG
  // ============================================================

  const deleteLog = useCallback(
    async (id: string) => {
      if (deleting) return;

      if (!confirm("Delete this log?")) return;

      try {
        setDeleting(true);
        setError("");
        setMessage("");

        const response = await fetch(
          `/api/admin/logs?id=${encodeURIComponent(id)}`,
          { method: "DELETE" }
        );

        const data = await readJsonObject(response);

        if (!response.ok || data.success !== true) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Failed to delete log"
          );
        }

        setMessage("Log deleted successfully");

        await Promise.all([fetchLogs(), fetchStats()]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete log"
        );
      } finally {
        setDeleting(false);
      }
    },
    [deleting, fetchLogs, fetchStats]
  );

  // ============================================================
  // CLEAR ALL LOGS
  // ============================================================

  const clearAllLogs = useCallback(async () => {
    if (deleting) return;

    if (!confirm("Delete ALL logs? This cannot be undone!")) return;

    try {
      setDeleting(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/admin/logs?id=all", {
        method: "DELETE",
      });

      const data = await readJsonObject(response);

      if (!response.ok || data.success !== true) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to clear logs"
        );
      }

      setMessage("All logs cleared successfully");

      await Promise.all([fetchLogs(), fetchStats()]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to clear logs"
      );
    } finally {
      setDeleting(false);
    }
  }, [deleting, fetchLogs, fetchStats]);

  // ============================================================
  // MANUAL REFRESH
  // ============================================================

  const refresh = useCallback(() => {
    setError("");
    setMessage("");
    setRefreshKey((previous) => previous + 1);
    setCountdown(AUTO_REFRESH_INTERVAL);
  }, []);

  // ============================================================
  // AUTO REFRESH TOGGLE
  // ============================================================

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((previous) => !previous);
  }, []);

  // ============================================================
  // FILTER HANDLERS
  // ============================================================

  const handleFilterChange = useCallback((newFilterType: string) => {
    setFilterType(newFilterType);
    setCountdown(AUTO_REFRESH_INTERVAL);
  }, []);

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setCountdown(AUTO_REFRESH_INTERVAL);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setCountdown(AUTO_REFRESH_INTERVAL);
  }, []);

  // ============================================================
  // EFFECT: FETCH LOGS WHEN FILTERS OR REFRESH CHANGE
  // ============================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchLogs();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchLogs, refreshKey]);

  // ============================================================
  // EFFECT: INITIAL STATS + MANUAL/AUTO REFRESH
  // ============================================================

  useEffect(() => {
    void fetchStats();
  }, [fetchStats, refreshKey]);

  // ============================================================
  // EFFECT: AUTO REFRESH INTERVAL
  // ============================================================

  useEffect(() => {
    if (!autoRefreshEnabled) {
      setCountdown(0);
      setIsAutoRefreshing(false);
      return;
    }

    setCountdown(AUTO_REFRESH_INTERVAL);

    const interval = setInterval(() => {
      setIsAutoRefreshing(true);
      setRefreshKey((previous) => previous + 1);
      setCountdown(AUTO_REFRESH_INTERVAL);
    }, AUTO_REFRESH_INTERVAL * 1000);

    return () => {
      clearInterval(interval);
      setIsAutoRefreshing(false);
    };
  }, [autoRefreshEnabled]);

  // ============================================================
  // EFFECT: COUNTDOWN
  // ============================================================

  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const countdownInterval = setInterval(() => {
      setCountdown((previous) =>
        previous <= 1 ? AUTO_REFRESH_INTERVAL : previous - 1
      );
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [autoRefreshEnabled]);

  // ============================================================
  // EFFECT: AUTO REFRESH STATUS
  // ============================================================

  useEffect(() => {
    if (!isAutoRefreshing) return;

    const timer = setTimeout(() => {
      setIsAutoRefreshing(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isAutoRefreshing, refreshKey]);

  // ============================================================
  // EFFECT: CLEAR SUCCESS MESSAGE
  // ============================================================

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  // ============================================================
  // RENDER
  // ============================================================

  if (loading && logs.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Loading logs...</span>
      </div>
    );
  }

  const columnFilterInfo = columnFilter.key
    ? `${String(columnFilter.key)}: ${columnFilter.value}`
    : null;

  const botPercentage =
    stats && stats.total > 0
      ? Math.min(100, (stats.botRequests / stats.total) * 100)
      : 0;

  return (
    <div className="max-w-full space-y-6 p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Performance Logs
          </h1>

          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            Track cache hits, database queries, and bot activity.

            {isAutoRefreshing && (
              <span className="flex items-center gap-1 text-xs text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                Auto-refreshing...
              </span>
            )}

            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>

          {sortConfig.key && (
            <p className="mt-1 text-xs text-gray-400">
              Sorted by: {sortConfig.key} ({sortConfig.direction})
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleAutoRefresh}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              autoRefreshEnabled
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {autoRefreshEnabled ? (
              <>
                <Play className="h-3 w-3" />
                Auto On
              </>
            ) : (
              <>
                <Pause className="h-3 w-3" />
                Paused
              </>
            )}
          </button>

          <button
            type="button"
            onClick={refresh}
            disabled={isTableLoading}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isTableLoading || isAutoRefreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={clearAllLogs}
            disabled={deleting || logs.length === 0}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* STATS */}
      {stats && <StatsCards stats={stats} />}

      {/* BOT VS HUMAN */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Bot className="h-4 w-4" />
              Bot vs Human Requests
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.botRequests}
                </p>
                <p className="text-sm text-gray-500">Bot Requests</p>
              </div>

              <div className="h-10 border-l border-gray-200" />

              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.humanRequests}
                </p>
                <p className="text-sm text-gray-500">Human Requests</p>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${botPercentage}%` }}
              />
            </div>

            <p className="mt-1 text-xs text-gray-400">
              {Math.round(botPercentage)}% Bot Requests
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Bot className="h-4 w-4" />
              Top Bots
            </h3>

            {stats.topBots.length === 0 ? (
              <p className="text-sm text-gray-400">No bots detected</p>
            ) : (
              <div className="space-y-3">
                {stats.topBots.map((bot) => (
                  <div
                    key={bot.name}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate text-sm font-medium text-gray-700">
                      {bot.name}
                    </span>

                    <span className="whitespace-nowrap text-sm text-gray-500">
                      {bot.count} requests
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOP OPERATIONS */}
      {stats && stats.topOperations.length > 0 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">
            Top Operations
          </h3>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
            {stats.topOperations.map((operation) => (
              <div
                key={operation.name}
                className="rounded-lg bg-gray-50 p-3 text-center"
              >
                <p className="truncate text-sm font-medium text-gray-800">
                  {operation.name}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {operation.count} requests
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <label
              htmlFor="log-type"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Type
            </label>

            <select
              id="log-type"
              value={filterType}
              onChange={(event) => handleFilterChange(event.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">All Types</option>
              <option value="CACHE_HIT">Cache Hit</option>
              <option value="CACHE_MISS">Cache Miss</option>
              <option value="DATABASE_QUERY">Database Query</option>
              <option value="CACHE_SAVE">Cache Save</option>
            </select>
          </div>

          <div className="flex-[2]">
            <label
              htmlFor="log-search"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Search
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                id="log-search"
                type="text"
                placeholder="Search by operation, type, or bot..."
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                className="w-full rounded-lg border py-2 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="w-full md:w-32">
            <label
              htmlFor="log-limit"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Limit
            </label>

            <select
              id="log-limit"
              value={limit}
              onChange={(event) =>
                handleLimitChange(Number(event.target.value))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>

        {columnFilterInfo && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
              <Filter className="h-3 w-3" />
              Filter: {columnFilterInfo}
            </span>

            <button
              type="button"
              onClick={clearColumnFilter}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Clear column filter
            </button>
          </div>
        )}
      </div>

      {/* LOGS TABLE */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {isTableLoading && (
          <div className="flex items-center justify-center gap-2 border-b bg-gray-50 p-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-xs text-gray-500">Updating logs...</span>
          </div>
        )}

        <LogsTable
          logs={visibleLogs}
          deleting={deleting}
          onDelete={deleteLog}
          sortConfig={sortConfig}
          onSort={handleSort}
          onColumnFilter={handleColumnFilter}
          activeFilter={columnFilter}
        />
      </div>

      {/* FOOTER */}
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-gray-400 sm:flex-row">
        <span>
          Showing {visibleLogs.length} of {logs.length} loaded logs
        </span>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {lastUpdated && (
            <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
          )}

          {autoRefreshEnabled && countdown > 0 && (
            <span>Next refresh: {formatCountdown(countdown)}</span>
          )}

          {sortConfig.key && (
            <span>
              Sorted: {sortConfig.key} ({sortConfig.direction})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
