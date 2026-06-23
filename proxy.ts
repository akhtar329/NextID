// proxy.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { getRedirect } from "@/services/redirects/redirects-config"; // ✅ IMPORT ADDED

// =====================
// CONFIG
// =====================

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/maintenance",
];

const ADMIN_PREFIX = "/admin";
const ADMIN_API_PREFIX = "/api/admin";

// =====================
// HELPERS
// =====================

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

function isAdminPath(pathname: string) {
  return pathname.startsWith(ADMIN_PREFIX) || pathname.startsWith(ADMIN_API_PREFIX);
}

function isMaintenanceMode() {
  return process.env.MAINTENANCE_MODE === "true";
}

// =====================
// AUTH CHECK
// =====================

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

// =====================
// MIDDLEWARE
// =====================

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // =====================
  // 1. SEO REDIRECTS (From Separate File)
  // =====================
  const seoRedirect = getRedirect(pathname);
  if (seoRedirect) {
    console.log(`🔄 SEO Redirect: ${pathname} → ${seoRedirect.to}`);
    return NextResponse.redirect(new URL(seoRedirect.to, req.url), {
      status: seoRedirect.status,
    });
  }

  // =====================
  // 2. MAINTENANCE MODE
  // =====================
  if (isMaintenanceMode() && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/maintenance", req.url));
  }

  // =====================
  // 3. ADMIN PROTECTION
  // =====================
  if (isAdminPath(pathname) && !isPublicPath(pathname)) {
    if (!isAuthenticated(req)) {
      // API request
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Page request
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // =====================
  // 4. ALLOW REQUEST
  // =====================
  return NextResponse.next();
}

// =====================
// MATCHER
// =====================

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};