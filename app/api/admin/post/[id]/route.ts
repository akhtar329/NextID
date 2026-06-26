// app/api/admin/post/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// ==================== AUTHENTICATION HELPER ====================
async function isAuthenticated(): Promise<{ userId: number; userRole: string } | null> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;
    
    if (!authToken) {
      return null;
    }
    
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET not set');
      return null;
    }
    
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET) as {
        id: number;
        email: string;
        name: string;
        role: string;
      };
      
      return { userId: decoded.id, userRole: decoded.role };
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError);
      return null;
    }
  } catch (error) {
    console.error('❌ Auth error:', error);
    return null;
  }
}

// ==================== UNAUTHORIZED RESPONSE ====================
function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized - Please login first' },
    { status: 401 }
  );
}

// PostgreSQL error type
interface PostgresError {
  code: string;
  message: string;
}

// Type for update data
interface UpdateData {
  slug?: string;
  type?: string;
  title?: string;
  content?: string | null;
  excerpt?: string | null;
  authorName?: string | null;
  featuredImage?: string | null;
  actualImage?: string | null;
  galleryImages?: unknown;
  status?: string;
  isFeatured?: boolean;
  isPopular?: boolean;
  isBreaking?: boolean;
  publishedAt?: Date;
  expiresAt?: Date | null;
  meta?: Record<string, unknown>;
  tags?: unknown;
  updatedAt?: Date;
  // SEO Fields
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  focusKeyword?: string | null;
  canonicalUrl?: string | null;
  robots?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  ogType?: string | null;
  twitterCard?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  schemaMarkup?: unknown;
  focusKeywordDensity?: string | null;
  readabilityScore?: number | null;
  seoScore?: number | null;
  lastSeoAnalysis?: Date | null;
  priority?: string | null;
  changefreq?: string | null;
  breadcrumbTitle?: string | null;
  oldSlug?: string | null;
}

/* =========================
   Helper: Parse ID Safely
========================= */
async function getNumericId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numericId = Number(id);
  if (isNaN(numericId)) return null;
  return numericId;
}

// Helper function to revalidate cache
async function revalidatePostCache(slug: string, type: string) {
  try {
    revalidateTag(`post-${slug}`, "default");
    revalidateTag(`posts-type-${type}`, "default");
    revalidateTag("homepage", "default");
    
    const typeLower = type.toLowerCase();
    if (typeLower === 'admission') revalidateTag("admissions-home", "default");
    else if (typeLower === 'result') revalidateTag("results-home", "default");
    else if (typeLower === 'news') revalidateTag("news-home", "default");
    else if (typeLower === 'date_sheet') revalidateTag("datesheets-home", "default");
    else if (typeLower === 'scholarship') revalidateTag("scholarships-home", "default");
    else if (typeLower === 'job') revalidateTag("jobs-home", "default");
    
  } catch (cacheError) {
    console.error("Error revalidating cache:", cacheError);
  }
}

/* =========================
   GET → Fetch Single Post (Requires Auth)
========================= */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await isAuthenticated();
  if (!auth) {
    return unauthorizedResponse();
  }
  
  const numericId = await getNumericId(context);
  if (!numericId) {
    return NextResponse.json(
      { success: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  try {
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, numericId));

    if (!post.length) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, post: post[0] });
  } catch (err) {
    console.error("❌ GET error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

/* =========================
   PUT → Update Full Post (With All Fields)
========================= */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await isAuthenticated();
  if (!auth) {
    return unauthorizedResponse();
  }
  
  const numericId = await getNumericId(context);
  if (!numericId) {
    return NextResponse.json(
      { success: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    if (!body.title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, numericId));

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    // ✅ Parse galleryImages if provided
    let galleryImages = body.galleryImages || null;
    if (typeof galleryImages === 'string') {
      try { galleryImages = JSON.parse(galleryImages); } catch { galleryImages = null; }
    }

    // ✅ Build meta with deadline
    const metaData = {
      ...(body.meta || {}),
      deadline: body.deadline || null,
    };

    const focusKeywordDensityValue = body.focusKeywordDensity 
      ? String(body.focusKeywordDensity) 
      : null;

    const updated = await db
      .update(posts)
      .set({
        // ========== BASIC INFO ==========
        title: body.title.trim(),
        content: body.content || null,
        excerpt: body.excerpt || null,
        
        // ========== AUTHOR ==========
        authorName: body.authorName || null,
        
        // ========== MEDIA ==========
        featuredImage: body.featuredImage || null,
        actualImage: body.actualImage || null,
        galleryImages: galleryImages,
        
        // ========== STATUS & FLAGS ==========
        status: body.status || "draft",
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : false,
        isPopular: body.isPopular !== undefined ? Boolean(body.isPopular) : false,
        isBreaking: body.isBreaking !== undefined ? Boolean(body.isBreaking) : false,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : existing.publishedAt,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        updatedAt: new Date(),
        
        // ========== META & TAGS ==========
        meta: metaData,
        tags: body.tags || [],
        
        // ========== META TAGS ==========
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        metaKeywords: body.metaKeywords || null,
        focusKeyword: body.focusKeyword || null,
        canonicalUrl: body.canonicalUrl || null,
        robots: body.robots || "index, follow",
        
        // ========== OPEN GRAPH ==========
        ogTitle: body.ogTitle || body.metaTitle || null,
        ogDescription: body.ogDescription || body.metaDescription || null,
        ogImage: body.ogImage || body.featuredImage || null,
        ogType: body.ogType || "article",
        
        // ========== TWITTER ==========
        twitterCard: body.twitterCard || "summary_large_image",
        twitterTitle: body.twitterTitle || body.ogTitle || body.metaTitle || null,
        twitterDescription: body.twitterDescription || body.ogDescription || body.metaDescription || null,
        twitterImage: body.twitterImage || body.ogImage || body.featuredImage || null,
        
        // ========== STRUCTURED DATA ==========
        schemaMarkup: body.schemaMarkup || null,
        
        // ========== SEO SCORES ==========
        focusKeywordDensity: focusKeywordDensityValue,
        readabilityScore: body.readabilityScore ? Number(body.readabilityScore) : null,
        seoScore: body.seoScore ? Number(body.seoScore) : null,
        lastSeoAnalysis: body.lastSeoAnalysis ? new Date(body.lastSeoAnalysis) : null,
        
        // ========== SITEMAP ==========
        priority: body.priority || "0.5",
        changefreq: body.changefreq || "weekly",
        
        // ========== BREADCRUMB ==========
        breadcrumbTitle: body.breadcrumbTitle || body.title || null,
        
        // ========== REDIRECT ==========
        oldSlug: body.oldSlug || null,
      })
      .where(eq(posts.id, numericId))
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    await revalidatePostCache(existing.slug, existing.type);

    return NextResponse.json({ 
      success: true, 
      post: updated[0],
      message: "Post updated successfully" 
    });
  } catch (err) {
    console.error("❌ PUT error:", err);
    
    const pgError = err as PostgresError;
    if (pgError.code === "23505") {
      return NextResponse.json(
        { success: false, error: "Slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update post" },
      { status: 500 }
    );
  }
}

/* =========================
   PATCH → Partial Update
========================= */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await isAuthenticated();
  if (!auth) {
    return unauthorizedResponse();
  }
  
  const numericId = await getNumericId(context);
  if (!numericId) {
    return NextResponse.json(
      { success: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    const updateData: UpdateData = {};
    
    // Basic Info
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.content !== undefined) updateData.content = body.content || null;
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt || null;
    if (body.authorName !== undefined) updateData.authorName = body.authorName || null;
    
    // Media
    if (body.featuredImage !== undefined) updateData.featuredImage = body.featuredImage || null;
    if (body.actualImage !== undefined) updateData.actualImage = body.actualImage || null;
    if (body.galleryImages !== undefined) {
      let galleryImages = body.galleryImages || null;
      if (typeof galleryImages === 'string') {
        try { galleryImages = JSON.parse(galleryImages); } catch { galleryImages = null; }
      }
      updateData.galleryImages = galleryImages;
    }
    
    // Status & Flags
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isFeatured !== undefined) updateData.isFeatured = Boolean(body.isFeatured);
    if (body.isPopular !== undefined) updateData.isPopular = Boolean(body.isPopular);
    if (body.isBreaking !== undefined) updateData.isBreaking = Boolean(body.isBreaking);
    if (body.publishedAt !== undefined) {
      updateData.publishedAt = body.publishedAt ? new Date(body.publishedAt) : undefined;
    }
    if (body.expiresAt !== undefined) {
      updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }
    
    // Meta & Tags
    if (body.meta !== undefined) {
      const metaData = {
        ...(body.meta || {}),
        deadline: body.deadline || null,
      };
      updateData.meta = metaData;
    }
    if (body.tags !== undefined) updateData.tags = body.tags;
    
    // Meta Tags
    if (body.metaTitle !== undefined) updateData.metaTitle = body.metaTitle || null;
    if (body.metaDescription !== undefined) updateData.metaDescription = body.metaDescription || null;
    if (body.metaKeywords !== undefined) updateData.metaKeywords = body.metaKeywords || null;
    if (body.focusKeyword !== undefined) updateData.focusKeyword = body.focusKeyword || null;
    if (body.canonicalUrl !== undefined) updateData.canonicalUrl = body.canonicalUrl || null;
    if (body.robots !== undefined) updateData.robots = body.robots || "index, follow";
    
    // Open Graph
    if (body.ogTitle !== undefined) updateData.ogTitle = body.ogTitle || null;
    if (body.ogDescription !== undefined) updateData.ogDescription = body.ogDescription || null;
    if (body.ogImage !== undefined) updateData.ogImage = body.ogImage || null;
    if (body.ogType !== undefined) updateData.ogType = body.ogType || "article";
    
    // Twitter
    if (body.twitterCard !== undefined) updateData.twitterCard = body.twitterCard || "summary_large_image";
    if (body.twitterTitle !== undefined) updateData.twitterTitle = body.twitterTitle || null;
    if (body.twitterDescription !== undefined) updateData.twitterDescription = body.twitterDescription || null;
    if (body.twitterImage !== undefined) updateData.twitterImage = body.twitterImage || null;
    
    // Structured Data
    if (body.schemaMarkup !== undefined) updateData.schemaMarkup = body.schemaMarkup || null;
    
    // Sitemap
    if (body.priority !== undefined) updateData.priority = body.priority || "0.5";
    if (body.changefreq !== undefined) updateData.changefreq = body.changefreq || "weekly";
    
    // Breadcrumb
    if (body.breadcrumbTitle !== undefined) updateData.breadcrumbTitle = body.breadcrumbTitle || null;
    
    // Redirect
    if (body.oldSlug !== undefined) updateData.oldSlug = body.oldSlug || null;
    
    // SEO Scores
    if (body.focusKeywordDensity !== undefined) {
      updateData.focusKeywordDensity = body.focusKeywordDensity ? String(body.focusKeywordDensity) : null;
    }
    if (body.readabilityScore !== undefined) {
      updateData.readabilityScore = body.readabilityScore ? Number(body.readabilityScore) : null;
    }
    if (body.seoScore !== undefined) {
      updateData.seoScore = body.seoScore ? Number(body.seoScore) : null;
    }
    
    if (Object.keys(updateData).length > 0) updateData.updatedAt = new Date();

    const [existing] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, numericId));

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, numericId))
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    await revalidatePostCache(existing.slug, existing.type);

    return NextResponse.json({ 
      success: true, 
      post: updated[0],
      message: "Post updated successfully" 
    });
  } catch (err) {
    console.error("❌ PATCH error:", err);
    
    const pgError = err as PostgresError;
    if (pgError.code === "23505") {
      return NextResponse.json(
        { success: false, error: "Slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update post" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE → Soft Delete Post
========================= */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await isAuthenticated();
  if (!auth) {
    return unauthorizedResponse();
  }
  
  const numericId = await getNumericId(context);
  if (!numericId) {
    return NextResponse.json(
      { success: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  try {
    const [existing] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, numericId));

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    await db
      .update(posts)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(eq(posts.id, numericId));

    await revalidatePostCache(existing.slug, existing.type);

    return NextResponse.json({
      success: true,
      message: "Post archived successfully"
    });
  } catch (err) {
    console.error("❌ DELETE error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete post" },
      { status: 500 }
    );
  }
}