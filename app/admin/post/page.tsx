// app/admin/post/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Post {
  id: number;
  slug: string;
  type: string;
  title: string;
  status: string | null;
  isFeatured: boolean | null;
  isPopular: boolean | null;
  isBreaking: boolean | null;
  viewCount: number | null;
  publishedAt: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  instituteName?: string | null;
  cityName?: string | null;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingCache, setClearingCache] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // ✅ Clear Cache Function
  const clearCache = async () => {
    setClearingCache(true);
    try {
      const res = await fetch('/api/admin/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tags: [
            'homepage',
            'posts-type-admission',
            'posts-type-result',
            'posts-type-news',
            'posts-type-date_sheet',
            'posts-type-scholarship',
            'posts-type-job',
            'posts-type-blog',
            'posts-featured',
            'posts-popular',
            'posts-recent',
          ]
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Cache cleared successfully!');
        await fetchPosts();
      } else {
        alert('❌ Failed to clear cache');
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('❌ Error clearing cache');
    } finally {
      setClearingCache(false);
    }
  };

  // ✅ Fetch posts - Simplified without useCallback to avoid React Compiler warning
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      if (search) params.append('search', search);
      params.append('limit', limit.toString());
      params.append('offset', ((page - 1) * limit).toString());
      
      const res = await fetch(`/api/admin/post?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setPosts(data.posts);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Use useEffect with dependency array - React Compiler friendly
  useEffect(() => {
    // Skip initial mount if needed, or just fetch
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterStatus, search, page, limit]);

  // Handle single delete
  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete post "${title}"? This action cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/api/admin/post/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        setSelectedIds(prev => prev.filter(pid => pid !== id));
        fetchPosts();
      } else {
        alert(data.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Something went wrong');
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(posts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Handle single select
  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} post(s)? This action cannot be undone.`)) return;
    
    try {
      for (const id of selectedIds) {
        await fetch(`/api/admin/post/${id}`, { method: 'DELETE' });
      }
      setSelectedIds([]);
      fetchPosts();
      alert(`✅ ${selectedIds.length} post(s) deleted successfully!`);
    } catch (error) {
      console.error('Error deleting posts:', error);
      alert('Failed to delete some posts');
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    await fetchPosts();
  };

  // Get type badge color
  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      admission: 'bg-blue-100 text-blue-700',
      result: 'bg-green-100 text-green-700',
      news: 'bg-red-100 text-red-700',
      date_sheet: 'bg-purple-100 text-purple-700',
      scholarship: 'bg-yellow-100 text-yellow-700',
      job: 'bg-indigo-100 text-indigo-700',
      blog: 'bg-gray-100 text-gray-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  // Get status badge
  const getStatusBadge = (status: string | null) => {
    if (status === 'published') return 'bg-green-100 text-green-700';
    if (status === 'draft') return 'bg-yellow-100 text-yellow-700';
    if (status === 'archived') return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK');
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Posts</h1>
          <p className="text-gray-500 mt-1">Create, edit, and manage all content</p>
        </div>
        <div className="flex gap-3">
          {/* ✅ Clear Cache Button */}
          <button
            onClick={clearCache}
            disabled={clearingCache}
            className="px-4 py-2 border border-orange-300 rounded-lg hover:bg-orange-50 transition text-orange-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clearingCache ? (
              <>
                <svg className="animate-spin h-4 w-4 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Clearing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Cache
              </>
            )}
          </button>
          
          {/* ✅ Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg 
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <Link
            href="/admin/post/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Post
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Post Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="admission">Admissions</option>
              <option value="result">Results</option>
              <option value="news">News</option>
              <option value="date_sheet">Date Sheets</option>
              <option value="scholarship">Scholarships</option>
              <option value="job">Jobs</option>
              <option value="blog">Blogs</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or slug..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setFilterType('');
                setFilterStatus('');
                setSearch('');
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-red-700">{selectedIds.length} post(s) selected</span>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === posts.length && posts.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Views</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2">Loading...</p>
                   </td>
                 </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No posts found
                   </td>
                 </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(post.id)}
                        onChange={() => toggleSelect(post.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                     </td>
                    <td className="px-4 py-3">
                      <div>
                        <Link
                          href={`/admin/post/${post.id}/edit`}
                          className="font-medium text-gray-900 hover:text-blue-600 transition line-clamp-1"
                        >
                          {post.title}
                        </Link>
                        <div className="text-xs text-gray-400 mt-1">/{post.type}/{post.slug}</div>
                        {post.expiresAt && (
                          <div className="text-xs text-orange-500 mt-1">
                            Expires: {formatDate(post.expiresAt)}
                          </div>
                        )}
                      </div>
                     </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(post.type)}`}>
                        {post.type}
                      </span>
                     </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(post.status)}`}>
                        {post.status || 'draft'}
                      </span>
                     </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {post.viewCount || 0}
                     </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(post.createdAt)}
                     </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/post/${post.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/${post.type}/${post.slug}`}
                          target="_blank"
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}