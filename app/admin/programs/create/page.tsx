// app/admin/programs/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/select";
import BulkUpload from "@/components/ui/BulkUpload";
import { useBulkUpload, BulkItem } from "@/app/hooks/useBulkUpload";

// Types
interface Degree {
  id: number;
  name: string;
  fullForm: string | null;
  levelId: number;
}

interface Level {
  id: number;
  name: string;
}

interface ProgramBulkItem extends BulkItem {
  degreeId: number;
  overview?: string;
  eligibility?: string;
  duration?: string;
  careerScope?: string;
  feeRange?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export default function CreateProgramPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Form states for single creation
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [degreeId, setDegreeId] = useState<number | null>(null);
  const [overview, setOverview] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [duration, setDuration] = useState("");
  const [careerScope, setCareerScope] = useState("");
  const [feeRange, setFeeRange] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [status, setStatus] = useState<boolean>(true);
  const [slugEdited, setSlugEdited] = useState(false);
  const [singleLoading, setSingleLoading] = useState(false);

  // Data states
  const [degreeOptions, setDegreeOptions] = useState<Degree[]>([]);
  const [levelMap, setLevelMap] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Slug generator
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  // Custom parser for programs CSV
  const parseProgramsCSV = (text: string): BulkItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const firstLine = lines[0].toLowerCase();
    const hasHeaders = firstLine.includes('name') || firstLine.includes('degreeid');
    
    let startIndex = 0;
    let headers: string[] = [];
    
    if (hasHeaders) {
      headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      startIndex = 1;
    } else {
      headers = ['name', 'degreeid', 'slug', 'duration', 'displayorder', 'status'];
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
      const degreeId = parseInt(obj.degreeid || '0');
      const slug = obj.slug || generateSlug(name);
      const displayOrder = parseInt(obj.displayorder || '0') || 0;
      const status = obj.status === 'false' ? false : true;
      
      if (name && degreeId) {
        items.push({
          name,
          slug,
          displayOrder,
          status,
          degreeId,
          duration: obj.duration || '',
          overview: obj.overview || '',
          eligibility: obj.eligibility || '',
          careerScope: obj.careerscope || '',
          feeRange: obj.feefange || '',
          seoTitle: obj.seotitle || '',
          seoDescription: obj.seodescription || '',
        });
      }
    }
    
    return items;
  };

  // Bulk upload hook
  const bulkUpload = useBulkUpload({
    apiEndpoint: "/api/admin/programs/bulk",
    redirectPath: "/admin/programs",
    itemName: "programs",
    generateSlug,
    customParse: parseProgramsCSV
  });

// app/admin/programs/create/page.tsx
// Fetch Degrees section - UPDATE KAREIN

// Fetch Degrees
useEffect(() => {
  const fetchDegrees = async () => {
    try {

      const res = await fetch("/api/admin/degrees");
      const data = await res.json();
      
      // Check different possible response structures
      if (data.success) {
        // Try to find degrees array in different locations
        const degreesList = data.degrees || data.data || [];
        setDegreeOptions(degreesList);
        
        if (degreesList.length === 0) {
          toast.warning("No degrees found. Please create degrees first.");
        }
      } else {
        console.error("Failed to fetch degrees:", data.error);
        toast.error("Failed to load degrees");
      }
    } catch (err) {
      console.error("Error fetching degrees:", err);
      toast.error("Error loading degrees");
    }
  };
  fetchDegrees();
}, []);

  // Auto-generate slug
  useEffect(() => {
    if (!slugEdited && name) {
      setSlug(generateSlug(name));
    }
  }, [name, slugEdited]);

  const handleSlugChange = (val: string) => {
    setSlug(val);
    setSlugEdited(true);
  };

  // Single program submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !degreeId) {
      toast.error("Program name and degree are required");
      return;
    }

    setSingleLoading(true);
    try {
      const res = await fetch("/api/admin/programs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || generateSlug(name),
          degreeId: Number(degreeId),
          overview: overview || null,
          eligibility: eligibility || null,
          duration: duration || null,
          careerScope: careerScope || null,
          feeRange: feeRange || null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          status,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Program created successfully");
        router.push("/admin/programs");
      } else {
        toast.error(data.error || "Failed to create program");
      }
    } catch (err) {
      toast.error("Failed to create program");
    } finally {
      setSingleLoading(false);
    }
  };

  // Download sample CSV
  const downloadSample = () => {
    const headers = ['name', 'degreeId', 'slug', 'duration', 'displayOrder', 'status'];
    const sampleData = [
      ['Computer Science', '1', 'computer-science', '4 Years', '1', 'true'],
      ['Business Administration', '2', 'business-admin', '4 Years', '2', 'true'],
      ['Electrical Engineering', '3', 'electrical-engineering', '4 Years', '3', 'true'],
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'programs-sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Sample CSV downloaded");
  };

  // Sample data for preview
  const sampleData = [
    ['Computer Science', '1', 'computer-science', '4 Years', '1', 'true'],
    ['Business Administration', '2', 'business-admin', '4 Years', '2', 'true'],
    ['Electrical Engineering', '3', 'electrical-engineering', '4 Years', '3', 'true'],
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create Program</h1>
        <p className="text-gray-600 mt-1">Add a new program</p>
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
            Single Program
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

      {/* Single Program Form */}
      {activeTab === "single" && (
        <form onSubmit={handleSingleSubmit} className="max-w-lg space-y-4">
          <Input
            label="Program Name *"
            placeholder="Enter program name (e.g., Computer Science)"
            value={name}
            onChange={setName}
            required
          />

          <Input
            label="Slug"
            placeholder="url-friendly-name (auto-generated)"
            value={slug}
            onChange={handleSlugChange}
          />

          <Select
            label="Degree *"
            value={degreeId ?? 0}
            onChange={(val: number) => setDegreeId(val)}
            options={[
              { value: 0, label: "Select Degree" },
              ...degreeOptions.map(d => ({
                value: d.id,
                label: d.fullForm ? `${d.name} (${d.fullForm})` : d.name,
              }))
            ]}
            required
          />

          <Input
            label="Duration"
            placeholder="e.g., 4 Years"
            value={duration}
            onChange={setDuration}
          />

          <Input
            label="Fee Range"
            placeholder="e.g., PKR 50,000 - 100,000"
            value={feeRange}
            onChange={setFeeRange}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overview
            </label>
            <textarea
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="Program overview..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Eligibility
            </label>
            <textarea
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              placeholder="Eligibility criteria..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Career Scope
            </label>
            <textarea
              value={careerScope}
              onChange={(e) => setCareerScope(e.target.value)}
              placeholder="Career opportunities..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Input
            label="SEO Title"
            placeholder="Meta title"
            value={seoTitle}
            onChange={setSeoTitle}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SEO Description
            </label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Meta description..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="status"
              checked={status}
              onChange={(e) => setStatus(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="status" className="text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={singleLoading}>
              {singleLoading ? "Creating..." : "Create Program"}
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
              Headers: name, degreeId, slug, duration, displayOrder, status
            </p>
            <p className="text-sm text-blue-600">
              Example: Computer Science,1,computer-science,4 Years,1,true
            </p>
          </div>

          {/* BulkUpload Component with hideSampleButton */}
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
            itemName="programs"
          />
        </div>
      )}
    </div>
  );
}
