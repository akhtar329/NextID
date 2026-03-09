// app/admin/levels/[id]/edit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Input from "@/app/component/ui/Input";
import Button from "@/app/component/ui/Button";

type Level = {
  id: number;
  name: string;
  slug: string;
  fullForm: string | null;
  displayOrder: number;
  status: boolean;
  createdAt: string; // 👈 YEH IMPORTANT HAI
};

export default function EditLevelPage() {
  const router = useRouter();
  const params = useParams();
  const levelId = params.id as string;

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [fullForm, setFullForm] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [status, setStatus] = useState(true);
  const [createdAt, setCreatedAt] = useState(""); // 👈 ADD THIS
  const [slugEdited, setSlugEdited] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Slug generator
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  // Auto-generate slug when name changes
  useEffect(() => {
    if (!slugEdited && name) {
      setSlug(generateSlug(name));
    }
  }, [name, slugEdited]);

  // Fetch level data
  useEffect(() => {
    async function fetchLevel() {
      if (!levelId) return;
      setFetchLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/admin/levels/${levelId}`);
        if (!res.ok) throw new Error("Level not found");
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to fetch level");

        const level: Level = data.level;
        setName(level.name);
        setSlug(level.slug || generateSlug(level.name));
        setFullForm(level.fullForm || "");
        setDisplayOrder(level.displayOrder);
        setStatus(level.status);
        setCreatedAt(level.createdAt); // 👈 YEH SET KARO
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to fetch level");
        toast.error(err instanceof Error ? err.message : "Failed to fetch level");
      } finally {
        setFetchLoading(false);
      }
    }
    fetchLevel();
  }, [levelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name) {
      setError("Name is required.");
      setLoading(false);
      return;
    }

    const toastId = `update-level-${levelId}`;
    toast.loading("Updating level...", { id: toastId });

    try {
      const res = await fetch(`/api/admin/levels/${levelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: name.trim(), 
          slug: slug.trim() || generateSlug(name),
          fullForm: fullForm || null,
          displayOrder: Number(displayOrder), 
          status 
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update level");
      }

      toast.success("Level updated successfully", { id: toastId });
      router.push("/admin/levels");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to update level", { id: toastId });
      setError(err instanceof Error ? err.message : "Failed to update level");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this level?")) return;

    setDeleteLoading(true);
    const toastId = `delete-level-${levelId}`;
    toast.loading("Deleting level...", { id: toastId });

    try {
      const res = await fetch(`/api/admin/levels/${levelId}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete level");
      }

      toast.success("Level deleted successfully", { id: toastId });
      router.push("/admin/levels");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to delete level", { id: toastId });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "—";
    }
  };

  if (fetchLoading) {
    return (
      <div className="p-6">
        <div className="max-w-xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Edit Level</h1>
            <p className="text-gray-600 mt-1">Update level information</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border">
          <Input
            label="Level Name *"
            value={name}
            onChange={setName}
            placeholder="e.g., Bachelor"
            required
          />

          <Input
            label="Slug"
            value={slug}
            onChange={(val: string) => {
              setSlug(val);
              setSlugEdited(true);
            }}
            placeholder="url-friendly-name (auto-generated)"
          />

          <Input
            label="Full Form"
            value={fullForm}
            onChange={setFullForm}
            placeholder="e.g., Bachelor of Science"
          />

          <Input
            label="Display Order"
            type="number"
            value={displayOrder.toString()}
            onChange={(val: string) => setDisplayOrder(Number(val))}
            placeholder="Enter display order"
            min={0}
          />

          {/* Status Toggle */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Status
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setStatus(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === true
                    ? "bg-green-100 text-green-700 ring-1 ring-green-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatus(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === false
                    ? "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ID:</span>
              <span className="font-medium">{levelId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created:</span>
              <span className="font-medium">
                {formatDate(createdAt)} {/* 👈 YEH USE KARO */}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex gap-3">
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </PrimaryButton>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors ring-1 ring-red-200 disabled:opacity-50"
            >
              {deleteLoading ? "Deleting..." : "Delete Level"}
            </button>

            <Link
              href="/admin/levels"
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}