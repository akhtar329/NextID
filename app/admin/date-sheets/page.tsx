// app/admin/date-sheets/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, Pencil, Trash2, Loader2, Search, 
  Eye, FileText, CheckCircle, XCircle,
  Filter, ChevronLeft, ChevronRight,
  TrendingUp, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface DateSheet {
  id: number;
  title: string;
  slug: string;
  examType: string;
  examDate: string;
  year: number;
  boardId: number | null;
  instituteId: number | null;
  status: boolean;
  viewCount: number;
  isPopular: boolean;
  officialLink: string;
  downloadLink: string;
  createdAt: string;
  board?: { name: string; slug: string };
  institute?: { name: string; slug: string };
}

export default function DateSheetsPage() {
  const [dateSheets, setDateSheets] = useState<DateSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPopular, setFilterPopular] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSheets, setSelectedSheets] = useState<number[]>([]);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDateSheets();
  }, []);

  const fetchDateSheets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/date-sheets");
      const data = await res.json();

      if (Array.isArray(data)) {
        setDateSheets(data);
      } else if (Array.isArray(data?.data)) {
        setDateSheets(data.data);
      } else if (Array.isArray(data?.dateSheets)) {
        setDateSheets(data.dateSheets);
      } else {
        setDateSheets([]);
      }
    } catch (error) {
      console.error("Error fetching date sheets:", error);
      toast.error("Failed to load date sheets");
      setDateSheets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this date sheet?")) return;

    try {
      const res = await fetch(`/api/admin/date-sheets/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Date sheet deleted successfully");
        fetchDateSheets();
      } else {
        toast.error("Failed to delete date sheet");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  // ✅ Status Toggle
  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/date-sheets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: !currentStatus }),
      });

      if (res.ok) {
        toast.success(`Date sheet ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchDateSheets();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  // ✅ Popular Toggle
  const togglePopular = async (id: number, currentPopular: boolean) => {
    try {
      const res = await fetch(`/api/admin/date-sheets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPopular: !currentPopular }),
      });

      if (res.ok) {
        toast.success(`Date sheet ${!currentPopular ? 'marked as popular' : 'removed from popular'}`);
        fetchDateSheets();
      } else {
        toast.error("Failed to update popular status");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSheets.length === 0) {
      toast.error("No items selected");
      return;
    }

    if (!confirm(`Delete ${selectedSheets.length} date sheet(s)?`)) return;

    try {
      await Promise.all(
        selectedSheets.map(id =>
          fetch(`/api/admin/date-sheets/${id}`, { method: "DELETE" })
        )
      );
      toast.success(`${selectedSheets.length} date sheet(s) deleted`);
      setSelectedSheets([]);
      fetchDateSheets();
    } catch (error) {
      toast.error("Failed to delete selected items");
    }
  };

  const handleSelectAll = () => {
    if (selectedSheets.length === filteredSheets.length) {
      setSelectedSheets([]);
    } else {
      setSelectedSheets(filteredSheets.map(s => s.id));
    }
  };

  const handleSelectSheet = (id: number) => {
    setSelectedSheets(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Filters
  const filteredSheets = dateSheets.filter(sheet => {
    const matchesSearch = sheet.title.toLowerCase().includes(search.toLowerCase()) ||
                          sheet.examType?.toLowerCase().includes(search.toLowerCase());
    const matchesYear = filterYear === "all" || sheet.year.toString() === filterYear;
    const matchesStatus = filterStatus === "all" || 
                          (filterStatus === "active" && sheet.status) ||
                          (filterStatus === "inactive" && !sheet.status);
    const matchesPopular = filterPopular === "all" ||
                          (filterPopular === "popular" && sheet.isPopular) ||
                          (filterPopular === "normal" && !sheet.isPopular);
    
    return matchesSearch && matchesYear && matchesStatus && matchesPopular;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSheets.length / itemsPerPage);
  const paginatedSheets = filteredSheets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Available years for filter
  const availableYears = [...new Set(dateSheets.map(s => s.year))].sort((a, b) => b - a);

  // Stats
  const stats = {
    total: dateSheets.length,
    active: dateSheets.filter(s => s.status).length,
    inactive: dateSheets.filter(s => !s.status).length,
    popular: dateSheets.filter(s => s.isPopular).length,
    totalViews: dateSheets.reduce((sum, s) => sum + (s.viewCount || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Loading date sheets...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Date Sheets</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage examination date sheets</p>
          </div>
          <Link
            href="/admin/date-sheets/create"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg shadow-blue-500/25"
          >
            <Plus className="h-4 w-4" />
            Add Date Sheet
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Sheets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Popular</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.popular}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalViews.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by title or exam type..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Year Filter */}
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="all">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Popular Filter */}
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              value={filterPopular}
              onChange={(e) => setFilterPopular(e.target.value)}
            >
              <option value="all">All</option>
              <option value="popular">Popular</option>
              <option value="normal">Normal</option>
            </select>

            {/* Bulk Actions */}
            {selectedSheets.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selectedSheets.length})
              </button>
            )}

            {/* Reset Filters */}
            {(search || filterYear !== "all" || filterStatus !== "all" || filterPopular !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterYear("all");
                  setFilterStatus("all");
                  setFilterPopular("all");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="w-12 p-4">
                  <input
                    type="checkbox"
                    checked={selectedSheets.length === filteredSheets.length && filteredSheets.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">Title</th>
                <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">Exam Type</th>
                <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">Year</th>
                <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-400">Board/Institute</th>
                <th className="text-center p-4 font-semibold text-gray-600 dark:text-gray-400">Views</th>
                <th className="text-center p-4 font-semibold text-gray-600 dark:text-gray-400">Popular</th>
                <th className="text-center p-4 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-center p-4 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedSheets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-12 text-gray-500 dark:text-gray-400">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    No date sheets found
                  </td>
                </tr>
              ) : (
                paginatedSheets.map((sheet) => (
                  <tr key={sheet.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedSheets.includes(sheet.id)}
                        onChange={() => handleSelectSheet(sheet.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <Link href={`/admin/date-sheets/${sheet.id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                          {sheet.title}
                        </Link>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {sheet.slug}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs">
                        {sheet.examType || "Annual"}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{sheet.year}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      {sheet.board?.name || sheet.institute?.name || "-"}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye size={14} className="text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{sheet.viewCount || 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => togglePopular(sheet.id, sheet.isPopular)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                          sheet.isPopular
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        {sheet.isPopular ? "Popular" : "Normal"}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleStatus(sheet.id, sheet.status)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                          sheet.status
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {sheet.status ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/date-sheets/${sheet.id}/edit`}
                          className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(sheet.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                        {sheet.officialLink && (
                          <a
                            href={sheet.officialLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-500 hover:text-purple-600 transition-colors"
                            title="View"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSheets.length)} of {filteredSheets.length} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? "bg-blue-500 text-white"
                        : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
