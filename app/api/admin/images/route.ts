// app/api/admin/images/route.ts

import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function GET() {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!existsSync(uploadDir)) {
      return NextResponse.json({ images: [], total: 0 });
    }
    
    const images: { url: string; name: string; size: string; modified: string }[] = [];
    
    async function scanDir(dir: string, relativePath: string = '') {
      const files = await readdir(dir, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        const relPath = path.join(relativePath, file.name);
        
        if (file.isDirectory()) {
          await scanDir(fullPath, relPath);
        } else if (file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
          const fileStat = await stat(fullPath);
          images.push({
            url: `/uploads/${relPath.replace(/\\/g, '/')}`,
            name: file.name,
            size: (fileStat.size / 1024).toFixed(2),
            modified: fileStat.mtime.toISOString(),
          });
        }
      }
    }
    
    await scanDir(uploadDir);
    images.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
    
    return NextResponse.json({ images, total: images.length });
    
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ images: [], total: 0, error: 'Failed to fetch images' });
  }
}