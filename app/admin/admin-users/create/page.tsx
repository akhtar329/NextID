
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface AdminRole {
  id: number;
  name: string;
}

interface ApiResponse {
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

async function readJsonObject(
  response: Response
): Promise<Record<string, unknown>> {
  const data: unknown = await response.json();
  return isRecord(data) ? data : {};
}

function parseRoles(value: unknown): AdminRole[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is AdminRole => {
    return (
      isRecord(item) &&
      typeof item.id === "number" &&
      typeof item.name === "string"
    );
  });
}

function parseApiResponse(
  data: Record<string, unknown>
): ApiResponse {
  return {
    success: data.success === true,
    error: typeof data.error === "string" ? data.error : undefined,
  };
}

export default function CreateUserPage() {
  const router = useRouter();

  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    status: true,
  });

  const [loading, setLoading] = useState(false);

  // Fetch roles
  useEffect(() => {
    let cancelled = false;

    async function fetchRoles() {
      setRolesLoading(true);
      setRolesError(null);

      try {
        const res = await fetch("/api/admin/admin-roles");

        if (!res.ok) {
          throw new Error("Failed to load admin roles");
        }

        const rawData = await readJsonObject(res);

        if (rawData.success !== true) {
          throw new Error(
            typeof rawData.error === "string"
              ? rawData.error
              : "Invalid response while loading roles"
          );
        }

        const parsedRoles = parseRoles(rawData.roles);

        if (!cancelled) {
          setRoles(parsedRoles);
        }
      } catch (err) {
        console.error("Fetch roles error:", err);

        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to load admin roles";

          setRolesError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setRolesLoading(false);
        }
      }
    }

    void fetchRoles();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/admin/admin-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const rawData = await readJsonObject(res);
      const data = parseApiResponse(rawData);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create user");
      }

      toast.success("User created successfully!");

      router.push("/admin/admin-users");
    } catch (err) {
      console.error("Create user error:", err);

      toast.error(
        err instanceof Error ? err.message : "Failed to create user"
      );

      setLoading(false);
    }
  }

  const inputClasses =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100";

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/admin/admin-users"
          className="transition hover:text-blue-600"
        >
          Admin Users
        </Link>

        <span>/</span>

        <span className="font-medium text-gray-900">
          Create User
        </span>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Create Admin User
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Add a new administrator and assign an administrative role.
        </p>
      </div>

      {/* Form Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <h2 className="font-semibold text-gray-900">
            User Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the account details and select the appropriate role.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 p-5 sm:p-6">
            {/* Name */}
            <div>
              <label
                htmlFor="user-name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Full Name <span className="text-red-500">*</span>
              </label>

              <input
                id="user-name"
                type="text"
                placeholder="Enter full name"
                className={inputClasses}
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="user-email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email Address <span className="text-red-500">*</span>
              </label>

              <input
                id="user-email"
                type="email"
                placeholder="Enter email address"
                className={inputClasses}
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="user-password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Password <span className="text-red-500">*</span>
              </label>

              <input
                id="user-password"
                type="password"
                placeholder="Enter password"
                className={inputClasses}
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="user-role"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Administrative Role{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                id="user-role"
                className={inputClasses}
                value={form.roleId}
                onChange={(e) =>
                  setForm({ ...form, roleId: e.target.value })
                }
                required
                disabled={loading || rolesLoading || roles.length === 0}
              >
                <option value="">
                  {rolesLoading ? "Loading roles..." : "Select Role"}
                </option>

                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>

              {rolesError ? (
                <p className="mt-2 text-xs text-red-600">
                  {rolesError}
                </p>
              ) : roles.length === 0 && !rolesLoading ? (
                <p className="mt-2 text-xs text-amber-600">
                  No roles available. Create an admin role first.
                </p>
              ) : (
                <p className="mt-2 text-xs text-gray-500">
                  Select the permissions role for this administrator.
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="user-status"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Account Status
              </label>

              <select
                id="user-status"
                className={inputClasses}
                value={form.status ? "true" : "false"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value === "true",
                  })
                }
                disabled={loading}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>

              <p className="mt-2 text-xs text-gray-500">
                {form.status
                  ? "The new administrator account will be active."
                  : "The new administrator account will be inactive."}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Link
              href="/admin/admin-users"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading || rolesLoading || roles.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}

              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
