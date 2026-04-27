"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Input from "@/app/component/ui/Input";
import Select from "@/app/component/ui/select";
import BulkUpload from "@/app/component/ui/BulkUpload";
import { useBulkUpload, BulkItem } from "@/app/hooks/useBulkUpload";

// -------------------- TYPES --------------------
type Board = {
  id: number;
  name: string;
  slug: string;
  cityId: number;
  cityName?: string;
};

type University = {
  id: number;
  name: string;
  slug: string;
  type: string;
  cityName: string;
};

interface ResultBulkItem extends BulkItem {
  boardId?: number;
  universityId?: number;
  year: number;
  resultDate?: string;
  officialLink?: string;
  isPopular: boolean;
}

// -------------------- SIMPLE SLUG GENERATOR  --------------------

const generateSimpleSlug = (title: string, year?: string): string => {
  
  let cleanTitle = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  
  // Fix spelling mistakes
  const corrections: Record<string, string> = {
    'anual': 'annual',
    'reslut': 'result',
  };
  
  Object.keys(corrections).forEach(wrong => {
    cleanTitle = cleanTitle.replace(new RegExp(wrong, 'g'), corrections[wrong]);
  });
  
  if (cleanTitle.includes('result')) {
    return year ? `${cleanTitle}-${year}` : cleanTitle;
  }
  
  return year ? `${cleanTitle}-result-${year}` : `${cleanTitle}-result`;
};

// -------------------- PAGE COMPONENT --------------------
export default function CreateResultPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Single Result States
  const [title, setTitle] = useState("");
  const [resultType, setResultType] = useState<"board" | "university" | "other">("board");
  const [boardId, setBoardId] = useState<number | null>(null);
  const [universityId, setUniversityId] = useState<number | null>(null);
  const [year, setYear] = useState("");
  const [resultDate, setResultDate] = useState("");
  const [officialLink, setOfficialLink] = useState("");
  const [isPopular, setIsPopular] = useState(false);
  const [status, setStatus] = useState(true);
  const [singleLoading, setSingleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Name and Slug states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [manualSlug, setManualSlug] = useState(false);

  // Data states
  const [boards, setBoards] = useState<Board[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Selected items for preview
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);

  // ✅ Auto-generate slug from title + year only
  useEffect(() => {
    if (title && year && !manualSlug) {
      // Generate slug from title + year only
      const generatedSlug = generateSimpleSlug(title, year);
      setSlug(generatedSlug);
      
      // Generate display name (for UI only, not saved in DB)
      let boardName = "";
      if (resultType === "board" && selectedBoard) {
        boardName = selectedBoard.name;
      } else if (resultType === "university" && selectedUniversity) {
        boardName = selectedUniversity.name;
      }
      
      let generatedName = title;
      if (boardName) {
        generatedName = `${title} - ${boardName} Result ${year}`;
      } else {
        generatedName = `${title} Result ${year}`;
      }
      setName(generatedName);
    }
  }, [title, year, resultType, selectedBoard, selectedUniversity, manualSlug]);

  // ✅ Handle manual slug change
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
    setManualSlug(true);
  };

  // ✅ Reset manual flag
  useEffect(() => {
    setManualSlug(false);
  }, [title, year, resultType, boardId, universityId]);

  // Update selected board
  useEffect(() => {
    if (boardId) {
      const board = boards.find(b => b.id === boardId);
      setSelectedBoard(board || null);
    } else {
      setSelectedBoard(null);
    }
  }, [boardId, boards]);

  // Update selected university
  useEffect(() => {
    if (universityId) {
      const uni = universities.find(u => u.id === universityId);
      setSelectedUniversity(uni || null);
    } else {
      setSelectedUniversity(null);
    }
  }, [universityId, universities]);

  // -------------------- CSV PARSER --------------------
  const parseResultsCSV = (text: string): BulkItem[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (!lines.length) return [];

    const firstLine = lines[0].toLowerCase();
    const hasHeaders = firstLine.includes("title") || firstLine.includes("year");

    let startIndex = 0;
    let headers: string[] = [];

    if (hasHeaders) {
      headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      startIndex = 1;
    } else {
      headers = ["title","type","boardid","universityid","year","resultdate","officiallink","ispopular","status"];
    }

    const items: BulkItem[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("<")) continue;

      const values = line.split(",").map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((header, idx) => obj[header] = values[idx] || "");

      const title = obj.title || obj.name || "";
      const type = obj.type || "board";
      const boardId = parseInt(obj.boardid || obj.board_id || "0");
      const universityId = parseInt(obj.universityid || obj.university_id || "0");
      const year = parseInt(obj.year || "0");
      const resultDate = obj.resultdate || obj.date || "";
      const officialLink = obj.officiallink || obj.link || "";
      const displayOrder = parseInt(obj.displayorder || "0") || 0;
      const isPopular = obj.ispopular === "true" || obj.popular === "true" || false;
      const status = obj.status === "false" ? false : true;

      if (title && year) {
        // Generate slug from title + year only
        const generatedSlug = generateSimpleSlug(title, year.toString());

        const item: any = {
          name: title,
          slug: generatedSlug,
          title,
          year,
          resultDate,
          officialLink,
          displayOrder,
          isPopular,
          status,
        };

        if (type === "board" && boardId) item.boardId = boardId;
        if (type === "university" && universityId) item.universityId = universityId;

        items.push(item);
      }
    }

    return items;
  };

  const transformBulkItems = (items: BulkItem[]) => {
    return items.map(item => ({
      name: (item as any).name,
      slug: (item as any).slug,
      title: (item as any).title,
      boardId: (item as any).boardId,
      universityId: (item as any).universityId,
      year: (item as any).year,
      resultDate: (item as any).resultDate,
      officialLink: (item as any).officialLink,
      isPopular: (item as any).isPopular,
      status: item.status,
    }));
  };

  // -------------------- BULK UPLOAD HOOK --------------------
  const bulkUpload = useBulkUpload({
    apiEndpoint: "/api/admin/results/bulk",
    redirectPath: "/admin/results",
    itemName: "results",
    generateSlug: (text: string) => {
      // For bulk upload, extract year from text or use current year
      const yearMatch = text.match(/\b(20\d{2})\b/);
      const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
      return generateSimpleSlug(text, year);
    },
    customParse: parseResultsCSV,
  });

  // -------------------- FETCH BOARDS & UNIVERSITIES --------------------
  useEffect(() => {
    async function fetchData() {
      try {
        const boardsRes = await fetch("/api/admin/boards");
        const boardsData = await boardsRes.json();

        const unisRes = await fetch("/api/admin/institutes");
        const unisData = await unisRes.json();

        setBoards(boardsData.boards || []);
        const uniList = (unisData.institutes || []).filter((inst: University) =>
          inst.type === "University" || inst.name.toLowerCase().includes("university")
        );
        setUniversities(uniList);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      } finally {
        setFetchLoading(false);
      }
    }
    fetchData();
  }, []);

  // -------------------- SINGLE RESULT SUBMIT --------------------
  const handleSingleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSingleLoading(true);
    setError(null);

    if (!title || !year) {
      setError("Title and Year are required.");
      setSingleLoading(false);
      return;
    }

    if (resultType === "board" && !boardId) {
      setError("Please select a board");
      setSingleLoading(false);
      return;
    }

    if (resultType === "university" && !universityId) {
      setError("Please select a university");
      setSingleLoading(false);
      return;
    }

    if (!slug) {
      setError("Slug is required.");
      setSingleLoading(false);
      return;
    }

    toast.loading("Creating result...", { id: "create-result" });

    try {
      const requestBody: any = {
        title: title.trim(),
        slug: slug.trim(),           // ✅ Slug from title + year only
        year: Number(year),
        resultDate: resultDate || null,
        officialLink: officialLink.trim() || null,
        isPopular,
        status,
      };

      if (resultType === "board") requestBody.boardId = boardId;
      if (resultType === "university") requestBody.universityId = universityId;

      const res = await fetch("/api/admin/results/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || data.details || "Failed to create result");

      if (data.success) {
        toast.success("Result created successfully!", { id: "create-result", duration: 3000 });
        router.push("/admin/results");
      } else throw new Error(data.error || "Failed to create result");

    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to create result", { id: "create-result" });
      setError(err instanceof Error ? err.message : "Failed to create result");
    } finally {
      setSingleLoading(false);
    }
  };

  // -------------------- DOWNLOAD SAMPLE --------------------
  const downloadSample = () => {
    const headers = ["title","type","boardId","universityId","year","resultDate","officialLink","isPopular","status"];
    const sampleData = [
      ["Matric Annual","board","1","","2025","2025-07-15","https://bise.edu.pk/result","true","true"],
      ["FA Annual","board","2","","2025","2025-08-20","https://bise.edu.pk/fa-result","false","true"],
      ["BA Result","university","","3","2027","2027-09-10","https://university.edu.pk/result","true","true"]
    ];

    const csvContent = [headers.join(","), ...sampleData.map(row => row.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download","results-sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Sample CSV downloaded");
  };

  // -------------------- RENDER --------------------
  if (fetchLoading) return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-center items-center h-64 text-gray-500">Loading data...</div>
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/admin" className="hover:text-blue-600">Dashboard</Link>
          <span className="mx-2">›</span>
          <Link href="/admin/results" className="hover:text-blue-600">Results</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">Create New</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Create Result</h1>
          <Link
            href="/admin/results"
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
          >
            View All Results
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6 flex gap-4">
        <button onClick={() => setActiveTab("single")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab==="single"?"text-blue-600 border-b-2 border-blue-600":"text-gray-500 hover:text-gray-700"}`}>Single Result</button>
        <button onClick={() => setActiveTab("bulk")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab==="bulk"?"text-blue-600 border-b-2 border-blue-600":"text-gray-500 hover:text-gray-700"}`}>Bulk Upload</button>
      </div>

      {/* Single Form */}
      {activeTab==="single" && (
        <>
          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
          <form className="bg-white p-6 rounded-lg shadow-sm border space-y-4" onSubmit={handleSingleSubmit}>
            {/* Result Title */}
            <Input 
              label="Result Title *" 
              value={title} 
              onChange={setTitle} 
              placeholder="e.g. Matric Annual Result" 
              required 
            />

            {/* Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Result Type *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={resultType==="board"} onChange={()=>{setResultType("board"); setBoardId(null); setUniversityId(null)}} className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Board</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={resultType==="university"} onChange={()=>{setResultType("university"); setBoardId(null); setUniversityId(null)}} className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">University</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={resultType==="other"} onChange={()=>{setResultType("other"); setBoardId(null); setUniversityId(null)}} className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Other</span>
                </label>
              </div>
            </div>

            {/* Board Select */}
            {resultType==="board" && (
              <Select
                label="Select Board *"
                value={boardId ?? 0}
                onChange={(val:number)=>setBoardId(val)}
                options={[{value:0,label:"Select Board"}, ...boards.map(b=>({value:b.id,label:b.name}))]}
                required
              />
            )}

            {/* University Select */}
            {resultType==="university" && (
              <Select
                label="Select University *"
                value={universityId ?? 0}
                onChange={(val:number)=>setUniversityId(val)}
                options={[{value:0,label:"Select University"}, ...universities.map(u=>({value:u.id,label:`${u.name} (${u.cityName})`}))]}
                required
              />
            )}

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
              <input 
                type="number" 
                value={year} 
                onChange={e=>setYear(e.target.value)} 
                placeholder="e.g. 2025" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>

            {/* ✅ Slug Field - Generated from title + year only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">/results/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="matric-annual-result-2025"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated from title + year. Edit to customize.
              </p>
            </div>

            {/* Slug Preview */}
            {slug && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Preview URL:</span>{' '}
                  <span className="font-mono">https://www.nextid.pk/results/{slug}</span>
                </p>
              </div>
            )}

            {/* Result Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Result Date</label>
              <input type="date" value={resultDate} onChange={e=>setResultDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>

            {/* Official Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Official Link</label>
              <input type="url" value={officialLink} onChange={e=>setOfficialLink(e.target.value)} placeholder="e.g. https://educationboard.gov.pk/results" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>

            {/* Checkboxes */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input id="isPopular" type="checkbox" checked={isPopular} onChange={e=>setIsPopular(e.target.checked)} className="h-4 w-4 text-blue-600 rounded"/>
                <label htmlFor="isPopular" className="text-sm font-medium text-gray-700">Mark as Popular</label>
              </div>
              <div className="flex items-center gap-2">
                <input id="status" type="checkbox" checked={status} onChange={e=>setStatus(e.target.checked)} className="h-4 w-4 text-blue-600 rounded"/>
                <label htmlFor="status" className="text-sm font-medium text-gray-700">Active</label>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-4 flex items-center gap-3">
              <PrimaryButton type="submit" disabled={singleLoading}>{singleLoading ? "Creating..." : "Create Result"}</PrimaryButton>
              <Link href="/admin/results" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</Link>
            </div>
          </form>
        </>
      )}

      {/* Bulk Form */}
      {activeTab==="bulk" && (
        <div className="max-w-2xl">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">CSV Format</h3>
            <p className="text-sm text-blue-600 mb-2">Headers: title, type, boardId, universityId, year, resultDate, officialLink, isPopular, status</p>
            <p className="text-sm text-blue-600">Example: Matric Annual,board,1,,2025,2025-07-15,https://bise.edu.pk/result,true,true</p>
            <p className="text-xs text-blue-500 mt-2">Note: Slugs will be auto-generated from title + year.</p>
          </div>

          <div className="mb-4 flex justify-end">
            <button onClick={downloadSample} className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium">
              Download Sample CSV
            </button>
          </div>

          <BulkUpload
            title=""
            description=""
            sampleData={[]}
            onDownloadSample={downloadSample}
            bulkData={bulkUpload.bulkData}
            onBulkDataChange={bulkUpload.setBulkData}
            file={bulkUpload.file}
            fileName={bulkUpload.fileName}
            onFileChange={bulkUpload.handleFileChange}
            onClearFile={bulkUpload.clearFile}
            onSubmit={bulkUpload.handleBulkSubmit}
            onClear={bulkUpload.clearAll}
            loading={bulkUpload.loading}
            itemName="results"
            hideSampleButton={true}
          />
        </div>
      )}
    </div>
  );
}
