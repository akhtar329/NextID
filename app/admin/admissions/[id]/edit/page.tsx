// app/admin/admissions/[id]/edit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Select from "@/app/component/ui/select";

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

type Admission = {
  id: number;
  name: string;
  slug: string;
  year: number;
  session: string | null;
  status: "Expected" | "Open" | "Closed";
  expectedOpenDate: string | null;
  expectedCloseDate: string | null;
  meritInfo: string | null;
  note: string | null;
  officialLink: string | null;
  // 👇 Changed from programId to programs array
  programs: Program[];
  instituteId: number;
  institute: Institute;
};

export default function EditAdmissionPage() {
  const router = useRouter();
  const params = useParams();
  const admissionId = params.id as string;

  // Form states
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
  
  // Name and Slug states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [manualName, setManualName] = useState(false);
  const [originalSlug, setOriginalSlug] = useState("");

  // Data states
  const [programs, setPrograms] = useState<Program[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]); // 👈 Programs for selected institute
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected items for preview
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null);
  const [selectedProgramsList, setSelectedProgramsList] = useState<Program[]>([]);

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

  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setManualName(true);
    
    if (newName) {
      setSlug(generateSlug(newName));
    }
  };

  // Handle slug change
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(generateSlug(e.target.value));
  };

  // Auto-generate name when institute/year/programs change (if not manually edited)
  useEffect(() => {
    if (selectedInstitute && year && selectedProgramsList.length > 0 && !manualName) {
      // 📝 NAME - Sirf institute name aur year (programs ka zikar nahi)
      const sessionText = session ? ` ${session}` : '';
      const generatedName = `Admissions Open at ${selectedInstitute.name}${sessionText} ${year}`;
      
      // 🔗 SLUG - Clean URL (institute + session + year)
      const cleanInstituteName = selectedInstitute.name
        .replace(/University|College|Institute|of|the|and|&/gi, '')
        .trim();
      
      const sessionSlug = session ? `-${session.toLowerCase()}` : '';
      const slugBase = `admissions-open-at-${cleanInstituteName}${sessionSlug}-${year}`;
      const generatedSlug = generateSlug(slugBase);
      
      setName(generatedName);
      setSlug(generatedSlug);
    }
  }, [selectedInstitute, selectedProgramsList, year, session, manualName]);

  // Handle program selection (multi-select)
  const handleProgramSelect = (programId: number) => {
    if (selectedPrograms.includes(programId)) {
      setSelectedPrograms(selectedPrograms.filter(id => id !== programId));
    } else {
      setSelectedPrograms([...selectedPrograms, programId]);
    }
    setManualName(false);
  };

  // Handle select all programs
  const handleSelectAllPrograms = () => {
    if (selectedPrograms.length === filteredPrograms.length) {
      setSelectedPrograms([]);
    } else {
      setSelectedPrograms(filteredPrograms.map(p => p.id));
    }
    setManualName(false);
  };

  // Update selected institute when instituteId changes
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

  // Fetch programs, institutes, and admission data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch programs
        const programsRes = await fetch("/api/admin/programs");
        const programsData = await programsRes.json();
        setPrograms(programsData.programs || []);

        // Fetch institutes
        const institutesRes = await fetch("/api/admin/institutes");
        const institutesData = await institutesRes.json();
        setInstitutes(institutesData.institutes || []);

        // ✅ Fetch admission details - API should return programs array
        const admissionRes = await fetch(`/api/admin/admissions/${admissionId}`);
        const admissionData = await admissionRes.json();
        
        console.log('Admission data from API:', admissionData); // Debug log
        
        if (admissionData.success && admissionData.admission) {
          const ad: Admission = admissionData.admission;
          
          // Set form fields
          // 👇 Set selected programs from programs array
          setSelectedPrograms(ad.programs?.map(p => p.id) || []);
          setInstituteId(ad.instituteId);
          setYear(ad.year.toString());
          setSession(ad.session || "");
          setStatus(ad.status);
          setExpectedOpenDate(ad.expectedOpenDate ? ad.expectedOpenDate.split('T')[0] : "");
          setExpectedCloseDate(ad.expectedCloseDate ? ad.expectedCloseDate.split('T')[0] : "");
          setMeritInfo(ad.meritInfo || "");
          setNote(ad.note || "");
          setOfficialLink(ad.officialLink || "");
          
          // Set name and slug
          setName(ad.name || "");
          setSlug(ad.slug || "");
          setOriginalSlug(ad.slug || "");
        }

      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load data");
      } finally {
        setFetchLoading(false);
      }
    }
    
    if (admissionId) {
      fetchData();
    }
  }, [admissionId]);

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
            setFilteredPrograms(programs);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!instituteId || selectedPrograms.length === 0 || !year || !status) {
      setError("Institute, at least one Program, Year, and Status are required.");
      setLoading(false);
      return;
    }

    if (!name || !slug) {
      setError("Name and Slug are required.");
      setLoading(false);
      return;
    }

    toast.loading("Updating admission...", { id: "update-admission" });

    try {
      const res = await fetch(`/api/admin/admissions/${admissionId}`, {
        method: "PUT",
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
        throw new Error(data.error || data.details || "Failed to update admission");
      }

      if (data.success) {
        toast.success("Admission updated successfully!", { 
          id: "update-admission",
          duration: 3000 
        });
        
        if (slug !== originalSlug) {
          router.push(`/admin/admissions`);
        } else {
          router.push(`/admin/admissions/${admissionId}`);
        }
      } else {
        throw new Error(data.error || "Failed to update admission");
      }

    } catch (err) {
      console.error("Error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update admission", { 
        id: "update-admission" 
      });
      setError(err instanceof Error ? err.message : "Failed to update admission");
    } finally {
      setLoading(false);
    }
  };

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
          <Link href={`/admin/admissions/${admissionId}`} className="hover:text-blue-600">
            {name || `Admission #${admissionId}`}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">Edit</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Edit Admission</h1>
          <Link
            href={`/admin/admissions/${admissionId}`}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form className="bg-white p-6 rounded-lg shadow-sm border space-y-4" onSubmit={handleSubmit}>
        {/* Institute Selection */}
        <Select
          label="Institute *"
          value={instituteId ?? 0}
          onChange={(val: number) => {
            setInstituteId(val);
            setManualName(false);
          }}
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
              onChange={(e) => {
                setYear(e.target.value);
                setManualName(false);
              }}
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
            placeholder="e.g. FAST NUCES Spring Admissions 2026"
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
              placeholder="fast-nuces-spring-admissions-2026"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            URL-friendly version. Auto-generated from name.
          </p>
        </div>

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

        {/* Preview */}
        {slug && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Preview URL:</span>{' '}
              <span className="font-mono">https://nextid.pk/admissions/{slug}</span>
            </p>
            {slug !== originalSlug && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ Slug changed. Page will redirect to new URL after update.
              </p>
            )}
          </div>
        )}

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

        <div className="pt-4 flex items-center gap-3">
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Admission"}
          </PrimaryButton>
          
          <Link
            href={`/admin/admissions/${admissionId}`}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}