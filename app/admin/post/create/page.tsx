'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/Image/ImageUpload';
import RichTextEditor, { type EditorSection } from '@/components/ui/RichTextEditor';
import { toast } from 'sonner';
import { generateSchema } from '@/lib/generateSchema';
import {
  FiSave, FiSearch, FiAlertCircle, FiCheckCircle,
  FiPlus, FiTrash2, FiLink,
  FiTag, FiEye, FiImage, FiUser, FiGlobe,
  FiClock, FiCalendar, FiStar, FiTrendingUp, FiZap,
  FiFileText, FiExternalLink, FiFilePlus
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
  twitterTitle: number;
  twitterDesc: number;
}

interface FormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  type: string;
  featuredImage: string;
  actualImage: string;
  galleryImages: string[];
  status: string;
  isFeatured: boolean;
  isPopular: boolean;
  isBreaking: boolean;
  publishedAt: string;
  expiresAt: string;
  deadline: string;
  authorName: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  focusKeyword: string;
  canonicalUrl: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterCard: string;
  schemaMarkup: string;
  breadcrumbTitle: string;
  priority: string;
  changefreq: string;
  oldSlug: string;
  tags: string[];
  company: string;
  location: string;
  jobType: string;
  salary: string;
  experience: string;
  qualification: string;
  industry: string;
  officialLink: string;
  applicationLink: string;
  source: string;
  sourceUrl: string;
  institute: string;
  session: string;
  program: string;
  eligibility: string;
  feeStructure: string;
  board: string;
  examType: string;
  examYear: string;
  resultDate: string;
  className: string;
  dateSheetExamStartDate: string;
  organization: string;
  amount: string;
  scholarshipEligibility: string;
  imageAlt: string;
}

// ==================== PROPS ====================
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
  onSaveDraft: () => void;
  onPreview: () => void;
  onViewWebsite: () => void;
  canViewWebsite: boolean;
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
  imageAlt: string;
  onImageAltChange: (value: string) => void;
}

interface AuthorBoxProps {
  authorName: string;
  onAuthorNameChange: (value: string) => void;
}

interface RedirectBoxProps {
  oldSlug: string;
  onOldSlugChange: (value: string) => void;
}

interface PreviewBoxProps {
  title: string;
  description: string;
  url: string;
}

// ==================== CONSTANTS ====================
const POST_TYPES = [
  { value: 'admission', label: 'Admission', icon: '🎓', color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
  { value: 'result', label: 'Result', icon: '📊', color: 'bg-green-100 text-green-700', border: 'border-green-200' },
  { value: 'news', label: 'News', icon: '📰', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  { value: 'date_sheet', label: 'Date Sheet', icon: '📅', color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
  { value: 'scholarship', label: 'Scholarship', icon: '💰', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
  { value: 'job', label: 'Job', icon: '💼', color: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200' },
  { value: 'blog', label: 'Blog', icon: '📝', color: 'bg-pink-100 text-pink-700', border: 'border-pink-200' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', icon: '📝' },
  { value: 'published', label: 'Published', icon: '🚀' },
  { value: 'archived', label: 'Archived', icon: '📦' },
];

const ROBOTS_OPTIONS = [
  { value: 'index, follow', label: 'Index, Follow' },
  { value: 'noindex, follow', label: 'No Index, Follow' },
  { value: 'index, nofollow', label: 'Index, No Follow' },
  { value: 'noindex, nofollow', label: 'No Index, No Follow' },
];

const OG_TYPES = [
  { value: 'article', label: 'Article' },
  { value: 'website', label: 'Website' },
  { value: 'blog', label: 'Blog' },
  { value: 'news', label: 'News' },
];

const TWITTER_CARDS = [
  { value: 'summary_large_image', label: 'Summary with Large Image' },
  { value: 'summary', label: 'Summary' },
  { value: 'app', label: 'App' },
];

const CHANGEFREQ_OPTIONS = [
  { value: 'always', label: 'Always' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'never', label: 'Never' },
];

const PRIORITY_OPTIONS = [
  { value: '1.0', label: '1.0 (Highest)' },
  { value: '0.9', label: '0.9' },
  { value: '0.8', label: '0.8' },
  { value: '0.7', label: '0.7' },
  { value: '0.6', label: '0.6' },
  { value: '0.5', label: '0.5 (Default)' },
  { value: '0.4', label: '0.4' },
  { value: '0.3', label: '0.3' },
  { value: '0.2', label: '0.2' },
  { value: '0.1', label: '0.1' },
];

const getUrlFolder = (type: string): string => {
  const map: Record<string, string> = {
    scholarship: 'scholarships',
    admission: 'admissions',
    result: 'results',
    job: 'jobs',
    date_sheet: 'date-sheets',
    news: 'news',
    blog: 'blog',
  };
  return map[type] || type;
};

// ==================== LOADING SKELETON ====================
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-100 animate-pulse">
    <div className="bg-gray-300 h-10 w-full" />
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-gray-300 h-8 w-48 mb-6 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-200 h-20 rounded-lg" />
          <div className="bg-gray-200 h-24 rounded-lg" />
          <div className="bg-gray-200 h-96 rounded-lg" />
        </div>
        <div className="space-y-6">
          <div className="bg-gray-200 h-64 rounded-lg" />
          <div className="bg-gray-200 h-48 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

// ==================== COMPONENTS ====================
const AuthorBox = ({ authorName, onAuthorNameChange }: AuthorBoxProps) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <FiUser className="w-4 h-4 text-blue-600" /> Author
      </h3>
    </div>
    <div className="p-4 space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">
          Author Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => onAuthorNameChange(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., John Doe"
        />
        <p className="text-xs text-gray-400 mt-1">This name will appear as the post author.</p>
      </div>
    </div>
  </div>
);

const PublishMetaBox = ({
  status, onStatusChange, publishedAt, onPublishedAtChange,
  deadline, onDeadlineChange, isFeatured, onFeaturedChange,
  isPopular, onPopularChange, isBreaking, onBreakingChange,
  loading, slugCheck, onSaveDraft, onPreview, onViewWebsite, canViewWebsite,
}: PublishMetaBoxProps) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <FiSave className="w-4 h-4 text-green-600" /> Publish
      </h3>
    </div>
    <div className="p-4 space-y-4">
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
          <FiCalendar className="w-3 h-3" /> Publish Date
        </label>
        <input
          type="datetime-local"
          value={publishedAt}
          onChange={(e) => onPublishedAtChange(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
          <FiClock className="w-3 h-3" /> Deadline
        </label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => onDeadlineChange(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2 pt-2 border-t border-gray-100">
        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
          <input type="checkbox" checked={isFeatured} onChange={(e) => onFeaturedChange(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm text-gray-700"><FiStar className="w-4 h-4 inline text-amber-500" /> Featured</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
          <input type="checkbox" checked={isPopular} onChange={(e) => onPopularChange(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm text-gray-700"><FiTrendingUp className="w-4 h-4 inline text-red-500" /> Popular</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
          <input type="checkbox" checked={isBreaking} onChange={(e) => onBreakingChange(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm text-gray-700"><FiZap className="w-4 h-4 inline text-yellow-500" /> Breaking</span>
        </label>
      </div>
    </div>

    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 space-y-2">
      {canViewWebsite && (
        <button
          type="button"
          onClick={onViewWebsite}
          className="w-full px-3 py-2 border border-blue-300 text-blue-700 rounded-md text-sm hover:bg-blue-50 transition flex items-center justify-center gap-2"
        >
          <FiExternalLink className="w-4 h-4" /> View on Website
        </button>
      )}
      <button
        type="button"
        onClick={onPreview}
        className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-100 transition flex items-center justify-center gap-2"
      >
        <FiEye className="w-4 h-4" /> Preview
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={loading}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <FiFilePlus className="w-4 h-4" /> Draft
        </button>
        <button
          type="submit"
          disabled={loading || !slugCheck.available}
          className="flex-1 bg-blue-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><FiSave className="w-4 h-4" /> Publish</>
          )}
        </button>
      </div>
    </div>
  </div>
);

const PermalinkBox = ({ slug, onSlugChange, type, slugCheck }: PermalinkBoxProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempSlug, setTempSlug] = useState(slug);

  const handleSaveSlug = () => {
    onSlugChange(tempSlug);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FiLink className="w-4 h-4 text-purple-600" /> Permalink
        </h3>
      </div>
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-1">URL</div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">/nextid.pk/{getUrlFolder(type)}/</span>
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={tempSlug}
                onChange={(e) => setTempSlug(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
                autoFocus
              />
              <button type="button" onClick={handleSaveSlug} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Save</button>
              <button type="button" onClick={() => { setTempSlug(slug); setIsEditing(false); }} className="px-2 py-1 border rounded text-xs">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <code className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">{slug || 'example-post'}</code>
              <button type="button" onClick={() => setIsEditing(true)} className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
            </div>
          )}
        </div>
        {slugCheck.message && (
          <p className={`text-xs mt-2 ${slugCheck.available ? 'text-green-600' : 'text-red-600'}`}>{slugCheck.message}</p>
        )}
      </div>
    </div>
  );
};

const CategoriesTagsBox = ({ tags, onTagsChange, postType }: CategoriesTagsBoxProps) => {
  const [newTag, setNewTag] = useState('');
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FiTag className="w-4 h-4 text-yellow-600" /> Categories & Tags
        </h3>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Post Type</label>
          <div className="inline-flex px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
            {POST_TYPES.find(t => t.value === postType)?.icon} {POST_TYPES.find(t => t.value === postType)?.label}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">Tags</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                #{tag}
                <button type="button" onClick={() => onTagsChange(tags.filter(t => t !== tag))} className="text-gray-400 hover:text-red-500">
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
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add new tag..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm"
            />
            <button type="button" onClick={addTag} className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeaturedImageBox = ({ image, onImageSelect, imageAlt, onImageAltChange }: FeaturedImageBoxProps) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <FiImage className="w-4 h-4 text-indigo-600" /> Featured Image <span className="text-red-500">*</span>
      </h3>
    </div>
    <div className="p-4 space-y-3">
      <ImageUpload onImageSelect={onImageSelect} currentImage={image} postSlug="" postTitle="" postType="" />
      {image && (
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Image Alt Text (for SEO)</label>
          <input
            type="text"
            value={imageAlt}
            onChange={(e) => onImageAltChange(e.target.value)}
            placeholder="Describe the image for accessibility & SEO"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  </div>
);

const RedirectBox = ({ oldSlug, onOldSlugChange }: RedirectBoxProps) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="bg-gradient-to-r from-red-50 to-orange-50 px-4 py-3 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <FiLink className="w-4 h-4 text-red-600" /> Redirects (301)
      </h3>
    </div>
    <div className="p-4">
      <label className="text-xs font-medium text-gray-600 mb-1 block">Old Slug</label>
      <input
        type="text"
        value={oldSlug}
        onChange={(e) => onOldSlugChange(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        placeholder="e.g., old-post-slug"
      />
      <p className="text-xs text-gray-400 mt-1">If you change the slug, enter the old slug here.</p>
    </div>
  </div>
);

const PreviewBox = ({ title, description, url }: PreviewBoxProps) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <FiEye className="w-4 h-4 text-cyan-600" /> Google Preview
      </h3>
    </div>
    <div className="p-4">
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="text-blue-600 text-sm mb-1 truncate">{url}</div>
        <div className="text-xl text-blue-800 font-medium mb-1 line-clamp-1">{title || 'Your Title Here'}</div>
        <div className="text-sm text-gray-600 line-clamp-2">{description || 'Your description...'}</div>
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
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'advanced'>('content');
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [savedPostSlug, setSavedPostSlug] = useState<string>('');
  const [countdown, setCountdown] = useState<{ text: string; color: string } | null>(null);

  const [isInitialized] = useState(true);

  const today = new Date().toISOString().slice(0, 16);
  const DRAFT_KEY = 'nextid_post_draft';

  const [formData, setFormData] = useState<FormData>({
    title: '', slug: '', content: '', excerpt: '', type: 'news',
    featuredImage: '', actualImage: '', galleryImages: [], status: 'draft',
    isFeatured: false, isPopular: false, isBreaking: false,
    publishedAt: today, expiresAt: '', deadline: '', authorName: '',
    metaTitle: '', metaDescription: '', metaKeywords: '', focusKeyword: '',
    canonicalUrl: '', robots: 'index, follow',
    ogTitle: '', ogDescription: '', ogImage: '', ogType: 'article',
    twitterTitle: '', twitterDescription: '', twitterImage: '', twitterCard: 'summary_large_image',
    schemaMarkup: '', breadcrumbTitle: '', priority: '0.5', changefreq: 'weekly', oldSlug: '', tags: [],
    company: '', location: '', jobType: 'Full Time', salary: '', experience: '', qualification: '', industry: '', officialLink: '', applicationLink: '',
    source: '', sourceUrl: '',
    institute: '', session: '', program: '', eligibility: '', feeStructure: '',
    board: '', examType: 'Annual', examYear: '', resultDate: '', className: '',
    dateSheetExamStartDate: '',
    organization: '', amount: '', scholarshipEligibility: '',
    imageAlt: '',
  });

  const [slugCheck, setSlugCheck] = useState<SlugCheck>({ available: true, checking: false, message: '' });
  const [charCount, setCharCount] = useState<CharCount>({ title: 0, desc: 0, ogTitle: 0, ogDesc: 0, twitterTitle: 0, twitterDesc: 0 });
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const checkSlugTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!formData.deadline) {
      setCountdown(null);
      return;
    }
    const days = Math.ceil((new Date(formData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) setCountdown({ text: 'Deadline passed', color: 'bg-gray-100 text-gray-600' });
    else if (days === 0) setCountdown({ text: 'Last day today!', color: 'bg-red-100 text-red-700' });
    else if (days <= 3) setCountdown({ text: `${days} days left!`, color: 'bg-red-100 text-red-700' });
    else if (days <= 7) setCountdown({ text: `${days} days left`, color: 'bg-orange-100 text-orange-700' });
    else if (days <= 30) setCountdown({ text: `${days} days left`, color: 'bg-yellow-100 text-yellow-700' });
    else setCountdown({ text: `${days} days left`, color: 'bg-green-100 text-green-700' });
  }, [formData.deadline]);

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (!draft) return;
    try {
      const parsed = JSON.parse(draft);
      const timer = setTimeout(() => {
        toast.custom((t) => (
          <div className="bg-white border rounded-lg shadow-lg p-4 max-w-sm">
            <p className="text-sm font-medium text-gray-800 mb-2">📝 Unsaved draft found</p>
            <p className="text-xs text-gray-500 mb-3">Do you want to restore it?</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setFormData(parsed.formData); toast.dismiss(t); toast.success('Draft restored!'); }}
                className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium"
              >
                Restore
              </button>
              <button
                onClick={() => { localStorage.removeItem(DRAFT_KEY); toast.dismiss(t); }}
                className="flex-1 px-3 py-1.5 border rounded text-xs"
              >
                Discard
              </button>
            </div>
          </div>
        ), { duration: Infinity });
      }, 100);
      return () => clearTimeout(timer);
    } catch { localStorage.removeItem(DRAFT_KEY); }
  }, []);

  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      if (formData.title || formData.content) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, savedAt: new Date().toISOString() }));
        setLastSaved(new Date());
      }
    }, 30000);
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
  }, [formData]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !success) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, success]);

  const checkSlugDebounced = (slug: string) => {
    if (checkSlugTimer.current) clearTimeout(checkSlugTimer.current);
    checkSlugTimer.current = setTimeout(() => checkSlug(slug), 500);
  };

  // ==================== HELPERS ====================
  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 100);

  const generateMetaTitle = (title: string, type: string) => {
    if (!title) return '';
    const prefix = type === 'admission' ? 'Admissions 2026: ' : type === 'scholarship' ? 'Scholarship: ' : type === 'news' ? 'Breaking: ' : '';
    const metaTitle = prefix + title;
    return metaTitle.length > 60 ? metaTitle.substring(0, 57) + '...' : metaTitle;
  };

  const generateMetaDescription = (content: string, excerpt: string) => {
    if (excerpt && excerpt.trim()) {
      const clean = excerpt.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      return clean.length > 160 ? clean.substring(0, 157) + '...' : clean;
    }
    if (!content) return '';
    const plain = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return plain.length > 160 ? plain.substring(0, 157) + '...' : plain;
  };

  // ==================== HANDLERS ====================
  const handleTitleChange = (title: string) => {
    const slug = generateSlug(title);
    const metaTitle = generateMetaTitle(title, formData.type);
    const metaDescription = generateMetaDescription(formData.content, formData.excerpt);
    setFormData(prev => ({ ...prev, title, slug, metaTitle, ogTitle: metaTitle, twitterTitle: metaTitle, metaDescription, ogDescription: metaDescription, twitterDescription: metaDescription, breadcrumbTitle: title }));
    setIsDirty(true);
    if (slug) checkSlugDebounced(slug);
    setCharCount(prev => ({ ...prev, title: metaTitle.length, ogTitle: metaTitle.length, twitterTitle: metaTitle.length }));
  };

  const handleExcerptChange = (excerpt: string) => {
    const metaDescription = generateMetaDescription(formData.content, excerpt);
    setFormData(prev => ({ ...prev, excerpt, metaDescription, ogDescription: metaDescription, twitterDescription: metaDescription }));
    setCharCount(prev => ({ ...prev, desc: metaDescription.length, ogDesc: metaDescription.length, twitterDesc: metaDescription.length }));
    setIsDirty(true);
  };

  const handleContentChange = (value: string | EditorSection[]) => {
    const content = typeof value === 'string' ? value : '';
    const metaDescription = generateMetaDescription(content, formData.excerpt);
    setFormData(prev => ({ ...prev, content, metaDescription, ogDescription: metaDescription, twitterDescription: metaDescription }));
    setCharCount(prev => ({ ...prev, desc: metaDescription.length, ogDesc: metaDescription.length, twitterDesc: metaDescription.length }));
    setIsDirty(true);
  };

  const handleSlugChange = (slug: string) => {
    setFormData(prev => ({ ...prev, slug }));
    setIsDirty(true);
    if (slug) checkSlugDebounced(slug);
  };

  const handleImageSelect = (url: string) => {
    setFormData(prev => ({ ...prev, featuredImage: url, ogImage: url, twitterImage: url }));
    setIsDirty(true);
  };

  const checkSlug = async (slug: string) => {
    if (!slug) return;
    setSlugCheck(prev => ({ ...prev, checking: true, message: 'Checking...' }));
    try {
      const res = await fetch('/api/admin/post/check-slug', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      setSlugCheck({ available: data.isAvailable, checking: false, message: data.isAvailable ? '✓ Available' : '✗ Already exists' });
    } catch {
      setSlugCheck({ available: true, checking: false, message: 'Unable to check' });
    }
  };

  const regenerateMeta = () => {
    const metaTitle = generateMetaTitle(formData.title, formData.type);
    const metaDescription = generateMetaDescription(formData.content, formData.excerpt);
    setFormData(prev => ({ ...prev, metaTitle, metaDescription, ogTitle: metaTitle, ogDescription: metaDescription, twitterTitle: metaTitle, twitterDescription: metaDescription }));
    setCharCount(prev => ({ ...prev, title: metaTitle.length, desc: metaDescription.length, ogTitle: metaTitle.length, ogDesc: metaDescription.length, twitterTitle: metaTitle.length, twitterDesc: metaDescription.length }));
    toast.success('Meta tags regenerated!');
  };

  const buildMetaObject = (): Record<string, unknown> => {
    const meta: Record<string, unknown> = {};
    if (formData.deadline) meta.deadline = formData.deadline;
    meta.isFeatured = formData.isFeatured;
    return meta;
  };

  // ==================== VALIDATION ====================
  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Title is required';
    if (!slugCheck.available) return 'Please choose a different slug';
    if (!formData.content || formData.content.trim() === '' || formData.content === '<p></p>') return 'Content is required';
    if (!formData.featuredImage) return 'Featured image is required';
    if (!formData.imageAlt.trim()) return 'Image alt text is required for SEO';
    if (!formData.authorName.trim()) return 'Author name is required';
    return null;
  };

  // ==================== SUBMIT ====================
  const submitPost = async (status: 'draft' | 'published') => {
    setLoading(true);
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      setLoading(false);
      return;
    }

    const url = `https://www.nextid.pk/${getUrlFolder(formData.type)}/${formData.slug}`;
    const meta = buildMetaObject();
    const autoSchema = generateSchema({
      title: formData.title,
      description: formData.metaDescription || formData.excerpt,
      image: formData.featuredImage,
      url,
      authorName: formData.authorName,
      publishedAt: formData.publishedAt,
      type: formData.type,
      meta,
    });

    const payload = {
      ...formData,
      status,
      meta,
      schemaMarkup: formData.schemaMarkup || autoSchema,
      imageAlt: formData.imageAlt,
    };

    try {
      const res = await fetch('/api/admin/post/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.removeItem(DRAFT_KEY);
        setIsDirty(false);
        setSavedPostSlug(formData.slug);
        setSuccess(status === 'draft' ? 'Draft saved!' : 'Post published successfully!');
        toast.success(status === 'draft' ? 'Draft saved!' : 'Post published!');
        setTimeout(() => router.push('/admin/post'), 1500);
      } else {
        setError(data.error || 'Failed to save post');
        toast.error(data.error || 'Failed to save post');
      }
    } catch {
      setError('Something went wrong. Please try again.');
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitPost(formData.status === 'draft' ? 'draft' : 'published');
  };

  const handleSaveDraft = () => {
    const originalStatus = formData.status;
    submitPost('draft').finally(() => setFormData(prev => ({ ...prev, status: originalStatus })));
  };

  const handlePreview = () => {
    if (!formData.slug) { toast.error('Add a title first to generate slug'); return; }
    toast.info('Preview coming soon');
  };

  const handleViewWebsite = () => {
    const slug = savedPostSlug || formData.slug;
    if (!slug) { toast.error('Post not published yet'); return; }
    window.open(`/${getUrlFolder(formData.type)}/${slug}`, '_blank');
  };

  const seoPreview = {
    title: formData.metaTitle || formData.title || 'Your Title Here',
    description: formData.metaDescription || formData.excerpt || formData.content?.replace(/<[^>]*>/g, '').substring(0, 160) || 'Your description will appear here...',
    url: `https://www.nextid.pk/${getUrlFolder(formData.type)}/${formData.slug || 'example-post'}`,
  };

  if (!isInitialized) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sticky Header */}
      <div className="bg-gray-900 text-white px-4 py-2 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-sm font-medium hover:text-gray-300">Dashboard</Link>
            <Link href="/admin/post" className="text-sm font-medium hover:text-gray-300">All Posts</Link>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm font-semibold">Add New Post</span>
            {lastSaved && (
              <span className="text-xs text-gray-400">✓ Saved {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {formData.status === 'published' ? (
              <span className="text-xs bg-green-600 px-2 py-1 rounded">Published</span>
            ) : (
              <span className="text-xs bg-yellow-600 px-2 py-1 rounded">Draft</span>
            )}
            <button
              type="submit"
              form="post-form"
              disabled={loading || !slugCheck.available}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Add New Post</h1>
          <p className="text-sm text-gray-500 mt-1">Create a new post with all SEO features.</p>
        </div>

        {countdown && (
          <div className={`${countdown.color} rounded-lg px-4 py-2 mb-4 flex items-center gap-2 text-sm font-medium`}>
            <FiClock className="w-4 h-4" /> Deadline: {countdown.text}
          </div>
        )}

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

        {/* TABS */}
        <div className="flex gap-1 mb-4 border-b border-gray-300">
          {[
            { key: 'content' as const, label: '📝 Content' },
            { key: 'seo' as const, label: '🔍 SEO' },
            { key: 'advanced' as const, label: '⚙️ Advanced' },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 border border-b-0 border-gray-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form id="post-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  className="w-full text-2xl font-bold border-none focus:outline-none focus:ring-0 placeholder-gray-300"
                  placeholder="Add title"
                />
              </div>

              {activeTab === 'content' && (
                <>
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Post Type</label>
                    <div className="flex flex-wrap gap-2">
                      {POST_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, type: type.value }));
                            const newMetaTitle = generateMetaTitle(formData.title, type.value);
                            setFormData(prev => ({ ...prev, metaTitle: newMetaTitle, ogTitle: newMetaTitle }));
                            setIsDirty(true);
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                            formData.type === type.value ? type.color + ' ring-2 ring-offset-1 ring-blue-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <span>{type.icon}</span> {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SINGLE CONTENT BOX (for all post types) */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      <FiFileText className="w-4 h-4 inline mr-1 text-blue-600" /> Content <span className="text-red-500">*</span>
                    </label>
                    <RichTextEditor
                      value={formData.content}
                      onChange={handleContentChange}
                      placeholder="Write your content here..."
                      minHeight={400}
                      mode="single"
                    />

                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        📌 Excerpt <span className="text-xs text-green-600 ml-2">→ Becomes Meta Description</span>
                      </label>
                      <textarea
                        value={formData.excerpt}
                        onChange={(e) => handleExcerptChange(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm"
                        placeholder="Brief summary..."
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'seo' && (
                <>
                  <div className="bg-white rounded-lg border shadow-sm p-4 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="text-sm font-semibold flex items-center gap-2"><FiSearch className="w-4 h-4 text-blue-600" /> SEO Settings</h3>
                      <button type="button" onClick={regenerateMeta} className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 bg-white rounded border border-blue-200">Regenerate</button>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">🎯 Focus Keyword</label>
                      <input type="text" value={formData.focusKeyword} onChange={(e) => setFormData(prev => ({ ...prev, focusKeyword: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="e.g., university admission 2026" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">📝 Meta Keywords</label>
                      <input type="text" value={formData.metaKeywords} onChange={(e) => setFormData(prev => ({ ...prev, metaKeywords: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="keyword1, keyword2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-gray-600">Meta Title</label>
                        <span className={`text-xs ${charCount.title > 60 ? 'text-red-500' : 'text-green-500'}`}>{charCount.title}/60</span>
                      </div>
                      <input type="text" value={formData.metaTitle} onChange={(e) => { setFormData(prev => ({ ...prev, metaTitle: e.target.value })); setCharCount(prev => ({ ...prev, title: e.target.value.length })); }} className={`w-full border rounded-md px-3 py-2 text-sm ${charCount.title > 60 ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-gray-600">Meta Description</label>
                        <span className={`text-xs ${charCount.desc > 160 ? 'text-red-500' : 'text-green-500'}`}>{charCount.desc}/160</span>
                      </div>
                      <textarea value={formData.metaDescription} onChange={(e) => { setFormData(prev => ({ ...prev, metaDescription: e.target.value })); setCharCount(prev => ({ ...prev, desc: e.target.value.length })); }} rows={3} className={`w-full border rounded-md px-3 py-2 text-sm ${charCount.desc > 160 ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Canonical URL</label>
                      <input type="text" value={formData.canonicalUrl} onChange={(e) => setFormData(prev => ({ ...prev, canonicalUrl: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="https://..." />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Robots</label>
                      <select value={formData.robots} onChange={(e) => setFormData(prev => ({ ...prev, robots: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                        {ROBOTS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <PreviewBox title={seoPreview.title} description={seoPreview.description} url={seoPreview.url} />
                </>
              )}

              {activeTab === 'advanced' && (
                <div className="bg-white rounded-lg border shadow-sm p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><FiGlobe className="w-4 h-4" /> Advanced Settings</h3>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">OG Type</label>
                    <select value={formData.ogType} onChange={(e) => setFormData(prev => ({ ...prev, ogType: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">
                      {OG_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">OG Title</label>
                    <input type="text" value={formData.ogTitle} onChange={(e) => setFormData(prev => ({ ...prev, ogTitle: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">OG Description</label>
                    <textarea value={formData.ogDescription} onChange={(e) => setFormData(prev => ({ ...prev, ogDescription: e.target.value }))} rows={2} className="w-full border rounded-md px-3 py-2 text-sm" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Twitter Card</label>
                    <select value={formData.twitterCard} onChange={(e) => setFormData(prev => ({ ...prev, twitterCard: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">
                      {TWITTER_CARDS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Twitter Title</label>
                    <input type="text" value={formData.twitterTitle} onChange={(e) => setFormData(prev => ({ ...prev, twitterTitle: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Twitter Description</label>
                    <textarea value={formData.twitterDescription} onChange={(e) => setFormData(prev => ({ ...prev, twitterDescription: e.target.value }))} rows={2} className="w-full border rounded-md px-3 py-2 text-sm" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Sitemap Priority</label>
                    <select value={formData.priority} onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">
                      {PRIORITY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Change Frequency</label>
                    <select value={formData.changefreq} onChange={(e) => setFormData(prev => ({ ...prev, changefreq: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">
                      {CHANGEFREQ_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Breadcrumb Title</label>
                    <input type="text" value={formData.breadcrumbTitle} onChange={(e) => setFormData(prev => ({ ...prev, breadcrumbTitle: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Schema Markup (JSON-LD)
                      <span className="text-green-600 ml-2 text-xs">✓ Auto-generated if empty</span>
                    </label>
                    <textarea
                      value={formData.schemaMarkup}
                      onChange={(e) => setFormData(prev => ({ ...prev, schemaMarkup: e.target.value }))}
                      rows={6}
                      className="w-full border rounded-md px-3 py-2 text-sm font-mono"
                      placeholder="Auto-generated based on post type..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-6">
              <PublishMetaBox
                status={formData.status}
                onStatusChange={(val) => { setFormData(prev => ({ ...prev, status: val })); setIsDirty(true); }}
                publishedAt={formData.publishedAt}
                onPublishedAtChange={(val) => setFormData(prev => ({ ...prev, publishedAt: val }))}
                deadline={formData.deadline}
                onDeadlineChange={(val) => setFormData(prev => ({ ...prev, deadline: val }))}
                isFeatured={formData.isFeatured}
                onFeaturedChange={(val) => setFormData(prev => ({ ...prev, isFeatured: val }))}
                isPopular={formData.isPopular}
                onPopularChange={(val) => setFormData(prev => ({ ...prev, isPopular: val }))}
                isBreaking={formData.isBreaking}
                onBreakingChange={(val) => setFormData(prev => ({ ...prev, isBreaking: val }))}
                loading={loading}
                slugCheck={slugCheck}
                onSaveDraft={handleSaveDraft}
                onPreview={handlePreview}
                onViewWebsite={handleViewWebsite}
                canViewWebsite={!!savedPostSlug}
              />

              <AuthorBox authorName={formData.authorName} onAuthorNameChange={(val) => setFormData(prev => ({ ...prev, authorName: val }))} />
              <PermalinkBox slug={formData.slug} onSlugChange={handleSlugChange} type={formData.type} slugCheck={slugCheck} />
              <FeaturedImageBox image={formData.featuredImage} onImageSelect={handleImageSelect} imageAlt={formData.imageAlt} onImageAltChange={(val) => setFormData(prev => ({ ...prev, imageAlt: val }))} />
              <CategoriesTagsBox tags={formData.tags} onTagsChange={(tags) => setFormData(prev => ({ ...prev, tags }))} postType={formData.type} />
              <RedirectBox oldSlug={formData.oldSlug} onOldSlugChange={(val) => setFormData(prev => ({ ...prev, oldSlug: val }))} />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}