// app/users/owner/institutes/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  School,
} from "lucide-react";

// ==================== TYPES ====================

interface Institute {
  id: number;
  name: string;
  slug: string | null;
  logo: string | null;
  status: "pending" | "active" | "inactive" | "suspended";
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  subdomain: string | null;
  createdAt: string;
  stats?: {
    totalStudents?: number;
    totalTeachers?: number;
    totalClasses?: number;
  };
}

// ==================== HELPERS ====================

function formatDate(date: string) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "Date unavailable";
  return value.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusConfig(status: string) {
  switch (status) {
    case "active":
      return {
        label: "Active",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
      };
    case "pending":
      return {
        label: "Pending",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: Clock,
      };
    case "suspended":
      return {
        label: "Suspended",
        color: "bg-red-100 text-red-700 border-red-200",
        icon: AlertCircle,
      };
    default:
      return {
        label: "Inactive",
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: AlertCircle,
      };
  }
}

// ==================== SKELETON ====================

function InstitutesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-gray-200 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

// ==================== INSTITUTE CARD ====================

function InstituteCard({ institute }: { institute: Institute }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = getStatusConfig(institute.status);
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden group">
      {/* Header with logo */}
      <div className="relative h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        {institute.logo ? (
          <img
            src={institute.logo}
            alt={institute.name}
            className="w-20 h-20 rounded-2xl object-cover bg-white shadow-lg"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <School className="w-10 h-10 text-white" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.color}`}
          >
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 truncate">
              {institute.name}
            </h3>
            {institute.slug && (
              <p className="text-xs text-gray-500 truncate mt-1">
                {institute.slug}
              </p>
            )}
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  <Link
                    href={`/institute/users/owner/institutes/${institute.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <Link
                    href={`/institute/users/owner/institutes/${institute.id}/edit`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      // TODO: Delete confirmation
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 space-y-2">
          {institute.city && (
            <p className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{institute.city}</span>
            </p>
          )}
          {institute.email && (
            <p className="flex items-center gap-2 text-xs text-gray-600">
              <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{institute.email}</span>
            </p>
          )}
          {institute.phone && (
            <p className="flex items-center gap-2 text-xs text-gray-600">
              <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{institute.phone}</span>
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">
              {institute.stats?.totalStudents || 0}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Students
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">
              {institute.stats?.totalTeachers || 0}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Teachers
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">
              {institute.stats?.totalClasses || 0}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Classes
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
          <span>Created {formatDate(institute.createdAt)}</span>
          <Link
            href={`/institute/users/owner/institutes/${institute.id}`}
            className="text-indigo-600 font-semibold hover:text-indigo-800"
          >
            Manage →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default function InstitutesPage() {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // ==================== FETCH DATA ====================

  const loadInstitutes = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await fetch("/api/institute/users/owners/institutes", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/institute/login";
        return;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Invalid response from server");
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load institutes");
      }

      setInstitutes(result.institutes || []);
    } catch (err) {
      console.error("Institutes load error:", err);
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadInstitutes();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadInstitutes]);

  // ==================== FILTER ====================

  const filteredInstitutes = institutes.filter((inst) => {
    const matchesSearch =
      !search ||
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.city?.toLowerCase().includes(search.toLowerCase()) ||
      inst.email?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || inst.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ==================== LOADING ====================

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <InstitutesSkeleton />
      </div>
    );
  }

  // ==================== ERROR ====================

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">
            Failed to load institutes
          </h2>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
          <button
            onClick={() => loadInstitutes()}
            className="mt-6 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==================== MAIN UI ====================

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-indigo-200" />
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">
                My Institutes
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Manage Your Institutes
            </h1>
            <p className="text-indigo-100 mt-2 text-sm">
              {institutes.length} institute{institutes.length !== 1 ? "s" : ""}{" "}
              registered
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => loadInstitutes(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <Link
              href="/institute/users/owner/institutes/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-50 transition shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Create Institute
            </Link>
          </div>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, city, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-medium"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* EMPTY STATE */}
      {filteredInstitutes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-indigo-600" />
          </div>

          <h3 className="text-lg font-bold text-gray-900">
            {search || statusFilter !== "all"
              ? "No institutes found"
              : "No institutes yet"}
          </h3>

          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            {search || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "You haven't created any institute yet. Create your first institute to start managing students, teachers, and classes."}
          </p>

          {!search && statusFilter === "all" && (
            <Link
              href="/institute/users/owner/institutes/create"
              className="inline-flex items-center gap-2 mt-6 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Create Your First Institute
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInstitutes.map((institute) => (
            <InstituteCard key={institute.id} institute={institute} />
          ))}
        </div>
      )}
    </div>
  );
}