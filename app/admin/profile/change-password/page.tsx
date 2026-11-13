
"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface ApiResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

function isApiResponse(value: unknown): value is ApiResponse {
  return typeof value === "object" && value !== null;
}

export default function ChangePasswordPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    const currentPassword = formData.currentPassword;
    const newPassword = formData.newPassword;
    const confirmPassword = formData.confirmPassword;

    if (!currentPassword.trim()) {
      toast.error("Please enter your current password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      let data: unknown;

      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response received from server");
      }

      if (!isApiResponse(data)) {
        throw new Error("Invalid server response");
      }

      if (!response.ok) {
        toast.error(
          typeof data.error === "string"
            ? data.error
            : "Failed to change password"
        );
        return;
      }

      toast.success(
        typeof data.message === "string"
          ? data.message
          : "Password changed successfully"
      );

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      router.push("/admin/profile");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (() => {
    const password = formData.newPassword;

    if (!password) return null;

    let score = 0;

    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
      return {
        label: "Weak",
        width: "33%",
        color: "bg-red-500",
        text: "text-red-600",
      };
    }

    if (score <= 4) {
      return {
        label: "Medium",
        width: "66%",
        color: "bg-amber-500",
        text: "text-amber-600",
      };
    }

    return {
      label: "Strong",
      width: "100%",
      color: "bg-emerald-500",
      text: "text-emerald-600",
    };
  })();

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60";

  const renderPasswordField = (
    label: string,
    name: "currentPassword" | "newPassword" | "confirmPassword",
    value: string,
    visible: boolean,
    toggleVisibility: () => void,
    placeholder: string,
    autoComplete: string
  ) => (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        {label}
      </label>

      <div className="relative">
        <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

        <input
          id={name}
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          disabled={loading}
          minLength={name === "currentPassword" ? undefined : 6}
          className={`${inputClass} pl-11`}
        />

        <button
          type="button"
          onClick={toggleVisibility}
          disabled={loading}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-7">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-gray-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </button>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
              <LockKeyhole className="h-7 w-7 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Change Password
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Update your account password and keep your account secure.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/50 px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Password Security
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Enter your current password before setting a new one.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
            {renderPasswordField(
              "Current Password",
              "currentPassword",
              formData.currentPassword,
              showCurrentPassword,
              () => setShowCurrentPassword((prev) => !prev),
              "Enter your current password",
              "current-password"
            )}

            <div className="border-t border-gray-100" />

            {renderPasswordField(
              "New Password",
              "newPassword",
              formData.newPassword,
              showNewPassword,
              () => setShowNewPassword((prev) => !prev),
              "Enter your new password",
              "new-password"
            )}

            {/* Password Strength */}
            {passwordStrength && (
              <div className="-mt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Password strength
                  </span>
                  <span className={`text-xs font-bold ${passwordStrength.text}`}>
                    {passwordStrength.label}
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
              </div>
            )}

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="mb-3 text-xs font-bold text-blue-900">
                Password recommendations
              </p>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  At least 6 characters
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  Use uppercase and lowercase letters
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  Include numbers
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  Use special characters
                </div>
              </div>
            </div>

            {renderPasswordField(
              "Confirm New Password",
              "confirmPassword",
              formData.confirmPassword,
              showConfirmPassword,
              () => setShowConfirmPassword((prev) => !prev),
              "Re-enter your new password",
              "new-password"
            )}

            {formData.confirmPassword && (
              <div
                className={`flex items-center gap-2 text-xs font-medium ${
                  formData.newPassword === formData.confirmPassword
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {formData.newPassword === formData.confirmPassword ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Passwords match
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    Passwords do not match
                  </>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.push("/admin/profile")}
                disabled={loading}
                className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  loading ||
                  !formData.currentPassword ||
                  !formData.newPassword ||
                  !formData.confirmPassword ||
                  formData.newPassword !== formData.confirmPassword
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <LockKeyhole className="h-4 w-4" />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          Your password should be unique and difficult to guess.
        </p>
      </div>
    </div>
  );
}
