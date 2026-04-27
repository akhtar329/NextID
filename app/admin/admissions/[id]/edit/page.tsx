// app/admin/admissions/[id]/edit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Select from "@/app/component/ui/select";
import RichTextEditor from "@/app/component/ui/RichTextEditor";

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

type SeoData = {
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
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
  programs: Program[];
  instituteId: number;
  institute: Institute;
  seo?: SeoData;
};

export default function EditAdmissionPage() {
  const router = useRouter();
  const params = useParams();
  const admissionId = params.id as string;

  // Form states
  const [selectedPrograms, setSelectedPrograms] = useState<number[]>([]);
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
  
  // Name and Slug states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [manualName, setManualName] = useState(false);
  const [originalSlug, setOriginalSlug] = useState("");

  // Data states
  const [programs, setPrograms] = useState<Program[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
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

  // Auto-generate SEO meta
  const generateSeoMeta = () => {
    if (!autoGenerateSeo) return;
    
    if (selectedInstitute && year && name) {
      const sessionText = session ? ` ${session}` : '';
      const instituteName = selectedInstitute.name;
      
      // Generate slug for canonical URL
      const cleanInstituteName = selectedInstitute.name
        .replace(/University|College|Institute|of|the|and|&/gi, '')
        .trim();
      const sessionSlug = session ? `-${session.toLowerCase()}` : '';
      const slugBase = `admissions-open-at-${cleanInstituteName}${sessionSlug}-${year}`;
      const generatedSlug = generateSlug(slugBase);
      
      // Meta Title (under 60 chars)
      let generatedTitle = `${instituteName} Admission ${year}`;
      if (generatedTitle.length > 55) {
        generatedTitle = instituteName.substring(0, 40) + ` Admission ${year}`;
      }
      setMetaTitle(generatedTitle + " | NextID");
      
      // Meta Description (under 160 chars)
      const programsList = selectedProgramsList.map(p => p.name).slice(0, 3).join(", ");
      const programText = programsList ? ` Programs: ${programsList}.` : "";
      let generatedDesc = `${instituteName}${sessionText} admission ${year} is open. Check last date, eligibility criteria${programText} fee structure and apply online.`;
      if (generatedDesc.length > 155) {
        generatedDesc = generatedDesc.substring(0, 152) + "...";
      }
      setMetaDescription(generatedDesc);
      
      // Canonical URL
      setCanonicalUrl(`https://www.nextid.pk/admissions/${generatedSlug}`);
      
      // OG Title
      setOgTitle(`${instituteName} Admission ${year} - Apply Now`);
      
      // OG Description
      setOgDescription(`${instituteName}${sessionText} admission ${year}. Limited seats available. Apply before deadline.`);
    }
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

  // Auto-generate name when institute/year/programs change
  useEffect(() => {
    if (selectedInstitute && year && selectedProgramsList.length > 0 && !manualName) {
      const sessionText = session ? ` ${session}` : '';
      const generatedName = `Admissions Open at ${selectedInstitute.name}${sessionText} ${year}`;
      
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

  // Auto-generate SEO when name/slug/institute changes
  useEffect(() => {
    if (name && slug && selectedInstitute) {
      generateSeoMeta();
    }
  }, [name, slug, selectedInstitute, year, session, selectedProgramsList, autoGenerateSeo]);

  // Handle program selection
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

        // Fetch admission details (including SEO)
        const admissionRes = await fetch(`/api/admin/admissions/${admissionId}`);
        const admissionData = await admissionRes.json();
        
        if (admissionData.success && admissionData.admission) {
          const ad: Admission = admissionData.admission;
          
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
          setName(ad.name || "");
          setSlug(ad.slug || "");
          setOriginalSlug(ad.slug || "");
          
          // ✅ Set SEO data if exists
          if (ad.seo) {
            setMetaTitle(ad.seo.metaTitle || "");
            setMetaDescription(ad.seo.metaDescription || "");
            setCanonicalUrl(ad.seo.canonicalUrl || "");
            setRobots(ad.seo.robots || "index, follow");
            setOgTitle(ad.seo.ogTitle || "");
            setOgDescription(ad.seo.ogDescription || "");
            setOgImage(ad.seo.ogImage || "");
            setAutoGenerateSeo(false); // Disable auto if existing SEO data
          }
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
          programIds: selectedPrograms,
          instituteId: Number(instituteId),
          year: Number(year),
          session: session || null,
          status,
          expectedOpenDate: expectedOpenDate || null,
          expectedCloseDate: expectedCloseDate || null,
          meritInfo: meritInfo || null,
          note: note || null,
          officialLink: officialLink || null,
          // ✅ SEO fields
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          canonicalUrl: canonicalUrl || null,
          robots: robots || "index, follow",
          ogTitle: ogTitle || null,
          ogDescription: ogDescription || null,
          ogImage: ogImage || null,
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

        {/* SEO Section - Collapsible */}
        <details className="border rounded-lg p-4">
          <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-blue-600">
            🔍 SEO Settings (Optional - Auto-generated)
          </summary>
          
          <div className="mt-4 space-y-4">
            {/* Auto-generate toggle */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Auto-generate SEO from admission data</span>
              <button
                type="button"
                onClick={() => setAutoGenerateSeo(!autoGenerateSeo)}
                className={`px-3 py-1 text-sm rounded ${
                  autoGenerateSeo 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {autoGenerateSeo ? '✅ Auto ON' : 'Manual Mode'}
              </button>
            </div>
            
            {/* Meta Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Title
                <span className="text-xs text-gray-500 ml-2">(50-60 chars recommended)</span>
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="SEO title for search engines"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={70}
              />
              <p className="text-xs text-gray-500 mt-1">
                {metaTitle.length}/70 characters
              </p>
            </div>
            
            {/* Meta Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
                <span className="text-xs text-gray-500 ml-2">(155-160 chars recommended)</span>
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="SEO description for search results"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={170}
              />
              <p className="text-xs text-gray-500 mt-1">
                {metaDescription.length}/170 characters
              </p>
            </div>
            
            {/* Canonical URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Canonical URL
              </label>
              <input
                type="url"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://www.nextid.pk/admissions/slug"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Robots */}
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
            
            {/* OG Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Social Media Title (OG Title)
              </label>
              <input
                type="text"
                value={ogTitle}
                onChange={(e) => setOgTitle(e.target.value)}
                placeholder="Title for Facebook/WhatsApp sharing"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* OG Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Social Media Description (OG Description)
              </label>
              <textarea
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
                placeholder="Description for Facebook/WhatsApp sharing"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* OG Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Social Media Image URL (OG Image)
              </label>
              <input
                type="url"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="https://www.nextid.pk/images/og/admission-default.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended size: 1200x630 pixels
              </p>
            </div>
          </div>
        </details>

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
              <span className="font-mono">https://www.nextid.pk/admissions/{slug}</span>
            </p>
            {slug !== originalSlug && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ Slug changed. Page will redirect to new URL after update.
              </p>
            )}
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

        {/* Additional Notes with Rich Text Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
            <span className="text-xs text-gray-500 ml-2">
              (Supports HTML formatting - bold, italic, lists, links, headings)
            </span>
          </label>
          <RichTextEditor
            value={note}
            onChange={setNote}
            placeholder="Add formatted notes, instructions, deadlines, or additional information..."
            minHeight={200}
          />
        </div>

        {/* Form Actions */}
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