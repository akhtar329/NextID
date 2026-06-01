// app/api/admin/cache/clear/route.ts

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { postCache } from "@/cache/post/post.cache";

export async function POST(request: NextRequest) {
  try {
    const { type, tags } = await request.json();
    
    // Clear service cache
    postCache.clear();
    postCache.deletePattern("homepage");
    postCache.deletePattern(`posts:type:${type}`);
    
    // Clear Next.js cache with the required second argument
    if (tags && tags.length > 0) {
      tags.forEach((tag: string) => {
        revalidateTag(tag, "default");
      });
    }
    
    // Clear common tags
    revalidateTag("home", "default");
    revalidateTag(`${type}s-home`, "default");
    
    console.log(`✅ Cache cleared for type: ${type}`);
    
    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully",
    });
    
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear cache" },
      { status: 500 }
    );
  }
}