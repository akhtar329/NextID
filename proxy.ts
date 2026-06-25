// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { getRedirect } from "@/services/redirects/redirects-config";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/maintenance",
];

const ADMIN_PREFIX = "/admin";
const ADMIN_API_PREFIX = "/api/admin";

const SKIP_QUERY_HANDLING = [
  "/api",
  "/_next",
  "/admin",
  "/login",
  "/maintenance",
  "/favicon.ico",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

function isAdminPath(pathname: string) {
  return (
    pathname.startsWith(ADMIN_PREFIX) ||
    pathname.startsWith(ADMIN_API_PREFIX)
  );
}

function isMaintenanceMode() {
  return process.env.MAINTENANCE_MODE === "true";
}

function verifyToken(token: string) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return false;

    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}

function isAuthenticated(req: NextRequest) {
  const token = req.cookies.get("authToken")?.value;
  if (!token) return false;

  return verifyToken(token);
}

function shouldSkipQueryHandling(pathname: string) {
  return SKIP_QUERY_HANDLING.some((path) => pathname.startsWith(path));
}

export default function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const searchParams = req.nextUrl.searchParams;

  // ============================================================
  // ✅ STEP 1: SEO Redirects FIRST (With query params)
  // ============================================================
  // ⚠️ IMPORTANT: Check redirects WITH query params first
  const seoRedirect = getRedirect(pathname);
  if (seoRedirect) {
    const url = new URL(seoRedirect.to, req.url);
    console.log(`🔄 SEO Redirect: ${pathname}${search} → ${seoRedirect.to}`);
    return NextResponse.redirect(url, seoRedirect.status);
  }

  // ============================================================
  // ✅ STEP 2: Query Parameter Cleanup (Now only if no redirect)
  // ============================================================
  if (!shouldSkipQueryHandling(pathname) && searchParams.size > 0) {
    const url = req.nextUrl.clone();
    url.search = "";
    console.log(`🧹 Removing query params: ${pathname}${search} → ${pathname}`);
    return NextResponse.redirect(url, 301);
  }

  // ============================================================
  // ✅ STEP 3: Maintenance Mode
  // ============================================================
  if (isMaintenanceMode() && !isPublicPath(pathname)) {
    return NextResponse.redirect(
      new URL("/maintenance", req.url)
    );
  }

  // ============================================================
  // ✅ STEP 4: Admin Authentication
  // ============================================================
  if (isAdminPath(pathname) && !isPublicPath(pathname)) {
    if (!isAuthenticated(req)) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized",
          },
          {
            status: 401,
          }
        );
      }

      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);

      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};