// app/api/admin/cache/clear/route.ts - Next.js 15+ compatible

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupId, groupName } = body;

    
    // Define paths to clear based on group
    let pathsToClear: string[] = [];
    
    switch (groupId) {
      case 'all':
        pathsToClear = ['/', '/news', '/admissions', '/results', '/jobs', '/scholarships', '/date-sheets'];
        break;
      case 'admissions':
        pathsToClear = ['/', '/admissions'];
        break;
      case 'results':
        pathsToClear = ['/', '/results'];
        break;
      case 'news':
        pathsToClear = ['/', '/news'];
        break;
      case 'date-sheets':
        pathsToClear = ['/', '/date-sheets'];
        break;
      case 'scholarships':
        pathsToClear = ['/', '/scholarships'];
        break;
      case 'jobs':
        pathsToClear = ['/', '/jobs'];
        break;
      case 'homepage':
        pathsToClear = ['/'];
        break;
      default:
        pathsToClear = ['/'];
    }
    
    // Revalidate all paths
    for (const path of pathsToClear) {
      try {
        revalidatePath(path);
      } catch (error) {
        console.warn(`  ⚠️ Failed to revalidate: ${path}`, error);
      }
    }
    
    // Also try to revalidate with layout for root
    if (pathsToClear.includes('/')) {
      try {
        revalidatePath('/', 'layout');
      } catch {
        // Ignore
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `${groupName || 'Cache'} cleared successfully!`,
      clearedPaths: pathsToClear
    });
    
  } catch {
    console.error('Cache clear error:');
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' }, 
      { status: 500 }
    );
  }
}