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
  establishedYear?: number | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  robots?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
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
  const [establishedYear, setEstablishedYear] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  
  // ✅ SEO fields (will be saved to seo_metadata table)
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [robots, setRobots] = useState("index, follow");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  
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

  // Auto-generate meta title from name
  useEffect(() => {
    if (!metaTitle && name) {
      setMetaTitle(`${name} - Results, Date Sheets & Announcements | NextID.pk`);
    }
  }, [name, metaTitle]);

  // Auto-generate canonical URL
  useEffect(() => {
    if (!canonicalUrl && slug) {
      setCanonicalUrl(`https://www.nextid.pk/boards/${slug}`);
    }
  }, [slug, canonicalUrl]);

  // Auto-generate OG title from meta title
  useEffect(() => {
    if (!ogTitle && metaTitle) {
      setOgTitle(metaTitle);
    }
  }, [metaTitle, ogTitle]);

  // Auto-generate OG description from meta description
  useEffect(() => {
    if (!ogDescription && metaDescription) {
      setOgDescription(metaDescription);
    }
  }, [metaDescription, ogDescription]);

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
      headers = ['name', 'cityid', 'slug', 'website', 'description', 'establishedyear', 'contactemail', 'contactphone', 'address', 'metatitle', 'metadescription', 'canonicalurl', 'robots', 'ogtitle', 'ogdescription', 'ogimage', 'status'];
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
      const establishedYear = obj.establishedyear || obj.established_year ? parseInt(obj.establishedyear || obj.established_year) : null;
      const contactEmail = obj.contactemail || obj.contact_email || '';
      const contactPhone = obj.contactphone || obj.contact_phone || '';
      const address = obj.address || '';
      const metaTitle = obj.metatitle || obj.meta_title || '';
      const metaDescription = obj.metadescription || obj.meta_description || '';
      const canonicalUrl = obj.canonicalurl || obj.canonical_url || '';
      const robots = obj.robots || 'index, follow';
      const ogTitle = obj.ogtitle || obj.og_title || '';
      const ogDescription = obj.ogdescription || obj.og_description || '';
      const ogImage = obj.ogimage || obj.og_image || '';
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
          establishedYear,
          contactEmail,
          contactPhone,
          address,
          metaTitle,
          metaDescription,
          canonicalUrl,
          robots,
          ogTitle,
          ogDescription,
          ogImage,
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
          slug: slug || generateSlug(name),
          website: website || null,
          description: description || null,
          establishedYear: establishedYear ? parseInt(establishedYear) : null,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          address: address || null,
          // SEO fields (will be saved to seo_metadata table)
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          canonicalUrl: canonicalUrl || null,
          robots: robots || 'index, follow',
          ogTitle: ogTitle || metaTitle || null,
          ogDescription: ogDescription || metaDescription || null,
          ogImage: ogImage || null,
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
    const headers = ['name', 'cityId', 'slug', 'website', 'description', 'establishedYear', 'contactEmail', 'contactPhone', 'address', 'metaTitle', 'metaDescription', 'canonicalUrl', 'robots', 'ogTitle', 'ogDescription', 'ogImage', 'status'];
    const sampleData = [
      ['BISE Lahore', '1', 'bise-lahore', 'www.biselahore.edu.pk', 'Board of Intermediate and Secondary Education Lahore', '1954', 'info@biselahore.edu.pk', '042-99231234', 'Mall Road, Lahore', 'BISE Lahore - Results, Date Sheets & News', 'Complete guide to BISE Lahore results, date sheets and announcements', 'https://www.nextid.pk/boards/bise-lahore', 'index, follow', 'BISE Lahore Results 2026', 'Check BISE Lahore results online', 'https://www.nextid.pk/images/bise-lahore-og.jpg', 'true'],
      ['FBISE', '2', 'fbise', 'www.fbise.edu.pk', 'Federal Board of Intermediate and Secondary Education', '1975', 'info@fbise.edu.pk', '051-111-123456', 'Sector H-8, Islamabad', 'FBISE - Federal Board Results & Announcements', 'Check FBISE results, date sheets and latest announcements', 'https://www.nextid.pk/boards/fbise', 'index, follow', 'FBISE Results 2026', 'Check FBISE results online', 'https://www.nextid.pk/images/fbise-og.jpg', 'true'],
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
    ['BISE Lahore', '1', 'bise-lahore', 'www.biselahore.edu.pk', 'Board of Intermediate and Secondary Education Lahore', '1954', 'info@biselahore.edu.pk', '042-99231234', 'Mall Road, Lahore', 'BISE Lahore - Results', 'Complete guide', 'https://www.nextid.pk/boards/bise-lahore', 'index, follow', 'BISE Lahore Results', 'Check results', '', 'true'],
    ['FBISE', '2', 'fbise', 'www.fbise.edu.pk', 'Federal Board', '1975', 'info@fbise.edu.pk', '051-111-123456', 'Islamabad', 'FBISE - Results', 'Check FBISE results', 'https://www.nextid.pk/boards/fbise', 'index, follow', 'FBISE Results', 'Check results', '', 'true'],
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
          {/* Basic Information */}
          <div className="border-b pb-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            <div className="mt-3">
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
          </div>

          {/* Contact Information */}
          <div className="border-b pb-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Established Year"
                type="number"
                value={establishedYear}
                onChange={setEstablishedYear}
                placeholder="e.g., 1954"
              />
              <Input
                label="Contact Email"
                type="email"
                value={contactEmail}
                onChange={setContactEmail}
                placeholder="e.g., info@board.edu.pk"
              />
              <Input
                label="Contact Phone"
                value={contactPhone}
                onChange={setContactPhone}
                placeholder="e.g., +92-42-12345678"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Complete address of the board office..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                label="Canonical URL"
                value={canonicalUrl}
                onChange={setCanonicalUrl}
                placeholder="https://www.nextid.pk/boards/board-slug"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Robots"
                  value={robots}
                  onChange={setRobots}
                  placeholder="index, follow"
                />
              </div>
              <Input
                label="OG Title (Facebook/Twitter)"
                value={ogTitle}
                onChange={setOgTitle}
                placeholder="Title for social media sharing"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OG Description
                </label>
                <textarea
                  value={ogDescription}
                  onChange={(e) => setOgDescription(e.target.value)}
                  placeholder="Description for social media sharing"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Input
                label="OG Image URL"
                value={ogImage}
                onChange={setOgImage}
                placeholder="https://www.nextid.pk/images/board-og.jpg"
              />
            </div>
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
              Headers: name, cityId, slug, website, description, establishedYear, contactEmail, contactPhone, address, metaTitle, metaDescription, canonicalUrl, robots, ogTitle, ogDescription, ogImage, status
            </p>
            <p className="text-sm text-blue-600">
              Example: BISE Lahore,1,bise-lahore,www.biselahore.edu.pk,Board description,1954,info@biselahore.edu.pk,042-99231234,Mall Road Lahore,BISE Lahore - Results,Complete guide,https://www.nextid.pk/boards/bise-lahore,index follow,BISE Lahore Results,Check results,https://example.com/og.jpg,true
            </p>
            <p className="text-xs text-blue-500 mt-2">
              Note: cityId must be a valid ID from cities table. All fields except name and cityId are optional.
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