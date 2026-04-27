export interface RedirectRule {
  from: string;
  to: string;
  status: 301 | 302;
}

export const redirects: RedirectRule[] = [
  {
    "from": "/old-page",
    "to": "/new-page",
    "status": 301
  },
  {
    "from": "/admissions-2025",
    "to": "/admissions",
    "status": 301
  },
  {
    "from": "/results-2025",
    "to": "/results",
    "status": 301
  },
  {
    "from": "/bise-lahore-board",
    "to": "/boards/bise-lahore",
    "status": 301
  },
  {
    "from": "/punjab-university",
    "to": "/universities/punjab-university",
    "status": 301
  },
  {
    "from": "/bs-program",
    "to": "/programs/bs-computer-science",
    "status": 301
  },
  {
    "from": "/matric-result",
    "to": "/results?level=matric",
    "status": 301
  },
  {
    "from": "/inter-result",
    "to": "/results?level=inter",
    "status": 301
  },
  {
    "from": "/faqs-2025",
    "to": "/faqs",
    "status": 301
  },
  {
    "from": "/contact-us",
    "to": "/contact",
    "status": 301
  },
  {
    "from": "/about-us",
    "to": "/about",
    "status": 301
  },
  {
    "from": "/admissions-2026",
    "to": "/admissions",
    "status": 302
  },
  {
    "from": "/results-2026",
    "to": "/results",
    "status": 302
  },
  {
    "from": "/date-sheets-2026",
    "to": "/date-sheets",
    "status": 302
  }
];

export function getRedirect(fromPath: string): RedirectRule | undefined {
  const exactMatch = redirects.find(r => r.from === fromPath);
  if (exactMatch) return exactMatch;
  
  const patternMatch = redirects.find(r => {
    if (r.from.includes('*')) {
      const pattern = r.from.replace('*', '.*');
      return new RegExp(`^${pattern}$`).test(fromPath);
    }
    return false;
  });
  
  return patternMatch;
}