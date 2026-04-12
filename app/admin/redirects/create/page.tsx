'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateRedirectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromPath: '',    // ✅ Empty string
    toPath: '',      // ✅ Empty string
    statusCode: 301,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/admin/redirects');
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Error creating redirect');
      }
    } catch (error) {
      console.error('Error creating redirect:', error);
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/redirects" className="text-blue-600 hover:text-blue-800">
          ← Back to Redirects
        </Link>
        <h1 className="text-2xl font-bold mt-2">Create New Redirect</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Old URL (From Path) *
          </label>
          <input
            type="text"
            value={formData.fromPath}
            onChange={(e) => setFormData({ ...formData, fromPath: e.target.value })}
            placeholder="/old-page-url"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: /engineering-bs-program or /old-article
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            New URL (To Path) *
          </label>
          <input
            type="text"
            value={formData.toPath}
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
            <option value={301}>301 - Permanent Redirect (Best for SEO)</option>
            <option value={302}>302 - Temporary Redirect</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Redirect'}
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