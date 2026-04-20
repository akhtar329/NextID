// app/admin/date-sheets/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Save, Eye, Star } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/app/component/ui/RichTextEditor";

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

export default function CreateDateSheetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    boardId: "",
    instituteId: "",
    examType: "",
    examDate: "",
    year: new Date().getFullYear().toString(),
    officialLink: "",
    downloadLink: "",
    pdfFile: "",
    featuredImage: "",
    isPopular: false,
    status: true,
    description: "",
  });

  // SEO Metadata State
  const [seoData, setSeoData] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
  });

  useEffect(() => {
    fetchBoards();
    fetchInstitutes();
  }, []);

  const fetchBoards = async () => {
    try {
      const res = await fetch("/api/admin/boards");
      const data = await res.json();
      
      if (data.success && Array.isArray(data.boards)) {
        setBoards(data.boards);
      } else if (Array.isArray(data)) {
        setBoards(data);
      } else {
        setBoards([]);
      }
    } catch (error) {
      console.error("Error fetching boards:", error);
      setBoards([]);
    }
  };

  const fetchInstitutes = async () => {
    try {
      const res = await fetch("/api/admin/institutes");
      const data = await res.json();
      
      let institutesData = [];
      if (data.success && Array.isArray(data.data)) {
        institutesData = data.data;
      } else if (data.success && Array.isArray(data.institutes)) {
        institutesData = data.institutes;
      } else if (Array.isArray(data)) {
        institutesData = data;
      } else {
        institutesData = [];
      }
      
      setInstitutes(institutesData);
    } catch (error) {
      console.error("Error fetching institutes:", error);
      setInstitutes([]);
    }
  };

  const generateSlug = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    // Auto-generate SEO title and description from title
    setSeoData(prev => ({
      ...prev,
      metaTitle: `${title} - Download PDF | NextID.pk`,
      metaDescription: `Download official ${title}. Complete exam schedule for ${new Date().getFullYear()} annual examinations. Get PDF and official notification.`,
      ogTitle: `${title} - Exam Schedule ${new Date().getFullYear()}`,
      ogDescription: `Download ${title}. Complete date sheet for all subjects.`,
    }));
    
    return slug;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "title") {
        updated.slug = generateSlug(value);
      }

      return updated;
    });
  };

  const handleSeoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSeoData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Create date sheet
      const payload = {
        title: formData.title,
        slug: formData.slug,
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

      const res = await fetch("/api/admin/date-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // ✅ Fix: Check if response has content before parsing JSON
      let data;
      try {
        const text = await res.text();
        if (!text || text.trim() === "") {
          throw new Error("Empty response from server");
        }
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        toast.error("Server returned an invalid response");
        setLoading(false);
        return;
      }

      if (res.ok && data.id) {
        // Step 2: Create SEO metadata for this date sheet
        const seoPayload = {
          entityType: "date_sheet",
          entityId: data.id,
          metaTitle: seoData.metaTitle || `${formData.title} - Download PDF | NextID.pk`,
          metaDescription: seoData.metaDescription || `Download official ${formData.title}. Complete exam schedule for ${formData.year}.`,
          metaKeywords: seoData.metaKeywords || `${formData.title}, date sheet, ${formData.year}, exam schedule`,
          ogTitle: seoData.ogTitle || seoData.metaTitle,
          ogDescription: seoData.ogDescription || seoData.metaDescription,
          ogImage: seoData.ogImage || formData.featuredImage,
          canonicalUrl: `https://nextid.pk/date-sheets/${formData.slug}`,
          robots: "index, follow",
          ogType: "article",
          twitterCard: "summary_large_image",
        };

        try {
          await fetch("/api/admin/seo-metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(seoPayload),
          });
        } catch (seoError) {
          console.error("SEO metadata error:", seoError);
          // Don't fail the whole operation if SEO fails
        }

        toast.success("Date sheet created successfully!");
        router.push("/admin/date-sheets");
      } else {
        toast.error(data?.error || "Failed to create date sheet");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
                Create Date Sheet
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Add examination schedule with SEO metadata
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
                  placeholder="e.g., BISE Lahore 9th Class Annual Date Sheet 2026"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug (Auto-generated)</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                />
              </div>

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

              <div>
                <label className="block text-sm font-medium mb-2">Board</label>
                <select
                  name="boardId"
                  value={formData.boardId}
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
                {boards.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">No boards available</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Institute</label>
                <select
                  name="instituteId"
                  value={formData.instituteId}
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
                {institutes.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">No institutes available</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Official Link</label>
                <input
                  type="url"
                  name="officialLink"
                  value={formData.officialLink}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Download Link (PDF)</label>
                <input
                  type="url"
                  name="downloadLink"
                  value={formData.downloadLink}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">PDF File URL</label>
                <input
                  type="url"
                  name="pdfFile"
                  value={formData.pdfFile}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Featured Image URL</label>
                <input
                  type="url"
                  name="featuredImage"
                  value={formData.featuredImage}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Description (Content)
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="Write detailed description about the date sheet..."
                />
              </div>

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
              SEO Metadata (for search engines)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Meta Title <span className="text-xs text-gray-500">(50-60 characters recommended)</span>
                </label>
                <input
                  type="text"
                  name="metaTitle"
                  value={seoData.metaTitle}
                  onChange={handleSeoChange}
                  placeholder="BISE Lahore 9th Class Date Sheet 2026 - Download PDF"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Characters: {seoData.metaTitle.length}/60
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Meta Description <span className="text-xs text-gray-500">(150-160 characters recommended)</span>
                </label>
                <textarea
                  name="metaDescription"
                  value={seoData.metaDescription}
                  onChange={handleSeoChange}
                  rows={3}
                  placeholder="Download official BISE Lahore 9th class date sheet 2026. Complete exam schedule for annual examinations. Get PDF and official notification."
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Characters: {seoData.metaDescription.length}/160
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Meta Keywords <span className="text-xs text-gray-500">(comma separated)</span>
                </label>
                <input
                  type="text"
                  name="metaKeywords"
                  value={seoData.metaKeywords}
                  onChange={handleSeoChange}
                  placeholder="BISE Lahore, date sheet, 9th class, 2026, annual exams"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">OG Title (Facebook/WhatsApp)</label>
                <input
                  type="text"
                  name="ogTitle"
                  value={seoData.ogTitle}
                  onChange={handleSeoChange}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">OG Image URL</label>
                <input
                  type="url"
                  name="ogImage"
                  value={seoData.ogImage}
                  onChange={handleSeoChange}
                  placeholder="https://..."
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
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save size={16} />
              Create Date Sheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}