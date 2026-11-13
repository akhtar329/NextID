
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ElementType } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Edit,
  Plus,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Zap,
  BarChart3,
  Target,
  ChevronRight,
  Settings,
  Bell,
  UserCheck,
  Shield,
  ChevronDown,
  CheckCircle2,
  Archive,
  Clock3,
  User as UserIcon,
} from "lucide-react";

// ==================== TYPES ====================

interface AdminUser {
  name: string;
  role: string;
}

interface DashboardData {
  totalPosts: number;
  published: number;
  drafts: number;
  archived: number;
  editors: number;
  weeklyGrowth: number;
}

interface RecentPost {
  id: number;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

interface UserStat {
  id: number;
  name: string;
  email: string;
  role: string;
  totalPosts: number;
  published: number;
  drafts: number;
  archived: number;
  lastActive: string | null;
}

interface ActivityItem {
  id: number;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  action: string;
}

interface DashboardApiResponse {
  user?: unknown;
  data?: unknown;
  recentPosts?: unknown;
  allUsers?: unknown;
  userActivity?: unknown;
}

// ==================== API HELPERS ====================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJsonObject(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parseAdminUser(value: unknown): AdminUser | null {
  if (!isRecord(value)) return null;

  if (typeof value.name !== "string" || typeof value.role !== "string") {
    return null;
  }

  return {
    name: value.name,
    role: value.role,
  };
}

function parseDashboardData(value: unknown): DashboardData | null {
  if (!isRecord(value)) return null;

  const requiredFields = [
    "totalPosts",
    "published",
    "drafts",
    "archived",
    "editors",
    "weeklyGrowth",
  ] as const;

  if (
    !requiredFields.every(
      (field) =>
        typeof value[field] === "number" &&
        Number.isFinite(value[field])
    )
  ) {
    return null;
  }

  return {
    totalPosts: value.totalPosts as number,
    published: value.published as number,
    drafts: value.drafts as number,
    archived: value.archived as number,
    editors: value.editors as number,
    weeklyGrowth: value.weeklyGrowth as number,
  };
}

function parseRecentPost(value: unknown): RecentPost | null {
  if (!isRecord(value)) return null;

  if (
    typeof value.id !== "number" ||
    typeof value.title !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    title: value.title,
    type: readString(value.type, "other"),
    status: readString(value.status, "unknown"),
    createdAt: readString(value.createdAt),
  };
}

function parseUserStat(value: unknown): UserStat | null {
  if (!isRecord(value)) return null;

  if (
    typeof value.id !== "number" ||
    typeof value.name !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    email: readString(value.email),
    role: readString(value.role, "Editor"),
    totalPosts: readNumber(value.totalPosts),
    published: readNumber(value.published),
    drafts: readNumber(value.drafts),
    archived: readNumber(value.archived),
    lastActive: readNullableString(value.lastActive),
  };
}

function parseActivityItem(value: unknown): ActivityItem | null {
  if (!isRecord(value)) return null;

  if (
    typeof value.id !== "number" ||
    typeof value.title !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    title: value.title,
    type: readString(value.type, "other"),
    status: readString(value.status, "unknown"),
    createdAt: readString(value.createdAt),
    updatedAt: readString(value.updatedAt),
    action: readString(value.action),
  };
}

function parseArray<T>(
  value: unknown,
  parser: (item: unknown) => T | null
): T[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(parser)
    .filter((item): item is T => item !== null);
}

// ==================== SKELETON ====================

const DashboardSkeleton = () => (
  <div className="p-4 sm:p-8 space-y-6 animate-pulse">
    <div className="h-20 bg-gray-200 rounded-2xl" />

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-32 bg-gray-200 rounded-2xl" />
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl" />
      <div className="h-96 bg-gray-200 rounded-2xl" />
    </div>
  </div>
);

// ==================== STAT CARD ====================

const StatCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  iconBg,
  trend,
  trendValue,
  link,
}: {
  title: string;
  value: number | string;
  icon: ElementType;
  gradient: string;
  iconBg: string;
  trend?: "up" | "down";
  trendValue?: string;
  link?: string;
}) => {
  const content = (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-gray-200 transition-all duration-300 group cursor-pointer">
      <div
        className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -mr-10 -mt-10 ${gradient}`}
      />

      <div className="relative flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="w-6 h-6" />
        </div>

        {trend && trendValue && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
              trend === "up"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {trendValue}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          {title}
        </p>
        <p className="text-3xl font-bold text-gray-900 tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }

  return content;
};

// ==================== MAIN COMPONENT ====================

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [allUsers, setAllUsers] = useState<UserStat[]>([]);
  const [userActivity, setUserActivity] = useState<ActivityItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const requestIdRef = useRef(0);

  // ==================== LOAD DASHBOARD ====================

  const load = useCallback(
    async (selectedUserName?: string, isRefresh = false) => {
      const requestId = ++requestIdRef.current;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const url = selectedUserName
          ? `/api/admin/dashboard?user=${encodeURIComponent(selectedUserName)}`
          : "/api/admin/dashboard";

        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (requestId !== requestIdRef.current) return;

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.push("/login");
            return;
          }

          throw new Error(`Dashboard request failed (${res.status})`);
        }

        const rawJson: unknown = await res.json();

        if (requestId !== requestIdRef.current) return;

        const json = readJsonObject(
          rawJson
        ) as DashboardApiResponse;

        const parsedUser = parseAdminUser(json.user);
        const parsedData = parseDashboardData(json.data);

        if (!parsedUser || !parsedData) {
          throw new Error("Invalid dashboard response received from server.");
        }

        setUser(parsedUser);
        setData(parsedData);

        setRecentPosts(
          parseArray(json.recentPosts, parseRecentPost)
        );

        setAllUsers(
          parseArray(json.allUsers, parseUserStat)
        );

        setUserActivity(
          parseArray(json.userActivity, parseActivityItem)
        );
      } catch (error) {
        if (requestId !== requestIdRef.current) return;

        console.error("Dashboard loading error:", error);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [router]
  );

  useEffect(() => {
    void load();

    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  // ==================== USER SELECTION ====================

  const handleUserSelect = (userName: string) => {
    setSelectedUser(userName);
    setDropdownOpen(false);
    void load(userName);
  };

  // ==================== LOADING STATE ====================

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>

          <h2 className="text-lg font-bold text-gray-900">
            Dashboard unavailable
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Dashboard data load nahi ho saka. Please dobara try karein.
          </p>

          <button
            onClick={() => void load(selectedUser || undefined)}
            className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==================== HELPERS ====================

  const publishRate =
    data.totalPosts > 0
      ? Math.round((data.published / data.totalPosts) * 100)
      : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";

    return "Good evening";
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      admission: "bg-blue-100 text-blue-700",
      result: "bg-emerald-100 text-emerald-700",
      news: "bg-red-100 text-red-700",
      date_sheet: "bg-orange-100 text-orange-700",
      scholarship: "bg-amber-100 text-amber-700",
      job: "bg-indigo-100 text-indigo-700",
      blog: "bg-purple-100 text-purple-700",
    };

    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const getStatusIcon = (status: string) => {
    if (status === "published") {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }

    if (status === "draft") {
      return <Clock3 className="w-4 h-4 text-amber-600" />;
    }

    if (status === "archived") {
      return <Archive className="w-4 h-4 text-gray-600" />;
    }

    return <AlertCircle className="w-4 h-4 text-gray-400" />;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) return "Unknown";

    const diff = Date.now() - d.getTime();

    if (diff < 0) {
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
    }

    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const getRoleBadge = (role: string) => {
    return role.toLowerCase() === "admin"
      ? {
          color: "bg-red-100 text-red-700 border-red-200",
          icon: Shield,
          label: "Admin",
        }
      : {
          color: "bg-blue-100 text-blue-700 border-blue-200",
          icon: Edit,
          label: "Editor",
        };
  };

  const selectedUserData = allUsers.find(
    (item) => item.name === selectedUser
  );

  // ==================== UI ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* WELCOME BANNER */}

        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20" />

          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest">
                  Dashboard
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {getGreeting()}, {user.name.split(" ")[0]}!
              </h1>

              <p className="text-blue-100 text-sm">
                Logged in as{" "}
                <span className="font-bold text-white">{user.role}</span>
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => void load(selectedUser || undefined, true)}
                disabled={refreshing}
                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition text-sm font-semibold flex items-center gap-2 disabled:opacity-50 border border-white/30"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              <Link
                href="/admin/post/create"
                className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl transition text-sm font-bold flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                New Post
              </Link>
            </div>
          </div>
        </div>

        {/* STATS GRID */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Posts"
            value={data.totalPosts}
            icon={FileText}
            gradient="bg-blue-500"
            iconBg="bg-blue-100 text-blue-600"
            link="/admin/post"
          />

          <StatCard
            title="Published"
            value={data.published}
            icon={CheckCircle}
            gradient="bg-emerald-500"
            iconBg="bg-emerald-100 text-emerald-600"
            trend="up"
            trendValue={`${publishRate}%`}
            link="/admin/post?status=published"
          />

          <StatCard
            title="Drafts"
            value={data.drafts}
            icon={Clock}
            gradient="bg-amber-500"
            iconBg="bg-amber-100 text-amber-600"
            link="/admin/post?status=draft"
          />

          <StatCard
            title="Editors"
            value={data.editors}
            icon={Users}
            gradient="bg-purple-500"
            iconBg="bg-purple-100 text-purple-600"
            link="/admin/users"
          />
        </div>

        {/* USER ACTIVITY SECTION */}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                User Activity
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Select a user to view their activity
              </p>
            </div>

            {/* USER DROPDOWN */}

            <div className="relative">
              <button
                type="button"
                aria-expanded={dropdownOpen}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 transition flex items-center gap-3 min-w-[240px] justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {selectedUser ? (
                      selectedUser.charAt(0).toUpperCase()
                    ) : (
                      <UserIcon className="w-4 h-4" />
                    )}
                  </div>

                  <span className="text-sm font-semibold text-gray-700 truncate">
                    {selectedUser || "Select a user"}
                  </span>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition shrink-0 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />

                  <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    <div className="p-3 border-b bg-gray-50">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Select User
                      </p>
                    </div>

                    <div className="max-h-80 overflow-y-auto p-1">
                      {allUsers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No users found
                        </div>
                      ) : (
                        allUsers.map((item) => {
                          const roleBadge = getRoleBadge(item.role);
                          const RoleIcon = roleBadge.icon;

                          return (
                            <button
                              type="button"
                              key={item.id}
                              onClick={() => handleUserSelect(item.name)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 transition flex items-center gap-3 ${
                                selectedUser === item.name ? "bg-blue-50" : ""
                              }`}
                            >
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {item.name.charAt(0).toUpperCase()}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                  {item.name}
                                </p>

                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${roleBadge.color}`}
                                  >
                                    <RoleIcon className="w-2.5 h-2.5" />
                                    {roleBadge.label}
                                  </span>

                                  <span className="text-[10px] text-gray-500">
                                    {item.totalPosts} posts
                                  </span>
                                </div>
                              </div>

                              {selectedUser === item.name && (
                                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SELECTED USER DETAILS */}

          {selectedUserData && (
            <div className="space-y-5">
              {/* USER INFO */}

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {selectedUserData.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedUserData.name}
                    </h3>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(() => {
                        const roleBadge = getRoleBadge(selectedUserData.role);
                        const RoleIcon = roleBadge.icon;

                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${roleBadge.color}`}
                          >
                            <RoleIcon className="w-3 h-3" />
                            {roleBadge.label}
                          </span>
                        );
                      })()}

                      {selectedUserData.email && (
                        <span className="text-xs text-gray-600 break-all">
                          {selectedUserData.email}
                        </span>
                      )}

                      <span className="text-xs text-gray-500">
                        • Last active {formatDate(selectedUserData.lastActive)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* USER STATS */}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <p className="text-xs font-bold text-blue-700 uppercase">
                      Total
                    </p>
                  </div>

                  <p className="text-2xl font-bold text-blue-900">
                    {selectedUserData.totalPosts}
                  </p>
                </div>

                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs font-bold text-emerald-700 uppercase">
                      Published
                    </p>
                  </div>

                  <p className="text-2xl font-bold text-emerald-900">
                    {selectedUserData.published}
                  </p>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock3 className="w-4 h-4 text-amber-600" />
                    <p className="text-xs font-bold text-amber-700 uppercase">
                      Drafts
                    </p>
                  </div>

                  <p className="text-2xl font-bold text-amber-900">
                    {selectedUserData.drafts}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Archive className="w-4 h-4 text-gray-600" />
                    <p className="text-xs font-bold text-gray-700 uppercase">
                      Archived
                    </p>
                  </div>

                  <p className="text-2xl font-bold text-gray-900">
                    {selectedUserData.archived}
                  </p>
                </div>
              </div>

              {/* RECENT ACTIVITY */}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    Recent Activity
                  </h4>

                  <Link
                    href={`/admin/post?author=${encodeURIComponent(selectedUserData.name)}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View all
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                {userActivity.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      No activity yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {userActivity.map((item) => (
                      <Link
                        key={item.id}
                        href={`/admin/post/${item.id}/edit`}
                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition group"
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getTypeColor(item.type)}`}
                        >
                          {getStatusIcon(item.status)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600">
                            {item.title}
                          </p>

                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${getTypeColor(item.type)}`}
                            >
                              {item.type}
                            </span>

                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                item.status === "published"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : item.status === "draft"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {item.status}
                            </span>

                            <span className="text-[10px] text-gray-500 font-semibold">
                              {item.action}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs text-gray-400 font-medium shrink-0">
                          {formatDate(item.updatedAt)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EMPTY STATE */}

          {!selectedUser && (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <UserCheck className="w-10 h-10 text-gray-400" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Select a user
              </h3>

              <p className="text-sm text-gray-500">
                Choose a user from the dropdown above to view their activity
              </p>
            </div>
          )}
        </div>

        {/* PERFORMANCE AND RECENT POSTS */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* PERFORMANCE */}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Performance Overview
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Published
                    </span>

                    <span className="text-sm font-bold text-gray-900">
                      {data.published} / {data.totalPosts}
                    </span>
                  </div>

                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${publishRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RECENT POSTS */}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Recent Posts
                </h2>

                <Link
                  href="/admin/post"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View all
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {recentPosts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No posts yet
                </p>
              ) : (
                <div className="space-y-2">
                  {recentPosts.slice(0, 5).map((post) => (
                    <Link
                      key={post.id}
                      href={`/admin/post/${post.id}/edit`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition group"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${getTypeColor(post.type)}`}
                      >
                        {post.title.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600">
                          {post.title}
                        </p>

                        <span className="text-xs text-gray-500">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}

          <div className="space-y-6">

            {/* QUICK ACTIONS */}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Quick Actions
              </h2>

              <div className="space-y-2">
                {[
                  {
                    href: "/admin/post/create",
                    icon: Plus,
                    label: "Create New Post",
                  },
                  {
                    href: "/admin/users",
                    icon: UserCheck,
                    label: "Manage Users",
                  },
                  {
                    href: "/admin/notifications",
                    icon: Bell,
                    label: "Notifications",
                  },
                  {
                    href: "/admin/settings",
                    icon: Settings,
                    label: "Settings",
                  },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition group border border-transparent hover:border-gray-200"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:scale-110 transition">
                      <action.icon className="w-4 h-4" />
                    </div>

                    <span className="text-sm font-semibold text-gray-700 flex-1">
                      {action.label}
                    </span>

                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </Link>
                ))}
              </div>
            </div>

            {/* SYSTEM STATUS */}

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-6 text-white">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                System Status
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center gap-3">
                  <span className="text-sm text-gray-300">
                    Status
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Operational
                  </span>
                </div>

                <div className="flex justify-between items-center gap-3">
                  <span className="text-sm text-gray-300">
                    Growth
                  </span>

                  <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{data.weeklyGrowth}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} NextID • Admin Dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
