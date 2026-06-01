// app/admin/categories/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface Category {
  id: number;
  name: string;
  slug: string;
  displayOrder: number;
  status: boolean;
  createdAt: string;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [status, setStatus] = useState(true);

  // Slug generator
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  // Fetch category data
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/categories/${categoryId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch category");
        }

        if (data.success) {
          setCategory(data.category);
          setName(data.category.name);
          setSlug(data.category.slug);
          setDisplayOrder(data.category.displayOrder);
          setStatus(data.category.status);
        } else {
          toast.error(data.error || "Failed to load category");
          router.push("/admin/categories");
        }
      } catch (err) {
        console.error("Error fetching category:", err);
        toast.error("Failed to load category");
        router.push("/admin/categories");
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId, router]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast.error("Category name is required");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Updating category...");

    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          displayOrder,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error(data.error || "Category with this name/slug already exists");
        } else {
          throw new Error(data.error || "Failed to update category");
        }
      }

      if (data.success) {
        toast.success("Category updated successfully!", {
          id: toastId,
          duration: 3000,
        });
        router.push("/admin/categories");
      } else {
        throw new Error(data.error || "Failed to update category");
      }

    } catch (err) {
      console.error("Error updating category:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update category", {
        id: toastId,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-lg mx-auto">
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

  if (!category) {
    return (
      <div className="p-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-semibold mb-2">Category Not Found</h2>
          <p className="text-gray-500 mb-4">The category you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/admin/categories")}>
            Back to Categories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Edit Category</h1>
          <p className="text-gray-600 mt-1">Update category information</p>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name *"
            placeholder="Enter category name (e.g., Engineering)"
            value={name}
            onChange={handleNameChange}
            required
          />

          <Input
            label="Slug *"
            placeholder="url-friendly-name"
            value={slug}
            onChange={(val: string) => setSlug(val)}
            required
          />

          <Input
            label="Display Order"
            type="number"
            placeholder="Enter display order"
            value={displayOrder.toString()}
            onChange={(val: string) => setDisplayOrder(Number(val))}
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
              <span className="font-medium">{category.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created:</span>
              <span className="font-medium">
                {new Date(category.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <button
              type="button"
              onClick={() => router.push("/admin/categories")}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}