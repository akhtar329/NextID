
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  RefreshCw,
  ArrowRight,
  Search,
  Loader2,
  Link2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface RedirectRule {
  from: string;
  to: string;
  status: 301 | 302;
}

interface ApiResponse {
  success?: unknown;
  data?: unknown;
  message?: unknown;
  error?: unknown;
}

const DEFAULT_REDIRECT: RedirectRule = {
  from: "",
  to: "",
  status: 301,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readApiResponse(response: Response): Promise<ApiResponse> {
  const result: unknown = await response.json();

  if (!isRecord(result)) {
    throw new Error("Invalid server response");
  }

  return result as ApiResponse;
}

function parseRedirects(value: unknown): RedirectRule[] | null {
  if (!Array.isArray(value)) return null;

  const result: RedirectRule[] = [];

  for (const item of value) {
    if (!isRecord(item)) return null;

    if (
      typeof item.from !== "string" ||
      typeof item.to !== "string" ||
      (item.status !== 301 && item.status !== 302)
    ) {
      return null;
    }

    result.push({
      from: item.from,
      to: item.to,
      status: item.status,
    });
  }

  return result;
}

function normalizePath(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) return null;

  // Redirect rules should use local paths, not external URLs.
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(trimmed)
  ) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, "https://nextid.pk");

    if (parsed.origin !== "https://nextid.pk") {
      return null;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

function validateRedirect(
  redirect: RedirectRule,
  redirects: RedirectRule[],
  originalFrom?: string
): string | null {
  const from = normalizePath(redirect.from);
  const to = normalizePath(redirect.to);

  if (!from || !to) {
    return "Use valid local paths starting with /. External URLs are not allowed.";
  }

  if (from === to) {
    return "Source and destination URLs cannot be the same.";
  }

  const duplicate = redirects.some(
    (item) =>
      item.from.trim() === from &&
      item.from !== originalFrom
  );

  if (duplicate) {
    return "A redirect with this source URL already exists.";
  }

  return null;
}

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<RedirectRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [isAdding, setIsAdding] = useState(false);

  const [newRedirect, setNewRedirect] =
    useState<RedirectRule>(DEFAULT_REDIRECT);

  const [editing, setEditing] = useState<RedirectRule | null>(null);
  const [editingOriginal, setEditingOriginal] = useState("");

  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = useCallback((text: string) => {
    if (messageTimer.current) {
      clearTimeout(messageTimer.current);
    }

    setMessage(text);

    messageTimer.current = setTimeout(() => {
      setMessage("");
      messageTimer.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (messageTimer.current) {
        clearTimeout(messageTimer.current);
        messageTimer.current = null;
      }
    };
  }, []);

  const fetchRedirects = useCallback(async () => {
    if (saving) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/redirects", {
        method: "GET",
        cache: "no-store",
      });

      const data = await readApiResponse(response);

      if (!response.ok || data.success !== true) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to load redirects"
        );
      }

      const parsedRedirects = parseRedirects(data.data);

      if (!parsedRedirects) {
        throw new Error("Invalid redirect data received from server");
      }

      setRedirects(parsedRedirects);
    } catch (err) {
      console.error("Fetch redirects error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load redirects"
      );
    } finally {
      setLoading(false);
    }
  }, [saving]);

  useEffect(() => {
    void fetchRedirects();
  }, []);

  async function saveRedirects(
    updatedRedirects: RedirectRule[]
  ): Promise<boolean> {
    if (saving) return false;

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/admin/redirects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          redirects: updatedRedirects,
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok || data.success !== true) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to save redirects"
        );
      }

      setRedirects(updatedRedirects);

      showMessage(
        typeof data.message === "string"
          ? data.message
          : "Redirects updated successfully"
      );

      return true;
    } catch (err) {
      console.error("Save redirects error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save redirects"
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd() {
    if (saving) return;

    const normalized: RedirectRule = {
      from: newRedirect.from.trim(),
      to: newRedirect.to.trim(),
      status: newRedirect.status,
    };

    if (!normalized.from || !normalized.to) {
      setError("From URL and To URL are required.");
      return;
    }

    const validationError = validateRedirect(
      normalized,
      redirects
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    const updated = [
      ...redirects,
      {
        ...normalized,
        from: normalizePath(normalized.from) as string,
        to: normalizePath(normalized.to) as string,
      },
    ];

    const success = await saveRedirects(updated);

    if (success) {
      setNewRedirect(DEFAULT_REDIRECT);
      setIsAdding(false);
      setError("");
    }
  }

  async function handleDelete(from: string) {
    if (saving) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the redirect for ${from}?`
    );

    if (!confirmed) return;

    const updated = redirects.filter(
      (redirect) => redirect.from !== from
    );

    const success = await saveRedirects(updated);

    if (success && editingOriginal === from) {
      setEditing(null);
      setEditingOriginal("");
    }
  }

  function startEdit(rule: RedirectRule) {
    setError("");
    setEditing({ ...rule });
    setEditingOriginal(rule.from);
  }

  async function handleUpdate() {
    if (!editing || saving) return;

    const normalized: RedirectRule = {
      from: editing.from.trim(),
      to: editing.to.trim(),
      status: editing.status,
    };

    if (!normalized.from || !normalized.to) {
      setError("From URL and To URL are required.");
      return;
    }

    const validationError = validateRedirect(
      normalized,
      redirects,
      editingOriginal
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    const updated = redirects.map((redirect) =>
      redirect.from === editingOriginal
        ? {
            ...normalized,
            from: normalizePath(normalized.from) as string,
            to: normalizePath(normalized.to) as string,
          }
        : redirect
    );

    const success = await saveRedirects(updated);

    if (success) {
      setEditing(null);
      setEditingOriginal("");
      setError("");
    }
  }

  const filteredRedirects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return redirects;

    return redirects.filter(
      (redirect) =>
        redirect.from.toLowerCase().includes(query) ||
        redirect.to.toLowerCase().includes(query) ||
        String(redirect.status).includes(query)
    );
  }, [redirects, search]);

  const total301 = redirects.filter(
    (redirect) => redirect.status === 301
  ).length;

  const total302 = redirects.filter(
    (redirect) => redirect.status === 302
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            <Link2 className="h-6 w-6 text-blue-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Redirect Manager
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage website redirects and SEO URL changes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void fetchRedirects()}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setError("");
              setIsAdding(true);
            }}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={16} />
            Add Redirect
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Redirects
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {redirects.length}
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            All configured rules
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            301 Permanent
          </p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {total301}
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Permanent URL changes
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            302 Temporary
          </p>
          <h2 className="mt-2 text-3xl font-bold text-amber-600">
            {total302}
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Temporary URL changes
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            className="ml-auto shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {message && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 bg-blue-50/50 px-5 py-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                Add New Redirect
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Enter the old and replacement URL paths.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewRedirect(DEFAULT_REDIRECT);
                setError("");
              }}
              disabled={saving}
              aria-label="Close add form"
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-4">
            <div>
              <label
                htmlFor="new-from"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                From URL
              </label>
              <input
                id="new-from"
                value={newRedirect.from}
                onChange={(event) =>
                  setNewRedirect((previous) => ({
                    ...previous,
                    from: event.target.value,
                  }))
                }
                placeholder="/old-url"
                disabled={saving}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="new-to"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                To URL
              </label>
              <input
                id="new-to"
                value={newRedirect.to}
                onChange={(event) =>
                  setNewRedirect((previous) => ({
                    ...previous,
                    to: event.target.value,
                  }))
                }
                placeholder="/new-url"
                disabled={saving}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="new-status"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Redirect Type
              </label>
              <select
                id="new-status"
                value={newRedirect.status}
                onChange={(event) =>
                  setNewRedirect((previous) => ({
                    ...previous,
                    status: Number(event.target.value) as 301 | 302,
                  }))
                }
                disabled={saving}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value={301}>301 Permanent</option>
                <option value={302}>302 Temporary</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => void handleAdd()}
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewRedirect(DEFAULT_REDIRECT);
                  setError("");
                }}
                disabled={saving}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>

          <p className="px-5 pb-5 text-xs text-gray-400">
            Use local paths beginning with /. Example: /old-page to /new-page.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search source URL, destination URL or status..."
            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {search && (
          <p className="mt-2 text-xs text-gray-500">
            Showing {filteredRedirects.length} of {redirects.length} redirects
          </p>
        )}
      </div>

      {/* Redirect Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              Redirect Rules
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {redirects.length} configured rules
            </p>
          </div>

          {saving && (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-600">
              <Loader2 size={14} className="animate-spin" />
              Saving changes...
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center gap-3 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Loading redirects...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    From
                  </th>
                  <th className="w-12 p-4 text-center" />
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    To
                  </th>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="p-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRedirects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-14 text-center">
                      <Link2 className="mx-auto mb-3 h-9 w-9 text-gray-300" />
                      <p className="font-medium text-gray-600">
                        No redirects found
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        {search
                          ? "Try a different search term."
                          : "Add your first redirect to get started."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRedirects.map((redirect) => {
                    const isEditing =
                      editing !== null &&
                      editingOriginal === redirect.from;

                    return (
                      <tr
                        key={redirect.from}
                        className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70"
                      >
                        <td className="p-4">
                          {isEditing && editing ? (
                            <input
                              value={editing.from}
                              onChange={(event) =>
                                setEditing((previous) =>
                                  previous
                                    ? {
                                        ...previous,
                                        from: event.target.value,
                                      }
                                    : null
                                )
                              }
                              disabled={saving}
                              aria-label="Edit source URL"
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm outline-none focus:border-blue-500"
                            />
                          ) : (
                            <code className="break-all rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                              {redirect.from}
                            </code>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          <ArrowRight
                            size={17}
                            className="mx-auto text-gray-400"
                          />
                        </td>

                        <td className="p-4">
                          {isEditing && editing ? (
                            <input
                              value={editing.to}
                              onChange={(event) =>
                                setEditing((previous) =>
                                  previous
                                    ? {
                                        ...previous,
                                        to: event.target.value,
                                      }
                                    : null
                                )
                              }
                              disabled={saving}
                              aria-label="Edit destination URL"
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm outline-none focus:border-blue-500"
                            />
                          ) : (
                            <code className="break-all rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                              {redirect.to}
                            </code>
                          )}
                        </td>

                        <td className="p-4">
                          {isEditing && editing ? (
                            <select
                              value={editing.status}
                              onChange={(event) =>
                                setEditing((previous) =>
                                  previous
                                    ? {
                                        ...previous,
                                        status: Number(
                                          event.target.value
                                        ) as 301 | 302,
                                      }
                                    : null
                                )
                              }
                              disabled={saving}
                              aria-label="Edit redirect status"
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            >
                              <option value={301}>301</option>
                              <option value={302}>302</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                redirect.status === 301
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {redirect.status}
                              {redirect.status === 301
                                ? " Permanent"
                                : " Temporary"}
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex justify-end gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleUpdate()}
                                  disabled={saving}
                                  aria-label="Save redirect"
                                  title="Save"
                                  className="rounded-lg p-2 text-green-600 transition hover:bg-green-50 disabled:opacity-40"
                                >
                                  {saving ? (
                                    <Loader2
                                      size={18}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Save size={18} />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditing(null);
                                    setEditingOriginal("");
                                    setError("");
                                  }}
                                  disabled={saving}
                                  aria-label="Cancel editing"
                                  title="Cancel"
                                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
                                >
                                  <X size={18} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEdit(redirect)}
                                  disabled={saving}
                                  aria-label="Edit redirect"
                                  title="Edit"
                                  className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 disabled:opacity-40"
                                >
                                  <Edit3 size={18} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDelete(redirect.from)
                                  }
                                  disabled={saving}
                                  aria-label="Delete redirect"
                                  title="Delete"
                                  className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SEO Information */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">
            Redirect Best Practices
          </h3>
        </div>

        <ul className="mt-3 space-y-2 text-sm leading-6 text-blue-900/80">
          <li>
            <strong>301:</strong> Use for permanent URL changes when the
            replacement page is relevant.
          </li>
          <li>
            <strong>302:</strong> Use when the redirect is temporary.
          </li>
          <li>
            Redirect old URLs to the closest relevant replacement page.
          </li>
          <li>
            Avoid redirect chains and redirect loops.
          </li>
          <li>
            Update internal links and your sitemap after permanent URL changes.
          </li>
        </ul>
      </div>
    </div>
  );
}
