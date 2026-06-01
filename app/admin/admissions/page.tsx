// app/admin/admissions/page.tsx - FULLY FIXED

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PrimaryButton from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";

// ============================================================
// TYPES
// ============================================================
type Program = {
  id: number;
  name: string;
  slug: string;
};

type Institute = {
  id: number;
  name: string;
  cityName: string;
  slug: string;
};

type Admission = {
  id: number;
  name: string;
  slug: string;
  year: number;
  session: string | null;
  status: "Expected" | "Open" | "Closed";
  expectedOpenDate: string | null;
  expectedCloseDate: string | null;
  meritInfo: string | null;
  note: string | null;
  officialLink: string | null;
  programs: Program[];
  institute: Institute;
};

type TableRow = {
  id: number;
  name: string;
  programNames: string;
  programCount: number;
  instituteName: string;
  instituteId: number;
  session: string;
  year: number;  // ✅ Added year field
  closingDate: string | null;
  daysLeft: number | null;
  isExpired: boolean;
  status: string;
  needsAttention: boolean;
  autoStatus: string;
  isManuallyClosedButFuture: boolean;
  rawCloseDate: string | null;
};

// ============================================================
// HELPER FUNCTION: Highlight Text
// ============================================================
const HighlightText = ({ text, searchTerm, isDarkMode }: { text: string; searchTerm: string; isDarkMode: boolean }) => {
  if (!searchTerm || !text) {
    return <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{text || '—'}</span>;
  }
  
  const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedSearch})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className={`${isDarkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-200 text-yellow-900'} rounded px-0.5 font-semibold`}>
            {part}
          </mark>
        ) : (
          <span key={i} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{part}</span>
        )
      )}
    </span>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AdmissionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [yearFilter, setYearFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Theme check
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Fetch admissions
  const fetchAdmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (yearFilter) params.append("year", yearFilter);
      if (statusFilter) params.append("status", statusFilter);
      
      const url = `/api/admin/admissions${params.toString() ? `?${params}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch admissions");
      const data = await res.json();

      const safeAdmissions = (data.admissions || []).map((ad: Admission) => ({
        ...ad,
        programs: ad.programs || [],
        institute: ad.institute || { id: 0, name: 'Unknown', cityName: 'Unknown', slug: 'unknown' }
      }));
      
      setAdmissions(safeAdmissions);
      setError(null);
    } catch {
      setError("Failed to load admissions");
      toast.error("Failed to load admissions");
    } finally {
      setLoading(false);
    }
  }, [yearFilter, statusFilter]);

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  // Update status
  const updateStatus = async (id: number, newStatus: "Expected" | "Open" | "Closed") => {
    setUpdatingStatus(id);
    toast.loading("Updating status...", { id: `status-${id}` });

    try {
      const res = await fetch(`/api/admin/admissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      
      toast.success(`Status updated to ${newStatus}`, { id: `status-${id}`, duration: 2000 });
      await fetchAdmissions();
    } catch {
      toast.error("Failed to update status", { id: `status-${id}` });
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Delete admission
  const deleteAdmission = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    setDeleteLoading(id);
    toast.loading("Deleting...", { id: `delete-${id}` });

    try {
      const res = await fetch(`/api/admin/admissions/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to delete");
      
      toast.success("Deleted successfully!", { id: `delete-${id}`, duration: 3000 });
      await fetchAdmissions();
    } catch {
      toast.error("Failed to delete", { id: `delete-${id}` });
    } finally {
      setDeleteLoading(null);
    }
  };

  // Calculate days and status
  const getDaysAndStatus = (closeDate: string | null, currentStatus: string) => {
    if (!closeDate) {
      return { days: null, isExpired: false, autoStatus: currentStatus, isManuallyClosedButFuture: false, needsAttention: false };
    }
    
    const now = new Date();
    const close = new Date(closeDate);
    const diffMs = close.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isExpired = diffMs < 0;
    const days = Math.abs(diffDays);
    
    let autoStatus = currentStatus;
    let needsAttention = false;
    let isManuallyClosedButFuture = false;
    
    if (currentStatus === 'Closed' && diffMs > 0) {
      isManuallyClosedButFuture = true;
      needsAttention = true;
      autoStatus = diffDays > 30 ? 'Expected' : 'Open';
    } else if (currentStatus === 'Open' && isExpired) {
      needsAttention = true;
      autoStatus = 'Closed';
    } else if (currentStatus !== 'Closed') {
      if (diffDays > 30) {
        if (currentStatus !== 'Expected') needsAttention = true;
        autoStatus = 'Expected';
      } else if (diffDays > 0 && diffDays <= 30) {
        if (currentStatus !== 'Open') needsAttention = true;
        autoStatus = 'Open';
      } else {
        if (currentStatus !== 'Closed') needsAttention = true;
        autoStatus = 'Closed';
      }
    }
    
    return { days, isExpired, autoStatus, isManuallyClosedButFuture, needsAttention };
  };

  // Prepare data for table
  const tableData: TableRow[] = admissions.map((ad) => {
    const safePrograms = ad.programs || [];
    const safeInstitute = ad.institute || { id: 0, name: 'Unknown', cityName: 'Unknown', slug: 'unknown' };
    const { days, isExpired, autoStatus, isManuallyClosedButFuture, needsAttention } = 
      getDaysAndStatus(ad.expectedCloseDate, ad.status);
    
    let formattedCloseDate: string | null = null;
    if (ad.expectedCloseDate) {
      try {
        const date = new Date(ad.expectedCloseDate);
        formattedCloseDate = date.toLocaleDateString('en-PK', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      } catch {
        formattedCloseDate = null;
      }
    }
    
    return {
      id: ad.id,
      name: ad.name || `${safeInstitute.name} Admissions ${ad.year}`,
      programNames: safePrograms.map(p => p.name).join(', ') || 'No programs',
      programCount: safePrograms.length,
      instituteName: safeInstitute.name,
      instituteId: safeInstitute.id,
      session: ad.session || '—',
      year: ad.year,  // ✅ Added year field
      closingDate: formattedCloseDate,
      daysLeft: days,
      isExpired: isExpired || false,
      status: ad.status,
      needsAttention: needsAttention || false,
      autoStatus: autoStatus,
      isManuallyClosedButFuture: isManuallyClosedButFuture || false,
      rawCloseDate: ad.expectedCloseDate,
    };
  });

  // Filter data based on search
  const filteredData = tableData.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.programNames.toLowerCase().includes(search.toLowerCase()) ||
    item.instituteName.toLowerCase().includes(search.toLowerCase()) ||
    item.session.toLowerCase().includes(search.toLowerCase()) ||
    item.year.toString().includes(search.toLowerCase())
  );

  const years = [...new Set(admissions.map(ad => ad.year).filter(Boolean))].sort((a, b) => b - a);

  // Helper functions
  const getStatusColors = (status: string) => {
    if (status === 'Expected') {
      return isDarkMode ? "bg-yellow-900/30 text-yellow-300" : "bg-yellow-100 text-yellow-700";
    }
    if (status === 'Open') {
      return isDarkMode ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-700";
    }
    return isDarkMode ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-700";
  };

  const getDaysLeftColor = (daysLeft: number, isExpired: boolean) => {
    if (isExpired) return isDarkMode ? 'text-red-400' : 'text-red-600';
    if (daysLeft <= 7) return isDarkMode ? 'text-red-400' : 'text-red-600';
    if (daysLeft <= 15) return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
    if (daysLeft <= 30) return isDarkMode ? 'text-green-400' : 'text-green-600';
    return isDarkMode ? 'text-blue-400' : 'text-blue-600';
  };

  const totalAdmissions = admissions.length;
  const needsAttentionCount = tableData.filter(a => a.needsAttention).length;

  if (loading && admissions.length === 0) {
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex justify-center items-center h-64">
          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Loading admissions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Admissions</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage program admissions</p>
        </div>
        <PrimaryButton onClick={() => router.push("/admin/admissions/create")}>+ Add New</PrimaryButton>
      </div>

      {/* Stats */}
      {!loading && admissions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className={`rounded-lg border p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Admissions</div>
            <div className={`text-2xl font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalAdmissions}</div>
          </div>
          <div className={`rounded-lg border p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Expected</div>
            <div className="text-2xl font-semibold mt-1 text-yellow-600 dark:text-yellow-400">
              {admissions.filter(a => a.status === 'Expected').length}
            </div>
          </div>
          <div className={`rounded-lg border p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Open</div>
            <div className="text-2xl font-semibold mt-1 text-green-600 dark:text-green-400">
              {admissions.filter(a => a.status === 'Open').length}
            </div>
          </div>
          <div className={`rounded-lg border p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Closed</div>
            <div className="text-2xl font-semibold mt-1 text-red-600 dark:text-red-400">
              {admissions.filter(a => a.status === 'Closed').length}
            </div>
          </div>
          <div className={`rounded-lg border p-4 ${isDarkMode ? 'bg-orange-950 border-orange-800' : 'bg-orange-50 border-orange-200'}`}>
            <div className={`text-sm font-medium ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>⚠️ Needs Attention</div>
            <div className={`text-2xl font-semibold mt-1 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>{needsAttentionCount}</div>
          </div>
        </div>
      )}

      {/* Filters with search info */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, program, institute, session or year..." />
          {search && (
            <div className={`absolute -bottom-6 left-0 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              🔍 Found {filteredData.length} result{filteredData.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className={`px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
        >
          <option value="">All Years</option>
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
        >
          <option value="">All Status</option>
          <option value="Expected">Expected</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {error && (
        <div className={`mb-4 border px-4 py-3 rounded ${isDarkMode ? 'bg-red-950 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {error}
        </div>
      )}

      {/* Table with highlighted search results */}
      {filteredData.length === 0 ? (
        <div className={`rounded-lg shadow p-12 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-4xl mb-2">🔍</div>
          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
            {search ? `No admissions match "${search}"` : "No admissions found. Create your first admission!"}
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className={`mt-4 text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
            >
              Clear search
            </button>
          )}
          {!search && !yearFilter && !statusFilter && (
            <button
              onClick={() => router.push("/admin/admissions/create")}
              className={`mt-4 text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
            >
              + Add your first admission
            </button>
          )}
        </div>
      ) : (
        <div className={`rounded-lg shadow overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Programs</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Institute</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Session</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Closing Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredData.map((row) => (
                  <tr 
                    key={row.id} 
                    className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${search ? (isDarkMode ? 'bg-gray-800/50' : 'bg-yellow-50/30') : ''}`}
                  >
                    {/* Name with highlight */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/admin/admissions/${row.id}`)}
                        className={`font-medium text-left break-words ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800 hover:underline'}`}
                      >
                        <HighlightText text={row.name} searchTerm={search} isDarkMode={isDarkMode} />
                      </button>
                    </td>
                    
                    {/* Programs with highlight */}
                    <td className="px-4 py-3">
                      <div className="break-words">
                        <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <HighlightText text={row.programNames} searchTerm={search} isDarkMode={isDarkMode} />
                        </div>
                        {row.programCount > 1 && (
                          <div className={`text-xs mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            {row.programCount} programs
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Institute with highlight */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/admin/institutes/${row.instituteId}`)}
                        className={`text-sm text-left break-words ${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600 hover:underline'}`}
                      >
                        <HighlightText text={row.instituteName} searchTerm={search} isDarkMode={isDarkMode} />
                      </button>
                    </td>
                    
                    {/* Session with highlight */}
                    <td className="px-4 py-3">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <HighlightText text={row.session} searchTerm={search} isDarkMode={isDarkMode} />
                      </span>
                    </td>
                    
                    {/* Closing Date */}
                    <td className="px-4 py-3">
                      {!row.closingDate ? (
                        <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>—</span>
                      ) : (
                        <div>
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{row.closingDate}</span>
                          {row.daysLeft && (
                            <div className={`text-xs mt-0.5 ${getDaysLeftColor(row.daysLeft, row.isExpired)} font-semibold`}>
                              {row.isExpired ? `⚠️ Expired (${row.daysLeft} days ago)` : `📅 ${row.daysLeft} days left`}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    
                    {/* Status */}
                    <td className="px-4 py-3">
                      {updatingStatus === row.id ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 inline-block">
                          <span className="flex items-center gap-1">
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Updating</span>
                          </span>
                        </span>
                      ) : (
                        <select
                          value={row.status}
                          onChange={(e) => updateStatus(row.id, e.target.value as "Expected" | "Open" | "Closed")}
                          className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer outline-none ${getStatusColors(row.status)} ${row.needsAttention ? 'ring-2 ring-orange-400' : ''}`}
                        >
                          <option value="Expected">Expected</option>
                          <option value="Open">Open</option>
                          <option value="Closed">Closed</option>
                        </select>
                      )}
                    </td>
                    
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => router.push(`/admin/admissions/${row.id}/edit`)}
                          className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 whitespace-nowrap"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAdmission(row.id, row.name)}
                          disabled={deleteLoading === row.id}
                          className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            deleteLoading === row.id
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-red-50 text-red-600 hover:bg-red-100"
                          }`}
                        >
                          {deleteLoading === row.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={`p-4 border-t text-sm flex justify-between items-center ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <span>Showing {filteredData.length} of {tableData.length} admissions</span>
            {search && (
              <button
                onClick={() => setSearch("")}
                className={`text-xs ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
              >
                Clear search ✕
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}