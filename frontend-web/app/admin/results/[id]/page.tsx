// app/admin/results/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";

type Result = {
  id: number;
  title: string;
  boardId: number | null;
  universityId: number | null;
  year: number;
  resultDate: string | null;
  officialLink: string | null;
  isPopular: boolean;
  status: boolean;
  createdAt: string;
};

export default function ResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params.id as string;

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch result details
  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/admin/results/${resultId}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to fetch result");
        
        if (data.success && data.result) {
          setResult(data.result);
        }
      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load result");
        toast.error("Failed to load result");
      } finally {
        setLoading(false);
      }
    }
    
    if (resultId) fetchResult();
  }, [resultId]);

  // Delete result
  const deleteResult = async () => {
    if (!confirm("Are you sure you want to delete this result?")) return;

    toast.loading("Deleting result...", { id: "delete-result" });

    try {
      const res = await fetch(`/api/admin/results/${resultId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete result");
      }

      if (data.success) {
        toast.success("Result deleted successfully!", { 
          id: "delete-result",
          duration: 3000 
        });
        router.push("/admin/results");
      } else {
        throw new Error(data.error || "Failed to delete result");
      }

    } catch (err) {
      console.error("Error deleting result:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete result", { 
        id: "delete-result" 
      });
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded text-center">
          <p className="mb-4">{error || "Result not found"}</p>
          <Link href="/admin/results" className="text-blue-600 hover:underline">
            ← Back to Results
          </Link>
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
          <Link href="/admin/results" className="hover:text-blue-600">Results</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">{result.title}</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Result Details</h1>
          <div className="flex gap-2">
            <Link
              href={`/admin/results/${resultId}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Result
            </Link>
            <button
              onClick={deleteResult}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
            <Link
              href="/admin/results"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="mb-6 flex gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          result.status 
            ? "bg-green-100 text-green-700" 
            : "bg-yellow-100 text-yellow-700"
        }`}>
          {result.status ? "Active" : "Inactive"}
        </span>
        {result.isPopular && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
            ★ Popular
          </span>
        )}
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Result Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Title</p>
            <p className="font-semibold">{result.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Year</p>
            <p className="font-semibold">{result.year}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Result Date</p>
            <p>{formatDate(result.resultDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Board/University ID</p>
            <p>{result.boardId || result.universityId || "N/A"}</p>
          </div>
        </div>

        {result.officialLink && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-1">Official Link</p>
            <a 
              href={result.officialLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {result.officialLink}
            </a>
          </div>
        )}
      </div>

      {/* Metadata Card */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
        <div className="flex justify-between">
          <span>Created: {new Date(result.createdAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}