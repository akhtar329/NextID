
"use client";

import { useState, useEffect, FormEvent } from "react";
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

interface RoleApiResponse {
  success?: boolean;
  role?: {
    id?: number;
    name?: string;
    description?: string | null;
    status?: boolean | null;
  };
  error?: string;
}

interface SaveApiResponse {
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

function parseRoleResponse(data: Record<string, unknown>): RoleApiResponse {
  const roleData = data.role;

  let role: RoleApiResponse["role"];

  if (isRecord(roleData)) {
    role = {
      id: typeof roleData.id === "number" ? roleData.id : undefined,
      name: typeof roleData.name === "string" ? roleData.name : undefined,
      description:
        typeof roleData.description === "string" ||
        roleData.description === null
          ? roleData.description
          : undefined,
      status:
        typeof roleData.status === "boolean" || roleData.status === null
          ? roleData.status
          : undefined,
    };
  }

  return {
    success: data.success === true,
    role,
    error: typeof data.error === "string" ? data.error : undefined,
  };
}

export default function EditAdminRolePage() {
  const router = useRouter();
  const params = useParams();

  const roleId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(Boolean(roleId));
  const [error, setError] = useState<string | null>(null);

  // Fetch existing role
  useEffect(() => {
    if (!roleId) {
      return;
    }

    let active = true;

    async function fetchRole() {
      setFetchLoading(true);

      try {
        const res = await fetch(`/api/admin/admin-roles/${roleId}`);
        const rawData = await readJsonObject(res);
        const data = parseRoleResponse(rawData);

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch role");
        }

        if (data.success && data.role?.name) {
          if (!active) return;

          setName(data.role.name);
          setDescription(data.role.description || "");
          setStatus(data.role.status ?? true);
        } else {
          throw new Error(data.error || "Role not found");
        }
      } catch (err) {
        if (!active) return;

        console.error("Error fetching role:", err);

        const message =
          err instanceof Error ? err.message : "Failed to load role";

        setError(message);
        toast.error(message);
      } finally {
        if (active) {
          setFetchLoading(false);
        }
      }
    }

    fetchRole();

    return () => {
      active = false;
    };
  }, [roleId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setError(null);

    if (!name.trim()) {
      setError("Role name is required.");
      return;
    }

    setLoading(true);

    const payload: AdminRole = {
      name: name.trim(),
      description: description.trim() || "",
      status,
    };

    const method = roleId ? "PATCH" : "POST";
    const url = roleId
      ? `/api/admin/admin-roles/${roleId}`
      : "/api/admin/admin-roles";

    toast.loading(
      `${roleId ? "Updating" : "Creating"} role...`,
      { id: "role-action" }
    );

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const rawData = await readJsonObject(res);
      const data: SaveApiResponse = {
        success: rawData.success === true,
        error:
          typeof rawData.error === "string"
            ? rawData.error
            : undefined,
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save role");
      }

      toast.success(
        `Role ${roleId ? "updated" : "created"} successfully!`,
        { id: "role-action" }
      );

      router.push("/admin/admin-roles");
    } catch (err) {
      console.error("Error saving role:", err);

      const message =
        err instanceof Error ? err.message : "Failed to save role";

      setError(message);
      toast.error(message, { id: "role-action" });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          <p className="text-sm font-medium text-slate-600">
            Loading role information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/admin"
              className="transition hover:text-indigo-600"
            >
              Dashboard
            </Link>

            <span>/</span>

            <Link
              href="/admin/admin-roles"
              className="transition hover:text-indigo-600"
            >
              Admin Roles
            </Link>

            <span>/</span>

            <span className="font-medium text-slate-700">
              {roleId ? "Edit" : "Create"}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {roleId ? "Edit Admin Role" : "Create New Role"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {roleId
              ? "Update the role details and manage its active status."
              : "Create a new administrative role for your NextID panel."}
          </p>
        </div>

        <Link
          href="/admin/admin-roles"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Roles
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <svg
            className="mt-0.5 h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>

          <p>{error}</p>
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Card Header */}
        <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="10" cy="7" r="4" />
                <path d="M20 8v6" />
                <path d="M23 11h-6" />
              </svg>
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Role Information
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Enter the basic details for this role.
              </p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6 px-5 py-6 sm:px-7">
          {/* Role Name */}
          <div>
            <label
              htmlFor="role-name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Role Name <span className="text-red-500">*</span>
            </label>

            <input
              id="role-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Content Manager"
              maxLength={150}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              required
            />

            <p className="mt-2 text-xs text-slate-400">
              Enter a clear name that identifies the administrative role.
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="role-description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Description
              <span className="ml-2 font-normal text-slate-400">
                (Optional)
              </span>
            </label>

            <textarea
              id="role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the responsibilities of this role..."
              rows={4}
              maxLength={1000}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />

            <div className="mt-2 flex justify-end">
              <span className="text-xs text-slate-400">
                {description.length}/1000
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <label
                  htmlFor="status"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Role Status
                </label>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {status
                    ? "This role is active and available for use."
                    : "This role is inactive and unavailable for use."}
                </p>
              </div>

              <button
                id="status"
                type="button"
                role="switch"
                aria-checked={status}
                aria-label="Toggle role status"
                onClick={() => setStatus((previous) => !previous)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${
                  status ? "bg-indigo-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    status ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  status
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    status ? "bg-emerald-500" : "bg-slate-500"
                  }`}
                />
                {status ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Form Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <Link
            href="/admin/admin-roles"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </Link>

          <PrimaryButton type="submit" disabled={loading}>
            <span className="inline-flex items-center gap-2">
              {loading && (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="opacity-25"
                  />
                  <path
                    d="M4 12a8 8 0 0 1 8-8"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="opacity-75"
                  />
                </svg>
              )}

              {loading
                ? roleId
                  ? "Updating..."
                  : "Creating..."
                : roleId
                  ? "Update Role"
                  : "Create Role"}
            </span>
          </PrimaryButton>
        </div>
      </form>

      {/* Help Text */}
      <p className="text-center text-xs text-slate-400">
        Changes will be saved to your NextID administration system.
      </p>
    </div>
  );
}
