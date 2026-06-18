// app/api/admin/post/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { posts } from '@/db/schema';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// ==================== GET SESSION FROM COOKIE ====================
async function getSessionFromCookie(): Promise<{ userId: number; userName: string } | null> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;
    
    if (!authToken) {
      console.log('❌ No authToken cookie found');
      return null;
    }
    
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

    // ✅ Parse galleryImages (if string, parse it)
    let galleryImages = body.galleryImages || [];
    if (typeof galleryImages === 'string') {
      try {
        galleryImages = JSON.parse(galleryImages);
      } catch {
        galleryImages = [];
      }
    }

    // ✅ Build meta object with deadline (for frontend use)
    const metaData = {
      ...(body.meta || {}),
      deadline: body.deadline || null, // ✅ Meta mein bhi save for reference
    };

    const postData = {
      // ========== BASIC INFO ==========
      slug: body.slug,
      type: body.type,
      title: body.title,
      content: body.content,
      excerpt: body.excerpt || null,
      
      // ========== AUTHOR ==========
      authorName: body.authorName || session.userName,
      
      // ========== MEDIA ==========
      featuredImage: body.featuredImage || null,
      actualImage: body.actualImage || null,
      galleryImages: galleryImages.length > 0 ? galleryImages : null,
      
      // ========== STATUS & FLAGS ==========
      status: body.status || 'draft',
      isFeatured: body.isFeatured || false,
      isPopular: body.isPopular || false,
      isBreaking: body.isBreaking || false,
      
      // ========== META TAGS ==========
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
      metaKeywords: body.metaKeywords || null,
      focusKeyword: body.focusKeyword || null,
      canonicalUrl: body.canonicalUrl || null,
      robots: body.robots || 'index, follow',
      
      // ========== OPEN GRAPH ==========
      ogTitle: body.ogTitle || body.metaTitle || null,
      ogDescription: body.ogDescription || body.metaDescription || null,
      ogImage: body.ogImage || body.featuredImage || null,
      ogType: body.ogType || 'article',
      
      // ========== TWITTER ==========
      twitterCard: body.twitterCard || 'summary_large_image',
      twitterTitle: body.twitterTitle || body.ogTitle || body.metaTitle || null,
      twitterDescription: body.twitterDescription || body.ogDescription || body.metaDescription || null,
      twitterImage: body.twitterImage || body.ogImage || body.featuredImage || null,
      
      // ========== STRUCTURED DATA ==========
      schemaMarkup: body.schemaMarkup || null,
      
      // ========== EXTRA SEO ==========
      breadcrumbTitle: body.breadcrumbTitle || body.title || null,
      priority: body.priority || '0.5',
      changefreq: body.changefreq || 'weekly',
      
      // ========== REDIRECT ==========
      oldSlug: body.oldSlug || null,
      
      // ========== META & TAGS ==========
      meta: metaData,
      tags: body.tags || [],
      
      // ========== TIMESTAMPS ==========
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      
      // ✅ FIXED: Deadline = ExpiresAt
      expiresAt: body.deadline ? new Date(body.deadline) : null,  // ✅ YAHAN SAVE HOGA
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