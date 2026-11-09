// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { getRedirect } from "@/services/redirects/redirects-config";

// ============================================================
// ✅ PUBLIC PATHS — Sab auth pages yahan add hain
// ============================================================
const PUBLIC_PATHS = [
  // Generic
  "/login",
  "/maintenance",
  
  // Admin auth pages (public — login karne ke liye)
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
  
  // Institute auth pages (public — login/register ke liye)
  "/institute/login",
  "/institute/register",
  "/institute/forgot-password",
  "/institute/reset-password",
  
  // Auth APIs
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/register",
];

// ============================================================
// ✅ ROUTE PREFIXES
// ============================================================
const ADMIN_PREFIX = "/admin";
const ADMIN_API_PREFIX = "/api/admin";
const INSTITUTE_PREFIX = "/institute";
const INSTITUTE_API_PREFIX = "/api/institute";

// ============================================================
// ✅ QUERY HANDLING SKIP PATHS
// ============================================================
const SKIP_QUERY_HANDLING = [
  "/api",
  "/_next",
  "/admin",
  "/institute",
  "/login",
  "/maintenance",
  "/favicon.ico",
];

// ============================================================
// ✅ HELPER FUNCTIONS
// ============================================================

/**
 * Check if path is public (no auth required)
 * Uses exact match OR proper prefix match (path + "/")
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

/**
 * Check if path requires admin authentication
 * Excludes public admin pages (login, forgot-password)
 */
function isAdminPath(pathname: string): boolean {
  // Exempt public admin auth pages
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return false;
  }
  if (
    pathname === "/admin/forgot-password" ||
    pathname.startsWith("/admin/forgot-password/")
  ) {
    return false;
  }
  if (
    pathname === "/admin/reset-password" ||
    pathname.startsWith("/admin/reset-password/")
  ) {
    return false;
  }

  return (
    pathname.startsWith(ADMIN_PREFIX) ||
    pathname.startsWith(ADMIN_API_PREFIX)
  );
}

/**
 * Check if path requires institute authentication
 * Excludes public institute pages (login, register, forgot-password)
 */
function isInstitutePath(pathname: string): boolean {
  // Exempt public institute auth pages
  if (pathname === "/institute/login" || pathname.startsWith("/institute/login/")) {
    return false;
  }
  if (
    pathname === "/institute/register" ||
    pathname.startsWith("/institute/register/")
  ) {
    return false;
  }
  if (
    pathname === "/institute/forgot-password" ||
    pathname.startsWith("/institute/forgot-password/")
  ) {
    return false;
  }
  if (
    pathname === "/institute/reset-password" ||
    pathname.startsWith("/institute/reset-password/")
  ) {
    return false;
  }

  return (
    pathname.startsWith(INSTITUTE_PREFIX) ||
    pathname.startsWith(INSTITUTE_API_PREFIX)
  );
}

/**
 * Check if maintenance mode is enabled
 */
function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === "true";
}

/**
 * Verify JWT token
 */
function verifyToken(token: string): boolean {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return false;
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if user is authenticated via authToken cookie
 */
function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get("authToken")?.value;
  if (!token) return false;
  return verifyToken(token);
}

/**
 * Check if query param cleanup should be skipped
 */
function shouldSkipQueryHandling(pathname: string): boolean {
  return SKIP_QUERY_HANDLING.some((path) => pathname.startsWith(path));
}

// ============================================================
// ✅ MIDDLEWARE HANDLER
// ============================================================
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const searchParams = req.nextUrl.searchParams;

  // ============================================================
  // ✅ STEP 1: SEO Redirects (First priority)
  // ============================================================
  const seoRedirect = getRedirect(pathname);
  if (seoRedirect) {
    const url = new URL(seoRedirect.to, req.url);
    return NextResponse.redirect(url, seoRedirect.status);
  }

  // ============================================================
  // ✅ STEP 2: Query Parameter Cleanup
  // ============================================================
  if (!shouldSkipQueryHandling(pathname) && searchParams.size > 0) {
    const url = req.nextUrl.clone();
    url.search = "";
    return NextResponse.redirect(url, 301);
  }

  // ============================================================
  // ✅ STEP 3: Maintenance Mode Check
  // ============================================================
  if (isMaintenanceMode() && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/maintenance", req.url));
  }

  // ============================================================
  // ✅ STEP 4: Admin Authentication
  // ============================================================
  if (isAdminPath(pathname) && !isPublicPath(pathname)) {
    if (!isAuthenticated(req)) {
      // API route — return 401 JSON
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized",
            message: "Admin authentication required",
          },
          { status: 401 }
        );
      }

      // Page route — redirect to admin login
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ============================================================
  // ✅ STEP 5: Institute Authentication
  // ============================================================
  if (isInstitutePath(pathname) && !isPublicPath(pathname)) {
    if (!isAuthenticated(req)) {
      // API route — return 401 JSON
      if (pathname.startsWith("/api/institute")) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized",
            message: "Institute authentication required",
          },
          { status: 401 }
        );
      }

      // Page route — redirect to institute login
      const loginUrl = new URL("/institute/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ============================================================
  // ✅ All checks passed — continue
  // ============================================================
  return NextResponse.next();
}

// ============================================================
// ✅ MATCHER — Which routes middleware applies to
// ============================================================
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};