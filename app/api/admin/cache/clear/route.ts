
// app/api/admin/cache/clear/route.ts

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  getPostCacheTags,
  type CachedPostType,
} from "@/lib/post-cache";

interface CacheClearBody {
  groupId?: string;
  groupName?: string;
  tags?: string[];
}

const POST_TYPES: CachedPostType[] = [
  "admission",
  "result",
  "news",
  "date_sheet",
  "scholarship",
  "job",
  "blog",
];

const ALLOWED_GROUPS = [
  "all",
  "admissions",
  "results",
  "news",
  "date-sheets",
  "scholarships",
  "jobs",
  "homepage",
] as const;

const ALLOWED_GROUP_SET = new Set<string>(ALLOWED_GROUPS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getTagsForGroup(groupId: string): string[] {
  switch (groupId) {
    case "all":
      return POST_TYPES.flatMap((type) => getPostCacheTags(type));

    case "admissions":
      return getPostCacheTags("admission");

    case "results":
      return getPostCacheTags("result");

    case "news":
      return getPostCacheTags("news");

    case "date-sheets":
      return getPostCacheTags("date_sheet");

    case "scholarships":
      return getPostCacheTags("scholarship");

    case "jobs":
      return getPostCacheTags("job");

    case "homepage":
      return getPostCacheTags();

    default:
      return [];
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body",
        },
        { status: 400 }
      );
    }

    if (!isRecord(body)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
        },
        { status: 400 }
      );
    }

    const requestBody = body as CacheClearBody;

    const groupId =
      typeof requestBody.groupId === "string"
        ? requestBody.groupId
        : "homepage";

    if (!ALLOWED_GROUP_SET.has(groupId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid cache group",
        },
        { status: 400 }
      );
    }

    if (
      requestBody.groupName !== undefined &&
      typeof requestBody.groupName !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid group name",
        },
        { status: 400 }
      );
    }

    if (
      requestBody.tags !== undefined &&
      !Array.isArray(requestBody.tags)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Tags must be an array",
        },
        { status: 400 }
      );
    }

    const requestedTags: string[] = [];

    if (Array.isArray(requestBody.tags)) {
      for (const tag of requestBody.tags) {
        if (
          typeof tag !== "string" ||
          tag.length === 0 ||
          tag.length > 256 ||
          !/^[a-zA-Z0-9:_-]+$/.test(tag)
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "One or more cache tags are invalid",
            },
            { status: 400 }
          );
        }

        requestedTags.push(tag);
      }
    }

    // Get tags for the selected group.
    const groupTags = getTagsForGroup(groupId);

    // Add additional validated tags and remove duplicates.
    const tagsToClear = Array.from(
      new Set([...groupTags, ...requestedTags])
    );

    if (tagsToClear.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No cache tags found to clear",
        },
        { status: 400 }
      );
    }

    const failedTags: string[] = [];

    // Revalidate cache tags.
    for (const tag of tagsToClear) {
      try {
        revalidateTag(tag, "default");
      } catch (error) {
        failedTags.push(tag);
        console.error(`Failed to revalidate cache tag: ${tag}`, error);
      }
    }

    if (failedTags.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Some cache tags could not be cleared",
          clearedTags: tagsToClear.filter(
            (tag) => !failedTags.includes(tag)
          ),
          failedTags,
        },
        { status: 500 }
      );
    }

    const groupName =
      typeof requestBody.groupName === "string" &&
      requestBody.groupName.trim()
        ? requestBody.groupName.trim()
        : "Cache";

    return NextResponse.json({
      success: true,
      message: `${groupName} cleared successfully!`,
      clearedTags: tagsToClear,
    });
  } catch (error) {
    console.error("Cache clear error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear cache",
      },
      { status: 500 }
    );
  }
}
