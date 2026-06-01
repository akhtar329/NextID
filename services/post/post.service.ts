// services/post.service.ts
import { postRepository, type Post } from "@/repositories/post/post.repository";
import { postCache } from "@/cache/post/post.cache";

class PostService {
  // ✅ Decision: Cache se lo? Ya Repository se?
  async getPost(slug: string): Promise<Post | null> {
    const cacheKey = `post:${slug}`;
    
    // 1. Pehle cache check
    const cached = postCache.get<Post>(cacheKey);
    if (cached) {
      return cached; // Cache se return
    }
    
    // 2. Cache mein nahi to repository se lao
    const post = await postRepository.getBySlug(slug);
    
    // 3. Repository se mila to cache mein dalo
    if (post) {
      postCache.set(cacheKey, post);
    }
    
    return post;
  }

  // ✅ Decision: Cache se lo? Ya Repository se? (WITH PAGINATION)
  async getPostsByType(type: string, limit: number = 10, offset: number = 0): Promise<Post[]> {
    const cacheKey = `posts:type:${type}:${limit}:${offset}`;
    
    // 1. Pehle cache check
    const cached = postCache.get<Post[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // 2. Cache mein nahi to repository se lao
    const posts = await postRepository.getByType(type, limit, offset);
    
    // 3. Cache mein dalo
    postCache.set(cacheKey, posts);
    
    return posts;
  }

  // ✅ NEW: Get total count of posts by type (for pagination)
  async getTotalCountByType(type: string): Promise<number> {
    const cacheKey = `posts:count:${type}`;
    
    // 1. Pehle cache check
    const cached = postCache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    // 2. Cache mein nahi to repository se lao
    const count = await postRepository.getCountByType(type);
    
    // 3. Cache mein dalo
    postCache.set(cacheKey, count);
    
    return count;
  }

  // ✅ NEW: Get posts with pagination (combined method)
  async getPostsByTypePaginated(
    type: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<{
    posts: Post[];
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    const offset = (page - 1) * limit;
    
    // Parallel fetch posts and count for better performance
    const [posts, total] = await Promise.all([
      this.getPostsByType(type, limit, offset),
      this.getTotalCountByType(type),
    ]);
    
    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  // ✅ Decision: Cache se lo? Ya Repository se?
  async getHomepageData(): Promise<{
    admissions: Post[];
    results: Post[];
    news: Post[];
    dateSheets: Post[];
    scholarships: Post[];
  }> {
    const cacheKey = "homepage:all";
    
    // 1. Pehle cache check
    const cached = postCache.get<{
      admissions: Post[];
      results: Post[];
      news: Post[];
      dateSheets: Post[];
      scholarships: Post[];
    }>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // 2. Cache mein nahi to repository se lao (ek hi query)
    const types = ["admission", "result", "news", "date_sheet", "scholarship"];
    const grouped = await postRepository.getByTypes(types, 5);
    
    const result = {
      admissions: grouped["admission"] || [],
      results: grouped["result"] || [],
      news: grouped["news"] || [],
      dateSheets: grouped["date_sheet"] || [],
      scholarships: grouped["scholarship"] || [],
    };
    
    // 3. Cache mein dalo
    postCache.set(cacheKey, result);
    
    return result;
  }

  // ✅ NEW: Get featured posts
  async getFeaturedPosts(limit: number = 6): Promise<Post[]> {
    const cacheKey = `posts:featured:${limit}`;
    
    const cached = postCache.get<Post[]>(cacheKey);
    if (cached) return cached;
    
    const posts = await postRepository.getFeatured(limit);
    postCache.set(cacheKey, posts);
    
    return posts;
  }

  // ✅ NEW: Get popular posts
  async getPopularPosts(limit: number = 8): Promise<Post[]> {
    const cacheKey = `posts:popular:${limit}`;
    
    const cached = postCache.get<Post[]>(cacheKey);
    if (cached) return cached;
    
    const posts = await postRepository.getPopular(limit);
    postCache.set(cacheKey, posts);
    
    return posts;
  }

  // ✅ NEW: Get recent posts
  async getRecentPosts(limit: number = 10): Promise<Post[]> {
    const cacheKey = `posts:recent:${limit}`;
    
    const cached = postCache.get<Post[]>(cacheKey);
    if (cached) return cached;
    
    const posts = await postRepository.getRecent(limit);
    postCache.set(cacheKey, posts);
    
    return posts;
  }

  // ✅ NEW: Get related posts (same type, exclude current)
  async getRelatedPosts(currentSlug: string, type: string, limit: number = 5): Promise<Post[]> {
    const cacheKey = `posts:related:${type}:${currentSlug}:${limit}`;
    
    const cached = postCache.get<Post[]>(cacheKey);
    if (cached) return cached;
    
    const posts = await postRepository.getRelated(currentSlug, type, limit);
    postCache.set(cacheKey, posts);
    
    return posts;
  }

  // ✅ Decision: View count - Cache mat karo, direct repository
  trackView(slug: string): void {
    // Fire and forget - no cache
    postRepository.incrementViewCount(slug).catch(console.error);
  }

  // ✅ Admin: Post update ke baad cache clear karne ka decision
  clearPostCache(slug: string): void {
    postCache.delete(`post:${slug}`);
    postCache.deletePattern("homepage");
    postCache.deletePattern("posts:type:");
    postCache.deletePattern(`posts:related:`);
  }

  // ✅ Admin: Clear cache by type
  clearTypeCache(type: string): void {
    postCache.deletePattern(`posts:type:${type}`);
    postCache.deletePattern(`posts:count:${type}`);
    postCache.deletePattern("homepage");
  }

  // ✅ Admin: Puri cache clear
  clearAllCache(): void {
    postCache.clear();
  }
}

export const postService = new PostService();