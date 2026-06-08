'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/Image/ImageUpload';
import {
  FiSave, FiSearch, FiAlertCircle, FiCheckCircle,
  FiChevronDown, FiChevronUp, FiPlus, FiTrash2, FiLink,
  FiTag, FiEye, FiImage
} from 'react-icons/fi';

// ==================== TYPES ====================
interface SlugCheck {
  available: boolean;
  checking: boolean;
  message: string;
}

interface CharCount {
  title: number;
  desc: number;
  ogTitle: number;
  ogDesc: number;
}

interface FormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  type: string;
  featuredImage: string;
  status: string;
  isFeatured: boolean;
  isPopular: boolean;
  isBreaking: boolean;
  publishedAt: string;
  expiresAt: string;
  deadline: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  focusKeyword: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  meta: Record<string, unknown>;
  canonicalUrl: string;
  robots: string;
  ogType: string;
  twitterCard: string;
  tags: string[];
}

interface PublishMetaBoxProps {
  status: string;
  onStatusChange: (value: string) => void;
  publishedAt: string;
  onPublishedAtChange: (value: string) => void;
  deadline: string;
  onDeadlineChange: (value: string) => void;
  isFeatured: boolean;
  onFeaturedChange: (value: boolean) => void;
  isPopular: boolean;
  onPopularChange: (value: boolean) => void;
  isBreaking: boolean;
  onBreakingChange: (value: boolean) => void;
  loading: boolean;
  slugCheck: SlugCheck;
}

interface PermalinkBoxProps {
  slug: string;
  onSlugChange: (value: string) => void;
  type: string;
  slugCheck: SlugCheck;
}

interface CategoriesTagsBoxProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  postType: string;
}

interface FeaturedImageBoxProps {
  image: string;
  onImageSelect: (url: string) => void;
}

interface PreviewBoxProps {
  title: string;
  description: string;
  url: string;
}

// ==================== CONSTANTS ====================
const POST_TYPES = [
  { value: 'admission', label: 'Admission', icon: '🎓', color: 'bg-purple-100 text-purple-700' },
  { value: 'result', label: 'Result', icon: '📊', color: 'bg-green-100 text-green-700' },
  { value: 'news', label: 'News', icon: '📰', color: 'bg-blue-100 text-blue-700' },
  { value: 'date_sheet', label: 'Date Sheet', icon: '📅', color: 'bg-orange-100 text-orange-700' },
  { value: 'scholarship', label: 'Scholarship', icon: '💰', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'job', label: 'Job', icon: '💼', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'blog', label: 'Blog', icon: '📝', color: 'bg-pink-100 text-pink-700' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', icon: '📝' },
  { value: 'published', label: 'Published', icon: '🚀' },
  { value: 'archived', label: 'Archived', icon: '📦' },
];

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

// ==================== COMPONENTS ====================

// Publish Meta Box with Deadline
const PublishMetaBox = ({ 
  status, onStatusChange, 
  publishedAt, onPublishedAtChange,
  deadline, onDeadlineChange,
  isFeatured, onFeaturedChange,
  isPopular, onPopularChange,
  isBreaking, onBreakingChange,
  loading, slugCheck 
}: PublishMetaBoxProps) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <FiSave className="w-4 h-4" />
        Publish
      </h3>
    </div>
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.icon} {opt.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">📅 Publish Date</label>
        <input
          type="datetime-local"
          value={publishedAt}
          onChange={(e) => onPublishedAtChange(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">⏰ Deadline / Last Date</label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => onDeadlineChange(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">For results, admissions, jobs, and scholarships</p>
      </div>
      
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => onFeaturedChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">⭐ Featured Post</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPopular}
            onChange={(e) => onPopularChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">🔥 Popular Post</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isBreaking}
            onChange={(e) => onBreakingChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">⚡ Breaking News</span>
        </label>
      </div>
    </div>
    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex gap-2">
      <Link
        href="/admin/post"
        className="flex-1 text-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition"
      >
        Cancel
      </Link>
      <button
        type="submit"
        disabled={loading || !slugCheck.available}
        className="flex-1 bg-blue-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <FiSave className="w-4 h-4" />
            Publish
          </>
        )}
      </button>
    </div>
  </div>
);

// Permalink Box
const PermalinkBox = ({ slug, onSlugChange, type, slugCheck }: PermalinkBoxProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempSlug, setTempSlug] = useState(slug);
  
  const handleSaveSlug = () => {
    onSlugChange(tempSlug);
    setIsEditing(false);
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FiLink className="w-4 h-4" />
          Permalink
        </h3>
      </div>
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-1">URL</div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">https://www.nextid.pk/{getUrlFolder(type)}/</span>
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={tempSlug}
                onChange={(e) => setTempSlug(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveSlug}
                className="px-2 py-1 bg-blue-600 text-white rounded-md text-xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setTempSlug(slug); setIsEditing(false); }}
                className="px-2 py-1 border border-gray-300 rounded-md text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <code className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {slug || 'example-post'}
              </code>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            </div>
          )}
        </div>
        {slugCheck.message && (
          <p className={`text-xs mt-2 ${slugCheck.available ? 'text-green-600' : 'text-red-600'}`}>
            {slugCheck.message}
          </p>
        )}
      </div>
    </div>
  );
};

// Categories & Tags Box
const CategoriesTagsBox = ({ tags, onTagsChange, postType }: CategoriesTagsBoxProps) => {
  const [newTag, setNewTag] = useState('');
  
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag: string) => tag !== tagToRemove));
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FiTag className="w-4 h-4" />
          Categories & Tags
        </h3>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Post Type</label>
          <div className="inline-flex px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
            {POST_TYPES.find(t => t.value === postType)?.icon} {POST_TYPES.find(t => t.value === postType)?.label}
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag: string, idx: number) => (
              <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <FiTrash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              placeholder="Add new tag..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Featured Image Box
const FeaturedImageBox = ({ image, onImageSelect }: FeaturedImageBoxProps) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <FiImage className="w-4 h-4" />
        Featured Image
      </h3>
    </div>
    <div className="p-4">
      <ImageUpload
        onImageSelect={onImageSelect}
        currentImage={image}
        postSlug=""
        postTitle=""
        postType=""
      />
    </div>
  </div>
);

// Preview Box
const PreviewBox = ({ title, description, url }: PreviewBoxProps) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <FiEye className="w-4 h-4" />
        Google Search Preview
      </h3>
    </div>
    <div className="p-4">
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="text-blue-600 text-sm mb-1 truncate">{url}</div>
        <div className="text-xl text-blue-800 font-medium mb-1 line-clamp-1">{title || 'Your Title Here'}</div>
        <div className="text-sm text-gray-600 line-clamp-2">{description || 'Your description will appear here...'}</div>
      </div>
      <div className="mt-3 flex gap-4">
        <div className={`flex-1 text-center p-2 rounded-lg text-xs ${title.length > 60 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          Title: {title.length}/60
        </div>
        <div className={`flex-1 text-center p-2 rounded-lg text-xs ${description.length > 160 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          Description: {description.length}/160
        </div>
      </div>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================
export default function CreatePostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdvancedSeo, setShowAdvancedSeo] = useState(false);

  const today = new Date().toISOString().slice(0, 16);
  
  const [formData, setFormData] = useState<FormData>({
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
    publishedAt: today,
    expiresAt: '',
    deadline: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    focusKeyword: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    meta: {},
    canonicalUrl: '',
    robots: 'index, follow',
    ogType: 'article',
    twitterCard: 'summary_large_image',
    tags: [],
  });
  
  const [slugCheck, setSlugCheck] = useState<SlugCheck>({ available: true, checking: false, message: '' });
  const [charCount, setCharCount] = useState<CharCount>({
    title: 0, desc: 0, ogTitle: 0, ogDesc: 0
  });
  
  // Auto-generate functions
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  };
  
  const generateMetaTitle = (title: string, type: string) => {
    if (!title) return '';
    const prefix = type === 'admission' ? 'Admissions 2026: ' :
                   type === 'scholarship' ? 'Scholarship: ' :
                   type === 'news' ? 'Breaking: ' : '';
    const metaTitle = prefix + title;
    return metaTitle.length > 60 ? metaTitle.substring(0, 57) + '...' : metaTitle;
  };
  
  // ✅ Priority 1: Excerpt se Meta Description, Priority 2: Content se
  const generateMetaDescription = (content: string, excerpt: string) => {
    // Priority 1: Use Excerpt if available
    if (excerpt && excerpt.trim()) {
      const cleanExcerpt = excerpt.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      return cleanExcerpt.length > 160 ? cleanExcerpt.substring(0, 157) + '...' : cleanExcerpt;
    }
    
    // Priority 2: Use Content (if excerpt is empty)
    if (!content) return '';
    const plainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return plainText.length > 160 ? plainText.substring(0, 157) + '...' : plainText;
  };
  
  // ✅ New Handler: Excerpt change se Meta Description update
  const handleExcerptChange = (excerpt: string) => {
    const metaDescription = generateMetaDescription(formData.content, excerpt);
    
    setFormData(prev => ({
      ...prev,
      excerpt,
      metaDescription,
      ogDescription: metaDescription,
      twitterDescription: metaDescription,
    }));
    
    setCharCount(prev => ({ 
      ...prev, 
      desc: metaDescription.length,
      ogDesc: metaDescription.length 
    }));
  };
  
  // Handlers
  const handleTitleChange = (title: string) => {
    const slug = generateSlug(title);
    const metaTitle = generateMetaTitle(title, formData.type);
    const metaDescription = generateMetaDescription(formData.content, formData.excerpt);
    
    setFormData(prev => ({
      ...prev,
      title,
      slug,
      metaTitle,
      ogTitle: metaTitle,
      twitterTitle: metaTitle,
      metaDescription,
      ogDescription: metaDescription,
      twitterDescription: metaDescription,
    }));
    
    if (slug) checkSlug(slug);
    setCharCount(prev => ({ ...prev, title: metaTitle.length, ogTitle: metaTitle.length }));
  };
  
  const handleContentChange = (content: string) => {
    const metaDescription = generateMetaDescription(content, formData.excerpt);
    setFormData(prev => ({
      ...prev,
      content,
      metaDescription,
      ogDescription: metaDescription,
      twitterDescription: metaDescription,
    }));
    setCharCount(prev => ({ ...prev, desc: metaDescription.length, ogDesc: metaDescription.length }));
  };
  
  const handleMetaTitleChange = (metaTitle: string) => {
    setFormData(prev => ({ ...prev, metaTitle }));
    setCharCount(prev => ({ ...prev, title: metaTitle.length }));
  };
  
  const handleMetaDescriptionChange = (metaDescription: string) => {
    setFormData(prev => ({ ...prev, metaDescription }));
    setCharCount(prev => ({ ...prev, desc: metaDescription.length }));
  };
  
  const handleOgTitleChange = (ogTitle: string) => {
    setFormData(prev => ({ ...prev, ogTitle }));
    setCharCount(prev => ({ ...prev, ogTitle: ogTitle.length }));
  };
  
  const handleOgDescriptionChange = (ogDescription: string) => {
    setFormData(prev => ({ ...prev, ogDescription }));
    setCharCount(prev => ({ ...prev, ogDesc: ogDescription.length }));
  };
  
  const handleSlugChange = (slug: string) => {
    setFormData(prev => ({ ...prev, slug }));
    if (slug) checkSlug(slug);
  };
  
  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({ ...prev, tags }));
  };
  
  const handleDeadlineChange = (deadline: string) => {
    setFormData(prev => ({ ...prev, deadline }));
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
  
  const handleImageSelect = (url: string) => {
    setFormData(prev => ({ ...prev, featuredImage: url, ogImage: url, twitterImage: url }));
  };
  
  const regenerateMeta = () => {
    const metaTitle = generateMetaTitle(formData.title, formData.type);
    const metaDescription = generateMetaDescription(formData.content, formData.excerpt);
    setFormData(prev => ({
      ...prev,
      metaTitle,
      metaDescription,
      ogTitle: metaTitle,
      ogDescription: metaDescription,
      twitterTitle: metaTitle,
      twitterDescription: metaDescription,
    }));
    setCharCount(prev => ({
      ...prev,
      title: metaTitle.length,
      desc: metaDescription.length,
      ogTitle: metaTitle.length,
      ogDesc: metaDescription.length,
    }));
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
        setTimeout(() => router.push('/admin/post'), 1500);
      } else {
        setError(data.error || 'Failed to create post');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const seoPreview = {
    title: formData.metaTitle || formData.title || 'Your Title Here',
    description: formData.metaDescription || formData.excerpt || formData.content?.substring(0, 160) || 'Your description will appear here...',
    url: `https://www.nextid.pk/${getUrlFolder(formData.type)}/${formData.slug || 'example-post'}`,
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Bar */}
      <div className="bg-gray-900 text-white px-4 py-2 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-sm font-medium hover:text-gray-300">
              Dashboard
            </Link>
            <Link href="/admin/post" className="text-sm font-medium hover:text-gray-300">
              All Posts
            </Link>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm font-semibold">Add New Post</span>
          </div>
          <div className="flex items-center gap-3">
            {formData.status === 'published' ? (
              <span className="text-xs bg-green-600 px-2 py-1 rounded">Published</span>
            ) : (
              <span className="text-xs bg-yellow-600 px-2 py-1 rounded">Draft</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Post</h1>
          <p className="text-sm text-gray-500 mt-1">Create a new post. Fill in the details below.</p>
        </div>
        
        {/* Messages */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6 flex items-center gap-3">
            <FiCheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700">{success}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                    className="w-full text-2xl font-bold border-none focus:outline-none focus:ring-0 placeholder-gray-300"
                    placeholder="Add title"
                  />
                </div>
              </div>
              
              {/* Post Type Selector */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
                <div className="flex flex-wrap gap-2">
                  {POST_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, type: type.value }));
                        const newMetaTitle = generateMetaTitle(formData.title, type.value);
                        setFormData(prev => ({ ...prev, metaTitle: newMetaTitle, ogTitle: newMetaTitle }));
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                        formData.type === type.value
                          ? type.color + ' ring-2 ring-offset-1 ring-blue-500'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>{type.icon}</span> {type.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Content Editor */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    rows={15}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write your content here... (HTML supported)"
                  />
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📌 Excerpt (Short Description)
                      <span className="text-xs text-green-600 ml-2">→ This will become your Meta Description</span>
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => handleExcerptChange(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief summary of your post... (This becomes your meta description for SEO)"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      💡 This short description will be used as your Meta Description in Google search results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* RIGHT SIDEBAR - WordPress Style Meta Boxes */}
            <div className="space-y-6">
              {/* Publish Box */}
              <PublishMetaBox
                status={formData.status}
                onStatusChange={(val: string) => setFormData(prev => ({ ...prev, status: val }))}
                publishedAt={formData.publishedAt}
                onPublishedAtChange={(val: string) => setFormData(prev => ({ ...prev, publishedAt: val }))}
                deadline={formData.deadline}
                onDeadlineChange={handleDeadlineChange}
                isFeatured={formData.isFeatured}
                onFeaturedChange={(val: boolean) => setFormData(prev => ({ ...prev, isFeatured: val }))}
                isPopular={formData.isPopular}
                onPopularChange={(val: boolean) => setFormData(prev => ({ ...prev, isPopular: val }))}
                isBreaking={formData.isBreaking}
                onBreakingChange={(val: boolean) => setFormData(prev => ({ ...prev, isBreaking: val }))}
                loading={loading}
                slugCheck={slugCheck}
              />
              
              {/* Permalink Box */}
              <PermalinkBox
                slug={formData.slug}
                onSlugChange={handleSlugChange}
                type={formData.type}
                slugCheck={slugCheck}
              />
              
              {/* Featured Image Box */}
              <FeaturedImageBox
                image={formData.featuredImage}
                onImageSelect={handleImageSelect}
              />
              
              {/* Categories & Tags Box */}
              <CategoriesTagsBox
                tags={formData.tags}
                onTagsChange={handleTagsChange}
                postType={formData.type}
              />
              
              {/* SEO Settings Box - Only One Place */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FiSearch className="w-4 h-4" />
                    SEO Settings
                  </h3>
                  <button
                    type="button"
                    onClick={regenerateMeta}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Regenerate
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  {/* Focus Keyword */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Focus Keyword</label>
                    <input
                      type="text"
                      value={formData.focusKeyword}
                      onChange={(e) => setFormData(prev => ({ ...prev, focusKeyword: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., university admission 2026"
                    />
                  </div>
                  
                  {/* Meta Title */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-600">Meta Title</label>
                      <span className={`text-xs ${charCount.title > 60 ? 'text-red-500' : 'text-green-500'}`}>
                        {charCount.title}/60
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => handleMetaTitleChange(e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        charCount.title > 60 ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  
                  {/* Meta Description */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-600">Meta Description</label>
                      <span className={`text-xs ${charCount.desc > 160 ? 'text-red-500' : 'text-green-500'}`}>
                        {charCount.desc}/160
                      </span>
                    </div>
                    <textarea
                      value={formData.metaDescription}
                      onChange={(e) => handleMetaDescriptionChange(e.target.value)}
                      rows={3}
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        charCount.desc > 160 ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      ✏️ Auto-generated from Short Description. Edit manually if needed.
                    </p>
                  </div>
                  
                  {/* Advanced SEO Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAdvancedSeo(!showAdvancedSeo)}
                    className="w-full text-left text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                  >
                    {showAdvancedSeo ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                    Advanced SEO (Open Graph & Twitter Cards)
                  </button>
                  
                  {showAdvancedSeo && (
                    <div className="space-y-4 pt-2 border-t border-gray-100">
                      {/* OG Title */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-medium text-gray-600">OG:Title (Facebook)</label>
                          <span className={`text-xs ${charCount.ogTitle > 60 ? 'text-red-500' : 'text-green-500'}`}>
                            {charCount.ogTitle}/60
                          </span>
                        </div>
                        <input
                          type="text"
                          value={formData.ogTitle}
                          onChange={(e) => handleOgTitleChange(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* OG Description */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-medium text-gray-600">OG:Description (Facebook)</label>
                          <span className={`text-xs ${charCount.ogDesc > 200 ? 'text-red-500' : 'text-green-500'}`}>
                            {charCount.ogDesc}/200
                          </span>
                        </div>
                        <textarea
                          value={formData.ogDescription}
                          onChange={(e) => handleOgDescriptionChange(e.target.value)}
                          rows={2}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* OG Image Preview */}
                      {formData.ogImage && (
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">OG:Image Preview</label>
                          <img src={formData.ogImage} alt="OG Preview" className="w-full h-32 object-cover rounded-lg border" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Preview Box */}
              <PreviewBox
                title={seoPreview.title}
                description={seoPreview.description}
                url={seoPreview.url}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}