// app/admin/logs/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
// SORT CONFIG TYPE
// ============================================================

interface SortConfig {
  key: keyof LogEntry | null;
  direction: "asc" | "desc";
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
  activeFilter: { key: keyof LogEntry | null; value: string };
}) {
  if (logs.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p>No logs found</p>
        <p className="text-sm">Try changing your filters</p>
      </div>
    );
  }

  const renderSortableHeader = (label: string, key: keyof LogEntry) => {
    const isActive = sortConfig.key === key;
    const direction = isActive ? sortConfig.direction : "asc";

    return (
      <th 
        className="text-left p-3 cursor-pointer hover:bg-gray-100 transition select-none whitespace-nowrap"
        onClick={() => onSort(key)}
      >
        <div className="flex items-center gap-1">
          {label}
          <ArrowUpDown className={`w-3 h-3 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
          {isActive && (
            <span className="text-[10px] text-blue-600 font-medium">
              {direction === "desc" ? "↓" : "↑"}
            </span>
          )}
        </div>
      </th>
    );
  };

  // Check if a value is currently filtered
  const isFiltered = (key: keyof LogEntry, value: string) => {
    return activeFilter.key === key && activeFilter.value === value;
  };

  // Render cell with click-to-filter
  const renderFilterableCell = (key: keyof LogEntry, value: string | number | undefined, displayValue: string) => {
    const stringValue = String(value || "");
    if (!stringValue || stringValue === "") return <span className="text-gray-400">—</span>;
    
    const filtered = isFiltered(key, stringValue);
    
    return (
      <span 
        className={`cursor-pointer hover:underline transition px-1 py-0.5 rounded ${
          filtered ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'
        }`}
        onClick={() => onColumnFilter(key, stringValue)}
      >
        {displayValue}
        {filtered && <span className="ml-1 text-xs">✕</span>}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b sticky top-0">
          <tr>
            {renderSortableHeader("Time", "timestamp")}
            {renderSortableHeader("Type", "type")}
            {renderSortableHeader("Operation", "operation")}
            {renderSortableHeader("Source", "source")}
            {renderSortableHeader("Duration", "duration")}
            {renderSortableHeader("Bot/Human", "bot")}
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
                  {renderFilterableCell("timestamp", log.timestamp, new Date(log.timestamp).toLocaleString())}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap
                    ${log.type === "CACHE_HIT" ? "bg-green-100 text-green-700" :
                    log.type === "CACHE_MISS" ? "bg-yellow-100 text-yellow-700" :
                    log.type === "DATABASE_QUERY" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"}
                  `}>
                    {renderFilterableCell("type", log.type, log.type.replace("_", " "))}
                  </span>
                </td>
                <td className="p-3 font-mono text-xs">
                  {renderFilterableCell("operation", log.operation, log.operation)}
                </td>
                <td className="p-3">
                  {renderFilterableCell("source", log.source, log.source || "—")}
                </td>
                <td className="p-3 text-xs">
                  {renderFilterableCell("duration", log.duration, log.duration !== undefined ? `${log.duration}ms` : "—")}
                </td>
                <td className="p-3">
                  <span className="flex items-center gap-1 text-xs">
                    {isBot ? (
                      <>
                        <Bot className="w-3 h-3 text-blue-600" />
                        {renderFilterableCell("bot", botName, botName)}
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3 text-gray-600" />
                        {renderFilterableCell("bot", "Human", "Human")}
                      </>
                    )}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => onDelete(log.id)}
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
  );
}

// ============================================================
// STATS CARDS COMPONENT
// ============================================================

function StatsCards({ stats }: { stats: LogStats }) {
  return (
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

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const AUTO_REFRESH_INTERVAL = 5 * 60;

  // ✅ Sort Configuration
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "timestamp",
    direction: "desc",
  });

  // ✅ Column Filter
  const [columnFilter, setColumnFilter] = useState<{ key: keyof LogEntry | null; value: string }>({
    key: null,
    value: "",
  });

  // Filters
  const [filterType, setFilterType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(100);

  // Message
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Refs
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================
  // SORT & FILTER HELPERS
  // ============================================================

  const getFilteredAndSortedLogs = useCallback((logsData: LogEntry[]) => {
    let filtered = [...logsData];

    // ✅ Column filter
    if (columnFilter.key && columnFilter.value) {
      filtered = filtered.filter(log => {
        const val = log[columnFilter.key as keyof LogEntry];
        return String(val) === columnFilter.value;
      });
    }

    // ✅ Sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof LogEntry];
        let bVal = b[sortConfig.key as keyof LogEntry];

        if (sortConfig.key === "timestamp") {
          aVal = new Date(aVal as string).getTime();
          bVal = new Date(bVal as string).getTime();
        } else if (sortConfig.key === "duration") {
          aVal = aVal || 0;
          bVal = bVal || 0;
        } else if (sortConfig.key === "bot") {
          aVal = a.bot?.isBot ? "Bot" : "Human";
          bVal = b.bot?.isBot ? "Bot" : "Human";
        } else {
          aVal = String(aVal || "");
          bVal = String(bVal || "");
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [columnFilter, sortConfig]);

  // ============================================================
  // FETCH LOGS
  // ============================================================

  const fetchLogs = useCallback(async () => {
    try {
      setIsTableLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filterType !== "ALL") params.set("type", filterType);
      if (search) params.set("search", search);
      if (limit) params.set("limit", String(limit));

      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response from server");
      }

      const data = await res.json();

      if (data.success) {
        const filteredAndSorted = getFilteredAndSortedLogs(data.data || []);
        setLogs(filteredAndSorted);
        setLastUpdated(new Date());
        if (autoRefreshEnabled) {
          setCountdown(AUTO_REFRESH_INTERVAL);
        }
      } else {
        setError(data.error || "Failed to fetch logs");
      }
    } catch {
      setError("Failed to fetch logs. Please check if the API is working.");
    } finally {
      setIsTableLoading(false);
      setLoading(false);
    }
  }, [filterType, search, limit, autoRefreshEnabled, AUTO_REFRESH_INTERVAL, getFilteredAndSortedLogs]);

  // ============================================================
  // FETCH STATS
  // ============================================================

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/logs?analysis=true");
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return;
      }

      const data = await res.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch {
      // Silent fail
    }
  }, []);

  // ============================================================
  // HANDLE SORT
  // ============================================================

  const handleSort = useCallback((key: keyof LogEntry) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "desc" };
    });
    // Re-apply sort on current logs
    setLogs(prev => getFilteredAndSortedLogs(prev));
  }, [getFilteredAndSortedLogs]);

  // ============================================================
  // HANDLE COLUMN FILTER
  // ============================================================

  const handleColumnFilter = useCallback((key: keyof LogEntry, value: string) => {
    setColumnFilter(prev => {
      if (prev.key === key && prev.value === value) {
        return { key: null, value: "" };
      }
      return { key, value };
    });
  }, []);

  const clearColumnFilter = useCallback(() => {
    setColumnFilter({ key: null, value: "" });
  }, []);

  // ============================================================
  // DELETE LOG
  // ============================================================

  const deleteLog = useCallback(async (id: string) => {
    if (!confirm("Delete this log?")) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/logs?id=${id}`, { method: "DELETE" });
      
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
  }, [fetchLogs, fetchStats]);

  // ============================================================
  // CLEAR ALL LOGS
  // ============================================================

  const clearAllLogs = useCallback(async () => {
    if (!confirm("Delete ALL logs? This cannot be undone!")) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/logs?id=all`, { method: "DELETE" });
      
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
  }, [fetchLogs, fetchStats]);

  // ============================================================
  // AUTO-REFRESH
  // ============================================================

  const startAutoRefresh = useCallback(() => {
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    if (!autoRefreshEnabled) {
      setCountdown(0);
      return;
    }

    setCountdown(AUTO_REFRESH_INTERVAL);

    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    autoRefreshTimerRef.current = setInterval(() => {
      setIsAutoRefreshing(true);
      console.log("🔄 Auto-refreshing logs...");
      setRefreshKey(prev => prev + 1);
      setCountdown(AUTO_REFRESH_INTERVAL);
      setTimeout(() => setIsAutoRefreshing(false), 1000);
    }, AUTO_REFRESH_INTERVAL * 1000);
  }, [autoRefreshEnabled, AUTO_REFRESH_INTERVAL]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(0);
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => {
      const newState = !prev;
      if (newState) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
      return newState;
    });
  }, [startAutoRefresh, stopAutoRefresh]);

  // ============================================================
  // REFRESH (Manual)
  // ============================================================

  const refresh = useCallback(() => {
    setError("");
    setMessage("");
    setRefreshKey(prev => prev + 1);
    if (autoRefreshEnabled) {
      setCountdown(AUTO_REFRESH_INTERVAL);
    }
  }, [autoRefreshEnabled, AUTO_REFRESH_INTERVAL]);

  // ============================================================
  // FORMAT COUNTDOWN
  // ============================================================

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ============================================================
  // HANDLE FILTER CHANGE
  // ============================================================

  const handleFilterChange = useCallback((newFilterType: string) => {
    setFilterType(newFilterType);
    if (autoRefreshEnabled) setCountdown(AUTO_REFRESH_INTERVAL);
  }, [autoRefreshEnabled, AUTO_REFRESH_INTERVAL]);

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    if (autoRefreshEnabled) setCountdown(AUTO_REFRESH_INTERVAL);
  }, [autoRefreshEnabled, AUTO_REFRESH_INTERVAL]);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    if (autoRefreshEnabled) setCountdown(AUTO_REFRESH_INTERVAL);
  }, [autoRefreshEnabled, AUTO_REFRESH_INTERVAL]);

// ============================================================
// USE EFFECTS
// ============================================================

// ✅ Initial load + refresh
useEffect(() => {
  let isMounted = true;
  
  const loadData = async () => {
    if (isMounted) {
      await fetchLogs();
      await fetchStats();
    }
  };
  
  loadData();
  
  return () => {
    isMounted = false;
  };
}, [refreshKey, fetchLogs, fetchStats]); // ✅ Added missing dependencies

// ✅ Auto-refresh when filters change
useEffect(() => {
  const timer = setTimeout(() => {
    fetchLogs();
  }, 300);
  return () => clearTimeout(timer);
}, [filterType, search, limit, fetchLogs]); // ✅ Added fetchLogs

// ✅ Auto-refresh timer - FIXED
useEffect(() => {
  // ✅ Don't start if auto-refresh is disabled
  if (!autoRefreshEnabled) return;
  
  const interval = setInterval(() => {
    console.log("🔄 Auto-refreshing logs at:", new Date().toLocaleTimeString());
    setIsAutoRefreshing(true);
    
    Promise.all([fetchLogs(), fetchStats()]).finally(() => {
      setIsAutoRefing(false);
      setCountdown(AUTO_REFRESH_INTERVAL);
    });
  }, AUTO_REFRESH_INTERVAL * 1000);

  return () => {
    clearInterval(interval);
    setIsAutoRefreshing(false);
  };
}, [fetchLogs, fetchStats, autoRefreshEnabled, AUTO_REFRESH_INTERVAL]); // ✅ All dependencies

// ✅ Countdown timer - separate effect
useEffect(() => {
  if (!autoRefreshEnabled) {
    setCountdown(0);
    return;
  }

  setCountdown(AUTO_REFRESH_INTERVAL);
  
  const countdownInterval = setInterval(() => {
    setCountdown(prev => {
      if (prev <= 1) return 0;
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(countdownInterval);
}, [autoRefreshEnabled, AUTO_REFRESH_INTERVAL]); // ✅ All dependencies

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

  const columnFilterInfo = columnFilter.key 
    ? `${String(columnFilter.key)}: ${columnFilter.value}` 
    : null;

  return (
    <div className="p-6 space-y-6 max-w-full">
      {/* ==================== HEADER ==================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Performance Logs
          </h1>
          <p className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
            Track cache hits, database queries, and bot activity
            {isAutoRefreshing && (
              <span className="text-xs text-blue-600 animate-pulse flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Auto-refreshing...
              </span>
            )}
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            {sortConfig.key && (
              <span className="text-xs text-gray-400">
                • Sorted by: {sortConfig.key} ({sortConfig.direction === "desc" ? "↓" : "↑"})
              </span>
            )}
            {columnFilterInfo && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filter: {columnFilterInfo}
                <button onClick={clearColumnFilter} className="hover:text-red-600">✕</button>
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={toggleAutoRefresh}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              autoRefreshEnabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {autoRefreshEnabled ? (
              <>
                <Play className="w-3 h-3" />
                Auto On
              </>
            ) : (
              <>
                <Pause className="w-3 h-3" />
                Paused
              </>
            )}
          </button>

          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
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
      {stats && <StatsCards stats={stats} />}

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
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="CACHE_HIT">Cache Hit</option>
              <option value="CACHE_MISS">Cache Miss</option>
              <option value="DATABASE_QUERY">Database Query</option>
              <option value="CACHE_SAVE">Cache Save</option>
            </select>
          </div>

          <div className="flex-[2]">
            <label className="text-xs text-gray-500 block mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by operation, type, or bot..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="w-32">
            <label className="text-xs text-gray-500 block mb-1">Limit</label>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
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
        {isTableLoading && logs.length === 0 ? (
          <div className="flex items-center justify-center p-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500">Loading logs...</span>
          </div>
        ) : (
          <>
            {isTableLoading && logs.length > 0 && (
              <div className="flex items-center justify-center p-2 bg-gray-50 border-b">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="ml-2 text-xs text-gray-500">Updating...</span>
              </div>
            )}
            <LogsTable 
              logs={logs} 
              deleting={deleting} 
              onDelete={deleteLog}
              sortConfig={sortConfig}
              onSort={handleSort}
              onColumnFilter={handleColumnFilter}
              activeFilter={columnFilter}
            />
          </>
        )}
      </div>

      {/* ==================== FOOTER ==================== */}
      <div className="text-xs text-gray-400 text-center">
        Showing {logs.length} logs
        {logs.length > 0 && lastUpdated && ` • Last updated: ${lastUpdated.toLocaleTimeString()}`}
        {autoRefreshEnabled && countdown > 0 && (
          <span className="ml-2"> • Next refresh: {formatCountdown(countdown)}</span>
        )}
        {sortConfig.key && (
          <span className="ml-2">
            • Sorted by: {sortConfig.key} ({sortConfig.direction === "desc" ? "Newest first" : "Oldest first"})
          </span>
        )}
        {columnFilterInfo && (
          <span className="ml-2"> • Filter: {columnFilterInfo}</span>
        )}
      </div>
    </div>
  );
}