"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/components/ui/Button";
import Select from "@/components/ui/select";
import RichTextEditor, { EditorSection } from "@/components/ui/RichTextEditor";

type Program = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  typicalDuration: string | null;
  typicalFeeRange: string | null;
};

type LinkedProgram = {
  offeringId: number;
  programId: number;
  programName: string;
  degreeName: string;
  duration: string | null;
  feeRange: string | null;
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

type LinkedOfferingItem = {
  id: number;
  programId?: number;
  program_id?: number;
  name?: string;
  programName?: string;
  degree_name?: string;
  degreeName?: string;
  duration?: string | null;
  fee_range?: string | null;
  feeRange?: string | null;
};

export default function CreateAdmissionPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [selectedOfferings, setSelectedOfferings] = useState<number[]>([]);
  const [selectedNewPrograms, setSelectedNewPrograms] = useState<number[]>([]);
  const [instituteId, setInstituteId] = useState<number | null>(null);
  const [year, setYear] = useState("");
  const [session, setSession] = useState("");
  const [status, setStatus] = useState<"Expected" | "Open" | "Closed">(
    "Expected",
  );
  const [expectedOpenDate, setExpectedOpenDate] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [meritInfo, setMeritInfo] = useState("");
  const [note, setNote] = useState("");
  const [officialLink, setOfficialLink] = useState("");

  const [manualSlug, setManualSlug] = useState("");
  const [manualMetaTitle, setManualMetaTitle] = useState("");
  const [manualMetaDescription, setManualMetaDescription] = useState("");
  const [manualCanonicalUrl, setManualCanonicalUrl] = useState("");
  const [manualOgTitle, setManualOgTitle] = useState("");
  const [manualOgDescription, setManualOgDescription] = useState("");

  const [robots, setRobots] = useState("index, follow");
  const [ogImage, setOgImage] = useState("");
  const [autoGenerateSeo, setAutoGenerateSeo] = useState(true);

  const [name, setName] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);

  const [linkedPrograms, setLinkedPrograms] = useState<LinkedProgram[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<Program[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [linkingPrograms, setLinkingPrograms] = useState(false);
  const [showAvailablePrograms, setShowAvailablePrograms] = useState(false);

  const selectedInstitute = useMemo(() => {
    if (instituteId) {
      return institutes.find((i) => i.id === instituteId) || null;
    }
    return null;
  }, [instituteId, institutes]);

  const generateSlugFromName = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const generateMetaTitle = (admissionName: string): string => {
    if (!admissionName) return "";
    const cleanName = admissionName.replace(/^Admissions Open at\s+/i, "");
    let metaTitle = `${cleanName} | NextID`;
    if (metaTitle.length > 60) {
      metaTitle = cleanName.substring(0, 50) + " | NextID";
    }
    return metaTitle;
  };

  const generateMetaDescription = (
    meritInfoVal: string,
    noteVal: string,
    instituteName: string,
    yearVal: string,
  ): string => {
    let description = "";

    if (meritInfoVal && meritInfoVal.trim()) {
      description = meritInfoVal.trim().replace(/<[^>]*>/g, "");
      if (description.length > 157) {
        description = description.substring(0, 154) + "...";
      }
    } else if (noteVal && noteVal.trim()) {
      description = noteVal.trim().replace(/<[^>]*>/g, "");
      if (description.length > 157) {
        description = description.substring(0, 154) + "...";
      }
    } else {
      description = `${instituteName} admissions for year ${yearVal}. Check eligibility criteria, merit, and apply online.`;
      if (description.length > 157) {
        description = description.substring(0, 154) + "...";
      }
    }

    return description;
  };

  const generateOgTitle = (admissionName: string): string => {
    if (!admissionName) return "";
    let ogTitle = `${admissionName} - Apply Now`;
    if (ogTitle.length > 90) {
      ogTitle = admissionName.substring(0, 80) + "...";
    }
    return ogTitle;
  };

  const generateOgDescription = (
    meritInfoVal: string,
    noteVal: string,
    instituteName: string,
    yearVal: string,
  ): string => {
    let description = "";

    if (meritInfoVal && meritInfoVal.trim()) {
      description = meritInfoVal.trim().replace(/<[^>]*>/g, "");
      if (description.length > 197) {
        description = description.substring(0, 194) + "...";
      }
    } else if (noteVal && noteVal.trim()) {
      description = noteVal.trim().replace(/<[^>]*>/g, "");
      if (description.length > 197) {
        description = description.substring(0, 194) + "...";
      }
    } else {
      description = `${instituteName} admissions ${yearVal}. Limited seats available. Apply before deadline.`;
    }

    return description;
  };

  const computedSlug = useMemo(() => {
    if (autoGenerateSeo && name) {
      return generateSlugFromName(name);
    }
    return manualSlug;
  }, [autoGenerateSeo, name, manualSlug]);

  const computedMetaTitle = useMemo(() => {
    if (autoGenerateSeo && name) {
      return generateMetaTitle(name);
    }
    return manualMetaTitle;
  }, [autoGenerateSeo, name, manualMetaTitle]);

  const computedCanonicalUrl = useMemo(() => {
    if (autoGenerateSeo && computedSlug) {
      return `https://www.nextid.pk/admissions/${computedSlug}`;
    }
    return manualCanonicalUrl;
  }, [autoGenerateSeo, computedSlug, manualCanonicalUrl]);

  const computedMetaDescription = useMemo(() => {
    if (autoGenerateSeo && selectedInstitute) {
      return generateMetaDescription(
        meritInfo,
        note,
        selectedInstitute.name,
        year,
      );
    }
    return manualMetaDescription;
  }, [
    autoGenerateSeo,
    meritInfo,
    note,
    selectedInstitute,
    year,
    manualMetaDescription,
  ]);

  const computedOgTitle = useMemo(() => {
    if (autoGenerateSeo && name) {
      return generateOgTitle(name);
    }
    return manualOgTitle;
  }, [autoGenerateSeo, name, manualOgTitle]);

  const computedOgDescription = useMemo(() => {
    if (autoGenerateSeo && selectedInstitute) {
      return generateOgDescription(
        meritInfo,
        note,
        selectedInstitute.name,
        year,
      );
    }
    return manualOgDescription;
  }, [
    autoGenerateSeo,
    meritInfo,
    note,
    selectedInstitute,
    year,
    manualOgDescription,
  ]);

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };
    checkTheme();
    const observer = new MutationObserver(() => checkTheme());
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualSlug(generateSlugFromName(e.target.value));
  };

  const handleMetaTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualMetaTitle(e.target.value);
  };

  const handleMetaDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setManualMetaDescription(e.target.value);
  };

  const handleCanonicalUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualCanonicalUrl(e.target.value);
  };

  const handleOgTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualOgTitle(e.target.value);
  };

  const handleOgDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setManualOgDescription(e.target.value);
  };

  const handleMeritInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMeritInfo(e.target.value);
  };


const handleNoteChange = (value: string | any) => {
  if (typeof value === 'string') {
    setNote(value);
  } else {
    try {
      const textValue = JSON.stringify(value);
      setNote(textValue);
    } catch {
      setNote('');
    }
  }
};

  useEffect(() => {
    async function fetchData() {
      try {
        const institutesRes = await fetch("/api/admin/institutes");
        const institutesData = await institutesRes.json();
        setInstitutes(institutesData.institutes || []);
      } catch {
        toast.error("Failed to load form data");
      } finally {
        setFetchLoading(false);
      }
    }
    fetchData();
  }, []);

  const fetchInstitutePrograms = useCallback(async (instId: number) => {
    if (!instId) {
      setLinkedPrograms([]);
      setAvailablePrograms([]);
      return;
    }

    setLoadingPrograms(true);
    try {
      // 1. Fetch LINKED programs (offerings) for this institute
      const linkedRes = await fetch(`/api/admin/program_offerings/by-institute/${instId}`);
      const linkedData = await linkedRes.json();

      console.log("🔗 Linked API Response:", linkedData);

      // Get linked programs from API
      const linkedOfferings = linkedData.offerings || linkedData.programs || [];

      // ✅ FIXED: Using LinkedOfferingItem type instead of any
      const linked = linkedOfferings.map((item: LinkedOfferingItem) => ({
        offeringId: item.id,
        programId: item.programId ?? item.program_id ?? 0,
        programName: item.programName ?? item.name ?? "Unknown",
        degreeName: item.degreeName ?? item.degree_name ?? "BS",
        duration: item.duration,
        feeRange: item.feeRange ?? item.fee_range,
      }));

      setLinkedPrograms(linked);

      // 2. Fetch ALL programs
      const allProgramsRes = await fetch("/api/admin/programs");
      const allProgramsData = await allProgramsRes.json();
      const allPrograms = allProgramsData.programs || [];

      // 3. Get IDs of programs that are ALREADY linked
      // ✅ FIXED: Added proper type for p
      const linkedProgramIds = linked.map((l: LinkedProgram) => l.programId);

      console.log("📋 Linked Program IDs:", linkedProgramIds);
      console.log(
        "📋 All Program IDs:",
        allPrograms.map((p: Program) => p.id),
      );

      // 4. Show ONLY unlinked programs in Available section
      // ✅ FIXED: Changed let to const and added proper type
      const unlinkedPrograms = allPrograms.filter(
        (p: Program) => !linkedProgramIds.includes(p.id),
      );

      // ✅ DEBUG: If no unlinked programs found but all programs exist, show all for testing
      if (unlinkedPrograms.length === 0 && allPrograms.length > 0) {
        console.log("⚠️ No unlinked programs found! This means all programs are already linked to this institute.");
        console.log("💡 To see Available Programs section, select an institute that has fewer linked programs.");
      }

      console.log(
        "✅ Unlinked Program IDs:",
        unlinkedPrograms.map((p: Program) => p.id),
      );

      setAvailablePrograms(unlinkedPrograms);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast.error("Failed to load programs");
      setLinkedPrograms([]);
      setAvailablePrograms([]);
    } finally {
      setLoadingPrograms(false);
    }
  }, []);

  
  const handleInstituteChange = (val: number) => {
    setInstituteId(val);
    setSelectedOfferings([]);
    setSelectedNewPrograms([]);
    setShowAvailablePrograms(false);
    if (val) {
      fetchInstitutePrograms(val);
    } else {
      setLinkedPrograms([]);
      setAvailablePrograms([]);
    }
  };

  const handleLinkedProgramSelect = (offeringId: number) => {
    setSelectedOfferings((prev) =>
      prev.includes(offeringId)
        ? prev.filter((id) => id !== offeringId)
        : [...prev, offeringId],
    );
  };

  const handleSelectAllLinked = () => {
    if (selectedOfferings.length === linkedPrograms.length) {
      setSelectedOfferings([]);
    } else {
      setSelectedOfferings(linkedPrograms.map((p) => p.offeringId));
    }
  };

  const handleNewProgramSelect = (programId: number) => {
    setSelectedNewPrograms((prev) =>
      prev.includes(programId)
        ? prev.filter((id) => id !== programId)
        : [...prev, programId],
    );
  };

  const handleSelectAllNew = () => {
    if (selectedNewPrograms.length === availablePrograms.length) {
      setSelectedNewPrograms([]);
    } else {
      setSelectedNewPrograms(availablePrograms.map((p) => p.id));
    }
  };

  const handleLinkNewPrograms = async () => {
    if (selectedNewPrograms.length === 0) {
      toast.error("Please select programs to link");
      return;
    }

    setLinkingPrograms(true);
    toast.loading(`Linking ${selectedNewPrograms.length} program(s)...`);

    try {
      await Promise.all(
        selectedNewPrograms.map(async (programId) => {
          const res = await fetch("/api/admin/program_offerings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              programId: programId,
              degreeId: 1,
              instituteId: instituteId,
              status: true,
            }),
          });
          if (!res.ok) throw new Error("Failed to link");
          return res.json();
        }),
      );

      toast.success(
        `${selectedNewPrograms.length} program(s) linked successfully!`,
      );

      if (instituteId) {
        await fetchInstitutePrograms(instituteId);
      }

      setSelectedNewPrograms([]);
      setShowAvailablePrograms(false);
    } catch {
      toast.error("Failed to link programs");
    } finally {
      setLinkingPrograms(false);
    }
  };

  const generateUniqueSlug = async (
    baseSlug: string,
  ): Promise<{ uniqueSlug: string; wasChanged: boolean }> => {
    let slug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      try {
        const res = await fetch(
          `/api/admin/admissions/check-slug?slug=${slug}`,
        );
        const data = await res.json();
        if (data.available) {
          isUnique = true;
        } else {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      } catch {
        slug = `${baseSlug}-${Date.now()}`;
        isUnique = true;
      }
    }
    return { uniqueSlug: slug, wasChanged: slug !== baseSlug };
  };

  const handleSingleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSingleLoading(true);
    setFormError(null);

    if (!instituteId) {
      setFormError("Institute is required.");
      setSingleLoading(false);
      return;
    }

    if (selectedOfferings.length === 0) {
      setFormError("At least one Program is required.");
      setSingleLoading(false);
      return;
    }

    if (!year) {
      setFormError("Year is required.");
      setSingleLoading(false);
      return;
    }

    if (!name || !name.trim()) {
      setFormError("Admission Name is required.");
      setSingleLoading(false);
      return;
    }

    const finalSlug = computedSlug;
    if (!finalSlug || !finalSlug.trim()) {
      setFormError("Slug is required.");
      setSingleLoading(false);
      return;
    }

    const { uniqueSlug, wasChanged } = await generateUniqueSlug(finalSlug);

    if (wasChanged) {
      toast.warning(`Slug changed to "${uniqueSlug}"`);
      if (!autoGenerateSeo) setManualSlug(uniqueSlug);
    }

    const formData: AdmissionFormData = {
      name: name.trim(),
      slug: uniqueSlug,
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
      metaTitle: computedMetaTitle || null,
      metaDescription: computedMetaDescription || null,
      canonicalUrl: computedCanonicalUrl || null,
      robots: robots || "index, follow",
      ogTitle: computedOgTitle || null,
      ogDescription: computedOgDescription || null,
      ogImage: ogImage || null,
    };

    try {
      const res = await fetch("/api/admin/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || data.details || "Failed to create admission",
        );
      }

      if (data.success) {
        toast.success("Admission created successfully!");
        router.push("/admin/admissions");
        router.refresh();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create admission",
      );
      setFormError(
        err instanceof Error ? err.message : "Failed to create admission",
      );
    } finally {
      setSingleLoading(false);
    }
  };

  const checkSlugAvailability = async () => {
    if (!computedSlug) {
      toast.error("Please enter admission name first");
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/admissions/check-slug?slug=${computedSlug}`,
      );
      const data = await res.json();

      if (data.available) {
        toast.success(`✓ "${computedSlug}" is available!`);
      } else {
        toast.error(`✗ "${computedSlug}" is already taken.`);
      }
    } catch {
      toast.error("Failed to check slug availability");
    }
  };

  if (fetchLoading) {
    return (
      <div
        className={`p-6 max-w-4xl mx-auto min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <div className="flex justify-center items-center h-64">
          <div className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 max-w-4xl mx-auto min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <div className="mb-6">
        <div
          className={`flex items-center text-sm mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          <Link
            href="/admin"
            className={
              isDarkMode ? "hover:text-blue-400" : "hover:text-blue-600"
            }
          >
            Dashboard
          </Link>
          <span className="mx-2">›</span>
          <Link
            href="/admin/admissions"
            className={
              isDarkMode ? "hover:text-blue-400" : "hover:text-blue-600"
            }
          >
            Admissions
          </Link>
          <span className="mx-2">›</span>
          <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
            Create New
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1
            className={`text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            Create Admission
          </h1>
          <Link
            href="/admin/admissions"
            className={`px-4 py-2 rounded-md ${isDarkMode ? "bg-blue-900 text-blue-300 hover:bg-blue-800" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
          >
            View All Admissions
          </Link>
        </div>
      </div>

      {formError && (
        <div
          className={`mb-4 border px-4 py-3 rounded ${isDarkMode ? "bg-red-950 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-700"}`}
        >
          {formError}
        </div>
      )}

      <form
        className={`rounded-lg shadow-sm border space-y-6 p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"}`}
        onSubmit={handleSingleSubmit}
      >
        <Select
          label="Institute *"
          value={instituteId ?? 0}
          onChange={handleInstituteChange}
          options={[
            { value: 0, label: "Select Institute" },
            ...institutes.map((i) => ({
              value: i.id,
              label: `${i.name} (${i.cityName})`,
            })),
          ]}
          required
        />

        {loadingPrograms && instituteId && (
          <div className="text-center py-4">
            <div
              className={`animate-spin rounded-full h-6 w-6 border-b-2 mx-auto ${isDarkMode ? "border-blue-400" : "border-blue-600"}`}
            ></div>
            <p className="text-sm mt-2">Loading programs...</p>
          </div>
        )}

        {/* Linked Programs Section */}
        {instituteId && !loadingPrograms && linkedPrograms.length > 0 && (
          <div
            className={`border rounded-lg p-4 ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <label
                className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                ✅ Linked Programs ({selectedOfferings.length} selected)
              </label>
              <button
                type="button"
                onClick={handleSelectAllLinked}
                className={`text-sm ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
              >
                {selectedOfferings.length === linkedPrograms.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
            <div
              className={`grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
            >
              {linkedPrograms.map((program, idx) => (
                <label
                  key={`linked-${program.offeringId}-${idx}`}
                  className={`flex items-center p-2 rounded cursor-pointer border ${selectedOfferings.includes(program.offeringId) ? (isDarkMode ? "bg-blue-900/30 border-blue-700" : "bg-blue-50 border-blue-200") : isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedOfferings.includes(program.offeringId)}
                    onChange={() =>
                      handleLinkedProgramSelect(program.offeringId)
                    }
                    className="mr-2"
                  />
                  <div>
                    <span
                      className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {program.programName}
                    </span>
                    <span
                      className={`text-xs ml-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      ({program.degreeName})
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Available Programs Section with Toggle */}
        {instituteId && !loadingPrograms && availablePrograms.length > 0 && (
          <div
            className={`border rounded-lg p-4 ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
          >
            <button
              type="button"
              onClick={() => setShowAvailablePrograms(!showAvailablePrograms)}
              className={`w-full flex items-center justify-between p-2 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
            >
              <span>
                📌 Available Programs to Link ({availablePrograms.length}{" "}
                unlinked)
              </span>
              <span>{showAvailablePrograms ? "▲" : "▼"}</span>
            </button>

            {showAvailablePrograms && (
              <>
                <div className="flex justify-between mt-4 mb-2">
                  <button
                    type="button"
                    onClick={handleSelectAllNew}
                    className={`text-sm ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                  >
                    {selectedNewPrograms.length === availablePrograms.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  <button
                    type="button"
                    onClick={handleLinkNewPrograms}
                    disabled={
                      linkingPrograms || selectedNewPrograms.length === 0
                    }
                    className={`px-3 py-1 text-sm rounded ${linkingPrograms || selectedNewPrograms.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 text-white"}`}
                  >
                    {linkingPrograms
                      ? "Linking..."
                      : `Link ${selectedNewPrograms.length} Program(s)`}
                  </button>
                </div>
                <div
                  className={`grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
                >
                  {availablePrograms.map((program, idx) => (
                    <label
                      key={`available-${program.id}-${idx}`}
                      className={`flex items-center p-2 rounded cursor-pointer border ${selectedNewPrograms.includes(program.id) ? (isDarkMode ? "bg-green-900/30 border-green-700" : "bg-green-50 border-green-200") : isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedNewPrograms.includes(program.id)}
                        onChange={() => handleNewProgramSelect(program.id)}
                        className="mr-2"
                      />
                      <span
                        className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {program.name}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ✅ Message when no available programs */}
        {instituteId && !loadingPrograms && linkedPrograms.length > 0 && availablePrograms.length === 0 && (
          <div className={`text-center py-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              ✅ All programs are already linked to this institute.
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              No programs available to link.
            </p>
          </div>
        )}

        {/* Year and Session */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Year *
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
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

        {/* Admission Name */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Admission Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
            required
          />
        </div>

        {/* Slug Field */}
        <div>
          <div className="flex justify-between mb-1">
            <label
              className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Slug *
            </label>
            <button
              type="button"
              onClick={checkSlugAvailability}
              className="text-xs text-blue-500"
            >
              Check availability
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">/admissions/</span>
            {autoGenerateSeo ? (
              <input
                type="text"
                value={computedSlug}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md bg-gray-100"
              />
            ) : (
              <input
                type="text"
                value={manualSlug}
                onChange={handleSlugChange}
                className="flex-1 px-3 py-2 border rounded-md"
              />
            )}
          </div>
        </div>

        {/* Status */}
        <Select
          label="Status *"
          value={status}
          onChange={(val) => setStatus(val as "Expected" | "Open" | "Closed")}
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
            <label
              className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Expected Open Date
            </label>
            <input
              type="date"
              value={expectedOpenDate}
              onChange={(e) => setExpectedOpenDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
            />
          </div>
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Expected Close Date
            </label>
            <input
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
            />
          </div>
        </div>

        {/* Official Link */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Official Link
          </label>
          <input
            type="url"
            value={officialLink}
            onChange={(e) => setOfficialLink(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
          />
        </div>

        {/* Merit Information */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Merit Information
          </label>
          <textarea
            value={meritInfo}
            onChange={handleMeritInfoChange}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
          />
        </div>

        {/* Additional Notes */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Additional Notes
          </label>
          <RichTextEditor
            value={note}
            onChange={handleNoteChange}
            minHeight={150}
          />
        </div>

        {/* SEO Section */}
        <details
          className={`border rounded-lg p-4 ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}
        >
          <summary
            className={`text-sm font-medium cursor-pointer ${isDarkMode ? "text-gray-300 hover:text-blue-400" : "text-gray-700 hover:text-blue-600"}`}
          >
            🔍 SEO Settings
          </summary>

          <div className="mt-4 space-y-4">
            <div
              className={`flex items-center justify-between p-2 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
            >
              <span
                className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Auto-generate SEO from admission data
              </span>
              <button
                type="button"
                onClick={() => setAutoGenerateSeo(!autoGenerateSeo)}
                className={`px-3 py-1 text-sm rounded ${autoGenerateSeo ? (isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-700") : isDarkMode ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-700"}`}
              >
                {autoGenerateSeo ? "✅ Auto ON" : "Manual Mode"}
              </button>
            </div>

            {autoGenerateSeo ? (
              <>
                <div
                  className={`p-3 rounded border ${isDarkMode ? "border-gray-600 bg-gray-700/50" : "border-gray-200 bg-gray-50"}`}
                >
                  <label
                    className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Meta Title (Auto-generated)
                  </label>
                  <div
                    className={`text-sm ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                  >
                    {computedMetaTitle || "Will be auto-generated"}
                  </div>
                  <p
                    className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                  >
                    Length: {computedMetaTitle.length}/60 characters
                  </p>
                </div>
                <div
                  className={`p-3 rounded border ${isDarkMode ? "border-gray-600 bg-gray-700/50" : "border-gray-200 bg-gray-50"}`}
                >
                  <label
                    className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Meta Description (Auto-generated)
                  </label>
                  <div
                    className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    {computedMetaDescription || "Will be auto-generated"}
                  </div>
                  <p
                    className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                  >
                    Length: {computedMetaDescription.length}/160 characters
                  </p>
                </div>
                <div
                  className={`p-3 rounded border ${isDarkMode ? "border-gray-600 bg-gray-700/50" : "border-gray-200 bg-gray-50"}`}
                >
                  <label
                    className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Canonical URL (Auto-generated)
                  </label>
                  <div
                    className={`text-sm font-mono ${isDarkMode ? "text-green-400" : "text-green-600"}`}
                  >
                    {computedCanonicalUrl || "Will be auto-generated"}
                  </div>
                </div>
                <div
                  className={`p-3 rounded border ${isDarkMode ? "border-gray-600 bg-gray-700/50" : "border-gray-200 bg-gray-50"}`}
                >
                  <label
                    className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    OG Title (Auto-generated)
                  </label>
                  <div
                    className={`text-sm ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}
                  >
                    {computedOgTitle || "Will be auto-generated"}
                  </div>
                </div>
                <div
                  className={`p-3 rounded border ${isDarkMode ? "border-gray-600 bg-gray-700/50" : "border-gray-200 bg-gray-50"}`}
                >
                  <label
                    className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    OG Description (Auto-generated)
                  </label>
                  <div
                    className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    {computedOgDescription || "Will be auto-generated"}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={manualMetaTitle}
                    onChange={handleMetaTitleChange}
                    className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Meta Description
                  </label>
                  <textarea
                    value={manualMetaDescription}
                    onChange={handleMetaDescriptionChange}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Canonical URL
                  </label>
                  <input
                    type="url"
                    value={manualCanonicalUrl}
                    onChange={handleCanonicalUrlChange}
                    className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    OG Title
                  </label>
                  <input
                    type="text"
                    value={manualOgTitle}
                    onChange={handleOgTitleChange}
                    className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    OG Description
                  </label>
                  <textarea
                    value={manualOgDescription}
                    onChange={handleOgDescriptionChange}
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  />
                </div>
              </>
            )}

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

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Social Media Image URL (OG Image)
              </label>
              <input
                type="url"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="https://www.nextid.pk/images/og/admission-default.jpg"
                className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
              />
              <p
                className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Recommended size: 1200x630 pixels
              </p>
            </div>
          </div>
        </details>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <PrimaryButton type="submit" disabled={singleLoading}>
            {singleLoading ? "Creating..." : "Create Admission"}
          </PrimaryButton>
          <Link
            href="/admin/admissions"
            className={`px-4 py-2 border rounded-md ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}