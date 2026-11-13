
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePostCache } from "@/lib/post-cache";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

type PostUpdate = Partial<typeof posts.$inferInsert>;

interface AuthenticatedUser {
  userId: number;
  userRole: string;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "Unauthorized - Please login first",
    },
    { status: 401 }
  );
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

async function isAuthenticated(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const authToken = request.cookies.get("authToken")?.value;

    if (!authToken) {
      return null;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured");
      return null;
    }

    const decoded: unknown = jwt.verify(authToken, secret);

    if (
      !isRecord(decoded) ||
      typeof decoded.id !== "number" ||
      !Number.isSafeInteger(decoded.id) ||
      decoded.id <= 0
    ) {
      return null;
    }

    return {
      userId: decoded.id,
      userRole: typeof decoded.role === "string" ? decoded.role : "",
    };
  } catch (error) {
    if (
      error instanceof TokenExpiredError ||
      error instanceof JsonWebTokenError
    ) {
      return null;
    }

    console.error("Post authentication error:", error);
    return null;
  }
}

async function getNumericId(
  context: RouteContext
): Promise<number | null> {
  try {
    const { id } = await context.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return null;
    }

    const numericId = Number(id);

    if (!Number.isSafeInteger(numericId)) {
      return null;
    }

    return numericId;
  } catch {
    return null;
  }
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getString(
  value: unknown,
  fallback: string | null = null
): string | null {
  if (value === undefined) {
    return fallback;
  }

  if (value === null || value === "") {
    return null;
  }

  return typeof value === "string" ? value.trim() : fallback;
}

function getBoolean(
  value: unknown,
  fallback: boolean | null
): boolean | null {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== "boolean") {
    return null;
  }

  return value;
}

function getNumber(value: unknown): number | null {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function parseJsonValue(value: unknown): {
  success: boolean;
  data: unknown;
} {
  if (typeof value !== "string") {
    return {
      success: true,
      data: value,
    };
  }

  try {
    return {
      success: true,
      data: JSON.parse(value) as unknown,
    };
  } catch {
    return {
      success: false,
      data: null,
    };
  }
}

function getPostgresErrorCode(error: unknown): string | null {
  if (!isRecord(error) || typeof error.code !== "string") {
    return null;
  }

  return error.code;
}

async function invalidatePostCache(
  slug: string,
  type: string
): Promise<void> {
  try {
    revalidatePostCache(type, slug);
  } catch (error) {
    console.error("Post cache invalidation error:", error);
  }
}

async function invalidateChangedPostCache(
  oldSlug: string,
  oldType: string,
  newSlug: string,
  newType: string
): Promise<void> {
  await invalidatePostCache(oldSlug, oldType);

  if (oldSlug !== newSlug || oldType !== newType) {
    await invalidatePostCache(newSlug, newType);
  }
}

async function findPost(id: number) {
  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  return post ?? null;
}

async function parseRequestBody(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();

    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

// ==========================================
// GET: Fetch Single Post
// ==========================================

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const auth = await isAuthenticated(request);

  if (!auth) {
    return unauthorizedResponse();
  }

  const numericId = await getNumericId(context);

  if (numericId === null) {
    return errorResponse("Invalid post ID", 400);
  }

  try {
    const post = await findPost(numericId);

    if (!post) {
      return errorResponse("Post not found", 404);
    }

    return NextResponse.json(
      {
        success: true,
        post,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET admin post error:", error);

    return errorResponse("Failed to fetch post", 500);
  }
}

// ==========================================
// PUT: Update Full Post
// ==========================================

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const auth = await isAuthenticated(request);

  if (!auth) {
    return unauthorizedResponse();
  }

  const numericId = await getNumericId(context);

  if (numericId === null) {
    return errorResponse("Invalid post ID", 400);
  }

  const body = await parseRequestBody(request);

  if (!body) {
    return errorResponse("Invalid JSON request body", 400);
  }

  if (typeof body.title !== "string" || !body.title.trim()) {
    return errorResponse("Title is required", 400);
  }

  if (body.title.trim().length > 300) {
    return errorResponse("Title cannot exceed 300 characters", 400);
  }

  try {
    const existing = await findPost(numericId);

    if (!existing) {
      return errorResponse("Post not found", 404);
    }

    const galleryResult =
      body.galleryImages !== undefined
        ? parseJsonValue(body.galleryImages)
        : { success: true, data: existing.galleryImages };

    if (!galleryResult.success) {
      return errorResponse("Invalid galleryImages JSON", 400);
    }

    const metaResult =
      body.meta !== undefined
        ? parseJsonValue(body.meta)
        : { success: true, data: existing.meta };

    if (!metaResult.success || !isRecord(metaResult.data)) {
      return errorResponse("Invalid meta data", 400);
    }

    const tagsResult =
      body.tags !== undefined
        ? parseJsonValue(body.tags)
        : { success: true, data: existing.tags };

    if (!tagsResult.success) {
      return errorResponse("Invalid tags JSON", 400);
    }

    const schemaResult =
      body.schemaMarkup !== undefined
        ? parseJsonValue(body.schemaMarkup)
        : { success: true, data: existing.schemaMarkup };

    if (!schemaResult.success) {
      return errorResponse("Invalid schema markup JSON", 400);
    }

    // Validate incoming boolean values separately.
    const booleanFields = [
      "isFeatured",
      "isPopular",
      "isBreaking",
    ] as const;

    for (const field of booleanFields) {
      if (
        body[field] !== undefined &&
        typeof body[field] !== "boolean"
      ) {
        return errorResponse(`${field} must be a boolean`, 400);
      }
    }

    // Existing database values may legitimately be null.
    const isFeatured = getBoolean(
      body.isFeatured,
      existing.isFeatured
    );

    const isPopular = getBoolean(
      body.isPopular,
      existing.isPopular
    );

    const isBreaking = getBoolean(
      body.isBreaking,
      existing.isBreaking
    );

    const title = body.title.trim();

    const slug = getString(body.slug, existing.slug);
    const type = getString(body.type, existing.type);
    const status = getString(body.status, existing.status);

    if (!slug || !type || !status) {
      return errorResponse("Slug, type and status are required", 400);
    }

    const publishedAt =
      body.publishedAt !== undefined
        ? body.publishedAt === null
          ? null
          : parseDate(body.publishedAt)
        : existing.publishedAt;

    if (
      body.publishedAt !== undefined &&
      body.publishedAt !== null &&
      publishedAt === null
    ) {
      return errorResponse("Invalid publishedAt date", 400);
    }

    const expiresAt =
      body.expiresAt !== undefined
        ? body.expiresAt === null || body.expiresAt === ""
          ? null
          : parseDate(body.expiresAt)
        : existing.expiresAt;

    if (
      body.expiresAt !== undefined &&
      body.expiresAt !== null &&
      body.expiresAt !== "" &&
      expiresAt === null
    ) {
      return errorResponse("Invalid expiresAt date", 400);
    }

    const lastSeoAnalysis =
      body.lastSeoAnalysis !== undefined
        ? body.lastSeoAnalysis === null || body.lastSeoAnalysis === ""
          ? null
          : parseDate(body.lastSeoAnalysis)
        : existing.lastSeoAnalysis;

    if (
      body.lastSeoAnalysis !== undefined &&
      body.lastSeoAnalysis !== null &&
      body.lastSeoAnalysis !== "" &&
      lastSeoAnalysis === null
    ) {
      return errorResponse("Invalid lastSeoAnalysis date", 400);
    }

    const readabilityScore =
      body.readabilityScore !== undefined
        ? getNumber(body.readabilityScore)
        : existing.readabilityScore;

    const seoScore =
      body.seoScore !== undefined
        ? getNumber(body.seoScore)
        : existing.seoScore;

    if (
      (body.readabilityScore !== undefined &&
        readabilityScore === null &&
        body.readabilityScore !== null &&
        body.readabilityScore !== "") ||
      (body.seoScore !== undefined &&
        seoScore === null &&
        body.seoScore !== null &&
        body.seoScore !== "")
    ) {
      return errorResponse("SEO scores must be valid numbers", 400);
    }

    const metaData: Record<string, unknown> = {
      ...metaResult.data,
      deadline:
        body.deadline !== undefined
          ? body.deadline
          : metaResult.data.deadline ?? null,
    };

    const updateData: PostUpdate = {
      title,
      slug,
      type,
      content: getString(body.content, existing.content),
      excerpt: getString(body.excerpt, existing.excerpt),
      authorName: getString(body.authorName, existing.authorName),

      featuredImage: getString(
        body.featuredImage,
        existing.featuredImage
      ),
      actualImage: getString(
        body.actualImage,
        existing.actualImage
      ),

      galleryImages:
        galleryResult.data as typeof posts.$inferInsert.galleryImages,

      status,
      isFeatured,
      isPopular,
      isBreaking,

      publishedAt:
        publishedAt as typeof posts.$inferInsert.publishedAt,

      expiresAt:
        expiresAt as typeof posts.$inferInsert.expiresAt,

      updatedAt: new Date(),

      meta: metaData as typeof posts.$inferInsert.meta,

      tags: tagsResult.data as typeof posts.$inferInsert.tags,

      metaTitle: getString(body.metaTitle, existing.metaTitle),
      metaDescription: getString(
        body.metaDescription,
        existing.metaDescription
      ),
      metaKeywords: getString(
        body.metaKeywords,
        existing.metaKeywords
      ),
      focusKeyword: getString(
        body.focusKeyword,
        existing.focusKeyword
      ),
      canonicalUrl: getString(
        body.canonicalUrl,
        existing.canonicalUrl
      ),
      robots: getString(body.robots, existing.robots) ?? "index, follow",

      ogTitle: getString(
        body.ogTitle,
        body.metaTitle !== undefined
          ? getString(body.metaTitle)
          : existing.ogTitle
      ),
      ogDescription: getString(
        body.ogDescription,
        body.metaDescription !== undefined
          ? getString(body.metaDescription)
          : existing.ogDescription
      ),
      ogImage: getString(
        body.ogImage,
        body.featuredImage !== undefined
          ? getString(body.featuredImage)
          : existing.ogImage
      ),
      ogType: getString(body.ogType, existing.ogType) ?? "article",

      twitterCard:
        getString(body.twitterCard, existing.twitterCard) ??
        "summary_large_image",

      twitterTitle: getString(
        body.twitterTitle,
        body.ogTitle !== undefined
          ? getString(body.ogTitle)
          : existing.twitterTitle
      ),
      twitterDescription: getString(
        body.twitterDescription,
        body.ogDescription !== undefined
          ? getString(body.ogDescription)
          : existing.twitterDescription
      ),
      twitterImage: getString(
        body.twitterImage,
        body.ogImage !== undefined
          ? getString(body.ogImage)
          : existing.twitterImage
      ),

      schemaMarkup:
        schemaResult.data as typeof posts.$inferInsert.schemaMarkup,

      focusKeywordDensity: getString(
        body.focusKeywordDensity,
        existing.focusKeywordDensity
      ),

      readabilityScore:
        readabilityScore as typeof posts.$inferInsert.readabilityScore,

      seoScore:
        seoScore as typeof posts.$inferInsert.seoScore,

      lastSeoAnalysis:
        lastSeoAnalysis as typeof posts.$inferInsert.lastSeoAnalysis,

      priority: getString(body.priority, existing.priority) ?? "0.5",
      changefreq:
        getString(body.changefreq, existing.changefreq) ?? "weekly",

      breadcrumbTitle:
        getString(body.breadcrumbTitle, existing.breadcrumbTitle) ??
        title,

      oldSlug: getString(body.oldSlug, existing.oldSlug),
    };

    const [updated] = await db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, numericId))
      .returning();

    if (!updated) {
      return errorResponse("Post not found", 404);
    }

    await invalidateChangedPostCache(
      existing.slug,
      existing.type,
      updated.slug,
      updated.type
    );

    return NextResponse.json({
      success: true,
      post: updated,
      message: "Post updated successfully",
    });
  } catch (error) {
    console.error("PUT admin post error:", error);

    if (getPostgresErrorCode(error) === "23505") {
      return errorResponse("Slug already exists", 409);
    }

    return errorResponse("Failed to update post", 500);
  }
}

// ==========================================
// PATCH: Partial Post Update
// ==========================================

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const auth = await isAuthenticated(request);

  if (!auth) {
    return unauthorizedResponse();
  }

  const numericId = await getNumericId(context);

  if (numericId === null) {
    return errorResponse("Invalid post ID", 400);
  }

  const body = await parseRequestBody(request);

  if (!body) {
    return errorResponse("Invalid JSON request body", 400);
  }

  try {
    const existing = await findPost(numericId);

    if (!existing) {
      return errorResponse("Post not found", 404);
    }

    const updateData: PostUpdate = {};

    // Basic information
    if (body.title !== undefined) {
      if (
        typeof body.title !== "string" ||
        !body.title.trim() ||
        body.title.trim().length > 300
      ) {
        return errorResponse("Invalid post title", 400);
      }

      updateData.title = body.title.trim();
    }

    if (body.slug !== undefined) {
      if (typeof body.slug !== "string" || !body.slug.trim()) {
        return errorResponse("Invalid slug", 400);
      }

      updateData.slug = body.slug.trim();
    }

    if (body.type !== undefined) {
      if (typeof body.type !== "string" || !body.type.trim()) {
        return errorResponse("Invalid post type", 400);
      }

      updateData.type = body.type.trim();
    }

    if (body.content !== undefined) {
      updateData.content = getString(body.content);
    }

    if (body.excerpt !== undefined) {
      updateData.excerpt = getString(body.excerpt);
    }

    if (body.authorName !== undefined) {
      updateData.authorName = getString(body.authorName);
    }

    // Media
    if (body.featuredImage !== undefined) {
      updateData.featuredImage = getString(body.featuredImage);
    }

    if (body.actualImage !== undefined) {
      updateData.actualImage = getString(body.actualImage);
    }

    if (body.galleryImages !== undefined) {
      const result = parseJsonValue(body.galleryImages);

      if (!result.success) {
        return errorResponse("Invalid galleryImages JSON", 400);
      }

      updateData.galleryImages =
        result.data as typeof posts.$inferInsert.galleryImages;
    }

    // Status
    if (body.status !== undefined) {
      if (typeof body.status !== "string" || !body.status.trim()) {
        return errorResponse("Invalid post status", 400);
      }

      updateData.status = body.status.trim();
    }

    // Boolean flags
    const booleanFields = [
      "isFeatured",
      "isPopular",
      "isBreaking",
    ] as const;

    for (const field of booleanFields) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== "boolean") {
          return errorResponse(`${field} must be a boolean`, 400);
        }

        updateData[field] = body[field];
      }
    }

    // Dates
    if (body.publishedAt !== undefined) {
      if (body.publishedAt === null || body.publishedAt === "") {
        return errorResponse("publishedAt cannot be empty", 400);
      }

      const date = parseDate(body.publishedAt);

      if (!date) {
        return errorResponse("Invalid publishedAt date", 400);
      }

      updateData.publishedAt =
        date as typeof posts.$inferInsert.publishedAt;
    }

    if (body.expiresAt !== undefined) {
      if (body.expiresAt === null || body.expiresAt === "") {
        updateData.expiresAt = null;
      } else {
        const date = parseDate(body.expiresAt);

        if (!date) {
          return errorResponse("Invalid expiresAt date", 400);
        }

        updateData.expiresAt =
          date as typeof posts.$inferInsert.expiresAt;
      }
    }

    if (body.lastSeoAnalysis !== undefined) {
      if (body.lastSeoAnalysis === null || body.lastSeoAnalysis === "") {
        updateData.lastSeoAnalysis = null;
      } else {
        const date = parseDate(body.lastSeoAnalysis);

        if (!date) {
          return errorResponse("Invalid lastSeoAnalysis date", 400);
        }

        updateData.lastSeoAnalysis =
          date as typeof posts.$inferInsert.lastSeoAnalysis;
      }
    }

    // Meta
    if (body.meta !== undefined || body.deadline !== undefined) {
      let metaData: Record<string, unknown> = {};

      if (body.meta !== undefined) {
        const result = parseJsonValue(body.meta);

        if (!result.success || !isRecord(result.data)) {
          return errorResponse("Invalid meta data", 400);
        }

        metaData = { ...result.data };
      } else if (isRecord(existing.meta)) {
        metaData = { ...existing.meta };
      }

      if (body.deadline !== undefined) {
        metaData.deadline = body.deadline;
      }

      updateData.meta =
        metaData as typeof posts.$inferInsert.meta;
    }

    if (body.tags !== undefined) {
      const result = parseJsonValue(body.tags);

      if (!result.success) {
        return errorResponse("Invalid tags JSON", 400);
      }

      updateData.tags =
        result.data as typeof posts.$inferInsert.tags;
    }

    // SEO metadata
    const stringFields = [
      "metaTitle",
      "metaDescription",
      "metaKeywords",
      "focusKeyword",
      "canonicalUrl",
      "robots",
      "ogTitle",
      "ogDescription",
      "ogImage",
      "ogType",
      "twitterCard",
      "twitterTitle",
      "twitterDescription",
      "twitterImage",
      "priority",
      "changefreq",
      "breadcrumbTitle",
      "oldSlug",
      "focusKeywordDensity",
    ] as const;

    for (const field of stringFields) {
      if (body[field] !== undefined) {
        const value = getString(body[field]);

        if (
          body[field] !== null &&
          body[field] !== "" &&
          value === null
        ) {
          return errorResponse(`${field} must be a string`, 400);
        }

        updateData[field] = value;
      }
    }

    // Structured data
    if (body.schemaMarkup !== undefined) {
      const result = parseJsonValue(body.schemaMarkup);

      if (!result.success) {
        return errorResponse("Invalid schema markup JSON", 400);
      }

      updateData.schemaMarkup =
        result.data as typeof posts.$inferInsert.schemaMarkup;
    }

    // SEO scores
    if (body.readabilityScore !== undefined) {
      const value = getNumber(body.readabilityScore);

      if (
        value === null &&
        body.readabilityScore !== null &&
        body.readabilityScore !== ""
      ) {
        return errorResponse("Invalid readability score", 400);
      }

      updateData.readabilityScore =
        value as typeof posts.$inferInsert.readabilityScore;
    }

    if (body.seoScore !== undefined) {
      const value = getNumber(body.seoScore);

      if (
        value === null &&
        body.seoScore !== null &&
        body.seoScore !== ""
      ) {
        return errorResponse("Invalid SEO score", 400);
      }

      updateData.seoScore =
        value as typeof posts.$inferInsert.seoScore;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No fields to update", 400);
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, numericId))
      .returning();

    if (!updated) {
      return errorResponse("Post not found", 404);
    }

    await invalidateChangedPostCache(
      existing.slug,
      existing.type,
      updated.slug,
      updated.type
    );

    return NextResponse.json({
      success: true,
      post: updated,
      message: "Post updated successfully",
    });
  } catch (error) {
    console.error("PATCH admin post error:", error);

    if (getPostgresErrorCode(error) === "23505") {
      return errorResponse("Slug already exists", 409);
    }

    return errorResponse("Failed to update post", 500);
  }
}

// ==========================================
// DELETE: Soft Delete / Archive Post
// ==========================================

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const auth = await isAuthenticated(request);

  if (!auth) {
    return unauthorizedResponse();
  }

  const numericId = await getNumericId(context);

  if (numericId === null) {
    return errorResponse("Invalid post ID", 400);
  }

  try {
    const existing = await findPost(numericId);

    if (!existing) {
      return errorResponse("Post not found", 404);
    }

    const [updated] = await db
      .update(posts)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(eq(posts.id, numericId))
      .returning();

    if (!updated) {
      return errorResponse("Post not found", 404);
    }

    await invalidateChangedPostCache(
      existing.slug,
      existing.type,
      updated.slug,
      updated.type
    );

    return NextResponse.json({
      success: true,
      message: "Post archived successfully",
    });
  } catch (error) {
    console.error("DELETE admin post error:", error);

    return errorResponse("Failed to archive post", 500);
  }
}
