// app/api/admin/admissions/check-slug/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { admissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json({ available: false, error: 'Slug required' }, { status: 400 });
    }
    
    const existing = await db
      .select({ id: admissions.id })
      .from(admissions)
      .where(eq(admissions.slug, slug))
      .limit(1);
    
    const available = existing.length === 0;
    
    let suggestions: string[] = [];
    if (!available) {
      for (let i = 1; i <= 5; i++) {
        const suggestedSlug = `${slug}-${i}`;
        const suggestedExists = await db
          .select({ id: admissions.id })
          .from(admissions)
          .where(eq(admissions.slug, suggestedSlug))
          .limit(1);
        
        if (suggestedExists.length === 0) {
          suggestions.push(suggestedSlug);
        }
      }
    }
    
    return NextResponse.json({ 
      available, 
      suggestions: suggestions.length > 0 ? suggestions : undefined 
    });
    
  } catch (error) {
    console.error('Error checking slug:', error);
    return NextResponse.json({ available: false, error: 'Server error' }, { status: 500 });
  }
}