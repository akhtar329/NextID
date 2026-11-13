
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Users,
  GraduationCap,
  UserRoundCheck,
  BookOpen,
  CalendarCheck,
  Wallet,
  RefreshCw,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  School,
  CreditCard,
  Settings,
  Activity,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

// ==================== TYPES ====================

interface Owner {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface Institute {
  id: number;
  name: string;
  slug?: string;
  logo?: string | null;
  status: "pending" | "active" | "inactive" | "suspended";
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  subdomain?: string;
}

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  totalClasses: number;
  presentToday: number;
  absentToday: number;
  totalFees: number;
  collectedFees: number;
  pendingFees: number;
  monthlyGrowth?: number;
}

interface RecentActivity {
  id: number;
  title: string;
  description?: string;
  type: string;
  createdAt: string;
}

interface UpcomingEvent {
  id: number;
  title: string;
  date: string;
  description?: string;
}

interface DashboardResponse {
  success: boolean;
  user: Owner;
  institute: Institute | null;
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  upcomingEvents: UpcomingEvent[];
}

// ==================== RESPONSE VALIDATION ====================

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidString(value: unknown): value is string {
  return typeof value === "string";
}

function isOwner(value: unknown): value is Owner {
  if (!isRecord(value)) return false;

  return (
    isValidNumber(value.id) &&
    isValidString(value.name) &&
    isValidString(value.email) &&
    (value.phone === undefined || isValidString(value.phone))
  );
}

function isInstitute(value: unknown): value is Institute {
  if (!isRecord(value)) return false;

  const validStatuses = [
    "pending",
    "active",
    "inactive",
    "suspended",
  ];

  return (
    isValidNumber(value.id) &&
    isValidString(value.name) &&
    isValidString(value.status) &&
    validStatuses.includes(value.status) &&
    (value.slug === undefined || isValidString(value.slug)) &&
    (value.logo === undefined ||
      value.logo === null ||
      isValidString(value.logo)) &&
    (value.email === undefined || isValidString(value.email)) &&
    (value.phone === undefined || isValidString(value.phone)) &&
    (value.address === undefined || isValidString(value.address)) &&
    (value.city === undefined || isValidString(value.city)) &&
    (value.subdomain === undefined || isValidString(value.subdomain))
  );
}

function isDashboardStats(value: unknown): value is DashboardStats {
  if (!isRecord(value)) return false;

  const requiredNumbers = [
    "totalStudents",
    "totalTeachers",
    "totalStaff",
    "totalClasses",
    "presentToday",
    "absentToday",
    "totalFees",
    "collectedFees",
    "pendingFees",
  ];

  return (
    requiredNumbers.every((key) => isValidNumber(value[key])) &&
    (value.monthlyGrowth === undefined ||
      isValidNumber(value.monthlyGrowth))
  );
}

function isRecentActivity(value: unknown): value is RecentActivity {
  if (!isRecord(value)) return false;

  return (
    isValidNumber(value.id) &&
    isValidString(value.title) &&
    isValidString(value.type) &&
    isValidString(value.createdAt) &&
    (value.description === undefined ||
      isValidString(value.description))
  );
}

function isUpcomingEvent(value: unknown): value is UpcomingEvent {
  if (!isRecord(value)) return false;

  return (
    isValidNumber(value.id) &&
    isValidString(value.title) &&
    isValidString(value.date) &&
    (value.description === undefined ||
      isValidString(value.description))
  );
}

function isDashboardResponse(
  value: unknown
): value is DashboardResponse {
  if (!isRecord(value)) return false;

  return (
    value.success === true &&
    isOwner(value.user) &&
    (value.institute === null || isInstitute(value.institute)) &&
    isDashboardStats(value.stats) &&
    Array.isArray(value.recentActivities) &&
    value.recentActivities.every(isRecentActivity) &&
    Array.isArray(value.upcomingEvents) &&
    value.upcomingEvents.every(isUpcomingEvent)
  );
}

// ==================== SKELETON ====================

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 animate-pulse">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="h-48 bg-gray-200 rounded-3xl" />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-36 bg-gray-200 rounded-2xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-gray-200 rounded-2xl" />
          <div className="h-80 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ==================== STAT CARD ====================

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
  href,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  description: string;
  href?: string;
}) {
  const formattedValue =
    typeof value === "number"
      ? value.toLocaleString("en-PK")
      : value;

  const content = (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 hover:shadow-lg transition-all group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formattedValue}
          </p>

          <p className="text-xs text-gray-400 mt-2">{description}</p>
        </div>

        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {href && (
        <div className="flex items-center gap-1 text-sm text-blue-600 font-semibold mt-5">
          View details <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;

  return content;
}

// ==================== QUICK ACTION ====================

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
    >
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100">
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>

      <ChevronRight className="w-4 h-4 text-gray-400" />
    </Link>
  );
}

// ==================== HELPERS ====================

function formatDate(date: string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "Date unavailable";
  }

  return value.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

function getInstituteStatus(status?: string) {
  switch (status) {
    case "active":
      return {
        label: "Active",
        color: "bg-emerald-100 text-emerald-700",
        icon: CheckCircle2,
      };

    case "pending":
      return {
        label: "Pending Approval",
        color: "bg-amber-100 text-amber-700",
        icon: Clock,
      };

    case "suspended":
      return {
        label: "Suspended",
        color: "bg-red-100 text-red-700",
        icon: AlertCircle,
      };

    default:
      return {
        label: "Inactive",
        color: "bg-gray-100 text-gray-700",
        icon: AlertCircle,
      };
  }
}

// ==================== MAIN DASHBOARD ====================

export default function InstituteOwnerDashboard() {
  const router = useRouter();

  const [owner, setOwner] = useState<Owner | null>(null);
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==================== LOAD DASHBOARD ====================

  const loadDashboard = useCallback(
    async (isRefresh = false, signal?: AbortSignal) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await fetch(
          "/api/institute/users/owners/dashboard",
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            signal,
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          router.replace("/institute/login");
          return;
        }

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.toLowerCase().includes("application/json")) {
          const responseText = await response.text();

          console.error("Expected JSON but received:", {
            status: response.status,
            contentType,
            response: responseText.slice(0, 500),
          });

          throw new Error(
            `API returned HTML or invalid response. Status: ${response.status}`
          );
        }

        const result: unknown = await response.json();

        if (!response.ok) {
          const message =
            isRecord(result) && isValidString(result.message)
              ? result.message
              : "Unable to load institute dashboard.";

          throw new Error(message);
        }

        if (!isDashboardResponse(result)) {
          throw new Error(
            "Dashboard API returned an invalid response format."
          );
        }

        setOwner(result.user);
        setInstitute(result.institute);
        setStats(result.stats);
        setActivities(result.recentActivities);
        setEvents(result.upcomingEvents);
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === "AbortError"
        ) {
          return;
        }

        console.error("Institute dashboard error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading dashboard."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [router]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadDashboard(false, controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadDashboard]);

  // ==================== LOADING ====================

  if (loading) {
    return <DashboardSkeleton />;
  }

  // ==================== ERROR ====================

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />

          <h2 className="text-xl font-bold text-gray-900">
            Dashboard could not load
          </h2>

          <p className="text-sm text-gray-500 mt-2">{error}</p>

          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            disabled={refreshing}
            className="mt-6 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50"
          >
            {refreshing ? "Retrying..." : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  if (!owner) return null;

  // ==================== NO INSTITUTE ====================

  if (!institute) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white">
            <Building2 className="w-12 h-12 mb-5 text-blue-200" />

            <p className="text-sm font-semibold text-blue-100 uppercase tracking-wider">
              Institute Owner Portal
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold mt-3">
              Welcome, {owner.name.split(" ")[0]}!
            </h1>

            <p className="text-blue-100 mt-3 max-w-xl">
              Your owner account is ready. Create your institute profile to
              start managing students, teachers, classes and fee records.
            </p>

            <Link
              href="/admin/institute/users/institutes/create"
              className="inline-flex items-center gap-2 mt-7 px-6 py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition"
            >
              <Plus className="w-5 h-5" />
              Create Your Institute
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
            <h2 className="font-bold text-gray-900 text-lg">
              Your Account
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <p className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                {owner.name}
              </p>

              <p className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                {owner.email}
              </p>

              {owner.phone && (
                <p className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  {owner.phone}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== INSTITUTE STATUS ====================

  const status = getInstituteStatus(institute.status);
  const StatusIcon = status.icon;

  const attendanceRate =
    stats && stats.totalStudents > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (stats.presentToday / stats.totalStudents) * 100
            )
          )
        )
      : 0;

  const feeCollectionRate =
    stats && stats.totalFees > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (stats.collectedFees / stats.totalFees) * 100
            )
          )
        )
      : 0;

  // ==================== MAIN UI ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* WELCOME HEADER */}

        <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="absolute -right-16 -top-20 w-72 h-72 rounded-full bg-white/10" />
          <div className="absolute right-40 -bottom-32 w-64 h-64 rounded-full bg-white/5" />

          <div className="relative flex flex-wrap justify-between items-start gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <School className="w-5 h-5 text-blue-200" />

                <span className="text-xs font-bold uppercase tracking-widest text-blue-100">
                  Institute Owner Dashboard
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                {getGreeting()}, {owner.name.split(" ")[0]}!
              </h1>

              <p className="text-blue-100 mt-2">
                Welcome to your institute management portal.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-5">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 text-white text-sm">
                  <Building2 className="w-4 h-4" />
                  {institute.name}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${status.color}`}
                >
                  <StatusIcon className="w-4 h-4" />
                  {status.label}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* PENDING APPROVAL NOTICE */}

        {institute.status === "pending" && (
          <div className="flex items-start gap-3 p-5 rounded-2xl bg-amber-50 border border-amber-200">
            <Clock className="w-6 h-6 text-amber-600 flex-shrink-0" />

            <div>
              <h3 className="font-bold text-amber-900">
                Institute approval pending
              </h3>

              <p className="text-sm text-amber-800 mt-1">
                Your institute has been registered and is waiting for
                verification by the NextID administration team. Some
                management features may remain unavailable until approval.
              </p>
            </div>
          </div>
        )}

        {institute.status === "suspended" && (
          <div className="flex items-start gap-3 p-5 rounded-2xl bg-red-50 border border-red-200">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />

            <div>
              <h3 className="font-bold text-red-900">
                Institute access suspended
              </h3>

              <p className="text-sm text-red-800 mt-1">
                Please contact NextID support for information about your
                institute account.
              </p>
            </div>
          </div>
        )}

        {/* STATISTICS */}

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Institute Overview
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Your institute&apos;s current statistics
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              title="Total Students"
              value={stats?.totalStudents || 0}
              icon={GraduationCap}
              color="bg-blue-100 text-blue-600"
              description="Registered students"
              href="/admin/institute/users/students"
            />

            <StatCard
              title="Total Teachers"
              value={stats?.totalTeachers || 0}
              icon={Users}
              color="bg-purple-100 text-purple-600"
              description="Teaching staff"
              href="/admin/institute/users/teachers"
            />

            <StatCard
              title="Total Staff"
              value={stats?.totalStaff || 0}
              icon={UserRoundCheck}
              color="bg-emerald-100 text-emerald-600"
              description="Non-teaching staff"
              href="/admin/institute/users/staff"
            />

            <StatCard
              title="Total Classes"
              value={stats?.totalClasses || 0}
              icon={BookOpen}
              color="bg-amber-100 text-amber-600"
              description="Active classes"
              href="/admin/institute/users/classes"
            />
          </div>
        </div>

        {/* ATTENDANCE AND FEES */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ATTENDANCE */}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-blue-600" />
                  Today&apos;s Attendance
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Student attendance overview
                </p>
              </div>

              <Link
                href="/admin/institute/users/attendance"
                className="text-sm text-blue-600 font-semibold"
              >
                View all
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-emerald-700">
                  PRESENT
                </p>

                <p className="text-3xl font-bold text-emerald-800 mt-2">
                  {stats?.presentToday || 0}
                </p>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-red-700">
                  ABSENT
                </p>

                <p className="text-3xl font-bold text-red-800 mt-2">
                  {stats?.absentToday || 0}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-semibold text-gray-600">
                  Attendance rate
                </span>

                <span className="font-bold text-gray-900">
                  {attendanceRate}%
                </span>
              </div>

              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* FEES */}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  Fee Overview
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Fee collection summary
                </p>
              </div>

              <Link
                href="/admin/institute/users/fees"
                className="text-sm text-blue-600 font-semibold"
              >
                View all
              </Link>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">
                  Total Expected Fees
                </p>

                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats?.totalFees || 0)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-xs text-emerald-700 font-semibold">
                    COLLECTED
                  </p>

                  <p className="text-lg font-bold text-emerald-800 mt-1">
                    {formatCurrency(stats?.collectedFees || 0)}
                  </p>
                </div>

                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs text-amber-700 font-semibold">
                    PENDING
                  </p>

                  <p className="text-lg font-bold text-amber-800 mt-1">
                    {formatCurrency(stats?.pendingFees || 0)}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">
                    Collection progress
                  </span>

                  <span className="font-bold text-gray-900">
                    {feeCollectionRate}%
                  </span>
                </div>

                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${feeCollectionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LOWER SECTION */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* RECENT ACTIVITIES */}

          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Recent Activities
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Latest activities in your institute
                </p>
              </div>

              <Link
                href="/admin/institute/users/activities"
                className="text-sm font-semibold text-blue-600"
              >
                View all
              </Link>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />

                <p className="text-sm font-semibold text-gray-600">
                  No activities yet
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Institute activities will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 7).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {activity.title}
                      </p>

                      {activity.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.description}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QUICK ACTIONS */}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
              <Plus className="w-5 h-5 text-blue-600" />
              Quick Actions
            </h2>

            <div className="space-y-2">
              <QuickAction
                href="/admin/institute/users/students/create"
                icon={GraduationCap}
                title="Add Student"
                description="Register a new student"
              />

              <QuickAction
                href="/admin/institute/users/teachers/create"
                icon={Users}
                title="Add Teacher"
                description="Register a teacher"
              />

              <QuickAction
                href="/admin/institute/users/classes/create"
                icon={BookOpen}
                title="Create Class"
                description="Add a new class"
              />

              <QuickAction
                href="/admin/institute/users/attendance"
                icon={CalendarCheck}
                title="Manage Attendance"
                description="View and mark attendance"
              />

              <QuickAction
                href="/admin/institute/users/fees"
                icon={CreditCard}
                title="Manage Fees"
                description="Fee records and payments"
              />

              <QuickAction
                href="/admin/institute/users/settings"
                icon={Settings}
                title="Institute Settings"
                description="Manage institute details"
              />
            </div>
          </div>
        </div>

        {/* UPCOMING EVENTS */}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                Upcoming Events
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Important dates and institute events
              </p>
            </div>

            <Link
              href="/admin/institute/users/events"
              className="text-sm font-semibold text-blue-600"
            >
              Manage events
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <CalendarDays className="w-9 h-9 text-gray-300 mx-auto mb-2" />

              <p className="text-sm text-gray-500">
                No upcoming events scheduled.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {events.slice(0, 6).map((event) => (
                <div
                  key={event.id}
                  className="border border-gray-100 rounded-xl p-4"
                >
                  <p className="font-bold text-gray-800">
                    {event.title}
                  </p>

                  <p className="text-xs text-blue-600 font-semibold mt-2">
                    {formatDate(event.date)}
                  </p>

                  {event.description && (
                    <p className="text-xs text-gray-500 mt-2">
                      {event.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INSTITUTE INFORMATION */}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Institute Information
            </h2>

            <Link
              href="/admin/institute/users/settings"
              className="text-sm text-blue-600 font-semibold"
            >
              Edit information
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-400" />

              <div>
                <p className="text-xs text-gray-400">
                  Institute Name
                </p>

                <p className="text-sm font-semibold text-gray-800">
                  {institute.name}
                </p>
              </div>
            </div>

            {institute.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />

                <div>
                  <p className="text-xs text-gray-400">Email</p>

                  <p className="text-sm font-semibold text-gray-800">
                    {institute.email}
                  </p>
                </div>
              </div>
            )}

            {institute.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />

                <div>
                  <p className="text-xs text-gray-400">Phone</p>

                  <p className="text-sm font-semibold text-gray-800">
                    {institute.phone}
                  </p>
                </div>
              </div>
            )}

            {(institute.address || institute.city) && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />

                <div>
                  <p className="text-xs text-gray-400">Address</p>

                  <p className="text-sm font-semibold text-gray-800">
                    {[institute.address, institute.city]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}

            {institute.subdomain && (
              <div className="flex items-center gap-3">
                <School className="w-5 h-5 text-gray-400" />

                <div>
                  <p className="text-xs text-gray-400">
                    Institute Website
                  </p>

                  <p className="text-sm font-semibold text-blue-600">
                    {institute.subdomain}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}

        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} NextID Institute Management
          </p>
        </div>
      </div>
    </div>
  );
}
