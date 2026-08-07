"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!window.gtag) return;

    // Don't track admin pages
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/login")
    ) {
      return;
    }

    const url =
      pathname +
      (searchParams.toString() ? `?${searchParams}` : "");

    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: url,
    });
  }, [pathname, searchParams]);

  return null;
}