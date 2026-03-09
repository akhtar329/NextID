// app/admin/programs/page.tsx
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
  degreeId: number;
  degreeName?: string;
  duration: string | null;
  feeRange: string | null;
  isFeatured: boolean;
  status: boolean;
  createdAt: string;
};

export default function ProgramsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [statusLoading, setStatusLoading] = useState<number | null>(null);

  // Fetch programs
  const fetchPrograms = async () => {
    setLoading(true);
    try {
      // Fetch programs
      const res = await fetch("/api/admin/programs");
      if (!res.ok) throw new Error("Failed to fetch programs");
      const data = await res.json();
      
      // Safely get programs array
      const programsList = data.programs || data.data || [];
      
      // Fetch degrees to get degree names
      let degreeMap = new Map();
      try {
        const degreesRes = await fetch("/api/admin/degrees");
        if (degreesRes.ok) {
          const degreesData = await degreesRes.json();
          
          // Handle different possible response structures
          const degreesList = degreesData.degrees || degreesData.data || [];
          
          if (Array.isArray(degreesList)) {
            degreesList.forEach((d: any) => {
              if (d && d.id) {
                degreeMap.set(d.id, d.name || d.fullForm || 'Unknown');
              }
            });
          }
        }
      } catch (degreeErr) {
        console.warn("Could not fetch degrees:", degreeErr);
        // Continue without degree names
      }

      // Add degree name to each program
      const programsWithDegree = programsList.map((p: any) => ({
        ...p,
        degreeName: p.degreeName || degreeMap.get(p.degreeId) || 'Unknown'
      }));

      setPrograms(programsWithDegree);
      setError(null);
    } catch (err) {
      console.error("Error fetching programs:", err);
      setError("Failed to load programs");
      toast.error("Failed to load programs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  // Delete program
  const deleteProgram = async (id: number, programName: string) => {
    if (!confirm(`Are you sure you want to delete "${programName}"?`)) return;

    setDeleteLoading(id);
    toast.loading(`Deleting "${programName}"...`, { id: `delete-${id}` });

    try {
      const res = await fetch(`/api/admin/programs/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete program");
      }

      if (data.success) {
        toast.success(`"${programName}" deleted successfully!`, { 
          id: `delete-${id}`,
          duration: 3000 
        });
        await fetchPrograms();
      } else {
        throw new Error(data.error || "Failed to delete program");
      }

    } catch (err) {
      console.error("Error deleting program:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete program", { 
        id: `delete-${id}` 
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  // Toggle status
  const toggleStatus = async (id: number, currentStatus: boolean, programName: string) => {
    setStatusLoading(id);
    const newStatus = !currentStatus;
    const statusText = newStatus ? "active" : "inactive";
    
    toast.loading(`Changing status to ${statusText}...`, { id: `status-${id}` });

    try {
      const res = await fetch(`/api/admin/programs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      if (data.success) {
        toast.success(`"${programName}" is now ${statusText}`, { 
          id: `status-${id}`,
          duration: 2000 
        });
        await fetchPrograms();
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

  // Toggle featured
  const toggleFeatured = async (id: number, currentFeatured: boolean, programName: string) => {
    setStatusLoading(id);
    const newFeatured = !currentFeatured;
    
    toast.loading(`Changing featured status...`, { id: `featured-${id}` });

    try {
      const res = await fetch(`/api/admin/programs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: newFeatured }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update featured status");
      }

      if (data.success) {
        toast.success(`"${programName}" featured status updated`, { 
          id: `featured-${id}`,
          duration: 2000 
        });
        await fetchPrograms();
      } else {
        throw new Error(data.error || "Failed to update featured status");
      }

    } catch (err) {
      console.error("Error updating featured status:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update featured status", { 
        id: `featured-${id}` 
      });
    } finally {
      setStatusLoading(null);
    }
  };

  // Filter programs
  const filtered = programs.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.degreeName && p.degreeName.toLowerCase().includes(search.toLowerCase())) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Columns
  const columns: {
    header: string;
    accessor: keyof Program;
    render?: (value: any, row: Program) => React.ReactNode;
  }[] = [
    { 
      header: "Name", 
      accessor: "name",
      render: (value: string, row: Program) => (
        <button
          onClick={() => router.push(`/admin/programs/${row.id}`)}
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
        >
          {value}
        </button>
      )
    },
    { 
      header: "Degree", 
      accessor: "degreeName",
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value || '-'}</span>
      )
    },
    { 
      header: "Duration", 
      accessor: "duration",
      render: (value: string | null) => (
        <span className="text-sm text-gray-600">{value || '-'}</span>
      )
    },
    { 
      header: "Featured", 
      accessor: "isFeatured",
      render: (value: boolean, row: Program) => (
        <button
          onClick={() => toggleFeatured(row.id, value, row.name)}
          disabled={statusLoading === row.id}
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium transition-all
            ${value 
              ? "bg-purple-100 text-purple-700 hover:bg-purple-200 ring-1 ring-purple-300" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 ring-1 ring-gray-300"
            }
            ${statusLoading === row.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {value ? "Featured" : "Regular"}
        </button>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (value: boolean, row: Program) => (
        <button
          onClick={() => toggleStatus(row.id, value, row.name)}
          disabled={statusLoading === row.id}
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium transition-all
            ${value 
              ? "bg-green-100 text-green-700 hover:bg-green-200 ring-1 ring-green-300" 
              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 ring-1 ring-yellow-300"
            }
            ${statusLoading === row.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {statusLoading === row.id ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${value ? "bg-green-500" : "bg-yellow-500"}`}></span>
              {value ? "Active" : "Inactive"}
            </span>
          )}
        </button>
      ),
    },
    {
      header: "Created",
      accessor: "createdAt",
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "id",
      render: (_: number, row: Program) => (
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/programs/${row.id}/edit`)}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors ring-1 ring-blue-200"
          >
            Edit
          </button>
          <button
            onClick={() => deleteProgram(row.id, row.name)}
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
  const totalPrograms = programs.length;
  const activePrograms = programs.filter(p => p.status).length;
  const featuredPrograms = programs.filter(p => p.isFeatured).length;
  const inactivePrograms = programs.filter(p => !p.status).length;

  if (loading && programs.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading programs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Programs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage academic programs (BS, BBA, MBBS, etc.)</p>
        </div>
        <PrimaryButton onClick={() => router.push("/admin/programs/create")}>
          + Add New Program
        </PrimaryButton>
      </div>

      {/* Stats Cards */}
      {!loading && programs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Total Programs</div>
            <div className="text-2xl font-semibold mt-1">{totalPrograms}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Active</div>
            <div className="text-2xl font-semibold mt-1 text-green-600">{activePrograms}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Featured</div>
            <div className="text-2xl font-semibold mt-1 text-purple-600">{featuredPrograms}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Inactive</div>
            <div className="text-2xl font-semibold mt-1 text-yellow-600">{inactivePrograms}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search programs by name, degree or slug..."
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-4xl mb-2">📚</div>
          <div className="text-gray-500">
            {search ? "No programs match your search" : "No programs found. Create your first program!"}
          </div>
          {!search && (
            <button
              onClick={() => router.push("/admin/programs/create")}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add your first program
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table columns={columns} data={filtered} />
        </div>
      )}
    </div>
  );
}