// app/admin/institutes/[id]/programs/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import SearchInput from "@/app/component/ui/SearchInput";

type Program = {
  id: number;
  name: string;
  degreeName: string;
  levelName: string;
  duration: string | null;
};

export default function InstituteProgramsPage() {
  const router = useRouter();
  const params = useParams();
  const instituteId = params.id as string;

  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [selectedProgramIds, setSelectedProgramIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instituteName, setInstituteName] = useState("");

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch institute details
        const instituteRes = await fetch(`/api/admin/institutes/${instituteId}`);
        if (!instituteRes.ok) {
          throw new Error("Failed to fetch institute");
        }
        const instituteData = await instituteRes.json();
        if (instituteData.success) {
          setInstituteName(instituteData.institute.name);
        }

        // Fetch all programs
        const programsRes = await fetch("/api/admin/programs");
        if (!programsRes.ok) {
          throw new Error("Failed to fetch programs");
        }
        const programsData = await programsRes.json();
        setAllPrograms(programsData.programs || []);

        // Fetch assigned programs for this institute
        const assignedRes = await fetch(`/api/admin/program-institutes/by-institute/${instituteId}`);
        if (!assignedRes.ok) {
          throw new Error("Failed to fetch assigned programs");
        }
        const assignedData = await assignedRes.json();
        
        if (assignedData.success) {
          const assignedIds = new Set<number>();
          assignedData.programs.forEach((p: Program) => {
            assignedIds.add(p.id);
          });
          setSelectedProgramIds(assignedIds);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    if (instituteId) {
      fetchData();
    }
  }, [instituteId]);

  // Toggle program selection
  const toggleProgram = (programId: number) => {
    const newSelected = new Set(selectedProgramIds);
    if (newSelected.has(programId)) {
      newSelected.delete(programId);
    } else {
      newSelected.add(programId);
    }
    setSelectedProgramIds(newSelected);
  };

  // Select all filtered programs
  const selectAll = () => {
    const newSelected = new Set(selectedProgramIds);
    filteredPrograms.forEach(program => newSelected.add(program.id));
    setSelectedProgramIds(newSelected);
  };

  // Deselect all filtered programs
  const deselectAll = () => {
    const newSelected = new Set(selectedProgramIds);
    filteredPrograms.forEach(program => newSelected.delete(program.id));
    setSelectedProgramIds(newSelected);
  };

  // Save assignments
  const handleSave = async () => {
    setSaving(true);
    const toastId = "save-assignments";
    toast.loading("Saving assignments...", { id: toastId });

    try {
      console.log("📤 Sending data:", {
        instituteId: parseInt(instituteId),
        programIds: Array.from(selectedProgramIds),
      });

      const res = await fetch("/api/admin/program-institutes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instituteId: parseInt(instituteId),
          programIds: Array.from(selectedProgramIds),
        }),
      });

      console.log("📥 Response status:", res.status);

      // Get response as text first
      const responseText = await res.text();
      console.log("📥 Raw response:", responseText);

      // Check if response is empty
      if (!responseText) {
        throw new Error("Empty response from server");
      }

      // Parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("📥 Parsed response:", data);
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        throw new Error("Invalid JSON response from server");
      }

      if (!res.ok) {
        throw new Error(data.error || data.details || `HTTP error ${res.status}`);
      }

      if (data.success) {
        toast.success("Programs assigned successfully!", { 
          id: toastId,
          duration: 3000 
        });
        router.push(`/admin/institutes/${instituteId}`);
      } else {
        throw new Error(data.error || "Failed to save assignments");
      }

    } catch (err) {
      console.error("❌ Error saving:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save assignments", { 
        id: toastId 
      });
    } finally {
      setSaving(false);
    }
  };

  // Filter programs by search
  const filteredPrograms = allPrograms.filter(program => 
    program.name.toLowerCase().includes(search.toLowerCase()) ||
    program.degreeName.toLowerCase().includes(search.toLowerCase()) ||
    (program.levelName?.toLowerCase() || "").includes(search.toLowerCase())
  );

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
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/admin" className="hover:text-blue-600">Dashboard</Link>
          <span className="mx-2">›</span>
          <Link href="/admin/institutes" className="hover:text-blue-600">Institutes</Link>
          <span className="mx-2">›</span>
          <Link href={`/admin/institutes/${instituteId}`} className="hover:text-blue-600">
            {instituteName}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">Programs</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Manage Programs</h1>
          <div className="flex gap-2">
            <Link
              href={`/admin/institutes/${instituteId}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <PrimaryButton onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search programs by name, degree, or level..."
        />
      </div>

      {/* Selection Controls */}
      <div className="mb-4 flex gap-2 items-center">
        <button
          onClick={selectAll}
          className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
        >
          Select All
        </button>
        <button
          onClick={deselectAll}
          className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Deselect All
        </button>
        <span className="text-sm text-gray-500 ml-2">
          {selectedProgramIds.size} of {allPrograms.length} selected
        </span>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredPrograms.map((program) => (
          <div
            key={program.id}
            onClick={() => toggleProgram(program.id)}
            className={`
              border rounded-lg p-4 cursor-pointer transition-all
              ${selectedProgramIds.has(program.id)
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }
            `}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedProgramIds.has(program.id)}
                onChange={() => toggleProgram(program.id)}
                className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <h3 className="font-medium">{program.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {program.degreeName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {program.levelName}
                  </span>
                  {program.duration && (
                    <span className="text-xs text-gray-500">
                      • {program.duration}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}