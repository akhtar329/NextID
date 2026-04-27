"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Select from "@/app/component/ui/select";
import BulkUpload from "@/app/component/ui/BulkUpload";
import RichTextEditor from "@/app/component/ui/RichTextEditor";

// Types
type ProgramOffering = {
  id: number;
  programId: number;
  programName: string;
  degreeName: string;
  slug: string;
  instituteId: number;
};

type Institute = {
  id: number;
  name: string;
  cityName: string;
  slug: string;
};

type AdmissionFormData = {
  name: string;
  slug: string;
  offeringIds: number[];
  instituteId: number;
  year: number;
  session: string | null;
  status: "Expected" | "Open" | "Closed";
  expectedOpenDate: string | null;
  expectedCloseDate: string | null;
  meritInfo: string | null;
  note: string | null;
  officialLink: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
};

export default function CreateAdmissionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Form states for single creation
  const [selectedOfferings, setSelectedOfferings] = useState<number[]>([]);
  const [instituteId, setInstituteId] = useState<number | null>(null);
  const [year, setYear] = useState("");
  const [session, setSession] = useState("");
  const [status, setStatus] = useState<"Expected" | "Open" | "Closed">("Expected");
  const [expectedOpenDate, setExpectedOpenDate] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [meritInfo, setMeritInfo] = useState("");
  const [note, setNote] = useState("");
  const [officialLink, setOfficialLink] = useState("");
  
  // SEO states
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [robots, setRobots] = useState("index, follow");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [autoGenerateSeo, setAutoGenerateSeo] = useState(true);
  
  // Name and slug states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  
  const [singleLoading, setSingleLoading] = useState(false);

  // Bulk upload states
  const [bulkData, setBulkData] = useState("");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // Preview states
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null);
  const [selectedOfferingsList, setSelectedOfferingsList] = useState<ProgramOffering[]>([]);

  // Data states
  const [programOfferings, setProgramOfferings] = useState<ProgramOffering[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [filteredOfferings, setFilteredOfferings] = useState<ProgramOffering[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dark mode effect
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    checkTheme();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Generate slug from name (title)
  const generateSlugFromName = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Generate Meta Title from Admission Name
  const generateMetaTitle = (admissionName: string): string => {
    if (!admissionName) return "";
    
    // Remove "Admissions Open at" if present for cleaner title
    const cleanName = admissionName.replace(/^Admissions Open at\s+/i, '');
    
    // Ensure it's not too long (max 60 chars)
    let metaTitle = `${cleanName} | NextID`;
    if (metaTitle.length > 60) {
      metaTitle = cleanName.substring(0, 50) + " | NextID";
    }
    
    return metaTitle;
  };

  // Generate Meta Description from Merit Info and Note
  const generateMetaDescription = (meritInfo: string, note: string, instituteName: string, year: string): string => {
    // Priority: Merit Info > Note > Default
    let description = "";
    
    if (meritInfo && meritInfo.trim()) {
      // Use merit info as description
      description = meritInfo.trim();
      // Remove HTML tags if any
      description = description.replace(/<[^>]*>/g, '');
      // Limit to 160 chars
      if (description.length > 157) {
        description = description.substring(0, 154) + "...";
      }
    } 
    else if (note && note.trim()) {
      // Use note as description
      description = note.trim();
      // Remove HTML tags
      description = description.replace(/<[^>]*>/g, '');
      // Limit to 160 chars
      if (description.length > 157) {
        description = description.substring(0, 154) + "...";
      }
    }
    else {
      // Default description
      description = `${instituteName} admissions for year ${year}. Check eligibility criteria, merit, and apply online.`;
      if (description.length > 157) {
        description = description.substring(0, 154) + "...";
      }
    }
    
    return description;
  };

  // Generate OG Title from Admission Name
  const generateOgTitle = (admissionName: string): string => {
    if (!admissionName) return "";
    let ogTitle = `${admissionName} - Apply Now`;
    if (ogTitle.length > 90) {
      ogTitle = admissionName.substring(0, 80) + "...";
    }
    return ogTitle;
  };

  // Generate OG Description from Merit Info or Note
  const generateOgDescription = (meritInfo: string, note: string, instituteName: string, year: string): string => {
    let description = "";
    
    if (meritInfo && meritInfo.trim()) {
      description = meritInfo.trim().replace(/<[^>]*>/g, '');
      if (description.length > 197) {
        description = description.substring(0, 194) + "...";
      }
    } 
    else if (note && note.trim()) {
      description = note.trim().replace(/<[^>]*>/g, '');
      if (description.length > 197) {
        description = description.substring(0, 194) + "...";
      }
    }
    else {
      description = `${instituteName} admissions ${year}. Limited seats available. Apply before deadline.`;
    }
    
    return description;
  };

  // Auto-generate all SEO fields
  const updateSeoFields = () => {
    if (!autoGenerateSeo) return;
    
    if (name) {
      // Generate slug from name
      const newSlug = generateSlugFromName(name);
      setSlug(newSlug);
      
      // Generate meta title from name
      const newMetaTitle = generateMetaTitle(name);
      setMetaTitle(newMetaTitle);
      
      // Generate OG title from name
      const newOgTitle = generateOgTitle(name);
      setOgTitle(newOgTitle);
      
      // Set canonical URL
      if (newSlug) {
        setCanonicalUrl(`https://www.nextid.pk/admissions/${newSlug}`);
      }
    }
    
    // Generate meta description from merit info and note
    if (selectedInstitute) {
      const newMetaDesc = generateMetaDescription(
        meritInfo, 
        note, 
        selectedInstitute.name, 
        year
      );
      setMetaDescription(newMetaDesc);
      
      const newOgDesc = generateOgDescription(
        meritInfo, 
        note, 
        selectedInstitute.name, 
        year
      );
      setOgDescription(newOgDesc);
    }
  };

  // Watch for changes in name, meritInfo, note to update SEO
  useEffect(() => {
    updateSeoFields();
  }, [name, meritInfo, note, selectedInstitute, year, autoGenerateSeo]);

  // Handle name change - updates slug and meta title
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
  };

  // Handle manual slug override (if user wants to customize)
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(generateSlugFromName(e.target.value));
  };

  // Handle merit info change - updates meta description
  const handleMeritInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMeritInfo(e.target.value);
  };

  // Handle note change - updates meta description
  const handleNoteChange = (value: string) => {
    setNote(value);
  };

  // Fetch institutes and program offerings
  useEffect(() => {
    async function fetchData() {
      try {
        const [institutesRes, offeringsRes] = await Promise.all([
          fetch("/api/admin/institutes"),
          fetch("/api/admin/program-offerings?includePrograms=true")
        ]);
        
        const institutesData = await institutesRes.json();
        const offeringsData = await offeringsRes.json();
        
        setInstitutes(institutesData.institutes || []);
        setProgramOfferings(offeringsData.offerings || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load form data");
      } finally {
        setFetchLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter offerings when institute changes
  useEffect(() => {
    if (instituteId) {
      const filtered = programOfferings.filter(
        offering => offering.instituteId === instituteId
      );
      setFilteredOfferings(filtered);
    } else {
      setFilteredOfferings([]);
    }
  }, [instituteId, programOfferings]);

  // Update selected institute
  useEffect(() => {
    if (instituteId) {
      const institute = institutes.find(i => i.id === instituteId);
      setSelectedInstitute(institute || null);
    } else {
      setSelectedInstitute(null);
    }
  }, [instituteId, institutes]);

  // Update selected offerings list
  useEffect(() => {
    if (selectedOfferings.length > 0) {
      const offeringsList = programOfferings.filter(o => selectedOfferings.includes(o.id));
      setSelectedOfferingsList(offeringsList);
    } else {
      setSelectedOfferingsList([]);
    }
  }, [selectedOfferings, programOfferings]);

  // Handle offering selection
  const handleOfferingSelect = (offeringId: number) => {
    if (selectedOfferings.includes(offeringId)) {
      setSelectedOfferings(selectedOfferings.filter(id => id !== offeringId));
    } else {
      setSelectedOfferings([...selectedOfferings, offeringId]);
    }
  };

  const handleSelectAllOfferings = () => {
    if (selectedOfferings.length === filteredOfferings.length) {
      setSelectedOfferings([]);
    } else {
      setSelectedOfferings(filteredOfferings.map(o => o.id));
    }
  };

  // Validate slug uniqueness
  const checkSlugUniqueness = async (slug: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/admissions/check-slug?slug=${slug}`);
      const data = await res.json();
      return data.available;
    } catch (error) {
      console.error("Error checking slug:", error);
      return false;
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSingleLoading(true);
    setError(null);

    // Validations
    if (!instituteId) {
      setError("Institute is required.");
      setSingleLoading(false);
      return;
    }

    if (selectedOfferings.length === 0) {
      setError("At least one Program Offering is required.");
      setSingleLoading(false);
      return;
    }

    if (!year) {
      setError("Year is required.");
      setSingleLoading(false);
      return;
    }

    if (!name || !name.trim()) {
      setError("Admission Name is required.");
      setSingleLoading(false);
      return;
    }

    if (!slug || !slug.trim()) {
      setError("Slug is required.");
      setSingleLoading(false);
      return;
    }

    // Check slug uniqueness
    const isSlugAvailable = await checkSlugUniqueness(slug);
    if (!isSlugAvailable) {
      setError("This slug is already taken. Please use a different slug.");
      setSingleLoading(false);
      return;
    }

    const formData: AdmissionFormData = {
      name: name.trim(),
      slug: slug.toLowerCase(),
      offeringIds: selectedOfferings,
      instituteId: Number(instituteId),
      year: Number(year),
      session: session || null,
      status,
      expectedOpenDate: expectedOpenDate || null,
      expectedCloseDate: expectedCloseDate || null,
      meritInfo: meritInfo || null,
      note: note || null,
      officialLink: officialLink || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      robots: robots || "index, follow",
      ogTitle: ogTitle || null,
      ogDescription: ogDescription || null,
      ogImage: ogImage || null,
    };

    toast.loading("Creating admission...", { id: "create-admission" });

    try {
      const res = await fetch("/api/admin/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || "Failed to create admission");
      }

      if (data.success) {
        toast.success(`Admission created successfully for ${selectedOfferings.length} program(s)!`, { 
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

  // Bulk submit handler
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkLoading(true);
    
    try {
      toast.loading("Uploading admissions...", { id: "bulk-upload" });
      
      const response = await fetch("/api/admin/admissions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: bulkData }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully created ${data.count} admissions!`, { id: "bulk-upload" });
        router.push("/admin/admissions");
      } else {
        throw new Error(data.error || "Bulk upload failed");
      }
      
    } catch (error) {
      console.error("Bulk upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload", { id: "bulk-upload" });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBulkFile(file);
      setBulkFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setBulkData(content);
      };
      reader.readAsText(file);
    }
  };

  if (fetchLoading) {
    return (
      <div className={`p-6 max-w-4xl mx-auto min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex justify-center items-center h-64">
          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-4xl mx-auto min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className={`flex items-center text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <Link href="/admin" className={`${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}>
            Dashboard
          </Link>
          <span className="mx-2">›</span>
          <Link href="/admin/admissions" className={`${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}>
            Admissions
          </Link>
          <span className="mx-2">›</span>
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Create New</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Create Admission
          </h1>
          <Link
            href="/admin/admissions"
            className={`px-4 py-2 rounded-md transition-colors ${
              isDarkMode 
                ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' 
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            View All Admissions
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className={`border-b mb-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("single")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "single"
                ? isDarkMode 
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-blue-600 border-b-2 border-blue-600'
                : isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Single Admission
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "bulk"
                ? isDarkMode 
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-blue-600 border-b-2 border-blue-600'
                : isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
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
            <div className={`mb-4 border px-4 py-3 rounded ${
              isDarkMode 
                ? 'bg-red-950 border-red-800 text-red-400'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}

          <form className={`rounded-lg shadow-sm border space-y-6 p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
          }`} onSubmit={handleSingleSubmit}>
            
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

            {/* Program Offerings Selection */}
            {instituteId && (
              <div className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Select Programs * ({selectedOfferings.length} selected)
                  </label>
                  {filteredOfferings.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllOfferings}
                      className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                    >
                      {selectedOfferings.length === filteredOfferings.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>
                
                {filteredOfferings.length === 0 ? (
                  <p className={`text-sm py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No programs found for this institute
                  </p>
                ) : (
                  <div className={`grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded ${
                    isDarkMode ? 'border-gray-600' : 'border-gray-200'
                  }`}>
                    {filteredOfferings.map((offering) => (
                      <label
                        key={offering.id}
                        className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                          selectedOfferings.includes(offering.id)
                            ? isDarkMode 
                              ? 'bg-blue-900/30 border-blue-700'
                              : 'bg-blue-50 border-blue-200'
                            : isDarkMode 
                              ? 'hover:bg-gray-700'
                              : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedOfferings.includes(offering.id)}
                          onChange={() => handleOfferingSelect(offering.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                        />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {offering.programName} ({offering.degreeName})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Year and Session */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Year *
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2026"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
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

            {/* Admission Name - This generates slug and meta title */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Admission Name * 
                <span className="text-xs ml-2 text-blue-500">(Auto-generates Slug & Meta Title)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. BS Computer Science Admission 2026"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                💡 This will be used to generate the slug and meta title automatically
              </p>
            </div>

            {/* Slug Field - Auto-generated but editable */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Slug *
                <span className="text-xs ml-2 text-green-500">(Auto-generated from Name)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  /admissions/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="bs-computer-science-admission-2026"
                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                🔗 URL-friendly version. Auto-generated from name, but you can edit it manually
              </p>
            </div>

            {/* Preview URL */}
            {slug && (
              <div className={`rounded-lg p-3 ${
                isDarkMode ? 'bg-blue-950 border border-blue-800' : 'bg-blue-50 border border-blue-200'
              }`}>
                <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                  <span className="font-medium">🔍 Preview URL:</span>{' '}
                  <span className="font-mono">https://www.nextid.pk/admissions/{slug}</span>
                </p>
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
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Expected Open Date
                </label>
                <input
                  type="date"
                  value={expectedOpenDate}
                  onChange={(e) => setExpectedOpenDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            {/* Official Link */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Official Link
              </label>
              <input
                type="url"
                value={officialLink}
                onChange={(e) => setOfficialLink(e.target.value)}
                placeholder="https://university.edu.pk/admissions"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Merit Information - This generates meta description */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Merit Information
                <span className="text-xs ml-2 text-blue-500">(Used for Meta Description)</span>
              </label>
              <textarea
                value={meritInfo}
                onChange={handleMeritInfoChange}
                placeholder="e.g. Minimum 60% marks in FSc, Entry test required, Last merit was 85%"
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                💡 This will be used as the meta description for SEO (if provided)
              </p>
            </div>

            {/* Additional Notes with Rich Text Editor - Also used for meta description if merit info is empty */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Additional Notes
                <span className="text-xs ml-2 text-blue-500">(Fallback for Meta Description)</span>
              </label>
              <RichTextEditor
                value={note}
                onChange={handleNoteChange}
                placeholder="Add formatted notes, instructions, deadlines, or additional information with images..."
                minHeight={250}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                📝 This will be used as meta description if Merit Information is not provided
              </p>
            </div>

            {/* SEO Section - Preview only */}
            <details className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <summary className={`text-sm font-medium cursor-pointer ${
                isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'
              }`}>
                🔍 SEO Preview (Auto-generated)
              </summary>
              
              <div className="mt-4 space-y-4">
                {/* Auto-generate toggle */}
                <div className={`flex items-center justify-between p-2 rounded ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Auto-generate SEO from admission data
                  </span>
                  <button
                    type="button"
                    onClick={() => setAutoGenerateSeo(!autoGenerateSeo)}
                    className={`px-3 py-1 text-sm rounded ${
                      autoGenerateSeo 
                        ? isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                        : isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {autoGenerateSeo ? '✅ Auto ON' : 'Manual Mode'}
                  </button>
                </div>
                
                {/* Meta Title Preview */}
                <div className={`p-3 rounded border ${isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Meta Title (from Admission Name)
                  </label>
                  <div className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {metaTitle || 'Will be auto-generated'}
                  </div>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Length: {metaTitle.length}/60 characters
                  </p>
                </div>
                
                {/* Meta Description Preview */}
                <div className={`p-3 rounded border ${isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Meta Description (from Merit Info or Notes)
                  </label>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {metaDescription || 'Will be auto-generated from Merit Information or Notes'}
                  </div>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Length: {metaDescription.length}/160 characters
                  </p>
                </div>
                
                {/* Canonical URL */}
                <div className={`p-3 rounded border ${isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Canonical URL
                  </label>
                  <div className={`text-sm font-mono ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {canonicalUrl || 'https://www.nextid.pk/admissions/...'}
                  </div>
                </div>

                {/* Robots */}
                <div>
                  <Select
                    label="Robots"
                    value={robots}
                    onChange={(val: string) => setRobots(val)}
                    options={[
                      { value: "index, follow", label: "Index, Follow (Default)" },
                      { value: "noindex, follow", label: "No Index, Follow" },
                      { value: "index, nofollow", label: "Index, No Follow" },
                      { value: "noindex, nofollow", label: "No Index, No Follow" },
                    ]}
                  />
                </div>
                
                {/* OG Image */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Social Media Image URL (OG Image)
                  </label>
                  <input
                    type="url"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    placeholder="https://www.nextid.pk/images/og/admission-default.jpg"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Recommended size: 1200x630 pixels
                  </p>
                </div>
              </div>
            </details>

            {/* Selected Programs Summary */}
            {selectedOfferingsList.length > 0 && (
              <div className={`rounded-lg p-3 ${
                isDarkMode ? 'bg-green-950 border border-green-800' : 'bg-green-50 border border-green-200'
              }`}>
                <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                  ✅ Selected Programs ({selectedOfferingsList.length}):
                </p>
                <ul className={`text-sm list-disc list-inside ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                  {selectedOfferingsList.map(offering => (
                    <li key={offering.id}>{offering.programName} ({offering.degreeName})</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Form Actions */}
            <div className="pt-4 flex items-center gap-3">
              <PrimaryButton type="submit" disabled={singleLoading}>
                {singleLoading ? "Creating..." : "Create Admission"}
              </PrimaryButton>
              
              <Link
                href="/admin/admissions"
                className={`px-4 py-2 border rounded-md transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </Link>
            </div>
          </form>
        </>
      )}

      {/* Bulk Upload Section */}
      {activeTab === "bulk" && (
        <div className={`rounded-lg shadow-sm border p-6 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <BulkUpload
            title="Bulk Upload Admissions"
            description="Upload multiple admissions using CSV file or manual data entry"
            sampleData={[
              ["BS CS Admission 2026", "FAST NUCES", "2026", "Open", "2025-01-01", "2025-12-31"],
              ["MBA Admission 2026", "LUMS", "2026", "Expected", "2025-02-01", "2025-11-30"],
            ]}
            onDownloadSample={() => {
              const headers = ['name', 'instituteId', 'year', 'status', 'expectedOpenDate', 'expectedCloseDate'];
              const sampleRows = [
                ['BS CS Admission 2026', '5', '2026', 'Open', '2025-01-01', '2025-12-31'],
                ['MBA Admission 2026', '6', '2026', 'Expected', '2025-02-01', '2025-11-30'],
              ];
              
              const csvContent = [headers.join(','), ...sampleRows.map(row => row.join(','))].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'admissions-sample.csv';
              a.click();
            }}
            bulkData={bulkData}
            onBulkDataChange={setBulkData}
            file={bulkFile}
            fileName={bulkFileName}
            onFileChange={handleFileChange}
            onClearFile={() => {
              setBulkFile(null);
              setBulkFileName("");
              setBulkData("");
            }}
            onSubmit={handleBulkSubmit}
            onClear={() => {
              setBulkData("");
              setBulkFile(null);
              setBulkFileName("");
            }}
            loading={bulkLoading}
            itemName="Admissions"
            hideSampleButton={false}
          />
          
          {/* Help Text */}
          <div className={`mt-4 p-3 rounded-lg ${
            isDarkMode 
              ? 'bg-yellow-950 border border-yellow-800' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className={`text-xs ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
              <strong>📋 CSV Format:</strong> name, instituteId, year, status, expectedOpenDate, expectedCloseDate
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
              💡 <strong>Note:</strong> Slug will be auto-generated from name. SEO meta will be auto-generated from name and merit info.
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
              🔍 <strong>Program Offerings:</strong> After bulk upload, edit each admission to assign program offerings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
