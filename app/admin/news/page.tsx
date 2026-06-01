"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PrimaryButton from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import Table, { Column } from "@/components/ui/Table";

type NewsItem = {
  id: number;
  title: string;
  slug: string;
  cityName?: string | null;
  programName?: string | null;
  instituteName?: string | null;
  isFeatured: boolean;
  isBreaking: boolean;
  status: boolean;
  views: number;
  createdAt: string;
};

export default function NewsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [statusLoading, setStatusLoading] = useState<number | null>(null);

  /* ---------------- Fetch News ---------------- */
  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      setNews(data.news || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  /* ---------------- Delete ---------------- */
  const deleteNews = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;

    setDeleteLoading(id);
    toast.loading("Deleting...", { id: `delete-${id}` });

    try {
      const res = await fetch(`/api/admin/news/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed");
      }

      setNews((prev) => prev.filter((n) => n.id !== id));
      toast.success("Deleted", { id: `delete-${id}` });
    } catch (err) {
      toast.error("Delete failed", { id: `delete-${id}` });
    } finally {
      setDeleteLoading(null);
    }
  };

  /* ---------------- Toggle Status ---------------- */
  const toggleStatus = async (id: number, current: boolean) => {
    setStatusLoading(id);

    try {
      const res = await fetch(`/api/admin/news/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: !current }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) throw new Error("Failed");

      setNews((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: !current } : n))
      );
    } catch {
      toast.error("Status update failed");
    } finally {
      setStatusLoading(null);
    }
  };

  /* ---------------- Toggle Breaking / Featured ---------------- */
  const toggleField = async (
    id: number,
    field: "isFeatured" | "isBreaking",
    current: boolean
  ) => {
    setStatusLoading(id);

    try {
      const res = await fetch(`/api/admin/news/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !current }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error("Failed");

      setNews((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, [field]: !current } : n
        )
      );
      toast.success(`${field} updated`);
    } catch {
      toast.error("Update failed");
    } finally {
      setStatusLoading(null);
    }
  };

  /* ---------------- Filter ---------------- */
  const filtered = news.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  /* ---------------- Columns ---------------- */
  const columns: Column<NewsItem>[] = [
    {
      header: "Title",
      accessor: "title",
      render: (value, row) => (
        <button
          onClick={() => router.push(`/admin/news/${row.id}`)}
          className="text-blue-600 hover:underline text-left"
        >
          {value}
        </button>
      ),
    },
    { header: "Views", accessor: "views" },
    {
      header: "Featured",
      accessor: "isFeatured",
      render: (value, row) => (
        <button
          onClick={() =>
            toggleField(row.id, "isFeatured", value)
          }
          className={`px-3 py-1 rounded-full text-xs ${
            value
              ? "bg-purple-100 text-purple-700"
              : "bg-gray-100 text-gray-500"
          }`}
          disabled={statusLoading === row.id}
        >
          {value ? "Yes" : "No"}
        </button>
      ),
    },
    {
      header: "Breaking",
      accessor: "isBreaking",
      render: (value, row) => (
        <button
          onClick={() =>
            toggleField(row.id, "isBreaking", value)
          }
          className={`px-3 py-1 rounded-full text-xs ${
            value
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-500"
          }`}
          disabled={statusLoading === row.id}
        >
          {value ? "Yes" : "No"}
        </button>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (value, row) => (
        <button
          onClick={() => toggleStatus(row.id, value)}
          disabled={statusLoading === row.id}
          className={`px-3 py-1 rounded-full text-xs ${
            value
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {statusLoading === row.id ? "..." : value ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      header: "Actions",
      accessor: "id",
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/news/${row.id}/edit`)}
            className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full"
          >
            Edit
          </button>
          <button
            onClick={() => deleteNews(row.id, row.title)}
            disabled={deleteLoading === row.id}
            className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-full"
          >
            {deleteLoading === row.id ? "..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  /* ---------------- Stats ---------------- */
  const total = news.length;
  const active = news.filter((n) => n.status).length;
  const featured = news.filter((n) => n.isFeatured).length;
  const breaking = news.filter((n) => n.isBreaking).length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">News</h1>
          <p className="text-sm text-gray-500">Manage all news articles</p>
        </div>

        <PrimaryButton onClick={() => router.push("/admin/news/create")}>
          + Add News
        </PrimaryButton>
      </div>

      {!loading && news.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total" value={total} />
          <StatCard label="Active" value={active} />
          <StatCard label="Featured" value={featured} />
          <StatCard label="Breaking" value={breaking} />
        </div>
      )}

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search news..." />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded shadow">
          <div className="text-gray-500">{search ? "No news found" : "No news available"}</div>
        </div>
      ) : (
        <div className="bg-white rounded shadow">
          <Table columns={columns} data={filtered} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
