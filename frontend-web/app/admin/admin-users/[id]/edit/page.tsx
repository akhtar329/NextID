"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch roles
        const rolesRes = await fetch("/api/admin/admin-roles");
        const rolesData = await rolesRes.json();
        if (rolesData.success) setRoles(rolesData.roles || []);

        // Fetch user
        const userRes = await fetch(`/api/admin/admin-users/${id}`);
        const userData = await userRes.json();
        setUser(userData.user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchData();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/admin/admin-users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    router.push("/admin/admin-users");
    router.refresh();
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6">User not found</div>;

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Edit User #{id}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <input
            type="text"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            className="border p-2 w-full rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            className="border p-2 w-full rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Role</label>
          <select
            value={user.roleId}
            onChange={(e) => setUser({ ...user, roleId: Number(e.target.value) })}
            className="border p-2 w-full rounded"
          >
            <option value="">Select Role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">Status</label>
          <select
            value={user.status ? "true" : "false"}
            onChange={(e) =>
              setUser({ ...user, status: e.target.value === "true" })
            }
            className="border p-2 w-full rounded"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

<div className="flex gap-2 mt-4">
  <button
    type="submit"
    className="bg-blue-600 text-white px-4 py-2 rounded"
  >
    Update User
  </button>
  
  <button
    type="button"
    onClick={() => router.push("/admin/admin-users")}
    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
  >
    Cancel
  </button>
</div>

      </form>
    </div>
  );
}
