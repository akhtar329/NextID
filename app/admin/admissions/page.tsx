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
  // 👇 Changed from single program to programs array
  programs: Program[];
  institute: Institute;
};

// Flattened type for Table component
type FlatAdmission = {
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
  // 👇 For display
  programNames: string;
  programIds: number[];
  firstProgramId: number; // For linking
  instituteName: string;
  instituteCity: string;
  instituteId: number;
  programCount: number;
};

export default function AdmissionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  // Filters
  const [yearFilter, setYearFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Fetch admissions
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
      console.log('Admissions data:', data); // Debug log
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

  // Delete admission
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

  // Transform data for table
  const flattenedData: FlatAdmission[] = admissions.map(ad => {
    const programNames = ad.programs?.map(p => p.name).join(', ') || 'No programs';
    const programIds = ad.programs?.map(p => p.id) || [];
    const firstProgramId = programIds[0] || 0;
    const programCount = ad.programs?.length || 0;
    
    return {
      id: ad.id,
      name: ad.name || `${ad.institute.name} Admissions ${ad.year}`,
      slug: ad.slug || '',
      year: ad.year,
      session: ad.session,
      status: ad.status,
      expectedOpenDate: ad.expectedOpenDate,
      expectedCloseDate: ad.expectedCloseDate,
      meritInfo: ad.meritInfo,
      note: ad.note,
      officialLink: ad.officialLink,
      programNames,
      programIds,
      firstProgramId,
      programCount,
      instituteName: ad.institute.name,
      instituteCity: ad.institute.cityName,
      instituteId: ad.institute.id,
    };
  });

  // Filter by search (client-side) - search in name, program names, institute
  const filteredData = flattenedData.filter(ad => 
    ad.name.toLowerCase().includes(search.toLowerCase()) ||
    ad.programNames.toLowerCase().includes(search.toLowerCase()) ||
    ad.instituteName.toLowerCase().includes(search.toLowerCase()) ||
    ad.year.toString().includes(search)
  );

  // Get unique years for filter dropdown
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
        <div>
          <button
            onClick={() => router.push(`/admin/admissions/${row.id}`)}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
          >
            {value}
          </button>
          <div className="text-xs text-gray-500 mt-1 font-mono">
            /admissions/{row.slug}
          </div>
        </div>
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
          {row.firstProgramId > 0 && (
            <button
              onClick={() => router.push(`/admin/programs/${row.firstProgramId}`)}
              className="text-xs text-gray-500 hover:text-blue-600 hover:underline mt-1 block"
            >
              View first program →
            </button>
          )}
        </div>
      )
    },
    {
      header: "Institute",
      accessor: "instituteName",
      render: (value: string, row: FlatAdmission) => (
        <div>
          <button
            onClick={() => router.push(`/admin/institutes/${row.instituteId}`)}
            className="text-gray-700 hover:text-blue-600 hover:underline text-sm"
          >
            {value}
          </button>
          <div className="text-xs text-gray-500">{row.instituteCity}</div>
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
      header: "Session",
      accessor: "session",
      render: (value: string | null) => (
        <span className="text-sm text-gray-600">{value || '—'}</span>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (value: string) => {
        const colors = {
          Expected: "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300",
          Open: "bg-green-100 text-green-700 ring-1 ring-green-300",
          Closed: "bg-red-100 text-red-700 ring-1 ring-red-300"
        };
        return (
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${colors[value as keyof typeof colors]}`}>
            {value}
          </span>
        );
      }
    },
    {
      header: "Open Date",
      accessor: "expectedOpenDate",
      render: (value: string | null) => (
        <span className="text-sm text-gray-600">
          {value ? new Date(value).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: "Close Date",
      accessor: "expectedCloseDate",
      render: (value: string | null) => (
        <span className="text-sm text-gray-600">
          {value ? new Date(value).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: "Actions",
      accessor: "id",
      render: (_: number, row: FlatAdmission) => (
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/admissions/${row.id}/edit`)}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors ring-1 ring-blue-200"
            title={`Edit: ${row.name}`}
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
      ),
    },
  ];

  // Stats
  const totalAdmissions = admissions.length;
  const expectedAdmissions = admissions.filter(a => a.status === 'Expected').length;
  const openAdmissions = admissions.filter(a => a.status === 'Open').length;
  const closedAdmissions = admissions.filter(a => a.status === 'Closed').length;
  const totalProgramsLinked = admissions.reduce((sum, ad) => sum + (ad.programs?.length || 0), 0);

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
            Manage program admissions with SEO-friendly URLs
          </p>
        </div>
        <PrimaryButton onClick={() => router.push("/admin/admissions/create")}>
          + Add New Admission
        </PrimaryButton>
      </div>

      {/* Stats Cards */}
      {!loading && admissions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Total Admissions</div>
            <div className="text-2xl font-semibold mt-1">{totalAdmissions}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Expected</div>
            <div className="text-2xl font-semibold mt-1 text-yellow-600">{expectedAdmissions}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Open</div>
            <div className="text-2xl font-semibold mt-1 text-green-600">{openAdmissions}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Closed</div>
            <div className="text-2xl font-semibold mt-1 text-red-600">{closedAdmissions}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Programs Linked</div>
            <div className="text-2xl font-semibold mt-1 text-blue-600">{totalProgramsLinked}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
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
          
          {/* Summary */}
          <div className="p-4 border-t text-sm text-gray-500 flex justify-between">
            <span>Showing {filteredData.length} of {flattenedData.length} admissions</span>
            <span className="font-medium">
              Total Programs: {totalProgramsLinked}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}