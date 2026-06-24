// services/redirects-config.ts

interface RedirectRule {
  from: string | RegExp;
  to: string;
  status: 301 | 302;
}

// ==============================================
// ALL SEO REDIRECTS IN ONE PLACE
// ==============================================

const redirectRules: RedirectRule[] = [
  // ========== TYPO FIXES ==========
  {
    from: /^\/newss/,
    to: '/news',
    status: 301,
  },
  {
    from: /^\/city\//,
    to: '/',
    status: 301,
  },

  // ========== MERGE PAGES ==========
  {
    from: /^\/institutes/,
    to: '/news',
    status: 301,
  },
  {
    from: /^\/boards/,
    to: '/news',
    status: 301,
  },

  // ========== REMOVED PAGES → MAIN PAGES ==========
  {
    from: /^\/programs/,
    to: '/admissions',
    status: 301,
  },
  {
    from: /^\/category\//,
    to: '/admissions',
    status: 301,
  },
 {
  from: /^\/universities$/,
  to: '/admissions',
  status: 301,
},
{
  from: /^\/universities\//,
  to: '/admissions',
  status: 301,
},

  {
    from: /^\/questions\//,
    to: '/faq',
    status: 301,
  },
  {
    from: /^\/tutors\//,
    to: '/blog',
    status: 301,
  },
    {
    from: /^\/blogs\//,
    to: '/blog',
    status: 301,
  },

  // ========== SPECIFIC PAGE REDIRECTS ==========
  {
    from: /^\/study-abroad$/,
    to: '/scholarships',
    status: 301,
  },
  {
    from: /^\/career-counseling$/,
    to: '/blog',
    status: 301,
  },
  {
    from: /^\/career-guide$/,
    to: '/blog',
    status: 301,
  },

  // ========== REMOVE TRAILING SLASHES ==========
  // (Handled in code below)
];

// ==============================================
// HELPER FUNCTIONS
// ==============================================

function removeTrailingSlash(pathname: string): string {
  if (pathname === '/') return pathname;
  if (pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function matchRule(pathname: string, rule: RedirectRule): boolean {
  if (rule.from instanceof RegExp) {
    return rule.from.test(pathname);
  }
  return pathname === rule.from;
}

// ==============================================
// MAIN EXPORT
// ==============================================

export function getRedirect(pathname: string): { to: string; status: 301 | 302 } | null {
  // Step 1: Remove trailing slash
  const cleanPath = removeTrailingSlash(pathname);

  // Step 2: Check each rule
  for (const rule of redirectRules) {
    if (matchRule(cleanPath, rule)) {
      return { to: rule.to, status: rule.status };
    }
  }

  // Step 3: No redirect found
  return null;
}

// ==============================================
// FOR DEBUGGING (Optional)
// ==============================================

export function getAllRedirectRules(): RedirectRule[] {
  return redirectRules;
}

// ==============================================
// TO REMOVE LATER:
// Just delete this file, or comment out the import
// in middleware.ts, and these redirects will stop working.
// ==============================================