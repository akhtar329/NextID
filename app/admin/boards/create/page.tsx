// app/admin/boards/create/page.tsx
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Input from "@/app/component/ui/Input";
import Select from "@/app/component/ui/select";
import BulkUpload from "@/app/component/ui/BulkUpload";
import { useBulkUpload, BulkItem } from "@/app/hooks/useBulkUpload";

type CityOption = { value: number; label: string };

interface BoardBulkItem extends BulkItem {
  cityId: number;
  website?: string;
  description?: string;
}

export default function CreateBoardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Form states for single creation
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [cityId, setCityId] = useState<number | null>(null);
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [type] = useState("Board");
  const [slugEdited, setSlugEdited] = useState(false);
  const [singleLoading, setSingleLoading] = useState(false);

  // Data states
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch Cities
  useEffect(() => {
    async function fetchCities() {
      try {
        const res = await fetch("/api/admin/cities");
        const data = await res.json();

        if (data.success) {
          setCities(
            data.cities.map((c: any) => ({
              value: c.id,
              label: c.name,
            }))
          );
        } else {
          toast.error(data.error || "Failed to load cities");
        }
      } catch {
        toast.error("Failed to load cities");
      } finally {
        setLoading(false);
      }
    }

    fetchCities();
  }, []);

  // Custom parser for boards CSV
  const parseBoardsCSV = (text: string): BulkItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const firstLine = lines[0].toLowerCase();
    const hasHeaders = firstLine.includes('name') || firstLine.includes('cityid') || firstLine.includes('slug');
    
    let startIndex = 0;
    let headers: string[] = [];
    
    if (hasHeaders) {
      headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      startIndex = 1;
    } else {
      headers = ['name', 'cityid', 'slug', 'website', 'description', 'status'];
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
      const cityId = parseInt(obj.cityid || obj.city_id || '0');
      const slug = obj.slug || generateSlug(name);
      const website = obj.website || obj.web || '';
      const description = obj.description || obj.desc || '';
      const displayOrder = parseInt(obj.displayorder || '0') || 0;
      const status = obj.status === 'false' ? false : true;
      
      if (name && cityId) {
        items.push({
          name,
          slug,
          displayOrder,
          status,
          cityId,
          website,
          description,
        });
      }
    }
    
    return items;
  };

  // Bulk upload hook
  const bulkUpload = useBulkUpload({
    apiEndpoint: "/api/admin/boards/bulk",
    redirectPath: "/admin/boards",
    itemName: "boards",
    generateSlug,
    customParse: parseBoardsCSV
  });

  const handleSlugChange = (val: string) => {
    setSlug(val);
    setSlugEdited(true);
  };

  // Single board submit
  const handleSingleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !cityId) {
      toast.error("Please enter a name and select a city.");
      return;
    }

    setSingleLoading(true);
    const toastId = "create-board";
    toast.loading("Creating board...", { id: toastId });

    try {
      const res = await fetch("/api/admin/boards/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          cityId,
          type: "Board",
          slug: slug || generateSlug(name),
          website: website || null,
          description: description || null,
          status: true,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Board created successfully", { id: toastId });
        router.push("/admin/boards");
      } else {
        throw new Error(data.error || "Failed to create board");
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create board",
        { id: toastId }
      );
    } finally {
      setSingleLoading(false);
    }
  };

  // Download sample CSV
  const downloadSample = () => {
    const headers = ['name', 'cityId', 'slug', 'website', 'description', 'status'];
    const sampleData = [
      ['BISE Lahore', '1', 'bise-lahore', 'www.biselahore.edu.pk', 'Board of Intermediate and Secondary Education Lahore', 'true'],
      ['FBISE', '2', 'fbise', 'www.fbise.edu.pk', 'Federal Board of Intermediate and Secondary Education', 'true'],
      ['Aga Khan Board', '3', 'aga-khan', 'www.agakhan.edu', 'Aga Khan University Examination Board', 'true'],
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'boards-sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Sample CSV downloaded");
  };

  // Sample data for preview
  const sampleData = [
    ['BISE Lahore', '1', 'bise-lahore', 'www.biselahore.edu.pk', 'Board of Intermediate and Secondary Education Lahore', 'true'],
    ['FBISE', '2', 'fbise', 'www.fbise.edu.pk', 'Federal Board of Intermediate and Secondary Education', 'true'],
    ['Aga Khan Board', '3', 'aga-khan', 'www.agakhan.edu', 'Aga Khan University Examination Board', 'true'],
  ];

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Create Board</h1>
          <p className="text-gray-600 mt-1">Add a new educational board</p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          ← Back
        </button>
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
            Single Board
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

      {/* Single Board Form */}
      {activeTab === "single" && (
        <form
          className="space-y-4 bg-white p-6 rounded-lg shadow-sm border"
          onSubmit={handleSingleSubmit}
        >
          <Input
            label="Board Name *"
            value={name}
            onChange={setName}
            placeholder="e.g., BISE Lahore"
            required
          />

          <Input
            label="Slug"
            value={slug}
            onChange={handleSlugChange}
            placeholder="url-friendly-name (auto-generated)"
          />

          <Select
            label="City *"
            value={cityId ?? 0}
            onChange={(val: number) => setCityId(val === 0 ? null : val)}
            options={[{ value: 0, label: "Select City" }, ...cities]}
            required
          />

          <Input
            label="Website"
            value={website}
            onChange={setWebsite}
            placeholder="e.g., www.biselahore.edu.pk"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Board description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <PrimaryButton type="submit" disabled={singleLoading}>
              {singleLoading ? "Creating..." : "Create Board"}
            </PrimaryButton>

            <button
              type="button"
              onClick={() => router.push("/admin/boards")}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Bulk Upload Form */}
      {activeTab === "bulk" && (
        <div className="max-w-2xl">
          {/* Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">CSV Format</h3>
            <p className="text-sm text-blue-600 mb-2">
              Headers: name, cityId, slug, website, description, status
            </p>
            <p className="text-sm text-blue-600">
              Example: BISE Lahore,1,bise-lahore,www.biselahore.edu.pk,Board of Intermediate and Secondary Education Lahore,true
            </p>
            <p className="text-xs text-blue-500 mt-2">
              Note: cityId must be a valid ID from cities table
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
            itemName="boards"
            hideSampleButton={true}
          />
        </div>
      )}
    </div>
  );
}