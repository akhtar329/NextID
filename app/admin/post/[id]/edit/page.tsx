// app/admin/post/[id]/edit/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/Image/ImageUpload';

// ==================== HELPERS ====================
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

const POST_TYPES = [
  { value: 'admission', label: 'Admission', icon: '🎓' },
  { value: 'result', label: 'Result', icon: '📊' },
  { value: 'news', label: 'News', icon: '📰' },
  { value: 'date_sheet', label: 'Date Sheet', icon: '📅' },
  { value: 'scholarship', label: 'Scholarship', icon: '💰' },
  { value: 'job', label: 'Job', icon: '💼' },
  { value: 'blog', label: 'Blog', icon: '📝' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: '📝 Draft' },
  { value: 'published', label: '🚀 Published' },
  { value: 'archived', label: '📦 Archived' },
];

// ==================== ACTION BUTTONS COMPONENT (FIXED) ====================
const ActionButtons = ({ loading, postType, postSlug }: { loading: boolean; postType: string; postSlug: string }) => (
  <div className="flex gap-3">
    <Link
      href="/admin/post"
      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-center"
    >
      Cancel
    </Link>
    <Link
      href={`/${getUrlFolder(postType)}/${postSlug}`}
      target="_blank"
      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center"
    >
      View Post
    </Link>
    <button
      type="submit"
      disabled={loading}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Updating...
        </>
      ) : (
        '💾 Update Post'
      )}
    </button>
  </div>
);

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showGooglePreview, setShowGooglePreview] = useState(true);

  // ==================== FORM STATE ====================
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    type: 'news',
    featuredImage: '',
    status: 'draft',
    isFeatured: false,
    isPopular: false,
    isBreaking: false,
    publishedAt: '',
    expiresAt: '',
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    ogTitle: '',
    ogDescription: '',
    twitterTitle: '',
    twitterDescription: '',
  });

  const [charCount, setCharCount] = useState({ title: 0, desc: 0 });

  // ==================== FETCH POST DATA ====================
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/admin/post/${id}`);
        const data = await res.json();
        
        if (data.success && data.post) {
          const post = data.post;
          setFormData({
            title: post.title || '',
            slug: post.slug || '',
            content: post.content || '',
            excerpt: post.excerpt || '',
            type: post.type || 'news',
            featuredImage: post.featuredImage || '',
            status: post.status || 'draft',
            isFeatured: post.isFeatured || false,
            isPopular: post.isPopular || false,
            isBreaking: post.isBreaking || false,
            publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            expiresAt: post.expiresAt ? new Date(post.expiresAt).toISOString().split('T')[0] : '',
            metaTitle: post.metaTitle || '',
            metaDescription: post.metaDescription || '',
            focusKeyword: post.focusKeyword || '',
            ogTitle: post.ogTitle || '',
            ogDescription: post.ogDescription || '',
            twitterTitle: post.twitterTitle || '',
            twitterDescription: post.twitterDescription || '',
          });
          setCharCount({
            title: post.metaTitle?.length || 0,
            desc: post.metaDescription?.length || 0,
          });
        } else {
          setError('Post not found');
        }
      } catch {
        setError('Failed to fetch post');
      } finally {
        setFetching(false);
      }
    };
    
    fetchPost();
  }, [id]);

  // ==================== AUTO-GENERATE FUNCTIONS ====================
  const generateMetaTitle = (title: string) => {
    if (!title) return '';
    return title.length > 60 ? title.substring(0, 57) + '...' : title;
  };

  const generateMetaDescription = (content: string) => {
    if (!content) return '';
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 160 ? plainText.substring(0, 157) + '...' : plainText;
  };

  // ==================== HANDLERS ====================
  const handleTitleChange = (title: string) => {
    const metaTitle = generateMetaTitle(title);
    
    setFormData(prev => ({
      ...prev,
      title,
      metaTitle,
      ogTitle: metaTitle,
      twitterTitle: metaTitle,
    }));
    
    setCharCount(prev => ({ ...prev, title: metaTitle.length }));
  };

  const handleContentChange = (content: string) => {
    const metaDescription = generateMetaDescription(content);
    
    setFormData(prev => ({
      ...prev,
      content,
      metaDescription,
      ogDescription: metaDescription,
      twitterDescription: metaDescription,
    }));
    
    setCharCount(prev => ({ ...prev, desc: metaDescription.length }));
  };

  const handleImageSelect = (url: string) => {
    setFormData(prev => ({ ...prev, featuredImage: url }));
  };

  const setExpiryDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setFormData(prev => ({ ...prev, expiresAt: date.toISOString().split('T')[0] }));
  };

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
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== PREVIEW ====================
  const getSeoPreview = () => {
    const seoTitle = formData.metaTitle || formData.title || 'Your Title Here';
    const seoDesc = formData.metaDescription || formData.excerpt || formData.content?.substring(0, 160) || 'Your description will appear here...';
    const seoUrl = `https://www.nextid.pk/${getUrlFolder(formData.type)}/${formData.slug || 'example-post'}`;
    return { title: seoTitle, description: seoDesc, url: seoUrl };
  };

  const seoPreview = getSeoPreview();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header - Upper Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
            <p className="text-gray-500 mt-1">Update your post content and SEO settings</p>
          </div>
          {/* ✅ UPPER BUTTON */}
          <ActionButtons 
            loading={loading} 
            postType={formData.type}
            postSlug={formData.slug}
          />
        </div>

        {/* Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-700">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Rest of your form JSX (same as before) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* MAIN AREA */}
            <div className="lg:col-span-2 space-y-6">
              {/* Post Type - Readonly */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">📋 Post Type <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg border border-gray-200">
                      <span className="text-xl">{POST_TYPES.find(t => t.value === formData.type)?.icon}</span>
                      <span className="font-medium text-gray-700">{POST_TYPES.find(t => t.value === formData.type)?.label}</span>
                      <span className="text-xs text-gray-400 ml-2">({formData.type})</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">Post type cannot be changed</span>
                </div>
              </div>

              {/* Title */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">📝 Title <span className="text-red-500">*</span></label>
                <input type="text" value={formData.title} onChange={(e) => handleTitleChange(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter post title" />
                <p className="text-xs text-gray-400 mt-2">💡 This will auto-generate your meta title</p>
              </div>

              {/* Slug - Readonly */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">🔗 Slug <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded">/</span>
                      <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded">{getUrlFolder(formData.type)}</span>
                      <span className="text-gray-500 text-sm">/</span>
                      <input type="text" value={formData.slug} disabled className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-500 cursor-not-allowed" />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">Slug cannot be changed</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">URL: https://www.nextid.pk/{getUrlFolder(formData.type)}/{formData.slug}</p>
              </div>

              {/* Content */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">📄 Content <span className="text-red-500">*</span></label>
                <textarea value={formData.content} onChange={(e) => handleContentChange(e.target.value)} rows={12} required className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Write your content here (HTML supported)..." />
                <p className="text-xs text-gray-400 mt-2">💡 This will auto-generate your meta description</p>
              </div>

              {/* Excerpt */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">📌 Excerpt (Short Description)</label>
                <textarea value={formData.excerpt} onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Brief summary of your post..." />
                <p className="text-xs text-gray-400 mt-2">Used in blog listings and as fallback for meta description</p>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-6">
              {/* Featured Image */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">🖼️ Featured Image</label>
                <ImageUpload onImageSelect={handleImageSelect} currentImage={formData.featuredImage} postSlug={formData.slug} postTitle={formData.title} postType={formData.type} />
              </div>

              {/* Status & Flags */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">📊 Status</label>
                <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4">
                  {STATUS_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                    <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))} className="w-4 h-4" />
                    <span className="text-sm text-gray-700">⭐ Featured Post</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                    <input type="checkbox" checked={formData.isPopular} onChange={(e) => setFormData(prev => ({ ...prev, isPopular: e.target.checked }))} className="w-4 h-4" />
                    <span className="text-sm text-gray-700">🔥 Popular Post</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                    <input type="checkbox" checked={formData.isBreaking} onChange={(e) => setFormData(prev => ({ ...prev, isBreaking: e.target.checked }))} className="w-4 h-4" />
                    <span className="text-sm text-gray-700">⚡ Breaking News</span>
                  </label>
                </div>
              </div>

              {/* Publish Date & Expiry Date */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">📅 Publish Date</label>
                <input type="date" value={formData.publishedAt} onChange={(e) => setFormData(prev => ({ ...prev, publishedAt: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4" />
                <label className="block text-sm font-medium text-gray-700 mb-2">⏰ Expiry Date <span className="text-xs text-gray-400">(Optional)</span></label>
                <input type="date" value={formData.expiresAt} onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => setExpiryDate(7)} className="text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">+7 days</button>
                  <button type="button" onClick={() => setExpiryDate(30)} className="text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">+30 days</button>
                  <button type="button" onClick={() => setExpiryDate(90)} className="text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">+90 days</button>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, expiresAt: '' }))} className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">Clear</button>
                </div>
              </div>

              {/* SEO Settings Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">📈 SEO Settings</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">🎯 Focus Keyword</label>
                  <input type="text" value={formData.focusKeyword} onChange={(e) => setFormData(prev => ({ ...prev, focusKeyword: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., admission 2026" />
                </div>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <label className="block text-xs font-medium text-blue-700 mb-1">Meta Title (Auto from Title)</label>
                  <p className="text-sm text-gray-800 break-words">{formData.metaTitle || 'Will auto-generate from title'}</p>
                  <p className="text-xs text-gray-500 mt-1">Length: {charCount.title}/60 chars</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <label className="block text-xs font-medium text-green-700 mb-1">Meta Description (Auto from Content)</label>
                  <p className="text-sm text-gray-800 break-words line-clamp-3">{formData.metaDescription || 'Will auto-generate from content'}</p>
                  <p className="text-xs text-gray-500 mt-1">Length: {charCount.desc}/160 chars</p>
                </div>
              </div>
            </div>
          </div>

          {/* GOOGLE SEARCH PREVIEW - AT THE VERY BOTTOM */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button type="button" onClick={() => setShowGooglePreview(!showGooglePreview)} className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔍</span>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Google Search Preview</h3>
                  <p className="text-sm text-gray-500">See how your post will appear in Google search results</p>
                </div>
              </div>
              <span className="text-gray-400 text-xl">{showGooglePreview ? '▲' : '▼'}</span>
            </button>
            {showGooglePreview && (
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-inner">
                  <div className="text-blue-600 text-sm mb-1 hover:underline">{seoPreview.url}</div>
                  <div className="text-xl text-blue-800 font-medium hover:underline cursor-pointer mb-1 line-clamp-1">{seoPreview.title}</div>
                  <div className="text-sm text-gray-600 line-clamp-2">{seoPreview.description}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">📝 Title: {seoPreview.title.length}/60 chars</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${seoPreview.title.length > 60 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min((seoPreview.title.length / 60) * 100, 100)}%` }} /></div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">📄 Description: {seoPreview.description.length}/160 chars</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${seoPreview.description.length > 160 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min((seoPreview.description.length / 160) * 100, 100)}%` }} /></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ==================== BOTTOM BUTTONS ==================== */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-end gap-3">
              {/* ✅ BOTTOM BUTTON */}
              <ActionButtons 
                loading={loading} 
                postType={formData.type}
                postSlug={formData.slug}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}