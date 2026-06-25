// app/admin/logs/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface LogEntry {
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

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // ✅ Filters
  const [filterType, setFilterType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(100);

  // ✅ Message
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // FETCH LOGS (with useCallback)
  // ============================================================

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filterType !== "ALL") params.set("type", filterType);
      if (search) params.set("search", search);
      if (limit) params.set("limit", String(limit));

      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      
      // ✅ Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response from server");
      }

      const data = await res.json();

      if (data.success) {
        setLogs(data.data || []);
      } else {
        setError(data.error || "Failed to fetch logs");
      }
    } catch {
      setError("Failed to fetch logs. Please check if the API is working.");
    } finally {
      setLoading(false);
    }
  }, [filterType, search, limit]);

  // ============================================================
  // FETCH STATS (with useCallback)
  // ============================================================

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/logs?analysis=true");
      
      // ✅ Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return;
      }

      const data = await res.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch {
      // Silent fail - stats are optional
    }
  }, []);

  // ============================================================
  // DELETE LOG
  // ============================================================

  async function deleteLog(id: string) {
    if (!confirm("Delete this log?")) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/logs?id=${id}`, { method: "DELETE" });
      
      // ✅ Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response from server");
      }

      const data = await res.json();

      if (data.success) {
        setMessage("Log deleted successfully");
        setTimeout(() => setMessage(""), 3000);
        await fetchLogs();
        await fetchStats();
      } else {
        setError(data.error || "Failed to delete log");
      }
    } catch {
      setError("Failed to delete log");
    } finally {
      setDeleting(false);
    }
  }

  // ============================================================
  // CLEAR ALL LOGS
  // ============================================================

  async function clearAllLogs() {
    if (!confirm("Delete ALL logs? This cannot be undone!")) return;

    try {
      setDeleting(true);
      const res = await fetch("/api/admin/logs?id=all", { method: "DELETE" });
      
      // ✅ Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response from server");
      }

      const data = await res.json();

      if (data.success) {
        setMessage("All logs cleared successfully");
        setTimeout(() => setMessage(""), 3000);
        await fetchLogs();
        await fetchStats();
      } else {
        setError(data.error || "Failed to clear logs");
      }
    } catch {
      setError("Failed to clear logs");
    } finally {
      setDeleting(false);
    }
  }

  // ============================================================
  // REFRESH
  // ============================================================

  function refresh() {
    fetchLogs();
    fetchStats();
  }

  // ============================================================
  // USE EFFECTS
  // ============================================================

  // ✅ Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
      fetchStats();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchLogs, fetchStats]);

  // ✅ Auto-refresh when filters change (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchLogs]);

  // ============================================================
  // RENDER
  // ============================================================

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Loading logs...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-full">
      {/* ==================== HEADER ==================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Performance Logs
          </h1>
          <p className="text-sm text-gray-500">
            Track cache hits, database queries, and bot activity
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={clearAllLogs}
            disabled={deleting || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* ==================== MESSAGES ==================== */}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
          {error}
        </div>
      )}

      {/* ==================== STATS CARDS ==================== */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total"
            value={stats.total}
            icon={<BarChart3 className="w-4 h-4" />}
            color="blue"
          />
          <StatCard
            label="Cache Hits"
            value={stats.cacheHits}
            icon={<Zap className="w-4 h-4" />}
            color="green"
          />
          <StatCard
            label="Cache Misses"
            value={stats.cacheMisses}
            icon={<Database className="w-4 h-4" />}
            color="yellow"
          />
          <StatCard
            label="DB Queries"
            value={stats.dbQueries}
            icon={<Database className="w-4 h-4" />}
            color="purple"
          />
          <StatCard
            label="Hit Ratio"
            value={`${stats.hitRatio}%`}
            icon={<BarChart3 className="w-4 h-4" />}
            color="indigo"
          />
          <StatCard
            label="Avg Time"
            value={`${stats.avgDuration}ms`}
            icon={<Clock className="w-4 h-4" />}
            color="gray"
          />
        </div>
      )}

      {/* ==================== BOT VS HUMAN ==================== */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold text-sm text-gray-600 mb-3 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Bot vs Human Requests
            </h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">{stats.botRequests}</p>
                <p className="text-sm text-gray-500">Bot Requests</p>
              </div>
              <div className="text-gray-300 text-2xl">|</div>
              <div>
                <p className="text-2xl font-bold">{stats.humanRequests}</p>
                <p className="text-sm text-gray-500">Human Requests</p>
              </div>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{
                  width: `${stats.total > 0 ? (stats.botRequests / stats.total) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {stats.total > 0 ? Math.round((stats.botRequests / stats.total) * 100) : 0}% Bot
            </p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold text-sm text-gray-600 mb-3 flex items-center gap-2">
              🔥 Top Bots
            </h3>
            {stats.topBots.length === 0 ? (
              <p className="text-sm text-gray-400">No bots detected</p>
            ) : (
              <div className="space-y-2">
                {stats.topBots.map((bot) => (
                  <div key={bot.name} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{bot.name}</span>
                    <span className="text-sm text-gray-500">{bot.count} requests</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TOP OPERATIONS ==================== */}
      {stats && stats.topOperations.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-sm text-gray-600 mb-3">🔥 Top Operations</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {stats.topOperations.map((op) => (
              <div
                key={op.name}
                className="bg-gray-50 rounded-lg p-3 text-center"
              >
                <p className="text-sm font-medium truncate">{op.name}</p>
                <p className="text-xs text-gray-500">{op.count} requests</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== FILTERS ==================== */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Type Filter */}
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="CACHE_HIT">Cache Hit</option>
              <option value="CACHE_MISS">Cache Miss</option>
              <option value="DATABASE_QUERY">Database Query</option>
              <option value="CACHE_SAVE">Cache Save</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-[2]">
            <label className="text-xs text-gray-500 block mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by operation, type, or bot..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Limit */}
          <div className="w-32">
            <label className="text-xs text-gray-500 block mb-1">Limit</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>
      </div>

      {/* ==================== LOGS TABLE ==================== */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No logs found</p>
            <p className="text-sm">
              {filterType !== "ALL" || search ? "Try changing your filters" : "Logs will appear here once requests are made"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">Time</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Operation</th>
                  <th className="text-left p-3">Source</th>
                  <th className="text-left p-3">Duration</th>
                  <th className="text-left p-3">Bot/Human</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isBot = log.bot?.isBot || false;
                  const botName = log.bot?.name || "Human";

                  return (
                    <tr key={log.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap
                          ${log.type === "CACHE_HIT" ? "bg-green-100 text-green-700" :
                          log.type === "CACHE_MISS" ? "bg-yellow-100 text-yellow-700" :
                          log.type === "DATABASE_QUERY" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"}
                        `}>
                          {log.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs">{log.operation}</td>
                      <td className="p-3">
                        <span className={`text-xs ${log.source === "cache" ? "text-green-600" : "text-blue-600"}`}>
                          {log.source || "—"}
                        </span>
                      </td>
                      <td className="p-3 text-xs">
                        {log.duration !== undefined ? `${log.duration}ms` : "—"}
                      </td>
                      <td className="p-3">
                        <span className="flex items-center gap-1 text-xs">
                          {isBot ? (
                            <>
                              <Bot className="w-3 h-3 text-blue-600" />
                              {botName}
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 text-gray-600" />
                              Human
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => deleteLog(log.id)}
                          disabled={deleting}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== FOOTER ==================== */}
      <div className="text-xs text-gray-400 text-center">
        Showing {logs.length} logs
        {logs.length > 0 && ` • Last updated: ${new Date().toLocaleString()}`}
      </div>
    </div>
  );
}

// ============================================================
// STAT CARD COMPONENT
// ============================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
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
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}