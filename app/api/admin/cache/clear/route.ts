// app/api/admin/cache/clear/route.ts - Next.js 15+ compatible

import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getPostCacheTags, type CachedPostType } from '@/lib/post-cache';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupId, groupName, tags = [] } = body;

    // Define tags to clear based on group
    let tagsToClear: string[] = [];
    
    switch (groupId) {
      case 'all':
        tagsToClear = (['admission', 'result', 'news', 'date_sheet', 'scholarship', 'job', 'blog'] as CachedPostType[])
          .flatMap((type) => getPostCacheTags(type));
        break;
      case 'admissions':
        tagsToClear = getPostCacheTags('admission');
        break;
      case 'results':
        tagsToClear = getPostCacheTags('result');
        break;
      case 'news':
        tagsToClear = getPostCacheTags('news');
        break;
      case 'date-sheets':
        tagsToClear = getPostCacheTags('date_sheet');
        break;
      case 'scholarships':
        tagsToClear = getPostCacheTags('scholarship');
        break;
      case 'jobs':
        tagsToClear = getPostCacheTags('job');
        break;
      case 'homepage':
        tagsToClear = getPostCacheTags();
        break;
      default:
        tagsToClear = ['homepage'];
    }

    // Add any additional tags from request
    if (tags && Array.isArray(tags)) {
      tagsToClear = [...new Set([...tagsToClear, ...tags])];
    }
    
    // Revalidate all tags with default profile
    for (const tag of tagsToClear) {
      try {
        revalidateTag(tag, 'default');
      } catch (error) {
        console.warn(`  ⚠️ Failed to revalidate tag: ${tag}`, error);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `${groupName || 'Cache'} cleared successfully!`,
      clearedTags: tagsToClear
    });
    
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' }, 
      { status: 500 }
    );
  }
}
