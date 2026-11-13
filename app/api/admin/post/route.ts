
// app/api/admin/post/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { posts } from "@/db/schema";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
} from "drizzle-orm";
import { revalidatePostCache } from "@/lib/post-cache";
import jwt, {
  JsonWebTokenError,
  TokenExpiredError,
} from "jsonwebtoken";

type PostInsert = typeof posts.$inferInsert;

interface AuthenticatedUser {
  userId: number;
  userRole: string;
}

interface PostFilters {
  type?: string;
  status?: string;
  search?: string;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const MAX_BULK_DELETE = 500;

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

function unauthorizedResponse() {
  return jsonError("Unauthorized - Please login first", 401);
}

async function authenticateRequest(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
      return null;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured");
      return null;
    }

    const decoded: unknown = jwt.verify(token, secret);

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
      userRole:
        typeof decoded.role === "string" ? decoded.role : "",
    };
  } catch (error) {
    if (
      error instanceof TokenExpiredError ||
      error instanceof JsonWebTokenError
    ) {
      return null;
    }

    console.error("Admin post authentication error:", error);
    return null;
  }
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

  if (typeof value !== "string") {
    return null;
  }

  return value.trim();
}

function getNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

function validateOptionalStringFields(
  body: Record<string, unknown>,
  fields: readonly string[]
): string | null {
  for (const field of fields) {
    const value = body[field];

    if (
      value !== undefined &&
      value !== null &&
      typeof value !== "string"
    ) {
      return `${field} must be a string`;
    }
  }

  return null;
}

function validateBooleanFields(
  body: Record<string, unknown>,
  fields: readonly string[]
): string | null {
  for (const field of fields) {
    const value = body[field];

    if (value !== undefined && typeof value !== "boolean") {
      return `${field} must be a boolean`;
    }
  }

  return null;
}

function buildPostFilters(filters: PostFilters): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.type && filters.type !== "all") {
    conditions.push(eq(posts.type, filters.type));
  }

  if (filters.status) {
    conditions.push(eq(posts.status, filters.status));
  }

  if (filters.search) {
    const searchCondition = or(
      ilike(posts.title, `%${filters.search}%`),
      ilike(posts.slug, `%${filters.search}%`)
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

async function invalidatePostCache(
  type: string,
  slug: string
): Promise<void> {
  try {
    revalidatePostCache(type, slug);
  } catch (error) {
    console.error(
      `Post cache invalidation failed for ${slug}:`,
      error
    );
  }
}

function getSortColumn(sortField: string) {
  const sortableColumns = {
    title: posts.title,
    type: posts.type,
    status: posts.status,
    createdAt: posts.createdAt,
    publishedAt: posts.publishedAt,
    id: posts.id,
  } as const;

  return (
    sortableColumns[
      sortField as keyof typeof sortableColumns
    ] ?? posts.createdAt
  );
}

function validateCreateBody(
  body: Record<string, unknown>
): string | null {
  if (
    typeof body.slug !== "string" ||
    !body.slug.trim()
  ) {
    return "Slug is required";
  }

  if (
    typeof body.type !== "string" ||
    !body.type.trim()
  ) {
    return "Post type is required";
  }

  if (
    typeof body.title !== "string" ||
    !body.title.trim()
  ) {
    return "Title is required";
  }

  if (body.title.trim().length > 300) {
    return "Title cannot exceed 300 characters";
  }

  if (body.slug.trim().length > 300) {
    return "Slug cannot exceed 300 characters";
  }

  const stringError = validateOptionalStringFields(body, [
    "content",
    "excerpt",
    "featuredImage",
    "actualImage",
    "authorName",
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
    "focusKeywordDensity",
    "priority",
    "changefreq",
    "breadcrumbTitle",
    "oldSlug",
    "status",
  ]);

  if (stringError) {
    return stringError;
  }

  const booleanError = validateBooleanFields(body, [
    "isFeatured",
    "isPopular",
    "isBreaking",
  ]);

  if (booleanError) {
    return booleanError;
  }

  for (const field of ["readabilityScore", "seoScore"] as const) {
    if (body[field] !== undefined && body[field] !== null) {
      if (getNumber(body[field]) === null) {
        return `${field} must be a valid number`;
      }
    }
  }

  for (const field of [
    "publishedAt",
    "expiresAt",
    "lastSeoAnalysis",
  ] as const) {
    if (
      body[field] !== undefined &&
      body[field] !== null &&
      body[field] !== "" &&
      parseDate(body[field]) === null
    ) {
      return `${field} must be a valid date`;
    }
  }

  if (body.galleryImages !== undefined && body.galleryImages !== null) {
    const result = parseJsonValue(body.galleryImages);

    if (
      !result.success ||
      !Array.isArray(result.data) ||
      !result.data.every((item) => typeof item === "string")
    ) {
      return "galleryImages must be a valid array of strings";
    }
  }

  if (body.tags !== undefined && body.tags !== null) {
    const result = parseJsonValue(body.tags);

    if (
      !result.success ||
      !Array.isArray(result.data) ||
      !result.data.every((item) => typeof item === "string")
    ) {
      return "tags must be a valid array of strings";
    }
  }

  if (body.meta !== undefined && body.meta !== null) {
    const result = parseJsonValue(body.meta);

    if (!result.success || !isRecord(result.data)) {
      return "meta must be a valid JSON object";
    }
  }

  if (
    body.schemaMarkup !== undefined &&
    body.schemaMarkup !== null
  ) {
    const result = parseJsonValue(body.schemaMarkup);

    if (!result.success || !isRecord(result.data)) {
      return "schemaMarkup must be a valid JSON object";
    }
  }

  return null;
}

// ============================================
// GET: Fetch posts with database pagination
// ============================================

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);

  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const search = searchParams.get("search")?.trim().slice(0, 200) || "";

    const requestedLimit = Number(
      searchParams.get("limit") || DEFAULT_LIMIT
    );

    const requestedOffset = Number(
      searchParams.get("offset") || 0
    );

    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const offset = Number.isFinite(requestedOffset)
      ? Math.max(Math.floor(requestedOffset), 0)
      : 0;

    const sortField = searchParams.get("sort") || "createdAt";
    const sortOrder =
      searchParams.get("order") === "asc" ? "asc" : "desc";

    const filters = buildPostFilters({
      type,
      status,
      search,
    });

    const sortColumn = getSortColumn(sortField);
    const orderByClause =
      sortOrder === "asc"
        ? asc(sortColumn)
        : desc(sortColumn);

    const [paginatedPosts, countResult] = await Promise.all([
      db
        .select()
        .from(posts)
        .where(filters)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset),

      db
        .select({ total: count() })
        .from(posts)
        .where(filters),
    ]);

    const total = Number(countResult[0]?.total ?? 0);

    return NextResponse.json(
      {
        success: true,
        posts: paginatedPosts,
        total,
        limit,
        offset,
        sorting: {
          field: sortField,
          order: sortOrder,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching posts:", error);

    return jsonError("Failed to fetch posts", 500);
  }
}

// ============================================
// POST: Create new post
// ============================================

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);

  if (!auth) {
    return unauthorizedResponse();
  }

  const body = await parseRequestBody(request);

  if (!body) {
    return jsonError("Invalid JSON request body", 400);
  }

  const validationError = validateCreateBody(body);

  if (validationError) {
    return jsonError(validationError, 400);
  }

  try {
    const slug = (body.slug as string).trim();
    const title = (body.title as string).trim();
    const type = (body.type as string).trim();

    const galleryResult =
      body.galleryImages !== undefined
        ? parseJsonValue(body.galleryImages)
        : { success: true, data: null };

    const tagsResult =
      body.tags !== undefined
        ? parseJsonValue(body.tags)
        : { success: true, data: null };

    const metaResult =
      body.meta !== undefined
        ? parseJsonValue(body.meta)
        : { success: true, data: null };

    const schemaResult =
      body.schemaMarkup !== undefined
        ? parseJsonValue(body.schemaMarkup)
        : { success: true, data: null };

    if (
      !galleryResult.success ||
      !tagsResult.success ||
      !metaResult.success ||
      !schemaResult.success
    ) {
      return jsonError("Invalid JSON data provided", 400);
    }

    const publishedAt =
      body.publishedAt === undefined ||
      body.publishedAt === null ||
      body.publishedAt === ""
        ? new Date()
        : parseDate(body.publishedAt);

    const expiresAt =
      body.expiresAt === undefined ||
      body.expiresAt === null ||
      body.expiresAt === ""
        ? null
        : parseDate(body.expiresAt);

    const lastSeoAnalysis =
      body.lastSeoAnalysis === undefined ||
      body.lastSeoAnalysis === null ||
      body.lastSeoAnalysis === ""
        ? null
        : parseDate(body.lastSeoAnalysis);

    if (!publishedAt) {
      return jsonError("Invalid publishedAt date", 400);
    }

    const readabilityScore =
      body.readabilityScore === undefined
        ? null
        : getNumber(body.readabilityScore);

    const seoScore =
      body.seoScore === undefined
        ? null
        : getNumber(body.seoScore);

    const insertData: PostInsert = {
      slug,
      type,
      title,

      content: getString(body.content),
      excerpt: getString(body.excerpt),
      featuredImage: getString(body.featuredImage),
      actualImage: getString(body.actualImage),
      galleryImages:
        galleryResult.data as PostInsert["galleryImages"],
      authorName: getString(body.authorName),

      metaTitle: getString(body.metaTitle),
      metaDescription: getString(body.metaDescription),
      metaKeywords: getString(body.metaKeywords),
      focusKeyword: getString(body.focusKeyword),
      canonicalUrl: getString(body.canonicalUrl),
      robots: getString(body.robots) ?? "index, follow",

      ogTitle: getString(body.ogTitle),
      ogDescription: getString(body.ogDescription),
      ogImage: getString(body.ogImage),
      ogType: getString(body.ogType) ?? "article",

      twitterCard:
        getString(body.twitterCard) ?? "summary_large_image",
      twitterTitle: getString(body.twitterTitle),
      twitterDescription: getString(body.twitterDescription),
      twitterImage: getString(body.twitterImage),

      focusKeywordDensity: getString(body.focusKeywordDensity),
      readabilityScore,
      seoScore,
      lastSeoAnalysis:
        lastSeoAnalysis as PostInsert["lastSeoAnalysis"],

      priority: getString(body.priority) ?? "0.5",
      changefreq: getString(body.changefreq) ?? "weekly",

      breadcrumbTitle: getString(body.breadcrumbTitle) ?? title,
      oldSlug: getString(body.oldSlug),

      status: getString(body.status) ?? "draft",
      isFeatured:
        body.isFeatured === undefined ? false : body.isFeatured as boolean,
      isPopular:
        body.isPopular === undefined ? false : body.isPopular as boolean,
      isBreaking:
        body.isBreaking === undefined ? false : body.isBreaking as boolean,

      meta: metaResult.data as PostInsert["meta"],
      tags: tagsResult.data as PostInsert["tags"],
      schemaMarkup:
        schemaResult.data as PostInsert["schemaMarkup"],

      publishedAt:
        publishedAt as PostInsert["publishedAt"],
      expiresAt:
        expiresAt as PostInsert["expiresAt"],

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [newPost] = await db
      .insert(posts)
      .values(insertData)
      .returning();

    if (!newPost) {
      return jsonError("Failed to create post", 500);
    }

    await invalidatePostCache(newPost.type, newPost.slug);

    return NextResponse.json(
      {
        success: true,
        post: newPost,
        message: "Post created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating post:", error);

    if (getPostgresErrorCode(error) === "23505") {
      return jsonError("Slug already exists", 409);
    }

    return jsonError("Failed to create post", 500);
  }
}

// ============================================
// DELETE: Bulk archive posts
// ============================================

export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest(request);

  if (!auth) {
    return unauthorizedResponse();
  }

  const body = await parseRequestBody(request);

  if (!body) {
    return jsonError("Invalid JSON request body", 400);
  }

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return jsonError("No post IDs provided", 400);
  }

  if (body.ids.length > MAX_BULK_DELETE) {
    return jsonError(
      `You can archive a maximum of ${MAX_BULK_DELETE} posts at once`,
      400
    );
  }

  const numericIds = Array.from(
    new Set(
      body.ids
        .filter(
          (id): id is number | string =>
            typeof id === "number" || typeof id === "string"
        )
        .map((id) => Number(id))
        .filter(
          (id) => Number.isSafeInteger(id) && id > 0
        )
    )
  );

  if (numericIds.length === 0) {
    return jsonError("Invalid post IDs provided", 400);
  }

  try {
    const existingPosts = await db
      .select({
        id: posts.id,
        type: posts.type,
        slug: posts.slug,
      })
      .from(posts)
      .where(inArray(posts.id, numericIds));

    if (existingPosts.length === 0) {
      return jsonError("No matching posts found", 404);
    }

    const existingIds = existingPosts.map((post) => post.id);

    const archivedPosts = await db
      .update(posts)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(inArray(posts.id, existingIds))
      .returning({
        id: posts.id,
        type: posts.type,
        slug: posts.slug,
      });

    await Promise.all(
      archivedPosts.map((post) =>
        invalidatePostCache(post.type, post.slug)
      )
    );

    const successCount = archivedPosts.length;
    const failCount = numericIds.length - successCount;

    return NextResponse.json({
      success: true,
      message: `${successCount} post(s) archived successfully${
        failCount > 0 ? `, ${failCount} failed or not found` : ""
      }`,
      archivedCount: successCount,
      failedCount: failCount,
    });
  } catch (error) {
    console.error("Error archiving posts:", error);

    return jsonError("Failed to archive posts", 500);
  }
}
