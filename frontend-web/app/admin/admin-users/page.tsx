"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/app/component/ui/Button";
import SearchInput from "@/app/component/ui/SearchInput";
import Table from "@/app/component/ui/Table";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  status: boolean;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);

  // Fetch users
const fetchUsers = async () => {
  setLoading(true);
  try {
    const res = await fetch("/api/admin/admin-users");
    if (!res.ok) throw new Error("Failed to fetch users");
    const data = await res.json();

    if (data.users && roles.length > 0) {
      // Map roleName from roles array
      const usersWithRoleNames = data.users.map((u: any) => {
        const role = roles.find(r => r.id === u.roleId);
        return { ...u, roleName: role?.name || "" };
      });
      setUsers(usersWithRoleNames);
    } else {
      setUsers(data.users || []);
    }

  } catch (err) {
    console.error(err);
    toast.error(err instanceof Error ? err.message : "Failed to fetch users");
  } finally {
    setLoading(false);
  }
};


  // Fetch roles for filters and inline changes
  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/admin/admin-roles");
      const data = await res.json();
      if (data.success) setRoles(data.roles || []);
    } catch (err) {
      console.error(err);
    }
  };

useEffect(() => {
  const fetchData = async () => {
    try {
      // 1️⃣ Fetch roles first
      const rolesRes = await fetch("/api/admin/admin-roles");
      const rolesData = await rolesRes.json();
      if (rolesData.success) setRoles(rolesData.roles);

      // 2️⃣ Fetch users next
      const usersRes = await fetch("/api/admin/admin-users");
      const usersData = await usersRes.json();

      if (usersData.users && rolesData.roles) {
        const usersWithRoleNames = usersData.users.map((u: any) => {
          const role = rolesData.roles.find((r: any) => r.id === u.roleId);
          return { ...u, roleName: role?.name || "" };
        });
        setUsers(usersWithRoleNames);
      } else {
        setUsers(usersData.users || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch users or roles");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);


  // Delete user
  const deleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    setDeleteLoading(id);
    toast.loading("Deleting user...", { id: `delete-${id}` });

    try {
      const res = await fetch(`/api/admin/admin-users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete user");
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success("User deleted successfully", { id: `delete-${id}` });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to delete user", { id: `delete-${id}` });
    } finally {
      setDeleteLoading(null);
    }
  };

  // Toggle user status
  const toggleStatus = async (user: AdminUser) => {
    try {
      const res = await fetch(`/api/admin/admin-users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: !user.status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update status");
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, status: !u.status } : u)));
      toast.success(`Status updated for ${user.name}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  // Change role inline
  const changeRole = async (user: AdminUser, newRoleId: number) => {
    try {
      const res = await fetch(`/api/admin/admin-users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: newRoleId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update role");
      const newRole = roles.find(r => r.id === newRoleId);
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, roleId: newRoleId, roleName: newRole?.name || "" } : u)));
      toast.success(`Role updated for ${user.name}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  // Table columns
  const columns = [
    { header: "Name", accessor: "name" as keyof AdminUser },
    { header: "Email", accessor: "email" as keyof AdminUser },
    {
      header: "Role",
      accessor: "roleId" as keyof AdminUser,
      render: (_: any, user: AdminUser) => (
        <select
          value={user.roleId}
          onChange={e => changeRole(user, Number(e.target.value))}
          className="border rounded px-1 text-sm"
        >
          {roles.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      ),
    },
    {
      header: "Status",
      accessor: "status" as keyof AdminUser,
      render: (_: any, user: AdminUser) => (
        <input
          type="checkbox"
          checked={user.status}
          onChange={() => toggleStatus(user)}
        />
      ),
    },
    {
      header: "Actions",
      accessor: "id" as keyof AdminUser,
      render: (_: any, user: AdminUser) => (
        <div className="flex gap-2">
          <Link
            href={`/admin/admin-users/${user.id}/edit`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Edit
          </Link>
          <button
            onClick={() => deleteUser(user.id)}
            disabled={deleteLoading === user.id}
            className={`text-sm ${deleteLoading === user.id ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:text-red-800"}`}
          >
            {deleteLoading === user.id ? "Deleting..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  const filteredUsers = users.filter(u =>
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (roleFilter ? u.roleId === Number(roleFilter) : true)
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage admin users</p>
        </div>
        <PrimaryButton onClick={() => router.push("/admin/admin-users/create")}>
          + Add User
        </PrimaryButton>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading && users.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-gray-500">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-4xl mb-2">👤</div>
          <div className="text-gray-500">
            {search || roleFilter ? "No users match your filters" : "No admin users found. Add your first user!"}
          </div>
          {!search && !roleFilter && (
            <button onClick={() => router.push("/admin/admin-users/create")} className="mt-4 text-blue-600 hover:text-blue-800 text-sm">
              + Add User
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table columns={columns} data={filteredUsers} />
        </div>
      )}
    </div>
  );
}
