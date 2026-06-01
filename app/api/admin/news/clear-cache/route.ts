// app/api/admin/news/clear-cache/route.ts

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST() {
  try {
    const cacheDir = path.join(process.cwd(), "cache/news");
    
    // Check if cache directory exists
    try {
      await fs.access(cacheDir);
      
      // Delete all files in cache/news directory
      const files = await fs.readdir(cacheDir);
      await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(cacheDir, file);
          await fs.unlink(filePath);
        })
      );
      
      console.log(`✅ Cleared ${files.length} cache files from news cache`);
    } catch (err) {
      // Directory doesn't exist, nothing to clear
      console.log("No cache directory found, skipping...");
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'News cache cleared successfully' 
    });
    
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}