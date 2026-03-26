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

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [province, setProvince] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [population, setPopulation] = useState("");
  const [area, setArea] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
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
          setDescription(city.description || "");
          setImageUrl(city.imageUrl || "");
          setThumbnailUrl(city.thumbnailUrl || "");
          setLatitude(city.latitude || "");
          setLongitude(city.longitude || "");
          setPopulation(city.population ? String(city.population) : "");
          setArea(city.area || "");
          setMetaTitle(city.metaTitle || "");
          setMetaDescription(city.metaDescription || "");
          setMetaKeywords(city.metaKeywords || "");
          setDisplayOrder(city.displayOrder ? String(city.displayOrder) : "");
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
          description: description.trim() || null,
          imageUrl: imageUrl.trim() || null,
          thumbnailUrl: thumbnailUrl.trim() || null,
          latitude: latitude.trim() || null,
          longitude: longitude.trim() || null,
          population: population ? parseInt(population) : null,
          area: area.trim() || null,
          metaTitle: metaTitle.trim() || null,
          metaDescription: metaDescription.trim() || null,
          metaKeywords: metaKeywords.trim() || null,
          displayOrder: displayOrder ? parseInt(displayOrder) : 0,
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
      <div className="p-6 max-w-4xl mx-auto">
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
    <div className="p-6 max-w-4xl mx-auto">
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
        {/* Basic Information */}
        <div className="border-b pb-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Input
              label="Display Order"
              type="number"
              value={displayOrder}
              onChange={setDisplayOrder}
              placeholder="e.g. 1"
            />
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="City description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Images */}
        <div className="border-b pb-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Featured Image URL"
              value={imageUrl}
              onChange={setImageUrl}
              placeholder="https://example.com/city-image.jpg"
            />
            <Input
              label="Thumbnail URL"
              value={thumbnailUrl}
              onChange={setThumbnailUrl}
              placeholder="https://example.com/city-thumbnail.jpg"
            />
          </div>
        </div>

        {/* Location & Demographics */}
        <div className="border-b pb-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Location & Demographics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Latitude"
              value={latitude}
              onChange={setLatitude}
              placeholder="e.g. 24.8607"
            />
            <Input
              label="Longitude"
              value={longitude}
              onChange={setLongitude}
              placeholder="e.g. 67.0011"
            />
            <Input
              label="Population"
              type="number"
              value={population}
              onChange={setPopulation}
              placeholder="e.g. 20000000"
            />
            <Input
              label="Area"
              value={area}
              onChange={setArea}
              placeholder="e.g. 3,527 km²"
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
              label="Meta Keywords"
              value={metaKeywords}
              onChange={setMetaKeywords}
              placeholder="city, education, universities, colleges"
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-wrap items-center gap-6">
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