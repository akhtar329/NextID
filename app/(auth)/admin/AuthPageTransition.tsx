
"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const isForgotPassword = pathname.endsWith("/forgot-password");

  const [showContent, setShowContent] = useState(true);
  const firstRender = useRef(true);

  // Branding content animation on route change
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

  const branding = isForgotPassword
    ? {
        eyebrow: "ACCOUNT RECOVERY",
        heading: "Let's get you back in.",
        description:
          "Recover access to your NextID account and continue managing your content from one secure place.",
        features: [
          "Secure password recovery",
          "Protect your administrator account",
          "Get back to your dashboard",
        ],
        bottomTitle: "Your account security matters to us.",
      }
    : {
        eyebrow: "WELCOME BACK",
        heading: "Manage your content with confidence.",
        description:
          "Sign in to your NextID Admin account to manage educational news, admissions, results, scholarships and more.",
        features: [
          "Manage educational news and updates",
          "Publish admissions, jobs and results",
          "Control your website content",
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
            left: isForgotPassword ? "60%" : "0%",
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
                  Admin Portal
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
            isForgotPassword ? "lg:ml-0" : "lg:ml-[40%]"
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
                  Admin Portal
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
