// services/sidebar/sidebar.service.ts

import { cacheTag, cacheLife } from "next/cache";
import { sidebarRepository } from "@/repositories/sidebar/sidebar.repository";
import type { Post, PostType } from "@/types/post";

// ============ TYPES ============
export interface ExtendedPost extends Post {
  actualImage: string | null;
  meta: Record<string, unknown> | null;
}

interface SidebarData {
  trending: ExtendedPost[];
  breaking: ExtendedPost[];
  featured: ExtendedPost[];
  quickAccess: Record<string, number>;
}

// ============ HELPER FUNCTIONS ============
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

// ============ INTERNAL CACHED FUNCTIONS ============

async function getTrendingPostsInternal(limit: number = 10): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("sidebar-trending");
  cacheTag("trending-posts");
  cacheLife({ revalidate: 86400 });

  const posts = await sidebarRepository.getTrendingPosts(limit);
  return posts.map(mapPost);
}

async function getBreakingNewsInternal(limit: number = 5): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("sidebar-breaking");
  cacheTag("breaking-posts");
  cacheTag("breaking-news");
  cacheLife({ revalidate: 3600 });

  const posts = await sidebarRepository.getBreakingNews(limit);
  return posts.map(mapPost);
}

async function getFeaturedPostsInternal(limit: number = 10): Promise<ExtendedPost[]> {
  "use cache";
  cacheTag("sidebar-featured");
  cacheTag("featured-posts");
  cacheLife({ revalidate: 86400 });

  const posts = await sidebarRepository.getFeaturedPosts(limit);
  return posts.map(mapPost);
}

async function getQuickAccessCountsInternal(): Promise<Record<string, number>> {
  "use cache";
  cacheTag("sidebar-quick-access");
  cacheTag("quick-access-counts");
  cacheTag("post-counts");
  cacheLife({ revalidate: 86400 });

  return await sidebarRepository.getQuickAccessCounts();
}

async function getSidebarDataInternal(): Promise<SidebarData> {
  "use cache";
  cacheTag("sidebar-widgets");
  cacheTag("sidebar-data");
  cacheLife({ revalidate: 86400 });

  const [trending, breaking, featured, quickAccess] = await Promise.all([
    getTrendingPostsInternal(10),
    getBreakingNewsInternal(5),
    getFeaturedPostsInternal(10),
    getQuickAccessCountsInternal(),
  ]);

  return {
    trending,
    breaking,
    featured,
    quickAccess,
  };
}

async function getSidebarWidgetsInternal(
  trendingLimit: number = 5,
  breakingLimit: number = 3,
  featuredLimit: number = 4
): Promise<SidebarData> {
  "use cache";
  cacheTag("sidebar-widgets");
  cacheLife({ revalidate: 86400 });

  const [trending, breaking, featured, quickAccess] = await Promise.all([
    getTrendingPostsInternal(trendingLimit),
    getBreakingNewsInternal(breakingLimit),
    getFeaturedPostsInternal(featuredLimit),
    getQuickAccessCountsInternal(),
  ]);

  return {
    trending,
    breaking,
    featured,
    quickAccess,
  };
}

// ============ EXPORTED SERVICE ============

export const sidebarService = {
  /**
   * Get all sidebar data in one call
   * Cached for 1 day
   */
  async getSidebarData(): Promise<SidebarData> {
    return getSidebarDataInternal();
  },

  /**
   * Get trending posts across all types
   * Trending = popular posts sorted by viewCount
   */
  async getTrendingPosts(limit: number = 10): Promise<ExtendedPost[]> {
    return getTrendingPostsInternal(limit);
  },

  /**
   * Get breaking news posts
   */
  async getBreakingNews(limit: number = 5): Promise<ExtendedPost[]> {
    return getBreakingNewsInternal(limit);
  },

  /**
   * Get featured posts across all types
   */
  async getFeaturedPosts(limit: number = 10): Promise<ExtendedPost[]> {
    return getFeaturedPostsInternal(limit);
  },

  /**
   * Get quick access counts for all post types
   */
  async getQuickAccessCounts(): Promise<Record<string, number>> {
    return getQuickAccessCountsInternal();
  },

  /**
   * Get all sidebar widgets data with specific limits
   */
  async getSidebarWidgets(
    trendingLimit: number = 5,
    breakingLimit: number = 3,
    featuredLimit: number = 4
  ): Promise<SidebarData> {
    return getSidebarWidgetsInternal(trendingLimit, breakingLimit, featuredLimit);
  },
};