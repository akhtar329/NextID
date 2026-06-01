"use client";

import { useEffect, useRef, useState } from "react";

export default function OnScrollLoad({
  children,
  rootMargin = "200px",
  fallback, // ✅ Optional: Loading skeleton
}: {
  children: React.ReactNode;
  rootMargin?: string;
  fallback?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [rootMargin]); // ✅ Added dependency

  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || <div className="h-40 bg-gray-100 animate-pulse rounded-xl" />)}
    </div>
  );
}