// cache/admissions/admissions.cache.ts
import { unstable_cache } from "next/cache";
import { getAdmissionsFiltered, getAdmissionsStatsRaw } from "@/repositories/admissions/admissions.repo";
import { AdmissionFilters, AdmissionsResponse, AdmissionStats } from "@/types/admissions.types";

// Cache TTLs based on content type
const CACHE_TTL = {
  HOMEPAGE: 1800,      // 30 minutes - No filters
  LISTING: 21600,      // 6 hours - With city/level filters  
  SEARCH: 300,         // 5 minutes - Search queries
  STATS: 21600,        // 6 hours - Stats
} as const;

// Determine cache TTL based on filters
function getCacheTTL(filters: AdmissionFilters): number {
  if (filters.q && filters.q.length > 0) {
    return CACHE_TTL.SEARCH;
  }
  if (filters.city || filters.level) {
    return CACHE_TTL.LISTING;
  }
  return CACHE_TTL.HOMEPAGE;
}

// Generate cache key based on filters
function getCacheKey(filters: AdmissionFilters): string {
  const keyParts = ["admissions"];
  if (filters.city) keyParts.push(`city:${filters.city}`);
  if (filters.level) keyParts.push(`level:${filters.level}`);
  if (filters.q) keyParts.push(`search:${filters.q.substring(0, 50)}`);
  if (filters.page && filters.page > 1) keyParts.push(`page:${filters.page}`);
  if (filters.showClosed) keyParts.push("closed");
  return keyParts.join(":");
}

export const getCachedAdmissions = (filters: AdmissionFilters, ttl?: number): Promise<AdmissionsResponse> => {
  const revalidateTime = ttl || getCacheTTL(filters);
  const cacheKey = getCacheKey(filters);
  
  return unstable_cache(
    async () => getAdmissionsFiltered(filters),
    [cacheKey],
    { revalidate: revalidateTime }
  )();
};

export const getCachedAdmissionsStats = (ttl?: number): Promise<AdmissionStats> => {
  const revalidateTime = ttl || CACHE_TTL.STATS;
  
  return unstable_cache(
    async () => getAdmissionsStatsRaw(),
    ["admissions:stats"],
    { revalidate: revalidateTime }
  )();
};

// Simple cache invalidation - just export a function to clear
// Call this from admin panel after updates
export const invalidateAdmissionsCache = () => {
  // This is a placeholder - Next.js automatically handles cache invalidation
  // based on revalidate time. For manual invalidation, use:
  // revalidateTag() or revalidatePath() in a Server Action
  console.log('[Cache] Cache invalidation requested');
};

// Export for convenience
export { getAdmissionsFiltered as getAdmissionsFresh };