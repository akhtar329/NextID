"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import SearchInput from "@/app/component/ui/SearchInput";
import Table from "@/app/component/ui/Table";

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

type FlatAdmission = {
  id: number;
  name: string;
  slug: string;
  year: number;
  session: string | null;
  status: "Expected" | "Open" | "Closed";
  expectedOpenDate: string | null;
  expectedCloseDate: string | null;
  programNames: string;
  instituteName: string;
  instituteCity: string;
  instituteId: number;
  programCount: number;
  daysLeft: number | null;
  isExpired: boolean;
  autoStatus: string;
  isManuallyClosedButFuture: boolean;
  needsAttention: boolean;
};

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

  // Listen for theme changes from topbar
  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    checkTheme();
    
    // Create observer to watch for class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    // Also listen for storage events (in case theme changes in another tab)
    window.addEventListener('storage', checkTheme);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', checkTheme);
    };
  }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/admissions";
      const params = new URLSearchParams();
      
      if (yearFilter) params.append("year", yearFilter);
      if (statusFilter) params.append("status", statusFilter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch admissions");
      const data = await res.json();

      setAdmissions(data.admissions || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching admissions:", err);
      setError("Failed to load admissions");
      toast.error("Failed to load admissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, [yearFilter, statusFilter]);

  const updateStatus = async (id: number, newStatus: "Expected" | "Open" | "Closed") => {
    setUpdatingStatus(id);
    toast.loading("Updating status...", { id: `status-${id}` });

    try {
      const res = await fetch(`/api/admin/admissions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      toast.success(`Status updated to ${newStatus}`, { 
        id: `status-${id}`,
        duration: 2000 
      });
      
      await fetchAdmissions();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update status", { 
        id: `status-${id}` 
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const deleteAdmission = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    setDeleteLoading(id);
    toast.loading("Deleting admission...", { id: `delete-${id}` });

    try {
      const res = await fetch(`/api/admin/admissions/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete admission");
      }

      if (data.success) {
        toast.success("Admission deleted successfully!", { 
          id: `delete-${id}`,
          duration: 3000 
        });
        await fetchAdmissions();
      } else {
        throw new Error(data.error || "Failed to delete admission");
      }

    } catch (err) {
      console.error("Error deleting admission:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete admission", { 
        id: `delete-${id}` 
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  // Function to calculate days left and auto status
  const getDaysAndStatus = (closeDate: string | null, currentStatus: string) => {
    if (!closeDate) { 
      return { 
        days: null, 
        isExpired: false, 
        autoStatus: currentStatus, 
        isManuallyClosedButFuture: false,
        needsAttention: false
      };
    }
    
    const now = new Date();
    const close = new Date(closeDate);
    const diffMs = close.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isExpired = diffMs < 0;
    const days = Math.abs(diffDays);
    
    let autoStatus = currentStatus;
    let isManuallyClosedButFuture = false;
    let needsAttention = false;
    
    // If admin manually closed it but date is still future
    if (currentStatus === 'Closed' && diffMs > 0) {
      isManuallyClosedButFuture = true;
      needsAttention = true;
      if (diffDays > 30) {
        autoStatus = 'Expected';
      } else if (diffDays > 0 && diffDays <= 30) {
        autoStatus = 'Open';
      }
    }
    // If Open but expired
    else if (currentStatus === 'Open' && isExpired) {
      needsAttention = true;
      autoStatus = 'Closed';
    }
    // Auto status based on days left (for Open/Expected)
    else if (currentStatus !== 'Closed') {
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
    
    return { 
      days, 
      isExpired, 
      autoStatus, 
      isManuallyClosedButFuture,
      needsAttention,
      diffDays: diffDays > 0 ? diffDays : days
    };
  };

  const flattenedData: FlatAdmission[] = admissions.map(ad => {
    const programNames = ad.programs?.map(p => p.name).join(', ') || 'No programs';
    const programCount = ad.programs?.length || 0;
    const { days, isExpired, autoStatus, isManuallyClosedButFuture, needsAttention } = getDaysAndStatus(ad.expectedCloseDate, ad.status);
    
    return {
      id: ad.id,
      name: ad.name || `${ad.institute.name} Admissions ${ad.year}`,
      slug: ad.slug || '',
      year: ad.year,
      session: ad.session,
      status: ad.status,
      expectedOpenDate: ad.expectedOpenDate,
      expectedCloseDate: ad.expectedCloseDate,
      programNames,
      programCount,
      instituteName: ad.institute.name,
      instituteCity: ad.institute.cityName,
      instituteId: ad.institute.id,
      daysLeft: days,
      isExpired: isExpired,
      autoStatus: autoStatus,
      isManuallyClosedButFuture: isManuallyClosedButFuture,
      needsAttention: needsAttention,
    };
  });

  const filteredData = flattenedData.filter(ad => 
    ad.name.toLowerCase().includes(search.toLowerCase()) ||
    ad.programNames.toLowerCase().includes(search.toLowerCase()) ||
    ad.instituteName.toLowerCase().includes(search.toLowerCase()) ||
    ad.year.toString().includes(search)
  );

  const years = [...new Set(admissions.map(ad => ad.year).filter(Boolean))].sort((a, b) => b - a);

  const columns: {
    header: string;
    accessor: keyof FlatAdmission;
    render?: (value: any, row: FlatAdmission) => React.ReactNode;
  }[] = [
    {
      header: "Name",
      accessor: "name",
      render: (value: string, row: FlatAdmission) => (
        <button
          onClick={() => router.push(`/admin/admissions/${row.id}`)}
          className={`font-medium text-left transition-colors ${
            isDarkMode 
              ? 'text-blue-400 hover:text-blue-300' 
              : 'text-blue-600 hover:text-blue-800 hover:underline'
          }`}
        >
          {value}
        </button>
      )
    },
    {
      header: "Programs",
      accessor: "programNames",
      render: (value: string, row: FlatAdmission) => (
        <div>
          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-xs truncate`} title={value}>
            {value}
          </div>
          {row.programCount > 1 && (
            <div className={`text-xs mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {row.programCount} programs
            </div>
          )}
        </div>
      )
    },
    {
      header: "Institute",
      accessor: "instituteName",
      render: (value: string, row: FlatAdmission) => (
        <button
          onClick={() => router.push(`/admin/institutes/${row.instituteId}`)}
          className={`text-sm transition-colors ${
            isDarkMode 
              ? 'text-gray-300 hover:text-blue-400' 
              : 'text-gray-700 hover:text-blue-600 hover:underline'
          }`}
        >
          {value}
        </button>
      )
    },
    {
      header: "Session",
      accessor: "session",
      render: (value: string | null) => (
        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {value || '—'}
        </span>
      )
    },
    {
      header: "Closing Date",
      accessor: "expectedCloseDate",
      render: (value: string | null, row: FlatAdmission) => {
        if (!value) return <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>—</span>;
        
        const date = new Date(value);
        const formattedDate = date.toLocaleDateString('en-PK', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        
        return (
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
              {formattedDate}
            </span>
            {row.daysLeft && (
              <span className={`text-xs mt-0.5 ${
                row.isExpired 
                  ? isDarkMode ? 'text-red-400' : 'text-red-600'
                  : row.daysLeft <= 7 
                    ? isDarkMode ? 'text-red-400' : 'text-red-600'
                    : row.daysLeft <= 15 
                      ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                      : row.daysLeft <= 30 
                        ? isDarkMode ? 'text-green-400' : 'text-green-600'
                        : isDarkMode ? 'text-blue-400' : 'text-blue-600'
              } font-semibold`}>
                {row.isExpired 
                  ? `⚠️ Expired (${row.daysLeft} days ago)`
                  : `📅 ${row.daysLeft} days left`
                }
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: "Status",
      accessor: "status",
      render: (value: string, row: FlatAdmission) => {
        const colors = {
          Expected: isDarkMode 
            ? "bg-yellow-900/30 text-yellow-300 ring-yellow-700"
            : "bg-yellow-100 text-yellow-700 ring-yellow-300",
          Open: isDarkMode
            ? "bg-green-900/30 text-green-300 ring-green-700"
            : "bg-green-100 text-green-700 ring-green-300",
          Closed: isDarkMode
            ? "bg-red-900/30 text-red-300 ring-red-700"
            : "bg-red-100 text-red-700 ring-red-300"
        };
        
        const isExpiredOpen = value === 'Open' && row.isExpired;
        const needsToOpen = row.isManuallyClosedButFuture;
        const shouldBeStatus = row.autoStatus !== value;
        
        return (
          <div className="relative">
            {updatingStatus === row.id ? (
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-400 ring-gray-700'
                  : 'bg-gray-100 text-gray-400 ring-gray-200'
              }`}>
                <span className="flex items-center gap-1">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Updating</span>
                </span>
              </span>
            ) : (
              <div className="flex flex-col gap-1">
                <select
                  value={value}
                  onChange={(e) => updateStatus(row.id, e.target.value as "Expected" | "Open" | "Closed")}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer outline-none
                    ${colors[value as keyof typeof colors]}
                    hover:ring-2 hover:ring-offset-1 transition-all
                    ${row.needsAttention ? 'ring-2 ring-orange-400 ring-offset-1' : ''}
                  `}
                >
                  <option value="Expected">Expected</option>
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
                
                {isExpiredOpen && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-center animate-pulse ${
                    isDarkMode 
                      ? 'text-red-400 bg-red-950'
                      : 'text-red-600 bg-red-50'
                  }`}>
                    ⚠️ Needs Closure!
                  </span>
                )}
                
                {needsToOpen && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-center animate-pulse ${
                    isDarkMode
                      ? 'text-orange-400 bg-orange-950'
                      : 'text-orange-600 bg-orange-50'
                  }`}>
                    🔓 Needs to Open (Should be {row.autoStatus})
                  </span>
                )}
                
                {shouldBeStatus && !needsToOpen && !isExpiredOpen && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-center ${
                    isDarkMode
                      ? 'text-blue-400 bg-blue-950'
                      : 'text-blue-600 bg-blue-50'
                  }`}>
                    💡 Suggest: {row.autoStatus}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: "Actions",
      accessor: "id",
      render: (_: number, row: FlatAdmission) => (
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/admissions/${row.id}/edit`)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              isDarkMode
                ? 'text-blue-400 bg-blue-950 hover:bg-blue-900 ring-blue-800'
                : 'text-blue-600 bg-blue-50 hover:bg-blue-100 ring-blue-200'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => deleteAdmission(row.id, row.name)}
            disabled={deleteLoading === row.id}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-full transition-colors
              ${deleteLoading === row.id
                ? isDarkMode
                  ? "bg-gray-800 text-gray-500 ring-gray-700 cursor-not-allowed"
                  : "bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed"
                : isDarkMode
                  ? "bg-red-950 text-red-400 hover:bg-red-900 ring-red-800"
                  : "bg-red-50 text-red-600 hover:bg-red-100 ring-red-200"
              }
            `}
          >
            {deleteLoading === row.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  const totalAdmissions = admissions.length;
  const needsAttentionCount = flattenedData.filter(a => a.needsAttention).length;

  if (loading && admissions.length === 0) {
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex justify-center items-center h-64">
          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
            Loading admissions...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Admissions
          </h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage program admissions
          </p>
        </div>
        <PrimaryButton onClick={() => router.push("/admin/admissions/create")}>
          + Add New
        </PrimaryButton>
      </div>

      {/* Stats Card */}
      {!loading && admissions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className={`rounded-lg shadow-sm border p-4 transition-colors ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
          }`}>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Total Admissions
            </div>
            <div className={`text-2xl font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {totalAdmissions}
            </div>
          </div>
          <div className={`rounded-lg shadow-sm border p-4 transition-colors ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
          }`}>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Expected
            </div>
            <div className="text-2xl font-semibold mt-1 text-yellow-600 dark:text-yellow-400">
              {admissions.filter(a => a.status === 'Expected').length}
            </div>
          </div>
          <div className={`rounded-lg shadow-sm border p-4 transition-colors ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
          }`}>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Open
            </div>
            <div className="text-2xl font-semibold mt-1 text-green-600 dark:text-green-400">
              {admissions.filter(a => a.status === 'Open').length}
            </div>
          </div>
          <div className={`rounded-lg shadow-sm border p-4 transition-colors ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
          }`}>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Closed
            </div>
            <div className="text-2xl font-semibold mt-1 text-red-600 dark:text-red-400">
              {admissions.filter(a => a.status === 'Closed').length}
            </div>
          </div>
          <div className={`rounded-lg shadow-sm border p-4 transition-colors ${
            isDarkMode 
              ? 'bg-orange-950 border-orange-800' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className={`text-sm font-medium ${
              isDarkMode ? 'text-orange-300' : 'text-orange-700'
            }`}>
              ⚠️ Needs Attention
            </div>
            <div className={`text-2xl font-semibold mt-1 ${
              isDarkMode ? 'text-orange-400' : 'text-orange-600'
            }`}>
              {needsAttentionCount}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, program or institute..."
          />
        </div>
        
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-400'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="">All Years</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-400'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="">All Status</option>
          <option value="Expected">Expected</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {error && (
        <div className={`mb-4 border px-4 py-3 rounded ${
          isDarkMode 
            ? 'bg-red-950 border-red-800 text-red-400'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {error}
        </div>
      )}

      {/* Table */}
      {filteredData.length === 0 ? (
        <div className={`rounded-lg shadow p-12 text-center transition-colors ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="text-4xl mb-2">📋</div>
          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
            {search || yearFilter || statusFilter 
              ? "No admissions match your filters" 
              : "No admissions found. Create your first admission!"}
          </div>
          {!search && !yearFilter && !statusFilter && (
            <button
              onClick={() => router.push("/admin/admissions/create")}
              className={`mt-4 text-sm ${
                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              + Add your first admission
            </button>
          )}
        </div>
      ) : (
        <div className={`rounded-lg shadow overflow-hidden transition-colors ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Table columns={columns} data={filteredData} />
          <div className={`p-4 border-t text-sm ${
            isDarkMode 
              ? 'border-gray-700 text-gray-400' 
              : 'border-gray-200 text-gray-500'
          }`}>
            Showing {filteredData.length} of {flattenedData.length} admissions
          </div>
        </div>
      )}
    </div>
  );
}
