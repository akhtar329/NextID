// app/admin/institutes/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/select";
import BulkUpload from "@/components/ui/BulkUpload";
import { useBulkUpload, BulkItem } from "@/app/hooks/useBulkUpload";

interface City {
  id: number;
  name: string;
}

interface InstituteBulkItem extends BulkItem {
  type: "Govt" | "Private";
  cityId: number;
  description?: string;
  website?: string;
}

export default function CreateInstitutePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  
  // Form states for single creation
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<"Govt" | "Private">("Govt");
  const [cityId, setCityId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState(true);
  const [slugEdited, setSlugEdited] = useState(false);
  const [singleLoading, setSingleLoading] = useState(false);
  
  // Data states
  const [cities, setCities] = useState<City[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Slug generator
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  // Fetch cities
  useEffect(() => {
    async function fetchCities() {
      try {
        const res = await fetch("/api/admin/cities");
        const data = await res.json();
        setCities(data.cities || []);
      } catch (err) {
        console.error("Error fetching cities:", err);
      } finally {
        setFetchLoading(false);
      }
    }
    fetchCities();
  }, []);

  // Auto-generate slug
  useEffect(() => {
    if (!slugEdited && name) {
      setSlug(generateSlug(name));
    }
  }, [name, slugEdited]);

  // Custom parser for institutes CSV
  const parseInstitutesCSV = (text: string): BulkItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const firstLine = lines[0].toLowerCase();
    const hasHeaders = firstLine.includes('name') || firstLine.includes('type') || firstLine.includes('cityid');
    
    let startIndex = 0;
    let headers: string[] = [];
    
    if (hasHeaders) {
      headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      startIndex = 1;
    } else {
      headers = ['name', 'type', 'cityid', 'slug', 'website', 'status'];
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
      const type = obj.type === 'Private' ? 'Private' : 'Govt';
      const cityId = parseInt(obj.cityid || obj.city_id || '0');
      const slug = obj.slug || generateSlug(name);
      const website = obj.website || '';
      const displayOrder = parseInt(obj.displayorder || '0') || 0;
      const status = obj.status === 'false' ? false : true;
      
      if (name && type && cityId) {
        items.push({
          name,
          slug,
          displayOrder,
          status,
          type,
          cityId,
          website,
          description: obj.description || '',
        });
      }
    }
    
    return items;
  };

  // Bulk upload hook
  const bulkUpload = useBulkUpload({
    apiEndpoint: "/api/admin/institutes/bulk",
    redirectPath: "/admin/institutes",
    itemName: "institutes",
    generateSlug,
    customParse: parseInstitutesCSV
  });

  const handleSlugChange = (val: string) => {
    setSlug(val);
    setSlugEdited(true);
  };

  const handleSingleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSingleLoading(true);
    setError(null);

    if (!name || !slug || !type || !cityId) {
      setError("Name, slug, type, and city are required.");
      setSingleLoading(false);
      return;
    }

    toast.loading("Creating institute...", { id: "create-institute" });

    try {
      const res = await fetch("/api/admin/institutes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          type,
          cityId: Number(cityId),
          description: description.trim() || null,
          website: website.trim() || null,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || "Failed to create institute");
      }

      if (data.success) {
        toast.success(`"${name}" created successfully!`, { 
          id: "create-institute",
          duration: 3000 
        });
        router.push("/admin/institutes");
      } else {
        throw new Error(data.error || "Failed to create institute");
      }

    } catch (err) {
      console.error("Error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create institute", { 
        id: "create-institute" 
      });
      setError(err instanceof Error ? err.message : "Failed to create institute");
    } finally {
      setSingleLoading(false);
    }
  };

  // Download sample CSV
  const downloadSample = () => {
    const headers = ['name', 'type', 'cityId', 'slug', 'website', 'status'];
    const sampleData = [
      ['University of Karachi', 'Govt', '1', 'uok', 'www.uok.edu.pk', 'true'],
      ['Lahore University', 'Govt', '2', 'lu', 'www.lu.edu.pk', 'true'],
      ['Private College', 'Private', '3', 'private-college', 'www.private.edu', 'true'],
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'institutes-sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Sample CSV downloaded");
  };

  // Sample data for preview
  const sampleData = [
    ['University of Karachi', 'Govt', '1', 'uok', 'www.uok.edu.pk', 'true'],
    ['Lahore University', 'Govt', '2', 'lu', 'www.lu.edu.pk', 'true'],
    ['Private College', 'Private', '3', 'private-college', 'www.private.edu', 'true'],
  ];

  if (fetchLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
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
          <Link href="/admin/institutes" className="hover:text-blue-600">Institutes</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">Create New</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Create Institute</h1>
          <Link
            href="/admin/institutes"
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
          >
            View All Institutes
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
            Single Institute
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

      {/* Single Institute Form */}
      {activeTab === "single" && (
        <>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form className="bg-white p-6 rounded-lg shadow-sm border space-y-4" onSubmit={handleSingleSubmit}>
            <Input
              label="Institute Name *"
              value={name}
              onChange={setName}
              placeholder="e.g. University of Karachi"
              required
            />

            <Input
              label="Slug *"
              value={slug}
              onChange={handleSlugChange}
              placeholder="e.g. university-of-karachi"
              required
            />

            <Select
              label="Type *"
              value={type}
              onChange={(val: "Govt" | "Private") => setType(val)}
              options={[
                { value: "Govt", label: "Government" },
                { value: "Private", label: "Private" },
              ]}
              required
            />

            <Select
              label="City *"
              value={cityId ?? 0}
              onChange={(val: number) => setCityId(val)}
              options={[
                { value: 0, label: "Select City" },
                ...cities.map(c => ({
                  value: c.id,
                  label: c.name,
                }))
              ]}
              required
            />

            <Input
              label="Website"
              value={website}
              onChange={setWebsite}
              placeholder="e.g. https://uok.edu.pk"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Institute description..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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

            <div className="pt-4 flex items-center gap-3">
              <PrimaryButton type="submit" disabled={singleLoading}>
                {singleLoading ? "Creating..." : "Create Institute"}
              </PrimaryButton>
              
              <Link
                href="/admin/institutes"
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
              Headers: name, type, cityId, slug, website, status
            </p>
            <p className="text-sm text-blue-600">
              Example: University of Karachi,Govt,1,uok,www.uok.edu.pk,true
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
            itemName="institutes"
            hideSampleButton={true}
          />
        </div>
      )}
    </div>
  );
}
