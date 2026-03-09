// app/admin/degrees/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Input from "@/app/component/ui/Input";
import Button from "@/app/component/ui/Button";
import Select from "@/app/component/ui/select";

interface Level {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface Degree {
  id: number;
  name: string;
  slug: string;
  fullForm: string | null;
  levelId: number;
  categoryId: number;
  displayOrder: number;
  status: boolean;
  createdAt: string;
}

export default function EditDegreePage() {
  const params = useParams();
  const router = useRouter();

  const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const degreeId = idParam ? Number(idParam) : NaN;

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [fullForm, setFullForm] = useState("");
  const [levelId, setLevelId] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [status, setStatus] = useState<boolean>(true);
  const [slugEdited, setSlugEdited] = useState(false);
  
  // Data states
  const [levels, setLevels] = useState<Level[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  // Fetch degree data and related data
  useEffect(() => {
    if (isNaN(degreeId)) {
      toast.error("Invalid degree ID");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch levels and categories in parallel
        const [levelsRes, categoriesRes] = await Promise.all([
          fetch("/api/admin/levels"),
          fetch("/api/admin/categories")
        ]);
        
        const levelsData = await levelsRes.json();
        const categoriesData = await categoriesRes.json();
        
        if (levelsData.success) {
          setLevels(levelsData.levels || []);
        }
        
        if (categoriesData.success) {
          setCategories(categoriesData.categories || []);
        }

        // Fetch degree data
        const degreeRes = await fetch(`/api/admin/degrees/${degreeId}`);
        const degreeData = await degreeRes.json();

        if (degreeData.success && degreeData.degree) {
          const degree = degreeData.degree;
          setName(degree.name || "");
          setSlug(degree.slug || generateSlug(degree.name || ""));
          setFullForm(degree.fullForm || "");
          setLevelId(degree.levelId || 0);
          setCategoryId(degree.categoryId || 0);
          setDisplayOrder(degree.displayOrder || 0);
          setStatus(degree.status === true);
        } else {
          toast.error(degreeData.error || "Degree not found");
          router.push("/admin/degrees");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load data");
        router.push("/admin/degrees");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [degreeId, router]);

  const handleUpdate = async () => {
    // Validation
    if (!name) {
      toast.error("Degree name is required");
      return;
    }

    if (!levelId || levelId === 0) {
      toast.error("Please select a level");
      return;
    }

    if (!categoryId || categoryId === 0) {
      toast.error("Please select a category");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Updating degree...");

    try {
      const res = await fetch(`/api/admin/degrees/${degreeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || generateSlug(name),
          fullForm: fullForm || null,
          levelId: Number(levelId),
          categoryId: Number(categoryId),
          displayOrder: Number(displayOrder),
          status: status, // boolean
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error(data.error || "Degree with this name/slug already exists");
        } else {
          throw new Error(data.error || "Failed to update degree");
        }
      }

      if (data.success) {
        toast.success("Degree updated successfully!", {
          id: toastId,
          duration: 3000,
        });
        router.push("/admin/degrees");
      } else {
        throw new Error(data.error || "Failed to update degree");
      }

    } catch (err) {
      console.error("Error updating degree:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update degree", {
        id: toastId,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this degree?")) return;

    setSubmitting(true);
    const toastId = toast.loading("Deleting degree...");

    try {
      const res = await fetch(`/api/admin/degrees/${degreeId}`, { 
        method: "DELETE" 
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete degree");
      }

      if (data.success) {
        toast.success("Degree deleted successfully!", {
          id: toastId,
          duration: 3000,
        });
        router.push("/admin/degrees");
      } else {
        throw new Error(data.error || "Failed to delete degree");
      }

    } catch (err) {
      console.error("Error deleting degree:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete degree", {
        id: toastId,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
            <h1 className="text-2xl font-semibold">Edit Degree</h1>
            <p className="text-gray-600 mt-1">Update degree information</p>
          </div>
          <Button 
            onClick={() => router.back()} 
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Back
          </Button>
        </div>

        {/* Edit Form */}
        <div className="space-y-4">
          <Input
            label="Degree Name *"
            placeholder="Enter short name (e.g. BS)"
            value={name}
            onChange={(val: string) => setName(val)}
          />

          <Input
            label="Slug"
            placeholder="url-friendly-name (auto-generated)"
            value={slug}
            onChange={(val: string) => {
              setSlug(val);
              setSlugEdited(true);
            }}
          />

          <Input
            label="Full Form"
            placeholder="Enter full form (e.g. Bachelor of Science)"
            value={fullForm}
            onChange={(val: string) => setFullForm(val)}
          />

          <Select
            label="Level *"
            value={levelId}
            onChange={(val: number) => setLevelId(val)}
            options={[
              { value: 0, label: "Select Level" },
              ...levels.map((lvl) => ({ value: lvl.id, label: lvl.name })),
            ]}
          />

          <Select
            label="Category *"
            value={categoryId}
            onChange={(val: number) => setCategoryId(val)}
            options={[
              { value: 0, label: "Select Category" },
              ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
            ]}
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
              <span className="font-medium">{degreeId}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex gap-3">
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? "Processing..." : "Update Degree"}
            </Button>

            <button
              onClick={handleDelete}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors ring-1 ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Degree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}