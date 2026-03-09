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
  name: string;           // ✅ Add this
  slug: string;            // ✅ Add this
  year: number;
  session: string | null;
  status: "Expected" | "Open" | "Closed";
  expectedOpenDate: string | null;
  expectedCloseDate: string | null;
  meritInfo: string | null;
  note: string | null;
  officialLink: string | null;
  programId: number;
  instituteId: number;
  program: Program;
  institute: Institute;
};

export default function EditAdmissionPage() {
  const router = useRouter();
  const params = useParams();
  const admissionId = params.id as string;

  // Form states
  const [programId, setProgramId] = useState<number | null>(null);
  const [instituteId, setInstituteId] = useState<number | null>(null);
  const [year, setYear] = useState("");
  const [session, setSession] = useState("");
  const [status, setStatus] = useState<"Expected" | "Open" | "Closed">("Expected");
  const [expectedOpenDate, setExpectedOpenDate] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [meritInfo, setMeritInfo] = useState("");
  const [note, setNote] = useState("");
  const [officialLink, setOfficialLink] = useState("");
  
  // ✅ Name and Slug states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [manualName, setManualName] = useState(false);
  const [originalSlug, setOriginalSlug] = useState("");

  // Data states
  const [programs, setPrograms] = useState<Program[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected items for preview
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null);

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

  // Auto-generate name when program/institute/year changes (if not manually edited)
  useEffect(() => {
    if (selectedProgram && selectedInstitute && year && !manualName) {
      const generatedName = `${selectedProgram.name} Admissions ${year} at ${selectedInstitute.name}`;
      setName(generatedName);
      setSlug(generateSlug(generatedName));
    }
  }, [selectedProgram, selectedInstitute, year, manualName]);

  // Update selected program when programId changes
  useEffect(() => {
    if (programId) {
      const program = programs.find(p => p.id === programId);
      setSelectedProgram(program || null);
    } else {
      setSelectedProgram(null);
    }
  }, [programId, programs]);

  // Update selected institute when instituteId changes
  useEffect(() => {
    if (instituteId) {
      const institute = institutes.find(i => i.id === instituteId);
      setSelectedInstitute(institute || null);
    } else {
      setSelectedInstitute(null);
    }
  }, [instituteId, institutes]);

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

        // ✅ Fetch admission details - MAKE SURE API RETURNS name AND slug
        const admissionRes = await fetch(`/api/admin/admissions/${admissionId}`);
        const admissionData = await admissionRes.json();
        
        console.log('Admission data from API:', admissionData); // Debug log
        
        if (admissionData.success && admissionData.admission) {
          const ad: Admission = admissionData.admission;
          
          // Set form fields
          setProgramId(ad.programId);
          setInstituteId(ad.instituteId);
          setYear(ad.year.toString());
          setSession(ad.session || "");
          setStatus(ad.status);
          setExpectedOpenDate(ad.expectedOpenDate ? ad.expectedOpenDate.split('T')[0] : "");
          setExpectedCloseDate(ad.expectedCloseDate ? ad.expectedCloseDate.split('T')[0] : "");
          setMeritInfo(ad.meritInfo || "");
          setNote(ad.note || "");
          setOfficialLink(ad.officialLink || "");
          
          // ✅ Set name and slug - THESE WERE MISSING!
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

  // Filter institutes when program changes
  useEffect(() => {
    if (programId) {
      const fetchProgramInstitutes = async () => {
        try {
          const res = await fetch(`/api/admin/program-institutes/by-program/${programId}`);
          const data = await res.json();
          if (data.success) {
            setFilteredInstitutes(data.institutes || []);
          }
        } catch (err) {
          console.error("Error fetching program institutes:", err);
        }
      };
      fetchProgramInstitutes();
    } else {
      setFilteredInstitutes(institutes);
    }
  }, [programId, institutes]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!programId || !instituteId || !year || !status) {
      setError("Program, Institute, Year, and Status are required.");
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
          programId: Number(programId),
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
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
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
        <Select
          label="Program *"
          value={programId ?? 0}
          onChange={(val: number) => {
            setProgramId(val);
            setManualName(false);
          }}
          options={[
            { value: 0, label: "Select Program" },
            ...programs.map(p => ({
              value: p.id,
              label: p.name,
            }))
          ]}
          required
        />

        <Select
          label="Institute *"
          value={instituteId ?? 0}
          onChange={(val: number) => {
            setInstituteId(val);
            setManualName(false);
          }}
          options={[
            { value: 0, label: "Select Institute" },
            ...filteredInstitutes.map(i => ({
              value: i.id,
              label: `${i.name} (${i.cityName})`,
            }))
          ]}
          required
        />

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

        {/* ✅ Name Field - NOW WILL SHOW DATA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Admission Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. BS Computer Science Admissions 2026 at FAST NUCES"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Auto-generated from selection. Edit to customize.
          </p>
        </div>

        {/* ✅ Slug Field - NOW WILL SHOW DATA */}
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
              placeholder="bs-computer-science-fast-nuces-admissions-2026"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            URL-friendly version. Auto-generated from name.
          </p>
        </div>

        {/* ✅ Preview */}
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