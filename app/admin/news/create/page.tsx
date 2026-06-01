"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/select";
import BulkUpload from "@/components/ui/BulkUpload";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useBulkUpload, BulkItem } from "@/hooks/useBulkUpload";
import { AlertCircle, X, Hash, Plus } from "lucide-react";

// ============ TYPES ============
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

// ============ CONSTANTS ============
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

const POPULAR_TAGS = [
  "Admissions", "Results", "Scholarships", "Exams", "NUST", "PU", "UET", 
  "LUMS", "IBA", "HEC", "BISE", "CSS", "PMS", "NTS", "Entry Test"
];

// Character limits
const TITLE_MAX = 120;
const EXCERPT_MAX = 200;
const META_TITLE_MAX = 60;
const META_DESC_MAX = 160;
const OG_TITLE_MAX = 60;
const OG_DESC_MAX = 200;
const TWITTER_TITLE_MAX = 70;
const TWITTER_DESC_MAX = 200;

// ============ HELPER FUNCTIONS ============
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
  if (percentage >= 10) return null;
  return null;
}

// ============ SEO METADATA INTERFACE ============
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
  schemaMarkup?: Record<string, unknown>;
}

interface NewsBulkItem extends BulkItem {
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
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

type TransformNewsItem = {
  title: string;
  content: string;
  slug: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
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
  status: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
};

export default function CreateNewsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
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

  // SEO states
  const [seoManuallyEdited, setSeoManuallyEdited] = useState({
    metaTitle: false,
    metaDescription: false,
    ogTitle: false,
    ogDescription: false,
    twitterTitle: false,
    twitterDescription: false,
  });

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
    schemaMarkup: undefined,
  });

  // UI states
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

  // Helper functions
  const generateSlug = (text: string): string => {
    return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  };

  const clearNewsCache = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/news/clear-cache', { method: 'POST' });
      const data = await res.json();
      if (data.success) console.log("✅ Cache cleared");
    } catch (err) {
      console.error("Failed to clear cache:", err);
    }
  }, []);

  // Tag functions
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

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  // Slug auto-generation
  const updateSlug = useCallback(() => {
    if (!slugEdited && title) {
      setSlug(generateSlug(title));
    }
  }, [title, slugEdited]);

  useEffect(() => {
    updateSlug();
  }, [updateSlug]);

  // SEO auto-generation
  const updateSeoTitle = useCallback(() => {
    if (title && !seoManuallyEdited.metaTitle) {
      const truncated = title.length > META_TITLE_MAX ? title.substring(0, META_TITLE_MAX - 3) + "..." : title;
      setSeo(prev => ({ ...prev, metaTitle: truncated }));
    }
    if (title && !seoManuallyEdited.ogTitle) {
      const truncated = title.length > OG_TITLE_MAX ? title.substring(0, OG_TITLE_MAX - 3) + "..." : title;
      setSeo(prev => ({ ...prev, ogTitle: truncated }));
    }
    if (title && !seoManuallyEdited.twitterTitle) {
      const truncated = title.length > TWITTER_TITLE_MAX ? title.substring(0, TWITTER_TITLE_MAX - 3) + "..." : title;
      setSeo(prev => ({ ...prev, twitterTitle: truncated }));
    }
  }, [title, seoManuallyEdited]);

  useEffect(() => {
    updateSeoTitle();
  }, [updateSeoTitle]);

  const updateSeoDescription = useCallback(() => {
    const sourceText = excerpt || content.replace(/<[^>]*>/g, '').substring(0, 200);
    if (sourceText && !seoManuallyEdited.metaDescription) {
      const truncated = sourceText.length > META_DESC_MAX ? sourceText.substring(0, META_DESC_MAX - 3) + "..." : sourceText;
      setSeo(prev => ({ ...prev, metaDescription: truncated }));
    }
    if (sourceText && !seoManuallyEdited.ogDescription) {
      const truncated = sourceText.length > OG_DESC_MAX ? sourceText.substring(0, OG_DESC_MAX - 3) + "..." : sourceText;
      setSeo(prev => ({ ...prev, ogDescription: truncated }));
    }
    if (sourceText && !seoManuallyEdited.twitterDescription) {
      const truncated = sourceText.length > TWITTER_DESC_MAX ? sourceText.substring(0, TWITTER_DESC_MAX - 3) + "..." : sourceText;
      setSeo(prev => ({ ...prev, twitterDescription: truncated }));
    }
  }, [excerpt, content, seoManuallyEdited]);

  useEffect(() => {
    updateSeoDescription();
  }, [updateSeoDescription]);

  const updateCanonicalUrl = useCallback(() => {
    if (slug && !seo.canonicalUrl) {
      setSeo(prev => ({ ...prev, canonicalUrl: `https://www.nextid.pk/news/${slug}` }));
    }
  }, [slug, seo.canonicalUrl]);

  useEffect(() => {
    updateCanonicalUrl();
  }, [updateCanonicalUrl]);

  const handleSlugChange = (val: string) => {
    setSlug(val);
    setSlugEdited(true);
    setSeo(prev => ({ ...prev, canonicalUrl: `https://www.nextid.pk/news/${val}` }));
  };

  const handleImageUrlChange = (url: string) => {
    if (url.startsWith('data:image')) {
      toast.error("Base64 images are not supported. Please use a valid image URL.");
      return;
    }
    setImageUrl(url);
    setImagePreview(url);
    if (url && !seo.ogImage) setSeo(prev => ({ ...prev, ogImage: url }));
    if (url && !seo.twitterImage) setSeo(prev => ({ ...prev, twitterImage: url }));
  };

  // Handle SEO changes
  const handleMetaTitleChange = (val: string) => {
    setSeoManuallyEdited(prev => ({ ...prev, metaTitle: true }));
    if (val.length <= META_TITLE_MAX) setSeo(prev => ({ ...prev, metaTitle: val }));
    else toast.warning(`Meta title cannot exceed ${META_TITLE_MAX} characters`);
  };

  const handleMetaDescriptionChange = (val: string) => {
    setSeoManuallyEdited(prev => ({ ...prev, metaDescription: true }));
    if (val.length <= META_DESC_MAX) setSeo(prev => ({ ...prev, metaDescription: val }));
    else toast.warning(`Meta description cannot exceed ${META_DESC_MAX} characters`);
  };

  const handleOgTitleChange = (val: string) => {
    setSeoManuallyEdited(prev => ({ ...prev, ogTitle: true }));
    if (val.length <= OG_TITLE_MAX) setSeo(prev => ({ ...prev, ogTitle: val }));
    else toast.warning(`OG title cannot exceed ${OG_TITLE_MAX} characters`);
  };

  const handleOgDescriptionChange = (val: string) => {
    setSeoManuallyEdited(prev => ({ ...prev, ogDescription: true }));
    if (val.length <= OG_DESC_MAX) setSeo(prev => ({ ...prev, ogDescription: val }));
    else toast.warning(`OG description cannot exceed ${OG_DESC_MAX} characters`);
  };

  const handleTwitterTitleChange = (val: string) => {
    setSeoManuallyEdited(prev => ({ ...prev, twitterTitle: true }));
    if (val.length <= TWITTER_TITLE_MAX) setSeo(prev => ({ ...prev, twitterTitle: val }));
    else toast.warning(`Twitter title cannot exceed ${TWITTER_TITLE_MAX} characters`);
  };

  const handleTwitterDescriptionChange = (val: string) => {
    setSeoManuallyEdited(prev => ({ ...prev, twitterDescription: true }));
    if (val.length <= TWITTER_DESC_MAX) setSeo(prev => ({ ...prev, twitterDescription: val }));
    else toast.warning(`Twitter description cannot exceed ${TWITTER_DESC_MAX} characters`);
  };

  // Parse CSV
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
      headers = ['title', 'content', 'slug', 'excerpt', 'category', 'tags', 'programid', 'instituteid', 'boardid', 'cityid', 'imageurl', 'source', 'author', 'isfeatured', 'isbreaking', 'status', 'metatitle', 'metadescription', 'metakeywords'];
    }
    
    const items: BulkItem[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('<')) continue;
      
      const values = line.split(',').map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => { obj[header] = values[index] || ''; });
      
      const title = obj.title || '';
      const content = obj.content || '';
      if (!title || !content) continue;
      
      const slug = obj.slug || generateSlug(title);
      const tagsStr = obj.tags || '';
      const tagList = tagsStr ? tagsStr.split('|').map(t => t.trim().toLowerCase()) : [];
      
      items.push({
        name: title, slug, displayOrder: 0, status: obj.status !== 'false',
        title, content, excerpt: obj.excerpt || '', category: obj.category || '', tags: tagList,
        programId: parseInt(obj.programid || '0') || undefined,
        instituteId: parseInt(obj.instituteid || '0') || undefined,
        boardId: parseInt(obj.boardid || '0') || undefined,
        cityId: parseInt(obj.cityid || '0') || undefined,
        imageUrl: obj.imageurl || '', source: obj.source || '', author: obj.author || '',
        isFeatured: obj.isfeatured === 'true', isBreaking: obj.isbreaking === 'true',
        publishedAt: obj.publishedat || '', expiresAt: obj.expiresat || '',
        metaTitle: obj.metatitle || '', metaDescription: obj.metadescription || '', metaKeywords: obj.metakeywords || '',
      });
    }
    return items;
  };

  const transformNewsItems = (items: BulkItem[]): TransformNewsItem[] => {
    return items.map(item => ({
      title: item.title || item.name, content: item.content, slug: item.slug,
      excerpt: item.excerpt, category: item.category, tags: item.tags,
      programId: item.programId, instituteId: item.instituteId, boardId: item.boardId, cityId: item.cityId,
      imageUrl: item.imageUrl, source: item.source, author: item.author,
      isFeatured: item.isFeatured, isBreaking: item.isBreaking,
      publishedAt: item.publishedAt, expiresAt: item.expiresAt, status: item.status,
      metaTitle: item.metaTitle, metaDescription: item.metaDescription, metaKeywords: item.metaKeywords,
    }));
  };

  // Bulk upload handler
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkUpload.file) { toast.error("Please upload a file"); return; }
    bulkUpload.setLoading(true);
    try {
      const text = await bulkUpload.file.text();
      const items = parseNewsCSV(text);
      if (items.length === 0) throw new Error("No valid news items found");
      const apiItems = transformNewsItems(items);
      const res = await fetch("/api/admin/news/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ news: apiItems }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload");
      if (data.success) {
        await clearNewsCache();
        toast.success(data.message || `${data.count} news items created`);
        router.push("/admin/news");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process bulk upload");
    } finally { bulkUpload.setLoading(false); }
  };

  const bulkUpload = useBulkUpload({
    apiEndpoint: "/api/admin/news/bulk", redirectPath: "/admin/news", itemName: "news",
    generateSlug, customParse: parseNewsCSV
  });

  // Fetch dropdown data
  useEffect(() => {
    async function fetchData() {
      try {
        const [programsRes, institutesRes, boardsRes, citiesRes] = await Promise.all([
          fetch("/api/admin/programs"), fetch("/api/admin/institutes"),
          fetch("/api/admin/boards"), fetch("/api/admin/cities")
        ]);
        setPrograms((await programsRes.json()).programs || []);
        setInstitutes((await institutesRes.json()).institutes || []);
        setBoards((await boardsRes.json()).boards || []);
        setCities((await citiesRes.json()).cities || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load form data");
      } finally { setFetchLoading(false); }
    }
    fetchData();
  }, []);

  // Single submit handler
  const handleSingleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSingleLoading(true);
    setError(null);

    const finalTitle = title.trim();
    const finalSlug = slug.trim();
    const finalContent = content.trim();

    if (!finalTitle) { setError("Title is required."); setSingleLoading(false); return; }
    if (!finalSlug) { setError("Slug is required."); setSingleLoading(false); return; }
    if (!finalContent) { setError("Content is required."); setSingleLoading(false); return; }
    if (!category) { setError("Please select a category."); setSingleLoading(false); return; }
    if (imageUrl && imageUrl.startsWith('data:image')) { setError("Base64 images are not supported."); setSingleLoading(false); return; }

    toast.loading("Creating news...", { id: "create-news" });

    try {
      const res = await fetch("/api/admin/news/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: finalTitle, slug: finalSlug, content: finalContent, excerpt: excerpt.trim() || null,
          category, tags, programId: programId || null, instituteId: instituteId || null,
          boardId: boardId || null, cityId: cityId || null,
          imageUrl: imageUrl.trim() || null, source: source.trim() || null, author: author.trim() || null,
          isFeatured, isBreaking, publishedAt: publishedAt || null, expiresAt: expiresAt || null, status,
          seo: {
            metaTitle: seo.metaTitle || null, metaDescription: seo.metaDescription || null,
            metaKeywords: seo.metaKeywords || null, canonicalUrl: seo.canonicalUrl || null,
            ogTitle: seo.ogTitle || null, ogDescription: seo.ogDescription || null,
            ogImage: seo.ogImage || null, twitterCard: seo.twitterCard || "summary_large_image",
            twitterTitle: seo.twitterTitle || null, twitterDescription: seo.twitterDescription || null,
            twitterImage: seo.twitterImage || null, schemaMarkup: seo.schemaMarkup || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "Failed to create news");
      if (data.success) {
        await clearNewsCache();
        toast.success("News created successfully!", { id: "create-news", duration: 3000 });
        router.push("/admin/news");
      } else throw new Error(data.error || "Failed to create news");
    } catch (err) {
      console.error("Error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create news", { id: "create-news" });
      setError(err instanceof Error ? err.message : "Failed to create news");
    } finally { setSingleLoading(false); }
  };

  const downloadSample = () => {
    const headers = ['title', 'content', 'slug', 'excerpt', 'category', 'tags', 'programId', 'instituteId', 'boardId', 'cityId', 'imageUrl', 'source', 'author', 'isFeatured', 'isBreaking', 'status', 'metaTitle', 'metaDescription', 'metaKeywords'];
    const sampleData = [
      ['University Announces New Policy', '<h2>New Admission Policy 2026</h2><p>Announcement</p>', 'university-new-policy', 'New admission policy announced', 'Admissions', 'admissions|university|policy', '1', '', '', '', 'https://example.com/image.jpg', 'University News', 'Admin', 'true', 'false', 'true', 'University New Policy 2026', 'Latest updates', 'admission, policy'],
    ];
    const csvContent = [headers.join(','), ...sampleData.map(row => row.map(cell => String(cell).includes(',') ? `"${cell}"` : cell).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'news-sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast.success("Sample CSV downloaded");
  };

  if (fetchLoading) {
    return <div className="p-6 max-w-7xl mx-auto"><div className="flex justify-center items-center h-64"><div className="text-gray-500">Loading...</div></div></div>;
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
            <button type="button" onClick={() => setShowSeoPanel(!showSeoPanel)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              SEO Settings
            </button>
            <button type="button" onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
            <Link href="/admin/news" className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">Cancel</Link>
          </div>
        </div>
        <div className="flex gap-4 mt-4 border-b">
          <button onClick={() => setActiveTab("single")} className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "single" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>Add Single News</button>
          <button onClick={() => setActiveTab("bulk")} className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "bulk" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>Bulk Upload</button>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      {activeTab === "single" ? (
        <form onSubmit={handleSingleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getCharacterLimitColor(title.length, TITLE_MAX)}`}>{title.length}/{TITLE_MAX}</span>
                      </div>
                      <input type="text" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter news title" className="w-full px-3 py-2 text-2xl font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-md">
                      <span className="text-gray-500 text-sm whitespace-nowrap">Permalink:</span>
                      <span className="text-blue-600 text-sm whitespace-nowrap">https://www.nextid.pk/news/</span>
                      <input type="text" name="slug" value={slug} onChange={(e) => handleSlugChange(e.target.value)} className="flex-1 px-2 py-1 bg-white border rounded text-sm font-mono" />
                      <button type="button" onClick={() => setSlugEdited(false)} className="text-xs text-gray-500 hover:text-blue-600 whitespace-nowrap">↻ Edit</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Editor */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="flex border-b bg-gray-50">
                  <button type="button" onClick={() => setEditorTab("write")} className={`px-4 py-2 text-sm font-medium ${editorTab === "write" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-800"}`}>Write</button>
                  <button type="button" onClick={() => setEditorTab("preview")} className={`px-4 py-2 text-sm font-medium ${editorTab === "preview" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-800"}`}>Preview</button>
                </div>
                <div className="p-6">
                  {editorTab === "write" ? (
                    <RichTextEditor value={content} onChange={setContent} placeholder="Write your news content here..." minHeight={400} />
                  ) : (
                    <div className="prose max-w-none min-h-[400px] p-4 border rounded bg-gray-50">
                      {content ? <div dangerouslySetInnerHTML={{ __html: content }} /> : <p className="text-gray-400 text-center mt-20">No content to preview</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Excerpt */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Excerpt <span className="text-xs text-gray-500 ml-2">(used for meta description if not set)</span></label>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getCharacterLimitColor(excerpt.length, EXCERPT_MAX)}`}>{excerpt.length}/{EXCERPT_MAX}</span>
                </div>
                <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Write a short summary of the news..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Category & Tags */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-medium flex items-center gap-2"><Hash className="w-4 h-4" /> Category & Tags</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                      <option value="">-- Select Category --</option>
                      {CATEGORY_OPTIONS.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags <span className="text-xs text-gray-400">(Max 10 tags)</span></label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-md">
                          <Hash className="w-3 h-3" /> {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyPress={handleTagKeyPress} placeholder="Type tag and press Enter or comma..." className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={() => addTag(tagInput)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Popular tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {POPULAR_TAGS.slice(0, 8).map((suggestedTag) => (
                          <button key={suggestedTag} type="button" onClick={() => addTag(suggestedTag)} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-blue-100 hover:text-blue-600 transition">{suggestedTag}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO Panel */}
              {showSeoPanel && (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b"><h3 className="font-medium">SEO Metadata</h3><p className="text-xs text-gray-500 mt-1">Auto-syncs with title & excerpt. Edit manually to override.</p></div>
                  <div className="p-4 space-y-4">
                    <div><div className="flex items-center justify-between mb-1"><label className="block text-sm font-medium text-gray-700">Meta Title</label><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getCharacterLimitColor(seo.metaTitle.length, META_TITLE_MAX)}`}>{seo.metaTitle.length}/{META_TITLE_MAX}</span></div><input type="text" value={seo.metaTitle} onChange={(e) => handleMetaTitleChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div><div className="flex items-center justify-between mb-1"><label className="block text-sm font-medium text-gray-700">Meta Description</label><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getCharacterLimitColor(seo.metaDescription.length, META_DESC_MAX)}`}>{seo.metaDescription.length}/{META_DESC_MAX}</span></div><textarea value={seo.metaDescription} onChange={(e) => handleMetaDescriptionChange(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <Input label="Meta Keywords" value={seo.metaKeywords} onChange={(val) => setSeo(prev => ({ ...prev, metaKeywords: val }))} placeholder="keyword1, keyword2, keyword3" />
                    <Input label="Canonical URL" value={seo.canonicalUrl} onChange={(val) => setSeo(prev => ({ ...prev, canonicalUrl: val }))} placeholder="https://www.nextid.pk/news/slug" />
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Publish Box */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b"><h3 className="font-medium">Publish</h3></div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between text-sm"><span className="text-gray-600">Status:</span><select value={status ? "published" : "draft"} onChange={(e) => setStatus(e.target.value === "published")} className="px-2 py-1 border rounded text-sm bg-white"><option value="published">Published</option><option value="draft">Draft</option></select></div>
                  <div className="text-sm"><div className="text-gray-600 mb-1">Published on:</div><input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></div>
                  <div className="text-sm"><div className="text-gray-600 mb-1">Expires on:</div><input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></div>
                  <button type="submit" disabled={singleLoading} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium">{singleLoading ? "Creating..." : "Create News"}</button>
                </div>
              </div>

              {/* Featured Image */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b"><h3 className="font-medium">Featured Image</h3><p className="text-xs text-gray-500 mt-1">✅ Image URL only (No base64)</p></div>
                <div className="p-4">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <div className="relative group">
                        <Image src={imagePreview} alt="Featured" width={400} height={160} className="w-full h-40 object-cover rounded border" onError={() => setImagePreview(null)} />
                        <button type="button" onClick={() => { setImageUrl(""); setImagePreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{imageUrl}</p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="mt-2 text-sm text-gray-500">Enter image URL below</p>
                    </div>
                  )}
                  <div className="mt-3">
                    <label className="block text-xs text-gray-600 mb-1">Image URL (https://...)</label>
                    <input type="url" value={imageUrl} onChange={(e) => handleImageUrlChange(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-gray-400 mt-1">⚠️ Base64 images not allowed. Use direct image URL.</p>
                  </div>
                </div>
              </div>

              {/* Related Entities */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b"><h3 className="font-medium">Related Entities</h3></div>
                <div className="p-4 space-y-3">
                  <Select label="Program" value={programId ?? 0} onChange={(val: number) => setProgramId(val)} options={[{ value: 0, label: "— Select Program —" }, ...programs.map(p => ({ value: p.id, label: p.name }))]} />
                  <Select label="Institute" value={instituteId ?? 0} onChange={(val: number) => setInstituteId(val)} options={[{ value: 0, label: "— Select Institute —" }, ...institutes.map(i => ({ value: i.id, label: `${i.name} (${i.cityName})` }))]} />
                  <Select label="Board" value={boardId ?? 0} onChange={(val: number) => setBoardId(val)} options={[{ value: 0, label: "— Select Board —" }, ...boards.map(b => ({ value: b.id, label: b.name }))]} />
                  <Select label="City" value={cityId ?? 0} onChange={(val: number) => setCityId(val)} options={[{ value: 0, label: "— Select City —" }, ...cities.map(c => ({ value: c.id, label: c.name }))]} />
                </div>
              </div>

              {/* Source & Author */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b"><h3 className="font-medium">Source & Author</h3></div>
                <div className="p-4 space-y-3">
                  <Input label="Source" value={source} onChange={setSource} placeholder="e.g. Dawn News" />
                  <Input label="Author" value={author} onChange={setAuthor} placeholder="e.g. John Doe" />
                </div>
              </div>

              {/* News Flags */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b"><h3 className="font-medium">News Flags</h3></div>
                <div className="p-4 space-y-2">
                  <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 text-orange-600 rounded" /><span className="text-sm text-gray-700">⭐ Featured News (Shows in Sidebar)</span></label>
                  <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"><input type="checkbox" checked={isBreaking} onChange={(e) => setIsBreaking(e.target.checked)} className="h-4 w-4 text-red-600 rounded" /><span className="text-sm text-gray-700">🔴 Breaking News (Shows in Banner)</span></label>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">CSV Format</h3>
            <p className="text-sm text-blue-600 mb-2">Headers: title, content, slug, excerpt, category, tags, programId, instituteId, boardId, cityId, imageUrl, source, author, isFeatured, isBreaking, status, metaTitle, metaDescription, metaKeywords</p>
            <p className="text-xs text-blue-500 mt-2">⚠️ Use direct image URLs only (no base64)</p>
          </div>
          <div className="mb-4 flex justify-end">
            <button onClick={downloadSample} className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download Sample CSV
            </button>
          </div>
          <BulkUpload title="" description="" sampleData={[]} onDownloadSample={downloadSample} bulkData={bulkUpload.bulkData} onBulkDataChange={bulkUpload.setBulkData} file={bulkUpload.file} fileName={bulkUpload.fileName} onFileChange={bulkUpload.handleFileChange} onClearFile={bulkUpload.clearFile} onSubmit={handleBulkSubmit} onClear={bulkUpload.clearAll} loading={bulkUpload.loading} itemName="news" hideSampleButton={true} />
        </div>
      )}
    </div>
  );
}