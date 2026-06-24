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

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const seoRedirect = getRedirect(pathname);

  if (seoRedirect) {
    return NextResponse.redirect(
      new URL(seoRedirect.to, req.url),
      seoRedirect.status
    );
  }

  if (isMaintenanceMode() && !isPublicPath(pathname)) {
    return NextResponse.redirect(
      new URL("/maintenance", req.url)
    );
  }

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
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};