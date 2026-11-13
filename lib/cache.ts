
interface CacheItem<T = unknown> {
  data: T;
  timestamp: number;
  expiresAt: number;
  hitCount?: number;
}

export class PersistentCache {
  private memoryCache = new Map<string, CacheItem<unknown>>();

  // Default TTL: 3600 seconds (1 hour)
  private defaultTTL = 3600 * 1000;

  private stats = {
    hits: 0,
    misses: 0,
    saves: 0,
    expires: 0,
    totalDuration: 0,
  };

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();

    try {
      const item = this.memoryCache.get(key);

      if (!item) {
        this.stats.misses++;
        return null;
      }

      if (item.expiresAt <= Date.now()) {
        this.memoryCache.delete(key);
        this.stats.expires++;
        this.stats.misses++;
        return null;
      }

      item.hitCount = (item.hitCount || 0) + 1;

      this.stats.hits++;

      return item.data as T;
    } catch (error) {
      console.error(`Cache get error for ${key}:`, error);
      this.stats.misses++;
      return null;
    } finally {
      this.stats.totalDuration += Date.now() - startTime;
    }
  }

  async set<T = unknown>(
    key: string,
    data: T,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const now = Date.now();

      const item: CacheItem<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        hitCount: 0,
      };

      this.memoryCache.set(key, item);
      this.stats.saves++;
    } catch (error) {
      console.error(`Cache set error for ${key}:`, error);
    } finally {
      this.stats.totalDuration += Date.now() - startTime;
    }
  }

  async clear(): Promise<void> {
    const startTime = Date.now();

    try {
      this.memoryCache.clear();

      this.stats.hits = 0;
      this.stats.misses = 0;
      this.stats.saves = 0;
      this.stats.expires = 0;
      this.stats.totalDuration = 0;
    } catch (error) {
      console.error("Cache clear error:", error);
    } finally {
      this.stats.totalDuration += Date.now() - startTime;
    }
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;

    const hitRate =
      total > 0
        ? ((this.stats.hits / total) * 100).toFixed(1) + "%"
        : "0%";

    return {
      ...this.stats,
      hitRate,
      memorySize: this.memoryCache.size,
    };
  }

  getKeys(): string[] {
    return Array.from(this.memoryCache.keys());
  }
}

export const cache = new PersistentCache();
