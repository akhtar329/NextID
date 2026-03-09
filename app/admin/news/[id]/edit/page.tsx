// app/admin/news/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Input from "@/app/component/ui/Input";
import Textarea from "@/app/component/ui/Textarea";
import Select from "@/app/component/ui/select";

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
  isFeatured: boolean;
  isBreaking: boolean;
  status: boolean;
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
  const [programId, setProgramId] = useState<number | null>(null);
  const [instituteId, setInstituteId] = useState<number | null>(null);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [status, setStatus] = useState(true);
  const [slugEdited, setSlugEdited] = useState(false);

  // Data lists
  const [programs, setPrograms] = useState<Option[]>([]);
  const [institutes, setInstitutes] = useState<Option[]>([]);
  const [boards, setBoards] = useState<Option[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch programs, institutes, boards
  useEffect(() => {
    async function fetchRelations() {
      try {
        const [pRes, iRes, bRes] = await Promise.all([
          fetch("/api/admin/programs"),
          fetch("/api/admin/institutes"),
          fetch("/api/admin/boards"),
        ]);
        const pData = await pRes.json();
        const iData = await iRes.json();
        const bData = await bRes.json();

        setPrograms(pData.programs?.map((p: any) => ({ value: p.id, label: p.name })) || []);
        setInstitutes(iData.institutes?.map((i: any) => ({ value: i.id, label: i.name })) || []);
        setBoards(bData.boards?.map((b: any) => ({ value: b.id, label: b.name })) || []);
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
        setProgramId(news.programId);
        setInstituteId(news.instituteId);
        setBoardId(news.boardId);
        setIsFeatured(news.isFeatured);
        setIsBreaking(news.isBreaking);
        setStatus(news.status);
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

  const handleSubmit = async (e: React.FormEvent) => {
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
          imageUrl, // <-- added here
          programId,
          instituteId,
          boardId,
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
    return <div className="p-6">Loading news data...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit News</h1>
        <Link href="/admin/news" className="px-4 py-2 border rounded-md bg-gray-50 hover:bg-gray-100">
          Back to News
        </Link>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <form className="space-y-4 bg-white p-6 rounded shadow" onSubmit={handleSubmit}>
        <Input label="Title *" value={title} onChange={setTitle} required />
        <Input label="Slug *" value={slug} onChange={handleSlugChange} required />
        <Textarea label="Content *" value={content} onChange={setContent} required />
        <Textarea label="Excerpt" value={excerpt} onChange={setExcerpt} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Select
          label="Program"
          value={programId || 0}
          onChange={(val: number) => setProgramId(val)}
          options={[{ value: 0, label: "None" }, ...programs]}
        />
        <Select
          label="Institute"
          value={instituteId || 0}
          onChange={(val: number) => setInstituteId(val)}
          options={[{ value: 0, label: "None" }, ...institutes]}
        />
        <Select
          label="Board"
          value={boardId || 0}
          onChange={(val: number) => setBoardId(val)}
          options={[{ value: 0, label: "None" }, ...boards]}
        />

        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
            Featured
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isBreaking} onChange={e => setIsBreaking(e.target.checked)} />
            Breaking
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={status} onChange={e => setStatus(e.target.checked)} />
            Active
          </label>
        </div>

        <div className="pt-4 flex gap-3">
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update News"}
          </PrimaryButton>
          <Link href="/admin/news" className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
