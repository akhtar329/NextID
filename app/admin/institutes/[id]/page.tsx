// app/admin/institutes/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";

type Institute = {
  id: number;
  name: string;
  slug: string;
  type: "Govt" | "Private";
  cityName: string;
  description: string | null;
  website: string | null;
  status: boolean;
  createdAt: string;
};

type Program = {
  id: number;
  name: string;
  degreeName: string;
  levelName: string;
  duration: string | null;
};

export default function InstituteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const instituteId = params.id as string;

  const [institute, setInstitute] = useState<Institute | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch institute details
  useEffect(() => {
    async function fetchInstitute() {
      try {
        const res = await fetch(`/api/admin/institutes/${instituteId}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to fetch institute");
        
        if (data.success && data.institute) {
          setInstitute(data.institute);
        }
      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load institute");
      }
    }
    
    if (instituteId) fetchInstitute();
  }, [instituteId]);

  // Fetch programs offered by this institute
  useEffect(() => {
    async function fetchInstitutePrograms() {
      setProgramsLoading(true);
      try {
        const res = await fetch(`/api/admin/program-institutes/by-institute/${instituteId}`);
        const data = await res.json();
        
        if (data.success) {
          setPrograms(data.programs || []);
        }
      } catch (err) {
        console.error("Error fetching programs:", err);
        toast.error("Failed to load programs");
      } finally {
        setProgramsLoading(false);
        setLoading(false);
      }
    }
    
    if (instituteId) fetchInstitutePrograms();
  }, [instituteId]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !institute) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded text-center">
          <p className="mb-4">{error || "Institute not found"}</p>
          <Link href="/admin/institutes" className="text-blue-600 hover:underline">
            ← Back to Institutes
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
          <Link href="/admin/institutes" className="hover:text-blue-600">Institutes</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">{institute.name}</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{institute.name}</h1>
          <div className="flex gap-2">
            <Link
              href={`/admin/institutes/${instituteId}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Institute
            </Link>
            <Link
              href="/admin/institutes"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Institute Details Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Institute Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{institute.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Slug</p>
            <p className="font-medium text-gray-600">{institute.slug}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs ${
              institute.type === "Govt"
                ? "bg-blue-100 text-blue-700"
                : "bg-purple-100 text-purple-700"
            }`}>
              {institute.type}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">City</p>
            <p className="font-medium">{institute.cityName}</p>
          </div>
          {institute.website && (
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Website</p>
              <a 
                href={institute.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {institute.website}
              </a>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs ${
              institute.status 
                ? "bg-green-100 text-green-700" 
                : "bg-yellow-100 text-yellow-700"
            }`}>
              {institute.status ? "Active" : "Inactive"}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created At</p>
            <p className="font-medium text-gray-600">
              {new Date(institute.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {institute.description && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-1">Description</p>
            <p className="text-gray-700">{institute.description}</p>
          </div>
        )}
      </div>

      {/* Programs Section - UPDATED WITH ASSIGN LINK */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Programs Offered</h2>
          <div className="flex gap-3">
            {/* View All Programs Link */}
            <Link
              href={`/admin/institutes/${instituteId}/programs`}
              className="text-sm text-gray-600 hover:text-gray-800 border border-gray-300 px-3 py-1 rounded-md hover:bg-gray-50"
            >
              View All
            </Link>
            {/* Assign Programs Link - YEH LINK ADD KIYA HAI! */}
            <Link
              href={`/admin/institutes/${instituteId}/programs/assign`}
              className="text-sm text-blue-600 hover:text-blue-800 border border-blue-300 px-3 py-1 rounded-md hover:bg-blue-50"
            >
              + Assign Programs
            </Link>
          </div>
        </div>

        {programsLoading ? (
          <div className="text-center py-8 text-gray-500">Loading programs...</div>
        ) : programs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No programs offered by this institute yet</p>
            <Link
              href={`/admin/institutes/${instituteId}/programs/assign`}
              className="text-blue-600 hover:text-blue-800"
            >
              + Assign Programs
            </Link>
          </div>
        ) : (
          <>
            {/* Show first 4 programs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {programs.slice(0, 4).map((program) => (
                <div
                  key={program.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{program.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                          {program.degreeName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {program.levelName}
                        </span>
                        {program.duration && (
                          <span className="text-xs text-gray-500">
                            • {program.duration}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/admin/programs/${program.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {/* If more than 4 programs, show view all link */}
            {programs.length > 4 && (
              <div className="text-center">
                <Link
                  href={`/admin/institutes/${instituteId}/programs`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + View all {programs.length} programs
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}