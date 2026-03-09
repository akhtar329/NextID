// app/admin/news/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Input from "@/app/component/ui/Input";
import Select from "@/app/component/ui/select";
import BulkUpload from "@/app/component/ui/BulkUpload";
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
  const [source, setSource] = useState("");
  const [author, setAuthor] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [publishedAt, setPublishedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState(true);
  const [slugEdited, setSlugEdited] = useState(false);
  const [singleLoading, setSingleLoading] = useState(false);

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

  // Custom parser for news CSV

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
    
    // ✅ FIX: Use 'title' from CSV, not 'name'
    const title = obj.title || '';
    const content = obj.content || '';
    const slug = obj.slug || generateSlug(title);
    const displayOrder = parseInt(obj.displayorder || '0') || 0;
    const isFeatured = obj.isfeatured === 'true' || obj.featured === 'true' || false;
    const isBreaking = obj.isbreaking === 'true' || obj.breaking === 'true' || false;
    const status = obj.status === 'false' ? false : true;
    
    if (title && content) {
      items.push({
        name: title, // For BulkItem interface
        slug,
        displayOrder,
        status,
        // ✅ Add title field for API
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

// Add transformation function
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

// Override handleBulkSubmit
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

    // Transform to API format
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
        // Fetch programs
        const programsRes = await fetch("/api/admin/programs");
        const programsData = await programsRes.json();
        setPrograms(programsData.programs || []);

        // Fetch institutes
        const institutesRes = await fetch("/api/admin/institutes");
        const institutesData = await institutesRes.json();
        setInstitutes(institutesData.institutes || []);

        // Fetch boards
        const boardsRes = await fetch("/api/admin/boards");
        const boardsData = await boardsRes.json();
        setBoards(boardsData.boards || []);

        // Fetch cities
        const citiesRes = await fetch("/api/admin/cities");
        const citiesData = await citiesRes.json();
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

    // Validation
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
      ['University Announces New Policy', 'The university has announced a new admission policy for 2026...', 'university-new-policy', 'New admission policy announced', '1', '', '', '', 'https://example.com/image.jpg', 'University News', 'Admin', 'true', 'false', 'true'],
      ['Board Exam Results 2026', 'The board exam results for 2026 have been announced...', 'board-exam-results-2026', 'Check your results online', '', '2', '1', '3', '', 'Education Board', 'Official', 'true', 'true', 'true'],
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
    ['University Announces New Policy', 'The university has announced a new admission policy...', 'university-new-policy', 'New admission policy', '1', '', '', '', 'https://example.com/image.jpg', 'University News', 'Admin', 'true', 'false', 'true'],
    ['Board Exam Results 2026', 'The board exam results for 2026 have been announced...', 'board-exam-results-2026', 'Check your results', '', '2', '1', '3', '', 'Education Board', 'Official', 'true', 'true', 'true'],
  ];

  if (fetchLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/admin" className="hover:text-blue-600">Dashboard</Link>
          <span className="mx-2">›</span>
          <Link href="/admin/news" className="hover:text-blue-600">News</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">Create News</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Create News</h1>
            <p className="text-sm text-gray-500 mt-1">Add a new news article</p>
          </div>
          <Link
            href="/admin/news"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to News
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("single")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "single"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Single News
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

      {/* Single News Form */}
      {activeTab === "single" && (
        <>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form className="bg-white p-6 rounded-lg shadow-sm border space-y-6" onSubmit={handleSingleSubmit}>
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-medium mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Title *"
                  value={title}
                  onChange={setTitle}
                  placeholder="e.g. New Admission Policy 2026"
                  required
                />

                <Input
                  label="Slug *"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="e.g. new-admission-policy-2026"
                  required
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="News content..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excerpt (Summary)
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary of the news..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Related Entities */}
            <div>
              <h2 className="text-lg font-medium mb-4">Related Entities</h2>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Program"
                  value={programId ?? 0}
                  onChange={(val: number) => setProgramId(val)}
                  options={[
                    { value: 0, label: "Select Program" },
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
                    { value: 0, label: "Select Institute" },
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
                    { value: 0, label: "Select Board" },
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
                    { value: 0, label: "Select City" },
                    ...cities.map(c => ({
                      value: c.id,
                      label: c.name,
                    }))
                  ]}
                />
              </div>
            </div>

            {/* Media & Source */}
            <div>
              <h2 className="text-lg font-medium mb-4">Media & Source</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Image URL"
                  value={imageUrl}
                  onChange={setImageUrl}
                  placeholder="https://example.com/image.jpg"
                />

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

            {/* Dates */}
            <div>
              <h2 className="text-lg font-medium mb-4">Publishing Dates</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Published At
                  </label>
                  <input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires At
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Flags */}
            <div>
              <h2 className="text-lg font-medium mb-4">News Flags</h2>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    id="isFeatured"
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
                    Featured News
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="isBreaking"
                    type="checkbox"
                    checked={isBreaking}
                    onChange={(e) => setIsBreaking(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="isBreaking" className="text-sm font-medium text-gray-700">
                    Breaking News
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="status"
                    type="checkbox"
                    checked={status}
                    onChange={(e) => setStatus(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-4 flex items-center gap-3">
              <PrimaryButton type="submit" disabled={singleLoading}>
                {singleLoading ? "Creating..." : "Create News"}
              </PrimaryButton>
              
              <Link
                href="/admin/news"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </>
      )}

      {/* Bulk Upload Form */}
      {activeTab === "bulk" && (
        <div className="max-w-2xl">
          {/* Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">CSV Format</h3>
            <p className="text-sm text-blue-600 mb-2">
              Headers: title, content, slug, excerpt, programId, instituteId, boardId, cityId, imageUrl, source, author, isFeatured, isBreaking, status
            </p>
            <p className="text-sm text-blue-600">
              Example: University Announces New Policy,The university has announced...,university-new-policy,New admission policy,1,,,1,https://example.com/image.jpg,University News,Admin,true,false,true
            </p>
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

          {/* BulkUpload Component */}
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
            onSubmit={bulkUpload.handleBulkSubmit}
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