// services/post/post.service.ts
import { cacheLife, cacheTag, revalidateTag, revalidatePath } from 'next/cache'
import { postRepository, type Post } from "@/repositories/post/post.repository";

// ✅ Convert to static methods
export const postService = {
  
  async getPost(slug: string): Promise<Post | null> {
    'use cache'
    cacheLife('days')
    cacheTag(`post-${slug}`)
    
    return await postRepository.getBySlug(slug);
  },

  async getPostsByType(type: string, limit: number = 10, offset: number = 0): Promise<Post[]> {
    'use cache'
    cacheLife('days')
    cacheTag(`posts-type-${type}`)
    
    return await postRepository.getByType(type, limit, offset);
  },

  async getTotalCountByType(type: string): Promise<number> {
    'use cache'
    cacheLife('days')
    cacheTag(`posts-count-${type}`)
    
    return await postRepository.getCountByType(type);
  },

  async getHomepageData(): Promise<{
    admissions: Post[];
    results: Post[];
    news: Post[];
    dateSheets: Post[];
    scholarships: Post[];
  }> {
    'use cache'
    cacheLife('days')
    cacheTag('homepage')
    
    const types = ["admission", "result", "news", "date_sheet", "scholarship"];
    const grouped = await postRepository.getByTypes(types, 5);
    
    return {
      admissions: grouped["admission"] || [],
      results: grouped["result"] || [],
      news: grouped["news"] || [],
      dateSheets: grouped["date_sheet"] || [],
      scholarships: grouped["scholarship"] || [],
    };
  },

  async getFeaturedPosts(limit: number = 6): Promise<Post[]> {
    'use cache'
    cacheLife('days')
    cacheTag('posts-featured')
    
    return await postRepository.getFeatured(limit);
  },

  async getPopularPosts(limit: number = 8): Promise<Post[]> {
    'use cache'
    cacheLife('days')
    cacheTag('posts-popular')
    
    return await postRepository.getPopular(limit);
  },

  async getRecentPosts(limit: number = 10): Promise<Post[]> {
    'use cache'
    cacheLife('days')
    cacheTag('posts-recent')
    
    return await postRepository.getRecent(limit);
  },

  async getRelatedPosts(currentSlug: string, type: string, limit: number = 5): Promise<Post[]> {
    'use cache'
    cacheLife('days')
    cacheTag(`posts-related-${type}`)
    
    return await postRepository.getRelated(currentSlug, type, limit);
  },

  // ✅ Cache clear methods (these are server actions)
  async clearPostCache(slug: string): Promise<void> {
    'use server'
    revalidateTag(`post-${slug}`, 'page')
    revalidateTag('homepage', 'page')
    revalidateTag('posts-featured', 'page')
    revalidateTag('posts-popular', 'page')
    revalidateTag('posts-recent', 'page')
  },

  async clearTypeCache(type: string): Promise<void> {
    'use server'
    revalidateTag(`posts-type-${type}`, 'page')
    revalidateTag(`posts-count-${type}`, 'page')
    revalidateTag('homepage', 'page')
  },

  async clearAllCache(): Promise<void> {
    'use server'
    revalidatePath('/', 'layout')
  }
};