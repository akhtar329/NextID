// app/admin/programs/[id]/institutes/assign/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import SearchInput from "@/app/component/ui/SearchInput";

type Institute = {
  id: number;
  name: string;
  type: "Govt" | "Private";
  cityName: string;
  status: boolean;
};

export default function ProgramInstitutesAssignPage() {
  const router = useRouter();
  const params = useParams();
  const programId = params.id as string;

  const [allInstitutes, setAllInstitutes] = useState<Institute[]>([]);
  const [selectedInstituteIds, setSelectedInstituteIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [programName, setProgramName] = useState("");

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch program details
        const programRes = await fetch(`/api/admin/programs/${programId}`);
        if (!programRes.ok) throw new Error("Failed to fetch program");
        const programData = await programRes.json();
        if (programData.success) {
          setProgramName(programData.program.name);
        }

        // Fetch all institutes
        const institutesRes = await fetch("/api/admin/institutes");
        if (!institutesRes.ok) throw new Error("Failed to fetch institutes");
        const institutesData = await institutesRes.json();
        setAllInstitutes(institutesData.institutes || []);

        // Fetch assigned institutes for this program
        const assignedRes = await fetch(`/api/admin/program-institutes/by-program/${programId}`);
        if (!assignedRes.ok) throw new Error("Failed to fetch assigned institutes");
        const assignedData = await assignedRes.json();
        
        if (assignedData.success) {
          const assignedIds = new Set<number>();
          assignedData.institutes.forEach((inst: Institute) => {
            assignedIds.add(inst.id);
          });
          setSelectedInstituteIds(assignedIds);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    if (programId) {
      fetchData();
    }
  }, [programId]);

  // Toggle institute selection
  const toggleInstitute = (instituteId: number) => {
    const newSelected = new Set(selectedInstituteIds);
    if (newSelected.has(instituteId)) {
      newSelected.delete(instituteId);
    } else {
      newSelected.add(instituteId);
    }
    setSelectedInstituteIds(newSelected);
  };

  // Select all filtered institutes
  const selectAll = () => {
    const newSelected = new Set(selectedInstituteIds);
    filteredInstitutes.forEach(institute => newSelected.add(institute.id));
    setSelectedInstituteIds(newSelected);
  };

  // Deselect all filtered institutes
  const deselectAll = () => {
    const newSelected = new Set(selectedInstituteIds);
    filteredInstitutes.forEach(institute => newSelected.delete(institute.id));
    setSelectedInstituteIds(newSelected);
  };

  // Save assignments
  const handleSave = async () => {
    setSaving(true);
    const toastId = "save-assignments";
    toast.loading("Saving assignments...", { id: toastId });

    try {

      const res = await fetch("/api/admin/program-institutes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          programId: parseInt(programId),
          instituteIds: Array.from(selectedInstituteIds),
        }),
      });

      const responseText = await res.text();

      if (!responseText) {
        throw new Error("Empty response from server");
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Invalid JSON response from server");
      }

      if (!res.ok) {
        throw new Error(data.error || data.details || `HTTP error ${res.status}`);
      }

      if (data.success) {
        toast.success("Institutes assigned successfully!", { 
          id: toastId,
          duration: 3000 
        });
        router.push(`/admin/programs/${programId}`);
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

  // Filter institutes by search
  const filteredInstitutes = allInstitutes.filter(institute => 
    institute.name.toLowerCase().includes(search.toLowerCase()) ||
    institute.cityName?.toLowerCase().includes(search.toLowerCase()) ||
    institute.type.toLowerCase().includes(search.toLowerCase())
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
          <Link href="/admin/programs" className="hover:text-blue-600">Programs</Link>
          <span className="mx-2">›</span>
          <Link href={`/admin/programs/${programId}`} className="hover:text-blue-600">
            {programName}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">Assign Institutes</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Assign Institutes</h1>
          <div className="flex gap-2">
            <Link
              href={`/admin/programs/${programId}`}
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

      {/* Stats */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {selectedInstituteIds.size} of {allInstitutes.length} institutes selected
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search institutes by name, city or type..."
        />
      </div>

      {/* Selection Controls */}
      <div className="mb-4 flex gap-2">
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
      </div>

      {/* Institutes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredInstitutes.map((institute) => (
          <div
            key={institute.id}
            onClick={() => toggleInstitute(institute.id)}
            className={`
              border rounded-lg p-4 cursor-pointer transition-all
              ${selectedInstituteIds.has(institute.id)
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }
            `}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedInstituteIds.has(institute.id)}
                onChange={() => toggleInstitute(institute.id)}
                className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <h3 className="font-medium">{institute.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    institute.type === "Govt"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}>
                    {institute.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {institute.cityName}
                  </span>
                  {!institute.status && (
                    <span className="text-xs text-red-500">(Inactive)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="mt-6 flex justify-end gap-2">
        <Link
          href={`/admin/programs/${programId}`}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
        <PrimaryButton onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </PrimaryButton>
      </div>
    </div>
  );
}