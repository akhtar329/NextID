// services/redirects/redirects-config.ts

export interface RedirectRule {
  from: string;
  to: string;
  status: 301 | 302;
}

export const redirects: RedirectRule[] = [
  // TYPO FIXES
  {
    from: "/newss*",
    to: "/news",
    status: 301,
  },
  {
    from: "/city/*",
    to: "/",
    status: 301,
  },

  // MERGED PAGES
  {
    from: "/institutes*",
    to: "/news",
    status: 301,
  },
  {
    from: "/boards*",
    to: "/news",
    status: 301,
  },

  // REMOVED PAGES
  {
    from: "/programs*",
    to: "/admissions",
    status: 301,
  },
  {
    from: "/category/*",
    to: "/admissions",
    status: 301,
  },
  {
    from: "/universities",
    to: "/admissions",
    status: 301,
  },
  {
    from: "/universities/*",
    to: "/admissions",
    status: 301,
  },
  {
    from: "/questions/*",
    to: "/faq",
    status: 301,
  },
  {
    from: "/tutors/*",
    to: "/blog",
    status: 301,
  },
  {
    from: "/blogs/*",
    to: "/blog",
    status: 301,
  },

  // SPECIFIC PAGES
  {
    from: "/study-abroad",
    to: "/scholarships",
    status: 301,
  },
  {
    from: "/career-counseling",
    to: "/blog",
    status: 301,
  },
  {
    from: "/career-guide",
    to: "/blog",
    status: 301,
  },
];

function removeTrailingSlash(pathname: string): string {
  if (pathname === "/") return pathname;

  if (pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function getRedirect(
  pathname: string
): { to: string; status: 301 | 302 } | null {
  const cleanPath = removeTrailingSlash(pathname);

  // Exact match
  const exactMatch = redirects.find(
    (rule) => rule.from === cleanPath
  );

  if (exactMatch) {
    return {
      to: exactMatch.to,
      status: exactMatch.status,
    };
  }

  // Wildcard match
  const wildcardMatch = redirects.find((rule) => {
    if (!rule.from.includes("*")) return false;

    const pattern = rule.from.replace(/\*/g, ".*");

    return new RegExp(`^${pattern}$`).test(cleanPath);
  });

  if (wildcardMatch) {
    return {
      to: wildcardMatch.to,
      status: wildcardMatch.status,
    };
  }

  return null;
}

export function getAllRedirectRules(): RedirectRule[] {
  return redirects;
}