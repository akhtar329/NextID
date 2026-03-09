// app/admin/admissions/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";

type Admission = {
  id: number;
  year: number;
  session: string | null;
  status: "Expected" | "Open" | "Closed";
  expectedOpenDate: string | null;
  expectedCloseDate: string | null;
  meritInfo: string | null;
  note: string | null;
  officialLink: string | null;
  createdAt: string;
  updatedAt: string;
  program: {
    id: number;
    name: string;
  };
  institute: {
    id: number;
    name: string;
    cityName: string;
  };
};

export default function AdmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const admissionId = params.id as string;

  const [admission, setAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch admission details
  useEffect(() => {
    async function fetchAdmission() {
      try {
        const res = await fetch(`/api/admin/admissions/${admissionId}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to fetch admission");
        
        if (data.success && data.admission) {
          setAdmission(data.admission);
        }
      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load admission");
        toast.error("Failed to load admission");
      } finally {
        setLoading(false);
      }
    }
    
    if (admissionId) fetchAdmission();
  }, [admissionId]);

  // Delete admission
  const deleteAdmission = async () => {
    if (!confirm("Are you sure you want to delete this admission?")) return;

    toast.loading("Deleting admission...", { id: "delete-admission" });

    try {
      const res = await fetch(`/api/admin/admissions/${admissionId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete admission");
      }

      if (data.success) {
        toast.success("Admission deleted successfully!", { 
          id: "delete-admission",
          duration: 3000 
        });
        router.push("/admin/admissions");
      } else {
        throw new Error(data.error || "Failed to delete admission");
      }

    } catch (err) {
      console.error("Error deleting admission:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete admission", { 
        id: "delete-admission" 
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

  if (error || !admission) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded text-center">
          <p className="mb-4">{error || "Admission not found"}</p>
          <Link href="/admin/admissions" className="text-blue-600 hover:underline">
            ← Back to Admissions
          </Link>
        </div>
      </div>
    );
  }

  // Status colors
  const statusColors = {
    Expected: "bg-yellow-100 text-yellow-700",
    Open: "bg-green-100 text-green-700",
    Closed: "bg-red-100 text-red-700"
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/admin" className="hover:text-blue-600">Dashboard</Link>
          <span className="mx-2">›</span>
          <Link href="/admin/admissions" className="hover:text-blue-600">Admissions</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">
            {admission.program.name} - {admission.year}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admission Details</h1>
          <div className="flex gap-2">
            <Link
              href={`/admin/admissions/${admissionId}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Admission
            </Link>
            <button
              onClick={deleteAdmission}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
            <Link
              href="/admin/admissions"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[admission.status]}`}>
          {admission.status}
        </span>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Program & Institute</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="border-r pr-6">
            <p className="text-sm text-gray-500 mb-1">Program</p>
            <p className="text-lg font-semibold">{admission.program.name}</p>
            <Link 
              href={`/admin/programs/${admission.program.id}`}
              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
            >
              View Program →
            </Link>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Institute</p>
            <p className="text-lg font-semibold">{admission.institute.name}</p>
            <p className="text-sm text-gray-600">{admission.institute.cityName}</p>
            <Link 
              href={`/admin/institutes/${admission.institute.id}`}
              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
            >
              View Institute →
            </Link>
          </div>
        </div>
      </div>

      {/* Dates Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Admission Dates</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Year</p>
            <p className="font-medium">{admission.year}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Session</p>
            <p className="font-medium">{admission.session || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Expected Open Date</p>
            <p className="font-medium">{formatDate(admission.expectedOpenDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Expected Close Date</p>
            <p className="font-medium">{formatDate(admission.expectedCloseDate)}</p>
          </div>
        </div>
      </div>

      {/* Additional Info Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Additional Information</h2>
        
        {admission.officialLink && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Official Link</p>
            <a 
              href={admission.officialLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {admission.officialLink}
            </a>
          </div>
        )}

        {admission.meritInfo && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Merit Information</p>
            <p className="text-gray-700 whitespace-pre-wrap">{admission.meritInfo}</p>
          </div>
        )}

        {admission.note && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
            <p className="text-gray-700 whitespace-pre-wrap">{admission.note}</p>
          </div>
        )}
      </div>

      {/* Metadata Card */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
        <div className="flex justify-between">
          <span>Created: {new Date(admission.createdAt).toLocaleString()}</span>
          <span>Last Updated: {new Date(admission.updatedAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}