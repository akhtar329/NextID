// services/redirects/redirects-config.ts
import fs from "fs";
import path from "path";

export interface RedirectRule {
  from: string;
  to: string;
  status: 301 | 302;
}

// ✅ DEFAULT REDIRECTS (Static fallback)
export const DEFAULT_REDIRECTS: RedirectRule[] = [
  // Typo fixes
  { from: "/newss*", to: "/news", status: 301 },
  { from: "/city/*", to: "/", status: 301 },
  // Merged pages
  { from: "/institutes*", to: "/news", status: 301 },
  { from: "/boards*", to: "/news", status: 301 },
  // Removed pages
  { from: "/programs*", to: "/admissions", status: 301 },
  { from: "/category/*", to: "/admissions", status: 301 },
  { from: "/universities", to: "/admissions", status: 301 },
  { from: "/universities/*", to: "/admissions", status: 301 },
  { from: "/questions/*", to: "/faq", status: 301 },
  { from: "/tutors/*", to: "/blog", status: 301 },
  { from: "/blogs/*", to: "/blog", status: 301 },
  { from: "/degrees/*", to: "/admissions", status: 301 },
  // Specific pages
  { from: "/study-abroad", to: "/scholarships", status: 301 },
  { from: "/career-counseling", to: "/blog", status: 301 },
  { from: "/career-guide", to: "/blog", status: 301 },
  // Query param redirects (NEW)
  { from: "/admissions?*", to: "/admissions", status: 301 },
  { from: "/results?*", to: "/results", status: 301 },
  { from: "/news?*", to: "/news", status: 301 },
  { from: "/date-sheets?*", to: "/date-sheets", status: 301 },
  { from: "/scholarships?*", to: "/scholarships", status: 301 },
  { from: "/jobs?*", to: "/jobs", status: 301 },
  { from: "/blog?*", to: "/blog", status: 301 },
];

// ✅ FILE PATH (Database)
const CONFIG_FILE = path.join(process.cwd(), "services", "redirects", "redirects-data.json");

// ✅ Ensure file exists with defaults
function ensureFile() {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    // ✅ Create file with default redirects
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_REDIRECTS, null, 2), "utf-8");
    console.log(`✅ Created redirects file with ${DEFAULT_REDIRECTS.length} defaults`);
  }
}

// ✅ READ: Get all redirects from file (ALWAYS from file)
export function getRedirects(): RedirectRule[] {
  try {
    ensureFile();
    const data = fs.readFileSync(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (error) {
    console.error("Error reading redirects file:", error);
  }
  // ✅ Fallback to defaults if file is corrupt
  return [...DEFAULT_REDIRECTS];
}

// ✅ WRITE: Overwrite file with new data
export function saveRedirects(redirects: RedirectRule[]): void {
  try {
    ensureFile();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(redirects, null, 2), "utf-8");
    console.log(`✅ ${redirects.length} redirects saved to file`);
  } catch (error) {
    console.error("Error saving redirects:", error);
    throw new Error("Failed to save redirects");
  }
}

// ✅ ADD: Add new redirect (or update existing)
export function addRedirect(redirect: RedirectRule): void {
  const current = getRedirects();
  
  // ✅ Remove if already exists (avoid duplicates)
  const filtered = current.filter((r) => r.from !== redirect.from);
  
  // ✅ Add new redirect
  const updated = [...filtered, redirect];
  
  // ✅ Overwrite file
  saveRedirects(updated);
  
  console.log(`✅ Redirect added/updated: ${redirect.from} → ${redirect.to}`);
}

// ✅ DELETE: Remove redirect by "from" field
export function deleteRedirect(from: string): void {
  const current = getRedirects();
  const filtered = current.filter((r) => r.from !== from);
  
  if (filtered.length === current.length) {
    throw new Error(`Redirect "${from}" not found`);
  }
  
  saveRedirects(filtered);
  console.log(`✅ Redirect deleted: ${from}`);
}

// ✅ RESET: Restore to defaults (overwrite with DEFAULT_REDIRECTS)
export function resetRedirects(): void {
  saveRedirects([...DEFAULT_REDIRECTS]);
  console.log(`✅ Redirects reset to ${DEFAULT_REDIRECTS.length} defaults`);
}

// ✅ UPDATE: Update existing redirect
export function updateRedirect(oldFrom: string, newRedirect: RedirectRule): void {
  const current = getRedirects();
  
  // ✅ Remove old and add new
  const filtered = current.filter((r) => r.from !== oldFrom);
  const updated = [...filtered, newRedirect];
  
  saveRedirects(updated);
  console.log(`✅ Redirect updated: ${oldFrom} → ${newRedirect.from}`);
}

// ✅ GET: Find matching redirect
export function getRedirect(
  pathname: string,
  searchParams?: URLSearchParams
): { to: string; status: 301 | 302 } | null {
  const redirects = getRedirects(); // ✅ Always reads from file
  const cleanPath = removeTrailingSlash(pathname);

  // ✅ Check exact match
  const exactMatch = redirects.find((rule) => rule.from === cleanPath);
  if (exactMatch) {
    return { to: exactMatch.to, status: exactMatch.status };
  }

  // ✅ Check wildcard match (with query params)
  const wildcardMatch = redirects.find((rule) => {
    if (!rule.from.includes("*")) return false;
    
    let pattern = rule.from.replace(/\*/g, ".*");
    pattern = pattern.replace(/\?/g, "\\?");
    
    const regex = new RegExp(`^${pattern}$`);
    
    if (rule.from.includes("?*")) {
      const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      return regex.test(fullPath);
    }
    
    return regex.test(cleanPath);
  });

  if (wildcardMatch) {
    return { to: wildcardMatch.to, status: wildcardMatch.status };
  }

  return null;
}

function removeTrailingSlash(pathname: string): string {
  if (pathname === "/") return pathname;
  if (pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

// ✅ SYNC: Merge defaults with file (if file missing entries)
export function syncRedirects(): void {
  const current = getRedirects();
  const currentMap = new Map(current.map(r => [r.from, r]));
  const defaultMap = new Map(DEFAULT_REDIRECTS.map(r => [r.from, r]));
  
  // ✅ Add missing defaults
  let changed = false;
  for (const [key, value] of defaultMap) {
    if (!currentMap.has(key)) {
      currentMap.set(key, value);
      changed = true;
    }
  }
  
  if (changed) {
    const merged = Array.from(currentMap.values());
    saveRedirects(merged);
    console.log(`✅ Synced: Added missing defaults`);
  } else {
    console.log(`✅ Already in sync`);
  }
}