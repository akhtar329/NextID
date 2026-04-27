// app/admin/cities/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import SearchInput from "@/app/component/ui/SearchInput";
import Table from "@/app/component/ui/Table";

type City = {
  id: number;
  name: string;
  slug: string;
  province: string | null;
  isPopular: boolean;
  status: boolean;
  createdAt: string;
};

export default function CitiesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [statusLoading, setStatusLoading] = useState<number | null>(null);
  const [popularLoading, setPopularLoading] = useState<number | null>(null);

  // Fetch cities
  const fetchCities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cities");
      if (!res.ok) throw new Error("Failed to fetch cities");
      const data = await res.json();
      setCities(data.cities || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching cities:", err);
      setError("Failed to load cities");
      toast.error("Failed to load cities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  // Delete city
  const deleteCity = async (id: number, cityName: string) => {
    if (!confirm(`Are you sure you want to delete "${cityName}"?`)) return;

    setDeleteLoading(id);
    toast.loading(`Deleting "${cityName}"...`, { id: `delete-${id}` });

    try {
      const res = await fetch(`/api/admin/cities/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete city");
      }

      if (data.success) {
        toast.success(`"${cityName}" deleted successfully!`, { 
          id: `delete-${id}`,
          duration: 3000 
        });
        await fetchCities();
      } else {
        throw new Error(data.error || "Failed to delete city");
      }

    } catch (err) {
      console.error("Error deleting city:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete city", { 
        id: `delete-${id}` 
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  // Toggle status
  const toggleStatus = async (id: number, currentStatus: boolean, cityName: string) => {
    setStatusLoading(id);
    const newStatus = !currentStatus;
    const statusText = newStatus ? "active" : "inactive";
    
    toast.loading(`Changing status to ${statusText}...`, { id: `status-${id}` });

    try {
      const res = await fetch(`/api/admin/cities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      if (data.success) {
        toast.success(`"${cityName}" is now ${statusText}`, { 
          id: `status-${id}`,
          duration: 2000 
        });
        await fetchCities();
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
  const togglePopular = async (id: number, currentPopular: boolean, cityName: string) => {
    setPopularLoading(id);
    const newPopular = !currentPopular;
    const popularText = newPopular ? "popular" : "not popular";
    
    toast.loading(`Marking as ${popularText}...`, { id: `popular-${id}` });

    try {
      const res = await fetch(`/api/admin/cities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPopular: newPopular }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update popular status");
      }

      if (data.success) {
        toast.success(`"${cityName}" is now ${popularText}!`, { 
          id: `popular-${id}`,
          duration: 2000 
        });
        await fetchCities();
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

  // Filter cities
  const filtered = cities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase()) ||
    (c.province?.toLowerCase() || "").includes(search.toLowerCase())
  );

  // Columns - Like Boards page
  const columns: {
    header: string;
    accessor: keyof City;
    render?: (value: any, row: City) => React.ReactNode;
  }[] = [
    { 
      header: "Name", 
      accessor: "name",
      render: (value: string, row: City) => (
        <button
          onClick={() => router.push(`/admin/cities/${row.id}`)}
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
        >
          {value}
        </button>
      )
    },
    { 
      header: "Slug", 
      accessor: "slug",
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value}</span>
      )
    },
    { 
      header: "Province", 
      accessor: "province",
      render: (value: string | null) => (
        <span className="text-sm text-gray-600">{value || '—'}</span>
      )
    },
    {
      header: "Popular",
      accessor: "isPopular",
      render: (value: boolean, row: City) => (
        <button
          onClick={() => togglePopular(row.id, value, row.name)}
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
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (value: boolean, row: City) => (
        <button
          onClick={() => toggleStatus(row.id, value, row.name)}
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
      ),
    },
    {
      header: "Created At",
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
      render: (_: number, row: City) => (
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/cities/${row.id}/edit`)}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors ring-1 ring-blue-200"
          >
            Edit
          </button>
          <button
            onClick={() => deleteCity(row.id, row.name)}
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
  const totalCities = cities.length;
  const popularCities = cities.filter(c => c.isPopular).length;
  const activeCities = cities.filter(c => c.status).length;
  const inactiveCities = cities.filter(c => !c.status).length;

  if (loading && cities.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading cities...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Cities</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage cities and their metadata (Karachi, Lahore, Islamabad, etc.)
          </p>
        </div>
        <PrimaryButton onClick={() => router.push("/admin/cities/create")}>
          + Add New City
        </PrimaryButton>
      </div>

      {/* Stats Cards */}
      {!loading && cities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Total Cities</div>
            <div className="text-2xl font-semibold mt-1">{totalCities}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Popular</div>
            <div className="text-2xl font-semibold mt-1 text-purple-600">{popularCities}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Active</div>
            <div className="text-2xl font-semibold mt-1 text-green-600">{activeCities}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Inactive</div>
            <div className="text-2xl font-semibold mt-1 text-yellow-600">{inactiveCities}</div>
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
          placeholder="Search cities by name, slug or province..."
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-4xl mb-2">🏙️</div>
          <div className="text-gray-500">
            {search ? "No cities match your search" : "No cities found. Create your first city!"}
          </div>
          {!search && (
            <button
              onClick={() => router.push("/admin/cities/create")}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add your first city
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
