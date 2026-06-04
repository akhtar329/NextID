// services/post/post.service.ts

import { cacheLife, cacheTag, revalidateTag } from 'next/cache'
import { postRepository, type Post } from "@/repositories/post/post.repository";

interface ExtendedPost extends Post {
  actualImage?: string | null;
}

export const postService = {
  
  async getPost(slug: string): Promise<ExtendedPost | null> {
    'use cache'
    cacheLife('days')
    cacheTag(`post-${slug}`)
    
    const post = await postRepository.getBySlug(slug);
    
    if (post) {
      // ✅ FIX: Blogger URLs ko allow karo, local images ko handle karo
      let imageUrl = post.featuredImage;
      
      // Agar image URL hai (blogger ya external) to waisay hi rakho
      // Agar local path hai to usay bhi waisay hi rakho
      if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/uploads'))) {
        // Already valid URL - no change needed
      } else if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        // Local image path fix karo
        imageUrl = `/uploads/${imageUrl}`;
      }
      
      return {
        ...post,
        featuredImage: imageUrl,
        actualImage: imageUrl
      };
    }
    
    return null;
  },

  async getPostsByType(type: string, limit: number = 10, offset: number = 0): Promise<ExtendedPost[]> {
    'use cache'
    cacheLife('days')
    cacheTag(`posts-type-${type}`)
    
    const posts = await postRepository.getByType(type, limit, offset);
    
    return posts.map(post => {
      let imageUrl = post.featuredImage;
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        imageUrl = `/uploads/${imageUrl}`;
      }
      
      return {
        ...post,
        featuredImage: imageUrl,
        actualImage: imageUrl
      };
    });
  },

  async getHomepageData(): Promise<{
    admissions: ExtendedPost[];
    results: ExtendedPost[];
    news: ExtendedPost[];
    dateSheets: ExtendedPost[];
    scholarships: ExtendedPost[];
  }> {
    'use cache'
    cacheLife('days')
    cacheTag('homepage')
    
    const types = ["admission", "result", "news", "date_sheet", "scholarship"];
    const grouped = await postRepository.getByTypes(types, 5);
    
    const addImages = (posts: Post[]) => 
      posts.map(post => {
        let imageUrl = post.featuredImage;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
          imageUrl = `/uploads/${imageUrl}`;
        }
        return {
          ...post,
          featuredImage: imageUrl,
          actualImage: imageUrl
        };
      });
    
    return {
      admissions: addImages(grouped["admission"] || []),
      results: addImages(grouped["result"] || []),
      news: addImages(grouped["news"] || []),
      dateSheets: addImages(grouped["date_sheet"] || []),
      scholarships: addImages(grouped["scholarship"] || []),
    };
  },

  // Baki methods bhi same pattern follow karein
  async getFeaturedPosts(limit: number = 6): Promise<ExtendedPost[]> {
    'use cache'
    cacheLife('days')
    cacheTag('posts-featured')
    const posts = await postRepository.getFeatured(limit);
    return posts.map(post => {
      let imageUrl = post.featuredImage;
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        imageUrl = `/uploads/${imageUrl}`;
      }
      return {
        ...post,
        featuredImage: imageUrl,
        actualImage: imageUrl
      };
    });
  },

  async getPopularPosts(limit: number = 8): Promise<ExtendedPost[]> {
    'use cache'
    cacheLife('days')
    cacheTag('posts-popular')
    const posts = await postRepository.getPopular(limit);
    return posts.map(post => {
      let imageUrl = post.featuredImage;
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        imageUrl = `/uploads/${imageUrl}`;
      }
      return {
        ...post,
        featuredImage: imageUrl,
        actualImage: imageUrl
      };
    });
  },

  async getRecentPosts(limit: number = 10): Promise<ExtendedPost[]> {
    'use cache'
    cacheLife('days')
    cacheTag('posts-recent')
    const posts = await postRepository.getRecent(limit);
    return posts.map(post => {
      let imageUrl = post.featuredImage;
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        imageUrl = `/uploads/${imageUrl}`;
      }
      return {
        ...post,
        featuredImage: imageUrl,
        actualImage: imageUrl
      };
    });
  },

  async getRelatedPosts(currentSlug: string, type: string, limit: number = 5): Promise<ExtendedPost[]> {
    'use cache'
    cacheLife('days')
    cacheTag(`posts-related-${type}`)
    const posts = await postRepository.getRelated(currentSlug, type, limit);
    return posts.map(post => {
      let imageUrl = post.featuredImage;
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        imageUrl = `/uploads/${imageUrl}`;
      }
      return {
        ...post,
        featuredImage: imageUrl,
        actualImage: imageUrl
      };
    });
  },

  // Cache clear methods (same rahenge)
  async clearPostCache(slug: string): Promise<void> {
    'use server'
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag(`post-${slug}`)
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('homepage')
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('posts-featured')
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('posts-popular')
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('posts-recent')
  },

  async clearTypeCache(type: string): Promise<void> {
    'use server'
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag(`posts-type-${type}`)
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag(`posts-count-${type}`)
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('homepage')
  },

  async clearAllCache(): Promise<void> {
    'use server'
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('homepage')
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('posts-featured')
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('posts-popular')
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('posts-recent')
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('posts-type-admission')
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('posts-type-result')
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('posts-type-news')
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('posts-type-date_sheet')
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('posts-type-scholarship')
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('posts-type-job')
    // @ts-expect-error Next.js 16.1.8 revalidateTag type issue
    revalidateTag('posts-type-blog')
  }
};