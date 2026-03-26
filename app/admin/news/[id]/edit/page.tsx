// app/admin/news/[id]/edit/page.tsx (Fixed Version)

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Input from "@/app/component/ui/Input";
import Select from "@/app/component/ui/select";
import RichTextEditor from "@/app/component/ui/RichTextEditor";

type NewsItem = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
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
  views: number;
  createdAt: string;
};

type Option = { value: number; label: string };

export default function EditNewsPage() {
  const router = useRouter();
  const params = useParams();
  const newsId = params.id as string;

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
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
  const [slugEdited, setSlugEdited] = useState(false);
  const [views, setViews] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

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

        setPrograms(pData.programs?.map((p: any) => ({ value: p.id, label: p.name })) || []);
        setInstitutes(iData.institutes?.map((i: any) => ({ value: i.id, label: `${i.name} (${i.cityName})` })) || []);
        setBoards(bData.boards?.map((b: any) => ({ value: b.id, label: b.name })) || []);
        setCities(cData.cities?.map((c: any) => ({ value: c.id, label: c.name })) || []);
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
        if (!data.success) throw new Error(data.error || "Failed to fetch news");

        const news: NewsItem = data.news;
        setTitle(news.title);
        setSlug(news.slug);
        setContent(news.content);
        setExcerpt(news.excerpt || "");
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
        setViews(news.views || 0);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to fetch news");
        toast.error(err instanceof Error ? err.message : "Failed to fetch news");
      } finally {
        setFetchLoading(false);
      }
    }
    fetchNews();
  }, [newsId]);

  // Auto-generate slug
  useEffect(() => {
    if (!slugEdited && title) {
      const generated = title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      setSlug(generated);
    }
  }, [title, slugEdited]);

  const handleSlugChange = (val: string) => {
    setSlug(val);
    setSlugEdited(true);
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    setImagePreview(url);
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
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update news");

      toast.success("News updated successfully", { id: toastId });
      router.push("/admin/news");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to update news", { id: toastId });
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
            <Link href="/admin" className="hover:text-blue-600">Dashboard</Link>
            <span className="mx-2">›</span>
            <Link href="/admin/news" className="hover:text-blue-600">News</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-700">Edit: {title || "News"}</span>
          </div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Edit News
            {isBreaking && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Breaking</span>
            )}
            {isFeatured && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Featured</span>
            )}
          </h1>
        </div>
        <Link
          href="/admin/news"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          ← Back to News
        </Link>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 👇 FORM TAG ADDED - WordPress-like Layout */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area - Left 2/3 */}
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
                
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-md">
                  <span className="text-gray-500 text-sm">Permalink:</span>
                  <span className="text-blue-600 text-sm">https://www.nextid.pk/news/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="flex-1 px-2 py-1 bg-white border rounded text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setSlugEdited(false)}
                    className="text-xs text-gray-500 hover:text-blue-600"
                    title="Reset to auto-generated slug"
                  >
                    ↻
                  </button>
                </div>
              </div>
            </div>

            {/* Content Editor - WordPress Style Tabs */}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content *
                    </label>
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      placeholder="Write your news content here..."
                      minHeight={400}
                    />
                  </div>
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
                <span className="text-xs text-gray-500 ml-2">(optional summary)</span>
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Write a short summary of the news..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Sidebar - Right 1/3 - WordPress Style */}
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
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="active">Published</option>
                    <option value="inactive">Draft</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Visibility:</span>
                  <select className="px-2 py-1 border rounded text-sm">
                    <option>Public</option>
                    <option>Private</option>
                    <option>Password Protected</option>
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

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full px-3 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
                  >
                    👁️ Preview Changes
                  </button>
                  {/* 👇 FIXED: Regular button instead of PrimaryButton */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {loading ? "Updating..." : "Update News"}
                  </button>
                </div>
              </div>
            </div>

            {/* Featured Image Box - WordPress Style */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-medium">Featured Image</h3>
              </div>
              <div className="p-4">
                {imagePreview ? (
                  <div className="space-y-3">
                    <div className="relative group">
                      <img
                        src={imagePreview}
                        alt="Featured"
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
                        title="Remove image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{imageUrl}</p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">No image selected</p>
                  </div>
                )}
                <div className="mt-3">
                  <label className="block text-xs text-gray-600 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Categories/Entities Box */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-medium">Related Entities</h3>
              </div>
              <div className="p-4 space-y-3">
                <Select
                  label="Program"
                  value={programId || 0}
                  onChange={(val: number) => setProgramId(val)}
                  options={[{ value: 0, label: "— Select Program —" }, ...programs]}
                />
                <Select
                  label="Institute"
                  value={instituteId || 0}
                  onChange={(val: number) => setInstituteId(val)}
                  options={[{ value: 0, label: "— Select Institute —" }, ...institutes]}
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

            {/* Source & Author Box */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-medium">Source & Author</h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. Dawn News"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  <span className="font-medium">{views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Modified:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}