"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Input from "@/app/component/ui/Input";
import Select from "@/app/component/ui/select";
import BulkUpload from "@/app/component/ui/BulkUpload";
import RichTextEditor from "@/app/component/ui/RichTextEditor";
import { useBulkUpload, BulkItem } from "@/app/hooks/useBulkUpload";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

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

// ✅ Google standards ke mutabiq character limits
const TITLE_MAX = 120;
const EXCERPT_MAX = 200;
const META_TITLE_MAX = 60;
const META_DESC_MAX = 160;
const OG_TITLE_MAX = 60;
const OG_DESC_MAX = 200;
const TWITTER_TITLE_MAX = 70;
const TWITTER_DESC_MAX = 200;

// ✅ Character limit color function
function getCharacterLimitColor(length: number, max: number): string {
  const percentage = (length / max) * 100;
  if (percentage >= 95) return "text-red-600 bg-red-50 border-red-200";
  if (percentage >= 80) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  if (percentage >= 10) return "text-green-600 bg-green-50 border-green-200";
  return "text-gray-400 bg-gray-50 border-gray-200";
}

function getCharacterLimitIcon(length: number, max: number) {
  const percentage = (length / max) * 100;
  if (percentage >= 95) return <AlertCircle className="w-3 h-3" />;
  if (percentage >= 80) return <AlertTriangle className="w-3 h-3" />;
  if (percentage >= 10) return <CheckCircle className="w-3 h-3" />;
  return null;
}

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
  schemaMarkup?: any;
}

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
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
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

  // ✅ Track if SEO fields were manually edited
  const [seoManuallyEdited, setSeoManuallyEdited] = useState({
    metaTitle: false,
    metaDescription: false,
    ogTitle: false,
    ogDescription: false,
    twitterTitle: false,
    twitterDescription: false,
  });

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
    schemaMarkup: null,
  });

  // UI States
  const [showPreview, setShowPreview] = useState(false);
  const [showSeoPanel, setShowSeoPanel] = useState(false);
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

  // ✅ Auto-generate SEO title from news title (if not manually edited)
  useEffect(() => {
    if (title && !seoManuallyEdited.metaTitle) {
      const truncatedTitle = title.length > META_TITLE_MAX 
        ? title.substring(0, META_TITLE_MAX - 3) + "..." 
        : title;
      setSeo(prev => ({ ...prev, metaTitle: truncatedTitle }));
    }
    if (title && !seoManuallyEdited.ogTitle) {
      const truncatedTitle = title.length > OG_TITLE_MAX 
        ? title.substring(0, OG_TITLE_MAX - 3) + "..." 
        : title;
      setSeo(prev => ({ ...prev, ogTitle: truncatedTitle }));
    }
    if (title && !seoManuallyEdited.twitterTitle) {
      const truncatedTitle = title.length > TWITTER_TITLE_MAX 
        ? title.substring(0, TWITTER_TITLE_MAX - 3) + "..." 
        : title;
      setSeo(prev => ({ ...prev, twitterTitle: truncatedTitle }));
    }
  }, [title, seoManuallyEdited]);

  // ✅ Auto-generate meta description from excerpt (if not manually edited)
  useEffect(() => {
    const sourceText = excerpt || content.replace(/<[^>]*>/g, '').substring(0, 200);
    if (sourceText && !seoManuallyEdited.metaDescription) {
      const truncatedDesc = sourceText.length > META_DESC_MAX 
        ? sourceText.substring(0, META_DESC_MAX - 3) + "..." 
        : sourceText;
      setSeo(prev => ({ ...prev, metaDescription: truncatedDesc }));
    }
    if (sourceText && !seoManuallyEdited.ogDescription) {
      const truncatedDesc = sourceText.length > OG_DESC_MAX 
        ? sourceText.substring(0, OG_DESC_MAX - 3) + "..." 
        : sourceText;
      setSeo(prev => ({ ...prev, ogDescription: truncatedDesc }));
    }
    if (sourceText && !seoManuallyEdited.twitterDescription) {
      const truncatedDesc = sourceText.length > TWITTER_DESC_MAX 
        ? sourceText.substring(0, TWITTER_DESC_MAX - 3) + "..." 
        : sourceText;
      setSeo(prev => ({ ...prev, twitterDescription: truncatedDesc }));
    }
  }, [excerpt, content, seoManuallyEdited]);

  // ✅ Auto-generate canonical URL
  useEffect(() => {
    if (slug && !seo.canonicalUrl) {
      setSeo(prev => ({ ...prev, canonicalUrl: `https://www.nextid.pk/news/${slug}` }));
    }
  }, [slug]);

  // Image URL change handler (✅ Sirf URL store, base64 nahi)
  const handleImageUrlChange = (url: string) => {
    if (url.startsWith('data:image')) {
      toast.error("Base64 images are not supported. Please use a valid image URL.");
      return;
    }
    setImageUrl(url);
    setImagePreview(url);
    if (url && !seo.ogImage) {
      setSeo(prev => ({ ...prev, ogImage: url }));
    }
    if (url && !seo.twitterImage) {
      setSeo(prev => ({ ...prev, twitterImage: url }));
    }
  };

  // ✅ Handle SEO field changes with limits
  const handleMetaTitleChange = (val: string) => {
    setSeoManuallyEdited(prev => ({ ...prev, metaTitle: true }));
    if (val.length <= META_TITLE_MAX) {
      setSeo(prev => ({ ...prev, metaTitle: val }));
    } else {
      toast.warning(`Meta title cannot exceed ${META_TITLE_MAX} characters`);
    }
  };

  const handleMetaDescriptionChange = (val: string) => {
    setSeoManuallyEdited(prev => ({ ...prev, metaDescription: true }));
    if (val.length <= META_DESC_MAX) {
      setSeo(prev => ({ ...prev, metaDescription: val }));
    } else {
      toast.warning(`Meta description cannot exceed ${META_DESC_MAX} characters`);
    }
  };

  const handleOgTitleChange = (val: string) => {
    setSeoManuallyEdited(prev => ({ ...prev, ogTitle: true }));
    if (val.length <= OG_TITLE_MAX) {
      setSeo(prev => ({ ...prev, ogTitle: val }));
    } else {
      toast.warning(`OG title cannot exceed ${OG_TITLE_MAX} characters`);
    }
  };

  const handleOgDescriptionChange = (val: string) => {
    setSeoManuallyEdited(prev => ({ ...prev, ogDescription: true }));
    if (val.length <= OG_DESC_MAX) {
      setSeo(prev => ({ ...prev, ogDescription: val }));
    } else {
      toast.warning(`OG description cannot exceed ${OG_DESC_MAX} characters`);
    }
  };

  const handleTwitterTitleChange = (val: string) => {
    setSeoManuallyEdited(prev => ({ ...prev, twitterTitle: true }));
    if (val.length <= TWITTER_TITLE_MAX) {
      setSeo(prev => ({ ...prev, twitterTitle: val }));
    } else {
      toast.warning(`Twitter title cannot exceed ${TWITTER_TITLE_MAX} characters`);
    }
  };

  const handleTwitterDescriptionChange = (val: string) => {
    setSeoManuallyEdited(prev => ({ ...prev, twitterDescription: true }));
    if (val.length <= TWITTER_DESC_MAX) {
      setSeo(prev => ({ ...prev, twitterDescription: val }));
    } else {
      toast.warning(`Twitter description cannot exceed ${TWITTER_DESC_MAX} characters`);
    }
  };

  // Parse News CSV
  const parseNewsCSV = (text: string): BulkItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const firstLine = lines[0].toLowerCase();
    const hasHeaders = firstLine.includes('title') || firstLine.includes('content');
    
    let startIndex = 0;
    let headers: string[] = [];
    
    if (hasHeaders) {
      headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      startIndex = 1;
    } else {
      headers = ['title', 'content', 'slug', 'excerpt', 'programid', 'instituteid', 'boardid', 'cityid', 'imageurl', 'source', 'author', 'isfeatured', 'isbreaking', 'status', 'metatitle', 'metadescription', 'metakeywords'];
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
      const isFeatured = obj.isfeatured === 'true' || obj.featured === 'true' || false;
      const isBreaking = obj.isbreaking === 'true' || obj.breaking === 'true' || false;
      const status = obj.status === 'false' ? false : true;
      
      if (title && content) {
        items.push({
          name: title,
          slug,
          displayOrder: 0,
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
          metaTitle: obj.metatitle || '',
          metaDescription: obj.metadescription || '',
          metaKeywords: obj.metakeywords || '',
        });
      }
    }
    
    return items;
  };

  // Transform news items for bulk upload
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
      metaTitle: (item as any).metaTitle,
      metaDescription: (item as any).metaDescription,
      metaKeywords: (item as any).metaKeywords,
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
    setSeo(prev => ({ ...prev, canonicalUrl: `https://www.nextid.pk/news/${val}` }));
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

    if (imageUrl && imageUrl.startsWith('data:image')) {
      setError("Base64 images are not supported. Please use a valid image URL.");
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
          seo: {
            metaTitle: seo.metaTitle || null,
            metaDescription: seo.metaDescription || null,
            metaKeywords: seo.metaKeywords || null,
            canonicalUrl: seo.canonicalUrl || null,
            ogTitle: seo.ogTitle || null,
            ogDescription: seo.ogDescription || null,
            ogImage: seo.ogImage || null,
            twitterCard: seo.twitterCard || "summary_large_image",
            twitterTitle: seo.twitterTitle || null,
            twitterDescription: seo.twitterDescription || null,
            twitterImage: seo.twitterImage || null,
            schemaMarkup: seo.schemaMarkup || null,
          },
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
    const headers = ['title', 'content', 'slug', 'excerpt', 'programId', 'instituteId', 'boardId', 'cityId', 'imageUrl', 'source', 'author', 'isFeatured', 'isBreaking', 'status', 'metaTitle', 'metaDescription', 'metaKeywords'];
    const sampleData = [
      ['University Announces New Policy', '<h2>New Admission Policy 2026</h2><p>The university has announced a new admission policy for 2026.</p>', 'university-new-policy', 'New admission policy announced', '1', '', '', '', 'https://example.com/image.jpg', 'University News', 'Admin', 'true', 'false', 'true', 'University New Policy 2026', 'Latest updates on university admission policy for 2026', 'admission, policy, university, 2026'],
      ['Board Exam Results 2026', '<h2>Results Announced</h2><p>Board exam results for 2026 have been announced.</p>', 'board-exam-results-2026', 'Check your results online', '', '2', '1', '3', 'https://example.com/results.jpg', 'Education Board', 'Official', 'true', 'true', 'true', 'Board Exam Results 2026 Pakistan', 'Check matric and intermediate results for all boards', 'results, board exams, matric, intermediate, 2026'],
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => String(cell).includes(',') ? `"${cell}"` : cell).join(','))
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
      {/* Header */}
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
            <h1 className="text-2xl font-semibold">Add New News</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSeoPanel(!showSeoPanel)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              SEO Settings
            </button>
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

        {/* Tabs */}
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

      {activeTab === "single" ? (
        <form onSubmit={handleSingleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Permalink */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getCharacterLimitColor(title.length, TITLE_MAX)}`}>
                          {getCharacterLimitIcon(title.length, TITLE_MAX)}
                          {title.length}/{TITLE_MAX}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter news title"
                        className="w-full px-3 py-2 text-2xl font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      {title.length > TITLE_MAX && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> Title exceeds recommended length
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-md">
                      <span className="text-gray-500 text-sm whitespace-nowrap">Permalink:</span>
                      <span className="text-blue-600 text-sm whitespace-nowrap">https://www.nextid.pk/news/</span>
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
                      >
                        ↻ Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Editor */}
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
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      placeholder="Write your news content here..."
                      minHeight={400}
                    />
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

              {/* Excerpt */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Excerpt
                    <span className="text-xs text-gray-500 ml-2">(used for meta description if not set)</span>
                  </label>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getCharacterLimitColor(excerpt.length, EXCERPT_MAX)}`}>
                    {getCharacterLimitIcon(excerpt.length, EXCERPT_MAX)}
                    {excerpt.length}/{EXCERPT_MAX}
                  </span>
                </div>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Write a short summary of the news..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {excerpt.length > EXCERPT_MAX && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> Excerpt exceeds recommended length
                  </p>
                )}
              </div>

              {/* ✅ SEO Panel (Collapsible) */}
              {showSeoPanel && (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-medium">SEO Metadata</h3>
                    <p className="text-xs text-gray-500 mt-1">Auto-syncs with title & excerpt. Edit manually to override.</p>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Meta Title */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">Meta Title</label>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getCharacterLimitColor(seo.metaTitle.length, META_TITLE_MAX)}`}>
                          {getCharacterLimitIcon(seo.metaTitle.length, META_TITLE_MAX)}
                          {seo.metaTitle.length}/{META_TITLE_MAX}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={seo.metaTitle}
                        onChange={(e) => handleMetaTitleChange(e.target.value)}
                        placeholder="SEO Title (auto-syncs with news title)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {seo.metaTitle.length > META_TITLE_MAX && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> Exceeds Google's recommended limit of {META_TITLE_MAX} characters
                        </p>
                      )}
                    </div>

                    {/* Meta Description */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">Meta Description</label>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getCharacterLimitColor(seo.metaDescription.length, META_DESC_MAX)}`}>
                          {getCharacterLimitIcon(seo.metaDescription.length, META_DESC_MAX)}
                          {seo.metaDescription.length}/{META_DESC_MAX}
                        </span>
                      </div>
                      <textarea
                        value={seo.metaDescription}
                        onChange={(e) => handleMetaDescriptionChange(e.target.value)}
                        placeholder="Brief description for search engines (150-160 characters)"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {seo.metaDescription.length > META_DESC_MAX && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> Exceeds Google's recommended limit of {META_DESC_MAX} characters
                        </p>
                      )}
                    </div>
                    
                    <Input
                      label="Meta Keywords"
                      value={seo.metaKeywords}
                      onChange={(val) => setSeo(prev => ({ ...prev, metaKeywords: val }))}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                    
                    <Input
                      label="Canonical URL"
                      value={seo.canonicalUrl}
                      onChange={(val) => setSeo(prev => ({ ...prev, canonicalUrl: val }))}
                      placeholder="https://www.nextid.pk/news/slug"
                    />
                    
                    {/* Open Graph Section */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-3">Open Graph (Facebook/WhatsApp/LinkedIn)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">OG Title</label>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getCharacterLimitColor(seo.ogTitle.length, OG_TITLE_MAX)}`}>
                              {getCharacterLimitIcon(seo.ogTitle.length, OG_TITLE_MAX)}
                              {seo.ogTitle.length}/{OG_TITLE_MAX}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={seo.ogTitle}
                            onChange={(e) => handleOgTitleChange(e.target.value)}
                            placeholder="Social media title"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <Input
                          label="OG Image URL"
                          value={seo.ogImage}
                          onChange={(val) => setSeo(prev => ({ ...prev, ogImage: val }))}
                          placeholder="https://example.com/og-image.jpg"
                        />
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">OG Description</label>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getCharacterLimitColor(seo.ogDescription.length, OG_DESC_MAX)}`}>
                            {getCharacterLimitIcon(seo.ogDescription.length, OG_DESC_MAX)}
                            {seo.ogDescription.length}/{OG_DESC_MAX}
                          </span>
                        </div>
                        <textarea
                          value={seo.ogDescription}
                          onChange={(e) => handleOgDescriptionChange(e.target.value)}
                          placeholder="Description for social media sharing"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Twitter Card Section */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-3">Twitter Card</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="Twitter Card Type"
                          value={seo.twitterCard}
                          onChange={(val) => setSeo(prev => ({ ...prev, twitterCard: val }))}
                          options={[
                            { value: "summary", label: "Summary" },
                            { value: "summary_large_image", label: "Summary with Large Image" },
                            { value: "app", label: "App" },
                            { value: "player", label: "Player" },
                          ]}
                        />
                        <Input
                          label="Twitter Image URL"
                          value={seo.twitterImage}
                          onChange={(val) => setSeo(prev => ({ ...prev, twitterImage: val }))}
                          placeholder="https://example.com/twitter-image.jpg"
                        />
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">Twitter Title</label>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getCharacterLimitColor(seo.twitterTitle.length, TWITTER_TITLE_MAX)}`}>
                            {getCharacterLimitIcon(seo.twitterTitle.length, TWITTER_TITLE_MAX)}
                            {seo.twitterTitle.length}/{TWITTER_TITLE_MAX}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={seo.twitterTitle}
                          onChange={(e) => handleTwitterTitleChange(e.target.value)}
                          placeholder="Twitter card title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">Twitter Description</label>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getCharacterLimitColor(seo.twitterDescription.length, TWITTER_DESC_MAX)}`}>
                            {getCharacterLimitIcon(seo.twitterDescription.length, TWITTER_DESC_MAX)}
                            {seo.twitterDescription.length}/{TWITTER_DESC_MAX}
                          </span>
                        </div>
                        <textarea
                          value={seo.twitterDescription}
                          onChange={(e) => handleTwitterDescriptionChange(e.target.value)}
                          placeholder="Description for Twitter"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
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
                      value={status ? "published" : "draft"}
                      onChange={(e) => setStatus(e.target.value === "published")}
                      className="px-2 py-1 border rounded text-sm bg-white"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
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
                  <p className="text-xs text-gray-500 mt-1">✅ Image URL only (No base64)</p>
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
                      <p className="mt-2 text-sm text-gray-500">Enter image URL below</p>
                    </div>
                  )}
                  <div className="mt-3">
                    <label className="block text-xs text-gray-600 mb-1">Image URL (https://...)</label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">⚠️ Base64 images not allowed. Use direct image URL.</p>
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
                    value={programId ?? 0}
                    onChange={(val: number) => setProgramId(val)}
                    options={[
                      { value: 0, label: "— Select Program —" },
                      ...programs.map(p => ({ value: p.id, label: p.name }))
                    ]}
                  />
                  <Select
                    label="Institute"
                    value={instituteId ?? 0}
                    onChange={(val: number) => setInstituteId(val)}
                    options={[
                      { value: 0, label: "— Select Institute —" },
                      ...institutes.map(i => ({ value: i.id, label: `${i.name} (${i.cityName})` }))
                    ]}
                  />
                  <Select
                    label="Board"
                    value={boardId ?? 0}
                    onChange={(val: number) => setBoardId(val)}
                    options={[
                      { value: 0, label: "— Select Board —" },
                      ...boards.map(b => ({ value: b.id, label: b.name }))
                    ]}
                  />
                  <Select
                    label="City"
                    value={cityId ?? 0}
                    onChange={(val: number) => setCityId(val)}
                    options={[
                      { value: 0, label: "— Select City —" },
                      ...cities.map(c => ({ value: c.id, label: c.name }))
                    ]}
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
                    <span className="text-sm text-gray-700">⭐ Featured News (Shows in Sidebar)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBreaking}
                      onChange={(e) => setIsBreaking(e.target.checked)}
                      className="h-4 w-4 text-red-600 rounded"
                    />
                    <span className="text-sm text-gray-700">🔴 Breaking News (Shows in Banner)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* Bulk Upload Section */
        <div className="max-w-2xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">CSV Format</h3>
            <p className="text-sm text-blue-600 mb-2">
              Headers: title, content, slug, excerpt, programId, instituteId, boardId, cityId, imageUrl, source, author, isFeatured, isBreaking, status, metaTitle, metaDescription, metaKeywords
            </p>
            <p className="text-xs text-blue-500 mt-2">⚠️ Use direct image URLs only (no base64)</p>
          </div>

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
            sampleData={[]}
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
