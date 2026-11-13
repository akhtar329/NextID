
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { posts } from '@/db/schema';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { revalidatePostCache } from '@/lib/post-cache';

type RequestBody = Record<string, unknown>;

function isRecord(value: unknown): value is RequestBody {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== ''
    ? value.trim()
    : null;
}

function getBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function getDate(value: unknown): Date | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function getSessionFromCookie(): Promise<{
  userId: number;
  userName: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;

    if (!authToken) {
      return null;
    }

    try {
      const decoded = jwt.verify(
        authToken,
        process.env.JWT_SECRET!
      ) as {
        id: number;
        email: string;
        name: string;
        role: string;
      };

      return {
        userId: decoded.id,
        userName: decoded.name || 'Admin',
      };
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return null;
    }
  } catch (error) {
    console.error('Error reading session cookie:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Please login first',
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let parsedBody: unknown;

    try {
      parsedBody = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    if (!isRecord(parsedBody)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const body = parsedBody as RequestBody;

    const title = getString(body.title);
    const slug = getString(body.slug);
    const type = getString(body.type);
    const content = getString(body.content);

    if (!title || !slug || !type || !content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title, slug, type and content are required',
        },
        { status: 400 }
      );
    }

    // Validate gallery images
    let galleryImages: string[] = [];

    if (Array.isArray(body.galleryImages)) {
      galleryImages = body.galleryImages.filter(
        (item): item is string => typeof item === 'string'
      );
    } else if (typeof body.galleryImages === 'string') {
      try {
        const parsedGallery: unknown = JSON.parse(body.galleryImages);

        if (Array.isArray(parsedGallery)) {
          galleryImages = parsedGallery.filter(
            (item): item is string => typeof item === 'string'
          );
        }
      } catch {
        galleryImages = [];
      }
    }

    // Validate meta object
    const suppliedMeta = isRecord(body.meta) ? body.meta : {};

    const deadline = body.deadline
      ? getDate(body.deadline)
      : null;

    if (body.deadline && !deadline) {
      return NextResponse.json(
        { success: false, error: 'Invalid deadline date' },
        { status: 400 }
      );
    }

    const publishedAt = body.publishedAt
      ? getDate(body.publishedAt)
      : new Date();

    if (!publishedAt) {
      return NextResponse.json(
        { success: false, error: 'Invalid published date' },
        { status: 400 }
      );
    }

    const metaData = {
      ...suppliedMeta,
      deadline: deadline?.toISOString() ?? null,
    };

    const metaTitle = getString(body.metaTitle);
    const metaDescription = getString(body.metaDescription);
    const ogTitle = getString(body.ogTitle);
    const ogDescription = getString(body.ogDescription);
    const ogImage = getString(body.ogImage);
    const featuredImage = getString(body.featuredImage);

    const tags = Array.isArray(body.tags)
      ? body.tags.filter((tag): tag is string => typeof tag === 'string')
      : [];

    const postData = {
      // Basic information
      slug,
      type,
      title,
      content,
      excerpt: getString(body.excerpt),

      // Author
      authorName: getString(body.authorName) || session.userName,

      // Media
      featuredImage,
      actualImage: getString(body.actualImage),
      galleryImages: galleryImages.length > 0 ? galleryImages : null,

      // Status and flags
      status: getString(body.status) || 'draft',
      isFeatured: getBoolean(body.isFeatured),
      isPopular: getBoolean(body.isPopular),
      isBreaking: getBoolean(body.isBreaking),

      // SEO
      metaTitle,
      metaDescription,
      metaKeywords: getString(body.metaKeywords),
      focusKeyword: getString(body.focusKeyword),
      canonicalUrl: getString(body.canonicalUrl),
      robots: getString(body.robots) || 'index, follow',

      // Open Graph
      ogTitle: ogTitle || metaTitle,
      ogDescription: ogDescription || metaDescription,
      ogImage: ogImage || featuredImage,
      ogType: getString(body.ogType) || 'article',

      // Twitter
      twitterCard:
        getString(body.twitterCard) || 'summary_large_image',
      twitterTitle:
        getString(body.twitterTitle) || ogTitle || metaTitle,
      twitterDescription:
        getString(body.twitterDescription) ||
        ogDescription ||
        metaDescription,
      twitterImage:
        getString(body.twitterImage) || ogImage || featuredImage,

      // Structured data
      schemaMarkup: body.schemaMarkup ?? null,

      // Extra SEO
      breadcrumbTitle: getString(body.breadcrumbTitle) || title,
      priority: getString(body.priority) || '0.5',
      changefreq: getString(body.changefreq) || 'weekly',

      // Redirect
      oldSlug: getString(body.oldSlug),

      // Meta and tags
      meta: metaData,
      tags,

      // Timestamps
      publishedAt,
      expiresAt: deadline,
    };

    const [newPost] = await db
      .insert(posts)
      .values(postData)
      .returning();

    if (!newPost) {
      return NextResponse.json(
        { success: false, error: 'Post could not be created' },
        { status: 500 }
      );
    }

    revalidatePostCache(newPost.type, newPost.slug);

    return NextResponse.json({
      success: true,
      post: newPost,
    });
  } catch (error) {
    console.error('Error creating post:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create post',
      },
      { status: 500 }
    );
  }
}
