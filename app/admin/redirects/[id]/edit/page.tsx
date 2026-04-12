'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface RedirectFormData {
  fromPath: string;
  toPath: string;
  statusCode: number;
  status: boolean;
}

export default function EditRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<RedirectFormData>({
    fromPath: '',      // ✅ Empty string as default, NOT undefined
    toPath: '',        // ✅ Empty string as default
    statusCode: 301,
    status: true,
  });

  useEffect(() => {
    fetchRedirect();
  }, [id]);

  const fetchRedirect = async () => {
    try {
      const res = await fetch(`/api/admin/redirects/${id}`);
      const data = await res.json();
      
      // ✅ Ensure all values have proper defaults
      setFormData({
        fromPath: data.fromPath || '',
        toPath: data.toPath || '',
        statusCode: data.statusCode || 301,
        status: data.status ?? true,
      });
    } catch (error) {
      console.error('Error fetching redirect:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/redirects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPath: formData.toPath,
          statusCode: formData.statusCode,
        }),
      });

      if (res.ok) {
        router.push('/admin/redirects');
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Error updating redirect');
      }
    } catch (error) {
      console.error('Error updating redirect:', error);
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const res = await fetch(`/api/admin/redirects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: !formData.status }),
      });

      if (res.ok) {
        setFormData({ ...formData, status: !formData.status });
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Something went wrong');
    }
  };

  if (fetching) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading redirect details...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/redirects" className="text-blue-600 hover:text-blue-800">
          ← Back to Redirects
        </Link>
        <h1 className="text-2xl font-bold mt-2">Edit Redirect</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Old URL (From Path)
          </label>
          <input
            type="text"
            value={formData.fromPath}  // ✅ Always a string, never undefined
            disabled
            className="w-full px-3 py-2 border rounded-md bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            From path cannot be changed
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            New URL (To Path) *
          </label>
          <input
            type="text"
            value={formData.toPath}    // ✅ Always a string
            onChange={(e) => setFormData({ ...formData, toPath: e.target.value })}
            placeholder="/new-page-url"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Redirect Type
          </label>
          <select
            value={formData.statusCode}
            onChange={(e) => setFormData({ ...formData, statusCode: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={301}>301 - Permanent Redirect</option>
            <option value={302}>302 - Temporary Redirect</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Status:</span>
            <button
              type="button"
              onClick={handleToggleStatus}
              className={`px-3 py-1 rounded text-sm ${
                formData.status
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
            >
              {formData.status ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Redirect'}
          </button>
          <Link
            href="/admin/redirects"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}