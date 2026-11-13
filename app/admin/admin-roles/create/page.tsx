
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface RoleApiResponse {
  success?: boolean;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function readJsonObject(
  response: Response
): Promise<Record<string, unknown>> {
  const data: unknown = await response.json();
  return isRecord(data) ? data : {};
}

function parseRoleResponse(
  data: Record<string, unknown>
): RoleApiResponse {
  return {
    success: data.success === true,
    error: typeof data.error === "string" ? data.error : undefined,
  };
}

export default function CreateAdminRolePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: true,
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/admin/admin-roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const rawData = await readJsonObject(res);
      const data = parseRoleResponse(rawData);

      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to create role");
        setLoading(false);
        return;
      }

      toast.success("Role created successfully!");
      router.push("/admin/admin-roles");
    } catch (err) {
      console.error("Create admin role error:", err);
      toast.error("Failed to create role");
      setLoading(false);
    }
  }

  const inputClasses =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/admin/admin-roles"
          className="transition hover:text-blue-600"
        >
          Admin Roles
        </Link>

        <span>/</span>

        <span className="font-medium text-gray-900">
          Create Role
        </span>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Create Admin Role
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Add a new administrative role and configure its status.
        </p>
      </div>

      {/* Form Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-gray-900">
            Role Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the basic details for this role.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 p-5 sm:p-6">
            {/* Role Name */}
            <div>
              <label
                htmlFor="role-name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Role Name <span className="text-red-500">*</span>
              </label>

              <input
                id="role-name"
                type="text"
                placeholder="e.g. Content Manager"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className={inputClasses}
                required
                disabled={loading}
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Enter a clear and recognizable role name.
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="role-description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="role-description"
                placeholder="Describe the responsibilities of this role..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={`${inputClasses} min-h-32 resize-y`}
                rows={4}
                disabled={loading}
              />
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="role-status"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Role Status
              </label>

              <select
                id="role-status"
                value={form.status ? "true" : "false"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value === "true",
                  })
                }
                className={inputClasses}
                disabled={loading}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>

              <p className="mt-1.5 text-xs text-gray-500">
                {form.status
                  ? "This role will be created as active."
                  : "This role will be created as inactive."}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Link
              href="/admin/admin-roles"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Cancel / Back
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}

              {loading ? "Creating..." : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
