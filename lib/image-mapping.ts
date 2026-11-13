
import { getDb } from "@/db/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

// Get actual image path for a post slug
export async function getActualImagePath(
  slug: string
): Promise<string | null> {
  try {
    const db = getDb();

    const result = await db
      .select({
        actualImage: posts.actualImage,
        featuredImage: posts.featuredImage,
      })
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0].actualImage || result[0].featuredImage || null;
  } catch (error) {
    console.error("Error getting actual image:", error);
    return null;
  }
}

// Update post with actual image reference
export async function updatePostActualImage(
  postId: number,
  actualImageUrl: string
): Promise<boolean> {
  try {
    if (
      !Number.isSafeInteger(postId) ||
      postId <= 0 ||
      typeof actualImageUrl !== "string" ||
      actualImageUrl.trim() === ""
    ) {
      return false;
    }

    const db = getDb();

    await db
      .update(posts)
      .set({
        actualImage: actualImageUrl.trim(),
      })
      .where(eq(posts.id, postId));

    return true;
  } catch (error) {
    console.error("Error updating actual image:", error);
    return false;
  }
}

// Generate virtual URL from slug
export function getVirtualImageUrl(slug: string): string {
  return `/uploads/${encodeURIComponent(slug)}.webp`;
}

// Cloudflare Workers do not support persistent local filesystem checks.
// Image availability should be checked through the configured storage provider.
export function imageFileExists(_filePath: string): boolean {
  void _filePath;
  return false;
}

// Get all images in uploads folder (for library)
export async function getAllImages(
  _type?: string
): Promise<{ name: string; url: string; size: string }[]> {
  void _type;
  // Implement this using Supabase Storage or Cloudflare R2.
  return [];
}
