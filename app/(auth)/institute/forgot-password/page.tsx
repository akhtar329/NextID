
"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { FloatingInput } from "../InstituteAuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);

    try {
      // TODO: Connect password reset API here.
      // Example: POST /api/institute/auth/forgot-password

      setError(
        "Password reset API is not connected yet. Please connect the API first."
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="27"
            height="27"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
            <path d="M16 3v4" />
          </svg>
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
          ACCOUNT RECOVERY
        </p>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Forgot password?
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          No worries! Enter the email address associated with your NextID
          account. We will help you reset your password.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <FloatingInput
            label="Registered Email Address"
            name="email"
            type="email"
            autoComplete="email"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg
              className="mt-0.5 shrink-0"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-700/20 transition-all hover:bg-indigo-800 hover:shadow-indigo-700/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <svg
                className="h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="opacity-25"
                />
                <path
                  d="M4 12a8 8 0 018-8"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
              Processing...
            </>
          ) : (
            <>
              Send Reset Instructions
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Back to Login */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        <Link
          href="/institute/login"
          className="group flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-700"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-hover:-translate-x-1"
          >
            <path d="m15 18-6-6 6-6" />
            <path d="M20 12H9" />
          </svg>
          Back to Login
        </Link>
      </div>

      {/* Register Link */}
      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <Link
          href="/institute/register"
          className="font-semibold text-indigo-700 hover:text-indigo-900"
        >
          Create Account
        </Link>
      </p>

      {/* Security Note */}
      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 018 0v3" />
        </svg>
        Your account security is important to us.
      </div>
    </div>
  );
}