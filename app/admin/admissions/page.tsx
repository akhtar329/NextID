// app/admin/admissions/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
};

export default function AdmissionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const [yearFilter, setYearFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

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

  // Function to calculate days left
  const getDaysLeft = (closeDate: string | null): { days: number | null; isExpired: boolean } => {
    if (!closeDate) return { days: null, isExpired: false };
    
    const now = new Date();
    const close = new Date(closeDate);
    const diffMs = close.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    return { 
      days: Math.abs(diffDays), 
      isExpired: diffMs < 0 
    };
  };

  const flattenedData: FlatAdmission[] = admissions.map(ad => {
    const programNames = ad.programs?.map(p => p.name).join(', ') || 'No programs';
    const programCount = ad.programs?.length || 0;
    const { days, isExpired } = getDaysLeft(ad.expectedCloseDate);
    
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
    };
  });

  const filteredData = flattenedData.filter(ad => 
    ad.name.toLowerCase().includes(search.toLowerCase()) ||
    ad.programNames.toLowerCase().includes(search.toLowerCase()) ||
    ad.instituteName.toLowerCase().includes(search.toLowerCase()) ||
    ad.year.toString().includes(search)
  );

  const years = [...new Set(admissions.map(ad => ad.year))].sort((a, b) => b - a);

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
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
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
          <div className="text-sm text-gray-700 max-w-xs truncate" title={value}>
            {value}
          </div>
          {row.programCount > 1 && (
            <div className="text-xs text-blue-600 mt-1">
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
          className="text-gray-700 hover:text-blue-600 hover:underline text-sm"
        >
          {value}
        </button>
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
      header: "Session",
      accessor: "session",
      render: (value: string | null) => (
        <span className="text-sm text-gray-600">{value || '—'}</span>
      )
    },
{
  header: "Closing Date",
  accessor: "expectedCloseDate",
  render: (value: string | null, row: FlatAdmission) => {
    if (!value) return <span className="text-gray-400 text-sm">—</span>;
    
    const date = new Date(value);
    const formattedDate = date.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{formattedDate}</span>
        {row.status === 'Open' && (
          <span className={`text-xs mt-0.5 font-semibold ${
            row.isExpired ? 'text-red-600' : 
            row.daysLeft && row.daysLeft <= 7 ? 'text-orange-600' : 
            row.daysLeft && row.daysLeft <= 15 ? 'text-yellow-600' : 
            'text-green-600'
          }`}>
            {row.isExpired 
              ? '⚠️ Needs Closure!'
              : row.daysLeft 
                ? `📅 ${row.daysLeft} days left`
                : ''
            }
          </span>
        )}
        {row.status === 'Closed' && (
          <span className="text-xs text-gray-500 mt-0.5">
            {row.isExpired ? `Closed ${row.daysLeft} days ago` : 'Closed'}
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
      Expected: "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300",
      Open: "bg-green-100 text-green-700 ring-1 ring-green-300",
      Closed: "bg-red-100 text-red-700 ring-1 ring-red-300"
    };
    
    // Show warning badge if Open but expired
    const isExpiredOpen = value === 'Open' && row.isExpired;
    
    return (
      <div className="relative">
        {updatingStatus === row.id ? (
          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 ring-1 ring-gray-200">
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
              `}
            >
              <option value="Expected">Expected</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
            {isExpiredOpen && (
              <span className="text-[10px] text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full text-center animate-pulse">
                ⚠️ Needs Closure!
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
            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors ring-1 ring-blue-200"
          >
            Edit
          </button>
          <button
            onClick={() => deleteAdmission(row.id, row.name)}
            disabled={deleteLoading === row.id}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-full transition-colors ring-1
              ${deleteLoading === row.id
                ? "bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed"
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

  if (loading && admissions.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading admissions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Admissions</h1>
          <p className="text-sm text-gray-500 mt-1">
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
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Total Admissions</div>
            <div className="text-2xl font-semibold mt-1">{totalAdmissions}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Expected</div>
            <div className="text-2xl font-semibold mt-1 text-yellow-600">
              {admissions.filter(a => a.status === 'Expected').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Open</div>
            <div className="text-2xl font-semibold mt-1 text-green-600">
              {admissions.filter(a => a.status === 'Open').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Closed</div>
            <div className="text-2xl font-semibold mt-1 text-red-600">
              {admissions.filter(a => a.status === 'Closed').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">⚠️ Expired (Need Closure)</div>
            <div className="text-2xl font-semibold mt-1 text-orange-600">
              {admissions.filter(a => a.status === 'Open' && new Date(a.expectedCloseDate || '') < new Date()).length}
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
          <option value="Expected">Expected</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Table */}
      {filteredData.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-4xl mb-2">📋</div>
          <div className="text-gray-500">
            {search || yearFilter || statusFilter 
              ? "No admissions match your filters" 
              : "No admissions found. Create your first admission!"}
          </div>
          {!search && !yearFilter && !statusFilter && (
            <button
              onClick={() => router.push("/admin/admissions/create")}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add your first admission
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table columns={columns} data={filteredData} />
          <div className="p-4 border-t text-sm text-gray-500">
            Showing {filteredData.length} of {flattenedData.length} admissions
          </div>
        </div>
      )}
    </div>
  );
}