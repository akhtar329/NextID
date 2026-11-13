
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/components/ui/Button";

interface AdminRole {
  id: number;
  name: string;
  description: string;
  status: boolean;
}

interface RolesApiResponse {
  success: boolean;
  roles?: AdminRole[];
  error?: string;
}

interface RoleApiResponse {
  success: boolean;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseRole(value: unknown): AdminRole | null {
  if (!isRecord(value)) return null;

  if (
    typeof value.id !== "number" ||
    typeof value.name !== "string" ||
    typeof value.status !== "boolean"
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    description:
      typeof value.description === "string" ? value.description : "",
    status: value.status,
  };
}

async function readJsonObject(
  response: Response
): Promise<Record<string, unknown>> {
  const data: unknown = await response.json();
  return isRecord(data) ? data : {};
}

function parseRolesResponse(
  data: Record<string, unknown>
): RolesApiResponse {
  if (data.success !== true) {
    return {
      success: false,
      error:
        typeof data.error === "string" ? data.error : undefined,
    };
  }

  if (!Array.isArray(data.roles)) {
    return {
      success: false,
      error: "Invalid roles data received from server",
    };
  }

  const roles = data.roles
    .map(parseRole)
    .filter((role): role is AdminRole => role !== null);

  return {
    success: true,
    roles,
  };
}

function parseRoleApiResponse(
  data: Record<string, unknown>
): RoleApiResponse {
  return {
    success: data.success === true,
    error: typeof data.error === "string" ? data.error : undefined,
  };
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/admin-roles");

      if (!res.ok) {
        throw new Error("Failed to fetch roles");
      }

      const rawData = await readJsonObject(res);
      const data = parseRolesResponse(rawData);

      if (!data.success) {
        throw new Error(data.error || "Invalid response from server");
      }

      setRoles(data.roles || []);
    } catch (err) {
      console.error("Fetch admin roles error:", err);

      const message =
        err instanceof Error ? err.message : "Failed to load roles";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  const handleDelete = async (role: AdminRole) => {
    if (deletingId !== null) return;

    if (!confirm(`Are you sure you want to delete "${role.name}"?`)) {
      return;
    }

    setDeletingId(role.id);

    try {
      const res = await fetch(`/api/admin/admin-roles/${role.id}`, {
        method: "DELETE",
      });

      const rawData = await readJsonObject(res);
      const data = parseRoleApiResponse(rawData);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete role");
      }

      toast.success(`Role "${role.name}" deleted`);

      setRoles((prev) => prev.filter((r) => r.id !== role.id));
    } catch (err) {
      console.error("Delete admin role error:", err);

      toast.error(
        err instanceof Error ? err.message : "Failed to delete role"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusToggle = async (role: AdminRole) => {
    if (updatingId !== null) return;

    const newStatus = !role.status;

    setUpdatingId(role.id);

    // Optimistic UI update
    setRoles((prev) =>
      prev.map((r) =>
        r.id === role.id ? { ...r, status: newStatus } : r
      )
    );

    try {
      const res = await fetch(`/api/admin/admin-roles/${role.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const rawData = await readJsonObject(res);
      const data = parseRoleApiResponse(rawData);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status");
      }

      toast.success(
        `Role "${role.name}" is now ${newStatus ? "Active" : "Inactive"}`
      );
    } catch (err) {
      console.error("Update role status error:", err);

      toast.error(
        err instanceof Error ? err.message : "Failed to update status"
      );

      // Restore previous status if request fails
      setRoles((prev) =>
        prev.map((r) =>
          r.id === role.id ? { ...r, status: role.status } : r
        )
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[300px] max-w-5xl items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          Loading admin roles...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-8 text-center">
          <h2 className="text-lg font-semibold text-red-800">
            Unable to Load Roles
          </h2>

          <p className="mt-2 text-sm text-red-700">{error}</p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError(null);
                void fetchRoles();
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Try Again
            </button>

            <Link
              href="/admin"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 text-sm text-gray-500">
            Admin Dashboard / Admin Roles
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Admin Roles
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage administrative roles and their active status.
          </p>
        </div>

        <Link
          href="/admin/admin-roles/create"
          className="inline-flex shrink-0"
        >
          <PrimaryButton>Add New Role</PrimaryButton>
        </Link>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Roles</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {roles.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Active Roles</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {roles.filter((role) => role.status).length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Inactive Roles</p>
          <p className="mt-2 text-2xl font-bold text-gray-500">
            {roles.filter((role) => !role.status).length}
          </p>
        </div>
      </div>

      {/* Roles Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              All Administrative Roles
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {roles.length} {roles.length === 1 ? "role" : "roles"} found
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[750px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  ID
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Role Name
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Description
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {roles.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center"
                  >
                    <p className="font-medium text-gray-700">
                      No roles found
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Create your first administrative role to get started.
                    </p>

                    <Link
                      href="/admin/admin-roles/create"
                      className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Create New Role
                    </Link>
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr
                    key={role.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                      #{role.id}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {role.name}
                      </span>
                    </td>

                    <td className="max-w-xs px-5 py-4 text-sm text-gray-500">
                      <span className="line-clamp-2">
                        {role.description || "-"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <label className="inline-flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={role.status}
                          onChange={() => void handleStatusToggle(role)}
                          disabled={updatingId !== null}
                          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                          aria-label={`Toggle ${role.name} status`}
                        />

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            role.status
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {role.status ? "Active" : "Inactive"}
                        </span>

                        {updatingId === role.id && (
                          <span className="text-xs text-gray-400">
                            Saving...
                          </span>
                        )}
                      </label>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/admin-roles/${role.id}/edit`}
                          className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() => void handleDelete(role)}
                          disabled={deletingId !== null}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === role.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
