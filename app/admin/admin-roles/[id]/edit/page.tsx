// app/admin/admin-roles/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/components/ui/Button";

interface AdminRole {
  id?: number;
  name: string;
  description?: string;
  status: boolean;
}

export default function EditAdminRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(Boolean(roleId));
  const [error, setError] = useState<string | null>(null);

  // Fetch existing role
  useEffect(() => {
    if (!roleId) return;

    async function fetchRole() {
      setFetchLoading(true);
      try {
        const res = await fetch(`/api/admin/admin-roles/${roleId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Failed to fetch role");
        }

        const data = await res.json();
        if (data.success && data.role) {
          setName(data.role.name);
          setDescription(data.role.description || "");
          setStatus(data.role.status ?? true);
        } else {
          throw new Error(data.error || "Role not found");
        }
      } catch (err) {
        console.error("Error fetching role:", err);
        setError(err instanceof Error ? err.message : "Failed to load role");
        toast.error(err instanceof Error ? err.message : "Failed to load role");
      } finally {
        setFetchLoading(false);
      }
    }

    fetchRole();
  }, [roleId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name.trim()) {
      setError("Role name is required.");
      setLoading(false);
      return;
    }

    const payload: AdminRole = {
      name: name.trim(),
      description: description.trim() || "",
      status,
    };

    const method = roleId ? "PATCH" : "POST";
    const url = roleId ? `/api/admin/admin-roles/${roleId}` : `/api/admin/admin-roles`;

    toast.loading(`${roleId ? "Updating" : "Creating"} role...`, { id: "role-action" });

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save role");
      }

      toast.success(`Role ${roleId ? "updated" : "created"} successfully!`, { id: "role-action" });
      router.push("/admin/admin-roles");
    } catch (err) {
      console.error("Error saving role:", err);
      setError(err instanceof Error ? err.message : "Failed to save role");
      toast.error(err instanceof Error ? err.message : "Failed to save role", { id: "role-action" });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center text-gray-500 py-16">
        Loading role data...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{roleId ? "Edit Role" : "Create New Role"}</h1>
        <Link href="/admin/admin-roles">
          <PrimaryButton>Back to Roles</PrimaryButton>
        </Link>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter role name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="status"
            type="checkbox"
            checked={status}
            onChange={(e) => setStatus(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="status" className="text-sm font-medium text-gray-700">
            Active (Uncheck to deactivate)
          </label>
        </div>

        <div className="flex gap-3">
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? (roleId ? "Updating..." : "Creating...") : (roleId ? "Update Role" : "Create Role")}
          </PrimaryButton>

          <Link
            href="/admin/admin-roles"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
