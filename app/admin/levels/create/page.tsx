// app/admin/levels/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import BulkUpload from "@/components/ui/BulkUpload";
import { useBulkUpload, BulkItem } from "@/hooks/useBulkUpload";

interface LevelBulkItem extends BulkItem {
  // Additional fields if needed
}

export default function CreateLevelPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Form states for single creation
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [slugEdited, setSlugEdited] = useState(false);
  const [singleLoading, setSingleLoading] = useState(false);

  // Slug generator
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  // ✅ FIXED: Auto-generate slug with useEffect
  useEffect(() => {
    if (!slugEdited && name) {
      setSlug(generateSlug(name));
    }
  }, [name, slugEdited]); // Dependencies

  // Custom parser for levels CSV
  const parseLevelsCSV = (text: string): BulkItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const firstLine = lines[0].toLowerCase();
    const hasHeaders = firstLine.includes('name') || firstLine.includes('slug') || firstLine.includes('displayorder');
    
    let startIndex = 0;
    let headers: string[] = [];
    
    if (hasHeaders) {
      headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      startIndex = 1;
    } else {
      headers = ['name', 'slug', 'displayorder', 'status'];
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
      const slug = obj.slug || generateSlug(name);
      const displayOrder = parseInt(obj.displayorder || obj.display_order || '0') || 0;
      const status = obj.status === 'false' ? false : true;
      
      if (name) {
        items.push({
          name,
          slug,
          displayOrder,
          status,
        });
      }
    }
    
    return items;
  };

  // Bulk upload hook
  const bulkUpload = useBulkUpload({
    apiEndpoint: "/api/admin/levels/bulk",
    redirectPath: "/admin/levels",
    itemName: "levels",
    generateSlug,
    customParse: parseLevelsCSV
  });

  // Single level submit
  const handleSingleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!name) {
      toast.error("Level name is required");
      return;
    }

    setSingleLoading(true);
    try {
      const res = await fetch("/api/admin/levels/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug || generateSlug(name),
          displayOrder: displayOrder || 0,
          status: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Level created successfully");
        router.push("/admin/levels");
      } else {
        toast.error(data.error || "Failed to create level");
      }
    } catch (err) {
      toast.error("Failed to create level");
    } finally {
      setSingleLoading(false);
    }
  };

  // Download sample CSV
  const downloadSample = () => {
    const headers = ['name', 'slug', 'displayOrder', 'status'];
    const sampleData = [
      ['Matric', 'matric', '1', 'true'],
      ['Intermediate', 'intermediate', '2', 'true'],
      ['Bachelor', 'bachelor', '3', 'true'],
      ['Master', 'master', '4', 'true'],
      ['PhD', 'phd', '5', 'true'],
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'levels-sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Sample CSV downloaded");
  };

  // Sample data for preview
  const sampleData = [
    ['Matric', 'matric', '1', 'true'],
    ['Intermediate', 'intermediate', '2', 'true'],
    ['Bachelor', 'bachelor', '3', 'true'],
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create Level</h1>
        <p className="text-gray-600 mt-1">Add a new academic level</p>
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
            Single Level
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

      {/* Single Level Form */}
      {activeTab === "single" && (
        <form onSubmit={handleSingleSubmit} className="max-w-xl space-y-4">
          <Input
            label="Level Name *"
            placeholder="Enter level name (e.g., Bachelor)"
            value={name}
            onChange={setName}
            required
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
            label="Display Order"
            type="number"
            placeholder="Enter display order"
            value={displayOrder.toString()}
            onChange={(val: string) => setDisplayOrder(Number(val))}
            min={0}
          />

          <div className="pt-4">
            <Button type="submit" disabled={singleLoading}>
              {singleLoading ? "Creating..." : "Create Level"}
            </Button>
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
              Headers: name, slug, displayOrder, status
            </p>
            <p className="text-sm text-blue-600">
              Example: Bachelor,bachelor,3,true
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
            itemName="levels"
            hideSampleButton={true}
          />
        </div>
      )}
    </div>
  );
}
