// Simple in-memory cache without external dependencies
const cache = new Map<string, { data: any; expiresAt: number }>();

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Get redirect from cache
export function getCachedRedirect(fromPath: string) {
  const cached = cache.get(fromPath);
  if (!cached) return undefined;
  
  // Check if expired
  if (Date.now() > cached.expiresAt) {
    cache.delete(fromPath);
    return undefined;
  }
  
  return cached.data;
}

// Set redirect in cache
export function setCachedRedirect(fromPath: string, redirect: any) {
  cache.set(fromPath, {
    data: redirect,
    expiresAt: Date.now() + CACHE_TTL
  });
}

// Clear entire cache
export function clearRedirectCache() {
  cache.clear();
}

// Remove specific redirect from cache
export function removeCachedRedirect(fromPath: string) {
  cache.delete(fromPath);
}

// Get cache stats (for debugging)
export function getCacheStats() {
  return {
    size: cache.size,
    itemCount: cache.size,
  };
}

// Optional: Clean expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now > value.expiresAt) {
      cache.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute