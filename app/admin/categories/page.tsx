// app/admin/categories/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import SearchInput from "@/app/component/ui/SearchInput";
import Table from "@/app/component/ui/Table";

type Category = {
  id: number;
  name: string;
  slug: string;
  displayOrder: number;
  status: boolean;
  createdAt: string;
};

export default function CategoriesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [statusLoading, setStatusLoading] = useState<number | null>(null);

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data.categories || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories");
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Delete category
  const deleteCategory = async (id: number, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"?`)) return;

    setDeleteLoading(id);
    toast.loading(`Deleting "${categoryName}"...`, { id: `delete-${id}` });

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete category");
      }

      if (data.success) {
        toast.success(`"${categoryName}" deleted successfully!`, { 
          id: `delete-${id}`,
          duration: 3000 
        });
        await fetchCategories();
      } else {
        throw new Error(data.error || "Failed to delete category");
      }

    } catch (err) {
      console.error("Error deleting category:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete category", { 
        id: `delete-${id}` 
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  // Toggle status
  const toggleStatus = async (id: number, currentStatus: boolean, categoryName: string) => {
    setStatusLoading(id);
    const newStatus = !currentStatus;
    const statusText = newStatus ? "active" : "inactive";
    
    toast.loading(`Changing status to ${statusText}...`, { id: `status-${id}` });

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      if (data.success) {
        toast.success(`"${categoryName}" is now ${statusText}`, { 
          id: `status-${id}`,
          duration: 2000 
        });
        await fetchCategories();
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

  // Filter categories
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Columns
  const columns: {
    header: string;
    accessor: keyof Category;
    render?: (value: any, row: Category) => React.ReactNode;
  }[] = [
    { 
      header: "Name", 
      accessor: "name",
      render: (value: string, row: Category) => (
        <button
          onClick={() => router.push(`/admin/categories/${row.id}`)}
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
      header: "Display Order", 
      accessor: "displayOrder",
      render: (value: number) => (
        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
          {value}
        </span>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (value: boolean, row: Category) => (
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
      render: (_: number, row: Category) => (
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/categories/${row.id}/edit`)}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors ring-1 ring-blue-200"
          >
            Edit
          </button>
          <button
            onClick={() => deleteCategory(row.id, row.name)}
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
  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.status).length;
  const inactiveCategories = categories.filter(c => !c.status).length;

  if (loading && categories.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading categories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage degree categories (Engineering, Medical, Business, etc.)</p>
        </div>
        <PrimaryButton onClick={() => router.push("/admin/categories/create")}>
          + Add New Category
        </PrimaryButton>
      </div>

      {/* Stats Cards */}
      {!loading && categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Total Categories</div>
            <div className="text-2xl font-semibold mt-1">{totalCategories}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Active</div>
            <div className="text-2xl font-semibold mt-1 text-green-600">{activeCategories}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Inactive</div>
            <div className="text-2xl font-semibold mt-1 text-yellow-600">{inactiveCategories}</div>
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
          placeholder="Search categories by name or slug..."
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-4xl mb-2">📁</div>
          <div className="text-gray-500">
            {search ? "No categories match your search" : "No categories found. Create your first category!"}
          </div>
          {!search && (
            <button
              onClick={() => router.push("/admin/categories/create")}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add your first category
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
