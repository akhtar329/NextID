
"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FloatingInput } from "../InstituteAuthLayout";

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
  const result: unknown = await response.json();
  return isRecord(result) ? result : {};
}

export default function InstituteRegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    const form = e.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("fullName") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    const confirmPassword = String(data.get("confirmPassword") || "");
    const terms = data.get("terms");

    // Required fields
    if (!name || !email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Name validation
    if (name.length < 2 || name.length > 150) {
      toast.error("Name must be between 2 and 150 characters.");
      return;
    }

    // Password validation
    if (password.length < 8 || password.length > 128) {
      toast.error("Password must be between 8 and 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    // Terms validation
    if (!terms) {
      toast.error("Please accept the terms and conditions.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/institute/users/owners/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
        }),
      });

      const result = await readJsonObject(response);

      if (!response.ok || result.success !== true) {
        toast.error(
          typeof result.message === "string"
            ? result.message
            : "Registration failed. Please try again."
        );
        return;
      }

      toast.success("Your account has been created successfully!");

      form.reset();

      // Redirect to login page
      router.push("/institute/login");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
          Get started
        </p>

        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Create your account
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Register as an institute owner and manage your institutes with NextID.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FloatingInput
            label="Full name"
            name="fullName"
            autoComplete="name"
          />

          <FloatingInput
            label="Phone number"
            name="phone"
            type="tel"
            autoComplete="tel"
          />
        </div>

        <FloatingInput
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative">
            <FloatingInput
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
            />

            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <FloatingInput
            label="Confirm password"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-2 pt-1 text-xs leading-5 text-slate-600">
          <input
            type="checkbox"
            name="terms"
            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-indigo-600"
          />

          <span>
            I agree to the{" "}
            <Link
              href="/terms"
              className="font-semibold text-indigo-600 hover:underline"
            >
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-semibold text-indigo-600 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-700 text-sm font-semibold text-white shadow-lg shadow-indigo-700/20 transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />

        <span className="text-xs text-slate-400">ALREADY REGISTERED?</span>

        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/institute/login"
          className="font-bold text-indigo-600 transition hover:text-indigo-800"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
