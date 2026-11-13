
"use client";

import {
  useState,
  useEffect,
  useCallback,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  UserRound,
  ShieldCheck,
  CalendarDays,
  Clock,
  Mail,
  KeyRound,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: number | null;
  lastLogin: string | null;
  joinDate: string | null;
  permissions: string[];
}

interface ProfileApiResponse {
  profile?: unknown;
  error?: unknown;
  message?: unknown;
}

interface ProfileFormData {
  name: string;
  email: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseProfile(value: unknown): ProfileData | null {
  if (!isRecord(value)) return null;

  const {
    id,
    name,
    email,
    role,
    roleId,
    lastLogin,
    joinDate,
    permissions,
  } = value;

  if (
    (typeof id !== "string" && typeof id !== "number") ||
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof role !== "string"
  ) {
    return null;
  }

  return {
    id: String(id),
    name,
    email,
    role,
    roleId:
      typeof roleId === "number" && Number.isFinite(roleId)
        ? roleId
        : null,
    lastLogin:
      typeof lastLogin === "string" ? lastLogin : null,
    joinDate:
      typeof joinDate === "string" ? joinDate : null,
    permissions: Array.isArray(permissions)
      ? permissions.filter(
          (permission): permission is string =>
            typeof permission === "string"
        )
      : [],
  };
}

async function readJson(
  response: Response
): Promise<ProfileApiResponse> {
  const data: unknown = await response.json();

  if (!isRecord(data)) {
    throw new Error("Invalid server response");
  }

  return data as ProfileApiResponse;
}

function formatDate(
  value: string | null,
  includeTime = false
): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return includeTime
    ? date.toLocaleString()
    : date.toLocaleDateString();
}

export default function AdminProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    email: "",
  });

  const fetchProfile = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/admin/profile", {
        method: "GET",
        cache: "no-store",
        signal,
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to fetch profile"
        );
      }

      const parsedProfile = parseProfile(data.profile);

      if (!parsedProfile) {
        throw new Error("Invalid profile data received from server");
      }

      setProfile(parsedProfile);
      setFormData({
        name: parsedProfile.name,
        email: parsedProfile.email,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("Error fetching profile:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load profile"
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();

    void fetchProfile(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchProfile]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (name !== "name" && name !== "email") return;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (updating) return;

    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name) {
      toast.error("Please enter your full name");
      return;
    }

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        toast.error(
          typeof data.error === "string"
            ? data.error
            : "Failed to update profile"
        );
        return;
      }

      const updatedProfile = parseProfile(data.profile);

      if (!updatedProfile) {
        throw new Error("Server returned invalid updated profile data");
      }

      setProfile(updatedProfile);
      setFormData({
        name: updatedProfile.name,
        email: updatedProfile.email,
      });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <UserRound className="h-8 w-8 text-red-500" />
        </div>

        <h2 className="text-lg font-semibold text-gray-900">
          Profile unavailable
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          We could not load your profile information.
        </p>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void fetchProfile();
          }}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const initial = profile.name.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <UserRound className="h-5 w-5 text-blue-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your account information.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-8 text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-100">
                <span className="text-3xl font-bold text-white">
                  {initial}
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-900">
                {profile.name}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {profile.role}
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Active Account
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-gray-500">User ID</span>
                <span className="break-all text-right font-mono text-xs text-gray-900">
                  {profile.id}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500">Role ID</span>
                <span className="text-sm font-medium text-gray-900">
                  {profile.roleId ?? "—"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays className="h-4 w-4" />
                  Joined
                </span>
                <span className="text-right text-sm text-gray-900">
                  {formatDate(profile.joinDate)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  Last Login
                </span>
                <span className="text-right text-sm text-gray-900">
                  {formatDate(profile.lastLogin, true)}
                </span>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                Permissions
              </h3>
              <span className="ml-auto rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {profile.permissions.length}
              </span>
            </div>

            <div className="p-5">
              {profile.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No permissions are assigned to this account.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Edit Profile */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <h3 className="font-semibold text-gray-900">
                Edit Profile
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Update your personal account information.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>

                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    id="profile-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    maxLength={150}
                    required
                    disabled={updating}
                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    id="profile-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    maxLength={254}
                    required
                    disabled={updating}
                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-role"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Role
                </label>

                <input
                  id="profile-role"
                  type="text"
                  value={profile.role}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Role cannot be changed here. Contact the Super Admin
                  for role changes.
                </p>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-400">
                  Make sure your email address is correct.
                </p>

                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Password Section */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <KeyRound className="h-5 w-5 text-amber-600" />
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">
                  Change Password
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Keep your account secure by updating your password.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-sm leading-6 text-gray-500">
                You can change your current password after verifying
                your existing password.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push("/admin/profile/change-password")
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                <KeyRound className="h-4 w-4" />
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
