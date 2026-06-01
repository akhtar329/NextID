// app/admin/degrees/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/select";
import BulkUpload from "@/components/ui/BulkUpload";
import { useBulkUpload, BulkItem } from "@/hooks/useBulkUpload";

interface Level {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface DegreeBulkItem extends BulkItem {
  fullForm?: string;
  levelId: number;
  categoryId: number;
}

export default function CreateDegreePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Form states for single creation
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [fullForm, setFullForm] = useState("");
  const [levelId, setLevelId] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [slugEdited, setSlugEdited] = useState(false);
  const [singleLoading, setSingleLoading] = useState(false);

  // Data states
  const [levels, setLevels] = useState<Level[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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

  // 🔍 DEBUG VERSION - Custom parser for degrees CSV
  const parseDegreesCSV = (text: string): BulkItem[] => {
    
    // Split into lines and remove empty lines
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      return [];
    }
    
    // Check if first line has headers
    const firstLine = lines[0].toLowerCase();
    const hasHeaders = firstLine.includes('name') || firstLine.includes('levelid') || firstLine.includes('categoryid');
    
    let startIndex = 0;
    let headers: string[] = [];
    
    if (hasHeaders) {
      headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      startIndex = 1;
    } else {
      headers = ['name', 'levelid', 'categoryid', 'fullform', 'displayorder', 'status'];

    }
    
    const items: BulkItem[] = [];
    
    // Process each data line
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        continue;
      }
      
      // Skip HTML content
      if (line.startsWith('<')) {
        continue;
      }
      
      // Split by comma
      const values = line.split(',').map(v => v.trim());
      
      // Create object with headers
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      // Extract fields
      const name = obj.name || '';
      const levelId = parseInt(obj.levelid || obj.level_id || '0');
      const categoryId = parseInt(obj.categoryid || obj.category_id || '0');
      const displayOrder = parseInt(obj.displayorder || obj.display_order || '0') || 0;
      const status = obj.status === 'false' ? false : true;
      const fullForm = obj.fullform || obj.full_form || obj.fullForm || '';
      
      // Validate required fields
      if (!name) {
        continue;
      }
      
      if (!levelId || levelId === 0) {
        continue;
      }
      
      if (!categoryId || categoryId === 0) {
        continue;
      }
      
      // All validations passed
      items.push({
        name,
        slug: generateSlug(name),
        displayOrder,
        status,
        levelId,
        categoryId,
        fullForm,
      });
      
    }
    

    
    return items;
  };

  // Bulk upload hook
  const bulkUpload = useBulkUpload({
    apiEndpoint: "/api/admin/degrees/bulk",
    redirectPath: "/admin/degrees",
    itemName: "degrees",
    generateSlug,
    customParse: parseDegreesCSV
  });

  // Fetch Levels and Categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [levelsRes, categoriesRes] = await Promise.all([
          fetch("/api/admin/levels"),
          fetch("/api/admin/categories")
        ]);
        
        const levelsData = await levelsRes.json();
        const categoriesData = await categoriesRes.json();
        
        if (levelsData.success) {
          setLevels(levelsData.levels || []);
        } else {
          toast.error(levelsData.error || "Failed to load levels");
        }
        
        if (categoriesData.success) {
          setCategories(categoriesData.categories || []);
        } else {
          toast.error(categoriesData.error || "Failed to load categories");
        }
      } catch (err) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Single degree submit
  const handleCreate = async () => {
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

    setSingleLoading(true);
    try {
      const res = await fetch("/api/admin/degrees/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug || generateSlug(name),
          fullForm: fullForm || null,
          levelId: levelId,
          categoryId: categoryId,
          displayOrder: displayOrder || 0,
          status: true
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Degree created successfully");
        router.push("/admin/degrees");
      } else {
        toast.error(data.error || "Failed to create degree");
      }
    } catch (err) {
      toast.error("Failed to create degree");
    } finally {
      setSingleLoading(false);
    }
  };

  // Download sample CSV
  const downloadSample = () => {
    const headers = ['name', 'levelId', 'categoryId', 'fullForm', 'displayOrder', 'status'];
    const sampleData = [
      ['BS', '1', '1', 'Bachelor of Science', '1', 'true'],
      ['BA', '1', '4', 'Bachelor of Arts', '2', 'true'],
      ['BBA', '1', '3', 'Bachelor of Business Administration', '3', 'true'],
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'degrees-sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Sample CSV downloaded");
  };

  // Sample data for preview
  const sampleData = [
    ['BS', '1', '1', 'Bachelor of Science', '1', 'true'],
    ['BA', '1', '4', 'Bachelor of Arts', '2', 'true'],
    ['BBA', '1', '3', 'Bachelor of Business Administration', '3', 'true'],
  ];

  if (loading) {
    return <div className="p-6">Loading degrees data...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create Degree</h1>
        <p className="text-gray-600 mt-1">Add a new degree</p>
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
            Single Degree
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

      {/* Single Degree Form */}
      {activeTab === "single" && (
        <div className="max-w-xl space-y-4">
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
            placeholder="Enter display order"
            value={displayOrder.toString()}
            onChange={(val: string) => setDisplayOrder(Number(val))}
          />

          <div className="pt-4">
            <Button onClick={handleCreate} disabled={singleLoading}>
              {singleLoading ? "Creating..." : "Create Degree"}
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Upload Form */}
      {activeTab === "bulk" && (
        <div className="max-w-2xl">
          {/* Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">CSV Format</h3>
            <p className="text-sm text-blue-600 mb-2">
              Headers: name, levelId, categoryId, fullForm, displayOrder, status
            </p>
            <p className="text-sm text-blue-600">
              Example: BS,1,1,Bachelor of Science,1,true
            </p>
            <p className="text-xs text-blue-500 mt-2">
              Note: levelId and categoryId must be valid IDs from levels and categories tables
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
            itemName="degrees"
            hideSampleButton={true}
          />
        </div>
      )}
    </div>
  );
}
