"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FloatingInput } from "../InstituteAuthLayout";

export default function InstituteLoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          setRemaining(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const isLocked = lockoutSeconds > 0;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLocked) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    const email = formData.get("email")?.toString().trim().toLowerCase();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setRemaining(null);

    try {
      const response = await fetch("/api/auth/institute/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();

      // Handle rate limiting (429)
      if (response.status === 429) {
        if (result.retryAfter) {
          setLockoutSeconds(result.retryAfter);
        }
        toast.error(result.message || "Too many attempts. Please wait.");
        return;
      }

      // Show remaining attempts warning
      if (typeof result.remaining === "number") {
        setRemaining(result.remaining);
      }

      if (!response.ok || !result.success) {
        toast.error(result.message || "Login failed. Please try again.");
        return;
      }

      toast.success("Login successful! Welcome back.");
      router.replace("/institute/users/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Institute login error:", error);
      toast.error("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
          Welcome Back
        </p>

        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Enter your details to access your institute dashboard.
        </p>
      </div>

      {/* Lockout banner — NEW */}
      {isLocked && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2 font-semibold">
            <span>🔒</span>
            <span>Account temporarily locked</span>
          </div>
          <p className="mt-1 text-xs">
            Too many failed attempts. Try again in{" "}
            <strong>
              {Math.floor(lockoutSeconds / 60)}:
              {String(lockoutSeconds % 60).padStart(2, "0")}
            </strong>
          </p>
        </div>
      )}

      {/* Remaining attempts warning — NEW */}
      {!isLocked && remaining !== null && remaining > 0 && remaining <= 2 && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          ⚠️ {remaining} attempt{remaining !== 1 ? "s" : ""} remaining before
          lockout
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <FloatingInput
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
        />

        {/* Password */}
        <div className="relative">
          <FloatingInput
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              name="remember"
              className="h-4 w-4 rounded border-slate-300 accent-indigo-600 focus:ring-indigo-500"
            />
            Remember me
          </label>

          <Link
            href="/institute/forgot-password"
            className="font-semibold text-indigo-600 transition hover:text-indigo-800"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button — UPDATED */}
        <button
          type="submit"
          disabled={loading || isLocked}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-700 text-sm font-semibold text-white shadow-lg shadow-indigo-700/20 transition hover:bg-indigo-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLocked ? (
            "Locked"
          ) : loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Please wait...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />

        <span className="whitespace-nowrap text-xs font-medium text-slate-400">
          NEW TO NEXTID?
        </span>

        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Registration Link */}
      <p className="text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/institute/register"
          className="font-bold text-indigo-600 transition hover:text-indigo-800"
        >
          Create account
        </Link>
      </p>

      {/* Footer */}
      <p className="mt-10 text-center text-xs leading-5 text-slate-400">
        By continuing, you agree to NextID&apos;s Terms & Conditions and Privacy
        Policy.
      </p>
    </div>
  );
}