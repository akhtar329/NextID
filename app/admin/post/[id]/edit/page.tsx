// app/admin/post/[id]/edit/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const POST_TYPES = [
  { value: 'admission', label: 'Admission', icon: '🎓', color: 'blue' },
  { value: 'result', label: 'Result', icon: '📊', color: 'green' },
  { value: 'news', label: 'News', icon: '📰', color: 'red' },
  { value: 'date_sheet', label: 'Date Sheet', icon: '📅', color: 'purple' },
  { value: 'scholarship', label: 'Scholarship', icon: '💰', color: 'yellow' },
  { value: 'job', label: 'Job', icon: '💼', color: 'indigo' },
  { value: 'blog', label: 'Blog', icon: '📝', color: 'gray' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-700' },
];

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    slug: '',
    type: 'news',
    title: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    status: 'draft',
    isFeatured: false,
    isPopular: false,
    isBreaking: false,
    publishedAt: '',
    meta: {},
    tags: [],
  });

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/admin/post/${id}`);
        const data = await res.json();
        
        if (data.success && data.post) {
          const post = data.post;
          setFormData({
            slug: post.slug || '',
            type: post.type || 'news',
            title: post.title || '',
            content: post.content || '',
            excerpt: post.excerpt || '',
            featuredImage: post.featuredImage || '',
            status: post.status || 'draft',
            isFeatured: post.isFeatured || false,
            isPopular: post.isPopular || false,
            isBreaking: post.isBreaking || false,
            publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            meta: post.meta || {},
            tags: post.tags || [],
          });
        } else {
          setError('Post not found');
        }
      } catch (err) {
        setError('Failed to fetch post');
      } finally {
        setFetching(false);
      }
    };
    
    fetchPost();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/post/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess('Post updated successfully! Redirecting...');
        setTimeout(() => {
          router.push('/admin/post');
        }, 1500);
      } else {
        setError(data.error || 'Failed to update post');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error}</p>
          <Link href="/admin/post" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to Posts
          </Link>
        </div>
      </div>
    );
  }

  // Get current post type display
  const currentType = POST_TYPES.find(t => t.value === formData.type);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
            <p className="text-gray-500 mt-1">Update your content (slug and type cannot be changed)</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/post"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
            >
              Cancel
            </Link>
            <Link
              href={`/${formData.type}s/${formData.slug}`}
              target="_blank"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              View Post
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-700">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Post Type - Read Only */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Post Type * (Read Only)</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg border border-gray-200">
                    <span className="text-xl">{currentType?.icon}</span>
                    <span className="font-medium text-gray-700">{currentType?.label}</span>
                    <span className="text-xs text-gray-400 ml-2">({formData.type})</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400">Post type cannot be changed after creation</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">The type determines where this post appears on the website</p>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter post title"
              />
            </div>

            {/* Slug - Read Only */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Slug (Read Only)</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded">/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      disabled
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-400">Slug cannot be changed after creation</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">URL-friendly version of the title (permanently set)</p>
            </div>

            {/* Featured Image */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image URL</label>
              <input
                type="text"
                value={formData.featuredImage}
                onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
              {formData.featuredImage && (
                <div className="mt-2">
                  <img src={formData.featuredImage} alt="Preview" className="h-20 w-auto rounded border" />
                </div>
              )}
            </div>

            {/* Excerpt */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt (Short Description)</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief summary of the post..."
              />
              <p className="text-xs text-gray-400 mt-1">This will appear in listings and search results</p>
            </div>

            {/* Content */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={15}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your content here (HTML supported)..."
              />
              <p className="text-xs text-gray-400 mt-1">HTML tags are supported (h1, p, ul, li, etc.)</p>
            </div>

            {/* Status & Publish Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Publish Date</label>
                <input
                  type="date"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">⭐ Featured Post</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPopular}
                  onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">🔥 Popular Post</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isBreaking}
                  onChange={(e) => setFormData({ ...formData, isBreaking: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">⚡ Breaking News</span>
              </label>
            </div>

            {/* Post ID Info */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">Post ID:</span>
                <span className="font-mono text-gray-700">{id}</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">Type:</span>
                <span className="font-medium text-gray-700">{formData.type}</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">Slug:</span>
                <span className="font-mono text-gray-700">{formData.slug}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <Link
                href="/admin/post"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Update Post'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}