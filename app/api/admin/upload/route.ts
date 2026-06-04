// app/api/admin/upload/route.ts

import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs'; 
import path from 'path';
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const postSlug = formData.get('slug') as string || '';
    const postTitle = formData.get('title') as string || '';
    const postType = formData.get('type') as string || 'news';
    
    if (!file) {
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }
    
    // Convert to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert to WebP and compress
    const webpBuffer = await sharp(buffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
    
    // Create folder: public/uploads/news/2026/06/
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', postType, year.toString(), month);
    await mkdir(uploadDir, { recursive: true });
    
    // ✅ Use SLUG as filename, not timestamp
    let filename: string;
    if (postSlug) {
      filename = `${postSlug}.webp`;
    } else if (postTitle) {
      // Generate slug from title
      const slugFromTitle = postTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      filename = `${slugFromTitle}.webp`;
    } else {
      filename = `${Date.now()}.webp`;
    }
    
    const filePath = path.join(uploadDir, filename);
    
    // ✅ Check if file exists, add number if needed
    let finalFilename = filename;
    let counter = 1;
    while (existsSync(filePath)) {
      const nameWithoutExt = filename.replace('.webp', '');
      finalFilename = `${nameWithoutExt}-${counter}.webp`;
      counter++;
      // Update path for next check
      const newPath = path.join(uploadDir, finalFilename);
      if (existsSync(newPath)) continue;
      break;
    }
    
    const finalFilePath = path.join(uploadDir, finalFilename);
    await writeFile(finalFilePath, webpBuffer);
    
    // ✅ Return correct URL
    const imageUrl = `/uploads/${postType}/${year}/${month}/${finalFilename}`;
    
    return NextResponse.json({
      success: true,
      url: imageUrl,
      filename: finalFilename,
      alt: postSlug || postTitle || finalFilename,
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}