
"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";

interface ResetPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailRegex.test(normalizedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const data: ResetPasswordResponse = await res.json();

      if (res.ok && data.success) {
        setSubmittedEmail(normalizedEmail);
        setSubmitted(true);

        toast.success(
          data.message || "Password reset link sent to your email"
        );
      } else {
        toast.error(
          data.error || "Failed to send reset link. Please try again."
        );
      }
    } catch {
      toast.error(
        "Unable to connect to server. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTryAnotherEmail = () => {
    setEmail(submittedEmail);
    setSubmitted(false);
  };

  return (
    <>
      <style jsx>{`
        @keyframes authFadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes envelopeFloat {
          0%, 100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-5px);
          }
        }

        .auth-content {
          animation: authFadeUp 550ms ease-out both;
        }

        .envelope-float {
          animation: envelopeFloat 3s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-content,
          .envelope-float {
            animation: none;
          }
        }
      `}</style>

      <div className="auth-content w-full">

        {!submitted ? (
          <>
            {/* Forgot Password Heading */}
            <div className="mb-8 text-center">
              <div className="envelope-float mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </div>

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                ACCOUNT RECOVERY
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Forgot Password?
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                No worries! Enter your registered email address
                and we will send you a password reset link.
              </p>
            </div>

            {/* Recovery Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </span>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="admin@nextid.pk"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>

                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
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
            <div className="mt-7 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>

                Back to Login
              </Link>
            </div>

            {/* Security Note */}
            <div className="mt-8 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <svg
                className="mt-0.5 shrink-0 text-slate-500"
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>

              <p className="text-xs leading-5 text-slate-500">
                Your account information is protected. Never share
                your password or verification codes with anyone.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Success Confirmation */}
            <div className="text-center">
              <div className="envelope-float mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="38"
                  height="38"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                  <path d="m8 15 2 2 5-5" />
                </svg>
              </div>

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                EMAIL SENT
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Check Your Email
              </h1>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                We&apos;ve sent a password reset link to:
              </p>

              <p className="mt-2 break-all rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">
                {submittedEmail}
              </p>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                Please check your inbox and follow the instructions
                to reset your password. Also check your spam folder.
              </p>

              <Link
                href="/login"
                className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-700"
              >
                Back to Login
              </Link>

              <button
                type="button"
                onClick={handleTryAnotherEmail}
                className="mt-5 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
              >
                Try another email
              </button>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-slate-100 pt-5 text-center">
          <p className="text-xs text-slate-400">
            © 2026 NextID.pk. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
