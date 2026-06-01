// services/admissions/admissions.service.ts
import { getCachedAdmissions, getCachedAdmissionsStats, invalidateAdmissionsCache } from "@/cache/admissions/admissions.cache";
import { getAdmissionsFiltered, getAdmissionsStatsRaw } from "@/repositories/admissions/admissions.repo";
import { AdmissionFilters, AdmissionsResponse, AdmissionStats } from "@/types/admissions.types";

// Cache TTLs in seconds (as per your requirement)
const CACHE_TTL = {
  HOMEPAGE: 30 * 60,        // 30 minutes - No filters
  LISTING: 6 * 60 * 60,     // 6 hours - With filters
  SEARCH: 5 * 60,           // 5 minutes only - Search queries
  ADMIN_UPDATE: 0,          // No cache on admin update
} as const;

// Decision function - Maximum CU saving strategy
function shouldUseCache(filters: AdmissionFilters, forceFresh?: boolean): boolean {
  // Admin forced fresh data (after update)
  if (forceFresh) return false;
  
  // Search queries - very short cache only (5 min)
  // Still saves 80% CU vs no cache
  if (filters.q && filters.q.length > 0) {
    return true; // Will use cache but with short TTL
  }
  
  // Specific filters (city, level) - 6 hours cache
  if (filters.city || filters.level) {
    return true; // Saves 95% CU
  }
  
  // Homepage (no filters) - 30 min cache
  return true; // Saves 98% CU
}

function getCacheTTL(filters: AdmissionFilters): number {
  // Search queries - short cache
  if (filters.q && filters.q.length > 0) {
    return CACHE_TTL.SEARCH;
  }
  
  // Specific filters - medium cache
  if (filters.city || filters.level) {
    return CACHE_TTL.LISTING;
  }
  
  // Homepage - short but frequent updates
  return CACHE_TTL.HOMEPAGE;
}

export async function getAdmissionsPage(
  filters: AdmissionFilters, 
  forceFresh?: boolean
): Promise<AdmissionsResponse> {
  // Validation
  if (filters.page < 1) {
    filters.page = 1;
  }
  
  if (filters.q && filters.q.length > 100) {
    throw new Error("Search query too long");
  }
  
  // Dynamic cache decision based on filters
  const useCache = shouldUseCache(filters, forceFresh);
  
  if (useCache) {
    const ttl = getCacheTTL(filters);
    // Pass TTL to cache layer
    return getCachedAdmissions(filters, ttl);
  }
  
  // Fresh data from database (admin update or force fresh)
  console.log(`[Service] Fetching fresh data for:`, filters);
  return getAdmissionsFiltered(filters);
}

export async function getAdmissionsStats(forceFresh?: boolean): Promise<AdmissionStats> {
  const useCache = !forceFresh;
  
  if (useCache) {
    return getCachedAdmissionsStats(CACHE_TTL.LISTING);
  }
  
  // Fresh stats from database
  console.log(`[Service] Fetching fresh stats from database`);
  // FIXED: Use correct function name - getAdmissionsStatsRaw
  return getAdmissionsStatsRaw();
}

// For admin panel - ALWAYS fresh data + clear cache
export async function refreshAdmissionsData(filters?: AdmissionFilters): Promise<void> {
  console.log(`[Service] Admin update - clearing cache`);
  
  // Clear relevant cache
  if (filters) {
    // Clear specific cache
    await invalidateAdmissionsCache();
  } else {
    // Clear ALL admissions cache
    await invalidateAdmissionsCache();
  }
}

// For admin updates - force fresh data for next request
export async function getAdmissionsPageNoCache(filters: AdmissionFilters): Promise<AdmissionsResponse> {
  return getAdmissionsPage(filters, true); // forceFresh = true
}