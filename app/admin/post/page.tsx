// app/admin/post/page.tsx

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Plus, RefreshCw, Trash2, Edit, Eye, Search, X,
  ChevronLeft, ChevronRight, ChevronDown, AlertCircle,
  CheckCircle, ArrowUpDown, Filter, Archive, Send,
  Download, FileText, TrendingUp, Package, Layers,
  Calendar, MoreHorizontal
} from "lucide-react";

// ==================== HELPERS ====================
const getUrlFolder = (type: string): string => {
  const map: Record<string, string> = {
    scholarship: "scholarships", admission: "admissions", result: "results",
    job: "jobs", date_sheet: "date-sheets", news: "news", blog: "blog",
  };
  return map[type] || type;
};

const CACHE_GROUPS = [
  { id: "all", name: "All Cache", description: "Clear entire website cache", icon: "🗑️", tags: ["homepage","posts","posts-type-admission","posts-type-result","posts-type-news","posts-type-date_sheet","posts-type-scholarship","posts-type-job","posts-type-blog","posts-featured","posts-popular","posts-recent"], paths: ["/","/news","/admissions","/results","/jobs","/scholarships","/date-sheets"] },
  { id: "admissions", name: "Admissions", description: "Clear admissions cache", icon: "🎓", tags: ["posts-type-admission","posts-featured","homepage"], paths: ["/","/admissions"] },
  { id: "results", name: "Results", description: "Clear results cache", icon: "📊", tags: ["posts-type-result","posts-featured","homepage"], paths: ["/","/results"] },
  { id: "news", name: "News", description: "Clear news cache", icon: "📰", tags: ["posts-type-news","posts-featured","homepage"], paths: ["/","/news"] },
  { id: "date-sheets", name: "Date Sheets", description: "Clear date sheets cache", icon: "📅", tags: ["posts-type-date_sheet","homepage"], paths: ["/","/date-sheets"] },
  { id: "scholarships", name: "Scholarships", description: "Clear scholarships cache", icon: "💰", tags: ["posts-type-scholarship","posts-featured","homepage"], paths: ["/","/scholarships"] },
  { id: "jobs", name: "Jobs", description: "Clear jobs cache", icon: "💼", tags: ["posts-type-job","posts-featured","homepage"], paths: ["/","/jobs"] },
  { id: "homepage", name: "Homepage Only", description: "Clear homepage cache", icon: "🏠", tags: ["homepage"], paths: ["/"] },
];

// ==================== TYPES ====================
interface Post {
  id: number; slug: string; type: string; title: string;
  status: string | null; isFeatured: boolean | null;
  isPopular: boolean | null; isBreaking: boolean | null;
  publishedAt: string | null; createdAt: string | null; expiresAt: string | null;
}
type SortField = "title" | "createdAt" | "status" | "type";
type SortOrder = "asc" | "desc";

// ==================== CONFIRM MODAL ====================
const ConfirmModal = ({ isOpen, title, description, confirmText, confirmColor, icon, onConfirm, onCancel, loading }: {
  isOpen: boolean; title: string; description: string; confirmText: string;
  confirmColor: "red" | "blue" | "green" | "gray"; icon: React.ReactNode;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) => {
  if (!isOpen) return null;
  const colors = {
    red: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-500/30",
    blue: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/30",
    green: "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-green-500/30",
    gray: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 shadow-gray-500/30",
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>
        <div className="bg-gray-50/80 px-6 py-4 flex gap-3">
          <button onClick={onCancel} disabled={loading} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-white transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg ${colors[confirmColor]}`}>
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : icon}
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== SKELETON ====================
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-5"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
    <td className="px-6 py-5">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </td>
    <td className="px-6 py-5"><div className="h-7 bg-gray-200 rounded-full w-24" /></td>
    <td className="px-6 py-5"><div className="h-7 bg-gray-200 rounded-full w-28" /></td>
    <td className="px-6 py-5"><div className="h-4 bg-gray-200 rounded w-20" /></td>
    <td className="px-6 py-5"><div className="h-9 bg-gray-100 rounded-lg w-28 ml-auto" /></td>
  </tr>
);

// ==================== STAT CARD ====================
const StatCard = ({ icon, label, value, gradient, iconBg }: { icon: React.ReactNode; label: string; value: number; gradient: string; iconBg: string }) => (
  <div className={`relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-xl transition-all duration-300 group`}>
    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -mr-8 -mt-8 ${gradient}`} />
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
        <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================
export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingCache, setClearingCache] = useState(false);
  const [clearDropdownOpen, setClearDropdownOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);
  const [openStatusMenu, setOpenStatusMenu] = useState<number | null>(null);

  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null; title: string; count: number }>({
    isOpen: false, id: null, title: "", count: 0,
  });
  const [bulkAction, setBulkAction] = useState<{ type: "delete" | "publish" | "archive" | null }>({ type: null });
  const [processing, setProcessing] = useState(false);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenStatusMenu(null); setClearDropdownOpen(false);
        setDeleteModal({ isOpen: false, id: null, title: "", count: 0 });
        setBulkAction({ type: null });
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append("type", filterType);
      if (filterStatus) params.append("status", filterStatus);
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("limit", limit.toString());
      params.append("offset", ((page - 1) * limit).toString());
      params.append("sort", sortField);
      params.append("order", sortOrder);

      const res = await fetch(`/api/admin/post?${params}`);
      const data = await res.json();
      if (data.success) { setPosts(data.posts); setTotal(data.total); }
      else showMessage("error", "Failed to fetch posts");
    } catch { showMessage("error", "Error fetching posts"); }
    finally { setLoading(false); }
  }, [filterType, filterStatus, debouncedSearch, page, limit, sortField, sortOrder]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const clearCache = async (cacheGroup: typeof CACHE_GROUPS[0], silent = false) => {
    if (!silent) { setClearingCache(true); setClearDropdownOpen(false); }
    try {
      const res = await fetch("/api/admin/cache/clear", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: cacheGroup.tags, paths: cacheGroup.paths, groupId: cacheGroup.id, groupName: cacheGroup.name }),
      });
      let data; try { data = await res.json(); } catch {
        if (!silent) showMessage("success", `✅ ${cacheGroup.name} cache cleared!`);
        return;
      }
      if (!silent) {
        if (data?.success) showMessage("success", `✅ ${cacheGroup.name} cache cleared!`);
        else showMessage("error", data?.error || "Failed to clear cache");
      }
    } catch { if (!silent) showMessage("error", "Error clearing cache"); }
    finally { if (!silent) setClearingCache(false); }
  };

  const handleStatusChange = async (postId: number, newStatus: string) => {
    setStatusUpdating(postId); setOpenStatusMenu(null);
    try {
      const payload: Record<string, unknown> = { status: newStatus };
      if (newStatus === "archived") payload.expiresAt = null;
      const res = await fetch(`/api/admin/post/${postId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: newStatus, ...(newStatus === "archived" ? { expiresAt: null } : {}) } : p));
        showMessage("success", `✅ Status → ${newStatus}`);
        await clearCache(CACHE_GROUPS[0], true);
      } else showMessage("error", data.error || "Failed");
    } catch { showMessage("error", "Something went wrong"); }
    finally { setStatusUpdating(null); }
  };

  const openDeleteModal = (post: Post) => setDeleteModal({ isOpen: true, id: post.id, title: post.title, count: 1 });
  const openBulkDeleteModal = () => setDeleteModal({ isOpen: true, id: null, title: "", count: selectedIds.length });
  const closeDeleteModal = () => setDeleteModal({ isOpen: false, id: null, title: "", count: 0 });

  const handleConfirmDelete = async () => {
    setProcessing(true);
    try {
      if (deleteModal.id) {
        const res = await fetch(`/api/admin/post/${deleteModal.id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          setSelectedIds(prev => prev.filter(pid => pid !== deleteModal.id));
          await fetchPosts(); await clearCache(CACHE_GROUPS[0], true);
          showMessage("success", `✅ Deleted`);
        } else showMessage("error", data.error || "Failed");
      } else {
        let success = 0, fail = 0;
        for (const id of selectedIds) {
          const res = await fetch(`/api/admin/post/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) success++; else fail++;
        }
        setSelectedIds([]); await fetchPosts(); await clearCache(CACHE_GROUPS[0], true);
        if (fail === 0) showMessage("success", `✅ ${success} deleted`);
        else showMessage("error", `⚠️ ${success} ok, ${fail} failed`);
      }
      closeDeleteModal();
    } catch { showMessage("error", "Something went wrong"); }
    finally { setProcessing(false); }
  };

  const handleBulkConfirm = async () => {
    if (!bulkAction.type) return;
    setProcessing(true); let success = 0, fail = 0;
    try {
      for (const id of selectedIds) {
        const res = await fetch(`/api/admin/post/${id}`, {
          method: bulkAction.type === "delete" ? "DELETE" : "PATCH",
          headers: bulkAction.type !== "delete" ? { "Content-Type": "application/json" } : {},
          body: bulkAction.type !== "delete" ? JSON.stringify({ status: bulkAction.type === "publish" ? "published" : "archived", ...(bulkAction.type === "archive" ? { expiresAt: null } : {}) }) : undefined,
        });
        const data = await res.json();
        if (data.success) success++; else fail++;
      }
      setSelectedIds([]); await fetchPosts(); await clearCache(CACHE_GROUPS[0], true);
      if (fail === 0) showMessage("success", `✅ ${success} updated`);
      else showMessage("error", `⚠️ ${success} ok, ${fail} failed`);
      setBulkAction({ type: null });
    } catch { showMessage("error", "Failed"); }
    finally { setProcessing(false); }
  };

  const handleExport = () => {
    const data = posts.map(p => ({ id: p.id, title: p.title, slug: p.slug, type: p.type, status: p.status }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `posts-${new Date().toISOString().split("T")[0]}.json`; a.click();
    URL.revokeObjectURL(url); showMessage("success", "✅ Exported");
  };

  const handleSelectAll = (checked: boolean) => setSelectedIds(checked ? posts.map(p => p.id) : []);
  const toggleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("asc"); }
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { color: string; icon: string; label: string }> = {
      admission: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: "🎓", label: "Admission" },
      result: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "📊", label: "Result" },
      news: { color: "bg-red-100 text-red-700 border-red-200", icon: "📰", label: "News" },
      date_sheet: { color: "bg-orange-100 text-orange-700 border-orange-200", icon: "📅", label: "Date Sheet" },
      scholarship: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: "💰", label: "Scholarship" },
      job: { color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: "💼", label: "Job" },
      blog: { color: "bg-purple-100 text-purple-700 border-purple-200", icon: "✍️", label: "Blog" },
    };
    return config[type] || { color: "bg-gray-100 text-gray-700 border-gray-200", icon: "📄", label: type };
  };

  const getStatusBadge = (status: string | null, expiresAt: string | null) => {
    if (status === "archived") return { color: "bg-gray-100 text-gray-600 border-gray-300", icon: "📦", label: "Archived" };
    if (expiresAt && new Date(expiresAt) < new Date()) return { color: "bg-red-100 text-red-700 border-red-300", icon: "⚠️", label: "Expired" };
    if (status === "published") return { color: "bg-emerald-100 text-emerald-700 border-emerald-300", icon: "✅", label: "Published" };
    if (status === "draft") return { color: "bg-amber-100 text-amber-700 border-amber-300", icon: "📝", label: "Draft" };
    return { color: "bg-gray-100 text-gray-600 border-gray-300", icon: "❓", label: "Unknown" };
  };

  const formatRelativeDate = (date: string | null) => {
    if (!date) return "-";
    const d = new Date(date); const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000); const hours = Math.floor(diff / 3600000); const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now"; if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`; if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const isPostExpired = (expiresAt: string | null): boolean => expiresAt ? new Date(expiresAt) < new Date() : false;

  const stats = useMemo(() => ({
    total,
    published: posts.filter(p => p.status === "published").length,
    draft: posts.filter(p => p.status === "draft").length,
    expired: posts.filter(p => isPostExpired(p.expiresAt) && p.status !== "archived").length,
  }), [posts, total]);

  const totalPages = Math.ceil(total / limit);
  const hasFilters = filterType || filterStatus || search;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Toast */}
      {message && (
        <div className={`fixed top-24 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 ${message.type === "success" ? "bg-emerald-600/95 text-white" : "bg-red-600/95 text-white"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === "success" ? "bg-white/20" : "bg-white/20"}`}>
            {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{message.text}</p>
          </div>
          <button onClick={() => setMessage(null)} className="p-1 hover:bg-white/20 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      <ConfirmModal isOpen={deleteModal.isOpen} title={`Delete ${deleteModal.count > 1 ? `${deleteModal.count} Posts` : "Post"}?`}
        description={deleteModal.count > 1 ? `You're about to delete ${deleteModal.count} posts. This cannot be undone.` : `You're about to delete "${deleteModal.title}". This cannot be undone.`}
        confirmText="Delete" confirmColor="red" icon={<Trash2 className="w-9 h-9 text-red-600" />}
        onConfirm={handleConfirmDelete} onCancel={closeDeleteModal} loading={processing} />

      <ConfirmModal isOpen={bulkAction.type !== null}
        title={bulkAction.type === "delete" ? `Delete ${selectedIds.length} Posts?` : bulkAction.type === "publish" ? `Publish ${selectedIds.length} Posts?` : `Archive ${selectedIds.length} Posts?`}
        description={bulkAction.type === "delete" ? "This action cannot be undone." : `Status will be changed to ${bulkAction.type}.`}
        confirmText={bulkAction.type === "delete" ? "Delete" : bulkAction.type === "publish" ? "Publish" : "Archive"}
        confirmColor={bulkAction.type === "delete" ? "red" : bulkAction.type === "publish" ? "green" : "gray"}
        icon={bulkAction.type === "delete" ? <Trash2 className="w-9 h-9 text-red-600" /> : bulkAction.type === "publish" ? <Send className="w-9 h-9 text-green-600" /> : <Archive className="w-9 h-9 text-gray-600" />}
        onConfirm={handleBulkConfirm} onCancel={() => setBulkAction({ type: null })} loading={processing} />

      <div className="max-w-[1600px] mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Posts</h1>
              </div>
              <p className="text-sm text-gray-500 ml-14">Create, edit, and manage all content across the platform</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Cache Dropdown */}
              <div className="relative">
                <button onClick={() => setClearDropdownOpen(!clearDropdownOpen)} disabled={clearingCache}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-700 flex items-center gap-2 disabled:opacity-50 text-sm font-semibold shadow-sm">
                  {clearingCache ? <><RefreshCw className="w-4 h-4 animate-spin" /> Clearing...</> : <><Trash2 className="w-4 h-4 text-orange-500" /> Cache <ChevronDown className="w-3.5 h-3.5 text-gray-400" /></>}
                </button>
                {clearDropdownOpen && !clearingCache && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setClearDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
                        <p className="text-xs font-semibold text-orange-800">Select cache type</p>
                      </div>
                      <div className="max-h-96 overflow-y-auto p-1">
                        {CACHE_GROUPS.map(group => (
                          <button key={group.id} onClick={() => clearCache(group)}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-xl transition flex items-center gap-3">
                            <div className="text-xl w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">{group.icon}</div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 text-sm">{group.name}</div>
                              <div className="text-xs text-gray-500">{group.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button onClick={() => fetchPosts()} disabled={loading}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-700 flex items-center gap-2 disabled:opacity-50 text-sm font-semibold shadow-sm">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>

              <button onClick={handleExport}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-700 flex items-center gap-2 text-sm font-semibold shadow-sm">
                <Download className="w-4 h-4" /> Export
              </button>

              <Link href="/admin/post/create"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 text-sm font-semibold shadow-lg shadow-blue-500/30">
                <Plus className="w-4 h-4" /> Create Post
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard icon={<FileText className="w-6 h-6 text-blue-600" />} label="Total Posts" value={stats.total} gradient="bg-blue-500" iconBg="bg-blue-100" />
          <StatCard icon={<CheckCircle className="w-6 h-6 text-emerald-600" />} label="Published" value={stats.published} gradient="bg-emerald-500" iconBg="bg-emerald-100" />
          <StatCard icon={<Edit className="w-6 h-6 text-amber-600" />} label="Drafts" value={stats.draft} gradient="bg-amber-500" iconBg="bg-amber-100" />
          <StatCard icon={<AlertCircle className="w-6 h-6 text-red-600" />} label="Expired" value={stats.expired} gradient="bg-red-500" iconBg="bg-red-100" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Filter className="w-4 h-4 text-gray-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-700">Filters</h2>
            {hasFilters && <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">Active</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Post Type</label>
              <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition">
                <option value="">All Types</option>
                <option value="admission">Admissions</option>
                <option value="result">Results</option>
                <option value="news">News</option>
                <option value="date_sheet">Date Sheets</option>
                <option value="scholarship">Scholarships</option>
                <option value="job">Jobs</option>
                <option value="blog">Blogs</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Status</label>
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition">
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                  className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition" />
                {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"><X className="w-4 h-4" /></button>}
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Per Page</label>
                <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition">
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              {hasFilters && (
                <button onClick={() => { setFilterType(""); setFilterStatus(""); setSearch(""); setPage(1); }}
                  className="px-3 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition text-sm font-semibold border border-red-200" title="Clear filters">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6 flex items-center justify-between border border-blue-200 flex-wrap gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900">{selectedIds.length} post(s) selected</p>
                <p className="text-xs text-blue-600">Choose an action below</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setBulkAction({ type: "publish" })} disabled={processing}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-emerald-500/20">
                <Send className="w-4 h-4" /> Publish
              </button>
              <button onClick={() => setBulkAction({ type: "archive" })} disabled={processing}
                className="px-4 py-2 bg-gray-600 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-gray-500/20">
                <Archive className="w-4 h-4" /> Archive
              </button>
              <button onClick={openBulkDeleteModal} disabled={processing}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-red-500/20">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button onClick={() => setSelectedIds([])}
                className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-14 px-6 py-4">
                    <input type="checkbox" checked={selectedIds.length === posts.length && posts.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button onClick={() => handleSort("title")} className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:text-blue-600 transition ${sortField === "title" ? "text-blue-600" : "text-gray-600"}`}>
                      Title <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button onClick={() => handleSort("type")} className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:text-blue-600 transition ${sortField === "type" ? "text-blue-600" : "text-gray-600"}`}>
                      Type <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button onClick={() => handleSort("status")} className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:text-blue-600 transition ${sortField === "status" ? "text-blue-600" : "text-gray-600"}`}>
                      Status <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button onClick={() => handleSort("createdAt")} className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:text-blue-600 transition ${sortField === "createdAt" ? "text-blue-600" : "text-gray-600"}`}>
                      Created <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) :
                  posts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="max-w-sm mx-auto">
                          <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                            <Package className="w-12 h-12 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">No posts found</h3>
                          <p className="text-sm text-gray-500 mb-6">{hasFilters ? "No posts match your filters." : "Get started by creating your first post."}</p>
                          {hasFilters ? (
                            <button onClick={() => { setFilterType(""); setFilterStatus(""); setSearch(""); }}
                              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm font-semibold">
                              Clear Filters
                            </button>
                          ) : (
                            <Link href="/admin/post/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition text-sm font-semibold shadow-lg shadow-blue-500/30">
                              <Plus className="w-4 h-4" /> Create First Post
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : posts.map((post) => {
                    const typeConfig = getTypeBadge(post.type);
                    const statusConfig = getStatusBadge(post.status, post.expiresAt);
                    const isExpired = isPostExpired(post.expiresAt) && post.status !== "archived";

                    return (
                      <tr key={post.id} className={`hover:bg-blue-50/30 transition-colors group ${selectedIds.includes(post.id) ? "bg-blue-50/60" : ""}`}>
                        <td className="px-6 py-4">
                          <input type="checkbox" checked={selectedIds.includes(post.id)} onChange={() => toggleSelect(post.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <Link href={`/admin/post/${post.id}/edit`} className={`font-semibold hover:text-blue-600 transition line-clamp-1 ${isExpired ? "text-red-600" : "text-gray-900"}`}>
                              {post.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">/{getUrlFolder(post.type)}/{post.slug}</code>
                              {isExpired && <span className="text-xs text-red-500 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> Expired</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${typeConfig.color}`}>
                            <span>{typeConfig.icon}</span> {typeConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <button onClick={() => setOpenStatusMenu(openStatusMenu === post.id ? null : post.id)} disabled={statusUpdating === post.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:ring-2 hover:ring-blue-400 border ${statusConfig.color} ${statusUpdating === post.id ? "opacity-60" : ""}`}>
                              {statusUpdating === post.id ? <><RefreshCw className="w-3 h-3 animate-spin" /> Updating...</> :
                                <><span>{statusConfig.icon}</span> {statusConfig.label} <ChevronDown className="w-3 h-3 ml-0.5" /></>}
                            </button>
                            {openStatusMenu === post.id && statusUpdating !== post.id && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setOpenStatusMenu(null)} />
                                <div className="absolute left-0 mt-2 w-44 bg-white rounded-xl shadow-2xl border border-gray-200 z-40 overflow-hidden p-1">
                                  {[
                                    { value: "published", label: "Published", icon: "✅", color: "text-emerald-600" },
                                    { value: "draft", label: "Draft", icon: "📝", color: "text-amber-600" },
                                    { value: "archived", label: "Archived", icon: "📦", color: "text-gray-600" },
                                  ].map(opt => (
                                    <button key={opt.value} onClick={() => handleStatusChange(post.id, opt.value)} disabled={post.status === opt.value}
                                      className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition flex items-center gap-2 ${post.status === opt.value ? "bg-gray-50 font-semibold cursor-not-allowed opacity-50" : ""}`}>
                                      <span>{opt.icon}</span>
                                      <span className={opt.color}>{opt.label}</span>
                                      {post.status === opt.value && <CheckCircle className="w-3.5 h-3.5 ml-auto text-blue-600" />}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-medium" title={post.createdAt || ""}>
                          {formatRelativeDate(post.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition">
                            <Link href={`/admin/post/${post.id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                              <Edit className="w-4 h-4" />
                            </Link>
                            <Link href={`/${getUrlFolder(post.type)}/${post.slug}`} target="_blank" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="View">
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button onClick={() => openDeleteModal(post)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-8 flex-wrap gap-4">
            <div className="text-sm text-gray-500">
              Showing <strong className="text-gray-900">{(page - 1) * limit + 1}</strong> to <strong className="text-gray-900">{Math.min(page * limit, total)}</strong> of <strong className="text-gray-900">{total}</strong> posts
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition text-sm font-semibold text-gray-700 shadow-sm">
                First
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition flex items-center gap-1 text-sm font-semibold text-gray-700 shadow-sm">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30">
                {page} / {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition flex items-center gap-1 text-sm font-semibold text-gray-700 shadow-sm">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition text-sm font-semibold text-gray-700 shadow-sm">
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}