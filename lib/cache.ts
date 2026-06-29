// lib/cache.ts
import { put, list, del } from "@vercel/blob";
import { writeLog, type LogEntry } from "./logger";

const isVercel = true;
const CACHE_PREFIX = "cache/";

interface CacheItem<T = unknown> {
  data: T;
  timestamp: number;
  expiresAt: number;
  hitCount?: number;
}

export class PersistentCache {
  private memoryCache = new Map<string, CacheItem<unknown>>();
  private defaultTTL = 3600 * 1000; // 1 hour
  private stats = {
    hits: 0,
    misses: 0,
    saves: 0,
    expires: 0,
    totalDuration: 0,
  };

  // ✅ Log helper
  private async logEvent(
    type: "CACHE_HIT" | "CACHE_MISS" | "CACHE_SAVE" | "CACHE_EXPIRE",
    operation: string,
    data?: Record<string, unknown>,
    duration?: number
  ): Promise<void> {
    const entry: LogEntry = {
      id: `cache_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      operation,
      source: "cache",
      duration,
      data: data || {},
    };

    try {
      await writeLog(entry);
    } catch (error) {
      // Silent fail for logs
      console.error("Log write failed:", error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();

    try {
      // ✅ 1. Check memory first
      const memItem = this.memoryCache.get(key);
      if (memItem && memItem.expiresAt > Date.now()) {
        memItem.hitCount = (memItem.hitCount || 0) + 1;
        this.stats.hits++;
        this.stats.totalDuration += Date.now() - startTime;

        // ✅ Log memory hit
        await this.logEvent(
          "CACHE_HIT",
          `memory:${key}`,
          {
            hitCount: memItem.hitCount,
            age: Math.round((Date.now() - memItem.timestamp) / 1000),
            expiresIn: Math.round((memItem.expiresAt - Date.now()) / 1000),
            source: "memory",
          },
          Date.now() - startTime
        );

        return memItem.data as T;
      }

      // ✅ 2. Check Vercel Blob
      try {
        const { blobs } = await list({ prefix: CACHE_PREFIX });
        const blob = blobs.find(b => b.pathname === `${CACHE_PREFIX}${key}.json`);

        if (blob) {
          const response = await fetch(blob.url, {
            headers: {
              'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            },
          });

          if (!response.ok) {
            await del(blob.pathname);
            
            // ✅ Log blob access failure
            await this.logEvent(
              "CACHE_MISS",
              `blob:${key}`,
              {
                reason: "access_failed",
                status: response.status,
              },
              Date.now() - startTime
            );
            
            return null;
          }

          const item: CacheItem = await response.json();

          if (item.expiresAt > Date.now()) {
            this.memoryCache.set(key, item);
            this.stats.hits++;
            this.stats.totalDuration += Date.now() - startTime;

            // ✅ Log blob hit
            await this.logEvent(
              "CACHE_HIT",
              `blob:${key}`,
              {
                age: Math.round((Date.now() - item.timestamp) / 1000),
                expiresIn: Math.round((item.expiresAt - Date.now()) / 1000),
                source: "blob",
                dataSize: JSON.stringify(item).length,
              },
              Date.now() - startTime
            );

            return item.data as T;
          } else {
            // ✅ Cache expired
            this.stats.expires++;
            await del(blob.pathname);
            
            // ✅ Log expiration
            await this.logEvent(
              "CACHE_EXPIRE",
              `blob:${key}`,
              {
                expiredAt: new Date(item.expiresAt).toISOString(),
                age: Math.round((Date.now() - item.timestamp) / 1000),
              },
              Date.now() - startTime
            );
          }
        }
      } catch (blobError) {
        console.error(`❌ Blob fetch error for ${key}:`, blobError);
        
        // ✅ Log error
        await this.logEvent(
          "CACHE_MISS",
          `blob:${key}`,
          {
            reason: "error",
            error: blobError instanceof Error ? blobError.message : String(blobError),
          },
          Date.now() - startTime
        );
      }

      // ✅ Cache miss
      this.stats.misses++;
      this.stats.totalDuration += Date.now() - startTime;

      await this.logEvent(
        "CACHE_MISS",
        `miss:${key}`,
        {
          reason: "not_found",
        },
        Date.now() - startTime
      );

      return null;
    } catch (error) {
      console.error(`❌ Cache get error for ${key}:`, error);
      
      await this.logEvent(
        "CACHE_MISS",
        `error:${key}`,
        {
          reason: "error",
          error: error instanceof Error ? error.message : String(error),
        },
        Date.now() - startTime
      );

      return null;
    }
  }

  async set<T = unknown>(key: string, data: T, ttl: number = this.defaultTTL): Promise<void> {
    const startTime = Date.now();

    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
        hitCount: 0,
      };

      // ✅ Save to memory
      this.memoryCache.set(key, item);
      this.stats.saves++;

      // ✅ Save to Vercel Blob
      try {
        await put(`${CACHE_PREFIX}${key}.json`, JSON.stringify(item), {
          access: "private",
          contentType: "application/json",
          allowOverwrite: true,
        });

        // ✅ Log save success
        await this.logEvent(
          "CACHE_SAVE",
          `save:${key}`,
          {
            ttl: Math.round(ttl / 1000),
            expiresAt: new Date(item.expiresAt).toISOString(),
            dataSize: JSON.stringify(item).length,
            source: "blob",
          },
          Date.now() - startTime
        );
      } catch (blobError) {
        console.error(`❌ Blob save error for ${key}:`, blobError);
        
        // ✅ Log save error
        await this.logEvent(
          "CACHE_SAVE",
          `save:${key}`,
          {
            success: false,
            error: blobError instanceof Error ? blobError.message : String(blobError),
            source: "blob",
          },
          Date.now() - startTime
        );
      }
    } catch (error) {
      console.error(`❌ Cache set error for ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    const startTime = Date.now();

    try {
      const memorySize = this.memoryCache.size;
      this.memoryCache.clear();

      // ✅ Clear blob storage
      try {
        const { blobs } = await list({ prefix: CACHE_PREFIX });
        for (const blob of blobs) {
          await del(blob.pathname);
        }

        // ✅ Log clear success
        await this.logEvent(
          "CACHE_SAVE",
          "clear:all",
          {
            memoryItems: memorySize,
            blobItems: blobs.length,
            duration: Date.now() - startTime,
          },
          Date.now() - startTime
        );
      } catch (blobError) {
        console.error(`❌ Blob clear error:`, blobError);
      }
    } catch (error) {
      console.error(`❌ Cache clear error:`, error);
    }
  }

  // ✅ Get cache statistics
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) + '%' : '0%';
    
    return {
      ...this.stats,
      hitRate,
      memorySize: this.memoryCache.size,
    };
  }

  // ✅ Get memory keys
  getKeys(): string[] {
    return Array.from(this.memoryCache.keys());
  }
}

export const cache = new PersistentCache();