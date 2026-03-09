// app/admin/admin-roles/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function CreateAdminRolePage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "", status: true });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/admin-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Failed to create role");
        setLoading(false);
        return;
      }

      toast.success("Role created successfully!");
      // Redirect to roles list
      router.push("/admin/admin-roles");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create role");
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Create Admin Role</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <input
          type="text"
          placeholder="Role Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 w-full rounded"
          required
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border p-2 w-full rounded"
        />

        <select
          value={form.status ? "true" : "false"}
          onChange={(e) => setForm({ ...form, status: e.target.value === "true" })}
          className="border p-2 w-full rounded"
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded text-white ${loading ? "bg-gray-400" : "bg-blue-600"}`}
          >
            {loading ? "Creating..." : "Create Role"}
          </button>

          <Link
            href="/admin/admin-roles"
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel / Back
          </Link>
        </div>
      </form>
    </div>
  );
}
