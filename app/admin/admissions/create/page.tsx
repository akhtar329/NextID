// app/admin/admissions/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Select from "@/app/component/ui/select";
import BulkUpload from "@/app/component/ui/BulkUpload";
import { useBulkUpload, BulkItem } from "@/app/hooks/useBulkUpload";

type Program = {
  id: number;
  name: string;
  degreeName: string;
  slug: string;
};

type Institute = {
  id: number;
  name: string;
  cityName: string;
  slug: string;
};

export default function CreateAdmissionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Form states for single creation
  const [selectedPrograms, setSelectedPrograms] = useState<number[]>([]); // 👈 Changed to array
  const [instituteId, setInstituteId] = useState<number | null>(null);
  const [year, setYear] = useState("");
  const [session, setSession] = useState("");
  const [status, setStatus] = useState<"Expected" | "Open" | "Closed">("Expected");
  const [expectedOpenDate, setExpectedOpenDate] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [meritInfo, setMeritInfo] = useState("");
  const [note, setNote] = useState("");
  const [officialLink, setOfficialLink] = useState("");
  
  // Name and slug states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [manualName, setManualName] = useState(false);
  
  const [singleLoading, setSingleLoading] = useState(false);

  // Preview states
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null);
  const [selectedProgramsList, setSelectedProgramsList] = useState<Program[]>([]);

  // Data states
  const [programs, setPrograms] = useState<Program[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]); // 👈 Programs for selected institute
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Slug generator
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

// Auto-generate name and slug when institute/year/programs change

useEffect(() => {
  if (selectedInstitute && year && selectedProgramsList.length > 0 && !manualName) {
    // 📝 NAME - Institute + Session + Year
    const sessionText = session ? ` ${session}` : '';
    const generatedName = `Admissions Open at ${selectedInstitute.name}${sessionText} ${year}`;
    
    // 🔗 SLUG - Clean URL (institute + session + year)
    const cleanInstituteName = selectedInstitute.name
      .replace(/University|College|Institute|of|the|and|&/gi, '')
      .trim();
    
    const sessionSlug = session ? `-${session.toLowerCase()}` : '';
    const slugBase = `Admissions-Open-at-${cleanInstituteName}${sessionSlug}-${year}`;
    const generatedSlug = generateSlug(slugBase);
    
    setName(generatedName);
    setSlug(generatedSlug);
  }
}, [
  selectedInstitute, 
  selectedProgramsList, 
  year, 
  session,  // ✅ Session ab yahan permanently add ho gaya
  manualName
]);
// 👆 Added 'session' to dependencies

  // Handle manual name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setManualName(true);
    
    if (newName) {
      setSlug(generateSlug(newName));
    }
  };

  // Handle manual slug change
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(generateSlug(e.target.value));
  };

  // Reset manual flag
  useEffect(() => {
    setManualName(false);
  }, [instituteId, year, selectedPrograms]);

  // Fetch programs and institutes
  useEffect(() => {
    async function fetchData() {
      try {
        const [programsRes, institutesRes] = await Promise.all([
          fetch("/api/admin/programs"),
          fetch("/api/admin/institutes")
        ]);
        
        const programsData = await programsRes.json();
        const institutesData = await institutesRes.json();
        
        setPrograms(programsData.programs || []);
        setInstitutes(institutesData.institutes || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load form data");
      } finally {
        setFetchLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter programs when institute changes
  useEffect(() => {
    if (instituteId) {
      const fetchInstitutePrograms = async () => {
        try {
          const res = await fetch(`/api/admin/program-institutes/by-institute/${instituteId}`);
          const data = await res.json();
          if (data.success) {
            setFilteredPrograms(data.programs || []);
          } else {
            // Fallback: filter programs that might be in this institute
            setFilteredPrograms(programs.filter(p => 
              p.name // Simple filter, you may need better logic
            ));
          }
        } catch (err) {
          console.error("Error fetching institute programs:", err);
          setFilteredPrograms([]);
        }
      };
      fetchInstitutePrograms();
    } else {
      setFilteredPrograms([]);
    }
  }, [instituteId, programs]);

  // Update selected institute
  useEffect(() => {
    if (instituteId) {
      const institute = institutes.find(i => i.id === instituteId);
      setSelectedInstitute(institute || null);
    } else {
      setSelectedInstitute(null);
    }
  }, [instituteId, institutes]);

  // Update selected programs list
  useEffect(() => {
    if (selectedPrograms.length > 0) {
      const programsList = programs.filter(p => selectedPrograms.includes(p.id));
      setSelectedProgramsList(programsList);
    } else {
      setSelectedProgramsList([]);
    }
  }, [selectedPrograms, programs]);

  // Handle program selection (multi-select)
  const handleProgramSelect = (programId: number) => {
    if (selectedPrograms.includes(programId)) {
      setSelectedPrograms(selectedPrograms.filter(id => id !== programId));
    } else {
      setSelectedPrograms([...selectedPrograms, programId]);
    }
  };

  // Handle select all programs
  const handleSelectAllPrograms = () => {
    if (selectedPrograms.length === filteredPrograms.length) {
      setSelectedPrograms([]);
    } else {
      setSelectedPrograms(filteredPrograms.map(p => p.id));
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSingleLoading(true);
    setError(null);

    if (!instituteId || selectedPrograms.length === 0 || !year || !status) {
      setError("Institute, at least one Program, Year, and Status are required.");
      setSingleLoading(false);
      return;
    }

    if (!name || !slug) {
      setError("Name and Slug are required.");
      setSingleLoading(false);
      return;
    }

    toast.loading("Creating admission...", { id: "create-admission" });

    try {
      const res = await fetch("/api/admin/admissions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          programIds: selectedPrograms, // 👈 Send array of program IDs
          instituteId: Number(instituteId),
          year: Number(year),
          session: session || null,
          status,
          expectedOpenDate: expectedOpenDate || null,
          expectedCloseDate: expectedCloseDate || null,
          meritInfo: meritInfo || null,
          note: note || null,
          officialLink: officialLink || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || "Failed to create admission");
      }

      if (data.success) {
        toast.success(`Admission created successfully for ${selectedPrograms.length} program(s)!`, { 
          id: "create-admission",
          duration: 3000 
        });
        router.push("/admin/admissions");
      } else {
        throw new Error(data.error || "Failed to create admission");
      }

    } catch (err) {
      console.error("Error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create admission", { 
        id: "create-admission" 
      });
      setError(err instanceof Error ? err.message : "Failed to create admission");
    } finally {
      setSingleLoading(false);
    }
  };

  // ... (rest of the code remains same: parseAdmissionsCSV, transformBulkItem, etc.)

  if (fetchLoading) {
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
          <Link href="/admin/admissions" className="hover:text-blue-600">Admissions</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">Create New</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Create Admission</h1>
          <Link
            href="/admin/admissions"
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
          >
            View All Admissions
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
            Single Admission
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

      {/* Single Admission Form */}
      {activeTab === "single" && (
        <>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form className="bg-white p-6 rounded-lg shadow-sm border space-y-4" onSubmit={handleSingleSubmit}>
            {/* Institute Selection */}
            <Select
              label="Institute *"
              value={instituteId ?? 0}
              onChange={(val: number) => setInstituteId(val)}
              options={[
                { value: 0, label: "Select Institute" },
                ...institutes.map(i => ({
                  value: i.id,
                  label: `${i.name} (${i.cityName})`,
                }))
              ]}
              required
            />

            {/* Multi-Program Selection */}
            {instituteId && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Programs * ({selectedPrograms.length} selected)
                  </label>
                  {filteredPrograms.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllPrograms}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {selectedPrograms.length === filteredPrograms.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>
                
                {filteredPrograms.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No programs found for this institute</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
                    {filteredPrograms.map((program) => (
                      <label
                        key={program.id}
                        className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                          selectedPrograms.includes(program.id)
                            ? 'bg-blue-50 border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPrograms.includes(program.id)}
                          onChange={() => handleProgramSelect(program.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                        />
                        <span className="text-sm">{program.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Year and Session */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <Select
                label="Session"
                value={session}
                onChange={(val: string) => setSession(val)}
                options={[
                  { value: "", label: "Select Session" },
                  { value: "Spring", label: "Spring" },
                  { value: "Fall", label: "Fall" },
                  { value: "Summer", label: "Summer" },
                ]}
              />
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admission Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Admissions 2026 at FAST NUCES"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated from selection. Edit to customize.
              </p>
            </div>

            {/* Slug Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">/admissions/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="fast-nuces-admissions-2026"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                URL-friendly version. Auto-generated from name.
              </p>
            </div>

            {/* Preview */}
            {slug && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Preview URL:</span>{' '}
                  <span className="font-mono">https://www.nextid.pk/admissions/{slug}</span>
                </p>
              </div>
            )}

            {/* Selected Programs Summary */}
            {selectedProgramsList.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium mb-1">Selected Programs:</p>
                <ul className="text-sm text-green-700 list-disc list-inside">
                  {selectedProgramsList.map(program => (
                    <li key={program.id}>{program.name}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Status */}
            <Select
              label="Status *"
              value={status}
              onChange={(val: "Expected" | "Open" | "Closed") => setStatus(val)}
              options={[
                { value: "Expected", label: "Expected" },
                { value: "Open", label: "Open" },
                { value: "Closed", label: "Closed" },
              ]}
              required
            />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Open Date
                </label>
                <input
                  type="date"
                  value={expectedOpenDate}
                  onChange={(e) => setExpectedOpenDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Official Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Official Link
              </label>
              <input
                type="url"
                value={officialLink}
                onChange={(e) => setOfficialLink(e.target.value)}
                placeholder="e.g. https://university.edu.pk/admissions"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Merit Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Merit Information
              </label>
              <textarea
                value={meritInfo}
                onChange={(e) => setMeritInfo(e.target.value)}
                placeholder="Merit criteria, last merit, etc..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any additional information..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Form Actions */}
            <div className="pt-4 flex items-center gap-3">
              <PrimaryButton type="submit" disabled={singleLoading}>
                {singleLoading ? "Creating..." : "Create Admission"}
              </PrimaryButton>
              
              <Link
                href="/admin/admissions"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </>
      )}

      {/* Bulk Upload Form - You'll need to update this separately */}
      {activeTab === "bulk" && (
        <div className="max-w-2xl">
          {/* ... bulk upload code remains same for now ... */}
        </div>
      )}
    </div>
  );
}