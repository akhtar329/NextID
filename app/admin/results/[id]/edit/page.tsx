// app/admin/results/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import Input from "@/app/component/ui/Input";
import Select from "@/app/component/ui/select";

// Types for different tables
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
  type: string;
  cityName: string;
  slug: string;
};

type Result = {
  id: number;
  title: string;
  slug: string;
  boardId: number | null;
  universityId: number | null;
  year: number;
  resultDate: string | null;
  officialLink: string | null;
  isPopular: boolean;
  status: boolean;
};

// -------------------- COMMON MISTAKES CORRECTION --------------------
const corrections: Record<string, string> = {
  'anwal': 'annual',
  'reslut': 'result',
  'matric': 'matric',
  'matrik': 'matric',
  'inter': 'intermediate',
  'intr': 'intermediate',
  'supply': 'supply',
  'supplimentary': 'supplementary',
  '9th': '9th-class',
  '10th': '10th-class',
  '1st': '1st-year',
  '2nd': '2nd-year',
  'ba': 'ba',
  'bsc': 'bsc',
  'ma': 'ma',
  'msc': 'msc',
  'fbise': 'fbise',
  'bise': 'bise',
  'hydrabad': 'hyderabad',
  'hyderbad': 'hyderabad',
};

// -------------------- SEO-FRIENDLY SLUG GENERATOR --------------------
const generateSEOSlug = (title: string, boardName?: string, year?: string): string => {
  let cleanTitle = title.toLowerCase().trim();
  
  Object.keys(corrections).forEach(wrong => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'g');
    cleanTitle = cleanTitle.replace(regex, corrections[wrong]);
  });
  
  const parts = [];
  
  // Board name
  if (boardName) {
    const cleanBoard = boardName
      .toLowerCase()
      .replace(/board of intermediate and secondary education|board of education|board/gi, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    if (cleanBoard) parts.push(cleanBoard);
  } else if (cleanTitle.includes('fbise')) {
    parts.push('fbise');
  } else if (cleanTitle.includes('bise')) {
    const cities = ['lahore', 'rawalpindi', 'gujranwala', 'multan', 'faisalabad', 'hyderabad', 'karachi', 'islamabad', 'peshawar', 'quetta'];
    for (const city of cities) {
      if (cleanTitle.includes(city)) {
        parts.push(`bise-${city}`);
        break;
      }
    }
  }
  
  // Exam type
  if (cleanTitle.includes('matric')) parts.push('matric');
  else if (cleanTitle.includes('intermediate')) parts.push('intermediate');
  else if (cleanTitle.includes('9th-class')) parts.push('9th-class');
  else if (cleanTitle.includes('10th-class')) parts.push('10th-class');
  else if (cleanTitle.includes('ba')) parts.push('ba');
  else if (cleanTitle.includes('bsc')) parts.push('bsc');
  else if (cleanTitle.includes('ma')) parts.push('ma');
  else if (cleanTitle.includes('msc')) parts.push('msc');
  
  // Result type
  if (cleanTitle.includes('annual')) parts.push('annual');
  else if (cleanTitle.includes('supply')) parts.push('supply');
  
  parts.push('result');
  
  if (year) parts.push(year);
  
  return parts
    .filter((part, index, self) => part && self.indexOf(part) === index)
    .join('-');
};

export default function EditResultPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params.id as string;

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [resultType, setResultType] = useState<"board" | "university" | "other">("board");
  const [boardId, setBoardId] = useState<number | null>(null);
  const [universityId, setUniversityId] = useState<number | null>(null);
  const [year, setYear] = useState("");
  const [resultDate, setResultDate] = useState("");
  const [officialLink, setOfficialLink] = useState("");
  const [isPopular, setIsPopular] = useState(false);
  const [status, setStatus] = useState(true);
  
  // UI states
  const [manualSlug, setManualSlug] = useState(false);
  const [suggestedCorrection, setSuggestedCorrection] = useState<string | null>(null);
  
  // Data states
  const [boards, setBoards] = useState<Board[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected items for preview
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);

  // Auto-generate slug when title/year/type changes
  useEffect(() => {
    if (title && year && !manualSlug) {
      let boardName = "";
      if (resultType === "board" && selectedBoard) {
        boardName = selectedBoard.name;
      } else if (resultType === "university" && selectedUniversity) {
        boardName = selectedUniversity.name;
      }
      
      // Check for spelling mistakes
      const lowerTitle = title.toLowerCase();
      let correction = null;
      
      Object.keys(corrections).forEach(wrong => {
        if (lowerTitle.includes(wrong)) {
          correction = lowerTitle.replace(
            new RegExp(`\\b${wrong}\\b`, 'g'), 
            corrections[wrong]
          );
        }
      });
      
      setSuggestedCorrection(correction);
      
      const generatedSlug = generateSEOSlug(title, boardName, year);
      setSlug(generatedSlug);
    }
  }, [title, year, resultType, selectedBoard, selectedUniversity, manualSlug]);

  // Update selected board when boardId changes
  useEffect(() => {
    if (boardId) {
      const board = boards.find(b => b.id === boardId);
      setSelectedBoard(board || null);
    } else {
      setSelectedBoard(null);
    }
  }, [boardId, boards]);

  // Update selected university when universityId changes
  useEffect(() => {
    if (universityId) {
      const uni = universities.find(u => u.id === universityId);
      setSelectedUniversity(uni || null);
    } else {
      setSelectedUniversity(null);
    }
  }, [universityId, universities]);

  // Apply correction
  const applyCorrection = () => {
    if (suggestedCorrection) {
      setTitle(suggestedCorrection);
      setSuggestedCorrection(null);
    }
  };

  // Fetch boards, universities and result data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch boards from boards table
        const boardsRes = await fetch("/api/admin/boards");
        const boardsData = await boardsRes.json();
        setBoards(boardsData.boards || []);

        // Fetch universities from institutes table
        const unisRes = await fetch("/api/admin/institutes");
        const unisData = await unisRes.json();
        
        const allInstitutes = unisData.institutes || [];
        const uniList = allInstitutes.filter((inst: University) => 
          inst.type === "University" || inst.name.toLowerCase().includes("university")
        );
        setUniversities(uniList);

        // Fetch result details
        const resultRes = await fetch(`/api/admin/results/${resultId}`);
        if (!resultRes.ok) throw new Error("Failed to fetch result");
        const resultData = await resultRes.json();
        
        if (resultData.success && resultData.result) {
          const result = resultData.result;
          
          setTitle(result.title);
          setSlug(result.slug || "");
          setYear(result.year.toString());
          setResultDate(result.resultDate ? result.resultDate.split('T')[0] : "");
          setOfficialLink(result.officialLink || "");
          setIsPopular(result.isPopular);
          setStatus(result.status);

          // Determine result type
          if (result.boardId) {
            setResultType("board");
            setBoardId(result.boardId);
          } else if (result.universityId) {
            setResultType("university");
            setUniversityId(result.universityId);
          } else {
            setResultType("other");
          }
        }

      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load data");
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setFetchLoading(false);
      }
    }
    
    if (resultId) {
      fetchData();
    }
  }, [resultId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!title || !year) {
      setError("Title and Year are required.");
      setLoading(false);
      return;
    }

    if (!slug) {
      setError("Slug is required.");
      setLoading(false);
      return;
    }

    if (resultType === "board" && !boardId) {
      setError("Please select a board");
      setLoading(false);
      return;
    }

    if (resultType === "university" && !universityId) {
      setError("Please select a university");
      setLoading(false);
      return;
    }

    toast.loading("Updating result...", { id: "update-result" });

    try {
      // Prepare request body
      const requestBody: any = {
        title: title.trim(),
        slug: slug.trim(),
        year: Number(year),
        resultDate: resultDate || null,
        officialLink: officialLink.trim() || null,
        isPopular,
        status,
      };

      // Add IDs based on type
      if (resultType === "board") {
        requestBody.boardId = boardId;
        requestBody.universityId = null;
      } else if (resultType === "university") {
        requestBody.universityId = universityId;
        requestBody.boardId = null;
      } else {
        requestBody.boardId = null;
        requestBody.universityId = null;
      }

      const res = await fetch(`/api/admin/results/${resultId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || "Failed to update result");
      }

      if (data.success) {
        toast.success("Result updated successfully!", { 
          id: "update-result",
          duration: 3000 
        });
        router.push(`/admin/results`);
      } else {
        throw new Error(data.error || "Failed to update result");
      }

    } catch (err) {
      console.error("Error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update result", { 
        id: "update-result" 
      });
      setError(err instanceof Error ? err.message : "Failed to update result");
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
          <Link href="/admin/results" className="hover:text-blue-600">Results</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">Edit Result</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Edit Result</h1>
            <p className="text-sm text-gray-500 mt-1">Update result information</p>
          </div>
          <Link
            href="/admin/results"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Results
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form className="bg-white p-6 rounded-lg shadow-sm border space-y-4" onSubmit={handleSubmit}>
        {/* Title with Spelling Suggestion */}
        <div>
          <Input
            label="Result Title *"
            value={title}
            onChange={(val) => {
              setTitle(val);
              setManualSlug(false);
              // Auto-check for spelling mistakes
              const lowerVal = val.toLowerCase();
              Object.keys(corrections).forEach(wrong => {
                if (lowerVal.includes(wrong)) {
                  const corrected = val.replace(
                    new RegExp(wrong, 'i'), 
                    corrections[wrong]
                  );
                  setSuggestedCorrection(corrected);
                }
              });
            }}
            placeholder="e.g. FBISE Matric Result 2025"
            required
          />
          
          {/* Spelling Suggestion */}
          {suggestedCorrection && suggestedCorrection !== title && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
              <span className="text-sm text-yellow-700">
                Did you mean: <span className="font-semibold">{suggestedCorrection}</span>?
              </span>
              <button
                type="button"
                onClick={applyCorrection}
                className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full hover:bg-yellow-200"
              >
                Apply Fix
              </button>
            </div>
          )}
        </div>

        {/* Slug Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SEO-Friendly Slug *
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">/results/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                setManualSlug(true);
              }}
              placeholder="fbise-matric-result-2025"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            SEO-friendly format: board-exam-type-result-year
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

        {/* Result Type Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Result Type *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={resultType === "board"}
                onChange={() => {
                  setResultType("board");
                  setBoardId(null);
                  setUniversityId(null);
                  setManualSlug(false);
                }}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm">Board</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={resultType === "university"}
                onChange={() => {
                  setResultType("university");
                  setBoardId(null);
                  setUniversityId(null);
                  setManualSlug(false);
                }}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm">University</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={resultType === "other"}
                onChange={() => {
                  setResultType("other");
                  setBoardId(null);
                  setUniversityId(null);
                  setManualSlug(false);
                }}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm">Other</span>
            </label>
          </div>
        </div>

        {/* Board Select */}
        {resultType === "board" && (
          <Select
            label="Select Board *"
            value={boardId ?? 0}
            onChange={(val: number) => setBoardId(val)}
            options={[
              { value: 0, label: "Select Board" },
              ...boards.map(b => ({
                value: b.id,
                label: b.name,
              }))
            ]}
            required
          />
        )}

        {/* University Select */}
        {resultType === "university" && (
          <Select
            label="Select University *"
            value={universityId ?? 0}
            onChange={(val: number) => setUniversityId(val)}
            options={[
              { value: 0, label: "Select University" },
              ...universities.map(u => ({
                value: u.id,
                label: `${u.name} (${u.cityName})`,
              }))
            ]}
            required
          />
        )}

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year *
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setManualSlug(false);
            }}
            placeholder="e.g. 2025"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Result Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Result Date
          </label>
          <input
            type="date"
            value={resultDate}
            onChange={(e) => setResultDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            placeholder="e.g. https://educationboard.gov.pk/results"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Metadata */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Result ID:</span>
            <span className="font-medium">{resultId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Current Slug:</span>
            <span className="font-mono text-xs">{slug}</span>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <input
              id="isPopular"
              type="checkbox"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="isPopular" className="text-sm font-medium text-gray-700">
              Mark as Popular
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="status"
              type="checkbox"
              checked={status}
              onChange={(e) => setStatus(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="status" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 flex items-center gap-3">
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Result"}
          </PrimaryButton>
          
          <Link
            href="/admin/results"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}