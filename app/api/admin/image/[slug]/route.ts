// app/api/image/[slug]/route.ts

import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const imageName = slug.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    
    // Search in multiple locations
    const searchPaths = [
      // Year/Month folders
      path.join(process.cwd(), 'public', 'uploads', 'news', new Date().getFullYear().toString(), 
        String(new Date().getMonth() + 1).padStart(2, '0'), `${imageName}.webp`),
      path.join(process.cwd(), 'public', 'uploads', 'admissions', new Date().getFullYear().toString(),
        String(new Date().getMonth() + 1).padStart(2, '0'), `${imageName}.webp`),
      // Root folder fallback
      path.join(process.cwd(), 'public', 'uploads', `${imageName}.webp`),
      path.join(process.cwd(), 'public', 'uploads', `${imageName}.jpg`),
    ];
    
    let existingPath = null;
    for (const tryPath of searchPaths) {
      if (existsSync(tryPath)) {
        existingPath = tryPath;
        break;
      }
    }
    
    if (!existingPath) {
      return new NextResponse('Image not found', { status: 404 });
    }
    
    const imageBuffer = await readFile(existingPath);
    return new NextResponse(imageBuffer, {
      headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000' },
    });
    
  } catch (error) {
    return new NextResponse('Error', { status: 500 });
  }
}