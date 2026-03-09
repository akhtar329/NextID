// app/admin/institutes/[id]/edit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Input from "@/app/component/ui/Input";
import Select from "@/app/component/ui/select";

type Institute = {
  id: number;
  name: string;
  slug: string;
  type: "Govt" | "Private";
  cityId: number;
  cityName: string;
  description: string | null;
  website: string | null;
  status: boolean;
};

export default function EditInstitutePage() {
  const router = useRouter();
  const params = useParams();
  const instituteId = params.id as string;

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<"Govt" | "Private">("Govt");
  const [cityId, setCityId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState(true);
  const [slugEdited, setSlugEdited] = useState(false);
  
  // Data states
  const [cities, setCities] = useState<{ id: number; name: string; }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instituteName, setInstituteName] = useState("");

  // Fetch cities for dropdown
  useEffect(() => {
    async function fetchCities() {
      try {
        const res = await fetch("/api/admin/cities");
        if (!res.ok) throw new Error("Failed to fetch cities");
        const data = await res.json();
        setCities(data.cities || []);
      } catch (err) {
        console.error("Error fetching cities:", err);
        toast.error("Failed to load cities");
      }
    }
    fetchCities();
  }, []);

  // Fetch institute data
  useEffect(() => {
    async function fetchInstitute() {
      if (!instituteId) return;
      
      setFetchLoading(true);
      setError(null);
      
      try {
        console.log("📤 Fetching institute ID:", instituteId);
        
        const res = await fetch(`/api/admin/institutes/${instituteId}`);
        console.log("📥 Response status:", res.status);
        
        // Check if response is OK
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Institute not found");
          }
          throw new Error(`HTTP error ${res.status}`);
        }
        
        // Get response text
        const text = await res.text();
        console.log("📥 Raw response length:", text.length);
        
        if (!text) {
          throw new Error("Empty response from server");
        }
        
        // Parse JSON
        let data;
        try {
          data = JSON.parse(text);
          console.log("📥 Parsed data:", data);
        } catch (parseError) {
          console.error("❌ Parse error:", parseError);
          throw new Error("Invalid response from server");
        }
        
        if (!data.success) {
          throw new Error(data.error || "Failed to load institute");
        }
        
        if (data.institute) {
          const institute = data.institute;
          console.log("✅ Institute loaded:", institute);
          
          // Set form values
          setName(institute.name || "");
          setSlug(institute.slug || "");
          setType(institute.type || "Govt");
          setCityId(institute.cityId || null);
          setDescription(institute.description || "");
          setWebsite(institute.website || "");
          setStatus(institute.status === undefined ? true : institute.status);
          setInstituteName(institute.name || "");
        } else {
          throw new Error("Institute data not found in response");
        }
        
      } catch (err) {
        console.error("❌ Error fetching institute:", err);
        setError(err instanceof Error ? err.message : "Failed to load institute");
        toast.error(err instanceof Error ? err.message : "Failed to load institute");
      } finally {
        setFetchLoading(false);
      }
    }
    
    if (instituteId) {
      fetchInstitute();
    }
  }, [instituteId]);

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

    // Validation
    if (!name || !slug || !type || !cityId) {
      setError("Name, slug, type, and city are required.");
      setLoading(false);
      return;
    }

    const toastId = `update-${instituteId}`;
    toast.loading(`Updating "${name}"...`, { id: toastId });

    try {
      console.log("📤 Submitting update for ID:", instituteId);
      
      const res = await fetch(`/api/admin/institutes/${instituteId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
        },
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

      console.log("📥 Update response status:", res.status);

      // Get response text
      const text = await res.text();
      console.log("📥 Raw update response:", text);

      if (!text) {
        throw new Error("Empty response from server");
      }

      // Parse JSON
      let data;
      try {
        data = JSON.parse(text);
        console.log("📥 Parsed update response:", data);
      } catch (parseError) {
        console.error("❌ Parse error:", parseError);
        throw new Error("Invalid response from server");
      }

      if (!res.ok) {
        throw new Error(data.error || data.details || `HTTP error ${res.status}`);
      }

      if (data.success) {
        toast.success(`"${name}" updated successfully!`, { 
          id: toastId,
          duration: 3000 
        });
        router.push("/admin/institutes");
      } else {
        throw new Error(data.error || "Failed to update institute");
      }

    } catch (err) {
      console.error("❌ Error updating institute:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update institute", { 
        id: toastId 
      });
      setError(err instanceof Error ? err.message : "Failed to update institute");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (fetchLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-500">Loading institute data...</div>
        </div>
      </div>
    );
  }

  // Error state (if institute not found)
  if (error && !name) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded text-center">
          <div className="text-4xl mb-4">🏛️</div>
          <p className="mb-4">{error}</p>
          <Link 
            href="/admin/institutes" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ← Back to Institutes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/admin" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <span className="mx-2">›</span>
          <Link href="/admin/institutes" className="hover:text-blue-600 transition-colors">
            Institutes
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700 font-medium">Edit: {instituteName}</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Edit Institute</h1>
          <Link
            href="/admin/institutes"
            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            View All Institutes
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Edit Form */}
      <form className="bg-white p-6 rounded-lg shadow-sm border space-y-4" onSubmit={handleSubmit}>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="e.g. https://uok.edu.pk"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

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
            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
          />
          <label htmlFor="status" className="text-sm font-medium text-gray-700">
            Active
          </label>
        </div>

        <div className="pt-4 flex items-center gap-3">
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Updating...
              </span>
            ) : (
              "Update Institute"
            )}
          </PrimaryButton>
          
          <Link
            href="/admin/institutes"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}