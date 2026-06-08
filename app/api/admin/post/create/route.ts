// app/api/admin/post/create/route.ts (With existing session)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { posts } from '@/db/schema';
import { cookies } from 'next/headers';

// ==================== TYPES ====================
interface CreatePostBody {
  title: string;
  slug: string;
  type: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  authorName?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  status?: string;
  isFeatured?: boolean;
  isPopular?: boolean;
  isBreaking?: boolean;
  meta?: Record<string, unknown>;
  tags?: string[];
  publishedAt?: string;
  expiresAt?: string;
}

// ==================== GET SESSION FROM COOKIE ====================
async function getSessionFromCookie(): Promise<{ userId: number; userName: string } | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = (await cookieStore).get('admin_session');
    
    if (sessionCookie) {
      return JSON.parse(sessionCookie.value);
    }
    return null;
  } catch {
    return null;
  }
}

// ==================== API ROUTE ====================
export async function POST(req: NextRequest) {
  try {
    // ✅ Get session from cookie
    const session = await getSessionFromCookie();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreatePostBody = await req.json();
    
    if (!body.title || !body.slug || !body.type || !body.content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const postData = {
      slug: body.slug,
      type: body.type,
      title: body.title,
      content: body.content,
      excerpt: body.excerpt || null,
      authorId: session.userId,
      authorName: body.authorName || session.userName,
      featuredImage: body.featuredImage || null,
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
      metaKeywords: body.metaKeywords || null,
      focusKeyword: body.focusKeyword || null,
      canonicalUrl: body.canonicalUrl || null,
      robots: body.robots || 'index, follow',
      ogTitle: body.ogTitle || null,
      ogDescription: body.ogDescription || null,
      ogImage: body.ogImage || body.featuredImage || null,
      ogType: body.ogType || 'article',
      twitterCard: body.twitterCard || 'summary_large_image',
      twitterTitle: body.twitterTitle || body.ogTitle || null,
      twitterDescription: body.twitterDescription || body.ogDescription || null,
      twitterImage: body.twitterImage || body.ogImage || body.featuredImage || null,
      status: body.status || 'draft',
      isFeatured: body.isFeatured || false,
      isPopular: body.isPopular || false,
      isBreaking: body.isBreaking || false,
      meta: body.meta || {},
      tags: body.tags || [],
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    };

    const [newPost] = await db.insert(posts).values(postData).returning();

    return NextResponse.json({ 
      success: true, 
      post: newPost 
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}