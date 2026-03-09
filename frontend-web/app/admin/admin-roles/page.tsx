// app/admin/admin-roles/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";

interface AdminRole {
  id: number;
  name: string;
  description: string;
  status: boolean;
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoles() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/admin-roles");
        if (!res.ok) throw new Error(`Failed to fetch roles`);
        const data = await res.json();
        if (data.success) {
          setRoles(data.roles || []);
        } else {
          throw new Error(data.error || "Invalid response from server");
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load roles");
        toast.error(err instanceof Error ? err.message : "Failed to load roles");
      } finally {
        setLoading(false);
      }
    }
    fetchRoles();
  }, []);

  const handleDelete = async (role: AdminRole) => {
    if (!confirm(`Are you sure you want to delete "${role.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/admin-roles/${role.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Role "${role.name}" deleted`);
        setRoles((prev) => prev.filter((r) => r.id !== role.id));
      } else {
        throw new Error(data.error || "Failed to delete role");
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to delete role");
    }
  };

  const handleStatusToggle = async (role: AdminRole) => {
    const newStatus = !role.status;
    setRoles((prev) =>
      prev.map((r) => (r.id === role.id ? { ...r, status: newStatus } : r))
    );

    try {
      const res = await fetch(`/api/admin/admin-roles/${role.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status");
      }
      toast.success(`Role "${role.name}" is now ${newStatus ? "Active" : "Inactive"}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to update status");
      // Revert UI if failed
      setRoles((prev) =>
        prev.map((r) => (r.id === role.id ? { ...r, status: role.status } : r))
      );
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center text-gray-500 py-16">
        Loading roles...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded">
          <p className="mb-4">{error}</p>
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Admin Roles</h1>
        <Link href="/admin/admin-roles/create">
          <PrimaryButton>Add New Role</PrimaryButton>
        </Link>
      </div>

      <div className="overflow-x-auto bg-white shadow-sm rounded border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">ID</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Description</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {roles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No roles found.
                </td>
              </tr>
            )}
            {roles.map((role) => (
              <tr key={role.id}>
                <td className="px-6 py-4 text-sm text-gray-700">{role.id}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{role.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{role.description || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={role.status}
                    onChange={() => handleStatusToggle(role)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 flex gap-2">
                  <Link
                    href={`/admin/admin-roles/${role.id}/edit`}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(role)}
                    className="px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
