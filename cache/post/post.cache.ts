// cache/post.cache.ts


interface CacheItem<T> {
  data: T;
  expires: number;
}

class PostCache {
  private cache: Map<string, CacheItem<unknown>> = new Map();
  private readonly TTL = 86400; // 24 hours in seconds

  // ✅ Sirf cache mein store karna
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.TTL * 1000,
    });
  }

  // ✅ Sirf cache se lena
  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  // ✅ Sirf cache delete karna
  delete(key: string): void {
    this.cache.delete(key);
  }

  // ✅ Pattern se cache delete karna
  deletePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // ✅ Puri cache clear karna
  clear(): void {
    this.cache.clear();
  }

  // ✅ Check cache exists
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
}

export const postCache = new PostCache();