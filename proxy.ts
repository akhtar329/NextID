// proxy.ts (at root level)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRedirect } from './app/lib/redirects-config';

// Paths that should NEVER redirect (always accessible)
const ALLOWED_PATHS = [
  '/maintenance',
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
  '/api/auth/login',
  '/api/admin',
  '/admin',
];

function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === 'true';
}

function isAllowedPath(pathname: string): boolean {
  // Admin paths should never redirect
  if (pathname.startsWith('/admin')) {
    return true;
  }
  // API paths should never redirect
  if (pathname.startsWith('/api')) {
    return true;
  }
  return ALLOWED_PATHS.some(path => pathname.startsWith(path));
}

// ✅ FIX: Use default export (not named export)
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // FIRST: Check for SEO redirects (before maintenance)
  const redirect = getRedirect(pathname);
  if (redirect) {
    console.log(`Redirect: ${redirect.from} → ${redirect.to} (${redirect.status})`);
    const url = new URL(redirect.to, request.url);
    return NextResponse.redirect(url, { status: redirect.status });
  }
  
  // Allow admin and allowed paths
  if (isAllowedPath(pathname)) {
    return NextResponse.next();
  }
  
  // Check if maintenance mode is enabled
  if (isMaintenanceMode()) {
    const maintenanceUrl = new URL('/maintenance', request.url);
    return NextResponse.redirect(maintenanceUrl);
  }
  
  return NextResponse.next();
}

// ✅ Keep config export (this is allowed)
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};