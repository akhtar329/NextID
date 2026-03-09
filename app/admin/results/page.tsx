// app/admin/results/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import SearchInput from "@/app/component/ui/SearchInput";
import Table from "@/app/component/ui/Table";

type Result = {
  id: number;
  title: string;
  slug: string;  // ✅ Add slug
  boardId: number | null;
  universityId: number | null;
  year: number;
  resultDate: string | null;
  officialLink: string | null;
  isPopular: boolean;
  status: boolean;
  createdAt: string;
  boardName?: string;
  universityName?: string;
};

export default function ResultsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [statusLoading, setStatusLoading] = useState<number | null>(null);
  const [popularLoading, setPopularLoading] = useState<number | null>(null);

  // Filters
  const [yearFilter, setYearFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Fetch results
  const fetchResults = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/results";
      const params = new URLSearchParams();
      
      if (yearFilter) params.append("year", yearFilter);
      if (statusFilter) params.append("status", statusFilter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch results");
      const data = await res.json();
      
      // Fetch boards and universities for names
      const [boardsRes, unisRes] = await Promise.all([
        fetch("/api/admin/boards"),
        fetch("/api/admin/institutes")
      ]);
      
      const boardsData = await boardsRes.json();
      const unisData = await unisRes.json();
      
      const boardMap = new Map();
      const uniMap = new Map();
      
      if (boardsData.success) {
        boardsData.boards?.forEach((b: any) => boardMap.set(b.id, b.name));
      }
      
      if (unisData.success) {
        unisData.institutes?.forEach((u: any) => uniMap.set(u.id, u.name));
      }

      // Add names to results
      const resultsWithNames = (data.results || []).map((r: any) => ({
        ...r,
        boardName: r.boardId ? boardMap.get(r.boardId) : null,
        universityName: r.universityId ? uniMap.get(r.universityId) : null,
      }));

      setResults(resultsWithNames);
      setError(null);
    } catch (err) {
      console.error("Error fetching results:", err);
      setError("Failed to load results");
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [yearFilter, statusFilter]);

  // Delete result
  const deleteResult = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    setDeleteLoading(id);
    toast.loading("Deleting result...", { id: `delete-${id}` });

    try {
      const res = await fetch(`/api/admin/results/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete result");
      }

      if (data.success) {
        toast.success("Result deleted successfully!", { 
          id: `delete-${id}`,
          duration: 3000 
        });
        await fetchResults();
      } else {
        throw new Error(data.error || "Failed to delete result");
      }

    } catch (err) {
      console.error("Error deleting result:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete result", { 
        id: `delete-${id}` 
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  // Toggle status
  const toggleStatus = async (id: number, currentStatus: boolean, title: string) => {
    setStatusLoading(id);
    const newStatus = !currentStatus;
    const statusText = newStatus ? "active" : "inactive";
    
    toast.loading(`Changing status to ${statusText}...`, { id: `status-${id}` });

    try {
      const res = await fetch(`/api/admin/results/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      if (data.success) {
        toast.success(`"${title}" is now ${statusText}`, { 
          id: `status-${id}`,
          duration: 2000 
        });
        await fetchResults();
      } else {
        throw new Error(data.error || "Failed to update status");
      }

    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update status", { 
        id: `status-${id}` 
      });
    } finally {
      setStatusLoading(null);
    }
  };

  // Toggle popular
  const togglePopular = async (id: number, currentPopular: boolean, title: string) => {
    setPopularLoading(id);
    const newPopular = !currentPopular;
    const popularText = newPopular ? "popular" : "not popular";
    
    toast.loading(`Marking as ${popularText}...`, { id: `popular-${id}` });

    try {
      const res = await fetch(`/api/admin/results/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPopular: newPopular }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update popular status");
      }

      if (data.success) {
        toast.success(`"${title}" is now ${popularText}!`, { 
          id: `popular-${id}`,
          duration: 2000 
        });
        await fetchResults();
      } else {
        throw new Error(data.error || "Failed to update popular status");
      }

    } catch (err) {
      console.error("Error updating popular:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update popular status", { 
        id: `popular-${id}` 
      });
    } finally {
      setPopularLoading(null);
    }
  };

  // Filter by search
  const filteredResults = results.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.year.toString().includes(search) ||
    r.slug?.toLowerCase().includes(search.toLowerCase()) ||  // ✅ Add slug search
    (r.boardName && r.boardName.toLowerCase().includes(search.toLowerCase())) ||
    (r.universityName && r.universityName.toLowerCase().includes(search.toLowerCase()))
  );

  // Get unique years
  const years = [...new Set(results.map(r => r.year))].sort((a, b) => b - a);

  // Stats
  const totalResults = results.length;
  const popularResults = results.filter(r => r.isPopular).length;
  const activeResults = results.filter(r => r.status).length;
  const inactiveResults = results.filter(r => !r.status).length;

  const columns: {
    header: string;
    accessor: keyof Result;
    render?: (value: any, row: Result) => React.ReactNode;
  }[] = [
    {
      header: "Title",
      accessor: "title",
      render: (value: string, row: Result) => (
        <div>
          <button
            onClick={() => router.push(`/admin/results/${row.id}`)}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
          >
            {value}
          </button>
          {/* ✅ Show slug below title */}
          <div className="text-xs text-gray-400 font-mono mt-1">
            /results/{row.slug}
          </div>
        </div>
      )
    },
    {
      header: "Board/University",
      accessor: "boardName",
      render: (_: any, row: Result) => (
        <div className="text-sm">
          {row.boardName && <div>Board: {row.boardName}</div>}
          {row.universityName && <div>University: {row.universityName}</div>}
          {!row.boardName && !row.universityName && <span className="text-gray-400">—</span>}
        </div>
      )
    },
    {
      header: "Year",
      accessor: "year",
      render: (value: number) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      header: "Result Date",
      accessor: "resultDate",
      render: (value: string | null) => (
        <span className="text-sm text-gray-600">
          {value ? new Date(value).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: "Popular",
      accessor: "isPopular",
      render: (value: boolean, row: Result) => (
        <button
          onClick={() => togglePopular(row.id, value, row.title)}
          disabled={popularLoading === row.id}
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium transition-all min-w-[100px]
            ${value 
              ? "bg-purple-100 text-purple-700 hover:bg-purple-200 ring-1 ring-purple-300" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 ring-1 ring-gray-300"
            }
            ${popularLoading === row.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {popularLoading === row.id ? (
            <span className="flex items-center justify-center gap-1">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              {value ? "⭐ Popular" : "☆ Not Popular"}
            </span>
          )}
        </button>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (value: boolean, row: Result) => (
        <button
          onClick={() => toggleStatus(row.id, value, row.title)}
          disabled={statusLoading === row.id}
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium transition-all min-w-[80px]
            ${value 
              ? "bg-green-100 text-green-700 hover:bg-green-200 ring-1 ring-green-300" 
              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 ring-1 ring-yellow-300"
            }
            ${statusLoading === row.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {statusLoading === row.id ? (
            <span className="flex items-center justify-center gap-1">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              <span className={`w-2 h-2 rounded-full ${value ? "bg-green-500" : "bg-yellow-500"}`}></span>
              {value ? "Active" : "Inactive"}
            </span>
          )}
        </button>
      )
    },
    {
      header: "Created At",
      accessor: "createdAt",
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
    {
      header: "Actions",
      accessor: "id",
      render: (_: number, row: Result) => (
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/results/${row.id}/edit`)}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors ring-1 ring-blue-200"
          >
            Edit
          </button>
          <button
            onClick={() => deleteResult(row.id, row.title)}
            disabled={deleteLoading === row.id}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-full transition-colors ring-1
              ${deleteLoading === row.id
                ? "bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed"
                : "bg-red-50 text-red-600 hover:bg-red-100 ring-red-200"
              }
            `}
          >
            {deleteLoading === row.id ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>...</span>
              </span>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      )
    },
  ];

  if (loading && results.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading results...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Results</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage examination results with SEO-friendly URLs
          </p>
        </div>
        <PrimaryButton onClick={() => router.push("/admin/results/create")}>
          + Add New Result
        </PrimaryButton>
      </div>

      {/* Stats Cards */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Total Results</div>
            <div className="text-2xl font-semibold mt-1">{totalResults}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Popular</div>
            <div className="text-2xl font-semibold mt-1 text-purple-600">{popularResults}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Active</div>
            <div className="text-2xl font-semibold mt-1 text-green-600">{activeResults}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Inactive</div>
            <div className="text-2xl font-semibold mt-1 text-yellow-600">{inactiveResults}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by title, slug, board, university or year..."
          />
        </div>
        
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Years</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Table */}
      {filteredResults.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-gray-500">
            {search || yearFilter || statusFilter 
              ? "No results match your filters" 
              : "No results found. Create your first result!"}
          </div>
          {!search && !yearFilter && !statusFilter && (
            <button
              onClick={() => router.push("/admin/results/create")}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add your first result
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table columns={columns} data={filteredResults} />
          
          {/* Summary */}
          <div className="p-4 border-t text-sm text-gray-500">
            Showing {filteredResults.length} of {results.length} results
          </div>
        </div>
      )}
    </div>
  );
}