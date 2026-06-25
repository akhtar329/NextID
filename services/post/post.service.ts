// services/post/post.service.ts

import { revalidateTag } from "next/cache";
import { postRepository } from "@/repositories/post/post.repository";
import type { Post } from "@/types/post";
import { cacheTag, cacheLife } from "next/cache";

type PostType = "result" | "admission" | "news" | "date_sheet" | "scholarship" | "blog" | "job";

// ✅ EXPORT ADDED
export interface ExtendedPost extends Post {
  actualImage: string | null;
  meta: Record<string, unknown> | null;
}

function normalizeImage(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("/")) return url;
  return `/uploads/${url}`;
}

function mapPost(post: Post): ExtendedPost {
  return {
    ...post,
    featuredImage: normalizeImage(post.featuredImage),
    actualImage: normalizeImage(post.featuredImage),
    meta: post.meta || null,
  };
}

// ============ CACHED DATE UTILITIES ============

/**
 * Get current year with cache (revalidates on rebuild)
 * Use this instead of new Date().getFullYear() in Server Components
 */
export async function getCurrentYear(): Promise<string> {
  "use cache";
  cacheTag("current-year");
  cacheLife({ revalidate: 31536000 });
  
  return new Date().getFullYear().toString();
}

/**
 * Get current date with cache
 */
export async function getCurrentDate(): Promise<Date> {
  "use cache";
  cacheTag("current-date");
  cacheLife({ revalidate: 3600 });
  
  return new Date();
}

/**
 * Calculate days left until deadline (cached)
 */
export async function getDaysLeft(deadline: Date | string | null): Promise<number | null> {
  "use cache";
  const deadlineKey = deadline instanceof Date ? deadline.toISOString() : 
                     typeof deadline === 'string' ? deadline : 'null';
  cacheTag(`days-left-${deadlineKey}`);
  cacheLife({ revalidate: 3600 });
  
  if (!deadline) return null;
  
  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : null;
}

/**
 * Check if deadline is near (within given days threshold)
 */
export async function isDeadlineNear(deadline: Date | string | null, daysThreshold: number = 7): Promise<boolean> {
  "use cache";
  const deadlineKey = deadline instanceof Date ? deadline.toISOString() : 
                     typeof deadline === 'string' ? deadline : 'null';
  cacheTag(`deadline-near-${deadlineKey}-${daysThreshold}`);
  cacheLife({ revalidate: 3600 });
  
  if (!deadline) return false;
  
  const daysLeft = await getDaysLeft(deadline);
  return daysLeft !== null && daysLeft <= daysThreshold && daysLeft > 0;
}

/**
 * Check if deadline is passed
 */
export async function isDeadlinePassed(deadline: Date | string | null): Promise<boolean> {
  "use cache";
  const deadlineKey = deadline instanceof Date ? deadline.toISOString() : 
                     typeof deadline === 'string' ? deadline : 'null';
  cacheTag(`deadline-passed-${deadlineKey}`);
  cacheLife({ revalidate: 3600 });
  
  if (!deadline) return false;
  
  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
  const today = new Date();
  return deadlineDate < today;
}

/**
 * Format date to short format (e.g., "Jan 15, 2026")
 */
export async function formatShortDate(date: Date | string | null): Promise<string> {
  "use cache";
  const dateKey = date instanceof Date ? date.toISOString() : 
                  typeof date === 'string' ? date : 'null';
  cacheTag(`short-date-${dateKey}`);
  cacheLife({ revalidate: 3600 });
  
  if (!date) return 'TBA';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format date to long format (e.g., "15 January 2026")
 */
export async function formatLongDate(date: Date | string | null): Promise<string> {
  "use cache";
  const dateKey = date instanceof Date ? date.toISOString() : 
                  typeof date === 'string' ? date : 'null';
  cacheTag(`long-date-${dateKey}`);
  cacheLife({ revalidate: 3600 });
  
  if (!date) return 'TBA';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Check if status is open based on deadline
 */
export async function isOpen(deadline: Date | string | null): Promise<boolean> {
  "use cache";
  const deadlineKey = deadline instanceof Date ? deadline.toISOString() : 
                     typeof deadline === 'string' ? deadline : 'null';
  cacheTag(`is-open-${deadlineKey}`);
  cacheLife({ revalidate: 3600 });
  
  const passed = await isDeadlinePassed(deadline);
  return !passed;
}

// ============ MAIN POST SERVICE ============

// ✅ Separate function for getList (used by preCache functions)
async function getListInternal(
  type: PostType | 'all',
  limit: number = 10,
  offset: number = 0,
  filters?: { featured?: boolean; popular?: boolean; breaking?: boolean }
): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag(`list-${type}-${limit}-${offset}`);
  cacheLife({ revalidate: 3600 });
  
  const posts = await postRepository.getList(type, limit, offset, filters);
  return posts.map(mapPost);
}

async function getDetailInternal(slug: string): Promise<ExtendedPost | null> {
  "use cache";
  cacheTag(`detail-${slug}`);
  cacheLife({ revalidate: 3600 });
  
  const post = await postRepository.getDetail(slug);
  return post ? mapPost(post) : null;
}

async function getRelatedInternal(
  currentId: number,
  type: PostType,
  limit: number = 5
): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag(`related-${currentId}-${type}`);
  cacheLife({ revalidate: 3600 });
  
  const posts = await postRepository.getRelated(currentId, type, limit);
  return posts.map(mapPost);
}

async function getTotalCountInternal(type: PostType | 'all'): Promise<number> {
  "use cache";
  cacheTag(`count-${type}`);
  cacheLife({ revalidate: 3600 });
  
  return await postRepository.getTotalCount(type);
}

// ✅ Pre-cache functions without "use cache" (they call internal cached functions)
async function preCacheAllTypesInternal(limit: number = 100): Promise<void> {
  const types: PostType[] = [
    'admission',
    'result', 
    'news',
    'date_sheet',
    'scholarship',
    'job',
    'blog'
  ];
  
  // ✅ Parallel fetch all types (each has "use cache" internally)
  await Promise.all(
    types.map(type => getListInternal(type, limit, 0, {}))
  );
}

async function preCacheTypeInternal(type: PostType, limit: number = 100): Promise<void> {
  await getListInternal(type, limit, 0, {});
}

async function preCacheCustomInternal(types: PostType[], limit: number = 100): Promise<void> {
  await Promise.all(
    types.map(type => getListInternal(type, limit, 0, {}))
  );
}

// ============ EXPORTED SERVICE ============

export const postService = {
  async getList(
    type: PostType | 'all',
    limit: number = 10,
    offset: number = 0,
    filters?: { featured?: boolean; popular?: boolean; breaking?: boolean }
  ): Promise<ExtendedPost[]> {
    return getListInternal(type, limit, offset, filters);
  },

  async getDetail(slug: string): Promise<ExtendedPost | null> {
    return getDetailInternal(slug);
  },

  async getRelated(
    currentId: number,
    type: PostType,
    limit: number = 5
  ): Promise<ExtendedPost[]> {
    return getRelatedInternal(currentId, type, limit);
  },

  async getTotalCount(type: PostType | 'all'): Promise<number> {
    return getTotalCountInternal(type);
  },

  async clearCache(slug?: string) {
    if (slug) {
      revalidateTag(`detail-${slug}`, "page");
    }
    revalidateTag("homepage", "page");
  },

  // ============================================================
  // ✅ PRE-CACHE FUNCTIONS
  // ============================================================

  /**
   * Pre-cache all post types (admission, result, news, etc.)
   * Call this from homepage or layout to preload cache
   */
  async preCacheAllTypes(limit: number = 100): Promise<void> {
    await preCacheAllTypesInternal(limit);
  },

  /**
   * Pre-cache a specific type
   */
  async preCacheType(type: PostType, limit: number = 100): Promise<void> {
    await preCacheTypeInternal(type, limit);
  },

  /**
   * Pre-cache with custom limit and types
   */
  async preCacheCustom(types: PostType[], limit: number = 100): Promise<void> {
    await preCacheCustomInternal(types, limit);
  },
};