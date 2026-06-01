// app/admin/news/[id]/edit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/select";
import RichTextEditor, { EditorSection } from "@/components/ui/RichTextEditor";
import { X, Hash, Plus } from "lucide-react";

type NewsItem = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string | null;
  tags: string[] | null;
  imageUrl: string | null;
  programId: number | null;
  instituteId: number | null;
  boardId: number | null;
  cityId: number | null;
  source: string | null;
  author: string | null;
  isFeatured: boolean;
  isBreaking: boolean;
  status: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  viewCount: number;
  createdAt: string;
  seo?: {
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string | null;
    canonicalUrl: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    twitterCard: string;
    twitterTitle: string | null;
    twitterDescription: string | null;
    twitterImage: string | null;
  };
};

type Option = { value: number; label: string };

// ✅ Category Options
const CATEGORY_OPTIONS = [
  { value: "Admissions", label: "🎓 Admissions" },
  { value: "Results", label: "📊 Results" },
  { value: "Scholarships", label: "💰 Scholarships" },
  { value: "Exams", label: "📝 Exams" },
  { value: "Events", label: "🎉 Events" },
  { value: "Announcements", label: "📢 Announcements" },
  { value: "Jobs", label: "💼 Jobs" },
  { value: "News", label: "📰 General News" },
];

// ✅ Popular Tags Suggestions
const POPULAR_TAGS = [
  "Admissions",
  "Results",
  "Scholarships",
  "Exams",
  "NUST",
  "PU",
  "UET",
  "LUMS",
  "IBA",
  "HEC",
  "BISE",
  "CSS",
  "PMS",
  "NTS",
  "Entry Test",
];

// ✅ SEO Metadata Interface
interface SeoMetadata {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
}

// ✅ Google standards ke mutabiq character limits
const META_TITLE_MAX = 60;
const META_DESC_MAX = 160;
const OG_TITLE_MAX = 60;
const OG_DESC_MAX = 200;
const TWITTER_TITLE_MAX = 70;
const TWITTER_DESC_MAX = 200;

export default function EditNewsPage() {
  const router = useRouter();
  const params = useParams();
  const newsId = params.id as string;

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [source, setSource] = useState("");
  const [author, setAuthor] = useState("");
  const [programId, setProgramId] = useState<number | null>(null);
  const [instituteId, setInstituteId] = useState<number | null>(null);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [publishedAt, setPublishedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [status, setStatus] = useState(true);
  const [viewCount, setViewCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showSeoPanel, setShowSeoPanel] = useState(false);

  // ✅ SEO Metadata States
  const [seo, setSeo] = useState<SeoMetadata>({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    canonicalUrl: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterCard: "summary_large_image",
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
  });

  // ✅ Track if SEO fields were manually edited
  const [seoManuallyEdited, setSeoManuallyEdited] = useState({
    metaTitle: false,
    metaDescription: false,
    ogTitle: false,
    ogDescription: false,
    twitterTitle: false,
    twitterDescription: false,
  });

  // Data lists
  const [programs, setPrograms] = useState<Option[]>([]);
  const [institutes, setInstitutes] = useState<Option[]>([]);
  const [boards, setBoards] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WordPress-like tabs for content area
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");

  // ✅ Add Tag Function
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    } else if (tags.length >= 10) {
      toast.warning("Maximum 10 tags allowed");
    } else if (tags.includes(trimmedTag)) {
      toast.warning("Tag already added");
    }
  };

  // ✅ Remove Tag Function
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // ✅ Handle Tag Input Key Press
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  // Fetch all dropdown data
  useEffect(() => {
    async function fetchRelations() {
      try {
        const [pRes, iRes, bRes, cRes] = await Promise.all([
          fetch("/api/admin/programs"),
          fetch("/api/admin/institutes"),
          fetch("/api/admin/boards"),
          fetch("/api/admin/cities"),
        ]);

        const pData = await pRes.json();
        const iData = await iRes.json();
        const bData = await bRes.json();
        const cData = await cRes.json();

        setPrograms(
          pData.programs?.map((p: any) => ({ value: p.id, label: p.name })) ||
            [],
        );
        setInstitutes(
          iData.institutes?.map((i: any) => ({
            value: i.id,
            label: `${i.name} (${i.cityName})`,
          })) || [],
        );
        setBoards(
          bData.boards?.map((b: any) => ({ value: b.id, label: b.name })) || [],
        );
        setCities(
          cData.cities?.map((c: any) => ({ value: c.id, label: c.name })) || [],
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load relations");
      }
    }
    fetchRelations();
  }, []);

  // Fetch news data
  useEffect(() => {
    async function fetchNews() {
      if (!newsId) return;
      setFetchLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/admin/news/${newsId}`);
        if (!res.ok) throw new Error("News not found");
        const data = await res.json();
        if (!data.success)
          throw new Error(data.error || "Failed to fetch news");

        const news: NewsItem = data.news;
        setTitle(news.title);
        setSlug(news.slug);
        setContent(news.content);
        setExcerpt(news.excerpt || "");
        setCategory(news.category || "");
        setTags(news.tags || []);
        setImageUrl(news.imageUrl || "");
        setImagePreview(news.imageUrl || null);
        setSource(news.source || "");
        setAuthor(news.author || "");
        setProgramId(news.programId);
        setInstituteId(news.instituteId);
        setBoardId(news.boardId);
        setCityId(news.cityId);
        setPublishedAt(news.publishedAt ? news.publishedAt.slice(0, 16) : "");
        setExpiresAt(news.expiresAt ? news.expiresAt.slice(0, 16) : "");
        setIsFeatured(news.isFeatured);
        setIsBreaking(news.isBreaking);
        setStatus(news.status);
        setViewCount(news.viewCount || 0);

        // ✅ Load SEO metadata
        if (news.seo) {
          setSeo({
            metaTitle: news.seo.metaTitle || "",
            metaDescription: news.seo.metaDescription || "",
            metaKeywords: news.seo.metaKeywords || "",
            canonicalUrl: news.seo.canonicalUrl || "",
            ogTitle: news.seo.ogTitle || "",
            ogDescription: news.seo.ogDescription || "",
            ogImage: news.seo.ogImage || "",
            twitterCard: news.seo.twitterCard || "summary_large_image",
            twitterTitle: news.seo.twitterTitle || "",
            twitterDescription: news.seo.twitterDescription || "",
            twitterImage: news.seo.twitterImage || "",
          });

          // Mark as manually edited if values exist
          setSeoManuallyEdited({
            metaTitle: !!news.seo.metaTitle,
            metaDescription: !!news.seo.metaDescription,
            ogTitle: !!news.seo.ogTitle,
            ogDescription: !!news.seo.ogDescription,
            twitterTitle: !!news.seo.twitterTitle,
            twitterDescription: !!news.seo.twitterDescription,
          });
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to fetch news");
        toast.error(
          err instanceof Error ? err.message : "Failed to fetch news",
        );
      } finally {
        setFetchLoading(false);
      }
    }
    fetchNews();
  }, [newsId]);

  // ✅ Auto-generate SEO title from news title (if not manually edited)
  useEffect(() => {
    if (title && !seoManuallyEdited.metaTitle) {
      const truncatedTitle =
        title.length > META_TITLE_MAX
          ? title.substring(0, META_TITLE_MAX - 3) + "..."
          : title;
      setSeo((prev) => ({ ...prev, metaTitle: truncatedTitle }));
    }
    if (title && !seoManuallyEdited.ogTitle) {
      const truncatedTitle =
        title.length > OG_TITLE_MAX
          ? title.substring(0, OG_TITLE_MAX - 3) + "..."
          : title;
      setSeo((prev) => ({ ...prev, ogTitle: truncatedTitle }));
    }
    if (title && !seoManuallyEdited.twitterTitle) {
      const truncatedTitle =
        title.length > TWITTER_TITLE_MAX
          ? title.substring(0, TWITTER_TITLE_MAX - 3) + "..."
          : title;
      setSeo((prev) => ({ ...prev, twitterTitle: truncatedTitle }));
    }
  }, [title, seoManuallyEdited]);

  // ✅ Auto-generate meta description from excerpt (if not manually edited)
  useEffect(() => {
    const sourceText =
      excerpt || content.replace(/<[^>]*>/g, "").substring(0, 200);
    if (sourceText && !seoManuallyEdited.metaDescription) {
      const truncatedDesc =
        sourceText.length > META_DESC_MAX
          ? sourceText.substring(0, META_DESC_MAX - 3) + "..."
          : sourceText;
      setSeo((prev) => ({ ...prev, metaDescription: truncatedDesc }));
    }
    if (sourceText && !seoManuallyEdited.ogDescription) {
      const truncatedDesc =
        sourceText.length > OG_DESC_MAX
          ? sourceText.substring(0, OG_DESC_MAX - 3) + "..."
          : sourceText;
      setSeo((prev) => ({ ...prev, ogDescription: truncatedDesc }));
    }
    if (sourceText && !seoManuallyEdited.twitterDescription) {
      const truncatedDesc =
        sourceText.length > TWITTER_DESC_MAX
          ? sourceText.substring(0, TWITTER_DESC_MAX - 3) + "..."
          : sourceText;
      setSeo((prev) => ({ ...prev, twitterDescription: truncatedDesc }));
    }
  }, [excerpt, content, seoManuallyEdited]);

  // ✅ Auto-generate canonical URL from slug
  useEffect(() => {
    if (slug && !seo.canonicalUrl) {
      setSeo((prev) => ({
        ...prev,
        canonicalUrl: `https://www.nextid.pk/news/${slug}`,
      }));
    }
  }, [slug]);

  // ✅ Auto-set og:image from featured image
  useEffect(() => {
    if (imageUrl && !seo.ogImage) {
      setSeo((prev) => ({ ...prev, ogImage: imageUrl }));
    }
    if (imageUrl && !seo.twitterImage) {
      setSeo((prev) => ({ ...prev, twitterImage: imageUrl }));
    }
  }, [imageUrl]);

  // ✅ Handle image URL change (block base64)
  const handleImageUrlChange = (url: string) => {
    if (url.startsWith("data:image")) {
      toast.error(
        "Base64 images are not supported. Please use a valid image URL.",
      );
      return;
    }
    setImageUrl(url);
    setImagePreview(url);
  };

  // ✅ Handle SEO field changes with limits
  const handleMetaTitleChange = (val: string) => {
    setSeoManuallyEdited((prev) => ({ ...prev, metaTitle: true }));
    if (val.length <= META_TITLE_MAX) {
      setSeo((prev) => ({ ...prev, metaTitle: val }));
    } else {
      toast.warning(`Meta title cannot exceed ${META_TITLE_MAX} characters`);
    }
  };

  const handleMetaDescriptionChange = (val: string) => {
    setSeoManuallyEdited((prev) => ({ ...prev, metaDescription: true }));
    if (val.length <= META_DESC_MAX) {
      setSeo((prev) => ({ ...prev, metaDescription: val }));
    } else {
      toast.warning(
        `Meta description cannot exceed ${META_DESC_MAX} characters`,
      );
    }
  };

  const handleOgTitleChange = (val: string) => {
    setSeoManuallyEdited((prev) => ({ ...prev, ogTitle: true }));
    if (val.length <= OG_TITLE_MAX) {
      setSeo((prev) => ({ ...prev, ogTitle: val }));
    } else {
      toast.warning(`OG title cannot exceed ${OG_TITLE_MAX} characters`);
    }
  };

  const handleOgDescriptionChange = (val: string) => {
    setSeoManuallyEdited((prev) => ({ ...prev, ogDescription: true }));
    if (val.length <= OG_DESC_MAX) {
      setSeo((prev) => ({ ...prev, ogDescription: val }));
    } else {
      toast.warning(`OG description cannot exceed ${OG_DESC_MAX} characters`);
    }
  };

  const handleTwitterTitleChange = (val: string) => {
    setSeoManuallyEdited((prev) => ({ ...prev, twitterTitle: true }));
    if (val.length <= TWITTER_TITLE_MAX) {
      setSeo((prev) => ({ ...prev, twitterTitle: val }));
    } else {
      toast.warning(
        `Twitter title cannot exceed ${TWITTER_TITLE_MAX} characters`,
      );
    }
  };

  const handleTwitterDescriptionChange = (val: string) => {
    setSeoManuallyEdited((prev) => ({ ...prev, twitterDescription: true }));
    if (val.length <= TWITTER_DESC_MAX) {
      setSeo((prev) => ({ ...prev, twitterDescription: val }));
    } else {
      toast.warning(
        `Twitter description cannot exceed ${TWITTER_DESC_MAX} characters`,
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title || !slug || !content) {
      setError("Title, slug, and content are required.");
      setLoading(false);
      return;
    }

    if (!category) {
      setError("Please select a category.");
      setLoading(false);
      return;
    }

    // ✅ Check for base64 image
    if (imageUrl && imageUrl.startsWith("data:image")) {
      setError(
        "Base64 images are not supported. Please use a valid image URL.",
      );
      setLoading(false);
      return;
    }

    const toastId = `update-news-${newsId}`;
    toast.loading("Updating news...", { id: toastId });

    try {
      const res = await fetch(`/api/admin/news/${newsId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          content,
          excerpt,
          category,
          tags,
          imageUrl,
          source,
          author,
          programId,
          instituteId,
          boardId,
          cityId,
          publishedAt: publishedAt || null,
          expiresAt: expiresAt || null,
          isFeatured,
          isBreaking,
          status,
          seo: {
            metaTitle: seo.metaTitle || null,
            metaDescription: seo.metaDescription || null,
            metaKeywords: seo.metaKeywords || null,
            canonicalUrl: seo.canonicalUrl || null,
            ogTitle: seo.ogTitle || null,
            ogDescription: seo.ogDescription || null,
            ogImage: seo.ogImage || null,
            twitterCard: seo.twitterCard,
            twitterTitle: seo.twitterTitle || null,
            twitterDescription: seo.twitterDescription || null,
            twitterImage: seo.twitterImage || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to update news");

      // ✅ Clear cache after update
      await fetch("/api/admin/news/clear-cache", { method: "POST" });

      toast.success("News updated successfully", { id: toastId });
      router.push("/admin/news");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update news",
        { id: toastId },
      );
      setError(err instanceof Error ? err.message : "Failed to update news");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading news data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Link href="/admin" className="hover:text-blue-600">
              Dashboard
            </Link>
            <span className="mx-2">›</span>
            <Link href="/admin/news" className="hover:text-blue-600">
              News
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-700">Edit: {title || "News"}</span>
          </div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Edit News
            {isBreaking && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                Breaking
              </span>
            )}
            {isFeatured && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                Featured
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSeoPanel(!showSeoPanel)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            SEO Settings
          </button>

          <Link
            href="/admin/news"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            ← Back to News
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Slug Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter news title"
                    className="w-full px-3 py-2 text-2xl font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Slug - READ ONLY */}
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-md">
                  <span className="text-gray-500 text-sm">Permalink:</span>
                  <span className="text-blue-600 text-sm">
                    https://www.nextid.pk/news/
                  </span>
                  <span className="flex-1 px-2 py-1 bg-white border rounded text-sm font-mono text-gray-600">
                    {slug}
                  </span>
                  <span className="text-xs text-gray-400">
                    (Slug cannot be changed)
                  </span>
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="flex border-b">
                <button
                  type="button"
                  onClick={() => setEditorTab("write")}
                  className={`px-4 py-2 text-sm font-medium ${
                    editorTab === "write"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab("preview")}
                  className={`px-4 py-2 text-sm font-medium ${
                    editorTab === "preview"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Preview
                </button>
              </div>

              <div className="p-6">
                {editorTab === "write" ? (
                  <RichTextEditor
                    value={content}
                    onChange={(value) =>
                      setContent(typeof value === "string" ? value : "")
                    }
                    placeholder="Write your news content here..."
                    minHeight={400}
                  />
                ) : (
                  <div className="prose max-w-none">
                    <h2 className="text-2xl font-bold mb-4">{title}</h2>
                    {excerpt && (
                      <div className="bg-gray-50 p-4 rounded mb-4 italic text-gray-600">
                        {excerpt}
                      </div>
                    )}
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  </div>
                )}
              </div>
            </div>

            {/* Excerpt */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt
                <span className="text-xs text-gray-500 ml-2">
                  (used for meta description if not manually set)
                </span>
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Write a short summary of the news..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                {excerpt.length}/200 characters recommended
              </p>
            </div>

            {/* ✅ Category & Tags Section */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Category & Tags
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Categorize your news for better discovery
                </p>
              </div>
              <div className="p-4 space-y-4">
                {/* Category Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {category && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Selected:{" "}
                      {
                        CATEGORY_OPTIONS.find((c) => c.value === category)
                          ?.label
                      }
                    </p>
                  )}
                </div>

                {/* Tags Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags{" "}
                    <span className="text-xs text-gray-400">(Max 10 tags)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-md"
                      >
                        <Hash className="w-3 h-3" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-600 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagKeyPress}
                      placeholder="Type tag and press Enter or comma..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => addTag(tagInput)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Popular Tags Suggestions */}
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Popular tags:</p>
                    <div className="flex flex-wrap gap-1">
                      {POPULAR_TAGS.slice(0, 8).map((suggestedTag) => (
                        <button
                          key={suggestedTag}
                          type="button"
                          onClick={() => addTag(suggestedTag)}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-blue-100 hover:text-blue-600 transition"
                        >
                          {suggestedTag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEO Panel (Collapsible) */}
            {showSeoPanel && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-medium">SEO Metadata</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-syncs with title & excerpt. Edit manually to override.
                  </p>
                </div>
                <div className="p-4 space-y-4">
                  {/* Meta Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Title
                      <span className="text-xs text-gray-500 ml-2">
                        (50-60 characters recommended)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={seo.metaTitle}
                      onChange={(e) => handleMetaTitleChange(e.target.value)}
                      placeholder="SEO Title (auto-syncs with news title)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-400">
                        {seo.metaTitle.length}/{META_TITLE_MAX} characters
                      </p>
                      {seo.metaTitle.length > META_TITLE_MAX && (
                        <p className="text-xs text-red-500">
                          Exceeds Google's recommended limit!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Description
                      <span className="text-xs text-gray-500 ml-2">
                        (150-160 characters recommended)
                      </span>
                    </label>
                    <textarea
                      value={seo.metaDescription}
                      onChange={(e) =>
                        handleMetaDescriptionChange(e.target.value)
                      }
                      placeholder="Brief description for search engines (auto-syncs with excerpt)"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-400">
                        {seo.metaDescription.length}/{META_DESC_MAX} characters
                      </p>
                      {seo.metaDescription.length > META_DESC_MAX && (
                        <p className="text-xs text-red-500">
                          Exceeds Google's recommended limit!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Meta Keywords */}
                  <Input
                    label="Meta Keywords"
                    value={seo.metaKeywords}
                    onChange={(val) =>
                      setSeo((prev) => ({ ...prev, metaKeywords: val }))
                    }
                    placeholder="keyword1, keyword2, keyword3"
                  />

                  {/* Canonical URL */}
                  <Input
                    label="Canonical URL"
                    value={seo.canonicalUrl}
                    onChange={(val) =>
                      setSeo((prev) => ({ ...prev, canonicalUrl: val }))
                    }
                    placeholder="https://www.nextid.pk/news/slug"
                  />

                  {/* Open Graph Section */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-3">
                      Open Graph (Facebook/WhatsApp/LinkedIn)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          OG Title
                          <span className="text-xs text-gray-500 ml-2">
                            (max {OG_TITLE_MAX} chars)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={seo.ogTitle}
                          onChange={(e) => handleOgTitleChange(e.target.value)}
                          placeholder="Social media title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {seo.ogTitle.length}/{OG_TITLE_MAX}
                        </p>
                      </div>
                      <Input
                        label="OG Image URL"
                        value={seo.ogImage}
                        onChange={(val) =>
                          setSeo((prev) => ({ ...prev, ogImage: val }))
                        }
                        placeholder="https://example.com/og-image.jpg"
                      />
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        OG Description
                        <span className="text-xs text-gray-500 ml-2">
                          (max {OG_DESC_MAX} chars)
                        </span>
                      </label>
                      <textarea
                        value={seo.ogDescription}
                        onChange={(e) =>
                          handleOgDescriptionChange(e.target.value)
                        }
                        placeholder="Description for social media sharing"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {seo.ogDescription.length}/{OG_DESC_MAX}
                      </p>
                    </div>
                  </div>

                  {/* Twitter Card Section */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-3">
                      Twitter Card
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Twitter Card Type"
                        value={seo.twitterCard}
                        onChange={(val) =>
                          setSeo((prev) => ({
                            ...prev,
                            twitterCard: val as string,
                          }))
                        }
                        options={[
                          { value: "summary", label: "Summary" },
                          {
                            value: "summary_large_image",
                            label: "Summary with Large Image",
                          },
                          { value: "app", label: "App" },
                          { value: "player", label: "Player" },
                        ]}
                      />
                      <Input
                        label="Twitter Image URL"
                        value={seo.twitterImage}
                        onChange={(val) =>
                          setSeo((prev) => ({ ...prev, twitterImage: val }))
                        }
                        placeholder="https://example.com/twitter-image.jpg"
                      />
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Twitter Title
                        <span className="text-xs text-gray-500 ml-2">
                          (max {TWITTER_TITLE_MAX} chars)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={seo.twitterTitle}
                        onChange={(e) =>
                          handleTwitterTitleChange(e.target.value)
                        }
                        placeholder="Twitter card title"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {seo.twitterTitle.length}/{TWITTER_TITLE_MAX}
                      </p>
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Twitter Description
                        <span className="text-xs text-gray-500 ml-2">
                          (max {TWITTER_DESC_MAX} chars)
                        </span>
                      </label>
                      <textarea
                        value={seo.twitterDescription}
                        onChange={(e) =>
                          handleTwitterDescriptionChange(e.target.value)
                        }
                        placeholder="Description for Twitter"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {seo.twitterDescription.length}/{TWITTER_DESC_MAX}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Publish Box */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-medium">Publish</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <select
                    value={status ? "active" : "inactive"}
                    onChange={(e) => setStatus(e.target.value === "active")}
                    className="px-2 py-1 border rounded text-sm bg-white"
                  >
                    <option value="active">Published</option>
                    <option value="inactive">Draft</option>
                  </select>
                </div>

                <div className="text-sm">
                  <div className="text-gray-600 mb-1">Published on:</div>
                  <input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>

                <div className="text-sm">
                  <div className="text-gray-600 mb-1">Expires on:</div>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {loading ? "Updating..." : "Update News"}
                </button>
              </div>
            </div>

            {/* Featured Image Box - ✅ Using Next.js Image */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-medium">Featured Image</h3>
                <p className="text-xs text-gray-500 mt-1">
                  ✅ Image URL only (No base64)
                </p>
              </div>
              <div className="p-4">
                {imagePreview ? (
                  <div className="space-y-3">
                    <div className="relative group">
                      <Image
                        src={imagePreview}
                        alt="Featured"
                        width={400}
                        height={160}
                        className="w-full h-40 object-cover rounded border"
                        onError={() => setImagePreview(null)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl("");
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{imageUrl}</p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      Enter image URL below
                    </p>
                  </div>
                )}
                <div className="mt-3">
                  <label className="block text-xs text-gray-600 mb-1">
                    Image URL (https://...)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    ⚠️ Base64 images not allowed. Use direct image URL.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Entities */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-medium">Related Entities</h3>
              </div>
              <div className="p-4 space-y-3">
                <Select
                  label="Program"
                  value={programId || 0}
                  onChange={(val: number) => setProgramId(val)}
                  options={[
                    { value: 0, label: "— Select Program —" },
                    ...programs,
                  ]}
                />
                <Select
                  label="Institute"
                  value={instituteId || 0}
                  onChange={(val: number) => setInstituteId(val)}
                  options={[
                    { value: 0, label: "— Select Institute —" },
                    ...institutes,
                  ]}
                />
                <Select
                  label="Board"
                  value={boardId || 0}
                  onChange={(val: number) => setBoardId(val)}
                  options={[{ value: 0, label: "— Select Board —" }, ...boards]}
                />
                <Select
                  label="City"
                  value={cityId || 0}
                  onChange={(val: number) => setCityId(val)}
                  options={[{ value: 0, label: "— Select City —" }, ...cities]}
                />
              </div>
            </div>

            {/* Source & Author */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-medium">Source & Author</h3>
              </div>
              <div className="p-4 space-y-3">
                <Input
                  label="Source"
                  value={source}
                  onChange={setSource}
                  placeholder="e.g. Dawn News"
                />
                <Input
                  label="Author"
                  value={author}
                  onChange={setAuthor}
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>

            {/* News Flags */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-medium">News Flags</h3>
              </div>
              <div className="p-4 space-y-2">
                <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 text-orange-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    ⭐ Featured News (Shows in Sidebar)
                  </span>
                </label>
                <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBreaking}
                    onChange={(e) => setIsBreaking(e.target.checked)}
                    className="h-4 w-4 text-red-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    🔴 Breaking News (Shows in Banner)
                  </span>
                </label>
              </div>
            </div>

            {/* Stats Box */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-medium">Statistics</h3>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Views:</span>
                  <span className="font-medium">{viewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Modified:</span>
                  <span className="font-medium">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
