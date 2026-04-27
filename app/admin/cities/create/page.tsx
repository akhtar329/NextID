// app/admin/cities/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Input from "@/app/component/ui/Input";
import BulkUpload from "@/app/component/ui/BulkUpload";
import { useBulkUpload, BulkItem } from "@/app/hooks/useBulkUpload";

interface CityBulkItem extends BulkItem {
  province?: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  latitude?: string;
  longitude?: string;
  population?: number;
  area?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isPopular: boolean;
}

export default function CreateCityPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Form states for single creation
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
  const [singleLoading, setSingleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Slug generator
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  // Auto-generate slug
  useEffect(() => {
    if (!slugEdited && name) {
      setSlug(generateSlug(name));
    }
  }, [name, slugEdited]);

  // Custom parser for cities CSV
  const parseCitiesCSV = (text: string): BulkItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const firstLine = lines[0].toLowerCase();
    const hasHeaders = firstLine.includes('name') || firstLine.includes('province');
    
    let startIndex = 0;
    let headers: string[] = [];
    
    if (hasHeaders) {
      headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      startIndex = 1;
    } else {
      headers = ['name', 'province', 'slug', 'description', 'imageurl', 'thumbnailurl', 'latitude', 'longitude', 'population', 'area', 'metatitle', 'metadescription', 'metakeywords', 'ispopular', 'displayorder', 'status'];
    }
    
    const items: BulkItem[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      if (line.startsWith('<')) continue;
      
      const values = line.split(',').map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      const name = obj.name || '';
      const province = obj.province || obj.state || '';
      const slug = obj.slug || generateSlug(name);
      const description = obj.description || obj.desc || '';
      const imageUrl = obj.imageurl || obj.image_url || '';
      const thumbnailUrl = obj.thumbnailurl || obj.thumbnail_url || '';
      const latitude = obj.latitude || '';
      const longitude = obj.longitude || '';
      const population = obj.population ? parseInt(obj.population) : null;
      const area = obj.area || '';
      const metaTitle = obj.metatitle || obj.meta_title || '';
      const metaDescription = obj.metadescription || obj.meta_description || '';
      const metaKeywords = obj.metakeywords || obj.meta_keywords || '';
      const displayOrder = parseInt(obj.displayorder || obj.display_order || '0') || 0;
      const isPopular = obj.ispopular === 'true' || obj.popular === 'true' || false;
      const status = obj.status === 'false' ? false : true;
      
      if (name) {
        items.push({
          name,
          slug,
          displayOrder,
          status,
          province,
          description,
          imageUrl,
          thumbnailUrl,
          latitude,
          longitude,
          population,
          area,
          metaTitle,
          metaDescription,
          metaKeywords,
          isPopular,
        });
      }
    }
    
    return items;
  };

  // Bulk upload hook
  const bulkUpload = useBulkUpload({
    apiEndpoint: "/api/admin/cities/bulk",
    redirectPath: "/admin/cities",
    itemName: "cities",
    generateSlug,
    customParse: parseCitiesCSV
  });

  const handleSlugChange = (val: string) => {
    setSlug(val);
    setSlugEdited(true);
  };

  const handleSingleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSingleLoading(true);
    setError(null);

    if (!name || !slug) {
      setError("City name and slug are required.");
      setSingleLoading(false);
      return;
    }

    toast.loading("Creating city...", { id: "create-city" });

    try {
      const res = await fetch("/api/admin/cities/create", {
        method: "POST",
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || "Failed to create city");
      }

      if (data.success) {
        toast.success(`"${name}" created successfully!`, { 
          id: "create-city",
          duration: 3000 
        });
        router.push("/admin/cities");
      } else {
        throw new Error(data.error || "Failed to create city");
      }

    } catch (err) {
      console.error("Error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create city", { 
        id: "create-city" 
      });
      setError(err instanceof Error ? err.message : "Failed to create city");
    } finally {
      setSingleLoading(false);
    }
  };

  // Download sample CSV
  const downloadSample = () => {
    const headers = ['name', 'province', 'slug', 'description', 'imageUrl', 'thumbnailUrl', 'latitude', 'longitude', 'population', 'area', 'metaTitle', 'metaDescription', 'metaKeywords', 'isPopular', 'displayOrder', 'status'];
    const sampleData = [
      ['Karachi', 'Sindh', 'karachi', 'Pakistan\'s largest city and economic hub', 'https://example.com/karachi.jpg', 'https://example.com/karachi-thumb.jpg', '24.8607', '67.0011', '20000000', '3,527 km²', 'Karachi Education Guide', 'Complete guide to education in Karachi', 'Karachi, universities, colleges', 'true', '1', 'true'],
      ['Lahore', 'Punjab', 'lahore', 'Cultural heart of Pakistan', 'https://example.com/lahore.jpg', 'https://example.com/lahore-thumb.jpg', '31.5497', '74.3436', '13000000', '1,772 km²', 'Lahore Education Guide', 'Complete guide to education in Lahore', 'Lahore, universities, colleges', 'true', '2', 'true'],
      ['Islamabad', 'ICT', 'islamabad', 'Capital city of Pakistan', 'https://example.com/islamabad.jpg', 'https://example.com/islamabad-thumb.jpg', '33.6844', '73.0479', '2000000', '906 km²', 'Islamabad Education Guide', 'Complete guide to education in Islamabad', 'Islamabad, universities, colleges', 'true', '3', 'true'],
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'cities-sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Sample CSV downloaded");
  };

  // Sample data for preview
  const sampleData = [
    ['Karachi', 'Sindh', 'karachi', 'Pakistan\'s largest city', 'https://example.com/karachi.jpg', 'https://example.com/karachi-thumb.jpg', '24.8607', '67.0011', '20000000', '3,527 km²', 'Karachi Education Guide', 'Complete guide', 'Karachi, universities', 'true', '1', 'true'],
    ['Lahore', 'Punjab', 'lahore', 'Cultural heart', 'https://example.com/lahore.jpg', 'https://example.com/lahore-thumb.jpg', '31.5497', '74.3436', '13000000', '1,772 km²', 'Lahore Education Guide', 'Complete guide', 'Lahore, universities', 'true', '2', 'true'],
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/admin" className="hover:text-blue-600">Dashboard</Link>
          <span className="mx-2">›</span>
          <Link href="/admin/cities" className="hover:text-blue-600">Cities</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">Create New</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Create City</h1>
          <Link
            href="/admin/cities"
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
          >
            View All Cities
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("single")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "single"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Single City
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "bulk"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Single City Form */}
      {activeTab === "single" && (
        <>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form className="bg-white p-6 rounded-lg shadow-sm border space-y-4" onSubmit={handleSingleSubmit}>
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

            {/* SEO */}
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
              <PrimaryButton type="submit" disabled={singleLoading}>
                {singleLoading ? "Creating..." : "Create City"}
              </PrimaryButton>
              
              <Link
                href="/admin/cities"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </>
      )}

      {/* Bulk Upload Form */}
      {activeTab === "bulk" && (
        <div className="max-w-2xl">
          {/* Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">CSV Format</h3>
            <p className="text-sm text-blue-600 mb-2">
              Headers: name, province, slug, description, imageUrl, thumbnailUrl, latitude, longitude, population, area, metaTitle, metaDescription, metaKeywords, isPopular, displayOrder, status
            </p>
            <p className="text-sm text-blue-600">
              Example: Karachi,Sindh,karachi,Pakistan's largest city,https://example.com/karachi.jpg,https://example.com/thumb.jpg,24.8607,67.0011,20000000,3527 km²,Karachi Education Guide,Complete guide,Karachi universities,true,1,true
            </p>
            <p className="text-xs text-blue-500 mt-2">
              Note: All fields except name are optional. isPopular and status should be true/false.
            </p>
          </div>

          {/* Download Sample Button */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={downloadSample}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Sample CSV
            </button>
          </div>

          {/* BulkUpload Component */}
          <BulkUpload
            title=""
            description=""
            sampleData={sampleData}
            onDownloadSample={downloadSample}
            bulkData={bulkUpload.bulkData}
            onBulkDataChange={bulkUpload.setBulkData}
            file={bulkUpload.file}
            fileName={bulkUpload.fileName}
            onFileChange={bulkUpload.handleFileChange}
            onClearFile={bulkUpload.clearFile}
            onSubmit={bulkUpload.handleBulkSubmit}
            onClear={bulkUpload.clearAll}
            loading={bulkUpload.loading}
            itemName="cities"
            hideSampleButton={true}
          />
        </div>
      )}
    </div>
  );
}
