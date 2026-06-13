// services/post/post.service.ts

import { revalidateTag } from "next/cache";
import { postRepository } from "@/repositories/post/post.repository";
import type { Post } from "@/types/post";
import { cacheTag, cacheLife } from "next/cache";

interface ExtendedPost extends Post {


  
  actualImage: string | null;
}

type PostType =
  | "result"
  | "admission"
  | "news"
  | "date_sheet"
  | "scholarship"
  | "blog"
  | "job";

/* =========================
IMAGE NORMALIZER
========================= */
function normalizeImage(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("/")) return url;
  return `/uploads/${url}`;
}

/* =========================
MAP POST
========================= */
function mapPost(post: Post): ExtendedPost {
  const image = normalizeImage(post.featuredImage);

  return {
    ...post,
    featuredImage: image,
    actualImage: image,
  };
}

/* =========================
SERVICE
========================= */
export const postService = {
  async getPost(slug: string): Promise<ExtendedPost | null> {
    const post = await postRepository.getBySlug(slug);
    return post ? mapPost(post) : null;
  },

async getPostsByType(
  type: PostType,
  limit = 10
): Promise<ExtendedPost[]> {
  "use cache";

  cacheTag(`posts-${type}`);
  cacheLife("hours");

  const posts = await postRepository.getByType(type, limit);

  return posts.map(mapPost);
},

  async getHomepageData() {
    const types: PostType[] = ["admission", "result", "news", "date_sheet", "scholarship"];

    const grouped = await postRepository.getByTypes(types, 5);

    const map = (arr: Post[]) => arr.map(mapPost);

    return {
      admissions: map(grouped.admission || []),
      results: map(grouped.result || []),
      news: map(grouped.news || []),
      dateSheets: map(grouped.date_sheet || []),
      scholarships: map(grouped.scholarship || []),
    };
  },

  async getFeaturedPosts(limit = 6) {
    return (await postRepository.getFeatured(limit)).map(mapPost);
  },

  async getPopularPosts(limit = 8) {
    return (await postRepository.getPopular(limit)).map(mapPost);
  },

  async getRecentPosts(limit = 10) {
    return (await postRepository.getRecent(limit)).map(mapPost);
  },

  async getRelatedPosts(slug: string, type: PostType, limit = 5) {
    return (await postRepository.getRelated(slug, type, limit)).map(mapPost);
  },

  /* =========================
CACHE INVALIDATION (FIXED)
========================= */
  async clearPostCache(slug: string) {
  revalidateTag(`post:${slug}`, "page");
  revalidateTag("homepage", "page");
},

  async clearTypeCache(type: string) {
    revalidateTag(`type:${type}`, "page");
    revalidateTag("homepage", "page");
  },

  async clearAllCache() {
    [
      "homepage",
      "posts:featured",
      "posts:popular",
      "posts:recent",
    ].forEach((tag) => revalidateTag(tag, "page"));
  },
};