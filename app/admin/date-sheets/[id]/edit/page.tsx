// app/admin/date-sheets/[id]/edit/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Save, Eye, Star } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/ui/RichTextEditor";

interface Board {
  id: number;
  name: string;
  slug: string;
}

interface Institute {
  id: number;
  name: string;
  slug: string;
}

interface DateSheet {
  id: number;
  title: string;
  slug: string;
  boardId: number | null;
  instituteId: number | null;
  examType: string;
  examDate: string;
  year: number;
  officialLink: string;
  downloadLink: string;
  pdfFile: string;
  featuredImage: string;
  isPopular: boolean;
  status: boolean;
  description: string;
}

interface SeoMetadata {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
}

export default function EditDateSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  
  const [formData, setFormData] = useState<DateSheet>({
    id: 0,
    title: "",
    slug: "",
    boardId: null,
    instituteId: null,
    examType: "",
    examDate: "",
    year: new Date().getFullYear(),
    officialLink: "",
    downloadLink: "",
    pdfFile: "",
    featuredImage: "",
    isPopular: false,
    status: true,
    description: "",
  });

  const [seoData, setSeoData] = useState<SeoMetadata>({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [sheetRes, boardsRes, institutesRes, seoRes] = await Promise.all([
        fetch(`/api/admin/date-sheets/${id}`),
        fetch("/api/admin/boards"),
        fetch("/api/admin/institutes"),
        fetch(`/api/admin/seo-metadata?entityType=date_sheet&entityId=${id}`),
      ]);

      const sheetData = await sheetRes.json();
      if (sheetRes.ok) {
        setFormData({
          id: sheetData.id || 0,
          title: sheetData.title || "",
          slug: sheetData.slug || "",  // ✅ Slug from database - never changes
          boardId: sheetData.boardId || null,
          instituteId: sheetData.instituteId || null,
          examType: sheetData.examType || "",
          examDate: sheetData.examDate ? sheetData.examDate.split('T')[0] : "",
          year: sheetData.year || new Date().getFullYear(),
          officialLink: sheetData.officialLink || "",
          downloadLink: sheetData.downloadLink || "",
          pdfFile: sheetData.pdfFile || "",
          featuredImage: sheetData.featuredImage || "",
          isPopular: sheetData.isPopular || false,
          status: sheetData.status !== undefined ? sheetData.status : true,
          description: sheetData.description || "",
        });
      } else {
        toast.error(sheetData.error || "Failed to load date sheet");
        router.push("/admin/date-sheets");
      }

      const seoDataResult = await seoRes.json();
      if (seoRes.ok && seoDataResult.data) {
        setSeoData({
          metaTitle: seoDataResult.data.metaTitle || "",
          metaDescription: seoDataResult.data.metaDescription || "",
          metaKeywords: seoDataResult.data.metaKeywords || "",
          ogTitle: seoDataResult.data.ogTitle || "",
          ogDescription: seoDataResult.data.ogDescription || "",
          ogImage: seoDataResult.data.ogImage || "",
        });
      }

      const boardsData = await boardsRes.json();
      if (boardsData.success && Array.isArray(boardsData.boards)) {
        setBoards(boardsData.boards);
      } else if (Array.isArray(boardsData)) {
        setBoards(boardsData);
      } else {
        setBoards([]);
      }

      const institutesData = await institutesRes.json();
      let institutesList = [];
      if (institutesData.success && Array.isArray(institutesData.data)) {
        institutesList = institutesData.data;
      } else if (institutesData.success && Array.isArray(institutesData.institutes)) {
        institutesList = institutesData.institutes;
      } else if (Array.isArray(institutesData)) {
        institutesList = institutesData;
      }
      setInstitutes(institutesList);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
      router.push("/admin/date-sheets");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle change - NO slug update on title change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    
    // ✅ IMPORTANT: DO NOT update slug when title changes
    // Slug should remain as it was when created
  };

  const handleSeoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSeoData((prev) => ({ ...prev, [name]: value }));
  };

 const handleDescriptionChange = (value: string | any) => {
  const textValue = typeof value === 'string' ? value : '';
  setFormData((prev) => ({ ...prev, description: textValue }));
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // ✅ Send existing slug (not a new one)
      const payload = {
        id: formData.id,
        title: formData.title,
        slug: formData.slug,  // ✅ Original slug from database
        boardId: formData.boardId ? Number(formData.boardId) : null,
        instituteId: formData.instituteId ? Number(formData.instituteId) : null,
        examType: formData.examType || null,
        examDate: formData.examDate ? new Date(formData.examDate).toISOString() : null,
        year: Number(formData.year),
        officialLink: formData.officialLink || null,
        downloadLink: formData.downloadLink || null,
        pdfFile: formData.pdfFile || null,
        featuredImage: formData.featuredImage || null,
        isPopular: formData.isPopular,
        status: formData.status,
        description: formData.description || null,
      };

      const res = await fetch(`/api/admin/date-sheets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Update SEO metadata
        const seoPayload = {
          entityType: "date_sheet",
          entityId: formData.id,
          metaTitle: seoData.metaTitle,
          metaDescription: seoData.metaDescription,
          metaKeywords: seoData.metaKeywords,
          ogTitle: seoData.ogTitle,
          ogDescription: seoData.ogDescription,
          ogImage: seoData.ogImage || formData.featuredImage,
          canonicalUrl: `https://www.nextid.pk/date-sheets/${formData.slug}`,
          robots: "index, follow",
          ogType: "article",
          twitterCard: "summary_large_image",
        };

        await fetch("/api/admin/seo-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(seoPayload),
        });

        toast.success("Date sheet updated successfully!");
        router.push("/admin/date-sheets");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update date sheet");
      }
    } catch (error) {
      console.error("Error updating date sheet:", error);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/date-sheets"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Date Sheet
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Update examination schedule
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.open(`/date-sheets/${formData.slug}`, "_blank")}
              disabled={!formData.slug}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Eye size={16} />
              Preview
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title - Can be edited */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Changing title will NOT change the URL (slug)
                </p>
              </div>

              {/* Slug - READ ONLY - Never changes */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Slug (URL) <span className="text-xs text-red-500"></span>
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  readOnly
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60"
                />
                <p className="text-xs text-amber-500 mt-1">
                  ⚠️ Slug cannot be edited. It's permanently set when created.
                </p>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium mb-2">Year *</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              {/* Exam Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Exam Type</label>
                <select
                  name="examType"
                  value={formData.examType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Select Exam Type</option>
                  <option value="Annual">Annual</option>
                  <option value="Supplementary">Supplementary</option>
                  <option value="Special">Special</option>
                </select>
              </div>

              {/* Exam Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Exam Date</label>
                <input
                  type="date"
                  name="examDate"
                  value={formData.examDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              {/* Board */}
              <div>
                <label className="block text-sm font-medium mb-2">Board</label>
                <select
                  name="boardId"
                  value={formData.boardId || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Select Board</option>
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Institute */}
              <div>
                <label className="block text-sm font-medium mb-2">Institute</label>
                <select
                  name="instituteId"
                  value={formData.instituteId || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Select Institute</option>
                  {institutes.map((institute) => (
                    <option key={institute.id} value={institute.id}>
                      {institute.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Official Link */}
              <div>
                <label className="block text-sm font-medium mb-2">Official Link</label>
                <input
                  type="url"
                  name="officialLink"
                  value={formData.officialLink || ""}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              {/* Download Link */}
              <div>
                <label className="block text-sm font-medium mb-2">Download Link</label>
                <input
                  type="url"
                  name="downloadLink"
                  value={formData.downloadLink || ""}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              {/* PDF File */}
              <div>
                <label className="block text-sm font-medium mb-2">PDF File URL</label>
                <input
                  type="url"
                  name="pdfFile"
                  value={formData.pdfFile || ""}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium mb-2">Featured Image URL</label>
                <input
                  type="url"
                  name="featuredImage"
                  value={formData.featuredImage || ""}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Description (Content)</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="Write detailed description about the date sheet..."
                />
              </div>

              {/* Flags */}
              <div className="col-span-2">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isPopular"
                      checked={formData.isPopular}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500" />
                      Mark as Popular
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="status"
                      checked={formData.status}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SEO Metadata Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b">
              SEO Metadata
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Meta Title</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={seoData.metaTitle}
                  onChange={handleSeoChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Meta Description</label>
                <textarea
                  name="metaDescription"
                  value={seoData.metaDescription}
                  onChange={handleSeoChange}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Meta Keywords</label>
                <input
                  type="text"
                  name="metaKeywords"
                  value={seoData.metaKeywords}
                  onChange={handleSeoChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">OG Title</label>
                <input
                  type="text"
                  name="ogTitle"
                  value={seoData.ogTitle}
                  onChange={handleSeoChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">OG Image</label>
                <input
                  type="url"
                  name="ogImage"
                  value={seoData.ogImage}
                  onChange={handleSeoChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">OG Description</label>
                <textarea
                  name="ogDescription"
                  value={seoData.ogDescription}
                  onChange={handleSeoChange}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <Link
              href="/admin/date-sheets"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save size={16} />
              Update Date Sheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}