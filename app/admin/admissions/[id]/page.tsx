// app/admin/admissions/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";

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
  // 👇 Programs array (not single program)
  programs: Program[];
  institute: Institute;
};

export default function AdmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const admissionId = params.id as string;

  const [admission, setAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmission();
  }, [admissionId]);

  const fetchAdmission = async () => {
    try {
      const res = await fetch(`/api/admin/admissions/${admissionId}`);
      const data = await res.json();
      
      if (data.success) {
        setAdmission(data.admission);
      } else {
        setError(data.error || "Failed to load admission");
      }
    } catch (err) {
      console.error("Error fetching admission:", err);
      setError("Failed to load admission");
    } finally {
      setLoading(false);
    }
  };

  const deleteAdmission = async () => {
    if (!admission) return;
    
    if (!confirm(`Are you sure you want to delete "${admission.name}"?`)) return;

    toast.loading("Deleting admission...", { id: "delete-admission" });

    try {
      const res = await fetch(`/api/admin/admissions/${admissionId}`, {
        method: "DELETE",
      });

      const data = await res.json();

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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || "Admission not found"}
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
          <span className="text-gray-700">
            {/* 👇 FIX: Show first program name or fallback */}
            {admission.programs && admission.programs.length > 0 
              ? `${admission.programs[0].name} - ${admission.year}` 
              : `Admission ${admission.year}`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{admission.name}</h1>
          <div className="flex gap-2">
            <Link
              href={`/admin/admissions/${admissionId}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={deleteAdmission}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span className={`
          px-3 py-1 rounded-full text-sm font-medium
          ${admission.status === 'Open' ? 'bg-green-100 text-green-800' : ''}
          ${admission.status === 'Expected' ? 'bg-yellow-100 text-yellow-800' : ''}
          ${admission.status === 'Closed' ? 'bg-red-100 text-red-800' : ''}
        `}>
          {admission.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Institute Info */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="font-medium text-gray-900 mb-2">Institute</h2>
            <Link 
              href={`/admin/institutes/${admission.institute.id}`}
              className="text-blue-600 hover:underline"
            >
              {admission.institute.name}
            </Link>
            <p className="text-sm text-gray-500 mt-1">{admission.institute.cityName}</p>
          </div>

          {/* Programs */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="font-medium text-gray-900 mb-2">
              Programs ({admission.programs?.length || 0})
            </h2>
            {admission.programs && admission.programs.length > 0 ? (
              <ul className="space-y-2">
                {admission.programs.map((program) => (
                  <li key={program.id}>
                    <Link 
                      href={`/admin/programs/${program.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {program.name}
                    </Link>
                    {program.degreeName && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({program.degreeName})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No programs linked</p>
            )}
          </div>

          {/* Dates */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="font-medium text-gray-900 mb-2">Important Dates</h2>
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Year:</dt>
                <dd className="font-medium">{admission.year}</dd>
              </div>
              {admission.session && (
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Session:</dt>
                  <dd className="font-medium">{admission.session}</dd>
                </div>
              )}
              {admission.expectedOpenDate && (
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Expected Open:</dt>
                  <dd className="font-medium">
                    {new Date(admission.expectedOpenDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {admission.expectedCloseDate && (
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Expected Close:</dt>
                  <dd className="font-medium">
                    {new Date(admission.expectedCloseDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Slug/URL */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="font-medium text-gray-900 mb-2">URL</h2>
            <Link 
              href={`https://www.nextid.pk/admissions/${admission.slug}`}
              target="_blank"
              className="text-blue-600 hover:underline text-sm break-all"
            >
              /admissions/{admission.slug}
            </Link>
          </div>

          {/* Official Link */}
          {admission.officialLink && (
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h2 className="font-medium text-gray-900 mb-2">Official Link</h2>
              <Link 
                href={admission.officialLink}
                target="_blank"
                className="text-blue-600 hover:underline text-sm break-all"
              >
                {admission.officialLink}
              </Link>
            </div>
          )}

          {/* Merit Information */}
          {admission.meritInfo && (
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h2 className="font-medium text-gray-900 mb-2">Merit Information</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{admission.meritInfo}</p>
            </div>
          )}

          {/* Additional Notes - With HTML support */}
          {admission.note && (
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h2 className="font-medium text-gray-900 mb-2">Additional Notes</h2>
              <div 
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: admission.note }}
              />
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-500">
            <p>ID: {admission.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}