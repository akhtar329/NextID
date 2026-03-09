// app/admin/categories/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Input from "@/app/component/ui/Input";
import Button from "@/app/component/ui/Button";
import BulkUpload from "@/app/component/ui/BulkUpload";
import { useBulkUpload } from "@/app/hooks/useBulkUpload";

export default function CreateCategoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  
  // Single category states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [singleLoading, setSingleLoading] = useState(false); // Separate loading for single

  // Slug generator
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Bulk upload hook
  const bulkUpload = useBulkUpload({
    apiEndpoint: "/api/admin/categories/bulk",
    redirectPath: "/admin/categories",
    itemName: "categories",
    generateSlug
  });

  // Sample data for preview
  const sampleData = [
    ['Engineering', '1', 'engineering', 'true'],
    ['Medical Sciences', '2', 'medical', 'true'],
    ['Business Administration', '3', 'business', 'true'],
    ['Computer Science', '4', 'computer-science', 'true'],
    ['Arts & Humanities', '5', 'arts', 'true']
  ];

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  // Single category submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast.error("Category name is required");
      return;
    }

    setSingleLoading(true); // Use separate loading
    try {
      const res = await fetch("/api/admin/categories/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          displayOrder,
          status: true
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Category created successfully");
        router.push("/admin/categories");
      } else {
        toast.error(data.error || "Failed to create category");
      }
    } catch (err) {
      toast.error("Failed to create category");
    } finally {
      setSingleLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create Categories</h1>
        <p className="text-gray-600 mt-1">Add categories individually or in bulk</p>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("single")}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeTab === "single"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Single Category
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeTab === "bulk"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Single Category Form */}
      {activeTab === "single" && (
        <form onSubmit={handleSingleSubmit} className="max-w-lg space-y-4">
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

          <div className="pt-4">
            <Button type="submit" disabled={singleLoading}>
              {singleLoading ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </form>
      )}

      {/* Bulk Upload Form */}
      {activeTab === "bulk" && (
        <BulkUpload
          title="Bulk Upload Categories"
          description="Upload multiple categories at once using CSV file"
          sampleData={sampleData}
          onDownloadSample={() => bulkUpload.downloadSample(sampleData)}
          bulkData={bulkUpload.bulkData}
          onBulkDataChange={bulkUpload.setBulkData}
          file={bulkUpload.file}
          fileName={bulkUpload.fileName}
          onFileChange={bulkUpload.handleFileChange}
          onClearFile={bulkUpload.clearFile}
          onSubmit={bulkUpload.handleBulkSubmit}
          onClear={bulkUpload.clearAll}
          loading={bulkUpload.loading}  // Use bulkUpload.loading directly
          itemName="categories"
        />
      )}
    </div>
  );
}