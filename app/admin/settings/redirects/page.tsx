// app/admin/settings/redirects/page.tsx
"use client";
import { useState, useEffect } from "react";
import { Trash2, Edit, Plus, Save, X, RefreshCw } from "lucide-react";

interface RedirectRule {
  from: string;
  to: string;
  status: 301 | 302;
}

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<RedirectRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<RedirectRule | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newRedirect, setNewRedirect] = useState<RedirectRule>({
    from: "",
    to: "",
    status: 301,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRedirects();
  }, []);

  const fetchRedirects = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/admin/redirects');
      const data = await res.json();
      
      if (data.success && Array.isArray(data.data)) {
        setRedirects(data.data);
      } else if (Array.isArray(data)) {
        setRedirects(data);
      } else {
        console.error('Unexpected response:', data);
        setRedirects([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load redirects');
      setRedirects([]);
    } finally {
      setLoading(false);
    }
  };

  const saveRedirects = async (newRedirects: RedirectRule[]) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch('/api/admin/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirects: newRedirects }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setRedirects(newRedirects);
        setMessage(data.message || "Saved successfully");
        setTimeout(() => setMessage(""), 3000);
        return true;
      } else {
        setError(data.error || "Failed to save");
        return false;
      }
    } catch (error) {
      console.error('Save error:', error);
      setError("Error saving redirects");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newRedirect.from || !newRedirect.to) {
      setError("Both fields are required");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    const updated = [...redirects, newRedirect];
    const success = await saveRedirects(updated);
    if (success) {
      setNewRedirect({ from: "", to: "", status: 301 });
      setIsAdding(false);
    }
  };

  const handleDelete = async (from: string) => {
    const updatedList = redirects.filter(r => r.from !== from);
    await saveRedirects(updatedList);
  };

  const handleUpdate = async (oldFrom: string, updated: RedirectRule) => {
    const updatedList = redirects.map(r => 
      r.from === oldFrom ? updated : r
    );
    await saveRedirects(updatedList);
    setEditing(null);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading redirects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">URL Redirects</h1>
          <p className="text-gray-500 mt-1">Manage 301/302 redirects for SEO</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Redirect
          </button>
          <button
            onClick={fetchRedirects}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From URL</label>
              <input
                type="text"
                value={newRedirect.from}
                onChange={(e) => setNewRedirect({ ...newRedirect, from: e.target.value })}
                placeholder="/old-page"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To URL</label>
              <input
                type="text"
                value={newRedirect.to}
                onChange={(e) => setNewRedirect({ ...newRedirect, to: e.target.value })}
                placeholder="/new-page"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={newRedirect.status}
                onChange={(e) => setNewRedirect({ ...newRedirect, status: Number(e.target.value) as 301 | 302 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={301}>301 Permanent</option>
                <option value={302}>302 Temporary</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAdd}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Add'}
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">From URL</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">To URL</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {redirects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No redirects configured. Click &quot;Add Redirect&quot; to create one.
                </td>
              </tr>
            ) : (
              redirects.map((redirect) => (
                <tr key={redirect.from}>
                  <td className="px-6 py-3 font-mono text-sm">
                    {editing?.from === redirect.from ? (
                      <input
                        type="text"
                        value={editing.from}
                        onChange={(e) => setEditing({ ...editing, from: e.target.value })}
                        className="w-full px-2 py-1 border rounded font-mono text-sm"
                      />
                    ) : (
                      <code className="bg-gray-100 px-2 py-1 rounded">{redirect.from}</code>
                    )}
                  </td>
                  <td className="px-6 py-3 font-mono text-sm">
                    {editing?.from === redirect.from ? (
                      <input
                        type="text"
                        value={editing.to}
                        onChange={(e) => setEditing({ ...editing, to: e.target.value })}
                        className="w-full px-2 py-1 border rounded font-mono text-sm"
                      />
                    ) : (
                      <code className="bg-gray-100 px-2 py-1 rounded">{redirect.to}</code>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {editing?.from === redirect.from ? (
                      <select
                        value={editing.status}
                        onChange={(e) => setEditing({ ...editing, status: Number(e.target.value) as 301 | 302 })}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value={301}>301</option>
                        <option value={302}>302</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        redirect.status === 301 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {redirect.status} {redirect.status === 301 ? 'Permanent' : 'Temporary'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      {editing?.from === redirect.from ? (
                        <>
                          <button
                            onClick={() => handleUpdate(redirect.from, editing)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditing(redirect)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(redirect.from)}
                            disabled={saving}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">📖 SEO Guidelines</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>301 Permanent:</strong> Page deleted permanently, moved to new URL (transfers SEO ranking)</li>
          <li>• <strong>302 Temporary:</strong> Page temporarily moved (e.g., seasonal content)</li>
          <li>• Redirects are handled at edge level - ultra fast</li>
          <li>• Use <strong>301</strong> for Google Search Console deleted pages</li>
        </ul>
      </div>

      {message && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
            {message}
          </div>
        </div>
      )}
    </div>
  );
}
