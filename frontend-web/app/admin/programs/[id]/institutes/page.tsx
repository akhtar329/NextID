// app/admin/programs/[id]/institutes/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";

type Institute = {
  id: number;
  name: string;
  type: "Govt" | "Private";
  cityName: string;
};

export default function ProgramInstitutesPage() {
  const router = useRouter();
  const params = useParams();
  const programId = params.id as string;

  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [programName, setProgramName] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch program details
        const programRes = await fetch(`/api/admin/programs/${programId}`);
        const programData = await programRes.json();
        if (programData.success) {
          setProgramName(programData.program.name);
        }

        // Fetch assigned institutes
        const institutesRes = await fetch(`/api/admin/program-institutes/by-program/${programId}`);
        const institutesData = await institutesRes.json();
        
        if (institutesData.success) {
          setInstitutes(institutesData.institutes || []);
        }
      } catch (err) {
        console.error("Error:", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    if (programId) fetchData();
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/admin" className="hover:text-blue-600">Dashboard</Link>
          <span className="mx-2">›</span>
          <Link href="/admin/programs" className="hover:text-blue-600">Programs</Link>
          <span className="mx-2">›</span>
          <Link href={`/admin/programs/${programId}`} className="hover:text-blue-600">
            {programName}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">Institutes</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Offered at Institutes</h1>
          <Link
            href={`/admin/programs/${programId}/institutes/assign`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Assign Institutes
          </Link>
        </div>
      </div>

      {/* Institutes Grid */}
      {institutes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <p className="text-gray-500 mb-4">No institutes assigned yet</p>
          <Link
            href={`/admin/programs/${programId}/institutes/assign`}
            className="text-blue-600 hover:text-blue-800"
          >
            + Assign Institutes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {institutes.map((institute) => (
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
      )}
    </div>
  );
}