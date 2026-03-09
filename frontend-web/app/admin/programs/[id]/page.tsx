// app/admin/programs/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";

type Program = {
  id: number;
  name: string;
  slug: string;
  degreeName: string;
  levelName: string;
  duration: string | null;
  feeRange: string | null;
  overview: string | null;
  eligibility: string | null;
  careerScope: string | null;
  status: boolean;
};

type Institute = {
  id: number;
  name: string;
  type: "Govt" | "Private";
  cityName: string;
};

export default function ProgramDetailPage() {
  const router = useRouter();
  const params = useParams();
  const programId = params.id as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutesLoading, setInstitutesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch program details
  useEffect(() => {
    async function fetchProgram() {
      try {
        const res = await fetch(`/api/admin/programs/${programId}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to fetch program");
        
        if (data.success && data.program) {
          setProgram(data.program);
        }
      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load program");
      }
    }
    
    if (programId) fetchProgram();
  }, [programId]);

  // Fetch institutes offering this program
  useEffect(() => {
    async function fetchProgramInstitutes() {
      setInstitutesLoading(true);
      try {
        const res = await fetch(`/api/admin/program-institutes/by-program/${programId}`);
        const data = await res.json();
        
        if (data.success) {
          setInstitutes(data.institutes || []);
        }
      } catch (err) {
        console.error("Error fetching institutes:", err);
        toast.error("Failed to load institutes");
      } finally {
        setInstitutesLoading(false);
        setLoading(false);
      }
    }
    
    if (programId) fetchProgramInstitutes();
  }, [programId]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded text-center">
          <p className="mb-4">{error || "Program not found"}</p>
          <Link href="/admin/programs" className="text-blue-600 hover:underline">
            ← Back to Programs
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
          <Link href="/admin/programs" className="hover:text-blue-600">Programs</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">{program.name}</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{program.name}</h1>
          <div className="flex gap-2">
            <Link
              href={`/admin/programs/${programId}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Program
            </Link>
            <Link
              href="/admin/programs"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Program Details Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Program Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Degree</p>
            <p className="font-medium">{program.degreeName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Level</p>
            <p className="font-medium">{program.levelName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="font-medium">{program.duration || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fee Range</p>
            <p className="font-medium">{program.feeRange || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Slug</p>
            <p className="font-medium text-gray-600">{program.slug}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs ${
              program.status 
                ? "bg-green-100 text-green-700" 
                : "bg-yellow-100 text-yellow-700"
            }`}>
              {program.status ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {program.overview && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-1">Overview</p>
            <p className="text-gray-700">{program.overview}</p>
          </div>
        )}

        {program.eligibility && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-1">Eligibility</p>
            <p className="text-gray-700">{program.eligibility}</p>
          </div>
        )}

        {program.careerScope && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-1">Career Scope</p>
            <p className="text-gray-700">{program.careerScope}</p>
          </div>
        )}
      </div>

      {/* Institutes Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Offered at Institutes</h2>
          <div className="flex gap-3">
            {/* View All Institutes Link */}
            <Link
              href={`/admin/programs/${programId}/institutes`}
              className="text-sm text-gray-600 hover:text-gray-800 border border-gray-300 px-3 py-1 rounded-md hover:bg-gray-50"
            >
              View All
            </Link>
            {/* Manage Institutes Link */}
            <Link
              href={`/admin/programs/${programId}/institutes/assign`}
              className="text-sm text-blue-600 hover:text-blue-800 border border-blue-300 px-3 py-1 rounded-md hover:bg-blue-50"
            >
              + Manage
            </Link>
          </div>
        </div>

        {institutesLoading ? (
          <div className="text-center py-8 text-gray-500">Loading institutes...</div>
        ) : institutes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No institutes offering this program yet</p>
            <Link
              href={`/admin/programs/${programId}/institutes/assign`}
              className="text-blue-600 hover:text-blue-800"
            >
              + Add Institutes
            </Link>
          </div>
        ) : (
          <>
            {/* Show first 4 institutes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {institutes.slice(0, 4).map((institute) => (
                <div
                  key={institute.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{institute.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          institute.type === "Govt"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}>
                          {institute.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {institute.cityName}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/admin/institutes/${institute.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {/* If more than 4 institutes, show view all link */}
            {institutes.length > 4 && (
              <div className="text-center">
                <Link
                  href={`/admin/programs/${programId}/institutes`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + View all {institutes.length} institutes
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}