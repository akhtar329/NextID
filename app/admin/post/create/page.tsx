// app/admin/post/create/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/Image/ImageUpload';

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

export default function CreatePostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const today = new Date().toISOString().split('T')[0];

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
    publishedAt: today,
    expiresAt: '',
    meta: {},
    tags: [],
  });

  const [slugCheck, setSlugCheck] = useState({ available: true, checking: false, message: '' });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  };

  const handleTitleChange = (title: string) => {
    const slug = generateSlug(title);
    setFormData({ ...formData, title, slug });
    if (slug) checkSlug(slug);
  };

  const handleSlugChange = (slug: string) => {
    setFormData({ ...formData, slug });
    if (slug) checkSlug(slug);
  };

  const checkSlug = async (slug: string) => {
    if (!slug) return;
    setSlugCheck({ ...slugCheck, checking: true, message: 'Checking...' });
    try {
      const res = await fetch('/api/admin/post/check-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      setSlugCheck({
        available: data.isAvailable,
        checking: false,
        message: data.isAvailable ? '✓ Available' : '✗ Already exists',
      });
    } catch {
      setSlugCheck({ available: true, checking: false, message: 'Unable to check' });
    }
  };

  const handleImageSelect = (url: string, alt: string) => {
    setFormData({ ...formData, featuredImage: url });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!slugCheck.available) {
      setError('Please choose a different slug');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/post/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess('Post created successfully! Redirecting...');
        setTimeout(() => {
          router.push('/admin/post');
        }, 1500);
      } else {
        setError(data.error || 'Failed to create post');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setExpiryDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setFormData({ ...formData, expiresAt: date.toISOString().split('T')[0] });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
            <p className="text-gray-500 mt-1">Add new content to your website</p>
          </div>
          <Link
            href="/admin/post"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
          >
            Cancel
          </Link>
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
            {/* Post Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Post Type *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {POST_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      formData.type === type.value
                        ? `bg-${type.color}-600 text-white shadow-md`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{type.icon}</span> {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter post title"
              />
            </div>

            {/* Slug */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded">/</span>
                    <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded">
                      {formData.type}
                    </span>
                    <span className="text-gray-500 text-sm">/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      required
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="post-url-slug"
                    />
                  </div>
                </div>
                {slugCheck.message && (
                  <span className={`text-sm ${slugCheck.available ? 'text-green-600' : 'text-red-600'}`}>
                    {slugCheck.message}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                URL: <span className="text-blue-600">https://www.nextid.pk/{formData.type}/{formData.slug || '...'}</span>
              </p>
            </div>

            {/* Featured Image - ImageUpload Component */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image</label>
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={formData.featuredImage}
                postSlug={formData.slug}
                postTitle={formData.title}
              />
              <p className="text-xs text-gray-400 mt-2">
                Image will be auto-compressed to WebP format and named as: <strong>{formData.slug || 'post-slug'}.webp</strong>
              </p>
            </div>

            {/* Excerpt */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief summary of the post (will appear in listings)..."
              />
              <p className="text-xs text-gray-400 mt-1">Recommended: 150-160 characters for SEO</p>
            </div>

            {/* Content */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={15}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your content here (HTML supported)..."
              />
              <p className="text-xs text-gray-400 mt-1">HTML tags supported: h1, p, ul, li, a, strong, em, etc.</p>
            </div>

            {/* Status, Publish Date & Expiry Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date 
                  <span className="text-xs text-gray-400 ml-1">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setExpiryDate(7)}
                    className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    +7 days
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiryDate(30)}
                    className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    +30 days
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiryDate(90)}
                    className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    +90 days
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, expiresAt: '' })}
                    className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    Clear
                  </button>
                </div>
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

            {/* Info Box */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">📌 Post Information</h4>
              <p className="text-sm text-blue-700">
                Your post will be available at:
                <code className="block bg-white px-2 py-1 rounded text-sm mt-1 font-mono">
                  https://www.nextid.pk/{formData.type}/{formData.slug || 'your-slug'}
                </code>
              </p>
              <p className="text-sm text-green-700 mt-2">
                📸 Image will be saved as: <strong>{formData.slug || 'post-slug'}.webp</strong>
              </p>
              {formData.expiresAt && (
                <p className="text-sm text-orange-700 mt-2">
                  ⚠️ This post will expire on: <strong>{new Date(formData.expiresAt).toLocaleDateString()}</strong>
                </p>
              )}
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
                disabled={loading || !slugCheck.available}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Post'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}