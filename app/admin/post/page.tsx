// app/admin/post/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit, 
  Eye, 
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown
} from 'lucide-react';

// Helper function to get correct URL folder name
const getUrlFolder = (type: string): string => {
  const typeMap: Record<string, string> = {
    'scholarship': 'scholarships',
    'admission': 'admissions',
    'result': 'results',
    'job': 'jobs',
    'date_sheet': 'date-sheets',
    'news': 'news',
    'blog': 'blog'
  };
  return typeMap[type] || type;
};

// Cache groups configuration
const CACHE_GROUPS = [
  { 
    id: 'all', 
    name: 'All Cache', 
    description: 'Clear entire website cache',
    icon: '🗑️',
    tags: ['homepage', 'posts-type-admission', 'posts-type-result', 'posts-type-news', 'posts-type-date_sheet', 'posts-type-scholarship', 'posts-type-job', 'posts-type-blog', 'posts-featured', 'posts-popular', 'posts-recent'],
    paths: ['/', '/news', '/admissions', '/results', '/jobs', '/scholarships', '/date-sheets']
  },
  { 
    id: 'admissions', 
    name: 'Admissions', 
    description: 'Clear admissions related cache',
    icon: '🎓',
    tags: ['posts-type-admission', 'posts-featured', 'homepage'],
    paths: ['/', '/admissions']
  },
  { 
    id: 'results', 
    name: 'Results', 
    description: 'Clear results related cache',
    icon: '📊',
    tags: ['posts-type-result', 'posts-featured', 'homepage'],
    paths: ['/', '/results']
  },
  { 
    id: 'news', 
    name: 'News', 
    description: 'Clear news related cache',
    icon: '📰',
    tags: ['posts-type-news', 'posts-featured', 'homepage'],
    paths: ['/', '/news']
  },
  { 
    id: 'date-sheets', 
    name: 'Date Sheets', 
    description: 'Clear date sheets related cache',
    icon: '📅',
    tags: ['posts-type-date_sheet', 'homepage'],
    paths: ['/', '/date-sheets']
  },
  { 
    id: 'scholarships', 
    name: 'Scholarships', 
    description: 'Clear scholarships related cache',
    icon: '💰',
    tags: ['posts-type-scholarship', 'posts-featured', 'homepage'],
    paths: ['/', '/scholarships']
  },
  { 
    id: 'jobs', 
    name: 'Jobs', 
    description: 'Clear jobs related cache',
    icon: '💼',
    tags: ['posts-type-job', 'posts-featured', 'homepage'],
    paths: ['/', '/jobs']
  },
  { 
    id: 'homepage', 
    name: 'Homepage Only', 
    description: 'Clear only homepage cache',
    icon: '🏠',
    tags: ['homepage'],
    paths: ['/']
  },
];

interface Post {
  id: number;
  slug: string;
  type: string;
  title: string;
  status: string | null;
  isFeatured: boolean | null;
  isPopular: boolean | null;
  isBreaking: boolean | null;
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
  const [clearDropdownOpen, setClearDropdownOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Check if post is expired
  const isPostExpired = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Show temporary message
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Selective Cache Clear Function
  const clearCache = async (cacheGroup: typeof CACHE_GROUPS[0]) => {
    setClearingCache(true);
    setClearDropdownOpen(false);
    setMessage(null);
    
    try {
      const res = await fetch('/api/admin/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tags: cacheGroup.tags,
          paths: cacheGroup.paths,
          groupId: cacheGroup.id,
          groupName: cacheGroup.name
        }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch {
        console.log('API response issue');
        showMessage('success', `✅ ${cacheGroup.name} cache cleared! (Manual refresh may be needed)`);
        await fetchPosts();
        setClearingCache(false);
        return;
      }
      
      if (data?.success) {
        showMessage('success', `✅ ${cacheGroup.name} cache cleared successfully!`);
        await fetchPosts();
      } else {
        showMessage('error', data?.error || `❌ Failed to clear ${cacheGroup.name} cache`);
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      showMessage('error', `❌ Error clearing ${cacheGroup.name} cache`);
    } finally {
      setClearingCache(false);
    }
  };

  // Fetch posts
  const fetchPosts = useCallback(async () => {
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
      } else {
        showMessage('error', 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      showMessage('error', 'Error fetching posts');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, search, page, limit]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
        await fetchPosts();
        showMessage('success', `✅ "${title}" deleted successfully`);
      } else {
        showMessage('error', data.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showMessage('error', 'Something went wrong');
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
    
    let successCount = 0;
    let failCount = 0;
    
    try {
      for (const id of selectedIds) {
        const res = await fetch(`/api/admin/post/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          failCount++;
        }
      }
      
      setSelectedIds([]);
      await fetchPosts();
      
      if (failCount === 0) {
        showMessage('success', `✅ ${successCount} post(s) deleted successfully!`);
      } else {
        showMessage('error', `⚠️ ${successCount} deleted, ${failCount} failed`);
      }
    } catch (error) {
      console.error('Error deleting posts:', error);
      showMessage('error', 'Failed to delete some posts');
    }
  };

  // Get type badge
  const getTypeBadge = (type: string) => {
    const config: Record<string, { color: string; icon: string }> = {
      admission: { color: 'bg-blue-100 text-blue-700', icon: '🎓' },
      result: { color: 'bg-green-100 text-green-700', icon: '📊' },
      news: { color: 'bg-red-100 text-red-700', icon: '📰' },
      date_sheet: { color: 'bg-orange-100 text-orange-700', icon: '📅' },
      scholarship: { color: 'bg-teal-100 text-teal-700', icon: '💰' },
      job: { color: 'bg-indigo-100 text-indigo-700', icon: '💼' },
      blog: { color: 'bg-purple-100 text-purple-700', icon: '✍️' },
    };
    return config[type] || { color: 'bg-gray-100 text-gray-700', icon: '📄' };
  };

  // Get status badge (including expired)
  const getStatusBadge = (status: string | null, expiresAt: string | null) => {
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return { color: 'bg-red-100 text-red-700', icon: '⚠️', label: 'Expired' };
    }
    if (status === 'published') return { color: 'bg-green-100 text-green-700', icon: '✅', label: 'Published' };
    if (status === 'draft') return { color: 'bg-yellow-100 text-yellow-700', icon: '📝', label: 'Draft' };
    if (status === 'archived') return { color: 'bg-gray-100 text-gray-700', icon: '📦', label: 'Archived' };
    return { color: 'bg-gray-100 text-gray-700', icon: '❓', label: 'Unknown' };
  };

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK');
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Message Toast */}
      {message && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-4 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Posts</h1>
            <p className="text-gray-500 mt-1">Create, edit, and manage all content across the platform</p>
          </div>
          <div className="flex gap-3">
            {/* Selective Clear Cache Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setClearDropdownOpen(!clearDropdownOpen)}
                disabled={clearingCache}
                className="px-4 py-2 border border-orange-300 rounded-lg hover:bg-orange-50 transition text-orange-700 flex items-center gap-2 disabled:opacity-50"
              >
                {clearingCache ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Clear Cache
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
              
              {/* Dropdown Menu */}
              {clearDropdownOpen && !clearingCache && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setClearDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="p-2 border-b border-gray-100 bg-gray-50">
                      <p className="text-xs text-gray-500 font-medium">Select cache to clear</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {CACHE_GROUPS.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => clearCache(group)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center gap-3 group"
                        >
                          <div className="text-2xl">{group.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 text-sm">{group.name}</div>
                            <div className="text-xs text-gray-400">{group.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                      <p className="text-xs text-gray-400">Select specific cache type for faster clearing</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={() => fetchPosts()}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            
            {/* Create Button */}
            <Link
              href="/admin/post/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Post
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Post Type</label>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by title or slug..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterType('');
                setFilterStatus('');
                setSearch('');
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 rounded-lg p-3 mb-4 flex items-center justify-between border border-red-200">
          <span className="text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {selectedIds.length} post(s) selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </button>
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                    <p>Loading posts...</p>
                   </td>
                 </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <div className="text-5xl mb-3">📭</div>
                    <p>No posts found</p>
                    <Link
                      href="/admin/post/create"
                      className="inline-block mt-3 text-blue-600 hover:text-blue-700"
                    >
                      Create your first post →
                    </Link>
                    </td>
                 </tr>
              ) : (
                posts.map((post) => {
                  const typeConfig = getTypeBadge(post.type);
                  const statusConfig = getStatusBadge(post.status, post.expiresAt);
                  const isExpired = isPostExpired(post.expiresAt);
                  const hasExpiryDate = post.expiresAt !== null && post.expiresAt !== '';
                  
                  return (
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
                            className={`font-medium hover:text-blue-600 transition line-clamp-1 ${
                              isExpired ? 'text-red-600' : 'text-gray-900'
                            }`}
                          >
                            {post.title}
                            {isExpired && <span className="ml-2 text-xs text-red-500">(Expired)</span>}
                          </Link>
                          
                          {/* Slug with expiry info */}
                          <div className="flex items-center gap-2 mt-0.5">
                            <code className="text-xs text-gray-400">
                              /{getUrlFolder(post.type)}/{post.slug}
                            </code>
                            {isExpired ? (
                              <span className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Expired: {formatDate(post.expiresAt)}
                              </span>
                            ) : hasExpiryDate ? (
                              <span className="text-xs text-green-500 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Expires: {formatDate(post.expiresAt)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                No expiry date
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                          <span className="mr-1">{typeConfig.icon}</span>
                          {post.type === 'date_sheet' ? 'Date Sheet' : 
                           post.type === 'admission' ? 'Admission' :
                           post.type === 'scholarship' ? 'Scholarship' :
                           post.type === 'news' ? 'News' :
                           post.type === 'result' ? 'Result' :
                           post.type === 'job' ? 'Job' : 'Blog'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${statusConfig.color}`}>
                          <span>{statusConfig.icon}</span>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/post/${post.id}/edit`}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/${getUrlFolder(post.type)}/${post.slug}`}
                            target="_blank"
                            className="text-green-600 hover:text-green-800"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id, post.title)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Footer */}
      <div className="mt-6 text-center text-sm text-gray-400">
        Total {total} post(s) • Showing {posts.length} on page {page}
      </div>
    </div>
  );
}