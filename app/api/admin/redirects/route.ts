
import { NextRequest, NextResponse } from "next/server";
import jwt, {
  JsonWebTokenError,
  TokenExpiredError,
} from "jsonwebtoken";

import {
  getRedirects,
  saveRedirects,
  addRedirect,
  deleteRedirect,
  updateRedirect,
  resetRedirects,
  syncRedirects,
  DEFAULT_REDIRECTS,
  type RedirectRule,
} from "@/services/redirects/redirects-config";

interface AuthenticatedUser {
  id: number;
}

interface RedirectInput {
  from: string;
  to: string;
  status: 301 | 302;
}

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

function authenticateRequest(
  request: NextRequest
): AuthenticatedUser | null {
  const token = request.cookies.get("authToken")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return null;
  }

  try {
    const decoded: unknown = jwt.verify(token, secret);

    if (
      !isRecord(decoded) ||
      typeof decoded.id !== "number" ||
      !Number.isSafeInteger(decoded.id) ||
      decoded.id <= 0
    ) {
      return null;
    }

    return { id: decoded.id };
  } catch (error) {
    if (
      error instanceof JsonWebTokenError ||
      error instanceof TokenExpiredError
    ) {
      return null;
    }

    console.error("Redirect authentication error:", error);
    return null;
  }
}

async function parseBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function validateRedirect(value: unknown): RedirectInput | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.from !== "string" ||
    typeof value.to !== "string"
  ) {
    return null;
  }

  const from = value.from.trim();
  const to = value.to.trim();

  if (
    !from ||
    !to ||
    from.length > 2048 ||
    to.length > 2048
  ) {
    return null;
  }

  if (
    !from.startsWith("/") ||
    !to.startsWith("/") ||
    from.startsWith("//") ||
    to.startsWith("//")
  ) {
    return null;
  }

  if (from === to) {
    return null;
  }

  let status: 301 | 302 = 301;

  if (value.status !== undefined) {
    if (
      typeof value.status !== "number" ||
      (value.status !== 301 && value.status !== 302)
    ) {
      return null;
    }

    status = value.status;
  }

  return {
    from,
    to,
    status,
  };
}

function validateRedirectList(
  value: unknown
): RedirectRule[] | null {
  if (!Array.isArray(value) || value.length > 5000) {
    return null;
  }

  const redirects: RedirectRule[] = [];
  const seenPaths = new Set<string>();

  for (const item of value) {
    const redirect = validateRedirect(item);

    if (!redirect) {
      return null;
    }

    if (seenPaths.has(redirect.from)) {
      return null;
    }

    seenPaths.add(redirect.from);

    redirects.push({
      from: redirect.from,
      to: redirect.to,
      status: redirect.status,
    });
  }

  return redirects;
}

function unauthorizedResponse() {
  return jsonError("Unauthorized - Please login first", 401);
}

// GET: Fetch all redirects
export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const redirects = getRedirects();

    return NextResponse.json({
      success: true,
      data: redirects,
      count: redirects.length,
      defaults: DEFAULT_REDIRECTS,
      defaultCount: DEFAULT_REDIRECTS.length,
    });
  } catch (error) {
    console.error("GET redirects error:", error);

    return NextResponse.json(
      {
        success: false,
        data: [],
        error: "Failed to fetch redirects",
      },
      { status: 500 }
    );
  }
}

// POST: Add, save, reset or sync redirects
export async function POST(request: NextRequest) {
  try {
    const user = authenticateRequest(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const body = await parseBody(request);

    if (body === null) {
      return jsonError("Invalid JSON request body", 400);
    }

    // Reset redirects to defaults
    if (isRecord(body) && body.action === "reset") {
      resetRedirects();

      const redirects = getRedirects();

      return NextResponse.json({
        success: true,
        message: `Redirects reset to ${DEFAULT_REDIRECTS.length} defaults`,
        data: redirects,
      });
    }

    // Sync redirects with defaults
    if (isRecord(body) && body.action === "sync") {
      syncRedirects();

      const redirects = getRedirects();

      return NextResponse.json({
        success: true,
        message: "Redirects synced with defaults",
        data: redirects,
      });
    }

    // Add a single redirect
    if (
      isRecord(body) &&
      body.from !== undefined &&
      body.to !== undefined
    ) {
      const redirect = validateRedirect(body);

      if (!redirect) {
        return jsonError(
          "Invalid redirect. Use valid internal paths and status 301 or 302.",
          400
        );
      }

      addRedirect({
        from: redirect.from,
        to: redirect.to,
        status: redirect.status,
      });

      return NextResponse.json({
        success: true,
        message: `Redirect added: ${redirect.from} → ${redirect.to}`,
        data: getRedirects(),
      });
    }

    // Save an array of redirects
    if (Array.isArray(body)) {
      const redirects = validateRedirectList(body);

      if (!redirects) {
        return jsonError("Invalid redirects list", 400);
      }

      saveRedirects(redirects);

      return NextResponse.json({
        success: true,
        message: `${redirects.length} redirects saved`,
        count: redirects.length,
        data: getRedirects(),
      });
    }

    // Save redirects using { redirects: [] }
    if (isRecord(body) && Array.isArray(body.redirects)) {
      const redirects = validateRedirectList(body.redirects);

      if (!redirects) {
        return jsonError("Invalid redirects list", 400);
      }

      saveRedirects(redirects);

      return NextResponse.json({
        success: true,
        message: `${redirects.length} redirects saved`,
        count: redirects.length,
        data: getRedirects(),
      });
    }

    return jsonError("Invalid request format", 400);
  } catch (error) {
    console.error("POST redirects error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Failed to save redirects",
      500
    );
  }
}

// PUT: Update an existing redirect
export async function PUT(request: NextRequest) {
  try {
    const user = authenticateRequest(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const body = await parseBody(request);

    if (!isRecord(body)) {
      return jsonError("Invalid JSON request body", 400);
    }

    const oldFrom =
      typeof body.oldFrom === "string"
        ? body.oldFrom.trim()
        : "";

    if (!oldFrom || !body.redirect) {
      return jsonError(
        '"oldFrom" and "redirect" are required',
        400
      );
    }

    const redirect = validateRedirect(body.redirect);

    if (!redirect) {
      return jsonError(
        'Invalid redirect. "from" and "to" must be valid internal paths.',
        400
      );
    }

    updateRedirect(oldFrom, {
      from: redirect.from,
      to: redirect.to,
      status: redirect.status,
    });

    return NextResponse.json({
      success: true,
      message: `Redirect updated: ${oldFrom} → ${redirect.from}`,
      data: getRedirects(),
    });
  } catch (error) {
    console.error("PUT redirects error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Failed to update redirect",
      500
    );
  }
}

// DELETE: Remove a redirect
export async function DELETE(request: NextRequest) {
  try {
    const user = authenticateRequest(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const from = request.nextUrl.searchParams.get("from")?.trim();

    if (!from) {
      return jsonError('"from" parameter is required', 400);
    }

    if (
      from.length > 2048 ||
      !from.startsWith("/") ||
      from.startsWith("//")
    ) {
      return jsonError("Invalid redirect source path", 400);
    }

    deleteRedirect(from);

    return NextResponse.json({
      success: true,
      message: `Redirect "${from}" deleted`,
      data: getRedirects(),
    });
  } catch (error) {
    console.error("DELETE redirects error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Failed to delete redirect",
      500
    );
  }
}
