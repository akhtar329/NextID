// app/admin/boards/[id]/edit/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/select";

interface City {
  id: number;
  name: string;
}

interface Board {
  id: number;
  name: string;
  slug: string;
  type: string;
  cityId: number;
  website: string | null;
  description: string | null;
  establishedYear: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  status: boolean;
  createdAt: string;
  seo?: {
    id: number;
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    robots: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
  } | null;
}

export default function EditBoardPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [cityId, setCityId] = useState<number>(0);
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [establishedYear, setEstablishedYear] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // SEO Fields (from seo_metadata table)
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [robots, setRobots] = useState("index, follow");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cities
        const citiesRes = await fetch("/api/admin/cities");
        const citiesData = await citiesRes.json();
        setCities(citiesData.cities || []);

        // Fetch board data
        const boardRes = await fetch(`/api/admin/boards/${boardId}`);
        const boardData = await boardRes.json();

        if (boardData.success && boardData.board) {
          const board = boardData.board;
          setName(board.name || "");
          setSlug(board.slug || "");
          setCityId(board.cityId || 0);
          setWebsite(board.website || "");
          setDescription(board.description || "");
          setEstablishedYear(board.establishedYear ? String(board.establishedYear) : "");
          setContactEmail(board.contactEmail || "");
          setContactPhone(board.contactPhone || "");
          setAddress(board.address || "");
          setStatus(board.status === true);
          
          // Load SEO data if exists
          if (board.seo) {
            setMetaTitle(board.seo.metaTitle || "");
            setMetaDescription(board.seo.metaDescription || "");
            setCanonicalUrl(board.seo.canonicalUrl || "");
            setRobots(board.seo.robots || "index, follow");
            setOgTitle(board.seo.ogTitle || "");
            setOgDescription(board.seo.ogDescription || "");
            setOgImage(board.seo.ogImage || "");
          } else {
            // Auto-generate default SEO if not exists
            setMetaTitle(`${board.name} - Results, Date Sheets & Announcements | NextID.pk`);
            setCanonicalUrl(`https://www.nextid.pk/boards/${board.slug}`);
            setOgTitle(`${board.name} - Results & Date Sheets`);
            setOgDescription(`Check ${board.name} results, date sheets, and announcements.`);
          }
        } else {
          toast.error("Board not found");
          router.push("/admin/boards");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (boardId) {
      fetchData();
    }
  }, [boardId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!name) {
      setError("Name is required");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/boards/${boardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          cityId: Number(cityId),
          website: website || null,
          description: description || null,
          establishedYear: establishedYear ? parseInt(establishedYear) : null,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          address: address || null,
          status,
          // SEO fields (will be saved to seo_metadata)
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          canonicalUrl: canonicalUrl || null,
          robots: robots || "index, follow",
          ogTitle: ogTitle || metaTitle || null,
          ogDescription: ogDescription || metaDescription || null,
          ogImage: ogImage || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Board updated successfully");
        router.push("/admin/boards");
      } else {
        throw new Error(data.error || "Failed to update");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Edit Board</h1>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border">
        {/* Basic Information */}
        <div className="border-b pb-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Board Name *"
              value={name}
              onChange={setName}
              required
              placeholder="e.g., BISE Lahore"
            />
            <Input
              label="Slug"
              value={slug}
              onChange={setSlug}
              placeholder="url-friendly-name"
            />
            <Select
              label="City"
              value={cityId}
              onChange={(val: number) => setCityId(val)}
              options={[
                { value: 0, label: "Select City" },
                ...cities.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
            <Input
              label="Website"
              value={website}
              onChange={setWebsite}
              placeholder="e.g., www.example.com"
            />
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Board description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-b pb-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Established Year"
                type="number"
                value={establishedYear}
                onChange={setEstablishedYear}
                placeholder="e.g., 1954"
              />
              <p className="text-xs text-gray-500 mt-1">Year the board was established</p>
            </div>
            <Input
              label="Contact Email"
              type="email"
              value={contactEmail}
              onChange={setContactEmail}
              placeholder="e.g., info@board.edu.pk"
            />
            <Input
              label="Contact Phone"
              value={contactPhone}
              onChange={setContactPhone}
              placeholder="e.g., +92-42-12345678"
            />
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Complete address of the board office..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* SEO Settings */}
        <div className="border-b pb-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">SEO Settings</h2>
          <div className="space-y-3">
            <Input
              label="Meta Title"
              value={metaTitle}
              onChange={setMetaTitle}
              placeholder="SEO optimized title (50-60 characters)"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="SEO optimized description (150-160 characters)"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Input
              label="Canonical URL"
              value={canonicalUrl}
              onChange={setCanonicalUrl}
              placeholder="https://www.nextid.pk/boards/board-slug"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Robots"
                value={robots}
                onChange={setRobots}
                placeholder="index, follow"
              />
            </div>
            <Input
              label="OG Title (Facebook/Twitter)"
              value={ogTitle}
              onChange={setOgTitle}
              placeholder="Title for social media sharing"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OG Description
              </label>
              <textarea
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
                placeholder="Description for social media sharing"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Input
              label="OG Image URL"
              value={ogImage}
              onChange={setOgImage}
              placeholder="https://www.nextid.pk/images/board-og.jpg"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setStatus(true)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                status 
                  ? "bg-green-600 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatus(false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !status 
                  ? "bg-red-600 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <button
            type="button"
            onClick={() => router.push("/admin/boards")}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}