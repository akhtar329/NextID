'use client';

import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/Image/ImageUpload';
import RichTextEditor, { type EditorSection } from '@/components/ui/RichTextEditor';
import { toast } from 'sonner';
import { generateSchema } from '@/lib/generateSchema';
import {
  FiSave,
  FiSearch,
  FiAlertCircle,
  FiCheckCircle,
  FiPlus,
  FiTrash2,
  FiLink,
  FiTag,
  FiEye,
  FiImage,
  FiUser,
  FiGlobe,
  FiClock,
  FiCalendar,
  FiStar,
  FiTrendingUp,
  FiZap,
  FiExternalLink,
  FiFilePlus,
} from 'react-icons/fi';

// ==================== TYPES ====================

interface CharCount {
  title: number;
  desc: number;
  ogTitle: number;
  ogDesc: number;
  twitterTitle: number;
  twitterDesc: number;
}

interface SlugCheck {
  available: boolean;
  checking: boolean;
  message: string;
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
  meta: Record<string, unknown>;
  tags: string[];
  imageAlt: string;
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
  onSaveDraft: () => void;
  onPreview: () => void;
  onViewWebsite: () => void;
  canViewWebsite: boolean;
}

interface AuthorBoxProps {
  authorName: string;
  onAuthorNameChange: (value: string) => void;
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

interface PreviewBoxProps {
  title: string;
  description: string;
  url: string;
}

interface PermalinkBoxProps {
  slug: string;
  type: string;
  slugCheck: SlugCheck;
}

interface RedirectBoxProps {
  oldSlug: string;
  onOldSlugChange: (value: string) => void;
}

// ==================== API HELPERS ====================

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readJsonObject = async (
  response: Response
): Promise<Record<string, unknown>> => {
  const result: unknown = await response.json();

  if (!isRecord(result)) {
    throw new Error('Invalid server response.');
  }

  return result;
};

const getString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const getStringOrNumber = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return fallback;
};

const getBoolean = (value: unknown): boolean =>
  typeof value === 'boolean' ? value : false;

const getStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
};

const getRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

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

// ==================== UTILITIES ====================

const getUrlFolder = (type: string): string => {
  const typeMap: Record<string, string> = {
    scholarship: 'scholarships',
    admission: 'admissions',
    result: 'results',
    job: 'jobs',
    date_sheet: 'date-sheets',
    news: 'news',
    blog: 'blog',
  };

  return typeMap[type] || type;
};

const toDateTimeLocal = (
  value: string | Date | null | undefined
): string => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const pad = (number: number) => String(number).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const parseSchemaMarkup = (
  value: string
): Record<string, unknown> | unknown[] | null => {
  const trimmed = value.trim();

  if (!trimmed) return null;

  const parsed: unknown = JSON.parse(trimmed);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Schema markup must be a JSON object or array.');
  }

  return parsed as Record<string, unknown> | unknown[];
};

// ==================== LOADING SKELETON ====================

const LoadingSkeleton = () => (
  <div className="min-h-screen animate-pulse bg-gray-100">
    <div className="h-10 w-full bg-gray-300" />

    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 h-8 w-48 rounded bg-gray-300" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-20 rounded-lg bg-gray-200" />
          <div className="h-96 rounded-lg bg-gray-200" />
        </div>

        <div className="space-y-6">
          <div className="h-64 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  </div>
);

// ==================== COMPONENTS ====================

const AuthorBox = ({
  authorName,
  onAuthorNameChange,
}: AuthorBoxProps) => (
  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <FiUser className="h-4 w-4 text-blue-600" />
        Author
      </h3>
    </div>

    <div className="p-4">
      <label className="mb-1 block text-xs font-medium text-gray-600">
        Author Name
      </label>

      <input
        type="text"
        value={authorName}
        onChange={(e) => onAuthorNameChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="e.g., John Doe"
      />
    </div>
  </div>
);

const PublishMetaBox = ({
  status,
  onStatusChange,
  publishedAt,
  onPublishedAtChange,
  deadline,
  onDeadlineChange,
  isFeatured,
  onFeaturedChange,
  isPopular,
  onPopularChange,
  isBreaking,
  onBreakingChange,
  loading,
  slugCheck,
  onSaveDraft,
  onPreview,
  onViewWebsite,
  canViewWebsite,
}: PublishMetaBoxProps) => (
  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <FiSave className="h-4 w-4 text-green-600" />
        Publish
      </h3>
    </div>

    <div className="space-y-4 p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Status
        </label>

        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.icon} {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-600">
          <FiCalendar className="h-3 w-3" />
          Publish Date
        </label>

        <input
          type="datetime-local"
          value={publishedAt}
          onChange={(e) => onPublishedAtChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-600">
          <FiClock className="h-3 w-3" />
          Deadline
        </label>

        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => onDeadlineChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2 border-t border-gray-100 pt-2">
        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-gray-50">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => onFeaturedChange(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm text-gray-700">
            <FiStar className="inline h-4 w-4 text-amber-500" /> Featured
          </span>
        </label>

        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-gray-50">
          <input
            type="checkbox"
            checked={isPopular}
            onChange={(e) => onPopularChange(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm text-gray-700">
            <FiTrendingUp className="inline h-4 w-4 text-red-500" /> Popular
          </span>
        </label>

        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-gray-50">
          <input
            type="checkbox"
            checked={isBreaking}
            onChange={(e) => onBreakingChange(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm text-gray-700">
            <FiZap className="inline h-4 w-4 text-yellow-500" /> Breaking
          </span>
        </label>
      </div>
    </div>

    <div className="space-y-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
      {canViewWebsite && (
        <button
          type="button"
          onClick={onViewWebsite}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-blue-300 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-50"
        >
          <FiExternalLink className="h-4 w-4" />
          View on Website
        </button>
      )}

      <button
        type="button"
        onClick={onPreview}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
      >
        <FiEye className="h-4 w-4" />
        Preview
      </button>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
        >
          <FiFilePlus className="h-4 w-4" />
          Draft
        </button>

        <button
          type="submit"
          disabled={loading || !slugCheck.available || slugCheck.checking}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <FiSave className="h-4 w-4" />
              Update
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

const PermalinkBox = ({ slug, type, slugCheck }: PermalinkBoxProps) => (
  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <FiLink className="h-4 w-4 text-purple-600" />
        Permalink
      </h3>
    </div>

    <div className="p-4">
      <div className="mb-1 text-xs text-gray-500">
        URL (auto-generated from title)
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500">
          /nextid.pk/{getUrlFolder(type)}/
        </span>

        <code className="rounded bg-blue-50 px-2 py-1 text-sm text-blue-600">
          {slug || 'example-post'}
        </code>
      </div>

      {slugCheck.message && (
        <p
          className={`mt-2 text-xs ${
            slugCheck.available ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {slugCheck.message}
        </p>
      )}
    </div>
  </div>
);

const RedirectBox = ({
  oldSlug,
  onOldSlugChange,
}: RedirectBoxProps) => (
  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50 px-4 py-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <FiLink className="h-4 w-4 text-red-600" />
        Redirects (301)
      </h3>
    </div>

    <div className="p-4">
      <label className="mb-1 block text-xs font-medium text-gray-600">
        Old Slug
      </label>

      <input
        type="text"
        value={oldSlug}
        onChange={(e) => onOldSlugChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        placeholder="e.g., old-post-slug"
      />
    </div>
  </div>
);

const CategoriesTagsBox = ({
  tags,
  onTagsChange,
  postType,
}: CategoriesTagsBoxProps) => {
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    const trimmedTag = newTag.trim();

    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FiTag className="h-4 w-4 text-yellow-600" />
          Categories & Tags
        </h3>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Post Type
          </label>

          <div className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
            {POST_TYPES.find((item) => item.value === postType)?.icon}{' '}
            {POST_TYPES.find((item) => item.value === postType)?.label}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-gray-600">
            Tags
          </label>

          <div className="mb-3 flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
              >
                #{tag}

                <button
                  type="button"
                  onClick={() =>
                    onTagsChange(tags.filter((item) => item !== tag))
                  }
                  className="text-gray-400 hover:text-red-500"
                  aria-label={`Remove ${tag} tag`}
                >
                  <FiTrash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add new tag..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm"
            />

            <button
              type="button"
              onClick={addTag}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
              aria-label="Add tag"
            >
              <FiPlus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeaturedImageBox = ({
  image,
  onImageSelect,
  imageAlt,
  onImageAltChange,
}: FeaturedImageBoxProps) => (
  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <FiImage className="h-4 w-4 text-indigo-600" />
        Featured Image
      </h3>
    </div>

    <div className="space-y-3 p-4">
      <ImageUpload
        onImageSelect={onImageSelect}
        currentImage={image}
        postSlug=""
        postTitle=""
        postType=""
      />

      {image && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Image Alt Text (SEO)
          </label>

          <input
            type="text"
            value={imageAlt}
            onChange={(e) => onImageAltChange(e.target.value)}
            placeholder="Describe image..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      )}
    </div>
  </div>
);

const PreviewBox = ({
  title,
  description,
  url,
}: PreviewBoxProps) => (
  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <FiEye className="h-4 w-4 text-cyan-600" />
        Google Preview
      </h3>
    </div>

    <div className="p-4">
      <div className="rounded-lg border bg-gray-50 p-4">
        <div className="mb-1 truncate text-sm text-blue-600">{url}</div>
        <div className="mb-1 line-clamp-1 text-xl font-medium text-blue-800">
          {title || 'Your Title Here'}
        </div>
        <div className="line-clamp-2 text-sm text-gray-600">
          {description || 'Your description...'}
        </div>
      </div>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activeTab, setActiveTab] = useState<
    'content' | 'seo' | 'advanced'
  >('content');

  const [countdown, setCountdown] = useState<{
    text: string;
    color: string;
  } | null>(null);

  const [slugCheck, setSlugCheck] = useState<SlugCheck>({
    available: true,
    checking: false,
    message: '',
  });

  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const checkSlugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slugRequestId = useRef(0);
  const originalSlugRef = useRef('');
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    type: 'news',
    featuredImage: '',
    actualImage: '',
    galleryImages: [],
    status: 'draft',
    isFeatured: false,
    isPopular: false,
    isBreaking: false,
    publishedAt: '',
    expiresAt: '',
    deadline: '',
    authorName: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    focusKeyword: '',
    canonicalUrl: '',
    robots: 'index, follow',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    ogType: 'article',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    twitterCard: 'summary_large_image',
    schemaMarkup: '',
    breadcrumbTitle: '',
    priority: '0.5',
    changefreq: 'weekly',
    oldSlug: '',
    meta: {},
    tags: [],
    imageAlt: '',
  });

  const [charCount, setCharCount] = useState<CharCount>({
    title: 0,
    desc: 0,
    ogTitle: 0,
    ogDesc: 0,
    twitterTitle: 0,
    twitterDesc: 0,
  });

  // ==================== SEO HELPERS ====================

  const generateMetaTitle = (title: string, type: string) => {
    if (!title) return '';

    const prefix =
      type === 'admission'
        ? 'Admissions 2026: '
        : type === 'scholarship'
          ? 'Scholarship: '
          : type === 'news'
            ? 'Breaking: '
            : '';

    const result = prefix + title;

    return result.length > 60
      ? result.substring(0, 57) + '...'
      : result;
  };

  const generateMetaDescription = (
    content: string,
    excerpt: string
  ) => {
    if (excerpt.trim()) {
      const clean = excerpt
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      return clean.length > 160
        ? clean.substring(0, 157) + '...'
        : clean;
    }

    if (!content) return '';

    const plain = content
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return plain.length > 160
      ? plain.substring(0, 157) + '...'
      : plain;
  };

  // ==================== SLUG CHECK ====================

  const checkSlug = async (slug: string) => {
    const requestId = ++slugRequestId.current;

    if (!slug.trim()) {
      setSlugCheck({
        available: false,
        checking: false,
        message: 'Slug is required',
      });
      return;
    }

    // Existing slug belongs to this post, so it is valid.
    if (slug === originalSlugRef.current) {
      setSlugCheck({
        available: true,
        checking: false,
        message: '✓ Current slug',
      });
      return;
    }

    setSlugCheck({
      available: false,
      checking: true,
      message: 'Checking...',
    });

    try {
      const response = await fetch('/api/admin/post/check-slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
      });

      const data = await readJsonObject(response);

      // Ignore stale responses from previous slug checks.
      if (requestId !== slugRequestId.current) return;

      if (!response.ok || typeof data.isAvailable !== 'boolean') {
        throw new Error(getString(data.error, 'Unable to verify slug.'));
      }

      setSlugCheck({
        available: data.isAvailable,
        checking: false,
        message: data.isAvailable
          ? '✓ Available'
          : '✗ Already exists',
      });
    } catch (checkError) {
      if (requestId !== slugRequestId.current) return;

      console.error('Slug verification failed:', checkError);

      // Fail closed. Do not allow update if verification failed.
      setSlugCheck({
        available: false,
        checking: false,
        message: 'Unable to verify slug. Try again.',
      });
    }
  };

  const checkSlugDebounced = (slug: string) => {
    if (checkSlugTimer.current) {
      clearTimeout(checkSlugTimer.current);
    }

    // Invalidate any request already in progress.
    slugRequestId.current++;

    if (slug === originalSlugRef.current) {
      setSlugCheck({
        available: true,
        checking: false,
        message: '✓ Current slug',
      });
      return;
    }

    if (!slug.trim()) {
      setSlugCheck({
        available: false,
        checking: false,
        message: 'Slug is required',
      });
      return;
    }

    setSlugCheck({
      available: false,
      checking: true,
      message: 'Waiting to check...',
    });

    checkSlugTimer.current = setTimeout(() => {
      void checkSlug(slug);
    }, 500);
  };

  // ==================== FETCH POST ====================

  useEffect(() => {
    let active = true;

    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/admin/post/${id}`);
        const data = await readJsonObject(response);

        if (
          !response.ok ||
          data.success !== true ||
          !isRecord(data.post)
        ) {
          throw new Error(getString(data.error, 'Post not found'));
        }

        if (!active) return;

        const post = data.post;
        const meta = getRecord(post.meta);

        const postTitle = getString(post.title);
        const postMetaTitle = getString(post.metaTitle);
        const postMetaDescription = getString(post.metaDescription);
        const postOgTitle = getString(post.ogTitle);
        const postOgDescription = getString(post.ogDescription);
        const postTwitterTitle = getString(post.twitterTitle);
        const postTwitterDescription = getString(post.twitterDescription);
        const postSlug = getString(post.slug);

        originalSlugRef.current = postSlug;

        setSlugCheck({
          available: Boolean(postSlug),
          checking: false,
          message: postSlug ? '✓ Current slug' : 'Slug is required',
        });

        const deadline = toDateTimeLocal(
          getString(post.expiresAt) || getString(meta.deadline)
        );

        const schemaValue = post.schemaMarkup;
        let schemaMarkup = '';

        if (typeof schemaValue === 'string') {
          schemaMarkup = schemaValue;
        } else if (
          schemaValue !== null &&
          typeof schemaValue === 'object'
        ) {
          schemaMarkup = JSON.stringify(schemaValue, null, 2);
        }

        setFormData({
          title: postTitle,
          slug: postSlug,
          content: getString(post.content),
          excerpt: getString(post.excerpt),
          type: getString(post.type, 'news'),
          featuredImage: getString(post.featuredImage),
          actualImage: getString(post.actualImage),
          galleryImages: getStringArray(post.galleryImages),
          status: getString(post.status, 'draft'),
          isFeatured: getBoolean(post.isFeatured),
          isPopular: getBoolean(post.isPopular),
          isBreaking: getBoolean(post.isBreaking),
          publishedAt: toDateTimeLocal(getString(post.publishedAt)),
          expiresAt: toDateTimeLocal(getString(post.expiresAt)),
          deadline,
          authorName: getString(post.authorName),
          metaTitle: postMetaTitle,
          metaDescription: postMetaDescription,
          metaKeywords: getString(post.metaKeywords),
          focusKeyword: getString(post.focusKeyword),
          canonicalUrl: getString(post.canonicalUrl),
          robots: getString(post.robots, 'index, follow'),
          ogTitle: postOgTitle,
          ogDescription: postOgDescription,
          ogImage: getString(post.ogImage),
          ogType: getString(post.ogType, 'article'),
          twitterTitle: postTwitterTitle,
          twitterDescription: postTwitterDescription,
          twitterImage: getString(post.twitterImage),
          twitterCard: getString(post.twitterCard, 'summary_large_image'),
          schemaMarkup,
          breadcrumbTitle: getString(post.breadcrumbTitle),
          priority: getStringOrNumber(post.priority, '0.5'),
          changefreq: getString(post.changefreq, 'weekly'),
          oldSlug: getString(post.oldSlug),
          meta,
          tags: getStringArray(post.tags),
          imageAlt: getString(meta.imageAlt),
        });

        setCharCount({
          title: postMetaTitle.length,
          desc: postMetaDescription.length,
          ogTitle: postOgTitle.length,
          ogDesc: postOgDescription.length,
          twitterTitle: postTwitterTitle.length,
          twitterDesc: postTwitterDescription.length,
        });
      } catch (fetchError) {
        if (!active) return;

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Failed to fetch post'
        );
      } finally {
        if (active) {
          setFetching(false);
        }
      }
    };

    void fetchPost();

    return () => {
      active = false;
    };
  }, [id]);

  // ==================== DEADLINE COUNTDOWN ====================

  useEffect(() => {
    if (!formData.deadline) {
      setCountdown(null);
      return;
    }

    const deadlineDate = new Date(formData.deadline).getTime();

    if (Number.isNaN(deadlineDate)) {
      setCountdown(null);
      return;
    }

    const days = Math.ceil(
      (deadlineDate - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (days < 0) {
      setCountdown({
        text: 'Deadline passed',
        color: 'bg-gray-100 text-gray-600',
      });
    } else if (days === 0) {
      setCountdown({
        text: 'Last day today!',
        color: 'bg-red-100 text-red-700',
      });
    } else if (days <= 3) {
      setCountdown({
        text: `${days} days left!`,
        color: 'bg-red-100 text-red-700',
      });
    } else if (days <= 7) {
      setCountdown({
        text: `${days} days left`,
        color: 'bg-orange-100 text-orange-700',
      });
    } else if (days <= 30) {
      setCountdown({
        text: `${days} days left`,
        color: 'bg-yellow-100 text-yellow-700',
      });
    } else {
      setCountdown({
        text: `${days} days left`,
        color: 'bg-green-100 text-green-700',
      });
    }
  }, [formData.deadline]);

  // ==================== AUTO-SAVE DRAFT ====================

  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      if (isDirty && !success && (formData.title || formData.content)) {
        try {
          localStorage.setItem(
            `nextid_post_draft_${id}`,
            JSON.stringify({
              formData,
              savedAt: new Date().toISOString(),
            })
          );

          setLastSaved(new Date());
        } catch (storageError) {
          console.error('Unable to save local draft:', storageError);
        }
      }
    }, 30000);

    return () => {
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, [formData, isDirty, success, id]);

  // ==================== WARN BEFORE TAB CLOSE ====================

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (isDirty && !success) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handler);

    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [isDirty, success]);

  // ==================== HANDLERS ====================

  const handleTitleChange = (title: string) => {
    const newSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);

    const metaTitle = generateMetaTitle(title, formData.type);
    const metaDescription = generateMetaDescription(
      formData.content,
      formData.excerpt
    );

    setFormData((previous) => ({
      ...previous,
      title,
      slug: newSlug,
      metaTitle,
      ogTitle: metaTitle,
      twitterTitle: metaTitle,
      metaDescription,
      ogDescription: metaDescription,
      twitterDescription: metaDescription,
    }));

    setIsDirty(true);
    checkSlugDebounced(newSlug);

    setCharCount((previous) => ({
      ...previous,
      title: metaTitle.length,
      ogTitle: metaTitle.length,
      twitterTitle: metaTitle.length,
    }));
  };

  const handleContentChange = (value: string | EditorSection[]) => {
    const content = typeof value === 'string' ? value : '';

    const metaDescription = generateMetaDescription(
      content,
      formData.excerpt
    );

    setFormData((previous) => ({
      ...previous,
      content,
      metaDescription,
      ogDescription: metaDescription,
      twitterDescription: metaDescription,
    }));

    setCharCount((previous) => ({
      ...previous,
      desc: metaDescription.length,
      ogDesc: metaDescription.length,
      twitterDesc: metaDescription.length,
    }));

    setIsDirty(true);
  };

  const handleExcerptChange = (excerpt: string) => {
    const metaDescription = generateMetaDescription(
      formData.content,
      excerpt
    );

    setFormData((previous) => ({
      ...previous,
      excerpt,
      metaDescription,
      ogDescription: metaDescription,
      twitterDescription: metaDescription,
    }));

    setCharCount((previous) => ({
      ...previous,
      desc: metaDescription.length,
      ogDesc: metaDescription.length,
      twitterDesc: metaDescription.length,
    }));

    setIsDirty(true);
  };

  const handleImageSelect = (url: string) => {
    setFormData((previous) => ({
      ...previous,
      featuredImage: url,
      ogImage: url,
      twitterImage: url,
    }));

    setIsDirty(true);
  };

  const regenerateMeta = () => {
    const metaTitle = generateMetaTitle(
      formData.title,
      formData.type
    );

    const metaDescription = generateMetaDescription(
      formData.content,
      formData.excerpt
    );

    setFormData((previous) => ({
      ...previous,
      metaTitle,
      metaDescription,
      ogTitle: metaTitle,
      ogDescription: metaDescription,
      twitterTitle: metaTitle,
      twitterDescription: metaDescription,
    }));

    setCharCount({
      title: metaTitle.length,
      desc: metaDescription.length,
      ogTitle: metaTitle.length,
      ogDesc: metaDescription.length,
      twitterTitle: metaTitle.length,
      twitterDesc: metaDescription.length,
    });

    setIsDirty(true);
    toast.success('Meta tags regenerated!');
  };

  const buildMetaObject = (): Record<string, unknown> => ({
    ...formData.meta,
    deadline: formData.deadline || null,
    imageAlt: formData.imageAlt,
  });

  // ==================== UPDATE POST ====================

  const submitUpdate = async (status?: 'draft' | 'published') => {
    if (loading) return;

    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('Title is required');
      toast.error('Title is required');
      setLoading(false);
      return;
    }

    if (
      !formData.content ||
      formData.content.trim() === '' ||
      formData.content === '<p></p>'
    ) {
      setError('Content is required');
      toast.error('Content is required');
      setLoading(false);
      return;
    }

    if (!formData.slug.trim()) {
      setError('Slug is required');
      toast.error('Slug is required');
      setLoading(false);
      return;
    }

    if (!slugCheck.available || slugCheck.checking) {
      setError(
        'Please choose a different slug or wait for slug verification'
      );
      toast.error('Please verify the slug before updating');
      setLoading(false);
      return;
    }

    if (!formData.authorName.trim()) {
      setError('Author name is required');
      toast.error('Author name is required');
      setLoading(false);
      return;
    }

    let schemaMarkup: Record<string, unknown> | unknown[] | null;

    try {
      schemaMarkup = parseSchemaMarkup(formData.schemaMarkup);

      if (!schemaMarkup) {
        const autoSchema = generateSchema({
          title: formData.title,
          description: formData.metaDescription || formData.excerpt,
          image: formData.featuredImage,
          url: `https://www.nextid.pk/${getUrlFolder(formData.type)}/${formData.slug}`,
          authorName: formData.authorName,
          publishedAt: formData.publishedAt,
          type: formData.type,
          meta: buildMetaObject(),
        });

        const parsedSchema: unknown = JSON.parse(autoSchema);

        if (!parsedSchema || typeof parsedSchema !== 'object') {
          throw new Error('Generated schema markup is invalid.');
        }

        schemaMarkup = parsedSchema as
          | Record<string, unknown>
          | unknown[];
      }
    } catch (schemaError) {
      setError(
        schemaError instanceof Error
          ? schemaError.message
          : 'Invalid schema'
      );

      toast.error(
        schemaError instanceof Error
          ? schemaError.message
          : 'Invalid schema'
      );

      setLoading(false);
      return;
    }

    const submitData = {
      ...formData,
      status: status || formData.status,
      meta: buildMetaObject(),
      publishedAt: formData.publishedAt,
      expiresAt: formData.deadline
        ? new Date(formData.deadline).toISOString()
        : null,
      schemaMarkup,
    };

    try {
      const response = await fetch(`/api/admin/post/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await readJsonObject(response);

      if (response.ok && data.success === true) {
        setSuccess('Post updated successfully!');
        setIsDirty(false);

        toast.success(
          status === 'draft' ? 'Draft saved!' : 'Post updated!'
        );

        try {
          localStorage.removeItem(`nextid_post_draft_${id}`);
        } catch {
          // Local draft cleanup is optional.
        }

        setTimeout(() => {
          router.push('/admin/post');
        }, 1500);
      } else {
        const errorMessage = getString(
          data.error,
          'Failed to update'
        );

        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (updateError) {
      const errorMessage =
        updateError instanceof Error
          ? updateError.message
          : 'Something went wrong';

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitUpdate();
  };

  const handleSaveDraft = () => {
    void submitUpdate('draft');
  };

  const handlePreview = () => {
    if (!formData.slug) {
      toast.error('Slug missing');
      return;
    }

    toast.info('Preview coming soon');
  };

  const handleViewWebsite = () => {
    const slug = originalSlugRef.current || formData.slug;

    if (!slug) {
      toast.error('Slug missing');
      return;
    }

    window.open(
      `/${getUrlFolder(formData.type)}/${slug}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // ==================== SEO PREVIEW ====================

  const seoPreview = {
    title: formData.metaTitle || formData.title || 'Your Title Here',
    description:
      formData.metaDescription ||
      formData.excerpt ||
      'Your description...',
    url: `https://www.nextid.pk/${getUrlFolder(formData.type)}/${formData.slug || 'example-post'}`,
  };

  // ==================== CLEANUP ====================

  useEffect(() => {
    return () => {
      if (checkSlugTimer.current) {
        clearTimeout(checkSlugTimer.current);
      }

      slugRequestId.current++;

      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
      }
    };
  }, []);

  // ==================== RENDER ====================

  if (fetching) {
    return <LoadingSkeleton />;
  }

  if (error && !formData.title && !formData.content) {
    return (
      <div className="min-h-screen bg-gray-100 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-red-600">
            <FiAlertCircle className="h-5 w-5" />
            <h1 className="font-semibold">Unable to load post</h1>
          </div>

          <p className="mb-5 text-sm text-gray-600">{error}</p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>

            <Link
              href="/admin/post"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Back to Posts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-gray-900 px-4 py-2 text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-sm font-medium hover:text-gray-300"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/post"
              className="text-sm font-medium hover:text-gray-300"
            >
              All Posts
            </Link>

            <span className="text-sm text-gray-400">|</span>

            <span className="text-sm font-semibold">Edit Post</span>

            {lastSaved && (
              <span className="text-xs text-gray-400">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {formData.status === 'published' ? (
              <span className="rounded bg-green-600 px-2 py-1 text-xs">
                Published
              </span>
            ) : (
              <span className="rounded bg-yellow-600 px-2 py-1 text-xs">
                Draft
              </span>
            )}

            <button
              type="submit"
              form="edit-post-form"
              disabled={loading || !slugCheck.available || slugCheck.checking}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update your post content and SEO settings
          </p>
        </div>

        {countdown && (
          <div
            className={`${countdown.color} mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium`}
          >
            <FiClock className="h-4 w-4" />
            Deadline: {countdown.text}
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
            <FiCheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* TABS */}
        <div className="mb-4 flex gap-1 overflow-x-auto border-b border-gray-300">
          {[
            { key: 'content' as const, label: '📝 Content' },
            { key: 'seo' as const, label: '🔍 SEO' },
            { key: 'advanced' as const, label: '⚙️ Advanced' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'border border-b-0 border-gray-300 bg-white text-blue-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form id="edit-post-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* LEFT COLUMN */}
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  className="w-full border-none text-2xl font-bold placeholder-gray-300 focus:outline-none focus:ring-0"
                  placeholder="Add title"
                />
              </div>

              {activeTab === 'content' && (
                <>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Post Type
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {POST_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            const newMetaTitle = generateMetaTitle(
                              formData.title,
                              type.value
                            );

                            setFormData((previous) => ({
                              ...previous,
                              type: type.value,
                              metaTitle: newMetaTitle,
                              ogTitle: newMetaTitle,
                            }));

                            setCharCount((previous) => ({
                              ...previous,
                              title: newMetaTitle.length,
                              ogTitle: newMetaTitle.length,
                            }));

                            setIsDirty(true);
                          }}
                          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                            formData.type === type.value
                              ? `${type.color} ring-2 ring-blue-500 ring-offset-1`
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <span>{type.icon}</span>
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Content
                    </label>

                    <RichTextEditor
                      value={formData.content}
                      onChange={handleContentChange}
                      placeholder="Write your content here..."
                      minHeight={400}
                      mode="single"
                    />

                    <div className="mt-4">
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Excerpt
                        <span className="ml-2 text-xs text-green-600">
                          → Meta Description
                        </span>
                      </label>

                      <textarea
                        value={formData.excerpt}
                        onChange={(e) => handleExcerptChange(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm"
                        placeholder="Brief summary..."
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'seo' && (
                <>
                  <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <FiSearch className="h-4 w-4 text-blue-600" />
                        SEO Settings
                      </h3>

                      <button
                        type="button"
                        onClick={regenerateMeta}
                        className="rounded border border-blue-200 bg-white px-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Regenerate
                      </button>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Focus Keyword
                      </label>

                      <input
                        type="text"
                        value={formData.focusKeyword}
                        onChange={(e) => {
                          setFormData((previous) => ({
                            ...previous,
                            focusKeyword: e.target.value,
                          }));
                          setIsDirty(true);
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="e.g., university admission 2026"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Meta Keywords
                      </label>

                      <input
                        type="text"
                        value={formData.metaKeywords}
                        onChange={(e) => {
                          setFormData((previous) => ({
                            ...previous,
                            metaKeywords: e.target.value,
                          }));
                          setIsDirty(true);
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="keyword1, keyword2"
                      />
                    </div>

                    <div>
                      <div className="mb-1 flex justify-between">
                        <label className="text-xs font-medium text-gray-600">
                          Meta Title
                        </label>

                        <span
                          className={`text-xs ${
                            charCount.title > 60
                              ? 'text-red-500'
                              : 'text-green-500'
                          }`}
                        >
                          {charCount.title}/60
                        </span>
                      </div>

                      <input
                        type="text"
                        value={formData.metaTitle}
                        onChange={(e) => {
                          const value = e.target.value;

                          setFormData((previous) => ({
                            ...previous,
                            metaTitle: value,
                          }));

                          setCharCount((previous) => ({
                            ...previous,
                            title: value.length,
                          }));

                          setIsDirty(true);
                        }}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                          charCount.title > 60
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="mb-1 flex justify-between">
                        <label className="text-xs font-medium text-gray-600">
                          Meta Description
                        </label>

                        <span
                          className={`text-xs ${
                            charCount.desc > 160
                              ? 'text-red-500'
                              : 'text-green-500'
                          }`}
                        >
                          {charCount.desc}/160
                        </span>
                      </div>

                      <textarea
                        value={formData.metaDescription}
                        onChange={(e) => {
                          const value = e.target.value;

                          setFormData((previous) => ({
                            ...previous,
                            metaDescription: value,
                          }));

                          setCharCount((previous) => ({
                            ...previous,
                            desc: value.length,
                          }));

                          setIsDirty(true);
                        }}
                        rows={3}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                          charCount.desc > 160
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Canonical URL
                      </label>

                      <input
                        type="text"
                        value={formData.canonicalUrl}
                        onChange={(e) => {
                          setFormData((previous) => ({
                            ...previous,
                            canonicalUrl: e.target.value,
                          }));
                          setIsDirty(true);
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Robots
                      </label>

                      <select
                        value={formData.robots}
                        onChange={(e) => {
                          setFormData((previous) => ({
                            ...previous,
                            robots: e.target.value,
                          }));
                          setIsDirty(true);
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        {ROBOTS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <PreviewBox
                    title={seoPreview.title}
                    description={seoPreview.description}
                    url={seoPreview.url}
                  />
                </>
              )}

              {activeTab === 'advanced' && (
                <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <FiGlobe className="h-4 w-4" />
                    Advanced Settings
                  </h3>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      OG Type
                    </label>

                    <select
                      value={formData.ogType}
                      onChange={(e) => {
                        setFormData((previous) => ({
                          ...previous,
                          ogType: e.target.value,
                        }));
                        setIsDirty(true);
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      {OG_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      OG Title
                    </label>

                    <input
                      type="text"
                      value={formData.ogTitle}
                      onChange={(e) => {
                        setFormData((previous) => ({
                          ...previous,
                          ogTitle: e.target.value,
                        }));
                        setIsDirty(true);
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      OG Description
                    </label>

                    <textarea
                      value={formData.ogDescription}
                      onChange={(e) => {
                        setFormData((previous) => ({
                          ...previous,
                          ogDescription: e.target.value,
                        }));
                        setIsDirty(true);
                      }}
                      rows={2}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Twitter Card
                    </label>

                    <select
                      value={formData.twitterCard}
                      onChange={(e) => {
                        setFormData((previous) => ({
                          ...previous,
                          twitterCard: e.target.value,
                        }));
                        setIsDirty(true);
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      {TWITTER_CARDS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Twitter Title
                    </label>

                    <input
                      type="text"
                      value={formData.twitterTitle}
                      onChange={(e) => {
                        setFormData((previous) => ({
                          ...previous,
                          twitterTitle: e.target.value,
                        }));
                        setIsDirty(true);
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Twitter Description
                    </label>

                    <textarea
                      value={formData.twitterDescription}
                      onChange={(e) => {
                        setFormData((previous) => ({
                          ...previous,
                          twitterDescription: e.target.value,
                        }));
                        setIsDirty(true);
                      }}
                      rows={2}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Sitemap Priority
                    </label>

                    <select
                      value={formData.priority}
                      onChange={(e) => {
                        setFormData((previous) => ({
                          ...previous,
                          priority: e.target.value,
                        }));
                        setIsDirty(true);
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Change Frequency
                    </label>

                    <select
                      value={formData.changefreq}
                      onChange={(e) => {
                        setFormData((previous) => ({
                          ...previous,
                          changefreq: e.target.value,
                        }));
                        setIsDirty(true);
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      {CHANGEFREQ_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Breadcrumb Title
                    </label>

                    <input
                      type="text"
                      value={formData.breadcrumbTitle}
                      onChange={(e) => {
                        setFormData((previous) => ({
                          ...previous,
                          breadcrumbTitle: e.target.value,
                        }));
                        setIsDirty(true);
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Schema Markup (JSON-LD)
                      <span className="ml-2 text-xs text-green-600">
                        Auto-generated if empty
                      </span>
                    </label>

                    <textarea
                      value={formData.schemaMarkup}
                      onChange={(e) => {
                        setFormData((previous) => ({
                          ...previous,
                          schemaMarkup: e.target.value,
                        }));
                        setIsDirty(true);
                      }}
                      rows={6}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
                      placeholder="Auto-generated..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              <PublishMetaBox
                status={formData.status}
                onStatusChange={(value) => {
                  setFormData((previous) => ({
                    ...previous,
                    status: value,
                  }));
                  setIsDirty(true);
                }}
                publishedAt={formData.publishedAt}
                onPublishedAtChange={(value) => {
                  setFormData((previous) => ({
                    ...previous,
                    publishedAt: value,
                  }));
                  setIsDirty(true);
                }}
                deadline={formData.deadline}
                onDeadlineChange={(value) => {
                  setFormData((previous) => ({
                    ...previous,
                    deadline: value,
                  }));
                  setIsDirty(true);
                }}
                isFeatured={formData.isFeatured}
                onFeaturedChange={(value) => {
                  setFormData((previous) => ({
                    ...previous,
                    isFeatured: value,
                  }));
                  setIsDirty(true);
                }}
                isPopular={formData.isPopular}
                onPopularChange={(value) => {
                  setFormData((previous) => ({
                    ...previous,
                    isPopular: value,
                  }));
                  setIsDirty(true);
                }}
                isBreaking={formData.isBreaking}
                onBreakingChange={(value) => {
                  setFormData((previous) => ({
                    ...previous,
                    isBreaking: value,
                  }));
                  setIsDirty(true);
                }}
                loading={loading}
                slugCheck={slugCheck}
                onSaveDraft={handleSaveDraft}
                onPreview={handlePreview}
                onViewWebsite={handleViewWebsite}
                canViewWebsite={Boolean(formData.slug)}
              />

              <AuthorBox
                authorName={formData.authorName}
                onAuthorNameChange={(value) => {
                  setFormData((previous) => ({
                    ...previous,
                    authorName: value,
                  }));
                  setIsDirty(true);
                }}
              />

              <PermalinkBox
                slug={formData.slug}
                type={formData.type}
                slugCheck={slugCheck}
              />

              <RedirectBox
                oldSlug={formData.oldSlug}
                onOldSlugChange={(value) => {
                  setFormData((previous) => ({
                    ...previous,
                    oldSlug: value,
                  }));
                  setIsDirty(true);
                }}
              />

              <FeaturedImageBox
                image={formData.featuredImage}
                onImageSelect={handleImageSelect}
                imageAlt={formData.imageAlt}
                onImageAltChange={(value) => {
                  setFormData((previous) => ({
                    ...previous,
                    imageAlt: value,
                  }));
                  setIsDirty(true);
                }}
              />

              <CategoriesTagsBox
                tags={formData.tags}
                onTagsChange={(tags) => {
                  setFormData((previous) => ({
                    ...previous,
                    tags,
                  }));
                  setIsDirty(true);
                }}
                postType={formData.type}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}