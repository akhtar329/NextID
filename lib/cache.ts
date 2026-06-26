// lib/cache.ts
import { put, list, del } from "@vercel/blob";

const isVercel = process.env.VERCEL === "1";
const CACHE_PREFIX = "cache/";

interface CacheItem<T = unknown> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class PersistentCache {
  private memoryCache = new Map<string, CacheItem<unknown>>();
  private defaultTTL = 3600 * 1000; // 1 hour

  async get<T>(key: string): Promise<T | null> {
    try {
      // ✅ 1. Check memory first (fast)
      const memItem = this.memoryCache.get(key);
      if (memItem && memItem.expiresAt > Date.now()) {
        return memItem.data as T;
      }

      // ✅ 2. Check Vercel Blob (persistent)
      if (isVercel) {
        const { blobs } = await list({ prefix: CACHE_PREFIX });
        const blob = blobs.find(b => b.pathname === `${CACHE_PREFIX}${key}.json`);
        if (blob) {
          const response = await fetch(blob.url);
          const item: CacheItem = await response.json();
          if (item.expiresAt > Date.now()) {
            // Save to memory for faster access
            this.memoryCache.set(key, item);
            return item.data as T;
          } else {
            // Delete expired blob
            await del(blob.pathname);
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set<T = unknown>(key: string, data: T, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };

      // ✅ Save to memory
      this.memoryCache.set(key, item);

      // ✅ Save to Vercel Blob (persistent)
      if (isVercel) {
        await put(`${CACHE_PREFIX}${key}.json`, JSON.stringify(item), {
          access: "public",
          contentType: "application/json",
        });
      }
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    if (isVercel) {
      try {
        const { blobs } = await list({ prefix: CACHE_PREFIX });
        for (const blob of blobs) {
          await del(blob.pathname);
        }
      } catch (error) {
        console.error("Cache clear error:", error);
      }
    }
  }
}

export const cache = new PersistentCache();