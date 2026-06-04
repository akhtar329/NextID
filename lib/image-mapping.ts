// lib/image-mapping.ts

import { db } from '@/db/db';
import { posts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { existsSync } from 'fs';
import path from 'path';

// Get actual image path for a post slug
export async function getActualImagePath(slug: string): Promise<string | null> {
  try {
    // First check database for actual_image field
    const result = await db
      .select({ actualImage: posts.actualImage, featuredImage: posts.featuredImage })
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);
    
    if (result.length > 0) {
      // If actual_image exists, use it
      if (result[0].actualImage) {
        return result[0].actualImage;
      }
      // Otherwise return featured_image
      return result[0].featuredImage;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting actual image:', error);
    return null;
  }
}

// Update post with actual image reference
export async function updatePostActualImage(postId: number, actualImageUrl: string) {
  try {
    await db
      .update(posts)
      .set({ actualImage: actualImageUrl })
      .where(eq(posts.id, postId));
    
    return true;
  } catch (error) {
    console.error('Error updating actual image:', error);
    return false;
  }
}

// Generate virtual URL from slug
export function getVirtualImageUrl(slug: string): string {
  return `/uploads/${slug}.webp`;
}

// Check if image file exists on disk
export function imageFileExists(filePath: string): boolean {
  const fullPath = path.join(process.cwd(), 'public', filePath);
  return existsSync(fullPath);
}

// Get all images in uploads folder (for library)
export async function getAllImages(type?: string): Promise<{ name: string; url: string; size: string }[]> {
  // This will be implemented later
  return [];
}