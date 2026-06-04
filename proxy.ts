// proxy.ts (project root mein)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRedirect } from '@/services/redirects-config';
import jwt from 'jsonwebtoken';

// Paths that should NEVER redirect (always accessible)
const ALLOWED_PATHS = [
  '/maintenance',
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
  '/api/auth/login',
  '/login',
];

// Admin routes that require authentication
const ADMIN_ROUTES = [
  '/admin',
  '/api/admin',
];

// Public admin routes (no auth needed - like login page)
const PUBLIC_ADMIN_ROUTES = [
  '/login',
  '/api/auth/login',
];

function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === 'true';
}

function isAllowedPath(pathname: string): boolean {
  if (pathname.startsWith('/api')) {
    return true;
  }
  return ALLOWED_PATHS.some(path => pathname.startsWith(path));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

function isPublicAdminRoute(pathname: string): boolean {
  return PUBLIC_ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

// ✅ Verify JWT token
function verifyAuthToken(token: string): boolean {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET not set');
      return false;
    }
    
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}

// ✅ Check if user is authenticated via cookie
function isAuthenticated(request: NextRequest): boolean {
  const authToken = request.cookies.get('authToken')?.value;
  
  if (!authToken) {
    console.log('🔒 No auth token found');
    return false;
  }
  
  const isValid = verifyAuthToken(authToken);
  
  if (!isValid) {
    console.log('🔒 Invalid auth token');
  } else {
    console.log('✅ Valid auth token found');
  }
  
  return isValid;
}

// ✅ Main middleware function
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // FIRST: Check for SEO redirects
  const redirect = getRedirect(pathname);
  if (redirect) {
    const url = new URL(redirect.to, request.url);
    return NextResponse.redirect(url, { status: redirect.status });
  }
  
  // ✅ CHECK: Admin route authentication
  if (isAdminRoute(pathname) && !isPublicAdminRoute(pathname)) {
    if (!isAuthenticated(request)) {
      console.log(`🔒 Unauthorized access to ${pathname}, redirecting to login`);
      
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { success: false, error: 'Authentication required. Please login.' },
          { status: 401 }
        );
      }
      
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    console.log(`✅ Authenticated access to ${pathname}`);
  }
  
  if (isAllowedPath(pathname)) {
    return NextResponse.next();
  }
  
  if (isMaintenanceMode()) {
    const maintenanceUrl = new URL('/maintenance', request.url);
    return NextResponse.redirect(maintenanceUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};