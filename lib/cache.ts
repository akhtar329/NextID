// lib/cache.ts
import { put, list, del } from "@vercel/blob";

const isVercel = true;
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

      // ✅ 1. Check memory first
      const memItem = this.memoryCache.get(key);
      if (memItem && memItem.expiresAt > Date.now()) {
        return memItem.data as T;
      }

      try {
        const { blobs } = await list({ prefix: CACHE_PREFIX });

        const blob = blobs.find(b => b.pathname === `${CACHE_PREFIX}${key}.json`);
        if (blob) {

          // ✅ FIX: Add Authorization header for private blob
          const response = await fetch(blob.url, {
            headers: {
              'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            },
          });

          if (!response.ok) {
            // Delete the blob if it's inaccessible
            await del(blob.pathname);
            return null;
          }

          const item: CacheItem = await response.json();

          if (item.expiresAt > Date.now()) {
            this.memoryCache.set(key, item);
            return item.data as T;
          } else {
            await del(blob.pathname);
          }
        } else {
        }
      } catch (blobError) {
        console.error(`❌ [GET] Blob fetch error for ${key}:`, blobError);
      }

      return null;
    } catch (error) {
      console.error(`❌ [GET] Cache get error for ${key}:`, error);
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
      try {
        await put(`${CACHE_PREFIX}${key}.json`, JSON.stringify(item), {
          access: "private",
          contentType: "application/json",
          allowOverwrite: true, // ✅ ADD THIS
        });

      } catch (blobError) {
        console.error(`❌ [SET] Vercel Blob save error for ${key}:`, blobError);
      }

    } catch {

    }
  }

  async clear(): Promise<void> {

    this.memoryCache.clear();
  

    try {
  
      const { blobs } = await list({ prefix: CACHE_PREFIX });


      for (const blob of blobs) {

        await del(blob.pathname);
      }

    } catch {

    }
  }
}

export const cache = new PersistentCache();