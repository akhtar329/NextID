// app/admin/settings/redirects/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  RefreshCw,
  ArrowRight,
  Search,
} from "lucide-react";

interface RedirectRule {
  from: string;
  to: string;
  status: 301 | 302;
}

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<RedirectRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [isAdding, setIsAdding] = useState(false);

  const [newRedirect, setNewRedirect] = useState<RedirectRule>({
    from: "",
    to: "",
    status: 301,
  });

  const [editing, setEditing] = useState<RedirectRule | null>(null);
  const [editingOriginal, setEditingOriginal] = useState("");

  useEffect(() => {
    fetchRedirects();
  }, []);

  async function fetchRedirects() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/redirects", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data?.success) {
        setRedirects(data.data || []);
      } else {
        setError(data?.error || "Failed to load redirects");
      }
    } catch {
      setError("Failed to load redirects");
    } finally {
      setLoading(false);
    }
  }

  async function saveRedirects(updatedRedirects: RedirectRule[]) {
    try {
      setSaving(true);
      setError("");

      const res = await fetch("/api/admin/redirects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          redirects: updatedRedirects,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to save redirects");
        return false;
      }

      setRedirects(updatedRedirects);

      setMessage(data.message || "Redirects updated");
      setTimeout(() => setMessage(""), 3000);

      return true;
    } catch {
      setError("Failed to save redirects");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd() {
    if (!newRedirect.from.trim() || !newRedirect.to.trim()) {
      setError("From URL and To URL are required");
      return;
    }

    const updated = [...redirects, newRedirect];

    const success = await saveRedirects(updated);

    if (success) {
      setNewRedirect({
        from: "",
        to: "",
        status: 301,
      });

      setIsAdding(false);
    }
  }

  async function handleDelete(from: string) {
    const updated = redirects.filter((r) => r.from !== from);
    await saveRedirects(updated);
  }

  function startEdit(rule: RedirectRule) {
    setEditing({ ...rule });
    setEditingOriginal(rule.from);
  }

  async function handleUpdate() {
    if (!editing) return;

    const updated = redirects.map((r) =>
      r.from === editingOriginal ? editing : r
    );

    const success = await saveRedirects(updated);

    if (success) {
      setEditing(null);
      setEditingOriginal("");
    }
  }

  const filteredRedirects = useMemo(() => {
    if (!search.trim()) return redirects;

    return redirects.filter(
      (r) =>
        r.from.toLowerCase().includes(search.toLowerCase()) ||
        r.to.toLowerCase().includes(search.toLowerCase())
    );
  }, [redirects, search]);

  const total301 = redirects.filter((r) => r.status === 301).length;
  const total302 = redirects.filter((r) => r.status === 302).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Redirect Manager</h1>
          <p className="text-gray-500 mt-1">
            Manage SEO redirects from a single dashboard
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchRedirects}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Redirect
          </button>
        </div>
      </div>

      {/* Stats */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-5">
          <p className="text-gray-500 text-sm">Total Redirects</p>
          <h2 className="text-3xl font-bold mt-2">{redirects.length}</h2>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-gray-500 text-sm">301 Permanent</p>
          <h2 className="text-3xl font-bold text-green-600 mt-2">
            {total301}
          </h2>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-gray-500 text-sm">302 Temporary</p>
          <h2 className="text-3xl font-bold text-amber-600 mt-2">
            {total302}
          </h2>
        </div>
      </div>

      {/* Alerts */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          {message}
        </div>
      )}

      {/* Search */}

      <div className="bg-white border rounded-2xl p-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search redirects..."
            className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Add Form */}

      {isAdding && (
        <div className="bg-white border rounded-2xl p-5">
          <h2 className="font-semibold text-lg mb-4">Add Redirect</h2>

          <div className="grid lg:grid-cols-4 gap-4">
            <input
              value={newRedirect.from}
              onChange={(e) =>
                setNewRedirect({
                  ...newRedirect,
                  from: e.target.value,
                })
              }
              placeholder="/old-url"
              className="border rounded-xl px-4 py-3"
            />

            <input
              value={newRedirect.to}
              onChange={(e) =>
                setNewRedirect({
                  ...newRedirect,
                  to: e.target.value,
                })
              }
              placeholder="/new-url"
              className="border rounded-xl px-4 py-3"
            />

            <select
              value={newRedirect.status}
              onChange={(e) =>
                setNewRedirect({
                  ...newRedirect,
                  status: Number(e.target.value) as 301 | 302,
                })
              }
              className="border rounded-xl px-4 py-3"
            >
              <option value={301}>301 Permanent</option>
              <option value={302}>302 Temporary</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 bg-green-600 text-white rounded-xl py-3 hover:bg-green-700"
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                onClick={() => setIsAdding(false)}
                className="px-4 border rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}

      <div className="bg-white border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading redirects...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4">From</th>
                  <th className="text-center p-4"></th>
                  <th className="text-left p-4">To</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRedirects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center text-gray-500 py-10"
                    >
                      No redirects found
                    </td>
                  </tr>
                ) : (
                  filteredRedirects.map((redirect) => {
                    const isEditing =
                      editing &&
                      editingOriginal === redirect.from;

                    return (
                      <tr
                        key={redirect.from}
                        className="border-b last:border-b-0"
                      >
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              value={editing.from}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  from: e.target.value,
                                })
                              }
                              className="w-full border rounded-lg px-3 py-2"
                            />
                          ) : (
                            <code>{redirect.from}</code>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          <ArrowRight size={18} />
                        </td>

                        <td className="p-4">
                          {isEditing ? (
                            <input
                              value={editing.to}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  to: e.target.value,
                                })
                              }
                              className="w-full border rounded-lg px-3 py-2"
                            />
                          ) : (
                            <code>{redirect.to}</code>
                          )}
                        </td>

                        <td className="p-4">
                          {isEditing ? (
                            <select
                              value={editing.status}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  status: Number(
                                    e.target.value
                                  ) as 301 | 302,
                                })
                              }
                              className="border rounded-lg px-3 py-2"
                            >
                              <option value={301}>301</option>
                              <option value={302}>302</option>
                            </select>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                redirect.status === 301
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {redirect.status}
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={handleUpdate}
                                  className="p-2 text-green-600"
                                >
                                  <Save size={18} />
                                </button>

                                <button
                                  onClick={() => {
                                    setEditing(null);
                                    setEditingOriginal("");
                                  }}
                                  className="p-2 text-gray-500"
                                >
                                  <X size={18} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(redirect)}
                                  className="p-2 text-blue-600"
                                >
                                  <Edit3 size={18} />
                                </button>

                                <button
                                  onClick={() =>
                                    handleDelete(redirect.from)
                                  }
                                  className="p-2 text-red-600"
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

      {/* Info */}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h3 className="font-semibold mb-2">
          Redirect Best Practices
        </h3>

        <ul className="space-y-2 text-sm text-gray-700">
          <li>301 = Permanent redirect (SEO value passes)</li>
          <li>302 = Temporary redirect</li>
          <li>Use 301 for deleted pages reported in Search Console</li>
          <li>Avoid redirect chains</li>
          <li>Redirect only when a relevant replacement exists</li>
        </ul>
      </div>
    </div>
  );
}