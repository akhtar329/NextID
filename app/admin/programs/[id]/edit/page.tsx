// app/admin/programs/[id]/edit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Input from "@/app/component/ui/Input";
import Select from "@/app/component/ui/select";

type Status = boolean;

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

interface Program {
  id: number;
  name: string;
  slug: string;
  degreeId: number;
  degreeName: string;
  levelName: string;
  overview: string | null;
  eligibility: string | null;
  duration: string | null;
  careerScope: string | null;
  feeRange: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: boolean;
}

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
  const programId = params.id as string;

  // Form states
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

  // Data states
  const [degreeOptions, setDegreeOptions] = useState<Degree[]>([]);
  const [levelMap, setLevelMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programName, setProgramName] = useState("");

  // Fetch Degrees and Levels
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch degrees
        const degreesRes = await fetch("/api/admin/degrees");
        if (!degreesRes.ok) throw new Error("Failed to fetch degrees");
        const degreesData = await degreesRes.json();
        const degrees = degreesData.degrees || degreesData.data || [];
        setDegreeOptions(degrees);

        // Fetch levels
        const levelsRes = await fetch("/api/admin/levels");
        if (!levelsRes.ok) throw new Error("Failed to fetch levels");
        const levelsData = await levelsRes.json();
        const levels = levelsData.levels || levelsData.data || [];
        
        const levelMapObj: Record<number, string> = {};
        levels.forEach((level: Level) => {
          levelMapObj[level.id] = level.name;
        });
        setLevelMap(levelMapObj);
        
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load form data");
      }
    }
    fetchData();
  }, []);

  // Fetch program data
  useEffect(() => {
    async function fetchProgram() {
      if (!programId) return;
      
      setFetchLoading(true);
      
      try {
        const res = await fetch(`/api/admin/programs/${programId}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Program not found");
          }
          throw new Error("Failed to fetch program");
        }
        
        const data = await res.json();
        
        if (data.success && data.program) {
          const program = data.program;
          
          // Set form values
          setName(program.name || "");
          setSlug(program.slug || "");
          setDegreeId(program.degreeId || null);
          setOverview(program.overview || "");
          setEligibility(program.eligibility || "");
          setDuration(program.duration || "");
          setCareerScope(program.careerScope || "");
          setFeeRange(program.feeRange || "");
          setSeoTitle(program.seoTitle || "");
          setSeoDescription(program.seoDescription || "");
          setStatus(program.status === undefined ? true : program.status);
          setProgramName(program.name || "");
        } else {
          throw new Error(data.error || "Failed to load program");
        }
        
      } catch (err) {
        console.error("Error fetching program:", err);
        setError(err instanceof Error ? err.message : "Failed to load program");
        toast.error(err instanceof Error ? err.message : "Failed to load program");
      } finally {
        setFetchLoading(false);
      }
    }
    
    fetchProgram();
  }, [programId]);

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
    if (!name || !slug || !degreeId) {
      setError("Program name, slug, and degree are required.");
      setLoading(false);
      return;
    }

    const formData = {
      name: name.trim(),
      slug: slug.trim(),
      degreeId: Number(degreeId),
      overview: overview || null,
      eligibility: eligibility || null,
      duration: duration || null,
      careerScope: careerScope || null,
      feeRange: feeRange || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      status,
    };

    toast.loading(`Updating "${name}"...`, { id: "update-program" });

    try {
      const res = await fetch(`/api/admin/programs/${programId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const text = await res.text();
      
      if (!text) {
        throw new Error("Empty response from server");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Parse error:", parseError);
        throw new Error("Invalid response from server");
      }

      if (!res.ok) {
        throw new Error(data.error || data.details || `HTTP error ${res.status}`);
      }

      if (data.success) {
        toast.success(`"${name}" updated successfully!`, { 
          id: "update-program",
          duration: 3000 
        });
        router.push("/admin/programs");
      } else {
        throw new Error(data.error || "Failed to update program");
      }

    } catch (err) {
      console.error("Error updating program:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update program", { 
        id: "update-program" 
      });
      setError(err instanceof Error ? err.message : "Failed to update program");
    } finally {
      setLoading(false);
    }
  };

  // Get selected degree
  const selectedDegree = degreeOptions.find(d => d.id === degreeId);
  const levelName = selectedDegree?.levelId ? levelMap[selectedDegree.levelId] : null;

  if (fetchLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading program data...</div>
        </div>
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded text-center">
          <p className="mb-4">{error}</p>
          <Link
            href="/admin/programs"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Back to Programs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header with Navigation */}
      <div className="mb-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/admin" className="hover:text-blue-600">
            Dashboard
          </Link>
          <span className="mx-2">›</span>
          <Link href="/admin/programs" className="hover:text-blue-600">
            Programs
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">Edit: {programName}</span>
        </div>

        {/* Header with Title and View All Button */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Edit Program</h1>
          
          <Link
            href="/admin/programs"
            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16" 
              />
            </svg>
            View All Programs
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Program Name *"
              value={name}
              onChange={setName}
              placeholder="e.g. Computer Science"
              required
            />

            <Input
              label="Slug *"
              value={slug}
              onChange={handleSlugChange}
              placeholder="e.g. computer-science"
              required
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Linked Level
              </label>
              <input
                type="text"
                value={levelName || "No level linked"}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Program Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium mb-4">Program Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overview
              </label>
              <textarea
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                placeholder="Program overview and description"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Eligibility Criteria
              </label>
              <textarea
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                placeholder="Eligibility requirements"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Duration"
                value={duration}
                onChange={setDuration}
                placeholder="e.g. 4 Years"
              />

              <Input
                label="Fee Range"
                value={feeRange}
                onChange={setFeeRange}
                placeholder="e.g. PKR 50,000 - 100,000/semester"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Career Scope
              </label>
              <textarea
                value={careerScope}
                onChange={(e) => setCareerScope(e.target.value)}
                placeholder="Career opportunities after this program"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* SEO Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium mb-4">SEO Information</h2>
          <div className="space-y-4">
            <Input
              label="SEO Title"
              value={seoTitle}
              onChange={setSeoTitle}
              placeholder="Meta title for search engines"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Description
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Meta description for search engines"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <input
              id="status"
              type="checkbox"
              checked={status}
              onChange={(e) => setStatus(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="status" className="text-sm font-medium text-gray-700">
              Published (Uncheck for Draft)
            </label>
          </div>
        </div>

        <div className="pt-4 flex items-center gap-3">
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Updating Program..." : "Update Program"}
          </PrimaryButton>
          
          {/* Cancel Button */}
          <Link
            href="/admin/programs"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}