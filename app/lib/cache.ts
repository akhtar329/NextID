type CacheEntry<T = any> = {
  data: T;
  expiresAt: number;
  lastAccessed: number;
};

const cache = new Map<string, CacheEntry<any>>();

const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour
const MAX_SIZE = 5000;

// ================= GET =================
export function getCachedRedirect<T = any>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }

  entry.lastAccessed = Date.now();
  return entry.data;
}

// ================= SET =================
export function setCachedRedirect<T = any>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL
) {
  if (cache.size >= MAX_SIZE) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [k, v] of cache.entries()) {
      if (v.lastAccessed < oldestTime) {
        oldestTime = v.lastAccessed;
        oldestKey = k;
      }
    }

    if (oldestKey) cache.delete(oldestKey);
  }

  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
    lastAccessed: Date.now(),
  });
}

// ================= DELETE =================
export function removeCachedRedirect(key: string) {
  cache.delete(key);
}

// ================= CLEAR =================
export function clearRedirectCache() {
  cache.clear();
}

// ================= STATS =================
export function getCacheStats() {
  return {
    size: cache.size,
    maxSize: MAX_SIZE,
    memoryMode: "in-memory (per server instance)",
  };
}

// ================= CLEANUP =================
setInterval(() => {
  const now = Date.now();

  for (const [key, value] of cache.entries()) {
    if (now > value.expiresAt) {
      cache.delete(key);
    }
  }
}, 60 * 1000);