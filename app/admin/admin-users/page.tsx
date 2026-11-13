
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import PrimaryButton from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import Table from "@/components/ui/Table";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  status: boolean;
};

type AdminRole = {
  id: number;
  name: string;
};

interface ApiResponse {
  success: boolean;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function readJsonObject(
  response: Response
): Promise<Record<string, unknown>> {
  const data: unknown = await response.json();
  return isRecord(data) ? data : {};
}

function parseRoles(value: unknown): AdminRole[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is AdminRole => {
    return (
      isRecord(item) &&
      typeof item.id === "number" &&
      typeof item.name === "string"
    );
  });
}

function parseUser(value: unknown): AdminUser | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "number" ||
    typeof value.name !== "string" ||
    typeof value.email !== "string" ||
    typeof value.roleId !== "number" ||
    typeof value.status !== "boolean"
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    email: value.email,
    roleId: value.roleId,
    roleName:
      typeof value.roleName === "string" ? value.roleName : "",
    status: value.status,
  };
}

function parseApiResponse(
  data: Record<string, unknown>
): ApiResponse {
  return {
    success: data.success === true,
    error: typeof data.error === "string" ? data.error : undefined,
  };
}

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);

  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  // Fetch users and roles
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      try {
        // Fetch roles first
        const rolesRes = await fetch("/api/admin/admin-roles");

        if (!rolesRes.ok) {
          throw new Error("Failed to fetch admin roles");
        }

        const rolesData = await readJsonObject(rolesRes);

        if (rolesData.success !== true) {
          throw new Error(
            typeof rolesData.error === "string"
              ? rolesData.error
              : "Invalid roles response"
          );
        }

        const parsedRoles = parseRoles(rolesData.roles);

        if (cancelled) return;

        setRoles(parsedRoles);

        // Fetch users
        const usersRes = await fetch("/api/admin/admin-users");

        if (!usersRes.ok) {
          throw new Error("Failed to fetch users");
        }

        const usersData = await readJsonObject(usersRes);

        if (!Array.isArray(usersData.users)) {
          throw new Error(
            typeof usersData.error === "string"
              ? usersData.error
              : "Invalid users response"
          );
        }

        const parsedUsers = usersData.users
          .map(parseUser)
          .filter((user): user is AdminUser => user !== null)
          .map((user) => {
            const role = parsedRoles.find(
              (item) => item.id === user.roleId
            );

            return {
              ...user,
              roleName: role?.name || user.roleName || "",
            };
          });

        if (!cancelled) {
          setUsers(parsedUsers);
        }
      } catch (err) {
        console.error("Fetch admin users error:", err);

        if (!cancelled) {
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to fetch users or roles"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Delete user
  const deleteUser = async (id: number) => {
    if (deleteLoading !== null) return;

    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    setDeleteLoading(id);

    toast.loading("Deleting user...", {
      id: `delete-${id}`,
    });

    try {
      const res = await fetch(`/api/admin/admin-users/${id}`, {
        method: "DELETE",
      });

      const rawData = await readJsonObject(res);
      const data = parseApiResponse(rawData);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete user");
      }

      setUsers((prev) => prev.filter((user) => user.id !== id));

      toast.success("User deleted successfully", {
        id: `delete-${id}`,
      });
    } catch (err) {
      console.error("Delete user error:", err);

      toast.error(
        err instanceof Error ? err.message : "Failed to delete user",
        { id: `delete-${id}` }
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  // Toggle user status
  const toggleStatus = async (user: AdminUser) => {
    if (updatingUserId !== null) return;

    const newStatus = !user.status;

    setUpdatingUserId(user.id);

    // Optimistic update
    setUsers((prev) =>
      prev.map((item) =>
        item.id === user.id
          ? { ...item, status: newStatus }
          : item
      )
    );

    try {
      const res = await fetch(`/api/admin/admin-users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const rawData = await readJsonObject(res);
      const data = parseApiResponse(rawData);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status");
      }

      toast.success(`Status updated for ${user.name}`);
    } catch (err) {
      console.error("Update user status error:", err);

      // Restore previous status if request fails
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? { ...item, status: user.status }
            : item
        )
      );

      toast.error(
        err instanceof Error ? err.message : "Failed to update status"
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Change role inline
  const changeRole = async (
    user: AdminUser,
    newRoleId: number
  ) => {
    if (
      updatingUserId !== null ||
      newRoleId === user.roleId ||
      !roles.some((role) => role.id === newRoleId)
    ) {
      return;
    }

    const previousRoleId = user.roleId;
    const previousRoleName = user.roleName;

    const newRole = roles.find((role) => role.id === newRoleId);

    if (!newRole) return;

    setUpdatingUserId(user.id);

    // Optimistic update
    setUsers((prev) =>
      prev.map((item) =>
        item.id === user.id
          ? {
              ...item,
              roleId: newRoleId,
              roleName: newRole.name,
            }
          : item
      )
    );

    try {
      const res = await fetch(`/api/admin/admin-users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roleId: newRoleId }),
      });

      const rawData = await readJsonObject(res);
      const data = parseApiResponse(rawData);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update role");
      }

      toast.success(`Role updated for ${user.name}`);
    } catch (err) {
      console.error("Change user role error:", err);

      // Restore previous role if request fails
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? {
                ...item,
                roleId: previousRoleId,
                roleName: previousRoleName,
              }
            : item
        )
      );

      toast.error(
        err instanceof Error ? err.message : "Failed to update role"
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Table columns
  const columns = [
    {
      header: "Name",
      accessor: "name" as keyof AdminUser,
    },
    {
      header: "Email",
      accessor: "email" as keyof AdminUser,
    },
    {
      header: "Role",
      accessor: "roleId" as keyof AdminUser,
      render: (_value: unknown, user: AdminUser) => (
        <select
          value={user.roleId}
          onChange={(e) =>
            void changeRole(user, Number(e.target.value))
          }
          disabled={updatingUserId !== null}
          className="max-w-[180px] rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          aria-label={`Change role for ${user.name}`}
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Status",
      accessor: "status" as keyof AdminUser,
      render: (_value: unknown, user: AdminUser) => (
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={user.status}
            onChange={() => void toggleStatus(user)}
            disabled={updatingUserId !== null}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
            aria-label={`Toggle status for ${user.name}`}
          />

          <span
            className={`text-xs font-medium ${
              user.status ? "text-green-700" : "text-gray-500"
            }`}
          >
            {user.status ? "Active" : "Inactive"}
          </span>
        </label>
      ),
    },
    {
      header: "Actions",
      accessor: "id" as keyof AdminUser,
      render: (_value: unknown, user: AdminUser) => (
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/admin-users/${user.id}/edit`}
            className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
          >
            Edit
          </Link>

          <button
            type="button"
            onClick={() => void deleteUser(user.id)}
            disabled={deleteLoading !== null}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              deleteLoading === user.id
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : "bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            {deleteLoading === user.id ? "Deleting..." : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  // Search and role filtering
  const filteredUsers = users.filter((user) => {
    const searchTerm = search.trim().toLowerCase();

    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm);

    const matchesRole = roleFilter
      ? user.roleId === Number(roleFilter)
      : true;

    return matchesSearch && matchesRole;
  });

  const activeUsers = users.filter((user) => user.status).length;
  const inactiveUsers = users.length - activeUsers;

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 text-sm text-gray-500">
            Admin Dashboard / Admin Users
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Admin Users
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage administrator accounts, roles and access status.
          </p>
        </div>

        <PrimaryButton
          onClick={() => router.push("/admin/admin-users/create")}
        >
          + Add User
        </PrimaryButton>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Users
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {users.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Active Users
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {activeUsers}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Inactive Users
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-500">
            {inactiveUsers}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Search Users
          </label>

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email..."
          />
        </div>

        <div>
          <label
            htmlFor="role-filter"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Filter by Role
          </label>

          <select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Roles</option>

            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading && users.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-500">
          <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          Loading users...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="mb-3 text-3xl">Users</div>

          <h2 className="font-semibold text-gray-800">
            {search || roleFilter
              ? "No users match your filters"
              : "No admin users found"}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {search || roleFilter
              ? "Try changing your search or role filter."
              : "Add your first administrator to get started."}
          </p>

          {!search && !roleFilter && (
            <button
              type="button"
              onClick={() =>
                router.push("/admin/admin-users/create")
              }
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              + Add User
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                All Admin Users
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Showing {filteredUsers.length} of {users.length} users
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table
              columns={columns}
              data={filteredUsers}
            />
          </div>
        </div>
      )}
    </div>
  );
}
