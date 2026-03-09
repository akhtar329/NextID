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

interface AdmissionBulkItem {
  name: string;
  slug: string;
  displayOrder: number;
  bulkStatus: boolean;
  programId: number;
  instituteId: number;
  year: number;
  session?: string;
  admissionStatus: "Expected" | "Open" | "Closed";
  expectedOpenDate?: string;
  expectedCloseDate?: string;
  meritInfo?: string;
  note?: string;
  officialLink?: string;
}

export default function CreateAdmissionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Form states for single creation
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
  
  // ✅ New states for name and slug
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [manualName, setManualName] = useState(false);
  
  const [singleLoading, setSingleLoading] = useState(false);

  // Preview states
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null);

  // Data states
  const [programs, setPrograms] = useState<Program[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState<Institute[]>([]);
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

  // ✅ Auto-generate name and slug when program/institute/year changes
  useEffect(() => {
    if (selectedProgram && selectedInstitute && year && !manualName) {
      const generatedName = `${selectedProgram.name} Admissions ${year} at ${selectedInstitute.name}`;
      const generatedSlug = generateSlug(`${selectedProgram.name} ${selectedInstitute.name} Admissions ${year}`);
      
      setName(generatedName);
      setSlug(generatedSlug);
    }
  }, [selectedProgram, selectedInstitute, year, manualName]);

  // ✅ Handle manual name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setManualName(true);
    
    // Auto-update slug from manual name
    if (newName) {
      setSlug(generateSlug(newName));
    }
  };

  // ✅ Handle manual slug change
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(generateSlug(e.target.value));
  };

  // ✅ Reset manual flag when program/institute changes
  useEffect(() => {
    setManualName(false);
  }, [programId, instituteId, year]);

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
        setFilteredInstitutes(institutesData.institutes || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load form data");
      } finally {
        setFetchLoading(false);
      }
    }
    fetchData();
  }, []);

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

  const handleSingleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSingleLoading(true);
    setError(null);

    if (!programId || !instituteId || !year || !status) {
      setError("Program, Institute, Year, and Status are required.");
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
          // ✅ Send name and slug
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
        throw new Error(data.error || data.details || "Failed to create admission");
      }

      if (data.success) {
        toast.success("Admission created successfully!", { 
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

  const parseAdmissionsCSV = (text: string): BulkItem[] => {
    // ... (keep existing parseAdmissionsCSV function)
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const firstLine = lines[0].toLowerCase();
    const hasHeaders = firstLine.includes('programid') || firstLine.includes('instituteid') || firstLine.includes('year');
    
    let startIndex = 0;
    let headers: string[] = [];
    
    if (hasHeaders) {
      headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      startIndex = 1;
    } else {
      headers = ['programid', 'instituteid', 'year', 'session', 'status', 'expectedopendate', 'expectedclosedate', 'officiallink'];
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
      
      const programId = parseInt(obj.programid || '0');
      const instituteId = parseInt(obj.instituteid || '0');
      const year = parseInt(obj.year || '0');
      const session = obj.session || '';
      const admissionStatus = obj.status as "Expected" | "Open" | "Closed" || "Expected";
      const expectedOpenDate = obj.expectedopendate || obj.open_date || '';
      const expectedCloseDate = obj.expectedclosedate || obj.close_date || '';
      const officialLink = obj.officiallink || obj.link || '';
      const displayOrder = parseInt(obj.displayorder || '0') || 0;
      
      if (programId && instituteId && year) {
        // ✅ Generate name and slug for bulk items
        const programName = programs.find(p => p.id === programId)?.name || `Program-${programId}`;
        const instituteName = institutes.find(i => i.id === instituteId)?.name || `Institute-${instituteId}`;
        const generatedName = `${programName} Admissions ${year} at ${instituteName}`;
        const generatedSlug = generateSlug(`${programName} ${instituteName} Admissions ${year}`);
        
        items.push({
          name: generatedName,
          slug: generatedSlug,
          displayOrder,
          status: true,
          programId,
          instituteId,
          year,
          session,
          admissionStatus,
          expectedOpenDate,
          expectedCloseDate,
          officialLink,
          meritInfo: obj.meritinfo || obj.merit || '',
          note: obj.note || '',
        });
      }
    }
    
    return items;
  };

  const transformBulkItem = (item: BulkItem) => {
    return {
      name: (item as any).name,
      slug: (item as any).slug,
      programId: (item as any).programId,
      instituteId: (item as any).instituteId,
      year: (item as any).year,
      session: (item as any).session,
      status: (item as any).admissionStatus || "Expected",
      expectedOpenDate: (item as any).expectedOpenDate,
      expectedCloseDate: (item as any).expectedCloseDate,
      meritInfo: (item as any).meritInfo,
      note: (item as any).note,
      officialLink: (item as any).officialLink,
    };
  };

  const bulkUpload = useBulkUpload({
    apiEndpoint: "/api/admin/admissions/bulk",
    redirectPath: "/admin/admissions",
    itemName: "admissions",
    generateSlug,
    customParse: parseAdmissionsCSV
  });

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bulkUpload.bulkData && !bulkUpload.file) {
      toast.error("Please enter data or upload a file");
      return;
    }

    bulkUpload.setLoading(true);
    
    try {
      let items: BulkItem[] = [];
      
      if (bulkUpload.file) {
        const text = await bulkUpload.file.text();
        items = parseAdmissionsCSV(text);
        if (items.length > 0) {
          toast.success(`Parsed ${items.length} admissions from file`);
        }
      } else if (bulkUpload.bulkData) {
        toast.error("Manual entry not supported yet. Please use CSV file.");
        bulkUpload.setLoading(false);
        return;
      }

      if (items.length === 0) {
        toast.error("No valid admissions found. Please check your format.");
        bulkUpload.setLoading(false);
        return;
      }

      const apiItems = items.map(transformBulkItem);

      const res = await fetch("/api/admin/admissions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admissions: apiItems }),
      });

      const text = await res.text();
      console.log("Raw response:", text);

      if (!text) {
        throw new Error("Empty response from server");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error("Invalid JSON response from server");
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP ${res.status}: ${data.details?.join(', ') || 'Failed to upload'}`);
      }

      if (data.success) {
        toast.success(data.message || `${data.count} admissions created successfully`);
        router.push("/admin/admissions");
      } else {
        throw new Error(data.error || "Failed to create admissions");
      }

    } catch (err) {
      console.error("Bulk upload error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to process bulk upload");
    } finally {
      bulkUpload.setLoading(false);
    }
  };

  const downloadSample = () => {
    const headers = ['programId', 'instituteId', 'year', 'session', 'status', 'expectedOpenDate', 'expectedCloseDate', 'officialLink'];
    const sampleData = [
      ['1', '2', '2026', 'Spring', 'Open', '2026-03-01', '2026-08-31', 'https://university.edu.pk/admissions'],
      ['3', '1', '2026', 'Fall', 'Expected', '2026-09-01', '2026-12-31', 'https://college.edu.pk/admissions'],
      ['2', '3', '2026', 'Summer', 'Closed', '2026-05-01', '2026-07-31', 'https://institute.edu.pk/admissions'],
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'admissions-sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Sample CSV downloaded");
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
            <Select
              label="Program *"
              value={programId ?? 0}
              onChange={(val: number) => setProgramId(val)}
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
              onChange={(val: number) => setInstituteId(val)}
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

            {/* ✅ Name Field */}
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

            {/* ✅ Slug Field */}
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

      {/* Bulk Upload Form */}
      {activeTab === "bulk" && (
        <div className="max-w-2xl">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">CSV Format</h3>
            <p className="text-sm text-blue-600 mb-2">
              Headers: programId, instituteId, year, session, status, expectedOpenDate, expectedCloseDate, officialLink
            </p>
            <p className="text-sm text-blue-600">
              Example: 1,2,2026,Spring,Open,2026-03-01,2026-08-31,https://university.edu.pk/admissions
            </p>
            <p className="text-xs text-blue-500 mt-2">
              Note: Name and slug will be auto-generated from program and institute names
            </p>
          </div>

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

          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File
              </label>
              
              {!bulkUpload.file ? (
                <div className="text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={bulkUpload.handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Choose CSV File
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Supported format: .csv only</p>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">{bulkUpload.fileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={bulkUpload.clearFile}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              <PrimaryButton type="submit" disabled={bulkUpload.loading}>
                {bulkUpload.loading ? "Uploading..." : "Upload Admissions"}
              </PrimaryButton>
              <button
                type="button"
                onClick={bulkUpload.clearAll}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}