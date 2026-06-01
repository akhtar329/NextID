import { NextResponse } from 'next/server';
import { newsCacheService } from '@/cache/news/news.cache';

export async function POST() {
  try {
    await newsCacheService.clearAllCache();
    return NextResponse.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear cache' }, { status: 500 });
  }
}