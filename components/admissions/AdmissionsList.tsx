// components/admissions/AdmissionsSidebar.tsx
"use client";

import Link from 'next/link';

// ✅ createUrl as string, not function
export default function AdmissionsSidebar({ stats, filters, createUrl }) {
  // createUrl is actually a function, but we'll use it to generate strings
  // Or better: Convert createUrl to URL strings before passing
  
  return (
    <div>
      {stats.levels?.map((p: any) => {
        const href = createUrl("level", p.slug); // ✅ This works if createUrl returns string
        return (
          <Link
            key={p.slug}
            href={href}
            className="..."
          >
            {p.name}
          </Link>
        );
      })}
    </div>
  );
}