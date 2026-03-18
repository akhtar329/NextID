// app/admin/news/create/page.tsx (Fixed Version)

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Input from "@/app/component/ui/Input";
import Select from "@/app/component/ui/select";
import BulkUpload from "@/app/component/ui/BulkUpload";
import RichTextEditor from "@/app/component/ui/RichTextEditor";
import { useBulkUpload, BulkItem } from "@/app/hooks/useBulkUpload";

type Program = {
  id: number;
  name: string;
};

type Institute = {
  id: number;
  name: string;
  cityName: string;
};

type Board = {
  id: number;
  name: string;
};

type City = {
  id: number;
  name: string;
};

interface NewsBulkItem extends BulkItem {
  content: string;
  excerpt?: string;
  programId?: number;
  instituteId?: number;
  boardId?: number;
  cityId?: number;
  imageUrl?: string;
  source?: string;
  author?: string;
  isFeatured: boolean;
  isBreaking: boolean;
  publishedAt?: string;
  expiresAt?: string;
}

export default function CreateNewsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Form states for single creation
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [programId, setProgramId] = useState<number | null>(null);
  const [instituteId, setInstituteId] = useState<number | null>(null);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [source, setSource] = useState("");
  const [author, setAuthor] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [publishedAt, setPublishedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState(true);
  const [slugEdited, setSlugEdited] = useState(false);
  const [singleLoading, setSingleLoading] = useState(false);

  // UI States
  const [showPreview, setShowPreview] = useState(false);
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");

  // Data states
  const [programs, setPrograms] = useState<Program[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Slug generator
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugEdited && title) {
      setSlug(generateSlug(title));
    }
  }, [title, slugEdited]);

  // Image URL change handler
  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    setImagePreview(url);
  };

  // Parse News CSV
  const parseNewsCSV = (text: string): BulkItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const firstLine = lines[0].toLowerCase();
    const hasHeaders = firstLine.includes('title') || firstLine.includes('content') || firstLine.includes('slug');
    
    let startIndex = 0;
    let headers: string[] = [];
    
    if (hasHeaders) {
      headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      startIndex = 1;
    } else {
      headers = ['title', 'content', 'slug', 'excerpt', 'programid', 'instituteid', 'boardid', 'cityid', 'imageurl', 'source', 'author', 'isfeatured', 'isbreaking', 'status'];
    }
    
    const items: BulkItem[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      if (line.startsWith('<')) continue;
      
      const values = line.split(',').map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      const title = obj.title || '';
      const content = obj.content || '';
      const slug = obj.slug || generateSlug(title);
      const displayOrder = parseInt(obj.displayorder || '0') || 0;
      const isFeatured = obj.isfeatured === 'true' || obj.featured === 'true' || false;
      const isBreaking = obj.isbreaking === 'true' || obj.breaking === 'true' || false;
      const status = obj.status === 'false' ? false : true;
      
      if (title && content) {
        items.push({
          name: title,
          slug,
          displayOrder,
          status,
          title: title,
          content,
          excerpt: obj.excerpt || '',
          programId: parseInt(obj.programid || '0') || undefined,
          instituteId: parseInt(obj.instituteid || '0') || undefined,
          boardId: parseInt(obj.boardid || '0') || undefined,
          cityId: parseInt(obj.cityid || '0') || undefined,
          imageUrl: obj.imageurl || '',
          source: obj.source || '',
          author: obj.author || '',
          isFeatured,
          isBreaking,
          publishedAt: obj.publishedat || '',
          expiresAt: obj.expiresat || '',
        });
      }
    }
    
    return items;
  };

  // Transform news items
  const transformNewsItems = (items: BulkItem[]) => {
    return items.map(item => ({
      title: (item as any).title || item.name,
      content: (item as any).content,
      slug: item.slug,
      excerpt: (item as any).excerpt,
      programId: (item as any).programId,
      instituteId: (item as any).instituteId,
      boardId: (item as any).boardId,
      cityId: (item as any).cityId,
      imageUrl: (item as any).imageUrl,
      source: (item as any).source,
      author: (item as any).author,
      isFeatured: (item as any).isFeatured,
      isBreaking: (item as any).isBreaking,
      publishedAt: (item as any).publishedAt,
      expiresAt: (item as any).expiresAt,
      status: item.status,
    }));
  };

  // Bulk upload handler
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bulkUpload.file) {
      toast.error("Please upload a file");
      return;
    }

    bulkUpload.setLoading(true);
    
    try {
      const text = await bulkUpload.file.text();
      const items = parseNewsCSV(text);
      
      if (items.length === 0) {
        toast.error("No valid news items found");
        return;
      }

      const apiItems = transformNewsItems(items);

      const res = await fetch("/api/admin/news/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ news: apiItems }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to upload");
      }

      if (data.success) {
        toast.success(data.message || `${data.count} news items created`);
        router.push("/admin/news");
      }

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process bulk upload");
    } finally {
      bulkUpload.setLoading(false);
    }
  };

  // Bulk upload hook
  const bulkUpload = useBulkUpload({
    apiEndpoint: "/api/admin/news/bulk",
    redirectPath: "/admin/news",
    itemName: "news",
    generateSlug,
    customParse: parseNewsCSV
  });

  // Fetch dropdown data
  useEffect(() => {
    async function fetchData() {
      try {
        const [programsRes, institutesRes, boardsRes, citiesRes] = await Promise.all([
          fetch("/api/admin/programs"),
          fetch("/api/admin/institutes"),
          fetch("/api/admin/boards"),
          fetch("/api/admin/cities")
        ]);
        
        const programsData = await programsRes.json();
        const institutesData = await institutesRes.json();
        const boardsData = await boardsRes.json();
        const citiesData = await citiesRes.json();
        
        setPrograms(programsData.programs || []);
        setInstitutes(institutesData.institutes || []);
        setBoards(boardsData.boards || []);
        setCities(citiesData.cities || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load form data");
      } finally {
        setFetchLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSlugChange = (val: string) => {
    setSlug(val);
    setSlugEdited(true);
  };

  const handleSingleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSingleLoading(true);
    setError(null);

    if (!title || !slug || !content) {
      setError("Title, Slug, and Content are required.");
      setSingleLoading(false);
      return;
    }

    toast.loading("Creating news...", { id: "create-news" });

    try {
      const res = await fetch("/api/admin/news/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          content: content.trim(),
          excerpt: excerpt.trim() || null,
          programId: programId || null,
          instituteId: instituteId || null,
          boardId: boardId || null,
          cityId: cityId || null,
          imageUrl: imageUrl.trim() || null,
          source: source.trim() || null,
          author: author.trim() || null,
          isFeatured,
          isBreaking,
          publishedAt: publishedAt || null,
          expiresAt: expiresAt || null,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || "Failed to create news");
      }

      if (data.success) {
        toast.success("News created successfully!", { 
          id: "create-news",
          duration: 3000 
        });
        router.push("/admin/news");
      } else {
        throw new Error(data.error || "Failed to create news");
      }

    } catch (err) {
      console.error("Error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create news", { 
        id: "create-news" 
      });
      setError(err instanceof Error ? err.message : "Failed to create news");
    } finally {
      setSingleLoading(false);
    }
  };

  // Download sample CSV
  const downloadSample = () => {
    const headers = ['title', 'content', 'slug', 'excerpt', 'programId', 'instituteId', 'boardId', 'cityId', 'imageUrl', 'source', 'author', 'isFeatured', 'isBreaking', 'status'];
    const sampleData = [
      ['University Announces New Policy', '<h2>New Admission Policy 2026</h2><p>The university has announced a new admission policy for 2026. <strong>Important dates:</strong></p><ul><li>Application start: <em>June 1, 2026</em></li><li>Last date: <em>July 15, 2026</em></li></ul><p>Visit our <a href="https://university.edu.pk/admissions">website</a> for details.</p>', 'university-new-policy', 'New admission policy announced with key dates', '1', '', '', '', 'https://example.com/image.jpg', 'University News', 'Admin', 'true', 'false', 'true'],
      ['Board Exam Results 2026', '<h2>Matric & Intermediate Results Announced</h2><p>The board exam results for 2026 have been announced. <strong>Check your results:</strong></p><ol><li>Visit official website</li><li>Enter roll number</li><li>Download result card</li></ol><p><a href="https://results.bise.edu.pk">Check Online →</a></p>', 'board-exam-results-2026', 'Check your results online with complete guide', '', '2', '1', '3', '', 'Education Board', 'Official', 'true', 'true', 'true'],
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => cell.includes(',') ? `"${cell}"` : cell).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'news-sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Sample CSV downloaded");
  };

  // Sample data for preview
  const sampleData = [
    ['University Announces New Policy', '<h2>New Policy</h2><p>University announces new admission policy...</p>', 'university-new-policy', 'New admission policy', '1', '', '', '', 'https://example.com/image.jpg', 'University News', 'Admin', 'true', 'false', 'true'],
    ['Board Exam Results 2026', '<h2>Results Announced</h2><p>Board exam results for 2026...</p>', 'board-exam-results-2026', 'Check your results', '', '2', '1', '3', '', 'Education Board', 'Official', 'true', 'true', 'true'],
  ];

  if (fetchLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with WordPress-style toolbar */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Link href="/admin" className="hover:text-blue-600">Dashboard</Link>
              <span className="mx-2">›</span>
              <Link href="/admin/news" className="hover:text-blue-600">News</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-700">Add New</span>
            </div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              Add New News
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Draft</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
            <Link
              href="/admin/news"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* Tabs for Single/Bulk */}
        <div className="flex gap-4 mt-4 border-b">
          <button
            onClick={() => setActiveTab("single")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "single"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Add Single News
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "bulk"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Bulk Upload
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* WordPress-style Layout */}
      {activeTab === "single" ? (
        <form onSubmit={handleSingleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area - Left 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Permalink Box */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title <span className="text-red-500">*</span>
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
                      <span className="text-gray-500 text-sm whitespace-nowrap">Permalink:</span>
                      <span className="text-blue-600 text-sm whitespace-nowrap">https://nextid.pk/news/</span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        className="flex-1 px-2 py-1 bg-white border rounded text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setSlugEdited(false)}
                        className="text-xs text-gray-500 hover:text-blue-600 whitespace-nowrap"
                        title="Reset to auto-generated slug"
                      >
                        ↻ Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Editor with WordPress-style tabs */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="flex border-b bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setEditorTab("write")}
                    className={`px-4 py-2 text-sm font-medium ${
                      editorTab === "write"
                        ? "bg-white text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab("preview")}
                    className={`px-4 py-2 text-sm font-medium ${
                      editorTab === "preview"
                        ? "bg-white text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Preview
                  </button>
                </div>

                <div className="p-6">
                  {editorTab === "write" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-2">(HTML supported)</span>
                      </label>
                      <RichTextEditor
                        value={content}
                        onChange={setContent}
                        placeholder="Write your news content here..."
                        minHeight={400}
                      />
                    </div>
                  ) : (
                    <div className="prose max-w-none min-h-[400px] p-4 border rounded bg-gray-50">
                      {content ? (
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                      ) : (
                        <p className="text-gray-400 text-center mt-20">No content to preview</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Excerpt Box */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt
                  <span className="text-xs text-gray-500 ml-2">(optional summary - plain text)</span>
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
                      value={status ? "published" : "draft"}
                      onChange={(e) => setStatus(e.target.value === "published")}
                      className="px-2 py-1 border rounded text-sm bg-white"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="pending">Pending Review</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Visibility:</span>
                    <select className="px-2 py-1 border rounded text-sm bg-white">
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

                  {/* 👇 FIXED: Regular button instead of PrimaryButton */}
                  <button
                    type="submit"
                    disabled={singleLoading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {singleLoading ? "Creating..." : "Create News"}
                  </button>
                </div>
              </div>

              {/* Featured Image Box */}
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
                    value={programId ?? 0}
                    onChange={(val: number) => setProgramId(val)}
                    options={[
                      { value: 0, label: "— Select Program —" },
                      ...programs.map(p => ({
                        value: p.id,
                        label: p.name,
                      }))
                    ]}
                  />
                  <Select
                    label="Institute"
                    value={instituteId ?? 0}
                    onChange={(val: number) => setInstituteId(val)}
                    options={[
                      { value: 0, label: "— Select Institute —" },
                      ...institutes.map(i => ({
                        value: i.id,
                        label: `${i.name} (${i.cityName})`,
                      }))
                    ]}
                  />
                  <Select
                    label="Board"
                    value={boardId ?? 0}
                    onChange={(val: number) => setBoardId(val)}
                    options={[
                      { value: 0, label: "— Select Board —" },
                      ...boards.map(b => ({
                        value: b.id,
                        label: b.name,
                      }))
                    ]}
                  />
                  <Select
                    label="City"
                    value={cityId ?? 0}
                    onChange={(val: number) => setCityId(val)}
                    options={[
                      { value: 0, label: "— Select City —" },
                      ...cities.map(c => ({
                        value: c.id,
                        label: c.name,
                      }))
                    ]}
                  />
                </div>
              </div>

              {/* Source & Author Box */}
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

              {/* News Flags Box */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-medium">News Flags</h3>
                </div>
                <div className="p-4 space-y-2">
                  <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">⭐ Featured News</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={isBreaking}
                      onChange={(e) => setIsBreaking(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">🔴 Breaking News</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* Bulk Upload Section */
        <div className="max-w-2xl mx-auto">
          {/* Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">CSV Format with HTML Support</h3>
            <p className="text-sm text-blue-600 mb-2">
              Headers: title, content, slug, excerpt, programId, instituteId, boardId, cityId, imageUrl, source, author, isFeatured, isBreaking, status
            </p>
            <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
              {`"University News","<h2>Important</h2><p>New <strong>policy</strong>...</p>","university-news","Summary","1","","","","","Source","Author","true","false","true"`}
            </pre>
          </div>

          {/* Download Sample Button */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={downloadSample}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Sample CSV
            </button>
          </div>

          <BulkUpload
            title=""
            description=""
            sampleData={sampleData}
            onDownloadSample={downloadSample}
            bulkData={bulkUpload.bulkData}
            onBulkDataChange={bulkUpload.setBulkData}
            file={bulkUpload.file}
            fileName={bulkUpload.fileName}
            onFileChange={bulkUpload.handleFileChange}
            onClearFile={bulkUpload.clearFile}
            onSubmit={handleBulkSubmit}
            onClear={bulkUpload.clearAll}
            loading={bulkUpload.loading}
            itemName="news"
            hideSampleButton={true}
          />
        </div>
      )}
    </div>
  );
}