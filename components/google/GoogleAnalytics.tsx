"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const GA_ID = "G-2VNFCBN0SG";

export default function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    const excluded = ["/admin", "/login"];

    if (excluded.some((p) => pathname.startsWith(p))) return;

    window.dataLayer = window.dataLayer || [];

    if (typeof window.gtag !== "function") {
      window.gtag = (...args: unknown[]) => {
        window.dataLayer.push(args);
      };
    }

    window.gtag("js", new Date());
    window.gtag("config", GA_ID, {
      page_path: pathname,
    });
  }, [pathname]);

  return null;
}