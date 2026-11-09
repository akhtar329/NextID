
"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function FloatingInput({
  label,
  type = "text",
  name,
  autoComplete,
  required = true,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  name: string;
  autoComplete?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState("");

  const currentValue = value !== undefined ? value : internalValue;
  const hasValue = currentValue.length > 0;

  const handleChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }

    onChange?.(newValue);
  };

  return (
    <div className="relative">
      <input
        id={name}
        name={name}
        type={type}
        value={currentValue}
        placeholder=" "
        autoComplete={autoComplete}
        required={required}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => handleChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pt-4 pb-1 text-sm text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />

      <label
        htmlFor={name}
        className={`pointer-events-none absolute left-4 bg-white px-1 transition-all duration-200 ${
          isFocused || hasValue
            ? "top-2 text-[11px] text-indigo-600"
            : "top-1/2 -translate-y-1/2 text-sm text-slate-400"
        }`}
      >
        {label}
      </label>
    </div>
  );
}

export default function InstituteAuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const isRegister = pathname.endsWith("/register");
  const isForgotPassword = pathname.endsWith("/forgot-password");

  const [showContent, setShowContent] = useState(true);
  const firstRender = useRef(true);

  // Branding content transition on route change
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    setShowContent(false);

    const timer = window.setTimeout(() => {
      setShowContent(true);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  // Branding content
  const branding = isRegister
    ? {
        eyebrow: "START YOUR JOURNEY",
        heading: "Build a better future for your institute.",
        description:
          "Create your NextID owner account and bring your institute's daily management into one simple platform.",
        features: [
          "Register your institute with ease",
          "Manage multiple institutes",
          "Get started with digital management",
        ],
        bottomTitle: "Your institute's digital journey starts here.",
      }
    : isForgotPassword
      ? {
          eyebrow: "ACCOUNT RECOVERY",
          heading: "Let's get you back in.",
          description:
            "Recover access to your NextID account and continue managing your institute from one place.",
          features: [
            "Secure account recovery",
            "Protect your account",
            "Get back to your dashboard",
          ],
          bottomTitle: "Your account security matters to us.",
        }
      : {
          eyebrow: "WELCOME BACK",
          heading: "Your institute, all in one place.",
          description:
            "Sign in to continue managing your institute, staff, students, attendance and fee records.",
          features: [
            "Access your institute dashboard",
            "Manage students and staff",
            "Stay updated with institute activities",
          ],
          bottomTitle: "Everything you need, just one sign in away.",
        };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-3 py-6 sm:px-6 lg:py-10">
      <div className="relative min-h-[650px] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">

        {/* Sliding Branding Panel */}
        <section
          className="absolute inset-y-0 z-20 hidden w-[40%] flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700 p-8 text-white transition-[left] duration-700 ease-in-out lg:flex xl:p-10"
          style={{
            left: isRegister ? "0%" : "60%",
          }}
        >
          {/* Decorative Background */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-white/5" />

          {/* Branding Header */}
          <div
            className={`relative z-10 transition-all duration-500 ${
              showContent
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0"
            }`}
          >
            {/* Logo */}
            <div className="mb-12 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-extrabold text-indigo-800 shadow-lg">
                N
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-wide">
                  NextID
                </h1>
                <p className="text-xs text-indigo-200">
                  Institute Management
                </p>
              </div>
            </div>

            {/* Dynamic Branding */}
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-200">
              {branding.eyebrow}
            </p>

            <h2 className="max-w-xs text-3xl font-bold leading-tight xl:text-4xl">
              {branding.heading}
            </h2>

            <p className="mt-5 max-w-sm text-sm leading-7 text-indigo-100">
              {branding.description}
            </p>
          </div>

          {/* Dynamic Features */}
          <div
            className={`relative z-10 space-y-4 transition-all duration-500 ${
              showContent
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0"
            }`}
          >
            {branding.features.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm text-indigo-50"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs">
                  ✓
                </span>
                {item}
              </div>
            ))}

            <p className="pt-8 text-xs leading-5 text-indigo-200">
              {branding.bottomTitle}
            </p>

            <p className="pt-2 text-xs text-indigo-200">
              © 2026 NextID. All rights reserved.
            </p>
          </div>
        </section>

        {/* Form Panel */}
        <section
          className={`relative z-10 flex min-h-[650px] w-full items-center justify-center px-5 py-10 transition-[margin] duration-700 ease-in-out sm:px-10 lg:w-[60%] ${
            isRegister ? "lg:ml-[40%]" : "lg:ml-0"
          }`}
        >
          <div className="w-full max-w-md">

            {/* Mobile Branding */}
            <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-700 text-lg font-bold text-white">
                N
              </div>

              <div>
                <p className="text-lg font-bold text-slate-900">
                  NextID
                </p>
                <p className="text-[11px] text-slate-500">
                  Institute Management
                </p>
              </div>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
