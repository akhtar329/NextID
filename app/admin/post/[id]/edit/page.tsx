// app/admin/post/[id]/edit/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ImageUpload from '@/components/Image/ImageUpload';
import {
  FiSave, FiSearch, FiAlertCircle, FiCheckCircle,
  FiChevronDown, FiChevronUp, FiPlus, FiTrash2, FiLink,
  FiTag, FiEye, FiImage, FiLock
} from 'react-icons/fi';

// ==================== TYPES ====================
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

// PublishMetaBox Props
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
}

// CategoriesTagsBox Props
interface CategoriesTagsBoxProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  postType: string;
}

// FeaturedImageBox Props
interface FeaturedImageBoxProps {
  image: string;
  onImageSelect: (url: string) => void;
  slug: string;
  title: string;
  type: string;
}

// PreviewBox Props
interface PreviewBoxProps {
  title: string;
  description: string;
  url: string;
}

// PermalinkBox Props
interface PermalinkBoxProps {
  slug: string;
  type: string;
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
  isBreaking, onBreakingChange
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
  </div>
);

// Permalink Box (Locked - Read Only)
const PermalinkBox = ({ slug, type }: PermalinkBoxProps) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <FiLink className="w-4 h-4" />
        Permalink
        <span className="text-xs text-gray-400 ml-2 flex items-center gap-1"><FiLock className="w-3 h-3" /> Locked</span>
      </h3>
    </div>
    <div className="p-4">
      <div className="text-xs text-gray-500 mb-1">URL</div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">https://www.nextid.pk/{getUrlFolder(type)}/</span>
        <code className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {slug || 'example-post'}
        </code>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        🔒 Slug cannot be changed after creation. Create a new post if you need a different URL.
      </p>
    </div>
  </div>
);

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
const FeaturedImageBox = ({ image, onImageSelect, slug, title, type }: FeaturedImageBoxProps) => (
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
        postSlug={slug}
        postTitle={title}
        postType={type}
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
export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdvancedSeo, setShowAdvancedSeo] = useState(false);

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
    publishedAt: '',
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
  
  const [charCount, setCharCount] = useState<CharCount>({
    title: 0, desc: 0, ogTitle: 0, ogDesc: 0
  });
  
  // Auto-generate functions
  const generateMetaTitle = (title: string, type: string) => {
    if (!title) return '';
    const prefix = type === 'admission' ? 'Admissions 2026: ' :
                   type === 'scholarship' ? 'Scholarship: ' :
                   type === 'news' ? 'Breaking: ' : '';
    const metaTitle = prefix + title;
    return metaTitle.length > 60 ? metaTitle.substring(0, 57) + '...' : metaTitle;
  };
  
  // Priority 1: Excerpt se Meta Description, Priority 2: Content se
  const generateMetaDescription = (content: string, excerpt: string) => {
    if (excerpt && excerpt.trim()) {
      const cleanExcerpt = excerpt.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      return cleanExcerpt.length > 160 ? cleanExcerpt.substring(0, 157) + '...' : cleanExcerpt;
    }
    if (!content) return '';
    const plainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return plainText.length > 160 ? plainText.substring(0, 157) + '...' : plainText;
  };
  
  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/admin/post/${id}`);
        const data = await res.json();
        
        if (data.success && data.post) {
          const post = data.post;
          
          // Parse deadline from meta if exists
          const meta = post.meta || {};
          const deadline = meta.deadline || '';
          
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
            publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
            expiresAt: post.expiresAt ? new Date(post.expiresAt).toISOString().split('T')[0] : '',
            deadline: deadline,
            metaTitle: post.metaTitle || '',
            metaDescription: post.metaDescription || '',
            metaKeywords: post.metaKeywords || '',
            focusKeyword: post.focusKeyword || '',
            ogTitle: post.ogTitle || '',
            ogDescription: post.ogDescription || '',
            ogImage: post.ogImage || '',
            twitterTitle: post.twitterTitle || '',
            twitterDescription: post.twitterDescription || '',
            twitterImage: post.twitterImage || '',
            meta: post.meta || {},
            canonicalUrl: post.canonicalUrl || '',
            robots: post.robots || 'index, follow',
            ogType: post.ogType || 'article',
            twitterCard: post.twitterCard || 'summary_large_image',
            tags: post.tags || [],
          });
          
          setCharCount({
            title: post.metaTitle?.length || 0,
            desc: post.metaDescription?.length || 0,
            ogTitle: post.ogTitle?.length || 0,
            ogDesc: post.ogDescription?.length || 0,
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
  
  // Handlers
  const handleTitleChange = (title: string) => {
    const metaTitle = generateMetaTitle(title, formData.type);
    const metaDescription = generateMetaDescription(formData.content, formData.excerpt);
    
    setFormData(prev => ({
      ...prev,
      title,
      metaTitle,
      ogTitle: metaTitle,
      twitterTitle: metaTitle,
      metaDescription,
      ogDescription: metaDescription,
      twitterDescription: metaDescription,
    }));
    
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
  
  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({ ...prev, tags }));
  };
  
  const handleDeadlineChange = (deadline: string) => {
    setFormData(prev => ({ ...prev, deadline }));
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
    
    // Prepare meta data with deadline
    const updatedMeta = {
      ...formData.meta,
      deadline: formData.deadline,
    };
    
    const submitData = {
      ...formData,
      meta: updatedMeta,
      publishedAt: formData.publishedAt,
      expiresAt: formData.expiresAt,
    };
    
    try {
      const res = await fetch(`/api/admin/post/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
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
  
  const seoPreview = {
    title: formData.metaTitle || formData.title || 'Your Title Here',
    description: formData.metaDescription || formData.excerpt || formData.content?.substring(0, 160) || 'Your description will appear here...',
    url: `https://www.nextid.pk/${getUrlFolder(formData.type)}/${formData.slug || 'example-post'}`,
  };
  
  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading post...</p>
        </div>
      </div>
    );
  }
  
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
            <span className="text-sm font-semibold">Edit Post</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
          <p className="text-sm text-gray-500 mt-1">Update your post content and SEO settings</p>
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
              
              {/* Post Type (Readonly) */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
                <div className="inline-flex px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-700">
                  {POST_TYPES.find(t => t.value === formData.type)?.icon} {POST_TYPES.find(t => t.value === formData.type)?.label}
                </div>
                <p className="text-xs text-gray-400 mt-2">Post type cannot be changed after creation</p>
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
            
            {/* RIGHT SIDEBAR */}
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
              />
              
              {/* Permalink Box (Locked) */}
              <PermalinkBox
                slug={formData.slug}
                type={formData.type}
              />
              
              {/* Featured Image Box */}
              <FeaturedImageBox
                image={formData.featuredImage}
                onImageSelect={handleImageSelect}
                slug={formData.slug}
                title={formData.title}
                type={formData.type}
              />
              
              {/* Categories & Tags Box */}
              <CategoriesTagsBox
                tags={formData.tags}
                onTagsChange={handleTagsChange}
                postType={formData.type}
              />
              
              {/* SEO Settings Box */}
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
                      
                      {/* OG Image Preview - Using next/image */}
                      {formData.ogImage && (
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">OG:Image Preview</label>
                          <div className="relative w-full h-32 rounded-lg border overflow-hidden">
                            <Image
                              src={formData.ogImage}
                              alt="OG Preview"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
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
              
              {/* Submit Buttons */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">Save Changes</h3>
                </div>
                <div className="p-4">
                  <div className="flex gap-3">
                    <Link
                      href="/admin/post"
                      className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <FiSave className="w-4 h-4" />
                          Update Post
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}