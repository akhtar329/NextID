"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Input from "@/app/component/ui/Input";

export default function EditCityPage() {
  const router = useRouter();
  const params = useParams();
  const cityId = params.id as string;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [province, setProvince] = useState("");
  const [isPopular, setIsPopular] = useState(false);
  const [status, setStatus] = useState(true);
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityName, setCityName] = useState("");

  // Fetch city data
  useEffect(() => {
    async function fetchCity() {
      if (!cityId) return;
      
      setFetchLoading(true);
      
      try {
        const res = await fetch(`/api/admin/cities/${cityId}`);
        
        const text = await res.text();
        
        if (!text) {
          throw new Error("Empty response from server");
        }
        
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          throw new Error("Invalid response from server");
        }
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch city");
        }
        
        if (data.success && data.city) {
          const city = data.city;
          setName(city.name || "");
          setSlug(city.slug || "");
          setProvince(city.province || "");
          setIsPopular(city.isPopular || false);
          setStatus(city.status === undefined ? true : city.status);
          setCityName(city.name || "");
        } else {
          throw new Error(data.error || "Failed to load city");
        }
        
      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load city");
        toast.error(err instanceof Error ? err.message : "Failed to load city");
      } finally {
        setFetchLoading(false);
      }
    }
    
    fetchCity();
  }, [cityId]);

  // Auto-generate slug
  useEffect(() => {
    if (!slugEdited && name) {
      const generated = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      setSlug(generated);
    }
  }, [name, slugEdited]);

  const handleSlugChange = (val: string) => {
    setSlug(val);
    setSlugEdited(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name || !slug) {
      setError("City name and slug are required.");
      setLoading(false);
      return;
    }

    toast.loading(`Updating "${name}"...`, { id: "update-city" });

    try {
      const res = await fetch(`/api/admin/cities/${cityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          province: province.trim() || null,
          isPopular,
          status,
        }),
      });

      const text = await res.text();
      
      if (!text) {
        throw new Error("Empty response from server");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error("Invalid response from server");
      }

      if (!res.ok) {
        throw new Error(data.error || data.details || "Failed to update city");
      }

      if (data.success) {
        toast.success(`"${name}" updated successfully!`, { 
          id: "update-city",
          duration: 3000 
        });
        router.push("/admin/cities");
      } else {
        throw new Error(data.error || "Failed to update city");
      }

    } catch (err) {
      console.error("Error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update city", { 
        id: "update-city" 
      });
      setError(err instanceof Error ? err.message : "Failed to update city");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading city data...</div>
        </div>
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded text-center">
          <p className="mb-4">{error}</p>
          <Link href="/admin/cities" className="text-blue-600 hover:underline">
            Back to Cities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/admin" className="hover:text-blue-600">Dashboard</Link>
          <span className="mx-2">›</span>
          <Link href="/admin/cities" className="hover:text-blue-600">Cities</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">Edit: {cityName}</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Edit City</h1>
          <Link
            href="/admin/cities"
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
          >
            View All Cities
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form className="bg-white p-6 rounded-lg shadow-sm border space-y-4" onSubmit={handleSubmit}>
        <Input
          label="City Name *"
          value={name}
          onChange={setName}
          placeholder="e.g. Karachi"
          required
        />

        <Input
          label="Slug *"
          value={slug}
          onChange={handleSlugChange}
          placeholder="e.g. karachi"
          required
        />

        <Input
          label="Province"
          value={province}
          onChange={setProvince}
          placeholder="e.g. Sindh"
        />

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <input
              id="isPopular"
              type="checkbox"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="isPopular" className="text-sm font-medium text-gray-700">
              Mark as Popular
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

        <div className="pt-4 flex items-center gap-3">
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update City"}
          </PrimaryButton>
          
          <Link
            href="/admin/cities"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}