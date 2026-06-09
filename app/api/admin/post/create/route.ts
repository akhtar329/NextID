// app/api/admin/post/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { posts } from '@/db/schema';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// ==================== GET SESSION FROM COOKIE (FIXED) ====================
async function getSessionFromCookie(): Promise<{ userId: number; userName: string } | null> {
  try {
    const cookieStore = await cookies();
    
    // ✅ Read 'authToken' cookie (match karo login ke saath)
    const authToken = cookieStore.get('authToken')?.value;
    
    if (!authToken) {
      console.log('❌ No authToken cookie found');
      return null;
    }
    
    // ✅ Verify and decode JWT token
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as {
        id: number;
        email: string;
        name: string;
        role: string;
      };
      
      console.log('✅ Token verified for user:', decoded.email);
      
      return { 
        userId: decoded.id, 
        userName: decoded.name || 'Admin' 
      };
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError);
      return null;
    }
  } catch (error) {
    console.error('❌ Error reading session cookie:', error);
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
        { 
          success: false, 
          error: 'Unauthorized - Please login first'
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    
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
    console.error('❌ Error creating post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}