// app/admin/boards/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import Input from "@/app/component/ui/Input";
import Button from "@/app/component/ui/Button";
import Select from "@/app/component/ui/select";

interface City {
  id: number;
  name: string;
}

interface Board {
  id: number;
  name: string;
  slug: string;
  type: string;
  cityId: number;
  website: string | null;
  description: string | null;
  status: boolean;
  createdAt: string;
}

export default function EditBoardPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [cityId, setCityId] = useState<number>(0);
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cities
        const citiesRes = await fetch("/api/admin/cities");
        const citiesData = await citiesRes.json();
        setCities(citiesData.cities || []);

        // Fetch board data
        const boardRes = await fetch(`/api/admin/boards/${boardId}`);
        const boardData = await boardRes.json();

        if (boardData.success && boardData.board) {
          const board = boardData.board;
          setName(board.name || "");
          setSlug(board.slug || "");
          setCityId(board.cityId || 0);
          setWebsite(board.website || "");
          setDescription(board.description || "");
          setStatus(board.status === true);
        } else {
          toast.error("Board not found");
          router.push("/admin/boards");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (boardId) {
      fetchData();
    }
  }, [boardId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!name) {
      setError("Name is required");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          cityId: Number(cityId),
          website: website || null,
          description: description || null,
          status,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Board updated successfully");
        router.push("/admin/boards");
      } else {
        throw new Error(data.error || "Failed to update");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Edit Board</h1>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Board Name *"
          value={name}
          onChange={setName}
          required
        />

        <Input
          label="Slug"
          value={slug}
          onChange={setSlug}
        />

        <Select
          label="City"
          value={cityId}
          onChange={(val: number) => setCityId(val)}
          options={[
            { value: 0, label: "Select City" },
            ...cities.map(c => ({ value: c.id, label: c.name }))
          ]}
        />

        <Input
          label="Website"
          value={website}
          onChange={setWebsite}
          placeholder="e.g., www.example.com"
        />

        <div>
          <label className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setStatus(true)}
            className={`px-4 py-2 rounded-lg ${
              status ? "bg-green-100 text-green-700 ring-1 ring-green-300" : "bg-gray-100"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatus(false)}
            className={`px-4 py-2 rounded-lg ${
              !status ? "bg-red-100 text-red-700 ring-1 ring-red-300" : "bg-gray-100"
            }`}
          >
            Inactive
          </button>
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <button
            type="button"
            onClick={() => router.push("/admin/boards")}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}