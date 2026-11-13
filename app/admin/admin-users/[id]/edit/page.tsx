
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface AdminRole {
  id: number;
  name: string;
}

interface AdminUser {
  id?: number;
  name: string;
  email: string;
  roleId: number | null;
  status: boolean;
  [key: string]: unknown;
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

function parseUser(value: unknown): AdminUser | null {
  if (
    !isRecord(value) ||
    typeof value.name !== "string" ||
    typeof value.email !== "string"
  ) {
    return null;
  }

  const roleId =
    typeof value.roleId === "number" ? value.roleId : null;

  return {
    ...value,
    name: value.name,
    email: value.email,
    roleId,
    status: typeof value.status === "boolean" ? value.status : true,
  };
}

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setLoadError(null);

      try {
        // Fetch roles
        const rolesRes = await fetch("/api/admin/admin-roles");

        if (!rolesRes.ok) {
          throw new Error("Failed to load admin roles");
        }

        const rolesData = await readJsonObject(rolesRes);

        if (rolesData.success === true) {
          const parsedRoles = parseRoles(rolesData.roles);

          if (!cancelled) {
            setRoles(parsedRoles);
          }
        } else {
          throw new Error(
            typeof rolesData.error === "string"
              ? rolesData.error
              : "Failed to load admin roles"
          );
        }

        // Fetch user
        const userRes = await fetch(`/api/admin/admin-users/${id}`);

        if (!userRes.ok) {
          throw new Error("Failed to load user information");
        }

        const userData = await readJsonObject(userRes);

        const parsedUser = parseUser(userData.user);

        if (!parsedUser) {
          throw new Error(
            typeof userData.error === "string"
              ? userData.error
              : "User not found or invalid user data"
          );
        }

        if (!cancelled) {
          setUser(parsedUser);
        }
      } catch (err) {
        console.error("Fetch user data error:", err);

        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to load user";

          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      void fetchData();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user || saving) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/admin/admin-users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      const data = await readJsonObject(res);

      if (!res.ok || data.success !== true) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to update user"
        );
      }

      toast.success("User updated successfully!");

      router.push("/admin/admin-users");
      router.refresh();
    } catch (err) {
      console.error("Update user error:", err);

      toast.error(
        err instanceof Error ? err.message : "Failed to update user"
      );

      setSaving(false);
    }
  }

  const inputClasses =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100";

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          Loading user information...
        </div>
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-8 text-center">
          <h2 className="text-lg font-semibold text-red-800">
            Unable to Load User
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {loadError || "User not found"}
          </p>

          <Link
            href="/admin/admin-users"
            className="mt-5 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100"
          >
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

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
          Edit User
        </span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Edit User #{id}
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Update user information, administrative role and account status.
        </p>
      </div>

      {/* Form Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <h2 className="font-semibold text-gray-900">
            User Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Make the required changes and save your updates.
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
                Name
              </label>

              <input
                id="user-name"
                type="text"
                value={user.name}
                onChange={(e) =>
                  setUser({ ...user, name: e.target.value })
                }
                className={inputClasses}
                required
                disabled={saving}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="user-email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email
              </label>

              <input
                id="user-email"
                type="email"
                value={user.email}
                onChange={(e) =>
                  setUser({ ...user, email: e.target.value })
                }
                className={inputClasses}
                required
                disabled={saving}
              />
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="user-role"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Role
              </label>

              <select
                id="user-role"
                value={user.roleId ?? ""}
                onChange={(e) =>
                  setUser({
                    ...user,
                    roleId: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
                className={inputClasses}
                disabled={saving}
              >
                <option value="">Select Role</option>

                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
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
                value={user.status ? "true" : "false"}
                onChange={(e) =>
                  setUser({
                    ...user,
                    status: e.target.value === "true",
                  })
                }
                className={inputClasses}
                disabled={saving}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>

              <p className="mt-1.5 text-xs text-gray-500">
                {user.status
                  ? "This account is currently active."
                  : "This account is currently inactive."}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={() => router.push("/admin/admin-users")}
              disabled={saving}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {saving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}

              {saving ? "Updating..." : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
